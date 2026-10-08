import React, { useState, useEffect, useRef } from 'react';
import { 
  FileCode, Download, Copy, Check, Upload, Eye, Columns, 
  Bold, Italic, Heading1, Heading2, List, ListOrdered, Code, 
  Quote, Table, CheckSquare, Link as LinkIcon, Minus
} from 'lucide-react';
import { marked } from 'marked';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Button } from '../Button';
import { cleanTextForPdf, cleanMultiLineTextForPdf } from '../../src/utils/pdfSanitizer';

interface MarkdownToPdfWorkspaceProps {
  onComplete: (blob: Blob, filename: string) => void;
  isProcessing?: boolean;
}

const MD_TEMPLATES = [
  {
    id: 'readme',
    name: 'README Doc',
    content: `# Universal Document Suite
A high-performance document conversion and processing engine built for modern workflows.

## Key Features
- **Real-Time Conversion:** Instant sub-second export to standardized ISO 32000-1 PDF.
- **Privacy First:** Client-side processing with IndexedDB persistence and offline caching.
- **Universal Formats:** Full support for Markdown, Word, Excel, PowerPoint, CSV, HTML, and Images.

### Verification Matrix
| Format | Input Support | Live Preview | Output Fidelity |
| :--- | :--- | :--- | :--- |
| Markdown | \`.md\`, \`.markdown\` | Yes | 100% GFM |
| Word | \`.docx\`, \`.doc\` | Yes | Full Layout |
| Excel | \`.xlsx\`, \`.xls\` | Yes | Multi-Sheet |

> **Security Guarantee:** All document operations are cryptographically verified and signed.`
  },
  {
    id: 'spec',
    name: 'Technical Spec',
    content: `# Architecture Specification: Document Vault
**Author:** Engineering Team  
**Status:** Approved  
**Version:** 2.4.0  

---

## 1. System Overview
Provides an encrypted document storage vault and high-fidelity rendering pipeline.

\`\`\`typescript
interface StoredDocument {
  id: string;
  name: string;
  timestamp: number;
  dataUrl?: string;
  type: string;
}
\`\`\`

## 2. Security Requirements
1. [x] Zero-trust offline local IndexedDB caching
2. [x] Real-time cross-tab synchronization
3. [x] Automated 5-year retention lifecycle`
  }
];

export const MarkdownToPdfWorkspace: React.FC<MarkdownToPdfWorkspaceProps> = ({ onComplete, isProcessing = false }) => {
  const [markdown, setMarkdown] = useState<string>(MD_TEMPLATES[0].content);
  const [parsedHtml, setParsedHtml] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>('Document.md');
  const [theme, setTheme] = useState<'github' | 'academic' | 'modern'>('github');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [copied, setCopied] = useState<boolean>(false);
  const [localProcessing, setLocalProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const html = await marked.parse(markdown);
        setParsedHtml(html);
      } catch (_) {
        setParsedHtml(markdown);
      }
    })();
  }, [markdown]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocTitle(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setMarkdown((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const insertSyntax = (prefix: string, suffix: string = '') => {
    setMarkdown(prev => prev + `\n${prefix}Text${suffix}`);
  };

  const generatePdf = async () => {
    setLocalProcessing(true);
    setStatusMessage('Generating high-fidelity PDF from Markdown document...');
    try {
      // Create high-fidelity markdown file post request
      const fileObj = new File([markdown], docTitle, { type: 'text/markdown' });
      const formData = new FormData();
      formData.append("file", fileObj);
      formData.append("conversionType", "markdown-to-pdf");
      formData.append("theme", theme);

      const res = await fetch("/api/convert", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const pdfBlob = await res.blob();
        const cleanName = docTitle.replace(/\.[^/.]+$/, '') + '.pdf';
        
        const objUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = objUrl;
        link.download = cleanName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(objUrl), 10000);

        onComplete(pdfBlob, cleanName);
        return;
      }
    } catch (err) {
      console.warn('Server Markdown-to-PDF failed, falling back to local layout renderer:', err);
    } finally {
      setLocalProcessing(false);
      setStatusMessage('');
    }

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      let page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Header Banner on first page
      page.drawRectangle({
        x: 0,
        y: pageHeight - 65,
        width: pageWidth,
        height: 65,
        color: rgb(0.1, 0.12, 0.16)
      });
      page.drawText(cleanTextForPdf(docTitle.replace(/\.[^/.]+$/, '')), {
        x: 40,
        y: pageHeight - 38,
        size: 15,
        font: fontBold,
        color: rgb(1, 1, 1)
      });
      page.drawText('Markdown Document • Export', {
        x: 40,
        y: pageHeight - 54,
        size: 8.5,
        font,
        color: rgb(0.8, 0.85, 0.9)
      });

      const sanitizedMd = cleanMultiLineTextForPdf(markdown);
      const rawLines = sanitizedMd.split(/\r?\n/);
      let y = pageHeight - 95;
      let inCodeBlock = false;

      for (const line of rawLines) {
        if (y < 60) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - 60;
        }

        if (line.startsWith('```')) {
          inCodeBlock = !inCodeBlock;
          continue;
        }

        const isHeader1 = line.startsWith('# ');
        const isHeader2 = line.startsWith('## ');
        const isHeader3 = line.startsWith('### ');
        const isHeader = isHeader1 || isHeader2 || isHeader3;
        const isBullet = line.startsWith('- ') || line.startsWith('* ');
        const isQuote = line.startsWith('> ');

        const cleanLine = cleanTextForPdf(line.replace(/^[#\-*>\s]+/, '')).slice(0, 85);

        if (isHeader) {
          y -= 8;
          page.drawText(cleanLine, {
            x: 40,
            y,
            size: isHeader1 ? 15 : isHeader2 ? 13 : 11,
            font: fontBold,
            color: rgb(0.1, 0.15, 0.25)
          });
          y -= isHeader1 ? 22 : 18;
        } else if (inCodeBlock) {
          page.drawRectangle({
            x: 38,
            y: y - 2,
            width: pageWidth - 76,
            height: 14,
            color: rgb(0.95, 0.95, 0.97)
          });
          page.drawText(cleanLine, {
            x: 45,
            y,
            size: 9,
            font: fontMono,
            color: rgb(0.2, 0.25, 0.35)
          });
          y -= 15;
        } else if (isQuote) {
          page.drawLine({
            start: { x: 42, y: y + 10 },
            end: { x: 42, y: y - 2 },
            thickness: 2,
            color: rgb(0.4, 0.45, 0.8)
          });
          page.drawText(cleanLine, {
            x: 50,
            y,
            size: 9.5,
            font,
            color: rgb(0.3, 0.35, 0.4)
          });
          y -= 16;
        } else if (isBullet) {
          page.drawCircle({
            x: 46,
            y: y + 3,
            size: 2,
            color: rgb(0.3, 0.35, 0.4)
          });
          page.drawText(cleanLine, {
            x: 54,
            y,
            size: 9.5,
            font,
            color: rgb(0.15, 0.15, 0.2)
          });
          y -= 15;
        } else if (cleanLine) {
          page.drawText(cleanLine, {
            x: 40,
            y,
            size: 9.5,
            font,
            color: rgb(0.15, 0.15, 0.2)
          });
          y -= 14;
        } else {
          y -= 8;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const cleanName = docTitle.replace(/\.[^/.]+$/, '') + '.pdf';

      try {
        const objUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = objUrl;
        link.download = cleanName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(objUrl), 10000);
      } catch (_) {}

      onComplete(pdfBlob, cleanName);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {localProcessing && (
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 rounded-3xl p-6 shadow-md text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">{statusMessage}</p>
          <p className="text-xs text-purple-600 dark:text-purple-400">Rendering structured headings, code snippets, blockquotes, and tables...</p>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-xs shrink-0">
            <FileCode size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="font-bold text-stone-900 dark:text-white text-base bg-transparent border-b border-dashed border-stone-300 dark:border-stone-700 hover:border-purple-500 focus:border-purple-500 focus:outline-none w-full max-w-xs truncate"
            />
            <p className="text-xs text-stone-500 mt-0.5">Markdown Live Editor & PDF Renderer</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".md,.markdown,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={localProcessing}
            className="px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Upload size={14} />
            <span>Open .MD</span>
          </button>
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${viewMode === 'split' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500'}`}
              title="Split View"
            >
              <Columns size={14} />
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${viewMode === 'edit' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500'}`}
              title="Editor Only"
            >
              <FileCode size={14} />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500'}`}
              title="Preview Only"
            >
              <Eye size={14} />
            </button>
          </div>
          <Button
            onClick={generatePdf}
            disabled={isProcessing || localProcessing || !markdown.trim()}
            className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Download size={15} />
            <span>Convert to PDF</span>
          </Button>
        </div>
      </div>

      {/* Markdown Quick Syntax Toolbar */}
      <div className="bg-stone-100 dark:bg-stone-950 p-2 rounded-2xl flex items-center gap-1 flex-wrap text-xs">
        <button onClick={() => insertSyntax('**', '**')} className="p-2 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-stone-700 dark:text-stone-300 font-bold" title="Bold"><Bold size={14} /></button>
        <button onClick={() => insertSyntax('*', '*')} className="p-2 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-stone-700 dark:text-stone-300 font-bold" title="Italic"><Italic size={14} /></button>
        <button onClick={() => insertSyntax('# ')} className="p-2 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-stone-700 dark:text-stone-300 font-bold" title="H1"><Heading1 size={14} /></button>
        <button onClick={() => insertSyntax('## ')} className="p-2 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-stone-700 dark:text-stone-300 font-bold" title="H2"><Heading2 size={14} /></button>
        <button onClick={() => insertSyntax('- ')} className="p-2 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-stone-700 dark:text-stone-300 font-bold" title="Bullet List"><List size={14} /></button>
        <button onClick={() => insertSyntax('1. ')} className="p-2 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-stone-700 dark:text-stone-300 font-bold" title="Numbered List"><ListOrdered size={14} /></button>
        <button onClick={() => insertSyntax('```typescript\n', '\n```')} className="p-2 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-stone-700 dark:text-stone-300 font-bold" title="Code Block"><Code size={14} /></button>
        <button onClick={() => insertSyntax('> ')} className="p-2 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-stone-700 dark:text-stone-300 font-bold" title="Quote"><Quote size={14} /></button>
        <button onClick={() => insertSyntax('| Column 1 | Column 2 |\n| :--- | :--- |\n| Data A | Data B |')} className="p-2 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-stone-700 dark:text-stone-300 font-bold" title="Table"><Table size={14} /></button>
        <button onClick={() => insertSyntax('- [ ] ')} className="p-2 hover:bg-white dark:hover:bg-stone-800 rounded-lg text-stone-700 dark:text-stone-300 font-bold" title="Task List"><CheckSquare size={14} /></button>
      </div>

      {/* Editor & Preview Panes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[500px]">
        {viewMode !== 'preview' && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-6 flex flex-col">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Markdown Editor</span>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full flex-1 font-mono text-xs sm:text-sm bg-transparent resize-none focus:outline-none text-stone-900 dark:text-stone-100 min-h-[420px]"
            />
          </div>
        )}

        {viewMode !== 'edit' && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 flex flex-col overflow-y-auto max-h-[600px] prose dark:prose-invert max-w-none text-xs sm:text-sm">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 not-prose">Live HTML Output</span>
            <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />
          </div>
        )}
      </div>
    </div>
  );
};
