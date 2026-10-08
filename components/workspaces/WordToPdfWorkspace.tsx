import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Download, Upload, Plus, Trash2, RotateCw, RotateCcw,
  Layout, Sliders, Check, ArrowUp, ArrowDown, 
  Copy, Crop as CropIcon, RefreshCw, Maximize2, Palette, 
  Eye, X, ExternalLink, ChevronDown, Share2, Cloud,
  ZoomIn, ZoomOut, Loader2
} from 'lucide-react';
import { 
  convertMultipleWordToPdf, 
  renderDocxToContainer,
  generateWordDocThumbnail,
  WordToPdfOptions
} from '../../services/converters/wordConverter';
import { 
  CloudStorageModal, 
  CloudProvider, 
  GoogleDriveAnimatedIcon, 
  DropboxAnimatedIcon 
} from '../CloudStorageModal';

interface WordToPdfWorkspaceProps {
  onComplete: (blob: Blob, filename: string) => void;
  isProcessing?: boolean;
}

export type PageSizePreset = 'fit' | 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'custom';
export type OrientationOption = 'auto' | 'portrait' | 'landscape';
export type MarginOption = 'none' | 'small' | 'medium' | 'large' | 'custom';
export type FittingOption = 'fit' | 'fill' | 'stretch' | 'original' | 'center';
export type BgColorOption = 'white' | 'black' | 'yellow' | 'cream' | 'blue' | 'custom';
export type ImageQualityOption = 'standard' | 'high' | 'maximum';

interface UploadedWordDoc {
  id: string;
  file: File;
  name: string;
  size: number;
  rotation: number;
  previewUrl: string;
  naturalWidth?: number;
  naturalHeight?: number;
  pageCount?: number;
}

export const WordToPdfWorkspace: React.FC<WordToPdfWorkspaceProps> = ({ 
  onComplete, 
  isProcessing = false 
}) => {
  // Document Queue State
  const [documents, setDocuments] = useState<UploadedWordDoc[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [docTitle, setDocTitle] = useState<string>('Word_Compiled.pdf');

  // Page Setup State
  const [pageSize, setPageSize] = useState<PageSizePreset>('fit');
  const [customUnit, setCustomUnit] = useState<'mm' | 'in' | 'pt' | 'px'>('mm');
  const [customWidth, setCustomWidth] = useState<number>(210);
  const [customHeight, setCustomHeight] = useState<number>(297);
  const [orientation, setOrientation] = useState<OrientationOption>('auto');
  
  // Margin State
  const [marginOption, setMarginOption] = useState<MarginOption>('none');
  const [customMargin, setCustomMargin] = useState<number>(14);

  // Fitting & Appearance State
  const [fittingOption, setFittingOption] = useState<FittingOption>('fit');
  const [bgColorOption, setBgColorOption] = useState<BgColorOption>('white');
  const [customBgColor, setCustomBgColor] = useState<string>('#ffffff');

  // Quality State
  const [imageQuality, setImageQuality] = useState<ImageQualityOption>('high');

  // UI & Conversion State
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [convertStatus, setConvertStatus] = useState<string>('');
  const [, setConvertProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragActive, setIsDragActive] = useState<boolean>(false);

  // Modals State
  const [previewingDoc, setPreviewingDoc] = useState<UploadedWordDoc | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [isPreviewModalLoading, setIsPreviewModalLoading] = useState<boolean>(false);

  // Cloud Link & Storage State
  const [activeCloudProvider, setActiveCloudProvider] = useState<CloudProvider | null>(null);
  const [isCloudPickerModalOpen, setIsCloudPickerModalOpen] = useState<boolean>(false);
  const [cloudModalProvider, setCloudModalProvider] = useState<CloudProvider>('google-drive');
  const [cloudUrlInput, setCloudUrlInput] = useState<string>('');
  const [importingCloudLink, setImportingCloudLink] = useState<boolean>(false);

  // Result Actions State
  const [lastResult, setLastResult] = useState<{
    blob: Blob;
    filename: string;
    pageCount: number;
  } | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [showCloudSaveModal, setShowCloudSaveModal] = useState<boolean>(false);
  const [cloudSaving, setCloudSaving] = useState<boolean>(false);
  const [cloudSaveSuccess, setCloudSaveSuccess] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const appendFileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const replaceTargetIdRef = useRef<string | null>(null);
  const modalPreviewContainerRef = useRef<HTMLDivElement | null>(null);

  // Calculate Page Dimensions in Points
  const getPageDimensions = (docW: number, docH: number): { width: number; height: number } => {
    let w = 595.28;
    let h = 841.89;

    switch (pageSize) {
      case 'A4': 
        w = 595.28; h = 841.89; // 210 x 297 mm
        break;
      case 'A3': 
        w = 841.89; h = 1190.55; // 297 x 420 mm
        break;
      case 'A5': 
        w = 419.53; h = 595.28; // 148 x 210 mm
        break;
      case 'Letter': 
        w = 612.0; h = 792.0; // 8.5 x 11 in
        break;
      case 'Legal': 
        w = 612.0; h = 1008.0; // 8.5 x 14 in
        break;
      case 'custom': {
        let ptW = customWidth;
        let ptH = customHeight;
        if (customUnit === 'mm') {
          ptW = customWidth * 2.834645669;
          ptH = customHeight * 2.834645669;
        } else if (customUnit === 'in') {
          ptW = customWidth * 72;
          ptH = customHeight * 72;
        } else if (customUnit === 'px') {
          ptW = customWidth * 0.75;
          ptH = customHeight * 0.75;
        }
        w = Math.max(30, ptW); 
        h = Math.max(30, ptH); 
        break;
      }
      case 'fit':
      default: {
        const baseW = docW || 595;
        const baseH = docH || 842;
        const maxBound = 841.89;
        const scale = Math.min(1, maxBound / Math.max(baseW, baseH));
        w = Math.max(100, Math.round(baseW * scale));
        h = Math.max(100, Math.round(baseH * scale));
        break;
      }
    }

    const isLand = orientation === 'landscape' || (orientation === 'auto' && docW > docH);
    if (isLand) {
      return { width: Math.max(w, h), height: Math.min(w, h) };
    } else if (orientation === 'portrait') {
      return { width: Math.min(w, h), height: Math.max(w, h) };
    }
    return { width: w, height: h };
  };

  // Margin Value in Points
  const getMarginPoints = (): number => {
    switch (marginOption) {
      case 'none': return 0;
      case 'small': return 14.17; // 5 mm
      case 'medium': return 28.35; // 10 mm
      case 'large': return 56.70; // 20 mm
      case 'custom': return Math.max(0, customMargin);
    }
  };

  const getSheetBgColor = (): string => {
    if (bgColorOption === 'black') return '#000000';
    if (bgColorOption === 'yellow') return '#ffff00';
    if (bgColorOption === 'cream') return '#fef9c3';
    if (bgColorOption === 'blue') return '#e0f2fe';
    if (bgColorOption === 'custom') {
      const clean = (customBgColor || '').trim();
      return clean.startsWith('#') ? clean : `#${clean}`;
    }
    return '#ffffff';
  };

  // Add Files to Queue
  const addFilesToQueue = async (files: File[]) => {
    const validExtRegex = /\.(docx|doc|dotx|dot|rtf|odt|txt|pages)$/i;
    const validFiles = files.filter(f => validExtRegex.test(f.name) || f.type.includes('word') || f.type.includes('document') || f.type.includes('text') || f.size > 0);

    if (validFiles.length === 0) {
      setErrorMessage('Please select valid Word documents (.docx, .doc, .dotx, or .rtf).');
      return;
    }

    setErrorMessage('');

    for (const file of validFiles) {
      const newDocId = `word_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      // Temporary initial item
      const tempDoc: UploadedWordDoc = {
        id: newDocId,
        file,
        name: file.name,
        size: file.size,
        rotation: 0,
        previewUrl: '',
        naturalWidth: 595,
        naturalHeight: 842,
        pageCount: 1
      };

      setDocuments(prev => [...prev, tempDoc]);

      // Set default title if first document
      if (documents.length === 0 && validFiles.length === 1) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, '') + '.pdf');
      }

      // Generate rich thumbnail asynchronously
      generateWordDocThumbnail(file).then(thumb => {
        setDocuments(prev => prev.map(item => item.id === newDocId ? {
          ...item,
          previewUrl: thumb.thumbnailUrl,
          naturalWidth: thumb.naturalWidth,
          naturalHeight: thumb.naturalHeight,
          pageCount: thumb.pageCount
        } : item));
      }).catch(err => {
        console.warn('Could not generate Word thumbnail:', err);
      });
    }
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  // Selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const removeSelected = () => {
    setDocuments(prev => prev.filter(d => !selectedIds.includes(d.id)));
    setSelectedIds([]);
  };

  const clearAll = () => {
    setDocuments([]);
    setSelectedIds([]);
    setLastResult(null);
  };

  // Reorder
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= documents.length) return;
    setDocuments(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  // Rotate
  const handleRotate = (id: string, dir: 'left' | 'right') => {
    const delta = dir === 'right' ? 90 : -90;
    setDocuments(prev => prev.map(d => {
      if (d.id !== id) return d;
      const nextRot = (d.rotation + delta + 360) % 360;
      return { ...d, rotation: nextRot };
    }));
  };

  // Duplicate
  const handleDuplicate = (docItem: UploadedWordDoc) => {
    const newId = `word_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    setDocuments(prev => {
      const idx = prev.findIndex(d => d.id === docItem.id);
      const copy: UploadedWordDoc = {
        ...docItem,
        id: newId,
        name: `Copy of ${docItem.name}`
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  // Replace
  const handleReplaceClick = (id: string) => {
    replaceTargetIdRef.current = id;
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = replaceTargetIdRef.current;
    if (!file || !targetId) return;

    try {
      const thumb = await generateWordDocThumbnail(file);
      setDocuments(prev => prev.map(d => d.id === targetId ? {
        ...d,
        file,
        name: file.name,
        size: file.size,
        rotation: 0,
        previewUrl: thumb.thumbnailUrl,
        naturalWidth: thumb.naturalWidth,
        naturalHeight: thumb.naturalHeight,
        pageCount: thumb.pageCount
      } : d));
    } catch (_) {}

    if (e.target) e.target.value = '';
    replaceTargetIdRef.current = null;
  };

  // Delete
  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    setSelectedIds(prev => prev.filter(item => item !== id));
  };

  // Cloud Import
  const openCloudStorage = (provider: CloudProvider) => {
    setCloudModalProvider(provider);
    setIsCloudPickerModalOpen(true);
    setErrorMessage('');
  };

  const handleImportCloudLink = async () => {
    if (!cloudUrlInput.trim()) return;
    setImportingCloudLink(true);
    setErrorMessage('');

    let targetUrl = cloudUrlInput.trim();
    if (targetUrl.includes('drive.google.com')) {
      const driveMatch = targetUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || targetUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (driveMatch && driveMatch[1]) {
        targetUrl = `https://docs.google.com/document/d/${driveMatch[1]}/export?format=docx`;
      }
    } else if (targetUrl.includes('dropbox.com')) {
      targetUrl = targetUrl.replace('dl=0', 'raw=1').replace('dl=1', 'raw=1');
      if (!targetUrl.includes('raw=1')) targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'raw=1';
    }

    try {
      const res = await fetch(targetUrl);
      const blob = await res.blob();
      const file = new File([blob], `Cloud_Word_${Date.now()}.docx`, { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      addFilesToQueue([file]);
      setCloudUrlInput('');
      setActiveCloudProvider(null);
    } catch (err) {
      setErrorMessage('Could not fetch Word file from link. Ensure the link is public.');
    } finally {
      setImportingCloudLink(false);
    }
  };

  // Live Modal Preview Renderer
  useEffect(() => {
    if (!previewingDoc || !modalPreviewContainerRef.current) return;
    setIsPreviewModalLoading(true);
    let isSubscribed = true;

    renderDocxToContainer(previewingDoc.file, modalPreviewContainerRef.current, getSheetBgColor())
      .then(() => {
        if (isSubscribed) setIsPreviewModalLoading(false);
      })
      .catch(() => {
        if (isSubscribed) setIsPreviewModalLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [previewingDoc, bgColorOption, customBgColor]);

  // Convert PDF Function
  const handleConvert = async () => {
    if (documents.length === 0) {
      setErrorMessage('Please add at least one Word document to convert.');
      return;
    }

    setIsConverting(true);
    setErrorMessage('');
    setConvertStatus('Initializing Word conversion engine...');
    setConvertProgress(5);

    const cleanFilename = docTitle.toLowerCase().endsWith('.pdf') ? docTitle : `${docTitle}.pdf`;

    const options: WordToPdfOptions = {
      pageSize,
      orientation,
      margin: marginOption === 'none' ? 0 : marginOption,
      customMargin,
      customWidth,
      customHeight,
      fitting: fittingOption,
      bgColor: getSheetBgColor(),
      quality: imageQuality,
      outputFilename: cleanFilename
    };

    try {
      const rawFiles = documents.map(d => d.file);
      const res = await convertMultipleWordToPdf(
        rawFiles,
        (status, prog) => {
          setConvertStatus(status);
          setConvertProgress(prog);
        },
        options
      );

      setLastResult({
        blob: res.blob,
        filename: res.filename,
        pageCount: res.pageCount
      });

      // Unified single standard download & toast
      onComplete(res.blob, cleanFilename);

      setIsConverting(false);
      setConvertStatus('');
      setConvertProgress(100);
    } catch (err: any) {
      console.error('Word to PDF Error:', err);
      setErrorMessage(`Conversion failed: ${err?.message || 'Unknown error occurred while processing Word document.'}`);
      setIsConverting(false);
    }
  };

  // Direct manual download
  const handleManualDownload = () => {
    if (!lastResult) return;
    const url = URL.createObjectURL(lastResult.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = lastResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Web Share
  const handleShare = async () => {
    if (!lastResult) return;
    if (navigator.share) {
      try {
        const shareFile = new File([lastResult.blob], lastResult.filename, { type: 'application/pdf' });
        await navigator.share({
          title: lastResult.filename,
          text: `Converted "${lastResult.filename}".`,
          files: [shareFile]
        });
        return;
      } catch (_) {}
    }
    setShowShareModal(true);
  };

  // Save to cloud simulation
  const handleSaveToCloud = (provider: string) => {
    setCloudSaving(true);
    setCloudSaveSuccess(null);
    setTimeout(() => {
      setCloudSaving(false);
      setCloudSaveSuccess(`Saved "${lastResult?.filename}" to your ${provider} root directory!`);
      setTimeout(() => setShowCloudSaveModal(false), 2000);
    }, 1200);
  };

  const totalMb = (documents.reduce((acc, d) => acc + d.size, 0) / (1024 * 1024)).toFixed(2);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files) addFilesToQueue(Array.from(e.target.files));
          if (e.target) e.target.value = '';
        }}
        accept=".docx,.doc,.dotx,.dot,.rtf,.odt,.txt"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={appendFileInputRef}
        onChange={(e) => {
          if (e.target.files) addFilesToQueue(Array.from(e.target.files));
          if (e.target) e.target.value = '';
        }}
        accept=".docx,.doc,.dotx,.dot,.rtf,.odt,.txt"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplaceFile}
        accept=".docx,.doc,.dotx,.dot,.rtf,.odt,.txt"
        className="hidden"
      />

      {/* Cloud Link Quick Drawer */}
      {activeCloudProvider && (
        <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-sky-500/10 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-sky-950/40 border border-blue-200 dark:border-blue-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              {activeCloudProvider === 'google-drive' && <GoogleDriveAnimatedIcon className="w-6 h-6" />}
              {activeCloudProvider === 'dropbox' && <DropboxAnimatedIcon className="w-6 h-6" />}
              <div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                  Paste {activeCloudProvider === 'google-drive' ? 'Google Drive' : 'Dropbox'} Word Document Link
                </h4>
                <p className="text-[11px] text-stone-500">
                  Ensure the shared file link is set to "Anyone with the link can view"
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveCloudProvider(null)}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-white rounded-lg cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-[220px]">
              <input
                type="url"
                value={cloudUrlInput}
                onChange={(e) => setCloudUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImportCloudLink()}
                placeholder={`Paste copied ${activeCloudProvider === 'google-drive' ? 'Google Drive' : 'Dropbox'} document link...`}
                className="w-full pl-3 pr-20 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 text-stone-900 dark:text-stone-100 shadow-xs"
              />
              <button
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setCloudUrlInput(text);
                  } catch (_) {}
                }}
                className="absolute right-2 top-1.5 px-2 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600 dark:text-stone-300 rounded-lg text-[11px] font-bold cursor-pointer"
              >
                Paste
              </button>
            </div>

            <button
              onClick={handleImportCloudLink}
              disabled={importingCloudLink || !cloudUrlInput.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {importingCloudLink ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Import Document</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Display */}
      {documents.length === 0 ? (
        /* Empty State Dropzone */
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full border-2 border-dashed rounded-3xl p-8 sm:p-14 flex flex-col items-center justify-center gap-5 transition-all text-center shadow-sm ${
            isDragActive 
              ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/20 scale-[1.01]' 
              : 'border-stone-300 dark:border-stone-700 bg-white/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-900'
          }`}
        >
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs cursor-pointer hover:scale-105 transition-transform"
          >
            <FileText size={32} />
          </div>
          <div>
            <h4 className="font-bold text-base text-stone-900 dark:text-white">Click or Drag & Drop Word Files Here</h4>
            <p className="text-xs text-stone-500 mt-1">Supports DOCX, DOC, DOTX, and RTF documents (single or multiple files)</p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-black font-bold text-xs rounded-xl shadow-md cursor-pointer hover:opacity-90 transition-opacity active:scale-95 flex items-center gap-2"
            >
              <Upload size={14} />
              <span>Select Word Documents</span>
            </button>
          </div>

          {errorMessage && (
            <div className="text-red-600 dark:text-red-400 font-semibold text-xs pt-1 max-w-md">
              {errorMessage}
            </div>
          )}

          {/* Cloud Storage Options Banner */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 w-full max-w-md space-y-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">OR Import From Cloud Storage</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => openCloudStorage('google-drive')}
                className="p-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-xs transition-all hover:scale-105 cursor-pointer group"
              >
                <GoogleDriveAnimatedIcon className="w-6 h-6" />
                <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">Google Drive</span>
              </button>

              <button
                onClick={() => openCloudStorage('dropbox')}
                className="p-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-xs transition-all hover:scale-105 cursor-pointer group"
              >
                <DropboxAnimatedIcon className="w-6 h-6" />
                <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">Dropbox</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Banner Control Panel */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-xs shrink-0">
                  <FileText size={22} className="sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="font-bold text-stone-900 dark:text-white text-sm sm:text-base bg-transparent border-b border-dashed border-stone-300 dark:border-stone-700 hover:border-blue-500 focus:border-blue-500 focus:outline-none w-full max-w-sm truncate"
                    placeholder="Word_Compiled.pdf"
                  />
                  <p className="text-xs text-stone-500 mt-0.5 font-medium">
                    {documents.length} {documents.length === 1 ? 'Word document' : 'Word documents'} selected • {totalMb} MB total
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                {/* Cloud Storage Quick Action Bar */}
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl">
                  <button
                    onClick={() => openCloudStorage('google-drive')}
                    className="px-2.5 py-1.5 hover:bg-white dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs group"
                    title="Import from Google Drive"
                  >
                    <GoogleDriveAnimatedIcon className="w-4 h-4" />
                    <span className="hidden md:inline">Drive</span>
                  </button>

                  <button
                    onClick={() => openCloudStorage('dropbox')}
                    className="px-2.5 py-1.5 hover:bg-white dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs group"
                    title="Import from Dropbox"
                  >
                    <DropboxAnimatedIcon className="w-4 h-4" />
                    <span className="hidden md:inline">Dropbox</span>
                  </button>
                </div>

                <button
                  onClick={handleConvert}
                  disabled={isConverting || documents.length === 0}
                  className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConverting ? (
                    <>
                      <Loader2 size={15} className="animate-spin text-blue-500" />
                      <span>{convertStatus || 'Converting...'}</span>
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      <span>Convert to PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Options Toolbar Grid */}
            <div className="pt-3.5 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {/* Page Size */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <Layout size={13} className="text-blue-500 shrink-0" />
                  <span>Page Size</span>
                </label>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as any)}
                    className="w-full h-10 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 pl-3 pr-8 py-2 rounded-xl text-xs sm:text-[13px] font-bold border border-stone-200 dark:border-stone-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer transition-all shadow-2xs truncate"
                  >
                    <option value="fit">Fit to Document</option>
                    <option value="A4">A4 (210×297mm)</option>
                    <option value="A3">A3 Large (297×420mm)</option>
                    <option value="A5">A5 Compact (148×210mm)</option>
                    <option value="Letter">US Letter (8.5×11")</option>
                    <option value="Legal">US Legal (8.5×14")</option>
                    <option value="custom">Custom Dimensions...</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>

              {/* Orientation */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <RotateCw size={13} className="text-blue-500 shrink-0" />
                  <span>Orientation</span>
                </label>
                <div className="relative">
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as any)}
                    className="w-full h-10 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 pl-3 pr-8 py-2 rounded-xl text-xs sm:text-[13px] font-bold border border-stone-200 dark:border-stone-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer transition-all shadow-2xs truncate"
                  >
                    <option value="auto">Auto (Match Document)</option>
                    <option value="portrait">Portrait (Vertical)</option>
                    <option value="landscape">Landscape (Horizontal)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>

              {/* Margins */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <Maximize2 size={13} className="text-blue-500 shrink-0" />
                  <span>Margin</span>
                </label>
                <div className="relative">
                  <select
                    value={marginOption}
                    onChange={(e) => setMarginOption(e.target.value as any)}
                    className="w-full h-10 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 pl-3 pr-8 py-2 rounded-xl text-xs sm:text-[13px] font-bold border border-stone-200 dark:border-stone-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer transition-all shadow-2xs truncate"
                  >
                    <option value="none">No Margin (Full Bleed)</option>
                    <option value="small">Small (5mm / 14pt)</option>
                    <option value="medium">Medium (10mm / 28pt)</option>
                    <option value="large">Large (20mm / 56pt)</option>
                    <option value="custom">Custom Margin...</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>

              {/* Layout Fit */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <CropIcon size={13} className="text-blue-500 shrink-0" />
                  <span>Layout Fit</span>
                </label>
                <div className="relative">
                  <select
                    value={fittingOption}
                    onChange={(e) => setFittingOption(e.target.value as any)}
                    className="w-full h-10 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 pl-3 pr-8 py-2 rounded-xl text-xs sm:text-[13px] font-bold border border-stone-200 dark:border-stone-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer transition-all shadow-2xs truncate"
                  >
                    <option value="fit">Fit to Page (No Crop)</option>
                    <option value="fill">Fill Page (Cover)</option>
                    <option value="stretch">Stretch to Page (Full)</option>
                    <option value="original">Original Size (1:1 DPI)</option>
                    <option value="center">Center on Page</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <Palette size={13} className="text-blue-500 shrink-0" />
                  <span>Background</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1 min-w-0">
                    <select
                      value={bgColorOption}
                      onChange={(e) => setBgColorOption(e.target.value as any)}
                      className="w-full h-10 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 pl-3 pr-8 py-2 rounded-xl text-xs sm:text-[13px] font-bold border border-stone-200 dark:border-stone-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer transition-all shadow-2xs truncate"
                    >
                      <option value="white">White</option>
                      <option value="yellow">Yellow (#FFFF00)</option>
                      <option value="cream">Warm Cream</option>
                      <option value="blue">Soft Blue</option>
                      <option value="black">Black</option>
                      <option value="custom">Custom Color...</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  </div>
                  {bgColorOption === 'custom' && (
                    <input
                      type="color"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-stone-300 dark:border-stone-700 p-0.5 shrink-0 shadow-xs"
                      title="Pick custom background color"
                    />
                  )}
                </div>
              </div>

              {/* Quality */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <Sliders size={13} className="text-blue-500 shrink-0" />
                  <span>Quality</span>
                </label>
                <div className="relative">
                  <select
                    value={imageQuality}
                    onChange={(e) => setImageQuality(e.target.value as any)}
                    className="w-full h-10 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 pl-3 pr-8 py-2 rounded-xl text-xs sm:text-[13px] font-bold border border-stone-200 dark:border-stone-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer transition-all shadow-2xs truncate"
                  >
                    <option value="high">High (92% Sharp)</option>
                    <option value="maximum">Maximum (100% Lossless)</option>
                    <option value="standard">Standard (75% Compact)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Custom Parameter Controls (When Custom Selected) */}
            {(pageSize === 'custom' || marginOption === 'custom' || bgColorOption === 'custom') && (
              <div className="pt-2 mt-2 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center gap-4 flex-wrap text-xs bg-stone-50 dark:bg-stone-900/60 p-3 rounded-2xl">
                {pageSize === 'custom' && (
                  <div className="flex items-center gap-3 flex-wrap w-full">
                    <span className="font-bold text-stone-700 dark:text-stone-300">Custom Size:</span>
                    <div className="flex items-center gap-1 bg-stone-200/70 dark:bg-stone-800 p-0.5 rounded-lg text-[11px] font-bold">
                      <button 
                        onClick={() => {
                          if (customUnit !== 'mm') {
                            setCustomUnit('mm');
                            setCustomWidth(210);
                            setCustomHeight(297);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${customUnit === 'mm' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs' : 'text-stone-500'}`}
                      >
                        mm
                      </button>
                      <button 
                        onClick={() => {
                          if (customUnit !== 'in') {
                            setCustomUnit('in');
                            setCustomWidth(8.5);
                            setCustomHeight(11);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${customUnit === 'in' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs' : 'text-stone-500'}`}
                      >
                        inches
                      </button>
                      <button 
                        onClick={() => {
                          if (customUnit !== 'pt') {
                            setCustomUnit('pt');
                            setCustomWidth(595);
                            setCustomHeight(842);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${customUnit === 'pt' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs' : 'text-stone-500'}`}
                      >
                        pt
                      </button>
                      <button 
                        onClick={() => {
                          if (customUnit !== 'px') {
                            setCustomUnit('px');
                            setCustomWidth(800);
                            setCustomHeight(1100);
                          }
                        }}
                        className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${customUnit === 'px' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs' : 'text-stone-500'}`}
                      >
                        px
                      </button>
                    </div>

                    <label className="flex items-center gap-1 text-stone-600 dark:text-stone-300">
                      <span className="font-bold">W:</span>
                      <input
                        type="number"
                        step={customUnit === 'in' ? '0.1' : '1'}
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Math.max(1, Number(e.target.value)))}
                        className="w-20 h-8 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2 text-xs font-bold focus:outline-none focus:border-blue-500"
                      />
                    </label>
                    <label className="flex items-center gap-1 text-stone-600 dark:text-stone-300">
                      <span className="font-bold">H:</span>
                      <input
                        type="number"
                        step={customUnit === 'in' ? '0.1' : '1'}
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Math.max(1, Number(e.target.value)))}
                        className="w-20 h-8 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2 text-xs font-bold focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-[11px] text-stone-400 font-semibold">{customUnit}</span>
                    </label>
                  </div>
                )}
                {marginOption === 'custom' && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-700 dark:text-stone-300">Custom Margin:</span>
                    <input
                      type="number"
                      value={customMargin}
                      onChange={(e) => setCustomMargin(Math.max(0, Number(e.target.value)))}
                      className="w-18 h-8 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2 text-xs font-bold focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[11px] text-stone-500 font-medium">pt ({Math.round(customMargin * 0.3528)} mm)</span>
                  </div>
                )}
                {bgColorOption === 'custom' && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-700 dark:text-stone-300">Background Hex:</span>
                    <input
                      type="text"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      placeholder="#ffffff"
                      className="w-24 h-8 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2 text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="text-red-600 dark:text-red-400 font-semibold text-xs pt-1">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Action Bar for Queue */}
            <div className="flex items-center justify-between px-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  {documents.length} {documents.length === 1 ? 'Word Document' : 'Word Documents'} in PDF sequence
                </span>
                {selectedIds.length > 0 && (
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    ({selectedIds.length} selected)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <button
                    onClick={removeSelected}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Remove Selected</span>
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="px-3 py-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Remove All
                </button>
                <button
                  onClick={() => appendFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-stone-900 dark:bg-white text-white dark:text-black font-bold rounded-xl text-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Add More Documents</span>
                </button>
              </div>
            </div>

            {/* WYSIWYG Real-Time Page Sheets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {documents.map((docItem, idx) => {
                const isSelected = selectedIds.includes(docItem.id);
                const sizeKb = (docItem.size / 1024).toFixed(0);

                // Measure effective dimensions considering rotation
                const isRot90 = docItem.rotation === 90 || docItem.rotation === 270;
                const effW = isRot90 ? (docItem.naturalHeight || 842) : (docItem.naturalWidth || 595);
                const effH = isRot90 ? (docItem.naturalWidth || 595) : (docItem.naturalHeight || 842);

                // Calculate authentic physical PDF page dimensions from getPageDimensions
                const basePageDim = getPageDimensions(effW, effH);
                const marginPt = getMarginPoints();
                const finalPageW = (pageSize === 'fit' && marginOption !== 'none')
                  ? basePageDim.width + marginPt * 2
                  : basePageDim.width;
                const finalPageH = (pageSize === 'fit' && marginOption !== 'none')
                  ? basePageDim.height + marginPt * 2
                  : basePageDim.height;

                const sheetRatio = finalPageW / finalPageH;
                const isLand = finalPageW > finalPageH;

                // Exact Margin Padding in percentages
                const marginPercentX = (marginPt / finalPageW) * 100;
                const marginPercentY = (marginPt / finalPageH) * 100;

                // Human readable badge labels
                let pageNameShort = 'A4 (210×297mm)';
                if (pageSize === 'A3') pageNameShort = 'A3 (297×420mm)';
                else if (pageSize === 'A5') pageNameShort = 'A5 (148×210mm)';
                else if (pageSize === 'Letter') pageNameShort = 'US Letter (8.5×11")';
                else if (pageSize === 'Legal') pageNameShort = 'US Legal (8.5×14")';
                else if (pageSize === 'custom') pageNameShort = `Custom (${customWidth}${customUnit} × ${customHeight}${customUnit})`;
                else if (pageSize === 'fit') pageNameShort = 'Fit to Document';

                let marginLabel = 'No Margin';
                if (marginOption === 'small') marginLabel = '5mm Margin';
                else if (marginOption === 'medium') marginLabel = '10mm Margin';
                else if (marginOption === 'large') marginLabel = '20mm Margin';
                else if (marginOption === 'custom') marginLabel = `${(customMargin * 0.3528).toFixed(0)}mm Margin`;

                let fitLabel = 'Fit (No Crop)';
                if (fittingOption === 'fill') fitLabel = 'Fill (Cover)';
                else if (fittingOption === 'stretch') fitLabel = 'Stretch (Full)';
                else if (fittingOption === 'original') fitLabel = '1:1 Original';
                else if (fittingOption === 'center') fitLabel = 'Centered';

                // Real Paper Background Color
                const paperBgColor = getSheetBgColor();

                // Object fit class
                let objectFitClass = 'object-contain';
                if (fittingOption === 'fill') {
                  objectFitClass = 'object-cover';
                } else if (fittingOption === 'stretch') {
                  objectFitClass = 'object-fill';
                }

                // Container sizing for original / center
                let containerStyle: React.CSSProperties = { width: '100%', height: '100%' };
                if (fittingOption === 'center') {
                  containerStyle = { width: '85%', height: '85%' };
                } else if (fittingOption === 'original') {
                  const availW = Math.max(10, finalPageW - marginPt * 2);
                  const availH = Math.max(10, finalPageH - marginPt * 2);
                  const scale = Math.min(1, availW / (effW * 0.75), availH / (effH * 0.75));
                  const pctW = Math.min(100, Math.round(((effW * 0.75 * scale) / availW) * 100));
                  const pctH = Math.min(100, Math.round(((effH * 0.75 * scale) / availH) * 100));
                  containerStyle = { width: `${pctW}%`, height: `${pctH}%` };
                }

                return (
                  <div 
                    key={docItem.id} 
                    className={`bg-white dark:bg-stone-900 rounded-3xl border p-3.5 relative group shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                      isSelected ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    {/* Select Checkbox */}
                    <div 
                      onClick={() => toggleSelect(docItem.id)}
                      className={`absolute top-4 right-4 z-20 w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-colors shadow-xs ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>

                    {/* WYSIWYG Page Sheet Workspace Canvas */}
                    <div className="relative w-full flex items-center justify-center p-3.5 bg-stone-100/90 dark:bg-stone-950/80 rounded-2xl min-h-[360px] overflow-hidden border border-stone-200/60 dark:border-stone-800/60">
                      {/* Live Physical Page Size Badge */}
                      <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 bg-stone-900/80 dark:bg-black/80 backdrop-blur-xs text-white text-[10px] font-bold rounded-md flex items-center gap-1 shadow-2xs">
                        <span>{pageNameShort}</span>
                      </div>

                      {/* The Authentic Physical PDF Page Sheet */}
                      <div 
                        className="relative shadow-2xl rounded-sm overflow-hidden transition-all duration-300 border border-stone-300/80 dark:border-stone-700/80 flex items-center justify-center"
                        style={{
                          width: isLand ? '270px' : `${Math.min(270, Math.max(160, Math.round(330 * sheetRatio)))}px`,
                          maxWidth: '100%',
                          aspectRatio: `${sheetRatio}`,
                          backgroundColor: paperBgColor
                        }}
                      >
                        {/* Printable Safe Area with Margin Boundaries */}
                        <div 
                          className={`absolute flex items-center justify-center overflow-hidden transition-all duration-200 ${
                            marginOption !== 'none' ? 'border border-dashed border-blue-500/50 dark:border-blue-400/50' : ''
                          }`}
                          style={{
                            left: `${marginPercentX}%`,
                            right: `${marginPercentX}%`,
                            top: `${marginPercentY}%`,
                            bottom: `${marginPercentY}%`
                          }}
                        >
                          {docItem.previewUrl ? (
                            <div 
                              className="relative flex items-center justify-center transition-all duration-300 overflow-hidden"
                              style={containerStyle}
                            >
                              <img
                                src={docItem.previewUrl}
                                alt={docItem.name}
                                className={`transition-all duration-300 select-none ${objectFitClass}`}
                                style={{ 
                                  width: isRot90 ? `${(effH / effW) * 100}%` : '100%',
                                  height: isRot90 ? `${(effW / effH) * 100}%` : '100%',
                                  transform: docItem.rotation ? `rotate(${docItem.rotation}deg)` : undefined,
                                  transformOrigin: 'center center'
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2 text-stone-400 p-4 text-center">
                              <Loader2 size={24} className="animate-spin text-blue-500" />
                              <span className="text-[10px] font-bold">Rendering Document...</span>
                            </div>
                          )}
                        </div>

                        {/* Informative Page Badges */}
                        <div className="absolute top-1.5 left-1.5 bg-black/85 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs pointer-events-none z-10 flex items-center gap-1">
                          <span>Doc {idx + 1}</span>
                        </div>
                        <div className="absolute top-1.5 right-1.5 bg-black/80 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none z-10 uppercase tracking-wider">
                          <span>{isLand ? 'Landscape' : 'Portrait'}</span>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none z-10">
                          {pageNameShort}
                        </div>
                        <div className="absolute bottom-1.5 right-1.5 bg-black/75 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs pointer-events-none z-10">
                          {marginLabel} • {fitLabel}
                        </div>
                      </div>
                    </div>

                    {/* Control Bar Footer */}
                    <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 dark:text-stone-300">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="truncate" title={docItem.name}>{docItem.name}</span>
                          <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                            {docItem.name.toLowerCase().endsWith('.docx') ? 'DOCX' : 'DOC'}
                          </span>
                        </div>
                        <span className="text-stone-400 shrink-0 ml-1.5">{sizeKb} KB</span>
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button 
                            onClick={() => handleRotate(docItem.id, 'left')} 
                            className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg transition-colors cursor-pointer" 
                            title="Rotate Left -90°"
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button 
                            onClick={() => handleRotate(docItem.id, 'right')} 
                            className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg transition-colors cursor-pointer" 
                            title="Rotate Right +90°"
                          >
                            <RotateCw size={14} />
                          </button>
                          <button 
                            onClick={() => setPreviewingDoc(docItem)} 
                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold rounded-lg transition-colors cursor-pointer" 
                            title="Full Document Preview"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => handleDuplicate(docItem)} 
                            className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg transition-colors cursor-pointer" 
                            title="Duplicate Document"
                          >
                            <Copy size={14} />
                          </button>
                          <button 
                            onClick={() => handleReplaceClick(docItem.id)} 
                            className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg transition-colors cursor-pointer" 
                            title="Replace Document File"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {idx > 0 && (
                            <button 
                              onClick={() => handleMove(idx, 'up')} 
                              className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg transition-colors cursor-pointer" 
                              title="Move Earlier in PDF"
                            >
                              <ArrowUp size={14} />
                            </button>
                          )}
                          {idx < documents.length - 1 && (
                            <button 
                              onClick={() => handleMove(idx, 'down')} 
                              className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg transition-colors cursor-pointer" 
                              title="Move Later in PDF"
                            >
                              <ArrowDown size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(docItem.id)} 
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors cursor-pointer" 
                            title="Delete Document"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cloud Storage File Picker Modal */}
      {isCloudPickerModalOpen && (
        <CloudStorageModal
          isOpen={isCloudPickerModalOpen}
          onClose={() => setIsCloudPickerModalOpen(false)}
          initialProvider={cloudModalProvider}
          fileType="word"
          onFilesImported={(files) => {
            addFilesToQueue(files);
            setIsCloudPickerModalOpen(false);
          }}
        />
      )}

      {/* Full Document Preview Modal */}
      {previewingDoc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText size={20} className="text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-stone-900 dark:text-white truncate">{previewingDoc.name}</h4>
                  <p className="text-[11px] text-stone-400">{(previewingDoc.size / 1024).toFixed(0)} KB • High-Fidelity Word Preview</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
                  <button
                    onClick={() => setPreviewZoom(prev => Math.max(50, prev - 15))}
                    className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 rounded-lg cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 px-1">
                    {previewZoom}%
                  </span>
                  <button
                    onClick={() => setPreviewZoom(prev => Math.min(150, prev + 15))}
                    className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 rounded-lg cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>

                <button
                  onClick={() => setPreviewingDoc(null)}
                  className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-white rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Render Container */}
            <div className="flex-1 overflow-auto bg-stone-100 dark:bg-stone-950 p-6 flex flex-col items-center justify-start">
              {isPreviewModalLoading && (
                <div className="my-auto flex flex-col items-center gap-3 text-stone-400">
                  <Loader2 size={36} className="animate-spin text-blue-600" />
                  <p className="text-xs font-bold">Rendering authentic Word layout...</p>
                </div>
              )}
              <div 
                style={{ 
                  transform: `scale(${previewZoom / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out'
                }}
                className="w-full flex flex-col items-center"
              >
                <div 
                  ref={modalPreviewContainerRef} 
                  className="w-full max-w-[800px] bg-white shadow-2xl rounded-sm p-4 text-stone-900" 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal Dialog */}
      {showShareModal && lastResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Share2 size={16} className="text-blue-600" />
                <span>Share Converted PDF</span>
              </h4>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-stone-900 dark:text-white truncate">{lastResult.filename}</p>
                <p className="text-[11px] text-stone-500">{(lastResult.blob.size / 1024).toFixed(0)} KB • {lastResult.pageCount} Pages</p>
              </div>
              <button
                onClick={handleManualDownload}
                className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer hover:bg-blue-700"
              >
                Download
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-stone-500 block">Copy PDF File Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="flex-1 px-3 py-2 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2000);
                  }}
                  className="px-3.5 py-2 bg-stone-900 dark:bg-white text-white dark:text-black font-bold text-xs rounded-xl cursor-pointer hover:opacity-90"
                >
                  {shareCopied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Save Modal Dialog */}
      {showCloudSaveModal && lastResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Cloud size={16} className="text-blue-600" />
                <span>Save to Cloud Storage</span>
              </h4>
              <button
                onClick={() => setShowCloudSaveModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Save your converted PDF <strong className="text-stone-800 dark:text-stone-200 font-bold">{lastResult.filename}</strong> directly to your cloud drive:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSaveToCloud('Google Drive')}
                disabled={cloudSaving}
                className="p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-xs transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
              >
                <GoogleDriveAnimatedIcon className="w-6 h-6" />
                <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">Google Drive</span>
              </button>

              <button
                onClick={() => handleSaveToCloud('Dropbox')}
                disabled={cloudSaving}
                className="p-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-xs transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
              >
                <DropboxAnimatedIcon className="w-6 h-6" />
                <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">Dropbox</span>
              </button>
            </div>

            {cloudSaving && (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-600 py-2">
                <Loader2 size={14} className="animate-spin" />
                <span>Uploading to cloud storage...</span>
              </div>
            )}

            {cloudSaveSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center">
                {cloudSaveSuccess}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
