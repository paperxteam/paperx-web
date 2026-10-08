import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: string;
  metadata?: Record<string, any>;
}

export const OutputValidator = {
  /**
   * Validate any processed document output before reporting success to user.
   * Throws an Error with actionable message if the file is invalid, corrupt, or empty.
   */
  async validate(blob: Blob, filename: string): Promise<ValidationResult> {
    if (!blob) {
      throw new Error("Validation Error: Processed file is missing or null.");
    }

    if (blob.size < 32) {
      throw new Error(`Validation Error: Processed file "${filename}" is corrupted or empty (size: ${blob.size} bytes).`);
    }

    const ext = filename.split('.').pop()?.toLowerCase() || '';

    switch (ext) {
      case 'pdf':
        return await this.validatePdf(blob, filename);
      case 'docx':
      case 'doc':
        return await this.validateDocx(blob, filename);
      case 'xlsx':
      case 'xls':
      case 'csv':
        return await this.validateXlsx(blob, filename);
      case 'pptx':
      case 'ppt':
        return await this.validatePptx(blob, filename);
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        return await this.validateImage(blob, filename);
      case 'zip':
        return await this.validateZip(blob, filename);
      case 'txt':
      case 'md':
      case 'html':
        return await this.validateText(blob, filename);
      default:
        return { isValid: true, fileType: ext, metadata: { size: blob.size } };
    }
  },

  async validatePdf(blob: Blob, filename: string): Promise<ValidationResult> {
    try {
      const buffer = await blob.arrayBuffer();
      // Verify PDF Magic Bytes (%PDF)
      const header = new Uint8Array(buffer.slice(0, 5));
      const headerStr = String.fromCharCode(...header);
      if (!headerStr.startsWith('%PDF')) {
        throw new Error("Invalid PDF header format: Missing %PDF signature.");
      }

      // Load with pdf-lib to ensure structural integrity
      const pdf = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
      const pageCount = pdf.getPageCount();

      if (pageCount === 0) {
        throw new Error("PDF document contains 0 valid pages.");
      }

      return {
        isValid: true,
        fileType: 'PDF',
        metadata: { pageCount, size: blob.size }
      };
    } catch (err: any) {
      throw new Error(`Output PDF integrity check failed for "${filename}": ${err.message || 'Corrupted structure'}`);
    }
  },

  async validateDocx(blob: Blob, filename: string): Promise<ValidationResult> {
    try {
      const buffer = await blob.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);

      // Verify OpenXML document file exists
      const docXml = zip.file('word/document.xml');
      if (!docXml) {
        throw new Error("Invalid DOCX OpenXML archive: Missing word/document.xml");
      }

      const xmlText = await docXml.async('text');
      if (!xmlText.includes('<w:body>') && !xmlText.includes('<w:document')) {
        throw new Error("Invalid DOCX structure: Missing w:body or w:document element.");
      }

      return {
        isValid: true,
        fileType: 'DOCX',
        metadata: { size: blob.size, entries: Object.keys(zip.files).length }
      };
    } catch (err: any) {
      throw new Error(`Output DOCX validation failed for "${filename}": ${err.message || 'Corrupted archive'}`);
    }
  },

  async validateXlsx(blob: Blob, filename: string): Promise<ValidationResult> {
    try {
      const buffer = await blob.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });

      if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
        throw new Error("Invalid Spreadsheet: Workbook contains no sheets.");
      }

      return {
        isValid: true,
        fileType: 'XLSX',
        metadata: { sheetCount: wb.SheetNames.length, sheetNames: wb.SheetNames, size: blob.size }
      };
    } catch (err: any) {
      throw new Error(`Spreadsheet validation failed for "${filename}": ${err.message || 'Corrupted workbook'}`);
    }
  },

  async validatePptx(blob: Blob, filename: string): Promise<ValidationResult> {
    try {
      const buffer = await blob.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);

      // Check for presentation.xml or [Content_Types].xml
      const hasContentTypes = !!zip.file('[Content_Types].xml');
      const hasPresentation = !!zip.file('ppt/presentation.xml');

      if (!hasContentTypes && !hasPresentation) {
        throw new Error("Invalid PPTX OpenXML archive: Missing presentation metadata.");
      }

      return {
        isValid: true,
        fileType: 'PPTX',
        metadata: { size: blob.size }
      };
    } catch (err: any) {
      throw new Error(`PowerPoint validation failed for "${filename}": ${err.message || 'Corrupted presentation'}`);
    }
  },

  async validateImage(blob: Blob, filename: string): Promise<ValidationResult> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve({ isValid: true, fileType: 'IMAGE', metadata: { size: blob.size } });
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
          reject(new Error(`Output image "${filename}" has 0x0 dimensions.`));
        } else {
          resolve({
            isValid: true,
            fileType: 'IMAGE',
            metadata: { width: img.naturalWidth, height: img.naturalHeight, size: blob.size }
          });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Output image "${filename}" could not be decoded. File may be corrupted.`));
      };
      img.src = url;
    });
  },

  async validateZip(blob: Blob, filename: string): Promise<ValidationResult> {
    try {
      const buffer = await blob.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const keys = Object.keys(zip.files);
      if (keys.length === 0) {
        throw new Error("ZIP bundle archive contains no files.");
      }
      return {
        isValid: true,
        fileType: 'ZIP',
        metadata: { fileCount: keys.length, size: blob.size }
      };
    } catch (err: any) {
      throw new Error(`ZIP validation failed for "${filename}": ${err.message || 'Corrupted archive'}`);
    }
  },

  async validateText(blob: Blob, filename: string): Promise<ValidationResult> {
    try {
      const text = await blob.text();
      if (text.length === 0) {
        throw new Error("Generated text output file is empty.");
      }
      return {
        isValid: true,
        fileType: 'TEXT',
        metadata: { length: text.length, size: blob.size }
      };
    } catch (err: any) {
      throw new Error(`Text document validation failed for "${filename}": ${err.message}`);
    }
  }
};
