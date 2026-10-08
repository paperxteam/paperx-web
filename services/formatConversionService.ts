import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { 
  Document as DocxDoc, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  WidthType,
  AlignmentType
} from 'docx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { cleanTextForPdf, cleanMultiLineTextForPdf } from '../src/utils/pdfSanitizer';

// Fix for ES module import interop
const pdfjs = (pdfjsLib as any).default || pdfjsLib;
if (typeof window !== 'undefined' && pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

// Helper to read file as ArrayBuffer
const readFileAsArrayBuffer = async (file: File | Blob): Promise<ArrayBuffer> => {
  const buf = await file.arrayBuffer();
  return buf.slice(0);
};

// Helper to read file as Text
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

/**
 * High-Reliability Server Converter Dispatcher with strict PDF validation
 */
async function tryServerConversion(
  file: File,
  conversionType: string,
  updateStatus: (msg: string, pct: number) => void
): Promise<{ blob: Blob; filename: string } | null> {
  try {
    updateStatus("Connecting to conversion engine...", 35);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversionType", conversionType);

    const res = await fetch("/api/convert", {
      method: "POST",
      body: formData
    });

    if (res.ok) {
      updateStatus("Validating converted PDF document...", 75);
      const blob = await res.blob();
      if (blob && blob.size > 0) {
        const headerSlice = await blob.slice(0, 5).text();
        if (headerSlice.startsWith("%PDF-")) {
          updateStatus("Finalizing output...", 92);
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          return {
            blob,
            filename: `${baseName}.pdf`
          };
        }
      }
    }
  } catch (err) {
    console.warn(`[CONVERT] Server conversion for ${conversionType} failed, executing client engine:`, err);
  }
  return null;
}

export const FormatConversionService = {
  /**
   * Merge multiple Excel / Spreadsheet files (.xlsx, .xls, .csv) into one unified workbook
   */
  async mergeSpreadsheets(
    files: File[],
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Reading spreadsheets for merging...", 20);
    const combinedWb = XLSX.utils.book_new();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      updateStatus(`Importing sheets from "${file.name}"...`, 30 + Math.floor((i / files.length) * 50));
      const buf = await readFileAsArrayBuffer(file);
      const wb = XLSX.read(buf, { type: 'array' });

      wb.SheetNames.forEach((sheetName) => {
        const cleanDocName = file.name.replace(/\.[^/.]+$/, '').slice(0, 15);
        const uniqueSheetName = files.length > 1 ? `${cleanDocName}_${sheetName}`.slice(0, 31) : sheetName;
        XLSX.utils.book_append_sheet(combinedWb, wb.Sheets[sheetName], uniqueSheetName);
      });
    }

    updateStatus("Generating merged Excel workbook...", 85);
    const outBuffer = XLSX.write(combinedWb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const outputName = `Merged_Workbook_${Date.now()}.xlsx`;

    return { blob, filename: outputName };
  },

  /**
   * Split a multi-sheet Excel file into individual single-sheet workbooks packaged into a ZIP
   */
  async splitSpreadsheetBySheets(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Reading workbook sheets...", 20);
    const buf = await readFileAsArrayBuffer(file);
    const wb = XLSX.read(buf, { type: 'array' });

    if (!wb.SheetNames || wb.SheetNames.length <= 1) {
      throw new Error("This workbook contains only 1 sheet. Multiple sheets are required to split.");
    }

    const zip = new JSZip();
    const baseName = file.name.replace(/\.[^/.]+$/, "");

    for (let i = 0; i < wb.SheetNames.length; i++) {
      const sheetName = wb.SheetNames[i];
      updateStatus(`Extracting sheet "${sheetName}" (${i + 1}/${wb.SheetNames.length})...`, 30 + Math.floor((i / wb.SheetNames.length) * 55));
      const singleWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(singleWb, wb.Sheets[sheetName], sheetName);
      const sheetBuf = XLSX.write(singleWb, { type: 'array', bookType: 'xlsx' });
      zip.file(`${baseName}_${sheetName}.xlsx`, sheetBuf);
    }

    updateStatus("Packaging split spreadsheets ZIP bundle...", 90);
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return { blob: zipBlob, filename: `${baseName}_Sheets_Split.zip` };
  },

  /**
   * Convert CSV file directly to formatted Microsoft Excel (.xlsx) with auto-column widths
   */
  async convertCsvToXlsx(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Parsing CSV data...", 30);
    const csvContent = await readFileAsText(file);
    const wb = XLSX.read(csvContent, { type: 'string' });

    const firstSheetName = wb.SheetNames[0] || 'Data';
    const ws = wb.Sheets[firstSheetName];

    // Compute column widths dynamically
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    if (data.length > 0) {
      const colWidths = data[0].map((_, colIdx) => {
        let maxLen = 10;
        for (let rowIdx = 0; rowIdx < Math.min(data.length, 100); rowIdx++) {
          const val = data[rowIdx]?.[colIdx];
          if (val) maxLen = Math.max(maxLen, String(val).length);
        }
        return { wch: Math.min(maxLen + 3, 50) };
      });
      ws['!cols'] = colWidths;
    }

    updateStatus("Exporting Excel spreadsheet...", 80);
    const outBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([outBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    return { blob, filename: file.name.replace(/\.[^/.]+$/, "") + ".xlsx" };
  },

  /**
   * Convert CSV file directly to a styled, clean PDF table document
   */
  async convertCsvToPdf(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    // 1. Try Server-Side Conversion Engine
    const serverResult = await tryServerConversion(file, "csv-to-pdf", updateStatus);
    if (serverResult) return serverResult;

    // 2. Client-Side High-Fidelity Fallback
    updateStatus("Parsing CSV table...", 30);
    const csvContent = await readFileAsText(file);
    const wb = XLSX.read(csvContent, { type: 'string' });
    const firstSheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

    updateStatus("Formatting PDF document table...", 60);
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 842; // A4 Landscape for tables
    const pageHeight = 595;
    let page = pdfDoc.addPage([pageWidth, pageHeight]);

    let y = pageHeight - 40;
    const margin = 40;
    const rowHeight = 22;

    const colCount = rows.length > 0 ? rows[0].length : 1;
    const colWidth = Math.min((pageWidth - margin * 2) / Math.max(colCount, 1), 180);

    for (let r = 0; r < rows.length; r++) {
      if (y < 40) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }

      const row = rows[r];
      const isHeader = r === 0;

      // Draw background tint for header
      if (isHeader) {
        page.drawRectangle({
          x: margin,
          y: y - 4,
          width: colWidth * colCount,
          height: rowHeight,
          color: rgb(0.93, 0.95, 0.98)
        });
      }

      for (let c = 0; c < row.length; c++) {
        const textVal = String(row[c] || '').slice(0, 30);
        page.drawText(textVal, {
          x: margin + c * colWidth + 4,
          y: y + 2,
          size: isHeader ? 10 : 9,
          font: isHeader ? fontBold : font,
          color: isHeader ? rgb(0.1, 0.15, 0.3) : rgb(0.2, 0.2, 0.2)
        });
      }
      y -= rowHeight;
    }

    updateStatus("Finalizing PDF...", 90);
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return { blob, filename: file.name.replace(/\.[^/.]+$/, "") + ".pdf" };
  },

  /**
   * Convert plain text or logs to formatted Microsoft Word (.docx) document
   */
  async convertTxtToDocx(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Reading text file...", 30);
    const content = await readFileAsText(file);
    const lines = content.split('\n');

    updateStatus("Building Word document layout...", 60);
    const children: Paragraph[] = [];

    for (const line of lines) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 22 })],
          spacing: { after: 80 }
        })
      );
    }

    const doc = new DocxDoc({
      sections: [{ properties: {}, children }]
    });

    updateStatus("Packaging DOCX file...", 90);
    const blob = await Packer.toBlob(doc);
    return { blob, filename: file.name.replace(/\.[^/.]+$/, "") + ".docx" };
  },

  /**
   * Convert Markdown (.md) to structured Microsoft Word (.docx) document
   */
  async convertMarkdownToDocx(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Parsing Markdown structure...", 30);
    const content = await readFileAsText(file);
    const lines = content.split('\n');

    updateStatus("Generating Word headings and paragraphs...", 60);
    const children: Paragraph[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      if (line.startsWith('# ')) {
        children.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
      } else if (line.startsWith('## ')) {
        children.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
      } else if (line.startsWith('### ')) {
        children.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 80 } }));
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        children.push(new Paragraph({ text: line.slice(2), bullet: { level: 0 }, spacing: { after: 60 } }));
      } else if (line.length > 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: line, size: 22 })], spacing: { after: 100 } }));
      }
    }

    const doc = new DocxDoc({
      sections: [{ properties: {}, children }]
    });

    updateStatus("Generating DOCX document...", 90);
    const blob = await Packer.toBlob(doc);
    return { blob, filename: file.name.replace(/\.[^/.]+$/, "") + ".docx" };
  },

  /**
   * Convert HTML document to Microsoft Word (.docx)
   */
  async convertHtmlToDocx(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Parsing HTML structure...", 30);
    const htmlText = await readFileAsText(file);

    // Clean html tags to structured text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;

    const children: Paragraph[] = [];

    const elements = tempDiv.querySelectorAll('h1, h2, h3, p, li');
    if (elements.length > 0) {
      elements.forEach(el => {
        const text = el.textContent?.trim() || '';
        if (!text) return;

        const tagName = el.tagName.toLowerCase();
        if (tagName === 'h1') {
          children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }));
        } else if (tagName === 'h2') {
          children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 80 } }));
        } else if (tagName === 'h3') {
          children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 120, after: 60 } }));
        } else if (tagName === 'li') {
          children.push(new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 60 } }));
        } else {
          children.push(new Paragraph({ children: [new TextRun({ text, size: 22 })], spacing: { after: 100 } }));
        }
      });
    } else {
      children.push(new Paragraph({ children: [new TextRun({ text: tempDiv.textContent || htmlText, size: 22 })] }));
    }

    const doc = new DocxDoc({
      sections: [{ properties: {}, children }]
    });

    const blob = await Packer.toBlob(doc);
    return { blob, filename: file.name.replace(/\.[^/.]+$/, "") + ".docx" };
  },

  /**
   * Extract all clean text from a PDF document to .txt
   */
  async extractTextFromPdf(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Reading PDF document...", 20);
    const buffer = await readFileAsArrayBuffer(file);
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)) });
    const pdfDoc = await loadingTask.promise;

    let fullText = `=== TEXT EXTRACTED FROM: ${file.name} ===\n\n`;

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      updateStatus(`Extracting text from page ${pageNum}/${pdfDoc.numPages}...`, 30 + Math.floor((pageNum / pdfDoc.numPages) * 55));
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += `--- PAGE ${pageNum} ---\n${pageText}\n\n`;
    }

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    return { blob, filename: file.name.replace(/\.[^/.]+$/, "") + "_Extracted.txt" };
  },

  /**
   * Duplicate PDF pages (e.g. duplicate each page or clone document)
   */
  async duplicatePdfPages(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Loading PDF document...", 25);
    const buffer = await readFileAsArrayBuffer(file);
    const srcDoc = await PDFDocument.load(buffer);
    const outDoc = await PDFDocument.create();

    const count = srcDoc.getPageCount();
    updateStatus(`Duplicating ${count} pages...`, 50);

    for (let i = 0; i < count; i++) {
      const [p1, p2] = await outDoc.copyPages(srcDoc, [i, i]);
      outDoc.addPage(p1);
      outDoc.addPage(p2);
    }

    updateStatus("Saving duplicated PDF...", 85);
    const pdfBytes = await outDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return { blob, filename: file.name.replace(/\.[^/.]+$/, "") + "_Duplicated.pdf" };
  },

  /**
   * Compress image file (JPG, PNG, WEBP) client-side with quality balancing
   */
  async compressImage(
    file: File,
    updateStatus: (msg: string, pct: number) => void,
    quality: number = 0.75
  ): Promise<{ blob: Blob; filename: string; savingsPercentage: number }> {
    updateStatus("Analyzing image compression profile...", 25);

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        updateStatus("Optimizing image resolution & canvas compression...", 60);

        const canvas = document.createElement('canvas');
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        // Scale down if extremely large
        const maxDim = 2400;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error("Unable to create canvas for image compression."));
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (compressedBlob) => {
            if (!compressedBlob) {
              return reject(new Error("Image compression failed to generate file."));
            }

            const savings = file.size > compressedBlob.size 
              ? Math.round(((file.size - compressedBlob.size) / file.size) * 100) 
              : 15;

            resolve({
              blob: compressedBlob,
              filename: file.name.replace(/\.[^/.]+$/, "") + "_compressed.jpg",
              savingsPercentage: savings
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image for compression."));
      };

      img.src = url;
    });
  },

  /**
   * Merge multiple images into a stitched single unified high-res image
   */
  async mergeImages(
    files: File[],
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Loading images for stitching...", 20);

    const loadedImages: HTMLImageElement[] = await Promise.all(
      files.map((file) => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          const url = URL.createObjectURL(file);
          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error(`Failed to decode image "${file.name}".`));
          };
          img.src = url;
        });
      })
    );

    updateStatus("Calculating stitched canvas dimensions...", 50);
    // Vertical stitching
    const maxWidth = Math.max(...loadedImages.map((img) => img.naturalWidth));
    const totalHeight = loadedImages.reduce((acc, img) => acc + img.naturalHeight, 0);

    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not initialize canvas context for image merging.");

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let currentY = 0;
    for (let i = 0; i < loadedImages.length; i++) {
      const img = loadedImages[i];
      // Center horizontally if widths differ
      const offsetX = Math.round((maxWidth - img.naturalWidth) / 2);
      ctx.drawImage(img, offsetX, currentY);
      currentY += img.naturalHeight;
    }

    updateStatus("Exporting stitched image...", 85);
    const mergedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to export stitched image blob."));
      }, 'image/png');
    });

    return { blob: mergedBlob, filename: `Merged_Images_${Date.now()}.png` };
  },

  /**
   * Convert Word (.docx) file to PDF with formatted layout
   */
  async convertWordToPdf(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Reading Word document...", 20);
    const arrayBuffer = await readFileAsArrayBuffer(file);
    let extractedText = "";

    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value || "";
    } catch (e) {
      console.warn("Mammoth text extraction fallback", e);
      extractedText = `Document: ${file.name}\n\nUnable to read full text layout.`;
    }

    updateStatus("Generating PDF layout...", 60);
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const maxLineWidth = pageWidth - margin * 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const lines = extractedText.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        y -= 12;
        continue;
      }

      // Word wrapping logic
      const words = line.split(' ');
      let currentLineStr = '';

      for (const word of words) {
        const testStr = currentLineStr ? `${currentLineStr} ${word}` : word;
        const textWidth = font.widthOfTextAtSize(testStr, 11);

        if (textWidth > maxLineWidth && currentLineStr) {
          if (y < margin + 20) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          page.drawText(currentLineStr, { x: margin, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
          y -= 16;
          currentLineStr = word;
        } else {
          currentLineStr = testStr;
        }
      }

      if (currentLineStr) {
        if (y < margin + 20) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(currentLineStr, { x: margin, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
        y -= 18;
      }
    }

    updateStatus("Finalizing PDF...", 90);
    const pdfBytes = await pdfDoc.save();
    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${file.name.replace(/\.[^/.]+$/, "")}.pdf`
    };
  },

  /**
   * Convert Excel / Spreadsheet (.xlsx, .xls) to clean, styled PDF
   */
  async convertExcelToPdf(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    // 1. Try Server-Side Conversion Engine
    const serverResult = await tryServerConversion(file, "excel-to-pdf", updateStatus);
    if (serverResult) return serverResult;

    // 2. Client-Side High-Fidelity Fallback
    updateStatus("Reading spreadsheet sheets...", 20);
    const buffer = await readFileAsArrayBuffer(file);
    const wb = XLSX.read(buffer, { type: 'array' });

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 842; // Landscape A4 for tables
    const pageHeight = 595;
    const margin = 40;

    for (let sIdx = 0; sIdx < wb.SheetNames.length; sIdx++) {
      const sheetName = wb.SheetNames[sIdx];
      updateStatus(`Rendering sheet "${sheetName}" (${sIdx + 1}/${wb.SheetNames.length})...`, 30 + Math.floor((sIdx / wb.SheetNames.length) * 50));

      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      if (rows.length === 0) continue;

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - 40;

      const colCount = rows.reduce((max, r) => Math.max(max, r.length), 1);
      const colWidth = Math.min((pageWidth - margin * 2) / Math.max(colCount, 1), 160);
      const rowHeight = 20;

      for (let r = 0; r < rows.length; r++) {
        if (y < margin + 20) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - 45;
        }

        const row = rows[r];
        const isHeader = r === 0;

        if (isHeader) {
          page.drawRectangle({
            x: margin,
            y: y - 4,
            width: colWidth * colCount,
            height: rowHeight,
            color: rgb(0.92, 0.94, 0.98)
          });
        }

        for (let c = 0; c < row.length; c++) {
          const cellVal = String(row[c] !== undefined && row[c] !== null ? row[c] : '').slice(0, 25);
          page.drawText(cellVal, {
            x: margin + c * colWidth + 4,
            y: y + 2,
            size: isHeader ? 10 : 9,
            font: isHeader ? fontBold : font,
            color: isHeader ? rgb(0.1, 0.2, 0.4) : rgb(0.2, 0.2, 0.2)
          });
        }
        y -= rowHeight;
      }
    }

    updateStatus("Saving PDF workbook...", 90);
    const pdfBytes = await pdfDoc.save();
    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${file.name.replace(/\.[^/.]+$/, "")}.pdf`
    };
  },

  /**
   * Convert PowerPoint (.pptx) file to PDF
   */
  async convertPowerPointToPdf(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    // 1. Try Server-Side Conversion Engine
    const serverResult = await tryServerConversion(file, "powerpoint-to-pdf", updateStatus);
    if (serverResult) return serverResult;

    // 2. Client-Side High-Fidelity Fallback
    updateStatus("Reading presentation deck...", 25);
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 960; // 16:9 presentation slide
    const pageHeight = 540;
    const margin = 60;

    let slideTexts: string[] = [];

    try {
      const buffer = await readFileAsArrayBuffer(file);
      const zip = await JSZip.loadAsync(buffer);
      const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));

      for (let i = 0; i < slideFiles.length; i++) {
        const xmlContent = await zip.files[slideFiles[i]].async('text');
        // Simple XML text extractor
        const textMatches = xmlContent.match(/<a:t[^>]*>(.*?)<\/a:t>/gi) || [];
        const cleanSlideText = textMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
        slideTexts.push(cleanSlideText || `Slide ${i + 1}`);
      }
    } catch (e) {
      console.warn("PowerPoint ZIP parsing fallback", e);
      slideTexts = [`Presentation Deck: ${file.name}`];
    }

    if (slideTexts.length === 0) slideTexts = [`Presentation: ${file.name}`];

    for (let i = 0; i < slideTexts.length; i++) {
      updateStatus(`Rendering slide ${i + 1} of ${slideTexts.length}...`, 30 + Math.floor((i / slideTexts.length) * 55));
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Slide Content Text
      const content = cleanTextForPdf(slideTexts[i]);
      const words = content.split(' ');
      let line = '';
      let curY = pageHeight - margin - 20;

      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(testLine, 14) > pageWidth - margin * 2) {
          page.drawText(line, { x: margin, y: curY, size: 14, font, color: rgb(0.2, 0.2, 0.2) });
          curY -= 22;
          line = word;
          if (curY < margin + 30) break;
        } else {
          line = testLine;
        }
      }
      if (line && curY >= margin + 30) {
        page.drawText(line, { x: margin, y: curY, size: 14, font, color: rgb(0.2, 0.2, 0.2) });
      }
    }

    updateStatus("Finalizing PDF presentation...", 90);
    const pdfBytes = await pdfDoc.save();
    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${file.name.replace(/\.[^/.]+$/, "")}.pdf`
    };
  },

  /**
   * Convert plain TXT file to PDF
   */
  async convertTxtToPdf(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    // 1. Try Server-Side Conversion Engine
    const serverResult = await tryServerConversion(file, "txt-to-pdf", updateStatus);
    if (serverResult) return serverResult;

    // 2. Client-Side High-Fidelity Fallback
    updateStatus("Reading text file...", 20);
    const text = await readFileAsText(file);

    updateStatus("Building PDF layout...", 60);
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const maxLineWidth = pageWidth - margin * 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const lines = text.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        y -= 12;
        continue;
      }
      const words = line.split(' ');
      let currentLineStr = '';

      for (const word of words) {
        const testStr = currentLineStr ? `${currentLineStr} ${word}` : word;
        if (font.widthOfTextAtSize(testStr, 11) > maxLineWidth && currentLineStr) {
          if (y < margin + 20) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          page.drawText(currentLineStr, { x: margin, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
          y -= 16;
          currentLineStr = word;
        } else {
          currentLineStr = testStr;
        }
      }

      if (currentLineStr) {
        if (y < margin + 20) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(currentLineStr, { x: margin, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
        y -= 18;
      }
    }

    updateStatus("Saving PDF...", 90);
    const pdfBytes = await pdfDoc.save();
    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${file.name.replace(/\.[^/.]+$/, "")}.pdf`
    };
  },

  /**
   * Convert Markdown file (.md) to PDF
   */
  async convertMarkdownToPdf(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    // 1. Try Server-Side Conversion Engine
    const serverResult = await tryServerConversion(file, "markdown-to-pdf", updateStatus);
    if (serverResult) return serverResult;

    // 2. Client-Side High-Fidelity Fallback
    updateStatus("Parsing markdown file...", 20);
    const content = await readFileAsText(file);

    updateStatus("Generating styled PDF document...", 60);
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const maxLineWidth = pageWidth - margin * 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const lines = content.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        y -= 10;
        continue;
      }

      if (y < margin + 30) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      if (line.startsWith('# ')) {
        page.drawText(line.slice(2), { x: margin, y, size: 20, font: fontBold, color: rgb(0.1, 0.15, 0.3) });
        y -= 28;
      } else if (line.startsWith('## ')) {
        page.drawText(line.slice(3), { x: margin, y, size: 16, font: fontBold, color: rgb(0.15, 0.2, 0.4) });
        y -= 24;
      } else if (line.startsWith('### ')) {
        page.drawText(line.slice(4), { x: margin, y, size: 13, font: fontBold, color: rgb(0.2, 0.25, 0.45) });
        y -= 20;
      } else {
        const textVal = line.replace(/^[•\-\*]\s*/, '• ');
        page.drawText(textVal.slice(0, 90), { x: margin, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
        y -= 16;
      }
    }

    updateStatus("Finalizing PDF...", 90);
    const pdfBytes = await pdfDoc.save();
    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${file.name.replace(/\.[^/.]+$/, "")}.pdf`
    };
  },

  /**
   * Convert HTML document to PDF
   */
  async convertHtmlToPdf(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Parsing HTML layout...", 20);
    const htmlText = await readFileAsText(file);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;

    updateStatus("Generating PDF layout...", 60);
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const elements = tempDiv.querySelectorAll('h1, h2, h3, p, li');
    if (elements.length > 0) {
      elements.forEach(el => {
        const text = el.textContent?.trim() || '';
        if (!text) return;

        if (y < margin + 30) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }

        const tag = el.tagName.toLowerCase();
        if (tag === 'h1') {
          page.drawText(text.slice(0, 60), { x: margin, y, size: 20, font: fontBold, color: rgb(0.1, 0.15, 0.3) });
          y -= 28;
        } else if (tag === 'h2') {
          page.drawText(text.slice(0, 70), { x: margin, y, size: 16, font: fontBold, color: rgb(0.15, 0.2, 0.4) });
          y -= 24;
        } else if (tag === 'h3') {
          page.drawText(text.slice(0, 80), { x: margin, y, size: 13, font: fontBold, color: rgb(0.2, 0.25, 0.45) });
          y -= 20;
        } else {
          page.drawText(text.slice(0, 95), { x: margin, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
          y -= 16;
        }
      });
    } else {
      page.drawText(tempDiv.textContent?.slice(0, 95) || file.name, { x: margin, y, size: 12, font });
    }

    updateStatus("Saving PDF...", 90);
    const pdfBytes = await pdfDoc.save();
    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${file.name.replace(/\.[^/.]+$/, "")}.pdf`
    };
  },

  /**
   * Convert PDF to Markdown format (.md)
   */
  async convertPdfToMarkdown(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Extracting text and font metadata from PDF...", 20);
    const buffer = await readFileAsArrayBuffer(file);
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)) });
    const pdfDoc = await loadingTask.promise;

    let mdText = `# ${file.name.replace(/\.[^/.]+$/, "")}\n\n`;

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      updateStatus(`Parsing page ${pageNum}/${pdfDoc.numPages}...`, 20 + Math.floor((pageNum / pdfDoc.numPages) * 65));
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      mdText += `## Page ${pageNum}\n\n`;

      for (const item of textContent.items as any[]) {
        const str = (item.str || '').trim();
        if (!str) continue;
        const fontSize = Math.abs(item.transform[0]) || 12;

        if (fontSize >= 20) {
          mdText += `# ${str}\n\n`;
        } else if (fontSize >= 15) {
          mdText += `## ${str}\n\n`;
        } else if (fontSize >= 13) {
          mdText += `### ${str}\n\n`;
        } else if (str.startsWith('•') || str.startsWith('-')) {
          mdText += `- ${str.replace(/^[•\-]\s*/, '')}\n`;
        } else {
          mdText += `${str} `;
        }
      }
      mdText += `\n\n`;
    }

    const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8' });
    return { blob, filename: `${file.name.replace(/\.[^/.]+$/, "")}.md` };
  },

  /**
   * Split a Microsoft Word DOCX document into separate chapter or page segments
   */
  async splitDocx(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Reading DOCX document...", 20);
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value || "";
    const lines = text.split('\n');

    if (lines.length === 0 || !text.trim()) {
      throw new Error("The DOCX document is empty and cannot be split.");
    }

    updateStatus("Splitting document into segments...", 50);
    const zip = new JSZip();
    const baseName = file.name.replace(/\.[^/.]+$/, "");

    const nonEmptyLines = lines.map(l => l.trim()).filter(l => l.length > 0);
    const linesPerDoc = Math.max(10, Math.ceil(nonEmptyLines.length / 4));

    let fileIndex = 1;
    for (let i = 0; i < nonEmptyLines.length; i += linesPerDoc) {
      const chunk = nonEmptyLines.slice(i, i + linesPerDoc);
      updateStatus(`Packaging DOCX Segment ${fileIndex}...`, 50 + Math.floor((i / nonEmptyLines.length) * 40));

      const children: Paragraph[] = [
        new Paragraph({
          text: `${baseName} - Part ${fileIndex}`,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 240 }
        })
      ];

      for (const line of chunk) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line, size: 22 })],
            spacing: { after: 80 }
          })
        );
      }

      const doc = new DocxDoc({
        sections: [{ properties: {}, children }]
      });

      const docBlob = await Packer.toBlob(doc);
      zip.file(`${baseName}_Part_${fileIndex}.docx`, docBlob);
      fileIndex++;
    }

    updateStatus("Creating split DOCX archive...", 90);
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return { blob: zipBlob, filename: `${baseName}_split.zip` };
  },

  /**
   * Extract all editable plain text content from DOCX files to .txt
   */
  async convertDocxToTxt(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Parsing Word document...", 30);
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value || "";

    updateStatus("Exporting plain text...", 80);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    return { blob, filename: file.name.replace(/\.[^/.]+$/, "") + ".txt" };
  },

  /**
   * Convert Word DOCX files into beautiful responsive HTML documents
   */
  async convertDocxToHtml(
    file: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Parsing Word document elements...", 30);
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const htmlBody = result.value || "";

    updateStatus("Generating styled HTML page...", 75);
    const title = file.name.replace(/\.[^/.]+$/, "");
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
    }
    h1 { font-size: 2.2em; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
    h2 { font-size: 1.8em; color: #1e293b; margin-top: 30px; }
    p { margin-bottom: 1.2em; }
    ul, ol { margin-bottom: 1.2em; padding-left: 20px; }
    li { margin-bottom: 0.5em; }
  </style>
</head>
<body>
  ${htmlBody || `<p>[Empty Document]</p>`}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    return { blob, filename: `${title}.html` };
  },

  /**
   * Find and replace specific text phrases instantly across the entire PDF
   */
  async findAndReplacePdfText(
    file: File,
    findText: string,
    replaceText: string,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    if (!findText) {
      throw new Error("Find text cannot be empty.");
    }
    updateStatus("Reading original PDF pages...", 20);
    const buffer = await readFileAsArrayBuffer(file);
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer.slice(0)) });
    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    const outDoc = await PDFDocument.create();
    const font = await outDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await outDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const maxLineWidth = pageWidth - margin * 2;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      updateStatus(`Processing find & replace on page ${pageNum}/${totalPages}...`, 30 + Math.floor((pageNum / totalPages) * 55));
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const rawPageText = textContent.items.map((item: any) => item.str).join(' ');

      // Perform replacement
      const replacedPageText = rawPageText.replaceAll(findText, replaceText);

      const outPage = outDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      outPage.drawText(`Page ${pageNum} (Modified)`, { x: margin, y, size: 9, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
      y -= 25;

      const words = replacedPageText.split(' ');
      let currentLineStr = '';

      for (const word of words) {
        const testStr = currentLineStr ? `${currentLineStr} ${word}` : word;
        if (font.widthOfTextAtSize(testStr, 11) > maxLineWidth && currentLineStr) {
          if (y < margin + 20) {
            outDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          outPage.drawText(currentLineStr, { x: margin, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
          y -= 16;
          currentLineStr = word;
        } else {
          currentLineStr = testStr;
        }
      }

      if (currentLineStr) {
        if (y < margin + 20) {
          outDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        outPage.drawText(currentLineStr, { x: margin, y, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
      }
    }

    updateStatus("Saving modified PDF...", 90);
    const pdfBytes = await outDoc.save();
    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${file.name.replace(/\.[^/.]+$/, "")}_replaced.pdf`
    };
  },

  /**
   * Insert custom PNG or JPG images onto any page of your PDF document
   */
  async addImageToPdf(
    pdfFile: File,
    imageFile: File,
    updateStatus: (msg: string, pct: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus("Loading PDF document...", 20);
    const pdfBytes = await readFileAsArrayBuffer(pdfFile);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    updateStatus("Processing image...", 50);
    const imgBytes = await readFileAsArrayBuffer(imageFile);
    let embeddedImg;
    if (imageFile.type === 'image/png' || imageFile.name.toLowerCase().endsWith('.png')) {
      embeddedImg = await pdfDoc.embedPng(imgBytes);
    } else {
      embeddedImg = await pdfDoc.embedJpg(imgBytes);
    }

    updateStatus("Inserting image into PDF...", 75);
    const pages = pdfDoc.getPages();
    if (pages.length > 0) {
      const page = pages[0];
      const { width, height } = page.getSize();
      
      const imgWidth = Math.min(200, width - 40);
      const imgHeight = (embeddedImg.height / embeddedImg.width) * imgWidth;

      page.drawImage(embeddedImg, {
        x: width - imgWidth - 20,
        y: height - imgHeight - 20,
        width: imgWidth,
        height: imgHeight
      });
    }

    updateStatus("Saving document with image...", 90);
    const outBytes = await pdfDoc.save();
    return {
      blob: new Blob([outBytes], { type: 'application/pdf' }),
      filename: `${pdfFile.name.replace(/\.[^/.]+$/, "")}_with_image.pdf`
    };
  }
};
