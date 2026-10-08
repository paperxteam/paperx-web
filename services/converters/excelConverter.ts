import * as XLSX from 'xlsx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

async function readFileAsArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  const buf = await file.arrayBuffer();
  return buf.slice(0);
}

/**
 * Extracts tabular and textual data from PDF into a genuine Microsoft Excel (.xlsx) workbook.
 */
export async function convertPdfToExcel(
  file: File,
  updateStatus: (status: string, progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  updateStatus('Reading PDF data streams...', 20);
  const buffer = await readFileAsArrayBuffer(file);

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer.slice(0)) });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const workbook = XLSX.utils.book_new();

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    updateStatus(`Extracting table rows from page ${pageNum}/${numPages}...`, 20 + Math.round((pageNum / numPages) * 60));
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group items into rows by Y-coordinate
    interface TextItemPos {
      text: string;
      x: number;
      y: number;
    }
    const items: TextItemPos[] = [];

    for (const item of textContent.items as any[]) {
      const str = (item.str || '').trim();
      if (!str) continue;
      items.push({
        text: str,
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5])
      });
    }

    // Cluster by Y with a 5px tolerance
    const rowBuckets: { y: number; cells: TextItemPos[] }[] = [];
    const yTolerance = 5;

    for (const item of items) {
      let bucket = rowBuckets.find(b => Math.abs(b.y - item.y) <= yTolerance);
      if (!bucket) {
        bucket = { y: item.y, cells: [] };
        rowBuckets.push(bucket);
      }
      bucket.cells.push(item);
    }

    // Sort rows top-to-bottom (high Y to low Y)
    rowBuckets.sort((a, b) => b.y - a.y);

    // For each row, sort cells left-to-right (low X to high X)
    const sheetRows: string[][] = [];
    for (const bucket of rowBuckets) {
      bucket.cells.sort((a, b) => a.x - b.x);

      // Simple column separation: if distance between X is large, put into separate cells
      const rowCells: string[] = [];
      let lastX = -999;
      for (const cell of bucket.cells) {
        if (lastX >= 0 && cell.x - lastX > 30) {
          rowCells.push(cell.text);
        } else if (rowCells.length > 0) {
          rowCells[rowCells.length - 1] += ' ' + cell.text;
        } else {
          rowCells.push(cell.text);
        }
        lastX = cell.x;
      }
      if (rowCells.length > 0) {
        sheetRows.push(rowCells);
      }
    }

    if (sheetRows.length === 0) {
      sheetRows.push(['No table data detected on this page']);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, `Page ${pageNum}`);
  }

  updateStatus('Generating Excel workbook (.xlsx)...', 90);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  return {
    blob,
    filename: `${file.name.replace(/\.[^/.]+$/, '')}_data.xlsx`
  };
}

/**
 * Converts an Excel spreadsheet (.xlsx, .xls, .csv) into a neat formatted PDF table.
 */
export async function convertExcelToPdf(
  file: File,
  updateStatus: (status: string, progress: number) => void
): Promise<{ blob: Blob; filename: string }> {
  updateStatus('Parsing Excel workbook sheets...', 25);
  const buffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(buffer, { type: 'array' });

  updateStatus('Rendering spreadsheet grid to PDF...', 60);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 841.89; // Landscape A4 for spreadsheets
  const pageHeight = 595.28;
  const margin = 40;
  const usableWidth = pageWidth - margin * 2;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data: (string | number | boolean)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length === 0) continue;

    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const maxCols = Math.min(8, Math.max(...data.map(r => r.length)));
    const colWidth = usableWidth / Math.max(1, maxCols);
    const rowHeight = 22;

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      const isHeader = rowIndex === 0;

      if (y < margin + 30) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin - 30;
      }

      // Draw row background for header or alternate rows
      if (isHeader) {
        currentPage.drawRectangle({
          x: margin,
          y: y - rowHeight + 14,
          width: usableWidth,
          height: rowHeight,
          color: rgb(0.9, 0.93, 0.98)
        });
      } else if (rowIndex % 2 === 1) {
        currentPage.drawRectangle({
          x: margin,
          y: y - rowHeight + 14,
          width: usableWidth,
          height: rowHeight,
          color: rgb(0.97, 0.97, 0.97)
        });
      }

      // Draw cells
      for (let colIndex = 0; colIndex < maxCols; colIndex++) {
        const val = row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : '';
        const truncated = val.length > 28 ? val.substring(0, 26) + '...' : val;

        currentPage.drawText(truncated, {
          x: margin + colIndex * colWidth + 5,
          y: y,
          size: 9,
          font: isHeader ? fontBold : font,
          color: isHeader ? rgb(0.1, 0.1, 0.3) : rgb(0.2, 0.2, 0.2)
        });

        // Vertical divider line
        currentPage.drawLine({
          start: { x: margin + colIndex * colWidth, y: y + 14 },
          end: { x: margin + colIndex * colWidth, y: y - rowHeight + 14 },
          thickness: 0.5,
          color: rgb(0.85, 0.85, 0.85)
        });
      }

      // Horizontal row line
      currentPage.drawLine({
        start: { x: margin, y: y - rowHeight + 14 },
        end: { x: margin + usableWidth, y: y - rowHeight + 14 },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85)
      });

      y -= rowHeight;
    }
  }

  // Fallback if no sheets had data
  if (pdfDoc.getPageCount() === 0) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawText('Empty spreadsheet document.', { x: margin, y: pageHeight - margin, size: 12, font });
  }

  updateStatus('Finalizing PDF...', 90);
  const pdfBytes = await pdfDoc.save();

  return {
    blob: new Blob([pdfBytes], { type: 'application/pdf' }),
    filename: `${file.name.replace(/\.[^/.]+$/, '')}.pdf`
  };
}
