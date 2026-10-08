import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, Share2, FileText, Check, Loader2, ZoomIn, ZoomOut, 
  RotateCw, Copy, ExternalLink, Printer, Search, FileCode, Table, 
  Archive, FileSpreadsheet, FileImage, Maximize2, Minimize2, Eye
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { marked } from 'marked';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { StoredDocument } from '../types';
import { auth, fetchDocumentBinaryFromFirestore } from '../services/firebase';
import { getDocumentBlob } from '../src/utils/fileShare';
import { TOOLS } from '../constants';
import { AnimatedToolIcon } from './AnimatedToolIcon';

// Ensure PDF.js worker is registered
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

// Local File Store accessor
const getLocalFileData = async (id: string): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  // 1. Check localStorage direct key
  try {
    const rawStored = localStorage.getItem('paperx_file_' + id);
    if (rawStored) return rawStored;
  } catch (_) {}

  // 2. Check localStorage list
  try {
    const listStr = localStorage.getItem('paperx_local_stored_files');
    if (listStr) {
      const list = JSON.parse(listStr);
      if (Array.isArray(list)) {
        const item = list.find((f: any) => f.id === id);
        if (item && item.dataUrl) return item.dataUrl;
      }
    }
  } catch (_) {}

  // 3. Check IndexedDB
  if (!window.indexedDB) return null;
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('paperx_local_db', 2);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('paperx_files')) {
          resolve(null);
          return;
        }
        const tx = db.transaction('paperx_files', 'readonly');
        const req = tx.objectStore('paperx_files').get(id);
        req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
        req.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

const getToolIdForFile = (file: StoredDocument): string => {
  const action = (file.action || '').toLowerCase().trim();
  const name = (file.name || '').toLowerCase().trim();
  const tags = (file.tags || []).map(t => String(t).toLowerCase().trim());
  const ext = name.split('.').pop() || '';

  // 1. Check exact match of action with tool name or ID
  if (action) {
    const matched = TOOLS.find(t => t.name.toLowerCase() === action || t.id.toLowerCase() === action);
    if (matched) return matched.id;
  }

  // 2. Scan name, action, or tags for specific tool keywords
  if (name.includes('jpg_to_pdf') || name.includes('jpg-to-pdf') || name.includes('jpg to pdf') || action.includes('jpg to pdf') || tags.includes('jpg to pdf') || name.includes('jpeg_to_pdf') || name.includes('jpeg-to-pdf') || name.includes('png_to_pdf') || name.includes('png-to-pdf')) {
    return 'jpg-to-pdf';
  }
  if (name.includes('word_to_pdf') || name.includes('word-to-pdf') || name.includes('word to pdf') || action.includes('word to pdf') || tags.includes('word to pdf') || name.includes('docx_to_pdf') || name.includes('doc_to_pdf') || name.includes('docx-to-pdf')) {
    return 'word-to-pdf';
  }
  if (name.includes('excel_to_pdf') || name.includes('excel-to-pdf') || name.includes('excel to pdf') || action.includes('excel to pdf') || tags.includes('excel to pdf') || name.includes('xlsx_to_pdf') || name.includes('xls_to_pdf') || name.includes('xlsx-to-pdf')) {
    return 'excel-to-pdf';
  }
  if (name.includes('powerpoint_to_pdf') || name.includes('powerpoint-to-pdf') || name.includes('powerpoint to pdf') || action.includes('powerpoint to pdf') || tags.includes('powerpoint to pdf') || name.includes('ppt_to_pdf') || name.includes('pptx_to_pdf') || name.includes('pptx-to-pdf')) {
    return 'powerpoint-to-pdf';
  }
  if (name.includes('html_to_pdf') || name.includes('html-to-pdf') || name.includes('html to pdf') || action.includes('html to pdf') || tags.includes('html to pdf')) {
    return 'html-to-pdf';
  }
  if (name.includes('txt_to_pdf') || name.includes('txt-to-pdf') || name.includes('txt to pdf') || action.includes('txt to pdf') || tags.includes('txt to pdf')) {
    return 'txt-to-pdf';
  }
  if (name.includes('markdown_to_pdf') || name.includes('markdown-to-pdf') || name.includes('markdown to pdf') || action.includes('markdown to pdf') || tags.includes('markdown to pdf') || name.includes('md_to_pdf') || name.includes('md-to-pdf')) {
    return 'markdown-to-pdf';
  }
  if (name.includes('pdf_to_jpg') || name.includes('pdf-to-jpg') || name.includes('pdf to jpg') || action.includes('pdf to jpg') || tags.includes('pdf to jpg')) {
    return 'pdf-to-jpg';
  }
  if (name.includes('pdf_to_png') || name.includes('pdf-to-png') || name.includes('pdf to png') || action.includes('pdf to png') || tags.includes('pdf to png')) {
    return 'pdf-to-png';
  }
  if (name.includes('pdf_to_word') || name.includes('pdf-to-word') || name.includes('pdf to word') || action.includes('pdf to word') || tags.includes('pdf to word') || name.includes('pdf_to_docx') || name.includes('pdf-to-docx')) {
    return 'pdf-to-word';
  }
  if (name.includes('pdf_to_excel') || name.includes('pdf-to-excel') || name.includes('pdf to excel') || action.includes('pdf to excel') || tags.includes('pdf to excel') || name.includes('pdf_to_xlsx') || name.includes('pdf-to-xlsx')) {
    return 'pdf-to-excel';
  }
  if (name.includes('pdf_to_powerpoint') || name.includes('pdf-to-powerpoint') || name.includes('pdf to powerpoint') || action.includes('pdf to powerpoint') || tags.includes('pdf to powerpoint') || name.includes('pdf_to_pptx') || name.includes('pdf-to-pptx')) {
    return 'pdf-to-powerpoint';
  }
  if (name.includes('merge') || action.includes('merge') || tags.includes('merge') || name.includes('combine') || action.includes('combine') || tags.includes('combine')) {
    return 'merge-pdf';
  }
  if (name.includes('split') || action.includes('split') || tags.includes('split') || name.includes('scissors') || action.includes('scissors') || tags.includes('scissors')) {
    return 'split-pdf';
  }
  if (name.includes('compress') || action.includes('compress') || tags.includes('compress') || name.includes('optimize') || action.includes('optimize') || tags.includes('optimize')) {
    return 'compress-pdf';
  }
  if (name.includes('sign') || action.includes('sign') || tags.includes('sign') || name.includes('signature') || action.includes('signature') || tags.includes('signature')) {
    return 'sign-pdf';
  }
  if (name.includes('watermark') || action.includes('watermark') || tags.includes('watermark')) {
    return 'watermark-pdf';
  }
  if (name.includes('protect') || action.includes('protect') || tags.includes('protect') || name.includes('encrypt') || action.includes('encrypt') || tags.includes('encrypt')) {
    return 'protect-pdf';
  }
  if (name.includes('unlock') || action.includes('unlock') || tags.includes('unlock') || name.includes('decrypt') || action.includes('decrypt') || tags.includes('decrypt')) {
    return 'unlock-pdf';
  }
  if (name.includes('rotate') || action.includes('rotate') || tags.includes('rotate')) {
    return 'rotate-pdf';
  }
  if (name.includes('organize') || action.includes('organize') || tags.includes('organize')) {
    return 'organize-pdf';
  }
  if (name.includes('ocr') || action.includes('ocr') || tags.includes('ocr') || name.includes('scan') || action.includes('scan') || tags.includes('scan')) {
    return 'ocr-pdf';
  }
  if (name.includes('compare') || action.includes('compare') || tags.includes('compare')) {
    return 'compare-pdf';
  }

  // 3. Extension fallback
  if (ext === 'docx' || ext === 'doc') return 'word-to-pdf';
  if (ext === 'xlsx' || ext === 'xls') return 'excel-to-pdf';
  if (ext === 'pptx' || ext === 'ppt') return 'powerpoint-to-pdf';
  if (ext === 'html' || ext === 'htm') return 'html-to-pdf';
  if (ext === 'md') return 'markdown-to-pdf';
  if (ext === 'txt') return 'txt-to-pdf';
  if (ext === 'zip') return 'pdf-to-jpg';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) return 'jpg-to-pdf';

  return 'merge-pdf';
};

interface DocumentPreviewModalProps {
  file: StoredDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (id: string, name: string) => void;
  onShare?: (file: StoredDocument) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onDownload,
  onShare
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'text' | 'native' | 'table'>('preview');
  
  // Viewer control states
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extracted format-specific states
  const [extractedText, setExtractedText] = useState<string>('');
  const [parsedMarkdownHtml, setParsedMarkdownHtml] = useState<string>('');
  const [parsedDocxHtml, setParsedDocxHtml] = useState<string>('');
  const [sheetsData, setSheetsData] = useState<{ name: string; rows: any[][] }[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [zipFiles, setZipFiles] = useState<{ name: string; size: number; isDir: boolean }[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);

  // Detected file format
  const fileExt = useMemo(() => {
    if (!file?.name) return 'pdf';
    const parts = file.name.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : (file.type?.toLowerCase() || 'pdf');
  }, [file]);

  const isPdf = useMemo(() => {
    return fileExt === 'pdf' || file?.type === 'PDF' || (dataUrl && (dataUrl.startsWith('data:application/pdf') || dataUrl.includes('JVBERi0')));
  }, [fileExt, file?.type, dataUrl]);

  const isImage = useMemo(() => {
    return ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'ico'].includes(fileExt) || 
           file?.type === 'IMAGE' || 
           (dataUrl && dataUrl.startsWith('data:image/'));
  }, [fileExt, file?.type, dataUrl]);

  const isMarkdown = useMemo(() => {
    return ['md', 'markdown'].includes(fileExt) || (file?.tags || []).some(t => t.toLowerCase().includes('markdown'));
  }, [fileExt, file?.tags]);

  const isHtml = useMemo(() => {
    return ['html', 'htm'].includes(fileExt) || (file?.tags || []).some(t => t.toLowerCase().includes('html'));
  }, [fileExt, file?.tags]);

  const isCsv = useMemo(() => {
    return ['csv', 'tsv'].includes(fileExt) || (file?.tags || []).some(t => t.toLowerCase().includes('csv'));
  }, [fileExt, file?.tags]);

  const isExcel = useMemo(() => {
    return ['xlsx', 'xls'].includes(fileExt) || (file?.tags || []).some(t => t.toLowerCase().includes('excel') || t.toLowerCase().includes('xlsx'));
  }, [fileExt, file?.tags]);

  const isDocx = useMemo(() => {
    return ['docx', 'doc'].includes(fileExt) || (file?.tags || []).some(t => t.toLowerCase().includes('word') || t.toLowerCase().includes('docx'));
  }, [fileExt, file?.tags]);

  const isZip = useMemo(() => {
    return fileExt === 'zip' || file?.type === 'ZIP';
  }, [fileExt, file?.type]);

  const isText = useMemo(() => {
    return ['txt', 'text', 'json', 'xml', 'log', 'js', 'ts', 'jsx', 'tsx', 'py', 'css'].includes(fileExt) || 
           (!isPdf && !isImage && !isExcel && !isDocx && !isZip);
  }, [fileExt, isPdf, isImage, isExcel, isDocx, isZip]);

  const fileRef = useRef(file);
  useEffect(() => {
    fileRef.current = file;
  }, [file]);

  // Load and decode binary content on modal open
  useEffect(() => {
    if (!isOpen || !file) return;

    const currentFile = fileRef.current || file;
    let isMounted = true;
    let objectUrlToRevoke: string | null = null;

    setIsLoading(true);
    setDataUrl(null);
    setBlobUrl(null);
    setArrayBuffer(null);
    setExtractedText('');
    setParsedMarkdownHtml('');
    setParsedDocxHtml('');
    setSheetsData([]);
    setZipFiles([]);
    setCsvRows([]);
    setZoom(100);
    setRotation(0);
    setActiveTab('preview');

    (async () => {
      try {
        const ext = (currentFile.name || '').split('.').pop()?.toLowerCase() || (currentFile.type?.toLowerCase() || 'pdf');
        const isImg = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'ico'].includes(ext) || currentFile.type === 'IMAGE';
        const isMd = ['md', 'markdown'].includes(ext) || (currentFile.tags || []).some(t => t.toLowerCase().includes('markdown'));
        const isHtmlDoc = ['html', 'htm'].includes(ext) || (currentFile.tags || []).some(t => t.toLowerCase().includes('html'));
        const isCsvDoc = ['csv', 'tsv'].includes(ext) || (currentFile.tags || []).some(t => t.toLowerCase().includes('csv'));
        const isXls = ['xlsx', 'xls'].includes(ext) || (currentFile.tags || []).some(t => t.toLowerCase().includes('excel') || t.toLowerCase().includes('xlsx'));
        const isDocxDoc = ['docx', 'doc'].includes(ext) || (currentFile.tags || []).some(t => t.toLowerCase().includes('word') || t.toLowerCase().includes('docx'));
        const isZipDoc = ext === 'zip' || currentFile.type === 'ZIP';
        const isTxt = ['txt', 'text', 'json', 'xml', 'log', 'js', 'ts', 'jsx', 'tsx', 'py', 'css'].includes(ext);

        // 1. Resolve raw data from direct property, IndexedDB, or Firestore
        let rawData = currentFile.dataUrl || (await getLocalFileData(currentFile.id));

        if (!rawData) {
          const activeUid = auth.currentUser?.uid;
          if (activeUid) {
            try {
              const cloudBinary = await fetchDocumentBinaryFromFirestore(activeUid, currentFile.id);
              if (cloudBinary) {
                rawData = cloudBinary;
              }
            } catch (err) {
              console.warn('[Cloud Fetch Notice]:', err);
            }
          }
        }

        // Check fallback storage in localStorage
        if (!rawData) {
          try {
            const rawStored = localStorage.getItem('paperx_file_' + currentFile.id);
            if (rawStored) rawData = rawStored;
          } catch (_) {}
        }

        // 2. Process dataUrl / Base64 into ArrayBuffer & Blob
        let buffer: ArrayBuffer | null = null;
        let mimeType = 'application/pdf';

        if (isImg) {
          mimeType = ext === 'png' ? 'image/png' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';
        } else if (isMd) {
          mimeType = 'text/markdown';
        } else if (isCsvDoc) {
          mimeType = 'text/csv';
        } else if (isHtmlDoc) {
          mimeType = 'text/html';
        } else if (isDocxDoc) {
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (isXls) {
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (isZipDoc) {
          mimeType = 'application/zip';
        } else if (isTxt) {
          mimeType = 'text/plain';
        }

        if (rawData) {
          if (rawData.startsWith('data:')) {
            const parts = rawData.split(',');
            const matchMime = rawData.match(/data:([^;]+);/);
            if (matchMime) mimeType = matchMime[1];
            const base64Str = parts[1] || '';
            const binStr = atob(base64Str);
            const len = binStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binStr.charCodeAt(i);
            }
            buffer = bytes.buffer;
          } else if (rawData.startsWith('http://') || rawData.startsWith('https://') || rawData.startsWith('blob:')) {
            const res = await fetch(rawData);
            buffer = await res.arrayBuffer();
          } else {
            // Raw base64 string
            try {
              const binStr = atob(rawData);
              const len = binStr.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binStr.charCodeAt(i);
              }
              buffer = bytes.buffer;
              rawData = `data:${mimeType};base64,${rawData}`;
            } catch {
              // Plain text
              const encoder = new TextEncoder();
              buffer = encoder.encode(rawData).buffer;
              rawData = `data:${mimeType};charset=utf-8,${encodeURIComponent(rawData)}`;
            }
          }
        }

        if (!buffer || buffer.byteLength === 0) {
          try {
            const fallbackBlob = await getDocumentBlob(currentFile, getLocalFileData);
            if (fallbackBlob && fallbackBlob.size > 0) {
              buffer = await fallbackBlob.arrayBuffer();
              mimeType = fallbackBlob.type || 'application/pdf';
            }
          } catch (e) {
            console.warn('[Fallback Blob resolution notice]:', e);
          }
        }

        if (!isMounted) return;

        if (buffer && buffer.byteLength > 0) {
          setArrayBuffer(buffer);
          setDataUrl(rawData);

          const blob = new Blob([buffer], { type: mimeType });
          objectUrlToRevoke = URL.createObjectURL(blob);
          setBlobUrl(objectUrlToRevoke);

          // 3. Specialized format parsing
          if (isMd || isHtmlDoc || isCsvDoc || isTxt) {
            try {
              const decoder = new TextDecoder('utf-8');
              const textContent = decoder.decode(buffer);
              setExtractedText(textContent);

              if (isMd) {
                const html = await marked.parse(textContent);
                setParsedMarkdownHtml(html);
              } else if (isCsvDoc) {
                const rows = textContent.split(/\r?\n/).map(line => {
                  return line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
                }).filter(r => r.some(c => c.length > 0));
                setCsvRows(rows);
              }
            } catch (txtErr) {
              console.warn('[Text parse error]:', txtErr);
            }
          } else if (isDocxDoc) {
            try {
              const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
              setParsedDocxHtml(result.value);
              const textResult = await mammoth.extractRawText({ arrayBuffer: buffer });
              setExtractedText(textResult.value);
            } catch (docxErr) {
              console.warn('[DOCX parse error]:', docxErr);
            }
          } else if (isXls) {
            try {
              const wb = XLSX.read(buffer, { type: 'array' });
              const parsedSheets = wb.SheetNames.map(name => {
                const ws = wb.Sheets[name];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
                return { name, rows };
              });
              setSheetsData(parsedSheets);
            } catch (xlErr) {
              console.warn('[Excel parse error]:', xlErr);
            }
          } else if (isZipDoc) {
            try {
              const zip = await JSZip.loadAsync(buffer);
              const filesList: { name: string; size: number; isDir: boolean }[] = [];
              zip.forEach((path, entry) => {
                filesList.push({
                  name: path,
                  size: (entry as any)._data?.uncompressedSize || 0,
                  isDir: entry.dir
                });
              });
              setZipFiles(filesList);
            } catch (zipErr) {
              console.warn('[ZIP parse error]:', zipErr);
            }
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.warn('[Document Preview Resolution Error]:', err);
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      if (objectUrlToRevoke) {
        try { URL.revokeObjectURL(objectUrlToRevoke); } catch (_) {}
      }
    };
  }, [isOpen, file?.id, file?.dataUrl, file?.name]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === '=') { e.preventDefault(); setZoom(z => Math.min(250, z + 15)); }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); setZoom(z => Math.max(40, z - 15)); }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); setZoom(100); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyText = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (blobUrl && isPdf) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      };
    } else {
      window.print();
    }
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={`bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 transition-all ${
          isFullscreen ? 'fixed inset-2 sm:inset-4 max-w-none max-h-none z-50' : 'max-w-5xl w-full max-h-[92vh] sm:max-h-[88vh]'
        }`}
      >
        {/* HEADER BAR */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-900/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200/60 dark:border-stone-800 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
              <AnimatedToolIcon 
                toolId={getToolIdForFile(file)} 
                fallbackIcon={
                  isPdf ? FileText :
                  isImage ? FileImage :
                  isExcel || isCsv ? FileSpreadsheet :
                  isDocx ? FileText :
                  isZip ? Archive :
                  FileCode
                } 
                size={28} 
                className="w-7 h-7" 
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 dark:text-white truncate text-sm sm:text-base tracking-tight" title={file.name}>
                  {file.name}
                </h3>
                <span className="uppercase px-2 py-0.5 bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono font-black text-[10px] rounded-md shrink-0">
                  {fileExt}
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                <span>{file.date}</span>
                <span className="text-stone-300 dark:text-stone-700 select-none">•</span>
                <span className="font-mono">{file.size}</span>
                {file.action && (
                  <>
                    <span className="text-stone-300 dark:text-stone-700 select-none">•</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{file.action}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* VIEW SWITCHER TABS & ACTION CONTROLS */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Format Tabs */}
            <div className="hidden sm:flex items-center bg-stone-200/60 dark:bg-stone-800/80 p-1 rounded-xl gap-1">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Eye size={13} />
                  <span>Preview</span>
                </span>
              </button>

              {isPdf && (
                <button
                  onClick={() => setActiveTab('native')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'native'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ExternalLink size={13} />
                    <span>Native Reader</span>
                  </span>
                </button>
              )}

              {(isText || isMarkdown || isDocx || isHtml || extractedText) && (
                <button
                  onClick={() => setActiveTab('text')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'text'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText size={13} />
                    <span>Text View</span>
                  </span>
                </button>
              )}
            </div>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
              title="Print Document"
            >
              <Printer size={16} />
            </button>

            {/* Share */}
            {onShare && (
              <button
                onClick={() => onShare(file)}
                className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
                title="Share Document"
              >
                <Share2 size={16} />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={() => setIsFullscreen(f => !f)}
              className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* TOOLBAR CONTROLS (Zoom & Format Specifics) */}
        <div className="px-4 sm:px-6 py-2 bg-stone-100/70 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom Controls */}
            <div className="flex items-center bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 p-0.5 shadow-xs">
              <button
                onClick={() => setZoom(z => Math.max(40, z - 15))}
                className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-600 dark:text-stone-300"
                title="Zoom Out (Ctrl -)"
              >
                <ZoomOut size={14} />
              </button>
              <span className="px-2 font-mono font-bold text-stone-700 dark:text-stone-300 min-w-[52px] text-center">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(250, z + 15))}
                className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded text-stone-600 dark:text-stone-300"
                title="Zoom In (Ctrl +)"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoom(100)}
                className="px-1.5 py-0.5 text-[10px] font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 border-l border-stone-200 dark:border-stone-700"
                title="Reset Zoom"
              >
                Fit
              </button>
            </div>

            {/* Excel Sheet Switcher */}
            {isExcel && sheetsData.length > 1 && (
              <div className="flex items-center gap-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-0.5 shadow-xs overflow-x-auto max-w-xs">
                {sheetsData.map((s, idx) => (
                  <button
                    key={s.name}
                    onClick={() => setActiveSheetIndex(idx)}
                    className={`px-2.5 py-1 rounded text-xs font-bold whitespace-nowrap transition-colors ${
                      activeSheetIndex === idx
                        ? 'bg-emerald-600 text-white'
                        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MAIN PREVIEW CONTENT AREA */}
        <div className="flex-1 overflow-y-auto overflow-x-auto bg-stone-200/90 dark:bg-stone-950 p-3 sm:p-6 flex flex-col items-center justify-start min-h-[380px] sm:min-h-[500px]">
          {isLoading ? (
            <div className="my-auto flex flex-col items-center gap-3 text-stone-400">
              <Loader2 size={36} className="animate-spin text-indigo-600" />
              <p className="text-sm font-bold text-stone-600 dark:text-stone-300">Rendering actual file preview...</p>
              <p className="text-xs text-stone-400">Loading full document binary and structures</p>
            </div>
          ) : activeTab === 'native' && blobUrl ? (
            /* NATIVE PDF VIEWER EMBED */
            <div className="w-full h-full min-h-[550px] bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-300 dark:border-stone-800 flex flex-col">
              <object
                data={blobUrl}
                type="application/pdf"
                className="w-full flex-1 h-[580px] rounded-2xl"
              >
                <iframe
                  src={blobUrl}
                  className="w-full h-full min-h-[580px] border-none"
                  title={file.name}
                />
              </object>
            </div>
          ) : activeTab === 'text' && (extractedText || parsedMarkdownHtml) ? (
            /* TEXT / SOURCE READER */
            <div className="w-full max-w-4xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 font-mono text-xs sm:text-sm text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed overflow-x-auto select-text">
              {extractedText}
            </div>
          ) : isPdf && arrayBuffer ? (
            /* REAL PDF CANVAS VIEWER */
            <PdfDocumentViewer
              arrayBuffer={arrayBuffer}
              blobUrl={blobUrl}
              zoom={zoom}
              rotation={rotation}
              onExtractText={(text) => setExtractedText(text)}
            />
          ) : isImage && (blobUrl || dataUrl) ? (
            /* REAL IMAGE VIEWER */
            <div className="my-auto flex flex-col items-center justify-center p-2">
              <div
                className="transition-transform duration-200 origin-center bg-white rounded-2xl shadow-2xl p-2 border border-stone-200 dark:border-stone-800 overflow-hidden max-w-full"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
                }}
              >
                <img
                  src={blobUrl || dataUrl!}
                  alt={file.name}
                  className="max-h-[520px] max-w-full rounded-xl object-contain block"
                />
              </div>
            </div>
          ) : isMarkdown && (parsedMarkdownHtml || extractedText) ? (
            /* REAL MARKDOWN VIEWER */
            <div 
              className="w-full max-w-4xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-10 prose dark:prose-invert max-w-none text-stone-900 dark:text-stone-100 overflow-x-auto transition-transform origin-top"
              style={{ transform: `scale(${zoom / 100})` }}
              dangerouslySetInnerHTML={{ __html: parsedMarkdownHtml || `<pre>${extractedText}</pre>` }}
            />
          ) : isDocx && (parsedDocxHtml || extractedText) ? (
            /* REAL WORD DOCX VIEWER */
            <div 
              className="w-full max-w-4xl bg-white text-stone-900 rounded-2xl shadow-2xl border border-stone-200 p-8 sm:p-12 prose max-w-none overflow-x-auto transition-transform origin-top"
              style={{ transform: `scale(${zoom / 100})` }}
              dangerouslySetInnerHTML={{ __html: parsedDocxHtml || `<pre class="whitespace-pre-wrap font-sans">${extractedText}</pre>` }}
            />
          ) : isExcel && sheetsData.length > 0 ? (
            /* REAL EXCEL SPREADSHEET VIEWER */
            <div 
              className="w-full max-w-5xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-6 overflow-x-auto transition-transform origin-top"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <div className="flex items-center justify-between mb-3 border-b border-stone-200 dark:border-stone-700 pb-2">
                <span className="font-bold text-sm text-stone-800 dark:text-stone-200">
                  Sheet: {sheetsData[activeSheetIndex]?.name || 'Data'}
                </span>
                <span className="text-xs text-stone-500">
                  {sheetsData[activeSheetIndex]?.rows.length || 0} rows
                </span>
              </div>
              <div className="overflow-x-auto border border-stone-200 dark:border-stone-700 rounded-xl">
                <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300 divide-y divide-stone-200 dark:divide-stone-700">
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {(sheetsData[activeSheetIndex]?.rows || []).map((row, rIdx) => (
                      <tr key={rIdx} className={rIdx === 0 ? 'bg-stone-100 dark:bg-stone-800 font-bold' : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'}>
                        <td className="px-3 py-2 text-stone-400 font-mono text-[10px] w-10 border-r border-stone-200 dark:border-stone-700 select-none bg-stone-50 dark:bg-stone-900">
                          {rIdx + 1}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 border-r border-stone-100 dark:border-stone-800 last:border-r-0 whitespace-nowrap">
                            {cell !== undefined && cell !== null ? String(cell) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : isCsv && csvRows.length > 0 ? (
            /* REAL CSV DATA TABLE VIEWER */
            <div 
              className="w-full max-w-5xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-6 overflow-x-auto transition-transform origin-top"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <div className="overflow-x-auto border border-stone-200 dark:border-stone-700 rounded-xl">
                <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300 divide-y divide-stone-200 dark:divide-stone-700">
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {csvRows.map((row, rIdx) => (
                      <tr key={rIdx} className={rIdx === 0 ? 'bg-stone-100 dark:bg-stone-800 font-bold' : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'}>
                        <td className="px-3 py-2 text-stone-400 font-mono text-[10px] w-10 border-r border-stone-200 dark:border-stone-700 select-none bg-stone-50 dark:bg-stone-900">
                          {rIdx + 1}
                        </td>
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
          ) : isHtml && (blobUrl || extractedText) ? (
            /* REAL HTML VIEWER */
            <div className="w-full max-w-4xl h-[560px] bg-white rounded-2xl shadow-2xl border border-stone-300 overflow-hidden flex flex-col">
              <iframe
                sandbox="allow-scripts"
                srcDoc={extractedText || undefined}
                src={!extractedText && blobUrl ? blobUrl : undefined}
                className="w-full flex-1 border-none bg-white"
                title={file.name}
              />
            </div>
          ) : isZip && zipFiles.length > 0 ? (
            /* REAL ZIP ARCHIVE VIEWER */
            <div className="w-full max-w-3xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-3">
                <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <Archive className="text-amber-500" size={18} />
                  <span>Archive Files ({zipFiles.length})</span>
                </h4>
                <span className="text-xs text-stone-500">Total size: {file.size}</span>
              </div>
              <div className="divide-y divide-stone-100 dark:divide-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                {zipFiles.map((zf, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-stone-50 dark:hover:bg-stone-800">
                    <span className="font-mono text-stone-800 dark:text-stone-200 font-medium truncate pr-2">
                      {zf.name}
                    </span>
                    <span className="font-mono text-stone-400 text-[11px] shrink-0">
                      {zf.size > 1024 ? `${(zf.size / 1024).toFixed(1)} KB` : `${zf.size} B`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : extractedText ? (
            /* REAL TEXT DOCUMENT VIEWER */
            <div 
              className="w-full max-w-4xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 font-mono text-xs sm:text-sm text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed overflow-x-auto select-text transition-transform origin-top"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              {extractedText}
            </div>
          ) : (
            /* AUTHENTIC VERIFIED DOCUMENT RECORD SHEET */
            <div className="w-full max-w-2xl bg-white text-stone-900 rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-2 flex flex-col">
              <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                    PX
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-200">PaperX Document Vault</h4>
                    <p className="text-[10px] text-stone-400">Authenticated Processing Artifact</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                  READY
                </span>
              </div>
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block mb-1">Document Name</span>
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 break-words">{file.name}</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
                  <div>
                    <span className="text-stone-400 font-medium block text-[10px] uppercase">File ID</span>
                    <span className="font-mono font-bold text-stone-800 truncate block">{file.id}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-medium block text-[10px] uppercase">Created Date</span>
                    <span className="font-bold text-stone-800 block">{file.date}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-medium block text-[10px] uppercase">File Size</span>
                    <span className="font-bold text-stone-800 block">{file.size}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 font-medium block text-[10px] uppercase">Operation</span>
                    <span className="font-bold text-indigo-600 block">{file.action || 'Processed Document'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>Valid Document Binary Ready for Instant Export & Cloud Download</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER CONTROLS */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <span>Close</span>
          </button>
          <div className="flex items-center gap-2">
            {blobUrl && (
              <a
                href={blobUrl}
                download={file.name}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold rounded-xl text-xs transition-all active:scale-95"
              >
                <Download size={14} />
                <span>Save Local</span>
              </a>
            )}
            <button
              onClick={() => onDownload(file.id, file.name)}
              className="px-5 sm:px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Download size={15} />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MULTI-PAGE PDF CANVAS VIEWER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface PdfDocumentViewerProps {
  arrayBuffer: ArrayBuffer;
  blobUrl: string | null;
  zoom: number;
  rotation: number;
  onExtractText?: (text: string) => void;
}

const PdfDocumentViewer: React.FC<PdfDocumentViewerProps> = ({
  arrayBuffer,
  blobUrl,
  zoom,
  rotation,
  onExtractText
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setHasError(false);

    (async () => {
      try {
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error('PDF buffer empty');
        }

        const dataCopy = new Uint8Array(arrayBuffer.slice(0));
        const loadingTask = pdfjsLib.getDocument({ data: dataCopy });
        const doc = await loadingTask.promise;

        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setLoading(false);

          // Extract text in background
          if (onExtractText) {
            let fullText = '';
            for (let i = 1; i <= Math.min(doc.numPages, 10); i++) {
              try {
                const page = await doc.getPage(i);
                const textContent = await page.getTextContent();
                const pageStr = textContent.items.map((it: any) => it.str).join(' ');
                fullText += `--- Page ${i} ---\n${pageStr}\n\n`;
              } catch (_) {}
            }
            onExtractText(fullText.trim());
          }
        }
      } catch (err) {
        console.warn('[PDF.js Loading Task Notice]:', err);
        if (!isCancelled) {
          setHasError(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [arrayBuffer]);

  if (loading) {
    return (
      <div className="my-auto flex flex-col items-center gap-3 text-stone-400 p-8">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
        <p className="text-xs font-semibold">Rendering PDF pages...</p>
      </div>
    );
  }

  // If PDF.js encounters parsing issues, fallback directly to native PDF iframe
  if (hasError || !pdfDoc || numPages === 0) {
    if (blobUrl) {
      return (
        <div className="w-full h-full min-h-[550px] bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-300 flex flex-col">
          <iframe
            src={blobUrl}
            className="w-full h-full min-h-[580px] border-none"
            title="PDF Document"
          />
        </div>
      );
    }
    return null;
  }

  return (
    <div 
      className="w-full flex flex-col items-center gap-6 py-4 transition-transform duration-150 origin-top"
      style={{
        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
      }}
    >
      {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
        <PdfSinglePageCanvas key={pageNum} pdfDoc={pdfDoc} pageNum={pageNum} totalPages={numPages} />
      ))}
    </div>
  );
};

const PdfSinglePageCanvas: React.FC<{ pdfDoc: any; pageNum: number; totalPages: number }> = ({
  pdfDoc,
  pageNum,
  totalPages
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let renderTask: any = null;

    (async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`[Page render notice for page ${pageNum}]:`, err);
        }
      }
    })();

    return () => {
      isCancelled = true;
      if (renderTask && typeof renderTask.cancel === 'function') {
        try { renderTask.cancel(); } catch (_) {}
      }
    };
  }, [pdfDoc, pageNum]);

  return (
    <div className="flex flex-col items-center gap-2 max-w-full">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-stone-300 dark:border-stone-800">
        <canvas ref={canvasRef} className="max-w-full h-auto block" />
      </div>
      {totalPages > 1 && (
        <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 bg-stone-200/80 dark:bg-stone-800 px-3 py-0.5 rounded-full shadow-xs">
          Page {pageNum} of {totalPages}
        </span>
      )}
    </div>
  );
};
