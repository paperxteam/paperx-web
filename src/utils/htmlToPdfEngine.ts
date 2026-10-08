import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PDFDocument, rgb } from 'pdf-lib';

/**
 * Robust HTML to PDF Rendering Engine
 * Ensures 100% visual parity between the A4 preview in the UI and the generated PDF file.
 */

export interface HtmlToPdfOptions {
  filename?: string;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;
  quality?: number; // 1 to 3 (default 2 for high-DPI)
  onProgress?: (status: string, percentage: number) => void;
}

/**
 * Preloads all images and fonts inside a container or document
 */
export async function waitForContainerReady(container: HTMLElement | Document): Promise<void> {
  // 1. Wait for document fonts
  if ('fonts' in document && (document as any).fonts.ready) {
    try {
      await (document as any).fonts.ready;
    } catch (_) {}
  }

  // 2. Wait for images to load
  const images = Array.from(container.querySelectorAll('img'));
  const imagePromises = images.map((img) => {
    if (img.complete && img.naturalHeight !== 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Don't block forever on broken images
      // Fallback timeout
      setTimeout(resolve, 2000);
    });
  });

  await Promise.all(imagePromises);

  // 3. Small layout reflow pause
  await new Promise((resolve) => setTimeout(resolve, 150));
}

/**
 * Converts any HTML string into an ISO-standard PDF Blob matching exact A4 dimensions
 */
export async function convertHtmlStringToPdf(
  htmlContent: string,
  options: HtmlToPdfOptions = {}
): Promise<{ blob: Blob; filename: string }> {
  const {
    filename = 'Document.pdf',
    pageSize = 'A4',
    orientation = 'portrait',
    onProgress
  } = options;

  onProgress?.('Initializing rendering engine...', 10);

  // Create temporary hidden container off-screen with standard A4 width
  // Standard A4 at 96 DPI: Width = 794px, Height = 1123px (Ratio 1 : 1.414)
  const isLandscape = orientation === 'landscape';
  const pagePxWidth = isLandscape ? 1123 : 794;
  const pagePxHeight = isLandscape ? 794 : 1123;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = `${pagePxWidth}px`;
  container.style.backgroundColor = '#ffffff';
  container.style.margin = '0';
  container.style.padding = '0';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-9999';

  // Inject user HTML inside container
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    onProgress?.('Loading fonts, stylesheets, and embedded graphics...', 25);
    await waitForContainerReady(container);

    onProgress?.('Rendering layout canvas...', 50);

    // Detect explicit page break elements (.page or page-break-after/before)
    const pageElements = Array.from(
      container.querySelectorAll('.page, [style*="page-break-after"], [style*="break-after"], [style*="page-break-before"], [style*="break-before"]')
    ) as HTMLElement[];

    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: pageSize.toLowerCase() as any,
      compress: true
    });

    const pdfPageWidthMm = isLandscape ? 297 : 210;
    const pdfPageHeightMm = isLandscape ? 210 : 297;

    if (pageElements.length > 1) {
      // MODE A: Explicit Page-by-Page elements
      for (let i = 0; i < pageElements.length; i++) {
        onProgress?.(`Rendering page ${i + 1} of ${pageElements.length}...`, 50 + Math.floor((i / pageElements.length) * 40));

        const pageEl = pageElements[i];
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfPageWidthMm, pdfPageHeightMm);
      }
    } else {
      // MODE B: Full Document Capture & Seamless A4 Slicing
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: pagePxWidth
      });

      const fullCanvasWidth = canvas.width;
      const fullCanvasHeight = canvas.height;

      // Height of one single A4 page in canvas pixel space
      const pageCanvasHeight = Math.floor((fullCanvasWidth * pdfPageHeightMm) / pdfPageWidthMm);
      const totalPages = Math.max(1, Math.ceil(fullCanvasHeight / pageCanvasHeight));

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        onProgress?.(`Processing PDF page ${pageIdx + 1} of ${totalPages}...`, 50 + Math.floor((pageIdx / totalPages) * 40));

        const sourceY = pageIdx * pageCanvasHeight;
        const sourceH = Math.min(pageCanvasHeight, fullCanvasHeight - sourceY);

        // Create canvas slice for this exact page
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = fullCanvasWidth;
        pageCanvas.height = pageCanvasHeight;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, fullCanvasWidth, pageCanvasHeight);
          ctx.drawImage(
            canvas,
            0, sourceY, fullCanvasWidth, sourceH,
            0, 0, fullCanvasWidth, sourceH
          );
        }

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        if (pageIdx > 0) pdf.addPage();
        pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfPageWidthMm, pdfPageHeightMm);
      }
    }

    onProgress?.('Finalizing PDF package...', 95);
    const pdfBlob = pdf.output('blob');
    const cleanFilename = filename.toLowerCase().endsWith('.pdf')
      ? filename
      : `${filename.replace(/\.[^/.]+$/, '')}.pdf`;

    return { blob: pdfBlob, filename: cleanFilename };
  } finally {
    // Clean up temporary DOM container
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
