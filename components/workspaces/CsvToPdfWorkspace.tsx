import React, { useState, useRef } from 'react';
import { 
  Table, Download, Upload, Copy, Check, FileSpreadsheet, 
  Search, Sliders, Layout, RefreshCw
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Button } from '../Button';
import { cleanTextForPdf } from '../../src/utils/pdfSanitizer';

interface CsvToPdfWorkspaceProps {
  onComplete: (blob: Blob, filename: string) => void;
  isProcessing?: boolean;
}

const SAMPLE_CSV = `Transaction ID,Customer Name,Date,Amount ($),Payment Method,Status
TXN-9021,Alexander Wright,2026-03-15,450.00,UPI / Credit Card,Settled
TXN-9022,Sophia Martinez,2026-03-15,1250.50,Direct Bank Transfer,Settled
TXN-9023,Liam Chen,2026-03-16,89.99,Digital Wallet,Settled
TXN-9024,Emma Watson,2026-03-16,3200.00,Corporate Wire,Verified
TXN-9025,Noah Patel,2026-03-17,740.25,Enterprise Tier,Settled
TXN-9026,Olivia Taylor,2026-03-17,510.00,UPI Instant,Settled`;

export const CsvToPdfWorkspace: React.FC<CsvToPdfWorkspaceProps> = ({ onComplete, isProcessing = false }) => {
  const [csvText, setCsvText] = useState<string>(SAMPLE_CSV);
  const [docTitle, setDocTitle] = useState<string>('Transactions.csv');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [hasHeaderRow, setHasHeaderRow] = useState<boolean>(true);
  const [theme, setTheme] = useState<'slate' | 'emerald' | 'blue'>('slate');
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Parse CSV text into 2D table array
  const rows = csvText.split(/\r?\n/).map(line => {
    return line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
  }).filter(r => r.some(c => c.length > 0));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocTitle(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(csvText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConvert = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const width = orientation === 'landscape' ? 841.89 : 595.28;
      const height = orientation === 'landscape' ? 595.28 : 841.89;
      const page = pdfDoc.addPage([width, height]);

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Top banner
      page.drawRectangle({
        x: 0,
        y: height - 65,
        width: width,
        height: 65,
        color: rgb(0.12, 0.14, 0.18)
      });
      page.drawText(cleanTextForPdf(docTitle.replace(/\.[^/.]+$/, '')), {
        x: 40,
        y: height - 38,
        size: 15,
        font: fontBold,
        color: rgb(1, 1, 1)
      });
      page.drawText(`CSV Data Table Export • ${rows.length} total rows`, {
        x: 40,
        y: height - 54,
        size: 8.5,
        font: font,
        color: rgb(0.8, 0.85, 0.9)
      });

      // Render CSV table with multi-page support
      const rowHeight = 20;
      const colCount = Math.max(1, rows[0]?.length || 1);
      const colWidth = (width - 80) / colCount;
      let currentY = height - 90;
      let currentPage = page;

      rows.forEach((row, rIdx) => {
        if (currentY < 40) {
          currentPage = pdfDoc.addPage([width, height]);
          currentY = height - 60;
        }

        if (rIdx === 0 && hasHeaderRow) {
          currentPage.drawRectangle({
            x: 40,
            y: currentY - 4,
            width: width - 80,
            height: rowHeight,
            color: rgb(0.9, 0.92, 0.95)
          });
        } else if (rIdx % 2 === 1) {
          currentPage.drawRectangle({
            x: 40,
            y: currentY - 4,
            width: width - 80,
            height: rowHeight,
            color: rgb(0.98, 0.98, 0.99)
          });
        }

        row.forEach((cell, cIdx) => {
          const cleanCell = cleanTextForPdf(cell).slice(0, 24);
          if (cleanCell) {
            currentPage.drawText(cleanCell, {
              x: 45 + cIdx * colWidth,
              y: currentY,
              size: rIdx === 0 ? 9 : 8,
              font: rIdx === 0 ? fontBold : font,
              color: rIdx === 0 ? rgb(0.08, 0.1, 0.15) : rgb(0.2, 0.2, 0.25)
            });
          }
        });

        currentY -= rowHeight;
      });

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
      {/* Top Banner */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-xs shrink-0">
            <Table size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="font-bold text-stone-900 dark:text-white text-base bg-transparent border-b border-dashed border-stone-300 dark:border-stone-700 hover:border-teal-500 focus:border-teal-500 focus:outline-none w-full max-w-xs truncate"
            />
            <p className="text-xs text-stone-500 mt-0.5">{rows.length} rows loaded</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.tsv,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Upload size={14} />
            <span>Open .CSV</span>
          </button>
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <Button
            onClick={handleConvert}
            disabled={isProcessing || rows.length === 0}
            className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Download size={15} />
            <span>Convert to PDF</span>
          </Button>
        </div>
      </div>

      {/* Grid: CSV Text Editor & Parsed Table Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Raw CSV Editor */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-5 flex flex-col">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">CSV Raw Data Editor</span>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full font-mono text-xs bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-stone-200 dark:border-stone-800 resize-none focus:outline-none text-stone-800 dark:text-stone-200 min-h-[400px]"
          />
        </div>

        {/* Right: Live Table Preview */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-5 overflow-x-auto min-h-[460px]">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 block">Live PDF Table Preview</span>
          <div className="overflow-x-auto border border-stone-200 dark:border-stone-700 rounded-xl">
            <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300 divide-y divide-stone-200 dark:divide-stone-700">
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx === 0 && hasHeaderRow ? 'bg-stone-100 dark:bg-stone-800 font-bold text-stone-900 dark:text-white' : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 border-r border-stone-100 dark:border-stone-800 last:border-r-0 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
