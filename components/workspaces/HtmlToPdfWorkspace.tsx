import React, { useState, useRef } from 'react';
import { 
  Globe, Download, Upload, Copy, Check, Eye, Code, 
  Sparkles, RefreshCw, Layout, Loader2, Link2, ArrowRight
} from 'lucide-react';
import { Button } from '../Button';
import { convertHtmlStringToPdf } from '../../src/utils/htmlToPdfEngine';

interface HtmlToPdfWorkspaceProps {
  onComplete: (blob: Blob, filename: string) => void;
  isProcessing?: boolean;
}

const QUICK_SAMPLES = [
  { label: 'Wikipedia Article', url: 'https://en.wikipedia.org/wiki/Portable_Document_Format' },
  { label: 'Hacker News', url: 'https://news.ycombinator.com' },
  { label: 'Example Page', url: 'https://example.com' }
];

const HTML_TEMPLATES = [
  {
    id: 'invoice',
    name: 'Invoice Template',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    @page { size: A4; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; background: #ffffff; margin: 0; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: 800; color: #4f46e5; }
    .title { font-size: 20px; font-weight: 700; }
    .meta { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 13px; }
    th { background: #f8fafc; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; }
    td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; }
    .total-box { margin-top: 30px; text-align: right; font-size: 16px; font-weight: 800; color: #4f46e5; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Official Invoice</div>
    <div class="title">INVOICE #INV-2026-089</div>
  </div>
  <div class="meta">
    <div><strong>Billed To:</strong><br/>Acme International Corp<br/>100 Enterprise Blvd, Suite 400</div>
    <div style="text-align: right;"><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}<br/><strong>Due Date:</strong> Net 30 Days</div>
  </div>
  <table>
    <thead>
      <tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
    </thead>
    <tbody>
      <tr><td>Enterprise Document Engine</td><td>1</td><td>$2,400.00</td><td>$2,400.00</td></tr>
      <tr><td>Zero-Trust Cloud Storage Infrastructure</td><td>12</td><td>$150.00</td><td>$1,800.00</td></tr>
      <tr><td>Cryptographic ISO Verification Module</td><td>1</td><td>$800.00</td><td>$800.00</td></tr>
    </tbody>
  </table>
  <div class="total-box">
    <span>Grand Total: $5,000.00 USD</span>
  </div>
</body>
</html>`
  },
  {
    id: 'report',
    name: 'Clean Report',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    @page { size: A4; margin: 0; }
    body { font-family: "Georgia", serif; padding: 40px; color: #0f172a; line-height: 1.6; background: #ffffff; margin: 0; }
    h1 { font-family: sans-serif; color: #1e1b4b; border-bottom: 2px solid #4338ca; padding-bottom: 8px; }
    p { font-size: 14px; margin-bottom: 16px; }
    .callout { background: #eef2ff; border-left: 4px solid #6366f1; padding: 14px; font-size: 13px; font-family: sans-serif; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Quarterly Document Intelligence Report</h1>
  <p>This report has been rendered directly from semantic HTML structures into the PDF compilation pipeline.</p>
  <div class="callout">
    <strong>Key Milestone:</strong> 100% document layout fidelity achieved across all dynamic CSS styles, SVG graphics, fonts, and print backgrounds.
  </div>
</body>
</html>`
  }
];

export const HtmlToPdfWorkspace: React.FC<HtmlToPdfWorkspaceProps> = ({ onComplete, isProcessing = false }) => {
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [fetchingUrl, setFetchingUrl] = useState<boolean>(false);
  const [htmlCode, setHtmlCode] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>('WebPage.html');
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'preview'>('split');
  const [converting, setConverting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFetchUrl = async (urlToFetch?: string) => {
    const rawUrl = (urlToFetch || targetUrl).trim();
    if (!rawUrl) return;

    let validUrl = rawUrl;
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    setFetchingUrl(true);
    setErrorMessage('');
    setStatusMsg('Fetching web page layout...');

    try {
      let fetchedHtml = '';
      
      // Attempt 1: Direct Server Proxy Endpoint
      try {
        const res = await fetch(`/api/fetch-webpage?url=${encodeURIComponent(validUrl)}`);
        if (res.ok) {
          fetchedHtml = await res.text();
        }
      } catch (_) {}

      // Attempt 2: AllOrigins Proxy Fallback
      if (!fetchedHtml) {
        try {
          const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(validUrl)}`);
          if (res.ok) {
            fetchedHtml = await res.text();
            const origin = new URL(validUrl).origin;
            if (fetchedHtml.includes('<head>')) {
              fetchedHtml = fetchedHtml.replace('<head>', `<head><base href="${origin}/">`);
            } else {
              fetchedHtml = `<base href="${origin}/">\n` + fetchedHtml;
            }
          }
        } catch (_) {}
      }

      if (!fetchedHtml) {
        throw new Error('Could not fetch web page. Please check the URL or try pasting HTML directly.');
      }

      setHtmlCode(fetchedHtml);
      const hostName = new URL(validUrl).hostname.replace('www.', '');
      setDocTitle(`${hostName}_webpage.html`);
    } catch (err: any) {
      console.error('Fetch Web Page Error:', err);
      setErrorMessage(err?.message || 'Failed to fetch webpage.');
    } finally {
      setFetchingUrl(false);
      setStatusMsg('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocTitle(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setHtmlCode((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleConvert = async () => {
    if (!htmlCode.trim()) return;

    setConverting(true);
    setStatusMsg('Rendering layout canvas...');

    try {
      const cleanName = docTitle.toLowerCase().endsWith('.pdf')
        ? docTitle
        : `${docTitle.replace(/\.[^/.]+$/, '')}.pdf`;

      const result = await convertHtmlStringToPdf(htmlCode, {
        filename: cleanName,
        pageSize: 'A4',
        orientation: 'portrait',
        onProgress: (msg) => setStatusMsg(msg)
      });

      // Direct Browser File Download
      const objectUrl = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);

      onComplete(result.blob, result.filename);
    } catch (err: any) {
      console.error('HTML to PDF Error:', err);
    } finally {
      setConverting(false);
      setStatusMsg('');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Banner & Control Row */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Globe size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="font-bold text-stone-900 dark:text-white text-base bg-transparent border-b border-dashed border-stone-300 dark:border-stone-700 hover:border-indigo-500 focus:border-indigo-500 focus:outline-none w-full max-w-xs truncate"
              />
              <p className="text-xs text-stone-500 mt-0.5">Convert Live Web Pages & HTML to High-Accuracy PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".html,.htm"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Upload size={14} />
              <span>Open .HTML</span>
            </button>
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg ${viewMode === 'split' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500'}`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg ${viewMode === 'code' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500'}`}
              >
                Code
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg ${viewMode === 'preview' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500'}`}
              >
                Preview
              </button>
            </div>
            <Button
              onClick={handleConvert}
              disabled={converting || isProcessing || !htmlCode.trim()}
              className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              {converting ? (
                <>
                  <Loader2 size={15} className="animate-spin text-indigo-500" />
                  <span>{statusMsg || 'Rendering PDF...'}</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Convert to PDF</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Live URL Input Bar */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Link2 size={16} />
              </div>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
                placeholder="Paste Web Page URL (e.g. https://en.wikipedia.org/wiki/Portable_Document_Format)"
                className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => handleFetchUrl()}
              disabled={fetchingUrl || !targetUrl.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
            >
              {fetchingUrl ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <span>Fetch Web Page</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>

          {/* Quick Samples */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-stone-400 font-semibold text-[11px]">Try sample URLs:</span>
            {QUICK_SAMPLES.map((sample) => (
              <button
                key={sample.url}
                onClick={() => {
                  setTargetUrl(sample.url);
                  handleFetchUrl(sample.url);
                }}
                className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
              >
                {sample.label}
              </button>
            ))}
          </div>

          {errorMessage && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 pt-1">
              {errorMessage}
            </p>
          )}
        </div>
      </div>

      {/* Grid: Code Editor & Standard A4 Page Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[520px]">
        {viewMode !== 'preview' && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">HTML Source Editor</span>
              <div className="flex items-center gap-1.5">
                {htmlCode && (
                  <button
                    onClick={() => {
                      setHtmlCode('');
                      setTargetUrl('');
                    }}
                    className="px-2 py-0.5 text-[11px] font-semibold bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                  >
                    Clear
                  </button>
                )}
                {HTML_TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => setHtmlCode(tmpl.code)}
                    className="px-2 py-0.5 text-[11px] font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md text-stone-600 dark:text-stone-300 transition-colors"
                  >
                    Load {tmpl.name}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              placeholder={`<!-- Paste or type your HTML code here, or enter a Web URL above -->\n<!DOCTYPE html>\n<html>\n  <body>\n    <h1>Hello World</h1>\n  </body>\n</html>`}
              className="w-full flex-1 font-mono text-xs bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-stone-200 dark:border-stone-800 resize-none focus:outline-none text-stone-800 dark:text-stone-200 min-h-[440px]"
            />
          </div>
        )}

        {viewMode !== 'code' && (
          <div className="bg-stone-100 dark:bg-stone-950 rounded-2xl shadow-inner border border-stone-200 dark:border-stone-800 p-4 overflow-y-auto max-h-[600px] flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between mb-3 px-1 text-xs text-stone-500">
              <span className="font-bold uppercase tracking-wider">A4 Document Preview</span>
              <span>210mm × 297mm Standard</span>
            </div>

            {htmlCode.trim() ? (
              /* Standard A4 Paper Container with User Document */
              <div className="w-full max-w-[595px] bg-white text-stone-900 shadow-2xl rounded-sm border border-stone-200 overflow-hidden min-h-[842px]">
                <iframe
                  srcDoc={htmlCode}
                  className="w-full min-h-[842px] border-none"
                  title="A4 HTML Preview"
                  sandbox="allow-scripts"
                />
              </div>
            ) : (
              /* Empty Preview Placeholder */
              <div className="w-full max-w-[595px] bg-white dark:bg-stone-900 text-stone-400 dark:text-stone-600 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[440px]">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-bold shadow-inner">
                  <Globe size={32} />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">No Preview Loaded</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    Paste a Web URL above, enter HTML code, or upload an <code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400">.html</code> file to generate a live A4 preview and convert to PDF.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


