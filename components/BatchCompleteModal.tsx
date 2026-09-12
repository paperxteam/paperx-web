import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Download, 
  Archive, 
  FileText, 
  ArrowRight, 
  RefreshCw, 
  Check, 
  Sparkles, 
  Layers, 
  FolderDown, 
  Eye, 
  Share2, 
  X,
  Minimize2,
  HardDrive
} from 'lucide-react';
import { BatchProcessResult, BatchItemResult } from '../types';
import { shareOrOpenFullFile } from '../src/utils/fileShare';

interface BatchCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: BatchProcessResult | null;
  onProcessAnother: () => void;
  onReturnDashboard: () => void;
}

export const BatchCompleteModal: React.FC<BatchCompleteModalProps> = ({
  isOpen,
  onClose,
  result,
  onProcessAnother,
  onReturnDashboard
}) => {
  const [downloadedItems, setDownloadedItems] = useState<{ [key: string]: boolean }>({});
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !result) return null;

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const handleDownloadSingle = (item: BatchItemResult) => {
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedItems(prev => ({ ...prev, [item.id]: true }));
  };

  const handleShareSingle = async (item: BatchItemResult) => {
    await shareOrOpenFullFile({
      id: item.id,
      name: item.filename,
      blob: item.blob,
      size: formatSize(item.size),
      type: item.type || 'PDF'
    });
  };

  const handleDownloadBundle = () => {
    const url = URL.createObjectURL(result.bundleBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.bundleFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllSeparately = async () => {
    setIsDownloadingAll(true);
    for (let i = 0; i < result.items.length; i++) {
      const item = result.items[i];
      handleDownloadSingle(item);
      // Small delay between downloads so browser doesn't block them
      await new Promise(res => setTimeout(res, 350));
    }
    setIsDownloadingAll(false);
  };

  const handlePreview = (item: BatchItemResult) => {
    const url = URL.createObjectURL(item.blob);
    window.open(url, '_blank');
  };

  const handleCopySummary = () => {
    const text = `PaperX ${result.toolName} Batch Complete: ${result.items.length} file(s) processed (${formatSize(result.totalProcessedSize)}).`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const hasSavings = result.totalSavingsPercentage && result.totalSavingsPercentage > 0;

  return (
    <div 
      id="batch-complete-modal" 
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header decoration bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-emerald-500 to-indigo-500" />

        {/* Close Button */}
        <button
          id="batch-modal-close"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors z-10"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-stone-100 dark:border-stone-800 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 size={24} className="animate-pulse-soft" />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  {result.toolName}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles size={12} /> 100% Processed
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight mt-1 font-heading">
                Batch Complete
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                {result.items.length} document{result.items.length > 1 ? 's' : ''} successfully processed and ready for download.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Total Output</span>
              <div className="text-sm font-black text-stone-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                <Layers size={14} className="text-stone-400" />
                {result.items.length} File{result.items.length > 1 ? 's' : ''}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Processed Size</span>
              <div className="text-sm font-black text-stone-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                <HardDrive size={14} className="text-stone-400" />
                {formatSize(result.totalProcessedSize)}
              </div>
            </div>

            {hasSavings ? (
              <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                <span className="text-[10px] uppercase font-bold tracking-wider">Space Saved</span>
                <div className="text-sm font-black mt-0.5 flex items-center gap-1.5">
                  <Minimize2 size={14} />
                  -{result.totalSavingsPercentage}% ({formatSize(result.totalOriginalSize - result.totalProcessedSize)})
                </div>
              </div>
            ) : (
              <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Status</span>
                <div className="text-sm font-black text-stone-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-500" />
                  Ready to Save
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Primary Download Call-To-Action Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-stone-900 to-black dark:from-stone-950 dark:to-stone-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="font-bold text-xs sm:text-sm flex items-center gap-2">
              <Archive size={16} className="text-amber-400" />
              <span>Download Full Batch Package</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {result.isBundleZip 
                ? `Includes all ${result.items.length} files compressed in a single .ZIP file (${formatSize(result.bundleBlob.size)})`
                : `Download the primary output file (${formatSize(result.bundleBlob.size)})`}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              id="batch-download-bundle-btn"
              onClick={handleDownloadBundle}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Download size={14} />
              <span>{result.isBundleZip ? 'Download ZIP Package' : 'Download Output'}</span>
            </button>

            {result.items.length > 1 && (
              <button
                id="batch-download-all-separate-btn"
                onClick={handleDownloadAllSeparately}
                disabled={isDownloadingAll}
                className="px-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-stone-700"
                title="Download each file separately"
              >
                <FolderDown size={14} />
                <span className="hidden sm:inline">{isDownloadingAll ? 'Downloading...' : 'All Separate'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable File List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 divide-y divide-stone-100 dark:divide-stone-800/60 max-h-60 sm:max-h-72">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1 pb-1">
            Individual Files ({result.items.length})
          </div>

          {result.items.map((item, idx) => {
            const isDownloaded = downloadedItems[item.id];
            return (
              <div 
                key={item.id || idx}
                className="pt-2.5 flex items-center justify-between gap-3 group hover:bg-stone-50/60 dark:hover:bg-stone-800/40 p-2 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0 border border-stone-200/60 dark:border-stone-700/60">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate" title={item.filename}>
                      {item.filename}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                      <span>{formatSize(item.size)}</span>
                      {item.originalSize > 0 && item.originalSize !== item.size && (
                        <>
                          <span>•</span>
                          <span className="text-stone-400 line-through">{formatSize(item.originalSize)}</span>
                          {item.savingsPercentage && item.savingsPercentage > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              (-{item.savingsPercentage}%)
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id={`share-item-btn-${idx}`}
                    onClick={() => handleShareSingle(item)}
                    className="p-2 rounded-xl text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:hover:bg-indigo-900/80 transition-colors"
                    title="Share full PDF file directly"
                  >
                    <Share2 size={14} />
                  </button>

                  <button
                    onClick={() => handlePreview(item)}
                    className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-700/60 transition-colors"
                    title="Preview in new tab"
                  >
                    <Eye size={14} />
                  </button>

                  <button
                    id={`download-item-btn-${idx}`}
                    onClick={() => handleDownloadSingle(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isDownloaded
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-stone-100 hover:bg-stone-900 hover:text-white dark:bg-stone-800 dark:hover:bg-white dark:hover:text-stone-950 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    {isDownloaded ? <Check size={12} /> : <Download size={12} />}
                    <span>{isDownloaded ? 'Downloaded' : 'Download'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1 font-medium transition-colors"
            >
              {isCopied ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
              <span>{isCopied ? 'Summary Copied' : 'Share Summary'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              id="batch-process-another-btn"
              onClick={onProcessAnother}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold text-xs border border-stone-200 dark:border-stone-700 flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <RefreshCw size={13} />
              <span>Process More</span>
            </button>

            <button
              id="batch-dashboard-btn"
              onClick={onReturnDashboard}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:hover:bg-stone-200 dark:text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <span>Dashboard</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
