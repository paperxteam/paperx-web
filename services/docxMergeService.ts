import JSZip from 'jszip';
import mammoth from 'mammoth';
import { 
  Document as DocxDoc, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  PageBreak, 
  Footer, 
  PageNumber, 
  AlignmentType,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  WidthType
} from 'docx';
import { DocxMergeOptions } from '../types';

// Helper to read file as ArrayBuffer
const readFileAsArrayBuffer = (file: File | Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// Clean XML string helper
const escapeXml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export const DocxMergeService = {
  /**
   * Main entry point to merge multiple Word DOCX documents with customizable options
   */
  async mergeDocxFiles(
    files: File[],
    updateStatus?: (status: string, progress: number) => void,
    userOptions?: DocxMergeOptions
  ): Promise<{ blob: Blob; filename: string; isPdf: boolean }> {
    if (!files || files.length === 0) {
      throw new Error("No Word documents provided for merging.");
    }

    const options: Required<DocxMergeOptions> = {
      pageBreakBetween: userOptions?.pageBreakBetween !== false,
      outputFormat: userOptions?.outputFormat || 'docx',
      addSectionTitles: userOptions?.addSectionTitles ?? false,
      generateToc: userOptions?.generateToc ?? false,
      continuousPageNumbers: userOptions?.continuousPageNumbers !== false,
      normalizeTypography: userOptions?.normalizeTypography ?? false
    };

    const notify = (msg: string, pct: number) => {
      if (updateStatus) updateStatus(msg, pct);
    };

    notify(`Initializing DOCX merge engine for ${files.length} document(s)...`, 10);

    // If only 1 file is passed, either return it or convert it if PDF requested
    if (files.length === 1 && options.outputFormat === 'docx' && !options.generateToc) {
      notify("Document ready!", 100);
      return {
        blob: files[0],
        filename: files[0].name.replace(/\.[^/.]+$/, "") + "_merged.docx",
        isPdf: false
      };
    }

    let mergedBlob: Blob;

    try {
      if (options.normalizeTypography) {
        // Fallback/Normalized Mammoth engine
        notify("Merging documents with normalized formatting...", 25);
        mergedBlob = await this.mergeViaMammoth(files, options, notify);
      } else {
        // High-Fidelity OpenXML ZIP Engine
        notify("Executing high-fidelity OpenXML merge...", 25);
        mergedBlob = await this.mergeViaOpenXml(files, options, notify);
      }
    } catch (err: any) {
      console.warn("OpenXML merge failed, falling back to structured document reconstruction:", err);
      notify("Rebuilding document structure via semantic engine...", 50);
      mergedBlob = await this.mergeViaMammoth(files, options, notify);
    }

    // Handle PDF output conversion if requested
    if (options.outputFormat === 'pdf') {
      notify("Converting merged Word document to PDF...", 85);
      const pdfBlob = await this.convertDocxToPdf(mergedBlob, files[0].name, notify);
      const outputName = `Merged_Document_${Date.now()}.pdf`;
      notify("Merged PDF ready!", 100);
      return {
        blob: pdfBlob,
        filename: outputName,
        isPdf: true
      };
    }

    const outputName = `Merged_Documents_${Date.now()}.docx`;
    notify("DOCX merge complete!", 100);
    return {
      blob: mergedBlob,
      filename: outputName,
      isPdf: false
    };
  },

  /**
   * High-Fidelity OpenXML Merging Engine
   * Direct ZIP manipulation preserving styles, layouts, images, tables, and headers
   */
  async mergeViaOpenXml(
    files: File[],
    options: Required<DocxMergeOptions>,
    notify: (msg: string, pct: number) => void
  ): Promise<Blob> {
    notify("Loading primary base document...", 20);
    const firstBuffer = await readFileAsArrayBuffer(files[0]);
    const baseZip = await JSZip.loadAsync(firstBuffer);

    let baseDocXml = await baseZip.file('word/document.xml')?.async('text');
    if (!baseDocXml) {
      throw new Error("Invalid DOCX format: missing word/document.xml");
    }

    // Extract base body
    const baseBodyMatch = baseDocXml.match(/<w:body>([\s\S]*?)<\/w:body>/);
    if (!baseBodyMatch) {
      throw new Error("Invalid DOCX format: missing w:body in primary document");
    }

    let currentBody = baseBodyMatch[1];
    
    // Extract trailing sectPr from the base document to preserve page geometry
    const sectPrMatch = currentBody.match(/<w:sectPr[\s\S]*?<\/w:sectPr>$/);
    const trailingSectPr = sectPrMatch ? sectPrMatch[0] : '<w:sectPr/>';
    currentBody = currentBody.replace(/<w:sectPr[\s\S]*?<\/w:sectPr>$/, '');

    // 1. Table of Contents if requested
    if (options.generateToc) {
      let tocXml = '<w:p><w:pPr><w:jc w:val="center"/><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>Table of Contents</w:t></w:r></w:p>';
      tocXml += '<w:p><w:pPr><w:spacing w:after="200"/></w:pPr></w:p>';

      files.forEach((f, idx) => {
        const cleanName = escapeXml(f.name.replace(/\.[^/.]+$/, ""));
        tocXml += `<w:p><w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9072"/></w:tabs><w:spacing w:after="120"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>${idx + 1}. ${cleanName}</w:t></w:r><w:r><w:tab/><w:rPr><w:color w:val="666666"/></w:rPr><w:t>Document ${idx + 1}</w:t></w:r></w:p>`;
      });

      // Page break after TOC
      tocXml += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      currentBody = tocXml + currentBody;
    }

    // 2. Prepend First Document Title if requested
    if (options.addSectionTitles) {
      const file1Title = escapeXml(files[0].name.replace(/\.[^/.]+$/, ""));
      const titleXml = `<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:after="240"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1E293B"/></w:rPr><w:t>${file1Title}</w:t></w:r></w:p>`;
      currentBody = titleXml + currentBody;
    }

    // Read base relationships
    let baseRelsXml = '';
    const baseRelsFile = baseZip.file('word/_rels/document.xml.rels');
    if (baseRelsFile) {
      baseRelsXml = await baseRelsFile.async('text');
    }

    // Process subsequent documents
    for (let i = 1; i < files.length; i++) {
      const file = files[i];
      const progress = Math.round(30 + ((i / files.length) * 45));
      notify(`Merging file ${i + 1} of ${files.length}: ${file.name}...`, progress);

      const buf = await readFileAsArrayBuffer(file);
      const subZip = await JSZip.loadAsync(buf);

      const subDocXml = await subZip.file('word/document.xml')?.async('text');
      if (!subDocXml) continue;

      const subBodyMatch = subDocXml.match(/<w:body>([\s\S]*?)<\/w:body>/);
      if (!subBodyMatch) continue;

      let subBody = subBodyMatch[1].replace(/<w:sectPr[\s\S]*?<\/w:sectPr>$/, '');

      // Relationship and Media Remapping to prevent ID collisions
      const relOffset = i * 1000;
      const subRelsFile = subZip.file('word/_rels/document.xml.rels');
      
      if (subRelsFile && baseRelsXml) {
        let subRelsXml = await subRelsFile.async('text');

        // Extract each Relationship
        const relRegex = /<Relationship\s+([^>]+?)\/>/g;
        let match;
        const newRelsToAdd: string[] = [];

        while ((match = relRegex.exec(subRelsXml)) !== null) {
          const attrStr = match[1];
          const idMatch = attrStr.match(/Id="rId(\d+)"/);
          const targetMatch = attrStr.match(/Target="([^"]+)"/);
          const typeMatch = attrStr.match(/Type="([^"]+)"/);

          if (idMatch && targetMatch && typeMatch) {
            const origIdNum = parseInt(idMatch[1], 10);
            const newId = `rId${relOffset + origIdNum}`;
            let target = targetMatch[1];
            const type = typeMatch[1];

            // If it's a media reference, copy the media file over with unique name
            if (target.startsWith('media/') || target.startsWith('../media/')) {
              const cleanTargetPath = target.replace(/^\.\.\//, 'word/');
              const actualZipPath = cleanTargetPath.startsWith('word/') ? cleanTargetPath : `word/${cleanTargetPath}`;
              const mediaFile = subZip.file(actualZipPath);

              if (mediaFile) {
                const mediaData = await mediaFile.async('arraybuffer');
                const fileExt = target.split('.').pop() || 'png';
                const newMediaName = `media/merged_f${i}_r${origIdNum}.${fileExt}`;
                baseZip.file(`word/${newMediaName}`, mediaData);
                target = newMediaName;
              }
            }

            // Remap references in subBody
            const oldIdPattern = new RegExp(`r:(embed|id)="rId${origIdNum}"`, 'g');
            subBody = subBody.replace(oldIdPattern, `r:$1="${newId}"`);

            newRelsToAdd.push(`<Relationship Id="${newId}" Type="${type}" Target="${target}"/>`);
          }
        }

        if (newRelsToAdd.length > 0) {
          baseRelsXml = baseRelsXml.replace('</Relationships>', newRelsToAdd.join('') + '</Relationships>');
        }
      }

      // Add page break if enabled
      if (options.pageBreakBetween) {
        currentBody += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      } else {
        currentBody += '<w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>';
      }

      // Add Section Title if enabled
      if (options.addSectionTitles) {
        const fileTitle = escapeXml(file.name.replace(/\.[^/.]+$/, ""));
        currentBody += `<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:after="240"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1E293B"/></w:rPr><w:t>${fileTitle}</w:t></w:r></w:p>`;
      }

      // Append document content
      currentBody += subBody;
    }

    // Update base relationships if modified
    if (baseRelsXml) {
      baseZip.file('word/_rels/document.xml.rels', baseRelsXml);
    }

    // 3. Continuous Page Numbers in Footer if requested
    let finalSectPr = trailingSectPr;
    if (options.continuousPageNumbers) {
      // Invalidate existing footer references or ensure default footer
      const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="18"/><w:color w:val="71717A"/></w:rPr><w:t xml:space="preserve">Page </w:t></w:r>
    <w:fldSimple w:instr="PAGE"><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="71717A"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>
    <w:r><w:rPr><w:sz w:val="18"/><w:color w:val="71717A"/></w:rPr><w:t xml:space="preserve"> of </w:t></w:r>
    <w:fldSimple w:instr="NUMPAGES"><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="71717A"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>
  </w:p>
</w:ftr>`;
      baseZip.file('word/footer_paperx.xml', footerXml);

      // Register in [Content_Types].xml
      const ctFile = baseZip.file('[Content_Types].xml');
      if (ctFile) {
        let ctXml = await ctFile.async('text');
        if (!ctXml.includes('footer_paperx.xml')) {
          ctXml = ctXml.replace('</Types>', '<Override PartName="/word/footer_paperx.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>');
          baseZip.file('[Content_Types].xml', ctXml);
        }
      }

      // Register relationship in document.xml.rels
      if (baseRelsXml && !baseRelsXml.includes('rIdPaperXFooter')) {
        baseRelsXml = baseRelsXml.replace('</Relationships>', '<Relationship Id="rIdPaperXFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer_paperx.xml"/></Relationships>');
        baseZip.file('word/_rels/document.xml.rels', baseRelsXml);
      }

      // Add footerReference to sectPr
      if (!finalSectPr.includes('footerReference')) {
        finalSectPr = finalSectPr.replace(/<w:sectPr([^>]*)>/, '<w:sectPr$1><w:footerReference w:type="default" r:id="rIdPaperXFooter"/>');
      }
    }

    // Reconstruct final word/document.xml
    currentBody += finalSectPr;
    const finalDocXml = baseDocXml.replace(/<w:body>[\s\S]*?<\/w:body>/, `<w:body>${currentBody}</w:body>`);
    baseZip.file('word/document.xml', finalDocXml);

    notify("Packaging merged OpenXML DOCX archive...", 80);
    const outputBuffer = await baseZip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    return outputBuffer;
  },

  /**
   * Semantic Fallback Engine: Uses mammoth to parse structures and docx library to generate clean documents
   */
  async mergeViaMammoth(
    files: File[],
    options: Required<DocxMergeOptions>,
    notify: (msg: string, pct: number) => void
  ): Promise<Blob> {
    const docChildren: any[] = [];

    // Table of contents
    if (options.generateToc) {
      docChildren.push(
        new Paragraph({
          text: "Table of Contents",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        })
      );

      files.forEach((f, idx) => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${idx + 1}. ${f.name.replace(/\.[^/.]+$/, "")}`, bold: true, size: 22 }),
              new TextRun({ text: ` — Document ${idx + 1}`, color: "666666", size: 20 })
            ],
            spacing: { after: 120 }
          })
        );
      });

      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      notify(`Reading content from "${file.name}"...`, 30 + Math.round((i / files.length) * 45));

      const buf = await readFileAsArrayBuffer(file);
      
      // Page break between documents
      if (i > 0 && options.pageBreakBetween) {
        docChildren.push(new Paragraph({ children: [new PageBreak()] }));
      }

      // Add section title
      if (options.addSectionTitles || (i > 0 && !options.pageBreakBetween)) {
        docChildren.push(
          new Paragraph({
            text: file.name.replace(/\.[^/.]+$/, ""),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 200 }
          })
        );
      }

      try {
        const { value: rawText } = await mammoth.extractRawText({ arrayBuffer: buf });
        const lines = rawText.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length === 0) continue;

          docChildren.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed, size: 22 })],
              spacing: { after: 120 }
            })
          );
        }
      } catch (e) {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: `[Content from ${file.name}]`, italics: true })]
          })
        );
      }
    }

    notify("Building unified DOCX package...", 80);

    const docSections: any[] = [{
      properties: {},
      children: docChildren
    }];

    if (options.continuousPageNumbers) {
      docSections[0].footers = {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Page ", size: 18, color: "71717A" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "71717A" }),
                new TextRun({ text: " of ", size: 18, color: "71717A" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "71717A" })
              ]
            })
          ]
        })
      };
    }

    const doc = new DocxDoc({
      sections: docSections
    });

    const docBuffer = await Packer.toBlob(doc);
    return docBuffer;
  },

  /**
   * Convert DOCX Blob to PDF via backend server route
   */
  async convertDocxToPdf(
    docxBlob: Blob,
    originalName: string,
    notify: (msg: string, pct: number) => void
  ): Promise<Blob> {
    notify("Preparing PDF conversion...", 88);

    const base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(docxBlob);
    });

    notify("Generating PDF document...", 92);

    const response = await fetch('/api/ai/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileBase64: base64String,
        filename: originalName.replace(/\.[^/.]+$/, "") + ".docx",
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        toolId: 'word-to-pdf'
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to convert merged DOCX to PDF format.");
    }

    return await response.blob();
  }
};
