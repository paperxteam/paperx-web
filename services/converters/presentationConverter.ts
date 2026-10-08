import pptxgen from 'pptxgenjs';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

async function readFileAsArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  const buf = await file.arrayBuffer();
  return buf.slice(0);
}

/**
 * Converts a PDF into a 100% valid Microsoft PowerPoint (.pptx) presentation.
 */
export async function convertPdfToPowerPoint(
  file: File,
  updateStatus: (status: string, progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  updateStatus('Reading PDF document structure...', 20);
  const buffer = await readFileAsArrayBuffer(file);

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = file.name.replace(/\.[^/.]+$/, '');
  pres.author = 'Presentation Engine';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    updateStatus(`Converting page ${pageNum}/${numPages} to slide...`, 20 + Math.round((pageNum / numPages) * 65));
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    let slideDataUrl = '';
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      slideDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    }

    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .trim();

    const slide = pres.addSlide();

    if (slideDataUrl) {
      // Place page render centered on slide
      const isPortrait = viewport.height > viewport.width;
      if (isPortrait) {
        // Center portrait page on 10 x 5.625 inch slide
        const targetH = 5.2;
        const targetW = targetH * (viewport.width / viewport.height);
        const targetX = (10 - targetW) / 2;
        slide.addImage({
          data: slideDataUrl,
          x: targetX,
          y: 0.25,
          w: targetW,
          h: targetH
        });
      } else {
        slide.addImage({
          data: slideDataUrl,
          x: 0.5,
          y: 0.3,
          w: 9,
          h: 5.0
        });
      }
    } else {
      // Fallback text slide
      slide.addText(`Slide ${pageNum}`, {
        x: 0.8,
        y: 0.5,
        fontSize: 24,
        bold: true,
        color: '1E3A8A'
      });
      slide.addText(pageText.substring(0, 600), {
        x: 0.8,
        y: 1.5,
        w: 8.4,
        h: 3.5,
        fontSize: 14,
        color: '333333'
      });
    }
  }

  updateStatus('Packaging PowerPoint (.pptx) file...', 90);
  const pptxBlob = await pres.write({ outputType: 'blob' }) as Blob;

  return {
    blob: pptxBlob,
    filename: `${file.name.replace(/\.[^/.]+$/, '')}.pptx`
  };
}

/**
 * Converts a PowerPoint presentation (.pptx) into a multi-page PDF presentation.
 */
export async function convertPowerPointToPdf(
  file: File,
  updateStatus: (status: string, progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  updateStatus('Reading PowerPoint slide XMLs...', 25);
  const buffer = await readFileAsArrayBuffer(file);
  const zip = await JSZip.loadAsync(buffer);

  // Find all slide XML files
  const slidePaths = Object.keys(zip.files)
    .filter(path => /^ppt\/slides\/slide\d+\.xml$/i.test(path))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0');
      return numA - numB;
    });

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 16:9 widescreen presentation slide size in points (960 x 540)
  const slideWidth = 960;
  const slideHeight = 540;

  if (slidePaths.length === 0) {
    // Fallback slide
    const page = pdfDoc.addPage([slideWidth, slideHeight]);
    page.drawText(`Presentation: ${file.name}`, { x: 50, y: 300, size: 28, font: fontBold });
    page.drawText('Converted presentation', { x: 50, y: 250, size: 16, font });
  }

  for (let i = 0; i < slidePaths.length; i++) {
    updateStatus(`Rendering slide ${i + 1}/${slidePaths.length}...`, 30 + Math.round((i / slidePaths.length) * 55));
    const xmlContent = await zip.files[slidePaths[i]].async('text');

    // Extract text elements: <a:t>...</a:t>
    const matches = xmlContent.match(/<a:t[^>]*>(.*?)<\/a:t>/gi) || [];
    const texts = matches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);

    const page = pdfDoc.addPage([slideWidth, slideHeight]);

    // Clean white background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: slideWidth,
      height: slideHeight,
      color: rgb(1, 1, 1)
    });

    let bodyY = slideHeight - 60;

    if (texts.length > 0) {
      // First text element (if present)
      const firstText = texts[0];
      page.drawText(firstText.substring(0, 80), {
        x: 60,
        y: bodyY,
        size: 22,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.2)
      });
      bodyY -= 40;

      // Remaining text elements
      const bodyTexts = texts.slice(1);
      for (const bText of bodyTexts) {
        if (bodyY < 50) break;
        page.drawText(bText.substring(0, 110), {
          x: 60,
          y: bodyY,
          size: 14,
          font,
          color: rgb(0.2, 0.2, 0.2)
        });
        bodyY -= 26;
      }
    }
  }

  updateStatus('Finalizing presentation PDF...', 90);
  const pdfBytes = await pdfDoc.save();

  return {
    blob: new Blob([pdfBytes], { type: 'application/pdf' }),
    filename: `${file.name.replace(/\.[^/.]+$/, '')}.pdf`
  };
}
