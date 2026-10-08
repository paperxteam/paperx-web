import { marked } from 'marked';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { convertHtmlStringToPdf } from '../../src/utils/htmlToPdfEngine';

const pdfjs = (pdfjsLib as any).default || pdfjsLib;
if (typeof window !== 'undefined' && pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Converts an HTML document into a 100% layout-matched, multi-page PDF.
 */
export async function convertHtmlToPdf(
  file: File,
  updateStatus: (status: string, progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  updateStatus('Parsing HTML document...', 10);
  const htmlRaw = await readFileAsText(file);

  return await convertHtmlStringToPdf(htmlRaw, {
    filename: file.name.replace(/\.[^/.]+$/, '') + '.pdf',
    pageSize: 'A4',
    orientation: 'portrait',
    onProgress: (msg, pct) => updateStatus(msg, pct)
  });
}

/**
 * Converts a Markdown document into a formatted, styled PDF.
 */
export async function convertMarkdownToPdf(
  file: File,
  updateStatus: (status: string, progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  updateStatus('Parsing Markdown tokens...', 25);
  const mdRaw = await readFileAsText(file);

  const tokens = marked.lexer(mdRaw);

  updateStatus('Generating formatted PDF...', 60);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawWrappedText = (text: string, currentFont: any, currentSize: number, indent: number = 0, color: any = rgb(0.15, 0.15, 0.15)) => {
    const lineHeight = currentSize * 1.45;
    const words = text.split(/\s+/);
    let currentChunk = '';

    for (const word of words) {
      const testChunk = currentChunk ? `${currentChunk} ${word}` : word;
      const width = currentFont.widthOfTextAtSize(testChunk, currentSize);

      if (width > (contentWidth - indent) && currentChunk) {
        if (y < margin + 40) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }

        currentPage.drawText(currentChunk, {
          x: margin + indent,
          y,
          size: currentSize,
          font: currentFont,
          color
        });

        y -= lineHeight;
        currentChunk = word;
      } else {
        currentChunk = testChunk;
      }
    }

    if (currentChunk) {
      if (y < margin + 40) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      currentPage.drawText(currentChunk, {
        x: margin + indent,
        y,
        size: currentSize,
        font: currentFont,
        color
      });

      y -= lineHeight;
    }
  };

  for (const token of tokens) {
    if (token.type === 'heading') {
      const headingSize = token.depth === 1 ? 20 : token.depth === 2 ? 15 : 12.5;
      y -= 8;
      drawWrappedText(token.text, fontBold, headingSize, 0, rgb(0.1, 0.1, 0.1));
      y -= 6;
    } else if (token.type === 'paragraph') {
      drawWrappedText(token.text, font, 10.5, 0);
      y -= 4;
    } else if (token.type === 'list') {
      for (const item of (token as any).items || []) {
        drawWrappedText(`•  ${item.text}`, font, 10.5, 15);
      }
      y -= 4;
    } else if (token.type === 'code') {
      const codeLines = (token as any).text.split('\n');
      y -= 6;
      for (const cLine of codeLines) {
        drawWrappedText(cLine, fontMono, 9.5, 10, rgb(0.2, 0.2, 0.5));
      }
      y -= 6;
    }
  }

  updateStatus('Finalizing PDF...', 90);
  const pdfBytes = await pdfDoc.save();

  return {
    blob: new Blob([pdfBytes], { type: 'application/pdf' }),
    filename: `${file.name.replace(/\.[^/.]+$/, '')}.pdf`
  };
}

/**
 * Converts PDF content into clean, structured, responsive HTML.
 */
export async function convertPdfToHtml(
  file: File,
  updateStatus: (status: string, progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  updateStatus('Reading PDF document structure...', 15);
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let pageHtmls: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    updateStatus(`Extracting page ${i} of ${numPages}...`, 20 + Math.round((i / numPages) * 65));
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    // Group items by line based on Y coordinate
    const lineMap: Map<number, { text: string; fontSize: number; isBold: boolean; x: number }[]> = new Map();

    for (const item of textContent.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      const transform = item.transform;
      const x = transform[4];
      const y = Math.round(transform[5] * 2) / 2; // round Y slightly
      const fontSize = Math.abs(transform[0]) || 12;
      const fontName = (item.fontName || '').toLowerCase();
      const isBold = fontName.includes('bold') || fontName.includes('heavy') || fontName.includes('black');

      if (!lineMap.has(y)) {
        lineMap.set(y, []);
      }
      lineMap.get(y)!.push({ text: item.str, fontSize, isBold, x });
    }

    // Sort Y coordinates descending (top to bottom)
    const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);

    let pageElementsHtml = '';

    for (const y of sortedYs) {
      const itemsOnLine = lineMap.get(y)!;
      // Sort items horizontally (left to right)
      itemsOnLine.sort((a, b) => a.x - b.x);

      const lineText = itemsOnLine.map(it => it.text).join(' ').trim();
      if (!lineText) continue;

      const maxFontSize = Math.max(...itemsOnLine.map(it => it.fontSize));
      const hasBold = itemsOnLine.some(it => it.isBold);

      // Determine HTML element type based on font size and structure
      if (maxFontSize >= 22) {
        pageElementsHtml += `<h1 class="pdf-h1">${escapeHtml(lineText)}</h1>\n`;
      } else if (maxFontSize >= 16) {
        pageElementsHtml += `<h2 class="pdf-h2">${escapeHtml(lineText)}</h2>\n`;
      } else if (maxFontSize >= 13) {
        pageElementsHtml += `<h3 class="pdf-h3">${escapeHtml(lineText)}</h3>\n`;
      } else if (lineText.startsWith('•') || lineText.startsWith('-') || lineText.startsWith('*')) {
        pageElementsHtml += `<li class="pdf-list-item">${escapeHtml(lineText.replace(/^[•\-\*]\s*/, ''))}</li>\n`;
      } else {
        const textContentStr = hasBold ? `<strong>${escapeHtml(lineText)}</strong>` : escapeHtml(lineText);
        pageElementsHtml += `<p class="pdf-paragraph">${textContentStr}</p>\n`;
      }
    }

    pageHtmls.push(`
    <section class="pdf-page" id="page-${i}" data-page="${i}">
      <div class="page-number-badge">Page ${i}</div>
      <div class="page-content">
        ${pageElementsHtml || '<p class="pdf-paragraph text-muted">[Empty Page]</p>'}
      </div>
    </section>
    `);
  }

  updateStatus('Generating responsive HTML document...', 90);

  const title = file.name.replace(/\.[^/.]+$/, '');
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg-color: #f8fafc;
      --card-bg: #ffffff;
      --text-color: #0f172a;
      --text-muted: #64748b;
      --primary-color: #2563eb;
      --border-color: #e2e8f0;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-color: #090d16;
        --card-bg: #111827;
        --text-color: #f3f4f6;
        --text-muted: #9ca3af;
        --primary-color: #3b82f6;
        --border-color: #1f2937;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      margin: 0;
      padding: 2rem 1rem;
      line-height: 1.6;
    }
    .container {
      max-width: 840px;
      margin: 0 auto;
    }
    .header-banner {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      padding: 1.5rem 2rem;
      border-radius: 1rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .header-banner h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.75rem;
      letter-spacing: -0.025em;
    }
    .header-banner p {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .pdf-page {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 1rem;
      padding: 2.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
      position: relative;
    }
    .page-number-badge {
      position: absolute;
      top: 1rem;
      right: 1.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      background: var(--bg-color);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid var(--border-color);
    }
    .pdf-h1 { font-size: 1.85rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 0.75rem; letter-spacing: -0.02em; }
    .pdf-h2 { font-size: 1.45rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.5rem; }
    .pdf-h3 { font-size: 1.15rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; }
    .pdf-paragraph { margin-bottom: 1rem; word-break: break-word; }
    .pdf-list-item { margin-left: 1.5rem; margin-bottom: 0.5rem; }
    .text-muted { color: var(--text-muted); }
  </style>
</head>
<body>
  <div class="container">
    <header class="header-banner">
      <h1>${escapeHtml(title)}</h1>
      <p>Converted from PDF • ${numPages} Pages</p>
    </header>
    <main>
      ${pageHtmls.join('\n')}
    </main>
  </div>
</body>
</html>`;

  return {
    blob: new Blob([fullHtml], { type: 'text/html;charset=utf-8' }),
    filename: `${title}.html`
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
