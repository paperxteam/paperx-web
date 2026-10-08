import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  Combine,
  Scissors,
  RotateCw,
  Trash2,
  Minimize2,
  Wrench,
  Search,
  Lock,
  Unlock,
  Stamp,
  Sparkles,
  Languages,
  ScanLine,
  ArrowRightLeft,
  Edit3,
  Folder,
  Type,
  ImagePlus,
  EyeOff,
  FileSignature,
  Archive,
  Crop,
  FileDiff,
  FileCheck,
  Copy,
  Table,
  Layers,
  Volume2,
  Grid,
  FileJson,
  Wand2,
  Palette,
  Eraser,
  Sliders,
  QrCode,
  Award
} from 'lucide-react';
import { Tool, ToolCategory, User } from './types';

export const APP_NAME = "𝕻𝖆𝖕𝖊𝖗𝖃";
export const APP_BRAND_MARK = "𝕻𝖆𝖕𝖊𝖗𝖃";

export const TOOLS: Tool[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. CONVERT TO PDF
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { 
    id: 'jpg-to-pdf', 
    name: 'JPG to PDF', 
    description: 'Convert JPG, PNG, WEBP, and camera photos into a unified PDF document.', 
    category: ToolCategory.CONVERT_TO, 
    icon: ImagePlus, 
    isPopular: true, 
    requiredPlan: 'Free',
    inputFormats: ['JPG', 'PNG', 'WEBP'],
    outputFormat: 'PDF',
    tags: ['convert', 'jpg', 'png', 'images', 'photos', 'pdf']
  },
  { 
    id: 'word-to-pdf', 
    name: 'Word to PDF', 
    description: 'Convert Microsoft Word DOC and DOCX documents to standardized PDF format.', 
    category: ToolCategory.CONVERT_TO, 
    icon: FileText, 
    isPopular: true, 
    requiredPlan: 'Pro',
    inputFormats: ['DOCX', 'DOC'],
    outputFormat: 'PDF',
    tags: ['convert', 'word', 'doc', 'docx', 'pdf']
  },
  { 
    id: 'powerpoint-to-pdf', 
    name: 'PowerPoint to PDF', 
    description: 'Convert Microsoft PowerPoint PPT and PPTX presentations to PDF slides.', 
    category: ToolCategory.CONVERT_TO, 
    icon: FileText, 
    requiredPlan: 'Pro',
    inputFormats: ['PPTX', 'PPT'],
    outputFormat: 'PDF',
    tags: ['convert', 'powerpoint', 'ppt', 'pptx', 'slides', 'pdf']
  },
  { 
    id: 'excel-to-pdf', 
    name: 'Excel to PDF', 
    description: 'Convert Microsoft Excel XLS and XLSX spreadsheets to clean PDF reports.', 
    category: ToolCategory.CONVERT_TO, 
    icon: FileSpreadsheet, 
    requiredPlan: 'Pro',
    inputFormats: ['XLSX', 'XLS'],
    outputFormat: 'PDF',
    tags: ['convert', 'excel', 'xls', 'xlsx', 'spreadsheet', 'pdf']
  },
  { 
    id: 'html-to-pdf', 
    name: 'HTML to PDF', 
    description: 'Convert HTML web pages or code files into a clean PDF document.', 
    category: ToolCategory.CONVERT_TO, 
    icon: FileCode, 
    requiredPlan: 'Max',
    inputFormats: ['HTML', 'HTM'],
    outputFormat: 'PDF',
    tags: ['convert', 'html', 'web', 'code', 'pdf']
  },
  { 
    id: 'txt-to-pdf', 
    name: 'TXT to PDF', 
    description: 'Convert plain text (.txt) and notes into a formatted PDF document.', 
    category: ToolCategory.CONVERT_TO, 
    icon: FileText, 
    requiredPlan: 'Free',
    inputFormats: ['TXT'],
    outputFormat: 'PDF',
    tags: ['convert', 'txt', 'text', 'plain', 'pdf']
  },
  { 
    id: 'markdown-to-pdf', 
    name: 'Markdown to PDF', 
    description: 'Render Markdown (.md) documents and notes into beautiful PDF files.', 
    category: ToolCategory.CONVERT_TO, 
    icon: FileCode, 
    requiredPlan: 'Free',
    inputFormats: ['MD', 'MARKDOWN'],
    outputFormat: 'PDF',
    tags: ['convert', 'markdown', 'md', 'readme', 'pdf']
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. CONVERT FROM PDF & DOCUMENT CONVERSIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { 
    id: 'pdf-to-jpg', 
    name: 'PDF to JPG', 
    description: 'Extract every page from your PDF into crisp, high-resolution JPG images.', 
    category: ToolCategory.CONVERT_FROM, 
    icon: ImageIcon, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'JPG / ZIP',
    tags: ['convert', 'pdf', 'jpg', 'images', 'photos']
  },
  { 
    id: 'pdf-to-png', 
    name: 'PDF to PNG', 
    description: 'Render PDF pages into lossless high-resolution PNG image files.', 
    category: ToolCategory.CONVERT_FROM, 
    icon: ImageIcon, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'PNG / ZIP',
    tags: ['convert', 'pdf', 'png', 'images', 'lossless']
  },
  { 
    id: 'pdf-to-word', 
    name: 'PDF to Word', 
    description: 'Convert PDF documents into editable Microsoft Word (.docx) files.', 
    category: ToolCategory.CONVERT_FROM, 
    icon: FileText, 
    isPopular: true, 
    requiredPlan: 'Pro',
    inputFormats: ['PDF'],
    outputFormat: 'DOCX',
    tags: ['convert', 'pdf', 'word', 'doc', 'docx', 'editable']
  },
  { 
    id: 'pdf-to-excel', 
    name: 'PDF to Excel', 
    description: 'Extract tables and structured data from PDF into Excel (.xlsx) spreadsheets.', 
    category: ToolCategory.CONVERT_FROM, 
    icon: FileSpreadsheet, 
    requiredPlan: 'Max',
    inputFormats: ['PDF'],
    outputFormat: 'XLSX',
    tags: ['convert', 'pdf', 'excel', 'xlsx', 'tables', 'spreadsheet']
  },
  { 
    id: 'pdf-to-powerpoint', 
    name: 'PDF to PowerPoint', 
    description: 'Convert PDF slides into editable Microsoft PowerPoint (.pptx) presentations.', 
    category: ToolCategory.CONVERT_FROM, 
    icon: FileText, 
    requiredPlan: 'Max',
    inputFormats: ['PDF'],
    outputFormat: 'PPTX',
    tags: ['convert', 'pdf', 'powerpoint', 'pptx', 'slides', 'deck']
  },
  { 
    id: 'pdf-to-txt', 
    name: 'PDF to Text', 
    description: 'Extract all plain text content from your PDF into a clean .txt file.', 
    category: ToolCategory.CONVERT_FROM, 
    icon: FileText, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'TXT',
    tags: ['convert', 'pdf', 'txt', 'text', 'extract']
  },
  { 
    id: 'pdf-to-markdown', 
    name: 'PDF to Markdown', 
    description: 'Extract and format PDF content into clean, structured Markdown (.md).', 
    category: ToolCategory.CONVERT_FROM, 
    icon: FileCode, 
    requiredPlan: 'Max',
    inputFormats: ['PDF'],
    outputFormat: 'MD',
    tags: ['convert', 'pdf', 'markdown', 'md', 'structured']
  },
  { 
    id: 'pdf-to-html', 
    name: 'PDF to HTML', 
    description: 'Convert PDF content into structured, responsive HTML web pages.', 
    category: ToolCategory.CONVERT_FROM, 
    icon: FileCode, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'HTML',
    tags: ['convert', 'pdf', 'html', 'web', 'code', 'structure']
  },
  { 
    id: 'pdf-to-pdfa', 
    name: 'PDF to PDF/A', 
    description: 'Convert PDF documents to ISO standard PDF/A format for legal archiving.', 
    category: ToolCategory.CONVERT_FROM, 
    icon: Archive, 
    requiredPlan: 'Max',
    inputFormats: ['PDF'],
    outputFormat: 'PDF/A',
    tags: ['convert', 'pdf', 'pdfa', 'archive', 'iso']
  },
  { 
    id: 'pdf-to-csv', 
    name: 'PDF to CSV / Tables', 
    description: 'Extract raw tables and matrix data directly from PDF into standardized CSV spreadsheet files.', 
    category: ToolCategory.CONVERT_FROM, 
    icon: Table, 
    requiredPlan: 'Pro',
    inputFormats: ['PDF'],
    outputFormat: 'CSV',
    tags: ['pdf', 'csv', 'tables', 'data', 'extract']
  },
  { 
    id: 'csv-to-xlsx', 
    name: 'CSV to Excel (XLSX)', 
    description: 'Convert raw CSV data files into formatted Microsoft Excel workbooks.', 
    category: ToolCategory.CONVERT_FROM, 
    icon: FileSpreadsheet, 
    requiredPlan: 'Free',
    inputFormats: ['CSV'],
    outputFormat: 'XLSX',
    tags: ['convert', 'csv', 'excel', 'xlsx', 'spreadsheet']
  },
  { 
    id: 'txt-to-docx', 
    name: 'TXT to Word (DOCX)', 
    description: 'Convert plain text notes or logs into a styled Microsoft Word document.', 
    category: ToolCategory.CONVERT_FROM, 
    icon: FileText, 
    requiredPlan: 'Free',
    inputFormats: ['TXT'],
    outputFormat: 'DOCX',
    tags: ['convert', 'txt', 'word', 'docx', 'text']
  },
  { 
    id: 'markdown-to-docx', 
    name: 'Markdown to DOCX', 
    description: 'Transform Markdown headings, lists, and quotes into native Word documents.', 
    category: ToolCategory.CONVERT_FROM, 
    icon: FileCode, 
    requiredPlan: 'Free',
    inputFormats: ['MD'],
    outputFormat: 'DOCX',
    tags: ['convert', 'markdown', 'word', 'docx', 'md']
  },
  { 
    id: 'docx-to-txt', 
    name: 'DOCX to TXT', 
    description: 'Extract all editable plain text content from Microsoft Word DOCX files.', 
    category: ToolCategory.CONVERT_FROM, 
    icon: FileText, 
    requiredPlan: 'Free',
    inputFormats: ['DOCX'],
    outputFormat: 'TXT',
    tags: ['convert', 'word', 'docx', 'txt', 'text', 'extract']
  },
  { 
    id: 'docx-to-html', 
    name: 'DOCX to HTML', 
    description: 'Convert Microsoft Word DOCX files into beautiful responsive HTML documents.', 
    category: ToolCategory.CONVERT_FROM, 
    icon: FileCode, 
    requiredPlan: 'Free',
    inputFormats: ['DOCX'],
    outputFormat: 'HTML',
    tags: ['convert', 'word', 'docx', 'html', 'web', 'code']
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. OPTIMIZE & OCR
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { 
    id: 'compress-pdf', 
    name: 'Compress PDF', 
    description: 'Reduce PDF file size while preserving high visual quality and typography.', 
    category: ToolCategory.OPTIMIZE, 
    icon: Minimize2, 
    isPopular: true, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['compress', 'shrink', 'reduce', 'size', 'optimize']
  },
  { 
    id: 'compress-image', 
    name: 'Compress Images', 
    description: 'Optimize JPG, PNG, and WEBP photos with smart compression balancing.', 
    category: ToolCategory.OPTIMIZE, 
    icon: ImageIcon, 
    requiredPlan: 'Free',
    inputFormats: ['JPG', 'PNG', 'WEBP'],
    outputFormat: 'JPG / PNG',
    tags: ['compress', 'image', 'photo', 'shrink', 'reduce']
  },
  { 
    id: 'repair-pdf', 
    name: 'Repair PDF', 
    description: 'Recover, rebuild, and fix corrupt, broken, or damaged PDF documents.', 
    category: ToolCategory.OPTIMIZE, 
    icon: Wrench, 
    requiredPlan: 'Pro',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['repair', 'fix', 'recover', 'corrupt', 'broken']
  },
  { 
    id: 'ocr-pdf', 
    name: 'OCR PDF', 
    description: 'Make scanned and raster documents fully searchable and selectable with OCR.', 
    category: ToolCategory.OPTIMIZE, 
    icon: Search, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'Searchable PDF',
    tags: ['ocr', 'searchable', 'text', 'recognize', 'scan']
  },
  { 
    id: 'image-to-text', 
    name: 'Image to Text (OCR)', 
    description: 'Extract editable text from any photo, receipt, or scanned snapshot.', 
    category: ToolCategory.OPTIMIZE, 
    icon: FileText, 
    requiredPlan: 'Free',
    inputFormats: ['JPG', 'PNG', 'WEBP'],
    outputFormat: 'TXT / DOCX',
    tags: ['ocr', 'extract', 'read', 'photo', 'text']
  },
  { 
    id: 'flatten-pdf', 
    name: 'Flatten PDF', 
    description: 'Flatten all interactive forms, annotations, and visual layers into permanent uneditable PDF graphics.', 
    category: ToolCategory.OPTIMIZE, 
    icon: Layers, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'Flattened PDF',
    tags: ['flatten', 'layers', 'lock', 'permanent', 'graphics']
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. ORGANIZE & PAGES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { 
    id: 'merge-pdf', 
    name: 'Merge PDF', 
    description: 'Combine multiple PDFs into one unified document in any custom order.', 
    category: ToolCategory.ORGANIZE, 
    icon: Combine, 
    isPopular: true, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['merge', 'combine', 'join', 'pdf', 'unite']
  },
  { 
    id: 'merge-docx', 
    name: 'Merge DOCX', 
    description: 'Combine multiple Word documents with custom page breaks, TOC, and style options.', 
    category: ToolCategory.ORGANIZE, 
    icon: FileText, 
    isPopular: true, 
    requiredPlan: 'Free',
    inputFormats: ['DOCX', 'DOC'],
    outputFormat: 'DOCX / PDF',
    tags: ['merge', 'word', 'combine', 'docx', 'documents']
  },
  { 
    id: 'merge-xlsx', 
    name: 'Merge XLSX', 
    description: 'Combine multiple Excel spreadsheets into a single multi-tab workbook.', 
    category: ToolCategory.ORGANIZE, 
    icon: FileSpreadsheet, 
    isPopular: true, 
    requiredPlan: 'Free',
    inputFormats: ['XLSX', 'XLS', 'CSV'],
    outputFormat: 'XLSX',
    tags: ['merge', 'excel', 'sheets', 'combine', 'spreadsheet', 'workbook']
  },
  { 
    id: 'merge-pptx', 
    name: 'Merge PPTX', 
    description: 'Combine multiple PowerPoint presentations into one unified presentation deck.', 
    category: ToolCategory.ORGANIZE, 
    icon: FileText, 
    requiredPlan: 'Free',
    inputFormats: ['PPTX', 'PPT'],
    outputFormat: 'PPTX / PDF',
    tags: ['merge', 'powerpoint', 'pptx', 'combine', 'slides', 'deck']
  },
  { 
    id: 'merge-images', 
    name: 'Merge Images', 
    description: 'Stitch and combine multiple photos into one high-resolution image.', 
    category: ToolCategory.ORGANIZE, 
    icon: ImageIcon, 
    requiredPlan: 'Free',
    inputFormats: ['JPG', 'PNG', 'WEBP'],
    outputFormat: 'PNG / PDF',
    tags: ['merge', 'images', 'stitch', 'photos', 'combine', 'pictures']
  },
  { 
    id: 'split-pdf', 
    name: 'Split PDF', 
    description: 'Separate one page or an entire set of pages for easy extraction and sharing.', 
    category: ToolCategory.ORGANIZE, 
    icon: Scissors, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'PDF / ZIP',
    tags: ['split', 'cut', 'separate', 'extract', 'pages']
  },
  { 
    id: 'split-docx', 
    name: 'Split DOCX', 
    description: 'Split a Microsoft Word DOCX document into separate chapter or page segments.', 
    category: ToolCategory.ORGANIZE, 
    icon: Scissors, 
    requiredPlan: 'Free',
    inputFormats: ['DOCX'],
    outputFormat: 'ZIP (DOCX)',
    tags: ['split', 'word', 'docx', 'separate', 'document']
  },
  { 
    id: 'split-xlsx', 
    name: 'Split XLSX', 
    description: 'Split a multi-sheet Excel workbook into individual single-sheet workbooks.', 
    category: ToolCategory.ORGANIZE, 
    icon: FileSpreadsheet, 
    requiredPlan: 'Free',
    inputFormats: ['XLSX', 'XLS'],
    outputFormat: 'ZIP (XLSX)',
    tags: ['split', 'excel', 'sheets', 'separate', 'workbook']
  },
  { 
    id: 'split-pptx', 
    name: 'Split PPTX', 
    description: 'Split a PowerPoint presentation deck into separate slide files.', 
    category: ToolCategory.ORGANIZE, 
    icon: Scissors, 
    requiredPlan: 'Free',
    inputFormats: ['PPTX', 'PPT'],
    outputFormat: 'ZIP (PPTX)',
    tags: ['split', 'powerpoint', 'pptx', 'separate', 'slides']
  },
  { 
    id: 'organize-pdf', 
    name: 'Organize / Reorder PDF', 
    description: 'Sort, reorder, and structure pages visually in your document.', 
    category: ToolCategory.ORGANIZE, 
    icon: Folder, 
    requiredPlan: 'Pro',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['organize', 'reorder', 'sort', 'arrange', 'pages']
  },
  { 
    id: 'extract-pages', 
    name: 'Extract Pages', 
    description: 'Extract specific page numbers or custom page ranges into a new PDF.', 
    category: ToolCategory.ORGANIZE, 
    icon: Scissors, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['extract', 'pages', 'select', 'isolate']
  },
  { 
    id: 'remove-pages', 
    name: 'Remove Pages', 
    description: 'Delete unwanted, duplicate, or blank pages from your PDF document.', 
    category: ToolCategory.ORGANIZE, 
    icon: Trash2, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['remove', 'delete', 'cut', 'blank', 'pages']
  },
  { 
    id: 'replace-pages', 
    name: 'Replace Pages', 
    description: 'Replace specific pages in your PDF with pages from another document.', 
    category: ToolCategory.ORGANIZE, 
    icon: ArrowRightLeft, 
    requiredPlan: 'Pro',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['replace', 'swap', 'substitute', 'pages']
  },
  { 
    id: 'insert-pages', 
    name: 'Insert Pages', 
    description: 'Insert blank pages or pages from another document at any position.', 
    category: ToolCategory.ORGANIZE, 
    icon: Folder, 
    requiredPlan: 'Pro',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['insert', 'add', 'append', 'pages']
  },
  { 
    id: 'duplicate-pages', 
    name: 'Duplicate Pages', 
    description: 'Duplicate chosen pages or repeat pages across your PDF document.', 
    category: ToolCategory.ORGANIZE, 
    icon: Copy, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['duplicate', 'clone', 'copy', 'repeat', 'pages']
  },
  { 
    id: 'nup-pdf', 
    name: 'Pages per Sheet (N-Up)', 
    description: 'Arrange 2, 4, 8, or 16 PDF pages onto a single sheet for compact reading and booklet printing.', 
    category: ToolCategory.ORGANIZE, 
    icon: Grid, 
    requiredPlan: 'Pro',
    inputFormats: ['PDF'],
    outputFormat: 'Multi-Page Sheet PDF',
    tags: ['nup', 'booklet', 'grid', 'pages per sheet', 'print']
  },
  { 
    id: 'scan-pdf', 
    name: 'Scan to PDF', 
    description: 'Scan physical pages using your camera or photos straight to PDF.', 
    category: ToolCategory.ORGANIZE, 
    icon: ScanLine, 
    isPopular: true, 
    requiredPlan: 'Free',
    inputFormats: ['Camera', 'JPG', 'PNG'],
    outputFormat: 'PDF',
    tags: ['scan', 'camera', 'photo', 'capture', 'live']
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. SECURITY & SIGN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { 
    id: 'protect-pdf', 
    name: 'Protect PDF', 
    description: 'Add standard password encryption to restrict unauthorized access.', 
    category: ToolCategory.SECURITY, 
    icon: Lock, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'Protected PDF',
    tags: ['protect', 'password', 'encrypt', 'lock', 'security']
  },
  { 
    id: 'unlock-pdf', 
    name: 'Unlock PDF', 
    description: 'Remove passwords and permissions security from authorized PDF files.', 
    category: ToolCategory.SECURITY, 
    icon: Unlock, 
    requiredPlan: 'Max',
    inputFormats: ['PDF'],
    outputFormat: 'Unlocked PDF',
    tags: ['unlock', 'password', 'decrypt', 'open', 'security']
  },
  { 
    id: 'sign-pdf', 
    name: 'Sign PDF', 
    description: 'Draw or upload your digital signature to sign agreements and forms.', 
    category: ToolCategory.SECURITY, 
    icon: FileSignature, 
    requiredPlan: 'Max',
    inputFormats: ['PDF'],
    outputFormat: 'Signed PDF',
    tags: ['sign', 'signature', 'e-sign', 'contract', 'agreement']
  },
  { 
    id: 'redact-pdf', 
    name: 'Redact PDF', 
    description: 'Permanently remove and blackout sensitive information from pages.', 
    category: ToolCategory.SECURITY, 
    icon: EyeOff, 
    requiredPlan: 'Max',
    inputFormats: ['PDF'],
    outputFormat: 'Redacted PDF',
    tags: ['redact', 'blackout', 'hide', 'privacy', 'censor']
  },
  { 
    id: 'compare-pdf', 
    name: 'Compare PDF', 
    description: 'Compare two PDF files side-by-side to highlight differences and changes.', 
    category: ToolCategory.SECURITY, 
    icon: FileDiff, 
    requiredPlan: 'Max',
    inputFormats: ['PDF (2 files)'],
    outputFormat: 'Side-by-Side View',
    tags: ['compare', 'diff', 'differences', 'changes', 'version']
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. PDF INTELLIGENCE (AI)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { 
    id: 'summarize-pdf', 
    name: 'AI Summarizer', 
    description: 'Generate concise, standard, or deep executive summaries from any PDF.', 
    category: ToolCategory.INTELLIGENCE, 
    icon: Sparkles, 
    isPopular: true, 
    requiredPlan: 'Max',
    inputFormats: ['PDF', 'DOCX'],
    outputFormat: 'Executive Summary',
    tags: ['ai', 'summarize', 'summary', 'key points', 'overview']
  },
  { 
    id: 'pdf-qa', 
    name: 'AI PDF Q&A', 
    description: 'Ask questions and receive instant answers grounded in your document.', 
    category: ToolCategory.INTELLIGENCE, 
    icon: Sparkles, 
    requiredPlan: 'Max',
    inputFormats: ['PDF', 'DOCX'],
    outputFormat: 'Interactive Answers',
    tags: ['ai', 'qa', 'questions', 'answers', 'chat', 'ask']
  },
  { 
    id: 'translate-pdf', 
    name: 'Translate PDF', 
    description: 'Translate PDF document text accurately into multiple languages.', 
    category: ToolCategory.INTELLIGENCE, 
    icon: Languages, 
    requiredPlan: 'Max',
    inputFormats: ['PDF', 'DOCX'],
    outputFormat: 'Translated PDF',
    tags: ['translate', 'multilingual', 'languages', 'foreign']
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. EDIT & MARKUP
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { 
    id: 'edit-pdf', 
    name: 'Edit & Annotate PDF', 
    description: 'Add text boxes, freehand drawing, highlights, underlines, strikethroughs, and comments to PDF.', 
    category: ToolCategory.EDIT, 
    icon: Edit3, 
    isPopular: true, 
    requiredPlan: 'Pro',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['edit', 'annotate', 'text', 'draw', 'highlight', 'shapes', 'underline', 'strikethrough', 'comments']
  },
  { 
    id: 'add-image-to-pdf', 
    name: 'Add Image to PDF', 
    description: 'Insert custom PNG or JPG images onto any page of your PDF document.', 
    category: ToolCategory.EDIT, 
    icon: ImagePlus, 
    requiredPlan: 'Free',
    inputFormats: ['PDF', 'JPG', 'PNG'],
    outputFormat: 'PDF',
    tags: ['insert', 'add image', 'stamp image', 'photo', 'pdf']
  },
  { 
    id: 'pdf-find-replace', 
    name: 'PDF Find & Replace', 
    description: 'Search for specific text phrases and replace them instantly across the entire PDF.', 
    category: ToolCategory.EDIT, 
    icon: Search, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['find', 'replace', 'search', 'edit', 'text']
  },
  { 
    id: 'rotate-pdf', 
    name: 'Rotate PDF', 
    description: 'Rotate PDF pages 90°, 180°, or 270° to the correct visual orientation.', 
    category: ToolCategory.EDIT, 
    icon: RotateCw, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['rotate', 'turn', 'orientation', 'flip', 'pages']
  },
  { 
    id: 'rotate-pages', 
    name: 'Rotate Pages', 
    description: 'Rotate selected pages in your document clockwise or counter-clockwise.', 
    category: ToolCategory.EDIT, 
    icon: RotateCw, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['rotate', 'turn', 'orientation', 'flip', 'pages']
  },
  { 
    id: 'crop-pdf', 
    name: 'Crop PDF', 
    description: 'Crop margins and adjust visible page boundaries with precision.', 
    category: ToolCategory.EDIT, 
    icon: Crop, 
    requiredPlan: 'Pro',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['crop', 'trim', 'margins', 'cut']
  },
  { 
    id: 'add-page-numbers', 
    name: 'Add Page Numbers', 
    description: 'Insert customizable page numbers, positions, and headers/footers.', 
    category: ToolCategory.EDIT, 
    icon: Type, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['numbers', 'page numbers', 'header', 'footer']
  },
  { 
    id: 'add-header-footer', 
    name: 'Add Header & Footer', 
    description: 'Stamp customized running headers, footers, dates, and dynamic metadata across all pages.', 
    category: ToolCategory.EDIT, 
    icon: Type, 
    requiredPlan: 'Pro',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['header', 'footer', 'stamp', 'metadata', 'date']
  },
  { 
    id: 'watermark-pdf', 
    name: 'Add Watermark', 
    description: 'Stamp custom text or image watermarks across your document pages.', 
    category: ToolCategory.EDIT, 
    icon: Stamp, 
    requiredPlan: 'Free',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['watermark', 'stamp', 'protect', 'brand']
  },
  { 
    id: 'pdf-forms', 
    name: 'PDF Forms', 
    description: 'Fill out interactive form fields, check boxes, and sign documents.', 
    category: ToolCategory.EDIT, 
    icon: FileCheck, 
    requiredPlan: 'Max',
    inputFormats: ['PDF'],
    outputFormat: 'PDF',
    tags: ['forms', 'fill', 'fields', 'interactive']
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. CREATORS & GENERATORS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { 
    id: 'invoice-creator', 
    name: 'Invoice Creator', 
    description: 'Create and customize professional invoices with 10 distinct design layouts, tax calculations, logos, and PDF export.', 
    category: ToolCategory.EDIT, 
    icon: FileText, 
    requiredPlan: 'Free',
    inputFormats: ['Custom'],
    outputFormat: 'PDF / PNG',
    tags: ['invoice', 'creator', 'billing', 'template', 'tax', 'receipt']
  },
  { 
    id: 'qr-code-generator', 
    name: 'QR Code Generator', 
    description: 'Design and customize high-resolution QR codes with custom colors, logos, and multiple data formats.', 
    category: ToolCategory.EDIT, 
    icon: QrCode, 
    requiredPlan: 'Free',
    inputFormats: ['Custom'],
    outputFormat: 'PNG / SVG / PDF',
    tags: ['qr', 'qrcode', 'generator', 'maker', 'barcode', 'scan']
  },
  { 
    id: 'barcode-maker', 
    name: 'Barcode Generator', 
    description: 'Generate standard barcodes including Code128, EAN-13, UPC, Code39 with custom sizing and label exports.', 
    category: ToolCategory.EDIT, 
    icon: ScanLine, 
    requiredPlan: 'Free',
    inputFormats: ['Custom'],
    outputFormat: 'PNG / PDF',
    tags: ['barcode', 'code128', 'ean13', 'upc', 'retail', 'inventory']
  },
  { 
    id: 'certificate-maker', 
    name: 'Certificate Maker', 
    description: 'Create elegant award certificates, course completions, and diplomas with luxury borders, seals, and PDF export.', 
    category: ToolCategory.EDIT, 
    icon: Award, 
    requiredPlan: 'Free',
    inputFormats: ['Custom'],
    outputFormat: 'PDF / PNG',
    tags: ['certificate', 'award', 'diploma', 'degree', 'template', 'completion']
  }
];

export const MOCK_USER: User = {
  id: 'u_123456789',
  uid: 'u_123456789',
  name: 'Alex Sterling',
  email: 'alex.sterling@paperx.io',
  avatarUrl: 'https://picsum.photos/200/200',
  plan: 'Basic Plan',
  memberSince: 'Sep 2023',
  projectsUsed: 2,  
  maxProjects: 5
};
