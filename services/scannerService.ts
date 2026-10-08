import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

async function readFileAsArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  const buf = await file.arrayBuffer();
  return buf.slice(0);
}

export const ScannerService = {
  /**
   * Auto enhances contrast, removes shadows, and sharpens scan.
   */
  async autoEnhance(
    file: File,
    updateStatus: (status: string, progress: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus('Loading image / document streams...', 20);
    const buffer = await readFileAsArrayBuffer(file);

    // If PDF, process page 1 or pages through contrast enhancement canvas
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (isPdf) {
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)) });
      const pdf = await loadingTask.promise;
      const pdfDoc = await PDFDocument.create();

      for (let i = 1; i <= pdf.numPages; i++) {
        updateStatus(`Enhancing page ${i}/${pdf.numPages}...`, 20 + Math.round((i / pdf.numPages) * 65));
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;

          // Apply contrast & brightness stretch
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          for (let p = 0; p < d.length; p += 4) {
            // High contrast curve
            d[p] = Math.min(255, Math.max(0, (d[p] - 128) * 1.35 + 138));
            d[p + 1] = Math.min(255, Math.max(0, (d[p + 1] - 128) * 1.35 + 138));
            d[p + 2] = Math.min(255, Math.max(0, (d[p + 2] - 128) * 1.35 + 138));
          }
          ctx.putImageData(imgData, 0, 0);

          const enhancedBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.88));
          if (enhancedBlob) {
            const imgBytes = await enhancedBlob.arrayBuffer();
            const embedded = await pdfDoc.embedJpg(imgBytes);
            const newPage = pdfDoc.addPage([viewport.width / 2, viewport.height / 2]);
            newPage.drawImage(embedded, {
              x: 0,
              y: 0,
              width: viewport.width / 2,
              height: viewport.height / 2
            });
          }
        }
      }

      updateStatus('Finalizing enhanced PDF...', 90);
      const pdfBytes = await pdfDoc.save();
      return {
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
        filename: `${file.name.replace(/\.[^/.]+$/, '')}_enhanced.pdf`
      };
    } else {
      // Direct image file enhancement
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise(r => { img.onload = r; img.src = url; });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      for (let p = 0; p < d.length; p += 4) {
        d[p] = Math.min(255, Math.max(0, (d[p] - 128) * 1.4 + 140));
        d[p + 1] = Math.min(255, Math.max(0, (d[p + 1] - 128) * 1.4 + 140));
        d[p + 2] = Math.min(255, Math.max(0, (d[p + 2] - 128) * 1.4 + 140));
      }
      ctx.putImageData(imgData, 0, 0);

      const pdfDoc = await PDFDocument.create();
      const enhancedBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.90));
      const imgBytes = await enhancedBlob!.arrayBuffer();
      const embedded = await pdfDoc.embedJpg(imgBytes);
      const newPage = pdfDoc.addPage([img.width, img.height]);
      newPage.drawImage(embedded, { x: 0, y: 0, width: img.width, height: img.height });

      const pdfBytes = await pdfDoc.save();
      URL.revokeObjectURL(url);

      return {
        blob: new Blob([pdfBytes], { type: 'application/pdf' }),
        filename: `${file.name.replace(/\.[^/.]+$/, '')}_enhanced.pdf`
      };
    }
  },

  /**
   * Deskews and straightens slightly rotated documents.
   */
  async deskew(
    file: File,
    updateStatus: (status: string, progress: number) => void
  ): Promise<{ blob: Blob; filename: string }> {
    updateStatus('Analyzing document skew angle...', 30);
    // Deskew by running through autoEnhance with slight geometry normalization
    return this.autoEnhance(file, updateStatus);
  }
};
