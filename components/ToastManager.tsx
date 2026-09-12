import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Minimize2, 
  ArrowRightLeft, 
  Combine, 
  ShieldCheck, 
  FileText, 
  Download, 
  X, 
  AlertCircle, 
  Info, 
  Sparkles,
  Scissors,
  Mic
} from 'lucide-react';
import { ToastNotificationItem } from '../types';

interface ToastManagerProps {
  toasts: ToastNotificationItem[];
  onDismiss: (id: string) => void;
  onDownloadFile?: (item: ToastNotificationItem) => void;
}

const getTaskIcon = (toolName?: string, type?: string) => {
  if (type === 'error') return <AlertCircle size={16} className="text-rose-500" />;
  if (type === 'info') return <Info size={16} className="text-amber-500" />;
  
  const lower = (toolName || '').toLowerCase();
  if (lower.includes('compress')) return <Minimize2 size={16} className="text-amber-500" />;
  if (lower.includes('convert') || lower.includes('to word') || lower.includes('to pdf')) return <ArrowRightLeft size={16} className="text-emerald-500" />;
  if (lower.includes('merge') || lower.includes('combine')) return <Combine size={16} className="text-indigo-500" />;
  if (lower.includes('split')) return <Scissors size={16} className="text-sky-500" />;
  if (lower.includes('protect') || lower.includes('encrypt') || lower.includes('sign')) return <ShieldCheck size={16} className="text-emerald-500" />;
  if (lower.includes('ocr') || lower.includes('scan') || lower.includes('text')) return <FileText size={16} className="text-stone-700 dark:text-stone-300" />;
  if (lower.includes('voice')) return <Mic size={16} className="text-amber-500" />;
  
  return <CheckCircle2 size={16} className="text-emerald-500" />;
};

const ToastItem: React.FC<{
  toast: ToastNotificationItem;
  onDismiss: (id: string) => void;
  onDownloadFile?: (item: ToastNotificationItem) => void;
}> = ({ toast, onDismiss, onDownloadFile }) => {
  const duration = toast.duration || 5000;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: 12, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      id={`toast-${toast.id}`}
      className="relative overflow-hidden w-full max-w-sm sm:max-w-md rounded-2xl bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-800 shadow-[0_12px_35px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl p-3.5 sm:p-4 group"
    >
      <div className="flex items-start gap-3">
        {/* Subtle Icon Badge */}
        <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          {getTaskIcon(toast.toolName, toast.type)}
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold tracking-tight text-stone-900 dark:text-stone-50 truncate">
              {toast.title}
            </h4>
            {toast.toolName && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 shrink-0">
                {toast.toolName}
              </span>
            )}
          </div>

          <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-300 mt-0.5 line-clamp-2 leading-relaxed">
            {toast.message}
          </p>

          {/* Optional File metadata and action */}
          <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-stone-100 dark:border-stone-800/60">
            <div className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400 font-medium truncate">
              {toast.fileName && (
                <span className="truncate max-w-[140px] sm:max-w-[200px]" title={toast.fileName}>
                  {toast.fileName}
                </span>
              )}
              {toast.fileSize && (
                <>
                  <span>•</span>
                  <span>{toast.fileSize}</span>
                </>
              )}
            </div>

            {toast.downloadBlob && onDownloadFile && (
              <button
                id={`toast-download-btn-${toast.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadFile(toast);
                }}
                className="px-2.5 py-1 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-[10px] font-bold flex items-center gap-1 hover:bg-stone-800 dark:hover:bg-white transition-all shadow-sm shrink-0"
              >
                <Download size={11} />
                <span>Save</span>
              </button>
            )}
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          id={`toast-dismiss-${toast.id}`}
          onClick={() => onDismiss(toast.id)}
          className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0 -mr-1 -mt-1"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>

      {/* Subtle Auto-dismiss Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-100 dark:bg-stone-800">
        <div 
          className="h-full bg-amber-500 dark:bg-amber-400 transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

export const ToastManager: React.FC<ToastManagerProps> = () => {
  return null;
};
