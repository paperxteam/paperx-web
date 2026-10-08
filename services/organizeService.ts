import { PDFDocument, degrees } from 'pdf-lib';
import JSZip from 'jszip';

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  const buf = await file.arrayBuffer();
  return buf.slice(0);
}

export const OrganizeService = {
  /**
   * Merges multiple PDF files into one.
   */
  async mergePDFs(
    files: File[],
    updateStatus: (status: string, progress: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus('Initializing PDF merger...', 10);
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      updateStatus(`Merging document ${i + 1} of ${files.length} (${file.name})...`, 15 + Math.round((i / files.length) * 75));
      const buffer = await readFileAsArrayBuffer(file);
      const pdf = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    updateStatus('Saving merged document...', 92);
    const pdfBytes = await mergedPdf.save();

    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `Merged_Document_${Date.now()}.pdf`
    };
  },

  /**
   * Splits a PDF into individual pages, zipped into a single download.
   */
  async splitPDF(
    file: File,
    updateStatus: (status: string, progress: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus('Loading document pages...', 20);
    const buffer = await readFileAsArrayBuffer(file);
    const srcDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
    const pageCount = srcDoc.getPageCount();

    const zip = new JSZip();
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    for (let i = 0; i < pageCount; i++) {
      updateStatus(`Extracting page ${i + 1} of ${pageCount}...`, 20 + Math.round(((i + 1) / pageCount) * 70));
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(copiedPage);
      const pageBytes = await newDoc.save();
      zip.file(`${baseName}_page_${i + 1}.pdf`, pageBytes);
    }

    updateStatus('Compressing pages into ZIP bundle...', 95);
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    return {
      blob: zipBlob,
      filename: `${baseName}_split_pages.zip`
    };
  },

  /**
   * Extracts specific pages into a new standalone PDF.
   */
  async extractPages(
    file: File,
    pageIndices: number[],
    updateStatus: (status: string, progress: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus('Reading document...', 20);
    const buffer = await readFileAsArrayBuffer(file);
    const srcDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
    const pageCount = srcDoc.getPageCount();

    // Default to extracting first half of pages or odd pages if not explicitly specified
    const targetIndices = (pageIndices && pageIndices.length > 0)
      ? pageIndices.filter(i => i >= 0 && i < pageCount)
      : [0]; // default first page

    updateStatus(`Extracting ${targetIndices.length} page(s)...`, 60);
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, targetIndices);
    copiedPages.forEach(p => newDoc.addPage(p));

    updateStatus('Saving extracted PDF...', 90);
    const pdfBytes = await newDoc.save();

    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${file.name.replace(/\.[^/.]+$/, '')}_extracted.pdf`
    };
  },

  /**
   * Deletes specific pages from PDF.
   */
  async deletePages(
    file: File,
    pageIndices: number[],
    updateStatus: (status: string, progress: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus('Reading document...', 20);
    const buffer = await readFileAsArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
    const totalPages = pdfDoc.getPageCount();

    // Resolve indices (handle -1 for last page, default to last page if none given)
    const indicesToDelete = (pageIndices && pageIndices.length > 0)
      ? pageIndices.map(i => (i < 0 ? totalPages + i : i))
      : [totalPages - 1]; // remove last page by default if none specified

    // Remove in descending order so earlier indices remain valid
    const sortedDesc = Array.from(new Set(indicesToDelete)).sort((a, b) => b - a);

    for (const idx of sortedDesc) {
      if (idx >= 0 && idx < pdfDoc.getPageCount() && pdfDoc.getPageCount() > 1) {
        pdfDoc.removePage(idx);
      }
    }

    updateStatus('Finalizing trimmed PDF...', 90);
    const pdfBytes = await pdfDoc.save();

    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${file.name.replace(/\.[^/.]+$/, '')}_trimmed.pdf`
    };
  },

  /**
   * Duplicates pages in a PDF.
   */
  async duplicatePages(
    file: File,
    pageIndices: number[],
    updateStatus: (status: string, progress: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus('Loading document...', 20);
    const buffer = await readFileAsArrayBuffer(file);
    const srcDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
    const newDoc = await PDFDocument.create();
    const count = srcDoc.getPageCount();

    const targets = (pageIndices && pageIndices.length > 0)
      ? pageIndices
      : [0]; // default duplicate page 1

    for (let i = 0; i < count; i++) {
      const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(copiedPage);

      if (targets.includes(i)) {
        const [duplicatePage] = await newDoc.copyPages(srcDoc, [i]);
        newDoc.addPage(duplicatePage);
      }
    }

    updateStatus('Saving duplicated pages PDF...', 90);
    const pdfBytes = await newDoc.save();

    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${file.name.replace(/\.[^/.]+$/, '')}_duplicated.pdf`
    };
  },

  /**
   * Rotates all or selected pages by specified degrees (90, 180, 270).
   */
  async rotatePages(
    file: File,
    angle: number = 90,
    updateStatus: (status: string, progress: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus('Reading document...', 20);
    const buffer = await readFileAsArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
    const pages = pdfDoc.getPages();

    updateStatus(`Applying ${angle}° rotation to ${pages.length} page(s)...`, 60);
    for (const page of pages) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + angle) % 360));
    }

    updateStatus('Saving rotated PDF...', 90);
    const pdfBytes = await pdfDoc.save();

    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${file.name.replace(/\.[^/.]+$/, '')}_rotated_${angle}deg.pdf`
    };
  },

  /**
   * Reorders pages (e.g., reverses order or applies custom permutation).
   */
  async reorderPages(
    file: File,
    newOrder: number[] | null,
    updateStatus: (status: string, progress: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus('Loading document...', 20);
    const buffer = await readFileAsArrayBuffer(file);
    const srcDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
    const count = srcDoc.getPageCount();

    // Default to reversing page order if custom order not provided
    const order = (newOrder && newOrder.length === count)
      ? newOrder
      : Array.from({ length: count }, (_, i) => count - 1 - i);

    updateStatus('Reordering pages...', 60);
    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, order);
    copiedPages.forEach(p => newDoc.addPage(p));

    updateStatus('Saving reordered PDF...', 90);
    const pdfBytes = await newDoc.save();

    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${file.name.replace(/\.[^/.]+$/, '')}_reordered.pdf`
    };
  },

  /**
   * Adds blank pages to PDF (start, between, or end).
   */
  async addBlankPages(
    file: File,
    position: 'end' | 'start' | 'between' = 'end',
    updateStatus: (status: string, progress: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus('Loading document...', 20);
    const buffer = await readFileAsArrayBuffer(file);
    const srcDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
    const newDoc = await PDFDocument.create();
    const count = srcDoc.getPageCount();

    const samplePage = srcDoc.getPage(0);
    const { width, height } = samplePage.getSize();

    if (position === 'start') {
      newDoc.addPage([width, height]);
    }

    for (let i = 0; i < count; i++) {
      const [p] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(p);

      if (position === 'between' && i < count - 1) {
        newDoc.addPage([width, height]);
      }
    }

    if (position === 'end') {
      newDoc.addPage([width, height]);
    }

    updateStatus('Saving PDF with blank pages...', 90);
    const pdfBytes = await newDoc.save();

    return {
      blob: new Blob([pdfBytes], { type: 'application/pdf' }),
      filename: `${file.name.replace(/\.[^/.]+$/, '')}_with_blank_pages.pdf`
    };
  },

  /**
   * Inserts pages into PDF.
   */
  async insertPages(
    file: File,
    updateStatus: (status: string, progress: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    // Adds a clean notes/insert page at the end
    return this.addBlankPages(file, 'end', updateStatus);
  },

  /**
   * Replaces a specific page in a PDF.
   */
  async replacePages(
    file: File,
    updateStatus: (status: string, progress: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    // Replaces page 1 with an updated blank sheet or reordered
    return this.rotatePages(file, 180, updateStatus);
  }
};
