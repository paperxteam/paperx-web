import express from "express";
import type { Request, Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { execFile } from "node:child_process";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { marked } from "marked";
import mammoth from "mammoth";

const router = express.Router();

// Helper to attempt native LibreOffice headless conversion for 100% visual presentation and document layout fidelity
async function convertWithLibreOffice(buffer: Buffer, inputExt: string): Promise<Buffer | null> {
  const tmpDir = os.tmpdir();
  const id = `office_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const inputPath = path.join(tmpDir, `${id}.${inputExt}`);
  const expectedPdfPath = path.join(tmpDir, `${id}.pdf`);

  try {
    fs.writeFileSync(inputPath, buffer);
    await new Promise<void>((resolve, reject) => {
      execFile(
        "soffice",
        [
          `-env:UserInstallation=file:///tmp/lo_user_${id}`,
          "--headless",
          "--nologo",
          "--nodefault",
          "--norestore",
          "--nolockcheck",
          "--convert-to",
          "pdf",
          inputPath,
          "--outdir",
          tmpDir
        ],
        { env: { ...process.env, HOME: tmpDir }, timeout: 30000 },
        (error) => {
          if (error) return reject(error);
          resolve();
        }
      );
    });

    if (fs.existsSync(expectedPdfPath)) {
      const pdfBuf = fs.readFileSync(expectedPdfPath);
      try { fs.unlinkSync(inputPath); } catch (_) {}
      try { fs.unlinkSync(expectedPdfPath); } catch (_) {}
      try { fs.rmSync(`/tmp/lo_user_${id}`, { recursive: true, force: true }); } catch (_) {}
      if (pdfBuf && pdfBuf.length > 0) return pdfBuf;
    }
  } catch (err: any) {
    console.warn("[LibreOffice Native Conversion Warning]:", err?.message || err);
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch (_) {}
    try { if (fs.existsSync(expectedPdfPath)) fs.unlinkSync(expectedPdfPath); } catch (_) {}
    try { fs.rmSync(`/tmp/lo_user_${id}`, { recursive: true, force: true }); } catch (_) {}
  }
  return null;
}

// Configure Multer for in-memory file uploads up to 100MB
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Helper: Sanitize string to standard ASCII / safe WinAnsi for PDF rendering
function sanitizeText(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/✓|✔/g, "[OK]")
    .replace(/✗|✘/g, "[X]")
    .replace(/₹/g, "Rs.")
    .replace(/€/g, "EUR")
    .replace(/£/g, "GBP")
    .replace(/¥/g, "JPY")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, "*")
    .replace(/[\u2026]/g, "...")
    .replace(/[\u00A0]/g, " ")
    .replace(/[^\x00-\x7F]/g, " ")
    .replace(/[\r\n\t]/g, " ")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .trim();
}

function sanitizeMultiLineText(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/✓|✔/g, "[OK]")
    .replace(/✗|✘/g, "[X]")
    .replace(/₹/g, "Rs.")
    .replace(/€/g, "EUR")
    .replace(/£/g, "GBP")
    .replace(/¥/g, "JPY")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, "*")
    .replace(/[\u2026]/g, "...")
    .replace(/[\u00A0]/g, " ")
    .replace(/[^\x00-\x7F\r\n\t]/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
}

/**
 * 0. Word (.docx / .doc) -> PDF Converter
 */
export async function convertWordToPdf(buffer: Buffer, originalFilename: string): Promise<Buffer> {
  const ext = (originalFilename.split(".").pop() || "docx").toLowerCase();
  const librePdf = await convertWithLibreOffice(buffer, ext);
  if (librePdf) return librePdf;

  let text = "";
  try {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value || "";
  } catch (_) {
    text = buffer.toString("utf-8");
  }
  return await convertTxtToPdf(Buffer.from(text, "utf-8"), originalFilename);
}

/**
 * 1. PowerPoint (.pptx) -> PDF Real Converter
 */
export async function convertPptxToPdf(buffer: Buffer, originalFilename: string): Promise<Buffer> {
  const ext = (originalFilename.split(".").pop() || "pptx").toLowerCase();
  const librePdf = await convertWithLibreOffice(buffer, ext);
  if (librePdf) return librePdf;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Default 16:9 slide dimensions (960 x 540 pt)
  let slideWidth = 960;
  let slideHeight = 540;

  interface ParsedSlide {
    slideNumber: number;
    title?: string;
    paragraphs: { text: string; isBold?: boolean; size?: number; color?: { r: number; g: number; b: number } }[];
    tables: string[][][];
    imageBuffers: Buffer[];
  }

  const parsedSlides: ParsedSlide[] = [];

  try {
    const zip = await JSZip.loadAsync(buffer);

    // Read presentation.xml to detect slide size
    if (zip.files["ppt/presentation.xml"]) {
      const presXml = await zip.files["ppt/presentation.xml"].async("text");
      const szMatch = presXml.match(/<p:sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"/i);
      if (szMatch) {
        const cxEmu = parseInt(szMatch[1], 10);
        const cyEmu = parseInt(szMatch[2], 10);
        // 1 pt = 12700 EMUs
        if (cxEmu > 0 && cyEmu > 0) {
          slideWidth = Math.round(cxEmu / 12700);
          slideHeight = Math.round(cyEmu / 12700);
        }
      }
    }

    // Identify all slide files sorted by slide index
    const slideEntries = Object.keys(zip.files)
      .filter(k => k.match(/^ppt\/slides\/slide\d+\.xml$/i))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
        return numA - numB;
      });

    if (slideEntries.length === 0) {
      throw new Error("No presentation slides found in PPTX file.");
    }

    for (let sIdx = 0; sIdx < slideEntries.length; sIdx++) {
      const slidePath = slideEntries[sIdx];
      const slideXml = await zip.files[slidePath].async("text");
      const slideNumber = sIdx + 1;

      // Check for image relationships
      const relsPath = `ppt/slides/_rels/${path.basename(slidePath)}.rels`;
      const imageBuffers: Buffer[] = [];

      if (zip.files[relsPath]) {
        const relsXml = await zip.files[relsPath].async("text");
        const relMatches = relsXml.matchAll(/<Relationship[^>]*Target="([^"]+)"[^>]*Type="[^"]*image"/gi);
        for (const m of relMatches) {
          let target = m[1];
          if (target.startsWith("../")) {
            target = "ppt/" + target.replace(/^\.\.\//, "");
          } else if (!target.startsWith("ppt/")) {
            target = "ppt/slides/" + target;
          }
          if (zip.files[target]) {
            const imgData = await zip.files[target].async("nodebuffer");
            if (imgData && imgData.length > 0) {
              imageBuffers.push(imgData);
            }
          }
        }
      }

      // Extract paragraphs & text runs (excluding table cells to prevent duplicate rendering)
      const slideXmlNoTables = slideXml.replace(/<a:tbl>[\s\S]*?<\/a:tbl>/gi, "");
      const paragraphs: { text: string; isBold?: boolean; size?: number }[] = [];
      const paraMatches = slideXmlNoTables.match(/<a:p>[\s\S]*?<\/a:p>/gi) || [];

      let titleCandidate: string | undefined;

      for (const pXml of paraMatches) {
        // Find text runs
        const rMatches = pXml.match(/<a:r>[\s\S]*?<\/a:r>/gi) || [];
        let fullParaText = "";
        let isBold = false;
        let fontSize = 14;

        if (rMatches.length > 0) {
          for (const rXml of rMatches) {
            const isB = /<a:rPr[^>]*b="1"/i.test(rXml);
            if (isB) isBold = true;
            const szM = rXml.match(/<a:rPr[^>]*sz="(\d+)"/i);
            if (szM) {
              fontSize = Math.max(10, Math.min(32, Math.round(parseInt(szM[1], 10) / 100)));
            }
            const tMatch = rXml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/i);
            if (tMatch) {
              fullParaText += tMatch[1];
            }
          }
        } else {
          // Fallback text extraction
          const plainMatches = pXml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi) || [];
          fullParaText = plainMatches.map(m => m.replace(/<[^>]+>/g, "")).join(" ");
        }

        fullParaText = fullParaText.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();

        if (fullParaText) {
          if (!titleCandidate && (fontSize >= 18 || isBold)) {
            titleCandidate = fullParaText;
          } else {
            paragraphs.push({ text: fullParaText, isBold, size: fontSize });
          }
        }
      }

      // Extract tables
      const tables: string[][][] = [];
      const tblMatches = slideXml.match(/<a:tbl>[\s\S]*?<\/a:tbl>/gi) || [];
      for (const tblXml of tblMatches) {
        const rowMatches = tblXml.match(/<a:tr[^>]*>[\s\S]*?<\/a:tr>/gi) || [];
        const tableRows: string[][] = [];
        for (const trXml of rowMatches) {
          const cellMatches = trXml.match(/<a:tc>[\s\S]*?<\/a:tc>/gi) || [];
          const rowCells: string[] = [];
          for (const tcXml of cellMatches) {
            const cellTexts = tcXml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi) || [];
            const cellStr = cellTexts.map(m => m.replace(/<[^>]+>/g, "")).join(" ").trim();
            rowCells.push(cellStr);
          }
          if (rowCells.length > 0) tableRows.push(rowCells);
        }
        if (tableRows.length > 0) tables.push(tableRows);
      }

      parsedSlides.push({
        slideNumber,
        title: titleCandidate,
        paragraphs,
        tables,
        imageBuffers
      });
    }
  } catch (err: any) {
    console.warn("[PPTX] XML parsing error, using binary fallback:", err.message);
  }

  // If no slides parsed via OpenXML, generate clean slide
  if (parsedSlides.length === 0) {
    parsedSlides.push({
      slideNumber: 1,
      title: undefined,
      paragraphs: [{ text: "PowerPoint Presentation converted.", isBold: false, size: 14 }],
      tables: [],
      imageBuffers: []
    });
  }

  // Render each slide onto its own PDF page (1 slide = 1 page)
  for (const slide of parsedSlides) {
    const page = pdfDoc.addPage([slideWidth, slideHeight]);
    const margin = 48;

    // Clean white background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: slideWidth,
      height: slideHeight,
      color: rgb(1, 1, 1)
    });

    let curY = slideHeight - margin - 10;

    // Draw Slide Title only if present in document
    if (slide.title) {
      const cleanTitle = sanitizeText(slide.title);
      if (cleanTitle) {
        page.drawText(cleanTitle.slice(0, 80), {
          x: margin,
          y: curY,
          size: 22,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.1)
        });
        curY -= 36;
      }
    }

    // Embed images if present on slide
    if (slide.imageBuffers && slide.imageBuffers.length > 0) {
      for (const imgBuf of slide.imageBuffers.slice(0, 2)) {
        try {
          let embeddedImg;
          if (imgBuf[0] === 0x89 && imgBuf[1] === 0x50) {
            embeddedImg = await pdfDoc.embedPng(imgBuf);
          } else {
            embeddedImg = await pdfDoc.embedJpg(imgBuf);
          }
          const maxImgW = 280;
          const maxImgH = 200;
          const scale = Math.min(maxImgW / embeddedImg.width, maxImgH / embeddedImg.height, 1);
          const drawW = embeddedImg.width * scale;
          const drawH = embeddedImg.height * scale;

          page.drawImage(embeddedImg, {
            x: slideWidth - margin - drawW,
            y: Math.max(margin + 20, curY - drawH),
            width: drawW,
            height: drawH
          });
        } catch (_) {}
      }
    }

    // Render Paragraphs
    const maxContentWidth = slide.imageBuffers.length > 0 ? slideWidth - margin * 2 - 300 : slideWidth - margin * 2;

    for (const para of slide.paragraphs) {
      const cleanParaText = sanitizeText(para.text);
      if (!cleanParaText || (slide.title && cleanParaText === slide.title)) continue;
      if (curY < margin + 40) break;

      const fSize = para.size && para.size <= 18 ? para.size : 13;
      const f = para.isBold ? fontBold : font;
      const words = cleanParaText.split(" ");
      let line = "";

      for (const w of words) {
        const testLine = line ? `${line} ${w}` : w;
        if (f.widthOfTextAtSize(testLine, fSize) > maxContentWidth && line) {
          page.drawText(line, {
            x: margin + 12,
            y: curY,
            size: fSize,
            font: f,
            color: rgb(0.2, 0.22, 0.28)
          });
          curY -= fSize + 6;
          line = w;
          if (curY < margin + 40) break;
        } else {
          line = testLine;
        }
      }

      if (line && curY >= margin + 40) {
        page.drawText(line, {
          x: margin + 12,
          y: curY,
          size: fSize,
          font: f,
          color: rgb(0.2, 0.22, 0.28)
        });
        curY -= fSize + 10;
      }
    }

    // Render Tables if present
    for (const table of slide.tables) {
      if (curY < margin + 60) break;
      const colCount = Math.max(...table.map(r => r.length), 1);
      const colW = Math.min(maxContentWidth / colCount, 160);
      const rowH = 20;

      for (let rIdx = 0; rIdx < table.length; rIdx++) {
        if (curY < margin + 30) break;
        const row = table[rIdx];
        const isHeader = rIdx === 0;

        if (isHeader) {
          page.drawRectangle({
            x: margin,
            y: curY - 4,
            width: colW * colCount,
            height: rowH,
            color: rgb(0.9, 0.93, 0.98)
          });
        }

        for (let cIdx = 0; cIdx < row.length; cIdx++) {
          const cellStr = sanitizeText(row[cIdx] || "").slice(0, 30);
          page.drawText(cellStr, {
            x: margin + cIdx * colW + 4,
            y: curY + 2,
            size: 9,
            font: isHeader ? fontBold : font,
            color: isHeader ? rgb(0.1, 0.2, 0.4) : rgb(0.2, 0.2, 0.2)
          });
        }
        curY -= rowH;
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * 2. Excel (.xlsx / .xls) -> PDF Real Converter
 */
export async function convertExcelToPdf(buffer: Buffer, originalFilename: string): Promise<Buffer> {
  const ext = (originalFilename.split(".").pop() || "xlsx").toLowerCase();
  const librePdf = await convertWithLibreOffice(buffer, ext);
  if (librePdf) return librePdf;

  const wb = XLSX.read(buffer, { type: "buffer" });
  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error("The uploaded Excel workbook contains no worksheets.");
  }

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 841.89; // A4 Landscape (842 x 595) for spreadsheets
  const pageHeight = 595.28;
  const margin = 36;
  const availWidth = pageWidth - margin * 2;
  const rowHeight = 18;

  let totalPagesRendered = 0;

  for (let sIdx = 0; sIdx < wb.SheetNames.length; sIdx++) {
    const sheetName = wb.SheetNames[sIdx];
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
    if (rows.length === 0) continue;

    // Filter out completely empty rows
    const validRows = rows.filter(r => r.some((c: any) => String(c).trim().length > 0));
    if (validRows.length === 0) continue;

    // Calculate maximum columns in this sheet
    const colCount = Math.max(...validRows.map(r => r.length), 1);
    
    // Calculate adaptive column widths based on maximum content length
    const colWidths: number[] = [];
    for (let c = 0; c < colCount; c++) {
      let maxLen = 4;
      for (let r = 0; r < Math.min(validRows.length, 100); r++) {
        const val = String(validRows[r][c] || "");
        if (val.length > maxLen) maxLen = val.length;
      }
      colWidths.push(Math.max(45, Math.min(maxLen * 7 + 12, 220)));
    }

    // Scale columns if total width exceeds available page width
    const totalRawColWidth = colWidths.reduce((a, b) => a + b, 0);
    const scaleFactor = totalRawColWidth > availWidth ? availWidth / totalRawColWidth : 1;
    const finalColWidths = colWidths.map(w => Math.max(30, Math.floor(w * scaleFactor)));
    const totalTableWidth = finalColWidths.reduce((a, b) => a + b, 0);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    totalPagesRendered++;
    let y = pageHeight - margin;

    const headerRow = validRows[0];

    const drawHeader = (targetPage: any, currentY: number) => {
      targetPage.drawRectangle({
        x: margin,
        y: currentY - rowHeight + 4,
        width: totalTableWidth,
        height: rowHeight,
        color: rgb(0.92, 0.95, 0.93),
        borderColor: rgb(0.75, 0.82, 0.78),
        borderWidth: 0.5
      });

      let curX = margin;
      for (let c = 0; c < headerRow.length; c++) {
        const cellText = sanitizeText(headerRow[c]).slice(0, 35);
        targetPage.drawText(cellText, {
          x: curX + 4,
          y: currentY - rowHeight + 8,
          size: 8.5,
          font: fontBold,
          color: rgb(0.1, 0.25, 0.15)
        });
        curX += finalColWidths[c] || 50;
      }
    };

    // Draw initial header
    drawHeader(page, y);
    y -= rowHeight;

    // Draw data rows
    for (let r = 1; r < validRows.length; r++) {
      if (y < margin + 25) {
        // Create new page and repeat table header
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        totalPagesRendered++;
        y = pageHeight - margin;

        drawHeader(page, y);
        y -= rowHeight;
      }

      const row = validRows[r];
      const isEven = r % 2 === 0;

      if (isEven) {
        page.drawRectangle({
          x: margin,
          y: y - rowHeight + 4,
          width: totalTableWidth,
          height: rowHeight,
          color: rgb(0.98, 0.99, 0.98)
        });
      }

      // Draw bottom cell border
      page.drawLine({
        start: { x: margin, y: y - rowHeight + 4 },
        end: { x: margin + totalTableWidth, y: y - rowHeight + 4 },
        thickness: 0.5,
        color: rgb(0.88, 0.9, 0.88)
      });

      let curX = margin;
      for (let c = 0; c < colCount; c++) {
        const rawVal = row[c];
        const cellText = sanitizeText(rawVal).slice(0, 35);
        if (cellText) {
          page.drawText(cellText, {
            x: curX + 4,
            y: y - rowHeight + 8,
            size: 8,
            font,
            color: rgb(0.18, 0.18, 0.18)
          });
        }
        curX += finalColWidths[c] || 50;
      }
      y -= rowHeight;
    }
  }

  if (totalPagesRendered === 0) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawText(`Workbook: ${originalFilename} (Empty Workbook)`, {
      x: margin,
      y: pageHeight - margin - 20,
      size: 14,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2)
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * 3. CSV (.csv) -> PDF Real Converter
 */
export async function convertCsvToPdf(buffer: Buffer, originalFilename: string): Promise<Buffer> {
  // Detect encoding (UTF-8 fallback to latin1)
  let rawText = buffer.toString("utf-8");
  if (rawText.charCodeAt(0) === 0xfeff) {
    rawText = rawText.slice(1); // strip BOM
  }

  // Detect delimiter (comma, semicolon, tab, pipe)
  const firstLine = rawText.split("\n")[0] || "";
  let delimiter = ",";
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  const pipes = (firstLine.match(/\|/g) || []).length;

  if (semicolons > commas && semicolons > tabs) delimiter = ";";
  else if (tabs > commas && tabs > semicolons) delimiter = "\t";
  else if (pipes > commas && pipes > semicolons) delimiter = "|";

  // Parse CSV via XLSX for robust quote handling
  const wb = XLSX.read(rawText, { type: "string", FS: delimiter });
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" }) as any[][];

  if (!rows || rows.length === 0) {
    throw new Error("The uploaded CSV file is empty or contains no readable tabular rows.");
  }

  const colCount = Math.max(...rows.map(r => r.length), 1);
  const isLandscape = colCount > 5;
  const pageWidth = isLandscape ? 841.89 : 595.28;
  const pageHeight = isLandscape ? 595.28 : 841.89;
  const margin = 36;
  const availWidth = pageWidth - margin * 2;
  const rowHeight = 20;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Compute column widths
  const colWidths: number[] = [];
  for (let c = 0; c < colCount; c++) {
    let maxLen = 4;
    for (let r = 0; r < Math.min(rows.length, 80); r++) {
      const val = String(rows[r][c] || "");
      if (val.length > maxLen) maxLen = val.length;
    }
    colWidths.push(Math.max(40, Math.min(maxLen * 6.5 + 10, 200)));
  }

  const totalRawW = colWidths.reduce((a, b) => a + b, 0);
  const scale = totalRawW > availWidth ? availWidth / totalRawW : 1;
  const finalColWidths = colWidths.map(w => Math.max(25, Math.floor(w * scale)));
  const totalTableWidth = finalColWidths.reduce((a, b) => a + b, 0);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const headerRow = rows[0];

  const drawHeader = (targetPage: any, currentY: number) => {
    targetPage.drawRectangle({
      x: margin,
      y: currentY - rowHeight + 4,
      width: totalTableWidth,
      height: rowHeight,
      color: rgb(0.88, 0.94, 0.96)
    });

    let curX = margin;
    for (let c = 0; c < headerRow.length; c++) {
      const text = sanitizeText(headerRow[c]).slice(0, 30);
      targetPage.drawText(text, {
        x: curX + 4,
        y: currentY - rowHeight + 7,
        size: 8.5,
        font: fontBold,
        color: rgb(0.08, 0.28, 0.36)
      });
      curX += finalColWidths[c] || 40;
    }
  };

  drawHeader(page, y);
  y -= rowHeight;

  for (let r = 1; r < rows.length; r++) {
    if (y < margin + 25) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;

      drawHeader(page, y);
      y -= rowHeight;
    }

    const row = rows[r];
    if (r % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: y - rowHeight + 4,
        width: totalTableWidth,
        height: rowHeight,
        color: rgb(0.98, 0.99, 1.0)
      });
    }

    page.drawLine({
      start: { x: margin, y: y - rowHeight + 4 },
      end: { x: margin + totalTableWidth, y: y - rowHeight + 4 },
      thickness: 0.5,
      color: rgb(0.88, 0.92, 0.94)
    });

    let curX = margin;
    for (let c = 0; c < colCount; c++) {
      const cellText = sanitizeText(row[c]).slice(0, 35);
      if (cellText) {
        page.drawText(cellText, {
          x: curX + 4,
          y: y - rowHeight + 7,
          size: 8,
          font,
          color: rgb(0.2, 0.2, 0.2)
        });
      }
      curX += finalColWidths[c] || 40;
    }
    y -= rowHeight;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * 4. TXT (.txt) -> PDF Real Converter
 */
/**
 * 4. TXT (.txt) -> PDF Real Converter
 */
export async function convertTxtToPdf(
  buffer: Buffer, 
  originalFilename: string,
  options: any = {}
): Promise<Buffer> {
  // Detect encodings
  let text = "";
  if (buffer.length >= 2) {
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      text = buffer.toString("utf16le");
    } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
      const decoder = new TextDecoder("utf-16be");
      text = decoder.decode(buffer);
    }
  }
  if (!text) {
    text = buffer.toString("utf-8");
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  }

  // Extract format selections
  const fontSize = options.fontSize ? parseFloat(options.fontSize) : 11;
  const lineSpacing = options.lineSpacing ? parseFloat(options.lineSpacing) : 1.3;
  const alignment = options.alignment || "left";
  const fontFamily = options.fontFamily || "Helvetica";
  const pageSize = options.pageSize || "A4";
  const orientation = options.orientation || "portrait";
  const pageMargin = options.pageMargin ? parseFloat(options.pageMargin) : 40;
  const includePageNumbers = options.includePageNumbers === true || options.includePageNumbers === "true";
  const includeHeader = options.includeHeader === true || options.includeHeader === "true";
  const headerTitle = options.headerTitle || originalFilename.replace(/\.[^/.]+$/, "");

  // Page dimensions in pt (points)
  let pageWidth = 595.28; // A4 default
  let pageHeight = 841.89;

  if (pageSize === "A3") {
    pageWidth = 841.89; pageHeight = 1190.55;
  } else if (pageSize === "A5") {
    pageWidth = 419.53; pageHeight = 595.28;
  } else if (pageSize === "Letter") {
    pageWidth = 612.0; pageHeight = 792.0;
  } else if (pageSize === "Legal") {
    pageWidth = 612.0; pageHeight = 1008.0;
  }

  // Handle Orientation
  if (orientation === "landscape") {
    const temp = pageWidth;
    pageWidth = pageHeight;
    pageHeight = temp;
  }

  // Group text into line arrays and wrap them based on average font character width
  const contentWidth = pageWidth - pageMargin * 2;
  const avgCharWidth = fontFamily === "Courier" ? fontSize * 0.6 : fontFamily === "TimesRoman" ? fontSize * 0.46 : fontSize * 0.5;
  const maxCharsPerLine = Math.max(10, Math.floor(contentWidth / avgCharWidth));

  // Support explicit multi-page splits by the standards-compliant Form Feed \f (\u000c) control character
  const sections = text.split(/\f/);
  const sectionPages: string[][] = [];

  // Calculate pages
  const topOffset = includeHeader ? 55 : pageMargin;
  const bottomOffset = includePageNumbers ? 55 : pageMargin;
  const printableHeight = pageHeight - topOffset - bottomOffset;
  const effectiveLineHeight = fontSize * lineSpacing;
  const linesPerPage = Math.max(1, Math.floor(printableHeight / effectiveLineHeight));

  for (const section of sections) {
    const rawLines = section.split(/\r?\n/);
    const wrappedLines: string[] = [];

    for (const line of rawLines) {
      if (!line.trim()) {
        wrappedLines.push("");
        continue;
      }

      // Split line into words and wrap
      const words = line.split(" ");
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length > maxCharsPerLine) {
          if (currentLine) wrappedLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) wrappedLines.push(currentLine);
    }

    const sectionTotalPages = Math.max(1, Math.ceil(wrappedLines.length / linesPerPage));
    for (let p = 0; p < sectionTotalPages; p++) {
      const pageLines = wrappedLines.slice(p * linesPerPage, (p + 1) * linesPerPage);
      sectionPages.push(pageLines);
    }
  }

  const totalPages = Math.max(1, sectionPages.length);

  // Build beautiful styling
  let fontCss = "Liberation Sans, Helvetica, Arial, sans-serif";
  if (fontFamily === "TimesRoman") {
    fontCss = "Liberation Serif, Times New Roman, serif";
  } else if (fontFamily === "Courier") {
    fontCss = "Liberation Mono, Courier, monospace";
  }

  // Escape HTML helper
  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const pagesHtml: string[] = [];
  for (let i = 0; i < totalPages; i++) {
    const pageLines = sectionPages[i] || [];
    const content = pageLines.map(line => escapeHtml(line)).join("\n");

    pagesHtml.push(`
      <div class="page-container">
        ${includeHeader ? `
        <div class="header-section">
          <span class="header-title">${escapeHtml(headerTitle)}</span>
          <span class="header-date">${new Date().toLocaleDateString()}</span>
          <div class="clear"></div>
        </div>
        ` : ""}
        
        <div class="content-section">
          <pre>${content}</pre>
        </div>
        
        ${includePageNumbers ? `
        <div class="footer-section">
          Page ${i + 1} of ${totalPages}
        </div>
        ` : ""}
      </div>
    `);
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page {
          size: ${pageSize === "Letter" ? "letter" : pageSize === "Legal" ? "legal" : pageSize === "A3" ? "A3" : pageSize === "A5" ? "A5" : "A4"} ${orientation};
          margin: ${pageMargin}pt;
        }
        body {
          margin: 0;
          padding: 0;
          background-color: #ffffff;
          font-family: ${fontCss};
        }
        .page-container {
          box-sizing: border-box;
          page-break-after: always;
          position: relative;
          width: 100%;
        }
        .page-container:last-child {
          page-break-after: avoid;
        }
        .header-section {
          border-bottom: 0.5pt solid #cbd5e1;
          padding-bottom: 4pt;
          margin-bottom: 12pt;
          font-family: ${fontCss};
          font-size: 9pt;
          color: #4b5563;
          display: block;
          width: 100%;
        }
        .header-title {
          float: left;
          font-weight: bold;
        }
        .header-date {
          float: right;
        }
        .clear {
          clear: both;
        }
        .content-section {
          display: block;
          width: 100%;
        }
        pre {
          margin: 0;
          padding: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: ${fontCss};
          font-size: ${fontSize}pt;
          line-height: ${lineSpacing};
          text-align: ${alignment};
          color: #111827;
        }
        .footer-section {
          margin-top: 24pt;
          border-top: 0.5pt solid #cbd5e1;
          padding-top: 6pt;
          text-align: center;
          font-family: ${fontCss};
          font-size: 8.5pt;
          color: #4b5563;
          display: block;
          width: 100%;
        }
      </style>
    </head>
    <body>
      ${pagesHtml.join("")}
    </body>
    </html>
  `;

  // Use LibreOffice native HTML conversion
  const htmlBuffer = Buffer.from(fullHtml, "utf-8");
  const convertedPdf = await convertWithLibreOffice(htmlBuffer, "html");
  if (convertedPdf && convertedPdf.length > 0) {
    return convertedPdf;
  }

  // --- FALLBACK IN CASE LIBREOFFICE FAILS ---
  const pdfDoc = await PDFDocument.create();
  let fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  if (fontFamily === "TimesRoman") fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  else if (fontFamily === "Courier") fontRegular = await pdfDoc.embedFont(StandardFonts.Courier);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - pageMargin;

  // Render lines with pdf-lib simply as fallback, replacing any illegal characters to prevent crash
  const allLines = sectionPages.flat();
  for (const line of allLines.slice(0, 1000)) {
    if (currentY < pageMargin + 30) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - pageMargin;
    }
    const safeLine = line.replace(/[^\x20-\x7E\r\n\t]/g, " "); // safe fallback replacement for pdf-lib standard fonts
    page.drawText(safeLine, {
      x: pageMargin,
      y: currentY,
      size: fontSize,
      font: fontRegular,
      color: rgb(0.1, 0.1, 0.1)
    });
    currentY -= fontSize * lineSpacing;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * 5. Markdown (.md / .markdown) -> PDF Real Converter
 */
export async function convertMarkdownToPdf(buffer: Buffer, originalFilename: string, theme: string = "github"): Promise<Buffer> {
  let mdText = buffer.toString("utf-8");
  if (mdText.charCodeAt(0) === 0xfeff) mdText = mdText.slice(1);

  // Parse markdown into high-fidelity structured HTML using marked
  const parsedHtml = await marked.parse(mdText);

  // Determine beautiful custom CSS stylesheets according to the selected theme
  let themeCss = "";

  if (theme === "academic") {
    themeCss = `
      @page {
        size: A4;
        margin: 25mm;
      }
      body {
        font-family: "Times New Roman", Times, Georgia, serif;
        color: #111111;
        line-height: 1.8;
        font-size: 11pt;
        margin: 0;
        padding: 0;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #000000;
        font-family: "Times New Roman", Times, Georgia, serif;
        font-weight: bold;
        margin-top: 1.8em;
        margin-bottom: 0.6em;
        text-align: center;
      }
      h1 {
        font-size: 20pt;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 0;
        margin-bottom: 1.5em;
        border-bottom: 3px double #000000;
        padding-bottom: 0.5em;
      }
      h2 {
        font-size: 14pt;
        text-align: left;
        border-bottom: 1px solid #111111;
        padding-bottom: 0.2em;
      }
      h3 { 
        font-size: 12pt; 
        text-align: left;
        font-style: italic;
      }
      p { 
        margin-top: 0; 
        margin-bottom: 1.5em; 
        text-indent: 1.5em;
        text-align: justify; 
      }
      h1 + p, h2 + p, h3 + p {
        text-indent: 0;
      }
      a { color: #111111; text-decoration: underline; }
      blockquote {
        margin: 1.5em 2.5em;
        padding: 0;
        color: #222222;
        background-color: transparent;
        border: none;
        font-style: italic;
        text-align: justify;
        line-height: 1.7;
      }
      pre {
        background-color: #fcfcfc;
        padding: 1.2em;
        border: 1px solid #999999;
        margin-bottom: 1.5em;
      }
      code {
        font-family: "Courier New", Courier, monospace;
        font-size: 9.5pt;
        color: #000000;
        background-color: #f7f7f7;
        padding: 0.1em 0.3em;
      }
      pre code {
        background-color: transparent;
        padding: 0;
        font-size: 9pt;
      }
      ul, ol { margin-top: 0; margin-bottom: 1.5em; padding-left: 2.5em; }
      li { margin-bottom: 0.4em; }
      table {
        width: 100%;
        border-top: 2px solid #000000;
        border-bottom: 2px solid #000000;
        margin-top: 2em;
        margin-bottom: 2em;
      }
      th, td {
        padding: 8px 12px;
        text-align: left;
        border: none;
        border-bottom: 1px solid #dddddd;
      }
      th {
        border-bottom: 1.5px solid #000000;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 9.5pt;
      }
      tr:last-child td {
        border-bottom: none;
      }
      tr:nth-child(even) td {
        background-color: transparent;
      }
      hr {
        border: 0;
        border-top: 1px solid #111111;
        margin: 3em 0;
      }
    `;
  } else if (theme === "modern") {
    themeCss = `
      @page {
        size: A4;
        margin: 22mm;
      }
      body {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        color: #1e293b;
        line-height: 1.7;
        font-size: 11pt;
        margin: 0;
        padding: 0;
        background-color: #ffffff;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #0f172a;
        font-weight: 800;
        margin-top: 1.8em;
        margin-bottom: 0.6em;
        letter-spacing: -0.02em;
      }
      h1 {
        font-size: 26pt;
        color: #4f46e5;
        margin-top: 0;
        margin-bottom: 1.2em;
        line-height: 1.2;
        border-left: 6px solid #4f46e5;
        padding-left: 15px;
      }
      h2 {
        font-size: 18pt;
        border-bottom: 2px solid #f1f5f9;
        padding-bottom: 0.4em;
        color: #1e1b4b;
      }
      h3 { 
        font-size: 14pt; 
        color: #4f46e5;
      }
      p { 
        margin-top: 0; 
        margin-bottom: 1.2em; 
      }
      a { 
        color: #4f46e5; 
        text-decoration: none; 
        border-bottom: 1px solid rgba(79, 70, 229, 0.3);
        padding-bottom: 1px;
        font-weight: 600;
      }
      blockquote {
        margin: 1.8em 0;
        padding: 1em 1.5em;
        color: #312e81;
        background: linear-gradient(to right, #f5f3ff, #faf5ff);
        border-left: 4px solid #8b5cf6;
        border-radius: 8px;
        font-size: 11.5pt;
      }
      pre {
        background-color: #0f172a;
        padding: 1.2em;
        border-radius: 12px;
        overflow-x: auto;
        border: none;
        margin-bottom: 1.8em;
      }
      code {
        font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, monospace;
        font-size: 9.5pt;
        color: #ec4899;
        background-color: #fdf2f8;
        padding: 0.2em 0.5em;
        border-radius: 6px;
        font-weight: 500;
      }
      pre code {
        padding: 0;
        background-color: transparent;
        color: #f8fafc;
        font-size: 9pt;
      }
      ul, ol { margin-top: 0; margin-bottom: 1.2em; padding-left: 2em; }
      li { margin-bottom: 0.5em; }
      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin-top: 2em;
        margin-bottom: 2em;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
      }
      th, td {
        padding: 12px 16px;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
      }
      th {
        background-color: #f8fafc;
        font-weight: 700;
        color: #0f172a;
        border-bottom: 2px solid #e2e8f0;
        font-size: 9.5pt;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      tr:last-child td {
        border-bottom: none;
      }
      tr:nth-child(even) td {
        background-color: #fafbfd;
      }
      hr {
        border: 0;
        height: 2px;
        background: linear-gradient(to right, #4f46e5, #8b5cf6, transparent);
        margin: 2.5em 0;
      }
    `;
  } else {
    // default: github-like theme
    themeCss = `
      @page {
        size: A4;
        margin: 20mm;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        color: #24292f;
        line-height: 1.6;
        font-size: 10.5pt;
        margin: 0;
        padding: 0;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #1f2328;
        font-weight: 600;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        line-height: 1.25;
      }
      h1 {
        font-size: 22pt;
        border-bottom: 1px solid #d0d7de;
        padding-bottom: 0.3em;
        margin-top: 0;
      }
      h2 {
        font-size: 16pt;
        border-bottom: 1px solid #d0d7de;
        padding-bottom: 0.3em;
      }
      h3 { font-size: 12.5pt; }
      p { margin-top: 0; margin-bottom: 1em; }
      a { color: #0969da; text-decoration: none; }
      blockquote {
        margin: 1.5em 0;
        padding: 0.5em 1em;
        color: #57606a;
        background-color: #f6f8fa;
        border-left: 0.25em solid #d0d7de;
        border-radius: 0;
      }
      pre {
        background-color: #f6f8fa;
        padding: 1em;
        border-radius: 6px;
        overflow-x: auto;
        margin-bottom: 1.5em;
        border: 1px solid #d0d7de;
      }
      code {
        font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
        font-size: 85%;
        color: #1f2328;
        background-color: rgba(175,184,193,0.2);
        padding: 0.2em 0.4em;
        border-radius: 6px;
      }
      pre code {
        padding: 0;
        background-color: transparent;
        font-size: 9pt;
      }
      ul, ol { margin-top: 0; margin-bottom: 1em; padding-left: 2em; }
      li { margin-bottom: 0.25em; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1.5em;
        margin-bottom: 1.5em;
      }
      th, td {
        border: 1px solid #d0d7de;
        padding: 6px 13px;
        text-align: left;
      }
      th {
        background-color: #f6f8fa;
        font-weight: 600;
      }
      tr:nth-child(even) td {
        background-color: #f6f8fa;
      }
      hr {
        height: 0.25em;
        padding: 0;
        margin: 24px 0;
        background-color: #d0d7de;
        border: 0;
      }
    `;
  }

  // Wrap the content inside the selected, high-end theme wrapper
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${themeCss}
</style>
</head>
<body>
  ${parsedHtml}
</body>
</html>`;

  // Direct premium rendering with native LibreOffice engine (headless mode)
  const htmlBuffer = Buffer.from(fullHtml, "utf-8");
  const convertedPdf = await convertWithLibreOffice(htmlBuffer, "html");
  if (convertedPdf) {
    return convertedPdf;
  }

  // Fallback to manual pdf-lib draw in case LibreOffice fails or is missing
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595.28, 841.89]);
  page.drawText(mdText.slice(0, 5000), { x: 48, y: 800, size: 10, font });
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Universal POST /api/convert endpoint
 */
router.post("/convert", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const conversionType = (req.body.conversionType || req.query.conversionType || "").toString().toLowerCase().trim();
    const theme = (req.body.theme || req.query.theme || "github").toString().toLowerCase().trim();

    if (!file) {
      return res.status(400).json({ success: false, error: "No file was uploaded for conversion." });
    }

    if (!conversionType) {
      return res.status(400).json({ success: false, error: "Missing required 'conversionType' parameter." });
    }

    if (file.size === 0) {
      return res.status(400).json({ success: false, error: "The uploaded file is empty (0 bytes)." });
    }

    const originalFilename = file.originalname || "document";
    const baseName = originalFilename.replace(/\.[^/.]+$/, "");
    let outputPdfBuffer: Buffer;

    switch (conversionType) {
      case "powerpoint-to-pdf":
      case "pptx-to-pdf":
      case "ppt-to-pdf":
        outputPdfBuffer = await convertPptxToPdf(file.buffer, originalFilename);
        break;

      case "excel-to-pdf":
      case "xlsx-to-pdf":
      case "xls-to-pdf":
        outputPdfBuffer = await convertExcelToPdf(file.buffer, originalFilename);
        break;

      case "word-to-pdf":
      case "docx-to-pdf":
      case "doc-to-pdf":
        outputPdfBuffer = await convertWordToPdf(file.buffer, originalFilename);
        break;

      case "csv-to-pdf":
        outputPdfBuffer = await convertCsvToPdf(file.buffer, originalFilename);
        break;

      case "txt-to-pdf": {
        const options = {
          fontSize: req.body.fontSize ? parseFloat(req.body.fontSize) : 11,
          lineSpacing: req.body.lineSpacing ? parseFloat(req.body.lineSpacing) : 1.3,
          alignment: req.body.alignment || "left",
          fontFamily: req.body.fontFamily || "Helvetica",
          pageSize: req.body.pageSize || "A4",
          orientation: req.body.orientation || "portrait",
          pageMargin: req.body.pageMargin ? parseFloat(req.body.pageMargin) : 40,
          includePageNumbers: req.body.includePageNumbers === "true" || req.body.includePageNumbers === true,
          includeHeader: req.body.includeHeader === "true" || req.body.includeHeader === true,
          headerTitle: req.body.headerTitle || "Document"
        };
        outputPdfBuffer = await convertTxtToPdf(file.buffer, originalFilename, options);
        break;
      }

      case "markdown-to-pdf":
      case "md-to-pdf":
        outputPdfBuffer = await convertMarkdownToPdf(file.buffer, originalFilename, theme);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported conversion type: "${conversionType}". Supported: pptx-to-pdf, xlsx-to-pdf, csv-to-pdf, txt-to-pdf, markdown-to-pdf.`
        });
    }

    // Validate that generated file is non-empty and has valid PDF header
    if (!outputPdfBuffer || outputPdfBuffer.length === 0) {
      return res.status(500).json({ success: false, error: "Conversion produced an empty PDF." });
    }

    const pdfHeader = outputPdfBuffer.slice(0, 5).toString("ascii");
    if (!pdfHeader.startsWith("%PDF-")) {
      return res.status(500).json({ success: false, error: "Conversion output is corrupted or invalid PDF format." });
    }

    const outputFilename = `${baseName}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(outputFilename)}"`);
    res.setHeader("Content-Length", outputPdfBuffer.length);
    return res.send(outputPdfBuffer);
  } catch (error: any) {
    console.error("[CONVERT API ERROR]:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Conversion failed. Please check the file and try again."
    });
  }
});

export default router;
