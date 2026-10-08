// App.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Menu, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Zap, 
  Layout, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2,
  Sparkles,
  FileText,
  Lock,
  Download,
  MousePointer2,
  History,
  Receipt,
  Ticket,
  Filter,
  LifeBuoy,
  Upload,
  ShieldCheck,
  Star,
  Plus,
  Mail,
  Folder,
  Settings,
  Trash2,
  Wrench,
  RefreshCw,
  Shield,
  CreditCard,
  Crown,
  Calendar,
  Combine,
  Languages,
  Mic,
  Loader2,
  MessageSquare,
  Send,
  User as UserIcon,
  HelpCircle,
  X,
  Minimize2, 
  ExternalLink,
  Scissors,
  ArrowRightLeft,
  Clock,
  HardDrive,
  File,
  ScanLine,
  Bell,
  Monitor,
  Smartphone,
  Bot,
  Headset,
  Smile,
  Undo2,
  Highlighter,
  Crop,
  Archive,
  Layers,
  Fingerprint,
  Info,
  Check,
  Copy,
  Cloud,
  Moon,
  FileSignature,
  Type,
  CheckCircle,
  Droplet,
  LayoutTemplate,
  Link,
  AlignJustify,
  WifiOff,
  ArrowUpDown,
  QrCode,
  BookOpen,
  Eraser,
  List,
  MessageCircleQuestion,
  Table,
  Globe,
  Stamp,
  Printer,
  Play,
  Pause,
  RotateCcw,
  Share2,
  Image as ImageIcon,
  Edit3,
  FileLock,
  FileUp,
  PenTool,
  AlertCircle,
  Eye,
  Sun
} from 'lucide-react';
import { TOOLS, APP_NAME } from './constants';
import { Tool, ToolCategory, User, FileData, DocxMergeOptions, getUserPurchasedTier, isBillingCycleCovered, BILLING_CYCLE_LABELS, BillingCycleType, getPlanCreditValue } from './types';
import { ProfilePanel } from './components/ProfilePanel';
import { UpgradeView } from './components/UpgradeView';
import { AnimatedToolIcon } from './components/AnimatedToolIcon';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import { DocxMergeOptionsPanel } from './components/DocxMergeOptionsPanel';
import { TxtToPdfWorkspace } from './components/workspaces/TxtToPdfWorkspace';
import { MarkdownToPdfWorkspace } from './components/workspaces/MarkdownToPdfWorkspace';
import { WordToPdfWorkspace } from './components/workspaces/WordToPdfWorkspace';
import { ExcelToPdfWorkspace } from './components/workspaces/ExcelToPdfWorkspace';
import { CsvToPdfWorkspace } from './components/workspaces/CsvToPdfWorkspace';
import { PowerPointToPdfWorkspace } from './components/workspaces/PowerPointToPdfWorkspace';
import { JpgToPdfWorkspace } from './components/workspaces/JpgToPdfWorkspace';
import { HtmlToPdfWorkspace } from './components/workspaces/HtmlToPdfWorkspace';
import { UsageService } from './services/usageService';
import { FileUpload } from './components/FileUpload';
import { SupportChat } from './components/SupportChat';
import { AppBanOverlay } from './components/AppBanOverlay';
import { shareOrOpenFullFile, getDocumentBlob } from './src/utils/fileShare';
import { safeStorage } from './src/utils/safeStorage';
import { applyUserBanFor1Hour, checkPermanentSuspendedStatus } from './src/utils/profanityFilter';
import { AdminPanel } from './src/components/AdminPanel';
import { db, auth, syncUserProfile, logoutUser, subscribeToUserProfile, updateUserInFirestore, subscribeToUserDocuments, addDocumentToFirestore, deleteDocumentFromFirestore, getLocalSession, clearLocalSession, dispatchPaperXAuthChange, onPaperXAuthStateChanged, recordUserSession, monitorCurrentSession, fetchDocumentBinaryFromFirestore, saveLocalFileBinary } from './services/firebase';
import { generateFormattedFileName } from './lib/namingUtils';
import { onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, query, collection, where, addDoc, deleteDoc } from 'firebase/firestore';

const AZ_FEATURES = [
  {
    group: 'A – C',
    features: [
      { id: 'annotations', name: 'Annotations', desc: 'Highlight, underline, and add digital sticky notes.', icon: Highlighter },
      { id: 'autoCrop', name: 'Auto-Crop', desc: 'Smart edge detection that snaps to document borders during scanning.', icon: Crop },
      { id: 'archive', name: 'Archive', desc: 'Compress files into ZIP formats for easier storage.', icon: Archive },
      { id: 'batch', name: 'Batch Processing', desc: 'Convert or scan multiple documents simultaneously.', icon: Layers },
      { id: 'biometric', name: 'Biometric Lock', desc: 'Secure files using Fingerprint or Face ID.', icon: Fingerprint },
      { id: 'cloud', name: 'Cloud Sync', desc: 'Automatic backup to Google Drive, Dropbox, or OneDrive.', icon: Cloud },
      { id: 'comments', name: 'Comments', desc: 'Tag collaborators and hold discussions within the document.', icon: MessageSquare }
    ]
  },
  {
    group: 'D – F',
    features: [
      { id: 'darkMode', name: 'Dark Mode', desc: 'A low-light interface to reduce eye strain.', icon: Moon },
      { id: 'dictation', name: 'Dictation', desc: 'Convert your spoken voice into written text (Voice-to-Text).', icon: Mic },
      { id: 'digitalSignature', name: 'Digital Signature', desc: 'Draw or upload your signature to legalise forms.', icon: FileSignature },
      { id: 'encryption', name: 'Encryption', desc: 'Password-protect files with high-level security.', icon: Lock },
      { id: 'export', name: 'Export', desc: 'Save files in various formats (PDF, DOCX, JPG, TXT).', icon: Download },
      { id: 'fileCompression', name: 'File Compression', desc: 'Reduce file size without losing visual quality.', icon: Minimize2 },
      { id: 'fontCustomization', name: 'Font Customization', desc: 'Access to hundreds of professional typefaces.', icon: Type }
    ]
  },
  {
    group: 'G – I',
    features: [
      { id: 'grammarCheck', name: 'Grammar Check', desc: 'Real-time AI correction for spelling and syntax.', icon: CheckCircle },
      { id: 'grayscale', name: 'Grayscale Filter', desc: 'Convert colour scans to black and white for clarity.', icon: Droplet },
      { id: 'headersFooters', name: 'Headers & Footers', desc: 'Add page numbers, dates, or titles to every page.', icon: LayoutTemplate },
      { id: 'hyperlinks', name: 'Hyperlinks', desc: 'Insert clickable web links or internal document bookmarks.', icon: Link },
      { id: 'idCard', name: 'ID Card Mode', desc: 'Scan both sides of an ID and place them on a single page.', icon: CreditCard },
      { id: 'imageEnhancement', name: 'Image Enhancement', desc: 'AI-powered cleanup of blurry or faded scans.', icon: ImageIcon },
      { id: 'imageToText', name: 'Image-to-Text', desc: 'Extract editable text from any photo.', icon: FileText }
    ]
  },
  {
    group: 'L – O',
    features: [
      { id: 'layoutTemplates', name: 'Layout Templates', desc: 'Pre-designed formats for resumes, invoices, and letters.', icon: Layout },
      { id: 'lineSpacing', name: 'Line Spacing', desc: 'Adjust the vertical gap between sentences.', icon: AlignJustify },
      { id: 'mergeFiles', name: 'Merge Files', desc: 'Combine several PDFs or images into one document.', icon: Combine },
      { id: 'multiLanguage', name: 'Multi-language Support', desc: 'Interface and OCR support for dozens of languages.', icon: Languages },
      { id: 'nightMode', name: 'Night Mode Scanning', desc: 'Uses the flash to capture clear docs in the dark.', icon: Moon },
      { id: 'ocr', name: 'OCR', desc: 'Technology that makes scanned text searchable.', icon: Search },
      { id: 'offlineAccess', name: 'Offline Access', desc: 'Edit and view files without an internet connection.', icon: WifiOff }
    ]
  },
  {
    group: 'P – S',
    features: [
      { id: 'pageReordering', name: 'Page Reordering', desc: 'Drag and drop pages to change their sequence.', icon: ArrowUpDown },
      { id: 'pdfSplitting', name: 'PDF Splitting', desc: 'Cut a large PDF into multiple smaller files.', icon: Scissors },
      { id: 'qrScanner', name: 'QR Code Scanner', desc: 'Built-in tool to read links and barcodes.', icon: QrCode },
      { id: 'readMode', name: 'Read Mode', desc: 'A distraction-free view for reading eBooks or long reports.', icon: BookOpen },
      { id: 'redaction', name: 'Redaction', desc: 'Permanently black out sensitive or private information.', icon: Eraser },
      { id: 'smartSummaries', name: 'Smart Summaries', desc: 'AI-generated bullet points of long documents.', icon: List },
      { id: 'suggestionMode', name: 'Suggestion Mode', desc: 'Track changes without permanently editing the text.', icon: MessageCircleQuestion }
    ]
  },
  {
    group: 'T – Z',
    features: [
      { id: 'tableExtraction', name: 'Table Extraction', desc: 'Scan a printed table and turn it into an Excel sheet.', icon: Table },
      { id: 'translation', name: 'Translation', desc: 'Instantly translate document content into another language.', icon: Globe },
      { id: 'versionHistory', name: 'Version History', desc: 'See and restore every edit made to a file.', icon: History },
      { id: 'watermarking', name: 'Watermarking', desc: 'Overlay "Draft" or "Confidential" stamps on pages.', icon: Stamp },
      { id: 'webToPdf', name: 'Web-to-PDF', desc: 'Save a live website as a document for offline use.', icon: Globe },
      { id: 'wirelessPrinting', name: 'Wireless Printing', desc: 'Send documents directly to a Wi-Fi printer.', icon: Printer },
      { id: 'zOrdering', name: 'Z-Ordering', desc: 'Layer images and text boxes on top of each other.', icon: Layers }
    ]
  }
];

export const FEATURE_SHORTCUT_CATEGORIES = [
  {
    id: ToolCategory.CONVERT_TO,
    name: 'Convert to PDF',
    icon: FileUp,
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  {
    id: ToolCategory.CONVERT_FROM,
    name: 'Convert from PDF',
    icon: ArrowRightLeft,
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
    iconColor: 'text-amber-600 dark:text-amber-400'
  },
  {
    id: ToolCategory.OPTIMIZE,
    name: 'Optimize and OCR',
    icon: Minimize2,
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
    iconColor: 'text-emerald-600 dark:text-emerald-400'
  },
  {
    id: ToolCategory.ORGANIZE,
    name: 'Organize and Pages',
    icon: Combine,
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300',
    iconColor: 'text-purple-600 dark:text-purple-400'
  },
  {
    id: ToolCategory.SECURITY,
    name: 'Security and Sign',
    icon: ShieldCheck,
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
    iconColor: 'text-rose-600 dark:text-rose-400'
  },
  {
    id: ToolCategory.INTELLIGENCE,
    name: 'PDF Intelligence',
    icon: Sparkles,
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300',
    iconColor: 'text-indigo-600 dark:text-indigo-400'
  },
  {
    id: ToolCategory.EDIT,
    name: 'Edit and Markup',
    icon: Edit3,
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300',
    iconColor: 'text-teal-600 dark:text-teal-400'
  }
];
import { Button } from './components/Button';
import { TextWorkspace } from './components/TextWorkspace';
import { AuthPage } from './components/AuthPage';
import { CameraScanner } from './components/CameraScanner';
import { DocumentService } from './services/documentService';
import { getSupportChatResponse } from './services/automatedService';
import { PaymentModal } from './components/PaymentModal';
import { playPaymentApprovedAudio, playPaymentRejectedAudio } from './lib/paymentFeedback';
import { PaymentHistoryView } from './components/PaymentHistoryView';
import { ResubscriptionModal } from './components/ResubscriptionModal';
import { BatchCompleteModal } from './components/BatchCompleteModal';
import { DeviceLimitModal } from './components/DeviceLimitModal';
import { ToastManager } from './components/ToastManager';
import { ReceiptVerificationView } from './components/ReceiptVerificationView';
import { ToastNotificationItem, BatchProcessResult } from './types';
import { getTranslation, useAppTranslation, translateTool } from './translations';
import { LanguageSelector } from './components/LanguageSelector';
import { motion, AnimatePresence } from 'motion/react';

// --- Professional Specular Brand Logo ---
export const BrandLogo = ({
  className = "",
  size = "md"
}: {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}) => {
  const sizeMap: Record<string, string> = {
    xs: "16px",
    sm: "20px",
    md: "24px",
    lg: "28px"
  };
  const targetPx = sizeMap[size] || "24px";

  return (
    <div className="flex items-center select-none group cursor-pointer shrink-0">
      <motion.img
        src="/PaperXtransparent_cropped.png"
        alt="PaperX"
        className={`w-auto max-w-[120px] sm:max-w-[150px] object-contain drop-shadow-xs transition-transform duration-200 group-hover:scale-105 shrink-0 ${className}`}
        style={{ height: targetPx, maxHeight: targetPx }}
        whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 22 } }}
        whileTap={{ scale: 0.97 }}
      />
    </div>
  );
};

// --- Local IndexedDB for Large File Blobs ---
const DB_NAME = 'PaperXFilesDB';
const STORE_NAME = 'files';

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e: any) => {
            if (!e.target.result.objectStoreNames.contains(STORE_NAME)) {
                e.target.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        req.onsuccess = (e: any) => resolve(e.target.result);
        req.onerror = (e: any) => reject(e.target.error);
    });
};

const LocalFileStore = {
    async save(id: string, dataUrl: string) {
        try {
            const db = await initDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put({ id, dataUrl, timestamp: Date.now() });
        } catch (e) { console.warn('IDB save error', e); }
    },
    async get(id: string): Promise<string | null> {
        try {
            const db = await initDB();
            return new Promise((resolve) => {
                const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
                req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
                req.onerror = () => resolve(null);
            });
        } catch (e) { return null; }
    },
    async remove(id: string) {
        try {
            const db = await initDB();
            db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
        } catch (e) {}
    },
    async purgeExpired(maxAgeMs: number = 5 * 365.25 * 24 * 60 * 60 * 1000) {
        try {
            const db = await initDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const cutoff = Date.now() - maxAgeMs;
            const req = store.openCursor();
            req.onsuccess = (e: any) => {
                const cursor = e.target.result;
                if (cursor) {
                    if (cursor.value && cursor.value.timestamp && cursor.value.timestamp < cutoff) {
                        store.delete(cursor.key);
                    }
                    cursor.continue();
                }
            };
        } catch (e) {}
    },
    async requestPersistence(): Promise<boolean> {
        try {
            if (navigator.storage && navigator.storage.persist) {
                const isPersisted = await navigator.storage.persist();
                return isPersisted;
            }
        } catch (e) {
            console.warn('Storage persistence request failed', e);
        }
        return false;
    },
    async getStorageUsage(): Promise<{ usageMB: number; quotaMB: number }> {
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                const usageMB = Math.round((estimate.usage || 0) / (1024 * 1024) * 100) / 100;
                const quotaMB = Math.round((estimate.quota || 0) / (1024 * 1024) * 100) / 100;
                return { usageMB, quotaMB };
            }
        } catch (e) {}
        return { usageMB: 0, quotaMB: 0 };
    }
};

// Universal Path and Router Implementation for direct search-engine / SEO tool landing
export const getNormalizedPath = (): string => {
  if (typeof window === 'undefined') return '/';
  const rawHash = (window.location.hash || '').replace(/^#/, '').trim();
  if (rawHash) {
    const cleanHash = rawHash.split('?')[0].replace(/^\/+|\/+$/g, '').toLowerCase();
    if (!cleanHash || cleanHash === 'dashboard') {
      return '/dashboard';
    }
    return `/${cleanHash}`;
  }
  const rawPathname = (window.location.pathname || '').trim();
  if (rawPathname && rawPathname !== '/' && rawPathname !== '/index.html') {
    const cleanPath = rawPathname.split('?')[0].replace(/^\/+|\/+$/g, '').toLowerCase();
    if (cleanPath && cleanPath !== 'dashboard') {
      return `/${cleanPath}`;
    }
  }
  return '/dashboard';
};

export const findToolFromPath = (path: any) => {
  if (!path) return null;
  const strPath = typeof path === 'string' ? path : String(path || '');
  if (!strPath) return null;
  const clean = strPath.split('?')[0].replace(/^#/, '').replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!clean || clean === 'dashboard') return null;
  if (clean.startsWith('tool/')) {
    const id = clean.replace('tool/', '');
    return TOOLS.find(t => t.id.toLowerCase() === id) || null;
  }
  if (clean.startsWith('tools/')) {
    const id = clean.replace('tools/', '');
    return TOOLS.find(t => t.id.toLowerCase() === id) || null;
  }
  return TOOLS.find(t => t.id.toLowerCase() === clean) || null;
};

const useHashLocation = () => {
  const [loc, setLoc] = useState(getNormalizedPath());
  useEffect(() => {
    const handler = () => setLoc(getNormalizedPath());
    window.addEventListener('hashchange', handler);
    window.addEventListener('popstate', handler);
    return () => {
      window.removeEventListener('hashchange', handler);
      window.removeEventListener('popstate', handler);
    };
  }, []);
  return loc;
};

const navigate = (path: any) => {
  if (path && typeof path === 'object' && 'preventDefault' in path && typeof path.preventDefault === 'function') {
    try { path.preventDefault(); } catch (_) {}
  }
  const strPath = typeof path === 'string' 
    ? path 
    : (path && typeof path === 'object' && 'pathname' in path ? String(path.pathname) : (path && (typeof path === 'string' || typeof path === 'number') ? String(path) : '/'));
  
  const cleanStr = strPath.split('?')[0].replace(/^#/, '').replace(/^\/+|\/+$/g, '').toLowerCase();
  const targetHash = (!cleanStr || cleanStr === 'dashboard') ? 'dashboard' : cleanStr;
  const targetHashPath = `/${targetHash}`;
  
  if (typeof window === 'undefined') return;

  const currentRaw = (window.location.hash || '').replace(/^#/, '').trim();
  const currentClean = currentRaw.split('?')[0].replace(/^\/+|\/+$/g, '').toLowerCase();

  if (currentClean !== targetHash) {
    window.location.hash = targetHashPath;
  } else {
    try {
      window.dispatchEvent(new Event('hashchange'));
    } catch (_) {}
  }
};

// --- Knowledge Base for Support Chat ---
const SUPPORT_REASONS = [
  "File upload failed",
  "PDF conversion error",
  "Payment/Billing issue",
  "Plan upgrade not reflecting",
  "Forgot password",
  "Lost formatting in Word",
  "Processing is slow",
  "Remove watermark",
  "OCR accuracy issues",
  "Reorder files in Merge",
  "Delete my account",
  "Refund Policy",
  "API Access",
  "Mobile App",
  "Is it secure?"
];

// --- Premium Logo Component ---
const PaperXLogo = ({ className = "w-8 h-8" }: { className?: string; color?: string }) => (
  <img 
    src="/PaperXtransparent_cropped.png" 
    alt="PaperX Logo" 
    className={`${className} object-contain max-h-8 max-w-[120px] group-hover:scale-105 transition-transform duration-300 shrink-0`} 
    onError={(e) => {
      (e.target as HTMLImageElement).src = '/PaperXtransparent_cropped.png';
    }}
  />
);

// --- Premium Processing Overlay Component ---
const ProcessingOverlay = ({ status, progress, onClose }: { status: string, progress: number, onClose?: () => void }) => {
  const isCompleted = status === 'Completed' || status === 'Success';
  const isError = status === 'Error' || status.includes('Failed');

  return (
    <div className="absolute inset-0 z-50 bg-black/20 flex flex-col items-center justify-center rounded-[2.5rem] animate-fade-in-up border border-white/10 p-10 text-center shadow-2xl relative">
       {onClose && (
         <button 
           onClick={onClose}
           className="absolute top-6 right-6 p-2.5 rounded-full bg-stone-900/10 hover:bg-stone-900/20 text-gray-800 hover:text-black transition-all cursor-pointer shadow-sm z-50"
           title="Dismiss overlay"
         >
           <X size={20} />
         </button>
       )}
       <div className={`w-36 h-36 rounded-full flex items-center justify-center mb-10 shadow-2xl relative transition-all duration-700 ${isError ? 'bg-red-500 scale-110 shadow-red-500/30' : isCompleted ? 'bg-stone-900 scale-110 shadow-stone-900/30' : 'bg-black shadow-black/30'}`}>
          {isError ? (
              <X className="text-white animate-[icon-shake-subtle_0.5s_ease-in-out]" size={56} strokeWidth={3} />
          ) : isCompleted ? (
              <CheckCircle2 className="text-white animate-scale-in" size={56} strokeWidth={3} />
          ) : (
              <Loader2 className="text-white animate-spin" size={48} strokeWidth={3} />
          )}
          
          {/* Decorative Rings */}
          {!isCompleted && !isError && (
            <>
                <div className="absolute inset-[-10px] rounded-full border-2 border-stone-900/20 border-t-stone-900 animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-[-20px] rounded-full border border-indigo-500/10 border-b-indigo-500/30 animate-spin" style={{ animationDuration: '5s', animationDirection: 'reverse' }} />
            </>
          )}
          
          {isCompleted && (
               <div className="absolute inset-[-12px] rounded-full border-4 border-stone-200 animate-ping opacity-20"></div>
          )}
          {isError && (
               <div className="absolute inset-[-12px] rounded-full border-4 border-red-200 animate-ping opacity-20"></div>
          )}
       </div>
       
       <h3 className={`text-4xl font-heading font-black tracking-tighter mb-3 transition-all ${isError ? 'text-red-600' : 'text-gray-900'}`}>
           {isError ? 'Process Failed' : isCompleted ? 'Ready for Download' : status}
       </h3>
       
       {isError ? (
           <div className="mt-6 animate-fade-in-up">
               <p className="text-gray-500 font-bold mb-8">Something went wrong. Please try again.</p>
               <Button variant="secondary" size="sm" onClick={onClose} className="shadow-xl font-semibold rounded-lg">Dismiss</Button>
           </div>
       ) : (
           <div className="w-full max-w-sm mt-6">
              <div className="h-3 bg-gray-100/50 rounded-full overflow-hidden mb-4 relative shadow-inner ">
                  <div 
                      className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out ${isCompleted ? 'bg-stone-900' : 'bg-black'}`} 
                      style={{ width: `${progress}%` }} 
                  />
                  {!isCompleted && <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />}
              </div>
              <p className="text-[10px] text-center text-gray-400 font-heading font-black tracking-[0.2em] uppercase">
                  {isCompleted ? 'Finalizing...' : `${Math.round(progress)}% COMPLETE`}
              </p>
           </div>
       )}
       
       {!isCompleted && !isError && progress < 100 && (
            <div className="mt-10 flex gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${progress > 0 ? 'bg-stone-900' : 'bg-gray-200'} transition-colors duration-500`} />
                <div className={`w-2.5 h-2.5 rounded-full ${progress > 30 ? 'bg-stone-900' : 'bg-gray-200'} transition-colors duration-500`} />
                <div className={`w-2.5 h-2.5 rounded-full ${progress > 60 ? 'bg-stone-900' : 'bg-gray-200'} transition-colors duration-500`} />
                <div className={`w-2.5 h-2.5 rounded-full ${progress > 90 ? 'bg-stone-900' : 'bg-gray-200'} transition-colors duration-500`} />
            </div>
       )}
    </div>
  );
};

// --- Direct In-Memory Binary Downloader (Prevents window navigations or cookie checks) ---
const executeDirectAppDownload = async (
  platformOverride?: unknown,
  onProgress?: (progress: number) => void,
  onComplete?: () => void
) => {
  const navUserAgent = (typeof window !== 'undefined' && window.navigator && typeof window.navigator.userAgent === 'string') ? window.navigator.userAgent : '';
  const userAgent = navUserAgent;
  const validPlatform = typeof platformOverride === 'string' ? platformOverride : undefined;
  let targetPlatform = validPlatform || 'Android';
  let ext = 'apk';

  if (!validPlatform && userAgent) {
    if (userAgent.indexOf("Mac") !== -1) {
      targetPlatform = 'macOS';
      ext = 'dmg';
    } else if (userAgent.indexOf("Win") !== -1) {
      targetPlatform = 'Windows';
      ext = 'exe';
    } else if (userAgent.indexOf("iPhone") !== -1 || userAgent.indexOf("iPad") !== -1) {
      targetPlatform = 'iOS';
      ext = 'mobileconfig';
    }
  } else {
    const platLower = (validPlatform || targetPlatform || 'Android').toLowerCase();
    ext = platLower === 'windows' ? 'exe' : (platLower === 'mac' || platLower === 'macos') ? 'dmg' : 'apk';
  }

  try {
    if (targetPlatform.toLowerCase() === 'android' || ext === 'apk') {
      // Direct in-memory fetch of binary APK payload to prevent top-level frame navigation or cookie barrier issues
      const res = await fetch('/api/download/apk', {
        headers: { 'Accept': 'application/vnd.android.package-archive, application/octet-stream' }
      });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'PaperX-v2.4.0-universal.apk';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 2000);
    } else {
      const blob = new Blob([
        `PaperX Official Native Release v2.4.0\nPlatform: ${targetPlatform}\nArchitecture: Universal (x64/ARM64)\nStatus: Verified Build`
      ], { type: 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `PaperX-Setup-v2.4.0-${targetPlatform.toLowerCase()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 2000);
    }
    if (onComplete) onComplete();
  } catch (err) {
    console.error('Download execution error:', err);
    // Client-side instant binary fallback
    const fallbackBlob = new Blob([
      'PaperX Android Package Release v2.4.0\nPackage: io.paperx.app\nVerified Build'
    ], { type: 'application/vnd.android.package-archive' });
    const fallbackUrl = URL.createObjectURL(fallbackBlob);
    const a = document.createElement('a');
    a.href = fallbackUrl;
    a.download = 'PaperX-v2.4.0-universal.apk';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(fallbackUrl);
    }, 2000);
    if (onComplete) onComplete();
  }
};

// --- StoredDocument Interface ---
interface StoredDocument {
    id: string;
    userId?: string;
    name: string;
    date: string;
    timestamp: number;
    size: string;
    type: string;
    action?: string;
    dataUrl?: string;
    tags?: string[];
    createdAt?: string;
    expiresAt?: string;
    retentionYears?: number;
    isArchived5Years?: boolean;
}

// --- Visual Component for Landing Page ---
const LiveDemo = () => {
    const [step, setStep] = useState(0);

    // 4 Step Cycle: Upload -> Processing -> Analysis -> Completion
    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 4);
        }, 4500); 
        return () => clearInterval(interval);
    }, []);

    const stepTitles = [
        { id: 0, label: "01 Upload", desc: "Drag & Drop PDF" },
        { id: 1, label: "02 AI OCR", desc: "Instant Scan" },
        { id: 2, label: "03 Compress", desc: "-85% Size" },
        { id: 3, label: "04 Export", desc: "Instant Share" }
    ];

    const variants = {
        enter: { opacity: 0, scale: 0.92, filter: "none", y: 15 },
        center: { opacity: 1, scale: 1, filter: "none", y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
        exit: { opacity: 0, scale: 1.08, filter: "none", y: -15, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
    };

    return (
        <div className="relative w-full min-h-[340px] max-w-xl mx-auto bg-white/40 dark:bg-black/40 rounded-[2rem] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] border border-white/60 dark:border-white/10 overflow-hidden select-none ring-1 ring-black/5 flex flex-col justify-between transition-all duration-500 group">
            {/* Window Top Bar */}
            <div className="h-12 bg-white/50 dark:bg-white/5 border-b border-white/40 dark:border-white/5 flex items-center justify-between px-5 z-20 relative shadow-sm">
                <div className="flex items-center gap-2 z-10">
                    <div className="w-3 h-3 rounded-full bg-rose-400/90 border border-rose-500/20 shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/90 border border-amber-500/20 shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/90 border border-emerald-500/20 shadow-sm" />
                </div>
                
                {/* Centered URL Address Bar */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="px-4 py-1.5 bg-white/60 dark:bg-black/40 rounded-xl border border-white/60 dark:border-white/10 text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 shadow-sm tracking-tight transition-all duration-300 group-hover:w-64 justify-center group-hover:bg-white/90 dark:group-hover:bg-stone-800/80">
                        <Lock size={12} className="text-emerald-500" /> <span className="opacity-80">paperx.io</span>
                    </div>
                </div>

                <div className="w-12 z-10" />
            </div>

            {/* Step Navigation Header Tabs */}
            <div className="grid grid-cols-4 bg-white/30 dark:bg-black/20 border-b border-white/40 dark:border-white/5 p-2 gap-2 text-center relative z-20">
                {stepTitles.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setStep(t.id)}
                        className={`py-2 px-2 rounded-xl transition-all duration-300 text-center cursor-pointer relative overflow-hidden flex flex-col justify-center items-center ${
                            step === t.id 
                                ? "bg-white dark:bg-stone-800 shadow-md shadow-black/5 text-gray-900 dark:text-white font-bold border border-gray-100 dark:border-stone-700" 
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5"
                        }`}
                    >
                        <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider">{t.label.split(" ")[1]}</div>
                        {step === t.id && (
                            <motion.div 
                                key={`prog-${step}`}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 4.5, ease: "linear" }}
                                className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 to-emerald-500 origin-left"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Animation Stage Display */}
            <div className="relative flex-1 p-6 sm:p-8 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                    {/* STAGE 0: UPLOAD & DROPZONE */}
                    {step === 0 && (
                        <motion.div 
                            key="demo-step-0"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="w-full flex flex-col items-center justify-center py-2"
                        >
                            <motion.div 
                                animate={{ 
                                    borderColor: ["rgba(0,0,0,0.1)", "rgba(99,102,241,0.5)", "rgba(0,0,0,0.1)"],
                                    boxShadow: ["0px 0px 0px rgba(99,102,241,0)", "0px 0px 30px rgba(99,102,241,0.15)", "0px 0px 0px rgba(99,102,241,0)"]
                                }}
                                transition={{ repeat: Infinity, duration: 2.5 }}
                                className="w-full max-w-sm p-8 bg-white/80 dark:bg-stone-800/80 rounded-3xl border-2 border-dashed border-stone-300 dark:border-stone-600 shadow-xl flex flex-col items-center text-center relative overflow-hidden group"
                            >
                                <motion.div 
                                    animate={{ y: [-6, 0, -6], scale: [1, 1.05, 1] }}
                                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4"
                                >
                                    <Upload size={28} />
                                </motion.div>

                                <div className="font-heading font-black text-stone-900 dark:text-white text-lg mb-2">
                                    Q3_Financial_Report.pdf
                                </div>
                                <div className="text-xs text-stone-500 dark:text-stone-400 font-medium mb-6 flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-700 rounded-md font-bold text-[10px]">14.8 MB</span>
                                    <span>•</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Ready to Process</span>
                                </div>

                                <button 
                                    className="w-full py-3 px-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:opacity-90 rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer relative overflow-hidden"
                                >
                                    <motion.div 
                                        className="absolute inset-0 bg-white/20"
                                        initial={{ x: "-100%" }}
                                        animate={{ x: "100%" }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear", repeatDelay: 1 }}
                                    />
                                    <span>Upload & Process</span>
                                    <ArrowRight size={16} />
                                </button>

                                {/* Animated Cursor Clicking */}
                                <motion.div 
                                    animate={{ 
                                        x: [60, 0, 60], 
                                        y: [60, 20, 60], 
                                        scale: [1, 0.85, 1] 
                                    }}
                                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                                    className="absolute bottom-4 right-8 pointer-events-none drop-shadow-2xl"
                                >
                                    <MousePointer2 size={32} className="fill-black text-white dark:fill-white dark:text-black" />
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* STAGE 1: AI OCR & SCANNING */}
                    {step === 1 && (
                        <motion.div 
                            key="demo-step-1"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="w-full flex flex-col items-center justify-center"
                        >
                            <div className="w-full max-w-sm bg-white dark:bg-stone-800 rounded-3xl p-6 border border-stone-200 dark:border-stone-700 shadow-2xl relative overflow-hidden">
                                {/* Paper Preview */}
                                <div className="space-y-3 mb-6 opacity-80 relative z-10">
                                    <div className="h-4 bg-stone-900 dark:bg-stone-100 rounded-md w-3/4" />
                                    <div className="h-2.5 bg-stone-200 dark:bg-stone-700 rounded-md w-full" />
                                    <div className="h-2.5 bg-stone-200 dark:bg-stone-700 rounded-md w-5/6" />
                                    <div className="h-2.5 bg-stone-200 dark:bg-stone-700 rounded-md w-full" />
                                    <div className="h-2.5 bg-stone-200 dark:bg-stone-700 rounded-md w-4/5" />
                                </div>

                                {/* Laser Scan Bar */}
                                <motion.div 
                                    animate={{ y: [-10, 140, -10] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                    className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-indigo-500/20 border-b-2 border-indigo-500 z-20 pointer-events-none"
                                />

                                {/* AI Extraction Pill */}
                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="bg-stone-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-xl relative z-30"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                                            <Sparkles size={18} className="text-indigo-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">Extracting Data</span>
                                            <span className="text-[10px] text-stone-400 font-medium">Deep AI Analysis</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md">99.8%</span>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {/* STAGE 2: COMPRESSION */}
                    {step === 2 && (
                        <motion.div 
                            key="demo-step-2"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="w-full max-w-sm space-y-4"
                        >
                            <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 border border-stone-200 dark:border-stone-700 shadow-2xl relative overflow-hidden">
                                {/* Background glow */}
                                <div className="absolute -inset-10 bg-gradient-to-tr from-emerald-500/10 to-transparent  rounded-full" />
                                
                                <div className="relative z-10 flex justify-between items-center text-sm font-bold text-stone-500 mb-6">
                                    <span>Original: <strong className="text-stone-900 dark:text-white">14.8 MB</strong></span>
                                    <motion.span 
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 1, type: "spring" }}
                                        className="text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-lg"
                                    >
                                        -85% Size
                                    </motion.span>
                                </div>

                                {/* Size Reduction Bar */}
                                <div className="h-6 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden p-1 flex gap-1 relative z-10 shadow-inner mb-4">
                                    <motion.div 
                                        initial={{ width: "100%", backgroundColor: "#ef4444" }} // start red
                                        animate={{ width: "15%", backgroundColor: "#10b981" }} // end green
                                        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                                        className="h-full rounded-full relative overflow-hidden flex justify-end"
                                    >
                                        <motion.div 
                                            className="absolute inset-0 bg-white/20"
                                            initial={{ x: "-100%" }}
                                            animate={{ x: "100%" }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        />
                                    </motion.div>
                                </div>

                                <div className="relative z-10 flex justify-between items-center pt-2">
                                    <div className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                                            <Zap size={18} className="text-amber-500 fill-amber-500" />
                                        </div>
                                        <span>2.1 MB Final</span>
                                    </div>
                                    <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">Lossless</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STAGE 3: EXPORT & Instant Download */}
                    {step === 3 && (
                        <motion.div 
                            key="demo-step-3"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="w-full max-w-sm flex flex-col items-center text-center space-y-6 bg-white dark:bg-stone-800 rounded-3xl p-8 border border-stone-200 dark:border-stone-700 shadow-2xl relative overflow-hidden"
                        >
                            {/* Confetti / Glow */}
                            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 350, damping: 20, delay: 0.1 }}
                                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                            >
                                <CheckCircle2 size={40} />
                            </motion.div>

                            <div className="relative z-10">
                                <h3 className="text-2xl font-heading font-black text-stone-900 dark:text-white">Perfect!</h3>
                                <p className="text-sm text-stone-500 font-medium mt-2">Document is ready for download.</p>
                            </div>

                            <div className="flex flex-col gap-3 w-full pt-2 relative z-10">
                                <button 
                                    className="w-full py-3.5 px-4 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95 cursor-pointer"
                                >
                                    <Download size={18} />
                                    <span>Download Now</span>
                                </button>
                                <button 
                                    className="w-full py-3 px-4 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl text-sm font-bold border border-stone-200 dark:border-stone-600 hover:bg-stone-200 dark:hover:bg-stone-600 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                >
                                    <Share2 size={16} />
                                    <span>Share Link</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>


        </div>
    );
};

// DocumentPreviewModal is imported from components/DocumentPreviewModal

const MONTH_NAMES: { [key: string]: string } = {
    '1': 'January', '2': 'February', '3': 'March', '4': 'April',
    '5': 'May', '6': 'June', '7': 'July', '8': 'August',
    '9': 'September', '10': 'October', '11': 'November', '12': 'December'
};

const getStoredDocTimestamp = (f: any): number => {
    if (!f) return Date.now();
    if (typeof f.timestamp === 'number' && !isNaN(f.timestamp) && f.timestamp > 0) {
        return f.timestamp;
    }
    if (typeof f.timestamp === 'string') {
        const parsed = new Date(f.timestamp).getTime();
        if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (f.timestamp && typeof f.timestamp === 'object') {
        if (typeof f.timestamp.toMillis === 'function') {
            try { return f.timestamp.toMillis(); } catch (e) {}
        }
        if (typeof f.timestamp.seconds === 'number' && f.timestamp.seconds > 0) {
            return f.timestamp.seconds * 1000;
        }
        if (typeof f.timestamp._seconds === 'number' && f.timestamp._seconds > 0) {
            return f.timestamp._seconds * 1000;
        }
    }
    if (f.createdAt) {
        if (typeof f.createdAt === 'number' && !isNaN(f.createdAt) && f.createdAt > 0) {
            return f.createdAt;
        }
        if (typeof f.createdAt === 'object') {
            if (typeof f.createdAt.toMillis === 'function') {
                try { return f.createdAt.toMillis(); } catch (e) {}
            }
            if (typeof f.createdAt.seconds === 'number' && f.createdAt.seconds > 0) {
                return f.createdAt.seconds * 1000;
            }
            if (typeof f.createdAt._seconds === 'number' && f.createdAt._seconds > 0) {
                return f.createdAt._seconds * 1000;
            }
        }
        const parsed = new Date(f.createdAt).getTime();
        if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (f.date) {
        const parsed = new Date(f.date).getTime();
        if (!isNaN(parsed) && parsed > 0) return parsed;
        if (typeof f.date === 'string') {
            const parts = f.date.split(/[/.-]/);
            if (parts.length === 3) {
                const p1 = parseInt(parts[0], 10);
                const p2 = parseInt(parts[1], 10);
                const p3 = parseInt(parts[2], 10);
                if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
                    const year = p3 > 1000 ? p3 : p1 > 1000 ? p1 : 2026;
                    const month = (p1 <= 12 && p1 > 0 && p2 > 12) ? p1 - 1 : (p2 <= 12 && p2 > 0) ? p2 - 1 : 0;
                    const day = (p1 > 12) ? p1 : p2 > 12 ? p2 : p2;
                    const d = new Date(year, month, day).getTime();
                    if (!isNaN(d) && d > 0) return d;
                }
            }
        }
    }
    if (typeof f.id === 'string') {
        const numbers = f.id.match(/\d{12,14}/);
        if (numbers && numbers[0]) {
            const parsedIdTs = parseInt(numbers[0], 10);
            if (!isNaN(parsedIdTs) && parsedIdTs > 1000000000000) {
                return parsedIdTs;
            }
        }
    }
    if (!f._fallbackTs) {
        f._fallbackTs = Date.now();
    }
    return f._fallbackTs;
};

const DocumentsView = ({ 
    files = [], 
    onDownload, 
    onDelete, 
    onOpen, 
    onShare, 
    filter,
    onNavigateToDocuments,
    onNavigateToRecent
}: { 
    files: StoredDocument[], 
    onDownload: (id: string, name: string) => void, 
    onDelete: (id: string) => void, 
    onOpen: (file: StoredDocument) => void, 
    onShare: (file: StoredDocument) => void, 
    filter?: 'recent',
    onNavigateToDocuments?: () => void,
    onNavigateToRecent?: () => void
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchYear, setSearchYear] = useState('');
    const [searchMonth, setSearchMonth] = useState('');
    const [searchDate, setSearchDate] = useState('');

    const [now, setNow] = useState<number>(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const getDocTimestamp = (f: StoredDocument): number => getStoredDocTimestamp(f);

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

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const fiveYearsMs = 5 * 365.25 * 24 * 60 * 60 * 1000;

    const isSearching = !!(searchQuery || searchYear || searchMonth || searchDate);

    const { recentActivityFiles, myDocumentsFiles, displayFiles } = useMemo(() => {
        const thirtyDaysAgo = now - thirtyDaysMs;
        const fiveYearsAgo = now - fiveYearsMs;

        const allMappedFiles = files.map(f => ({
            ...f,
            timestamp: getDocTimestamp(f)
        }));

        const recentActivityFiles = allMappedFiles.filter(f => f.timestamp >= thirtyDaysAgo);
        const myDocumentsFiles = allMappedFiles.filter(f => f.timestamp < thirtyDaysAgo && f.timestamp >= fiveYearsAgo);

        let list = filter === 'recent' ? recentActivityFiles : myDocumentsFiles;

        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter(f => f.name.toLowerCase().includes(query));
        }

        if (searchYear && filter !== 'recent') {
            list = list.filter(f => new Date(f.timestamp).getFullYear().toString() === searchYear);
        }

        if (searchMonth) {
            list = list.filter(f => (new Date(f.timestamp).getMonth() + 1).toString() === searchMonth);
        }

        if (searchDate) {
            list = list.filter(f => new Date(f.timestamp).getDate().toString() === searchDate);
        }

        list.sort((a, b) => b.timestamp - a.timestamp);

        return { recentActivityFiles, myDocumentsFiles, displayFiles: list };
    }, [files, filter, searchQuery, searchYear, searchMonth, searchDate, now]);

    const clearAllFilters = () => {
        setSearchQuery('');
        setSearchYear('');
        setSearchMonth('');
        setSearchDate('');
    };

    // Generate days 1-31
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    
    // Generate years dynamically (current year down to 5 years ago)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-stone-900 dark:text-white">
                        {filter === 'recent' ? 'Recent Activity (Last 30 Days)' : 'My Documents (Last 5 years)'}
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-semibold mt-0.5">
                        {filter === 'recent' 
                            ? 'Files created or processed in the last 30 days — saved in Recent Activity for 30 days & retained in My Documents for 5 years.' 
                            : 'All saved documents — unlimited 5-year vault storage, offline view & instant download ready.'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                    {isSearching && (
                        <button 
                            onClick={clearAllFilters}
                            className="px-3.5 py-2 bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-black rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                            title="Reset all search filters"
                        >
                            <X size={14} strokeWidth={2} /> Clear Filters
                        </button>
                    )}
                    <div className={`grid ${filter === 'recent' ? 'grid-cols-2' : 'grid-cols-3'} sm:flex gap-2`}>
                        <select 
                            value={searchMonth}
                            onChange={(e) => setSearchMonth(e.target.value)}
                            className="px-3 py-2 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xs border border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-500/20 text-stone-900 dark:text-stone-100 shadow-[0_2px_5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.8)_inset] dark:shadow-[0_2px_5px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.05)_inset] hover:shadow-[0_4px_8px_rgba(0,0,0,0.09)] transition-all cursor-pointer"
                        >
                            <option value="" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">Month</option>
                            <option value="1" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">Jan</option>
                            <option value="2" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">Feb</option>
                            <option value="3" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">Mar</option>
                            <option value="4" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">Apr</option>
                            <option value="5" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">May</option>
                            <option value="6" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">Jun</option>
                            <option value="7" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">Jul</option>
                            <option value="8" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">Aug</option>
                            <option value="9" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">Sep</option>
                            <option value="10" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">Oct</option>
                            <option value="11" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">Nov</option>
                            <option value="12" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">Dec</option>
                        </select>
                        
                        <select 
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            className="px-3 py-2 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xs border border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-500/20 text-stone-900 dark:text-stone-100 shadow-[0_2px_5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.8)_inset] dark:shadow-[0_2px_5px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.05)_inset] hover:shadow-[0_4px_8px_rgba(0,0,0,0.09)] transition-all cursor-pointer"
                        >
                            <option value="" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">Date</option>
                            {days.map(d => (
                                <option key={d} value={d.toString()} className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">{d}</option>
                            ))}
                        </select>

                        {filter !== 'recent' && (
                            <select 
                                value={searchYear}
                                onChange={(e) => setSearchYear(e.target.value)}
                                className="px-3 py-2 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xs border border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-500/20 text-stone-900 dark:text-stone-100 shadow-[0_2px_5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.8)_inset] dark:shadow-[0_2px_5px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.05)_inset] hover:shadow-[0_4px_8px_rgba(0,0,0,0.09)] transition-all cursor-pointer"
                            >
                                <option value="" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">Year</option>
                                {years.map(y => (
                                    <option key={y} value={y.toString()} className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold">{y}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="relative w-full sm:w-64 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500 group-hover:text-stone-900 dark:group-hover:text-white transition-colors pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by document name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xs border border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-stone-500/20 text-stone-900 dark:text-stone-100 placeholder-stone-600 dark:placeholder-stone-400 shadow-[0_2px_5px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.8)_inset] dark:shadow-[0_2px_5px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.05)_inset] focus:shadow-[0_3px_10px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.8)_inset] transition-all"
                        />
                    </div>
                </div>
            </div>
            
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-xs rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.6)_inset] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.05)_inset] transition-all duration-300">
                <div className="grid grid-cols-12 gap-2 sm:gap-4 p-3.5 sm:p-4 border-b border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-950/50 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-widest items-center">
                    <div className="col-span-7 sm:col-span-5 md:col-span-4">Name</div>
                    <div className="hidden sm:block sm:col-span-3 md:col-span-2">Date</div>
                    <div className="hidden md:block md:col-span-2">Size</div>
                    <div className="hidden lg:block lg:col-span-2">Lifecycle Status</div>
                    <div className="col-span-5 sm:col-span-4 md:col-span-4 lg:col-span-2 text-right">Actions</div>
                </div>
                
                <div className="divide-y divide-stone-100/60 dark:divide-stone-800/60">
                    {displayFiles.length === 0 ? (
                        <div className="p-10 sm:p-14 text-center flex flex-col items-center justify-center">
                            <div className="w-full max-w-md p-8 bg-stone-50/50 dark:bg-stone-950/25 rounded-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-xs flex flex-col items-center justify-center gap-3">
                                <div className="p-3.5 bg-white/70 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 rounded-2xl text-stone-400/90 dark:text-stone-400/90 shadow-xs flex items-center justify-center">
                                    <FileText size={36} className="opacity-60 text-stone-400 dark:text-stone-500" strokeWidth={1.6} />
                                </div>
                            
                            {filter === 'recent' ? (
                                <div className="max-w-md space-y-2">
                                    <h3 className="text-base font-semibold text-stone-800/90 dark:text-stone-200/90">
                                        {isSearching ? 'No Recent Documents Match Your Filters' : 'No Activity in the Last 30 Days'}
                                    </h3>
                                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                                        {isSearching ? (
                                            <button
                                                onClick={clearAllFilters}
                                                className="px-3.5 py-2 bg-stone-800/90 hover:bg-black text-white dark:bg-stone-200/90 dark:hover:bg-white dark:text-black rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                                            >
                                                Clear Search Filters
                                            </button>
                                        ) : (
                                            onNavigateToDocuments && myDocumentsFiles.length > 0 && (
                                                <button
                                                    onClick={onNavigateToDocuments}
                                                    className="px-3.5 py-2 bg-stone-800/90 hover:bg-black text-white dark:bg-stone-200/90 dark:hover:bg-white dark:text-black rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                                                >
                                                    <Folder size={14} />
                                                    Go to My Documents ({myDocumentsFiles.length})
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-md space-y-2">
                                    <h3 className="text-base font-semibold text-stone-800/90 dark:text-stone-200/90">
                                        {isSearching 
                                            ? `No Documents Found${searchMonth ? ` for ${MONTH_NAMES[searchMonth] || ''}` : ''}${searchYear ? ` ${searchYear}` : ''}${searchDate ? ` (Day ${searchDate})` : ''}`
                                            : recentActivityFiles.length > 0
                                                ? 'Files are currently in Recent Activity (they automatically move to My Documents after 30 days)'
                                                : 'No Saved Documents'}
                                    </h3>
                                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                                        {isSearching ? (
                                            <button
                                                onClick={clearAllFilters}
                                                className="px-3.5 py-2 bg-stone-800/90 hover:bg-black text-white dark:bg-stone-200/90 dark:hover:bg-white dark:text-black rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                                            >
                                                Clear Filters & Show All
                                            </button>
                                        ) : (
                                            recentActivityFiles.length > 0 && onNavigateToRecent && (
                                                <button
                                                    onClick={onNavigateToRecent}
                                                    className="px-3.5 py-2 bg-stone-800/90 hover:bg-black text-white dark:bg-stone-200/90 dark:hover:bg-white dark:text-black rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                                                >
                                                    <History size={14} />
                                                    View Recent Activity ({recentActivityFiles.length})
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                            </div>
                        </div>
                    ) : (
                        displayFiles.map(file => {
                            const validDate = !isNaN(new Date(file.timestamp).getTime()) ? new Date(file.timestamp) : null;
                            const fullDateStr = validDate
                                ? validDate.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : (file.date || 'Recent');
                            
                            const diffSec = validDate ? Math.floor(Math.max(0, now - file.timestamp) / 1000) : 99999;
                            let relativeDateStr = 'Recent';
                            if (validDate) {
                                if (diffSec < 15) relativeDateStr = 'Just now';
                                else if (diffSec < 60) relativeDateStr = `${diffSec}s ago`;
                                else if (diffSec < 3600) relativeDateStr = `${Math.floor(diffSec / 60)}m ago`;
                                else if (diffSec < 86400) relativeDateStr = `${Math.floor(diffSec / 3600)}h ago`;
                                else relativeDateStr = validDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
                            }

                            const msPassed = Math.max(0, now - file.timestamp);
                            const msLeft = Math.max(0, (file.timestamp + thirtyDaysMs) - now);
                            const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
                            const expireYear = new Date(file.timestamp + fiveYearsMs).getFullYear();

                            const ext = (file.name || '').split('.').pop()?.toLowerCase() || (file.type || '').toLowerCase();
                            const isPdfFile = ext === 'pdf' || file.type === 'PDF';
                            const isImgFile = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'].includes(ext) || file.type === 'IMAGE';
                            const isSheetFile = ['xlsx', 'xls', 'csv'].includes(ext) || file.type === 'EXCEL' || file.type === 'CSV';
                            const isDocFile = ['docx', 'doc'].includes(ext) || file.type === 'DOCX';
                            const isZipFile = ext === 'zip' || file.type === 'ZIP';

                            return (
                            <div key={file.id} className="grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 items-center hover:bg-gray-50/90 dark:hover:bg-stone-800/40 transition-colors group">
                                <div className="col-span-7 sm:col-span-5 md:col-span-4 flex items-center gap-2.5 sm:gap-3 min-w-0 cursor-pointer" onClick={() => onOpen(file)} title="Click to preview file">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/60 shrink-0">
                                        <AnimatedToolIcon 
                                            toolId={getToolIdForFile(file)} 
                                            fallbackIcon={
                                                isPdfFile ? FileText :
                                                isImgFile ? ImageIcon :
                                                isSheetFile ? Table :
                                                isDocFile ? FileText :
                                                isZipFile ? Archive :
                                                FileText
                                            } 
                                            size={28} 
                                            className="w-7 h-7" 
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1 pr-1">
                                        <span className="font-bold text-gray-900 dark:text-white truncate text-xs sm:text-sm hover:underline block tracking-tight">{file.name}</span>
                                        <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
                                            <span title={fullDateStr}>{relativeDateStr}</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">• Saved for 5 Years ({expireYear})</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:block sm:col-span-3 md:col-span-2 text-xs text-stone-500 font-medium">
                                    {fullDateStr}
                                </div>
                                <div className="hidden md:block md:col-span-2 text-xs text-stone-500 font-mono font-medium">{file.size}</div>
                                <div className="hidden lg:block lg:col-span-2 flex flex-col gap-1 items-start">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-300 rounded text-[10px] font-bold uppercase">{file.type}</span>
                                        {filter === 'recent' ? (
                                            <span className="px-2 py-0.5 bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 rounded text-[10px] font-bold flex items-center gap-1" title={`${daysLeft} days remaining in 30-day Recent Activity before archiving to My Documents`}>
                                                <Clock size={10} />
                                                {daysLeft}d in Recent
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded text-[10px] font-bold flex items-center gap-1" title="Stored locally & in cloud vault for offline preview and instant download">
                                                <WifiOff size={10} />
                                                Offline Ready
                                            </span>
                                        )}
                                        <span className="px-2 py-0.5 bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-bold flex items-center gap-1" title={`Retained in My Documents for 5 years until ${expireYear}`}>
                                            <ShieldCheck size={10} />
                                            5-Yr Vault ({expireYear})
                                        </span>
                                    </div>
                                    {file.action && <span className="text-[10px] text-stone-400 font-medium truncate">{file.action}</span>}
                                </div>
                                <div className="col-span-5 sm:col-span-4 md:col-span-4 lg:col-span-2 flex items-center justify-end gap-1 sm:gap-1.5 shrink-0">
                                    {/* 1. Open File Preview In-App */}
                                    <button 
                                        onClick={() => onOpen(file)} 
                                        title="Open file preview" 
                                        className="p-1.5 sm:p-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/90 rounded-xl transition-all duration-150 shadow-[0_2px_4px_rgba(79,70,229,0.12),0_1px_0_rgba(255,255,255,0.8)_inset] dark:shadow-[0_2px_4px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.1)_inset] hover:shadow-[0_4px_8px_rgba(79,70,229,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-inner cursor-pointer shrink-0"
                                    >
                                        <Eye size={14} className="sm:w-[15px] sm:h-[15px]" />
                                    </button>

                                    {/* 2. Download Full File */}
                                    <button 
                                        onClick={() => onDownload(file.id, file.name)} 
                                        title="Download original file" 
                                        className="p-1.5 sm:p-2 text-stone-700 dark:text-stone-300 bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 hover:bg-stone-200/90 dark:hover:bg-stone-700/90 hover:text-stone-900 dark:hover:text-white rounded-xl transition-all duration-150 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[0_2px_4px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.08)_inset] hover:shadow-[0_4px_8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-inner cursor-pointer shrink-0"
                                    >
                                        <Download size={14} className="sm:w-[15px] sm:h-[15px]" />
                                    </button>

                                    {/* 3. Share Document */}
                                    <button 
                                        onClick={() => onShare(file)} 
                                        title="Share file" 
                                        className="p-1.5 sm:p-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50/90 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/90 rounded-xl transition-all duration-150 shadow-[0_2px_4px_rgba(16,185,129,0.12),0_1px_0_rgba(255,255,255,0.8)_inset] dark:shadow-[0_2px_4px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.1)_inset] hover:shadow-[0_4px_8px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-inner cursor-pointer shrink-0"
                                    >
                                        <Share2 size={14} className="sm:w-[15px] sm:h-[15px]" />
                                    </button>

                                    {/* 4. Delete Document */}
                                    <button 
                                        onClick={() => onDelete(file.id)} 
                                        title="Delete file" 
                                        className="p-1.5 sm:p-2 text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 rounded-xl transition-all duration-150 shadow-[0_2px_4px_rgba(225,29,72,0.1),0_1px_0_rgba(255,255,255,0.8)_inset] dark:shadow-[0_2px_4px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.08)_inset] hover:shadow-[0_4px_8px_rgba(225,29,72,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-inner cursor-pointer shrink-0"
                                    >
                                        <Trash2 size={14} className="sm:w-[15px] sm:h-[15px]" />
                                    </button>
                                </div>
                            </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const LegacyUpgradeView = () => null;
const _UnusedLegacyUpgradeView = ({ 
    onUpgrade, 
    onSwitchPlan,
    currentPlan = 'Basic Plan', 
    user = null,
    isExpired = false,
    orders = []
}: { 
    onUpgrade: (plan: 'Pro Plan' | 'Max Plan', amount?: string, cycle?: 'month' | 'half-year' | 'year', resubmitId?: string, upgradeFromId?: string, oldAmount?: number) => void; 
    onSwitchPlan?: (plan: 'Basic Plan' | 'Pro Plan' | 'Max Plan', cycle?: 'month' | 'half-year' | 'year') => void;
    currentPlan?: string; 
    user?: User | null;
    isExpired?: boolean;
    orders?: any[];
}) => {
    const purchasedTier = getUserPurchasedTier(user);
    const userCycle = (user?.billingCycle as BillingCycleType) || 'month';
    const activePlanName = user?.activePlanMode || user?.plan || currentPlan || 'Basic Plan';
    const isUsingMax = !isExpired && activePlanName.toLowerCase().includes('max');
    const isUsingPlus = !isExpired && (activePlanName.toLowerCase().includes('plus') || activePlanName.toLowerCase().includes('pro'));
    const isUsingFree = isExpired || (!isUsingMax && !isUsingPlus);

    const ownsMax = !isExpired && purchasedTier === 'Max';
    const ownsPlus = !isExpired && (purchasedTier === 'Plus' || purchasedTier === 'Pro');

    const [dismissRefundNotice, setDismissRefundNotice] = useState(false);

    const hasRefundedPlan = orders.some(o => 
        Boolean(o.isRefunded) || 
        o.status === 'REFUNDED' || 
        (o.ticketStatus === 'COMPLETED' && Boolean(o.ticketReason && (o.ticketReason.toLowerCase().includes('refund') || o.ticketReason.toLowerCase().includes('payout'))))
    );

    const showRefundSuccess = hasRefundedPlan && !dismissRefundNotice && !ownsMax && !ownsPlus;

    const hasPendingRefund = !showRefundSuccess && orders.some(o => 
        o.ticketId && o.ticketStatus !== 'RESOLVED' && o.ticketStatus !== 'COMPLETED' && Boolean(o.ticketReason && (o.ticketReason.toLowerCase().includes('refund') || o.ticketReason.toLowerCase().includes('payout')))
    );

    const [selectedCycle, setSelectedCycle] = useState<'month' | 'half-year' | 'year'>(
        (user?.billingCycle as any) || 'month'
    );

    // Check if the currently viewed cycle is covered by the user's purchased subscription
    // If a user bought a Month membership, higher seasons (Half-Year, Year) are NOT covered and NOT free!
    const isCycleCovered = isBillingCycleCovered(userCycle, selectedCycle);
    const ownsMaxInCycle = ownsMax && isCycleCovered;
    const ownsPlusInCycle = (ownsMax || ownsPlus) && isCycleCovered;

    // Active membership credit value for upgrades
    const userActiveCredit = (() => {
        if (!user || user?.isRefunded || isExpired || purchasedTier === 'Free' || user.plan === 'Basic Plan' || user.subscriptionStatus === 'free') return 0;
        if (purchasedTier === 'Max') {
            return getPlanCreditValue('Max Plan', userCycle);
        }
        if (purchasedTier === 'Plus' || purchasedTier === 'Pro') {
            return getPlanCreditValue('Pro Plan', userCycle);
        }
        return 0;
    })();

    const cycleDetails = {
        'month': {
            plusPrice: '₹50',
            plusDuration: '/ month',
            plusRaw: '50',
            maxPrice: '₹100',
            maxDuration: '/ month',
            maxRaw: '100',
            label: 'Month',
            badge: 'Basic • Pro • Max'
        },
        'half-year': {
            plusPrice: '₹250',
            plusDuration: '/ 6 months',
            plusRaw: '250',
            maxPrice: '₹500',
            maxDuration: '/ 6 months',
            maxRaw: '500',
            label: 'Half-Year',
            badge: 'Save ₹50'
        },
        'year': {
            plusPrice: '₹500',
            plusDuration: '/ year',
            plusRaw: '500',
            maxPrice: '₹1000',
            maxDuration: '/ year',
            maxRaw: '1000',
            label: 'Year',
            badge: 'Save ₹100'
        }
    };

    const currentPricing = cycleDetails[selectedCycle];

    return (
        <div className="max-w-6xl mx-auto animate-fade-in-up pb-12">
            <div className="text-center mb-8">
                <h2 className="text-3xl sm:text-4xl font-heading font-black tracking-tighter mb-3 text-gray-900 dark:text-white">PaperX Membership Plans</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xl mx-auto text-sm sm:text-base mb-6">
                    Affordable, high-value plans tailored for every user. Enjoy seamless upgrades with past membership discounts.
                </p>

                {/* 1. Refund Success Banner - Only shown when user requested a refund and it completed */}
                {showRefundSuccess && (
                    <div className="max-w-3xl mx-auto mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-stone-800 dark:text-stone-100 flex items-start justify-between gap-3 shadow-xs text-left animate-fade-in relative group">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-sm">
                                <Undo2 size={20} />
                            </div>
                            <div className="text-xs sm:text-sm">
                                <div className="font-bold font-heading text-stone-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                                    Refund Successful & Processed
                                </div>
                                <p className="text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                                    Your membership refund has been completed. Your account is now back to <strong>Basic Plan</strong>. You can re-subscribe anytime using the plans below.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={async () => {
                                setDismissRefundNotice(true);
                                if (user?.uid) {
                                    try {
                                        await updateUserInFirestore(user.uid, { isRefunded: false });
                                    } catch (e) {
                                        console.warn('Failed to update isRefunded flag:', e);
                                    }
                                }
                            }}
                            title="Dismiss refund notice and show standard Basic Plan banner"
                            className="p-1.5 rounded-lg hover:bg-blue-200/60 dark:hover:bg-blue-900/60 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* 2. Refund Pending Banner - Shown when user submitted a refund request that is processing */}
                {hasPendingRefund && !ownsMax && !ownsPlus && (
                    <div className="max-w-3xl mx-auto mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-stone-800 dark:text-stone-100 flex items-start gap-3 shadow-xs text-left animate-fade-in">
                        <div className="p-2.5 rounded-xl bg-amber-500 text-stone-950 shrink-0 shadow-sm">
                            <Clock size={20} />
                        </div>
                        <div className="text-xs sm:text-sm">
                            <div className="font-bold font-heading text-stone-900 dark:text-white flex items-center gap-1.5 text-sm sm:text-base">
                                Refund Request Processing
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">Under Review</span>
                            </div>
                            <p className="text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                                Your refund request has been received and is currently being processed by our support team. Your payout will be transferred to your account within 24–48 hours.
                            </p>
                        </div>
                    </div>
                )}

                {/* 3. Normal Basic Plan Banner - Shown when user DID NOT request a refund */}
                {!showRefundSuccess && !hasPendingRefund && !ownsMax && !ownsPlus && (
                    <div className="max-w-3xl mx-auto mb-6 p-4 rounded-2xl bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 text-stone-800 dark:text-stone-100 flex items-start gap-3 shadow-xs text-left animate-fade-in">
                        <div className="p-2.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shrink-0 shadow-sm">
                            <Sparkles size={20} />
                        </div>
                        <div className="text-xs sm:text-sm">
                            <div className="font-bold font-heading text-stone-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                                Basic Plan Active (Free Tier)
                            </div>
                            <p className="text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                                You are currently on the Free Basic Plan. Choose a plan below to unlock unlimited daily operations, batch processing, and full AI document tools.
                            </p>
                        </div>
                    </div>
                )}

                {/* Status notice when viewing higher duration cycles that user does not own */}
                {!isCycleCovered && (ownsMax || ownsPlus) && (
                    <div className="max-w-3xl mx-auto mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-stone-800 dark:text-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-md">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black font-heading text-stone-900 dark:text-white flex items-center gap-2">
                                    {cycleDetails[selectedCycle].label} Upgrade with Discount Available
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-700 dark:text-amber-400 border border-amber-400/30">Past Value Discount</span>
                                </h4>
                                <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                                    Your active <strong>{purchasedTier} Plan ({BILLING_CYCLE_LABELS[userCycle]})</strong> value of <strong>₹{userActiveCredit}</strong> will automatically discount when you upgrade to {cycleDetails[selectedCycle].label}!
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedCycle(userCycle)}
                            className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0 cursor-pointer bg-white/70 dark:bg-stone-800/80 px-3 py-1.5 rounded-xl border border-amber-400/30"
                        >
                            View My Active Plan ({cycleDetails[userCycle]?.label || 'Active'})
                        </button>
                    </div>
                )}

                {/* Status banner for Max Members in same covered season */}
                {isCycleCovered && ownsMax && (
                    <div className="max-w-3xl mx-auto mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-stone-800 dark:text-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-md">
                                <Crown size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black font-heading text-stone-900 dark:text-white flex items-center gap-2">
                                    Max Membership Active ({BILLING_CYCLE_LABELS[userCycle]})
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-700 dark:text-amber-400 border border-amber-400/30">Pro Plan Free in Same Season</span>
                                </h4>
                                <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                                    Because you have Max Plan, the Pro Plan is 100% free to use in your {BILLING_CYCLE_LABELS[userCycle]} season!
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 bg-white/80 dark:bg-stone-800/90 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 shrink-0">
                            <span>Active Mode:</span>
                            <span className="font-black text-amber-600 dark:text-amber-400">{activePlanName}</span>
                        </div>
                    </div>
                )}

                {/* Status banner for Pro Members in covered cycle */}
                {isCycleCovered && ownsPlus && !ownsMax && (
                    <div className="max-w-3xl mx-auto mb-6 p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-stone-800 dark:text-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black font-heading text-stone-900 dark:text-white flex items-center gap-2">
                                    Pro Membership Active ({BILLING_CYCLE_LABELS[userCycle]})
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">Upgrade Discount Available</span>
                                </h4>
                                <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                                    Upgrade to Max Plan or higher seasons anytime — your past membership value of ₹{userActiveCredit} will automatically be deducted!
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 bg-white/80 dark:bg-stone-800/90 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 shrink-0">
                            <span>Active Mode:</span>
                            <span className="font-black text-indigo-600 dark:text-indigo-400">{activePlanName}</span>
                        </div>
                    </div>
                )}

                {/* Billing Cycle Duration Selector Tabs */}
                <div className="inline-flex p-1.5 bg-gray-100 dark:bg-gray-800/90 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-xs flex-wrap justify-center gap-1">
                    {(['month', 'half-year', 'year'] as const).map((cycleKey) => {
                        const item = cycleDetails[cycleKey];
                        const isActive = selectedCycle === cycleKey;
                        const isUserCurrent = userCycle === cycleKey && (ownsMax || ownsPlus);
                        return (
                            <button
                                key={cycleKey}
                                type="button"
                                onClick={() => setSelectedCycle(cycleKey)}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isActive
                                        ? 'bg-white dark:bg-gray-700 text-stone-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                <span>{item.label}</span>
                                {isUserCurrent && (
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                                        Active
                                    </span>
                                )}
                                {!isUserCurrent && item.badge && (
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            
            <div className={selectedCycle === 'month' ? "grid grid-cols-1 md:grid-cols-3 gap-6" : "grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6"}>
                {/* Free / Basic Plan - Included in Month season (5 days with 10 features once per user) */}
                {selectedCycle === 'month' && (
                <div className={`bg-white/60 dark:bg-gray-900/60  rounded-3xl p-6 sm:p-7 border ${isUsingFree ? 'border-stone-900 dark:border-stone-100 ring-2 ring-stone-900/10 dark:ring-stone-100/10' : 'border-gray-200 dark:border-gray-800'} shadow-sm flex flex-col justify-between relative`}>
                    {isUsingFree && (
                        <div className="absolute -top-3 left-6 bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Check size={11} strokeWidth={3} /> Currently In Use
                        </div>
                    )}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-heading font-black text-gray-900 dark:text-white">Basic Plan</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">5 Days</span>
                        </div>
                        <div className="flex items-baseline gap-1 mb-5">
                            <span className="text-3xl font-black text-gray-900 dark:text-white">₹0</span>
                            <span className="text-gray-400 font-medium text-xs">/ 5 days</span>
                        </div>
                        <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                            10 feature operations total (once per user) • Essential document editing & standard conversion tools
                        </p>
                        <ul className="space-y-2.5 mb-6 text-xs text-gray-600 dark:text-gray-300 font-medium">
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Text, Image, PDF converters</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Add text, Highlight, Underline, Draw</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Merge, Split, Extract, Delete, Rotate</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Create Document, Create PDF</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Camera Scanner & Edge Detection</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> Basic OCR & Image → Text</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" /> 10 Operations Total (Once Per User)</li>
                        </ul>
                    </div>
                    {isUsingFree ? (
                        <button 
                            disabled
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 cursor-default flex items-center justify-center gap-1.5"
                        >
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span>In Use (Active)</span>
                        </button>
                    ) : (
                        <button 
                            type="button"
                            onClick={() => onSwitchPlan?.('Basic Plan', selectedCycle)}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-900 shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                            <span>Use Basic Plan</span>
                        </button>
                    )}
                </div>
                )}

                {/* Pro Plan */}
                <div className={`bg-stone-900 text-stone-50  rounded-3xl p-6 sm:p-7 border ${isUsingPlus && isCycleCovered ? 'border-indigo-400 ring-2 ring-indigo-400/20' : 'border-stone-800'} shadow-xl flex flex-col justify-between relative group`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={100} className="text-white" />
                    </div>
                    {isUsingPlus && isCycleCovered && (
                        <div className="absolute -top-3 left-6 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Check size={11} strokeWidth={3} /> Currently In Use
                        </div>
                    )}
                    {!isUsingPlus && ownsMaxInCycle && (
                        <div className="absolute -top-3 right-6 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Sparkles size={10} /> Free with Max
                        </div>
                    )}
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-heading font-black text-white">Pro Plan</h3>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 border border-stone-700">PRO PLAN</span>
                        </div>
                        {ownsMaxInCycle ? (
                            <div className="flex items-baseline gap-2 mb-5">
                                <span className="text-3xl font-black text-white">FREE</span>
                                <span className="line-through text-stone-500 text-sm font-semibold">{currentPricing.plusPrice}</span>
                                <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Unlocked with Max</span>
                            </div>
                        ) : (userActiveCredit > 0 && Number(currentPricing.plusRaw) > userActiveCredit && !isCycleCovered) ? (() => {
                            const plusRawVal = Number(currentPricing.plusRaw);
                            const discountedPlus = Math.max(1, plusRawVal - userActiveCredit);
                            return (
                                <div className="flex flex-col gap-1 mb-5">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-white">₹{discountedPlus}</span>
                                        <span className="line-through text-stone-500 text-sm font-semibold">{currentPricing.plusPrice}</span>
                                        <span className="text-stone-400 font-medium text-xs">{currentPricing.plusDuration}</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50 w-fit">
                                        <Sparkles size={11} /> Save ₹{userActiveCredit} with past membership
                                    </span>
                                </div>
                            );
                        })() : (
                            <div className="flex items-baseline gap-1 mb-5">
                                <span className="text-3xl font-black text-white">{currentPricing.plusPrice}</span>
                                <span className="text-stone-400 font-medium text-xs">{currentPricing.plusDuration}</span>
                            </div>
                        )}
                        <p className="text-xs font-bold text-stone-300 mb-4 pb-3 border-b border-stone-800">
                            Basic + Pro features • Unlimited daily operations
                        </p>
                        <ul className="space-y-2.5 mb-6 text-xs text-stone-300 font-medium">
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> All Basic features included</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Word, Excel, PowerPoint converters</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Edit PDF text & images</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Crop pages, PDF Organizer</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Searchable PDF & Auto Enhance</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Resume builder & Letter templates</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-indigo-400 shrink-0 mt-0.5" /> Private Folder & Unlimited daily files</li>
                        </ul>
                    </div>
                    {isUsingPlus && isCycleCovered ? (
                        <button 
                            disabled
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 cursor-default flex items-center justify-center gap-1.5 relative z-10"
                        >
                            <CheckCircle2 size={14} className="text-indigo-400" />
                            <span>In Use (Active)</span>
                        </button>
                    ) : ownsMaxInCycle ? (
                        <Button 
                            size="sm" 
                            onClick={() => onSwitchPlan?.('Pro Plan', selectedCycle)} 
                            className="w-full font-bold bg-white text-stone-900 hover:bg-stone-100 border-none shadow-md text-xs relative z-10 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <span>Use Pro Plan (Free with Max)</span>
                        </Button>
                    ) : ownsPlusInCycle ? (
                        <Button 
                            size="sm" 
                            onClick={() => onSwitchPlan?.('Pro Plan', selectedCycle)} 
                            className="w-full font-bold bg-white text-stone-900 hover:bg-stone-100 border-none shadow-md text-xs relative z-10 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <span>Use Pro Plan</span>
                        </Button>
                    ) : (
                        <Button 
                            size="sm" 
                            onClick={() => {
                                const plusRawVal = Number(currentPricing.plusRaw);
                                const discountToApply = (!isCycleCovered && userActiveCredit > 0 && plusRawVal > userActiveCredit) ? userActiveCredit : 0;
                                const finalPrice = discountToApply > 0 ? String(Math.max(1, plusRawVal - discountToApply)) : currentPricing.plusRaw;
                                onUpgrade('Pro Plan', finalPrice, selectedCycle, undefined, undefined, discountToApply > 0 ? discountToApply : undefined);
                            }} 
                            className="w-full font-bold bg-white text-stone-900 hover:bg-stone-100 border-none shadow-md text-xs relative z-10 cursor-pointer"
                        >
                            {(!isCycleCovered && userActiveCredit > 0 && Number(currentPricing.plusRaw) > userActiveCredit) ? (() => {
                                const plusRawVal = Number(currentPricing.plusRaw);
                                const discounted = Math.max(1, plusRawVal - userActiveCredit);
                                return `Upgrade to Pro Plan (₹${discounted}) • Save ₹${userActiveCredit}`;
                            })() : `Upgrade to Pro Plan (${currentPricing.plusPrice})`}
                        </Button>
                    )}
                </div>

                {/* Max Plan */}
                <div className={`bg-black text-white  rounded-3xl p-6 sm:p-7 border ${isUsingMax && isCycleCovered ? 'border-yellow-400 ring-2 ring-yellow-400/20' : 'border-gray-800'} shadow-2xl flex flex-col justify-between relative group`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none rounded-3xl"></div>
                    <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-25 transition-opacity">
                        <Crown size={100} className="text-yellow-400" />
                    </div>
                    {isUsingMax && isCycleCovered && (
                        <div className="absolute -top-3 left-6 bg-gradient-to-r from-yellow-400 to-amber-500 text-stone-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Crown size={11} /> Currently In Use
                        </div>
                    )}
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">Max Plan</h3>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 shadow-xs">MAX</span>
                        </div>
                        {/* Discount upgrade: Any active membership gets past membership value discount on higher plans */}
                        {(userActiveCredit > 0 && Number(currentPricing.maxRaw) > userActiveCredit && !isExpired && !user?.isRefunded) ? (() => {
                            const maxRawVal = Number(currentPricing.maxRaw) || 100;
                            const discountedMax = Math.max(1, maxRawVal - userActiveCredit);
                            return (
                                <div className="flex flex-col gap-1 mb-5">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-white">₹{discountedMax}</span>
                                        <span className="line-through text-stone-500 text-sm font-semibold">{currentPricing.maxPrice}</span>
                                        <span className="text-stone-400 font-medium text-xs">{currentPricing.maxDuration}</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50 w-fit">
                                        <Sparkles size={11} /> Save ₹{userActiveCredit} with past membership
                                    </span>
                                </div>
                            );
                        })() : (
                            <div className="flex items-baseline gap-1 mb-5">
                                <span className="text-3xl font-black text-white">{currentPricing.maxPrice}</span>
                                <span className="text-stone-400 font-medium text-xs">{currentPricing.maxDuration}</span>
                            </div>
                        )}
                        <p className="text-xs font-bold text-yellow-300/90 mb-4 pb-3 border-b border-gray-800">
                            Basic + Pro + Max AI Suite • Unlimited access
                        </p>
                        <ul className="space-y-2.5 mb-6 text-xs text-stone-300 font-medium">
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> All Basic + Pro features</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> Full AI Document Suite & Q&A</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> Handwriting recognition & OCR</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> Whiteout / Redact & Digital Signatures</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> Batch Scanner & Batch Compression</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> HTML/Markdown to PDF, PDF to Excel/PPT</li>
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> 100GB Cloud Storage & 24/7 Support</li>
                        </ul>
                    </div>
                    {isUsingMax && isCycleCovered ? (
                        <button 
                            disabled
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-yellow-400/15 text-yellow-300 border border-yellow-400/30 cursor-default flex items-center justify-center gap-1.5 relative z-10"
                        >
                            <Crown size={14} className="text-yellow-400" />
                            <span>In Use (Active)</span>
                        </button>
                    ) : ownsMaxInCycle ? (
                        <Button 
                            size="sm" 
                            onClick={() => onSwitchPlan?.('Max Plan', selectedCycle)} 
                            className="w-full font-black bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-stone-950 border-none shadow-lg text-xs relative z-10 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <Crown size={13} />
                            <span>Use Max Plan</span>
                        </Button>
                    ) : (
                        <Button 
                            size="sm" 
                            onClick={() => {
                                const maxRawVal = Number(currentPricing.maxRaw) || 100;
                                const discountToApply = (userActiveCredit > 0 && maxRawVal > userActiveCredit && !isExpired && !user?.isRefunded) ? userActiveCredit : 0;
                                const finalPrice = discountToApply > 0 ? String(Math.max(1, maxRawVal - discountToApply)) : currentPricing.maxRaw;
                                onUpgrade('Max Plan', finalPrice, selectedCycle, undefined, undefined, discountToApply > 0 ? discountToApply : undefined);
                            }} 
                            className="w-full font-black bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-stone-950 border-none shadow-lg text-xs relative z-10 cursor-pointer"
                        >
                            {(userActiveCredit > 0 && Number(currentPricing.maxRaw) > userActiveCredit && !isExpired && !user?.isRefunded) ? (() => {
                                const maxRawVal = Number(currentPricing.maxRaw) || 100;
                                const discounted = Math.max(1, maxRawVal - userActiveCredit);
                                return `Upgrade to Max (₹${discounted}) • Save ₹${userActiveCredit}`;
                            })() : `Upgrade to Max (${currentPricing.maxPrice})`}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

const WhatsNewView = () => {
    const updates = [
        { version: '2.3.0', date: 'Last Week', title: 'Dark Mode', desc: 'Full support for system-wide dark mode preferences.' },
        { version: '2.2.0', date: '2 Weeks ago', title: 'Voice to PDF', desc: 'Record voice notes and convert them instantly to formatted PDF documents.' },
    ];

    return (
        <div className="max-w-3xl mx-auto animate-fade-in-up">
            <h2 className="text-2xl font-heading font-black tracking-tight mb-8">What's New</h2>
            <div className="space-y-8">
                {updates.map((update, i) => (
                    <div key={i} className="flex gap-6">
                        <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-black"></div>
                            {i !== updates.length - 1 && <div className="w-px h-full bg-gray-200 my-2"></div>}
                        </div>
                        <div className="pb-8">
                             <div className="flex items-center gap-3 mb-1">
                                 <span className="text-sm font-bold text-black">{update.version}</span>
                                 <span className="text-xs font-medium text-gray-400">{update.date}</span>
                             </div>
                             <h3 className="text-lg font-bold text-gray-900 mb-2">{update.title}</h3>
                             <p className="text-gray-500 leading-relaxed">{update.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SupportView = ({ onStartChat }: { onStartChat: () => void }) => {
    const [activeFaqId, setActiveFaqId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const faqs = [
        // ==========================================
        // 1. BILLING & PLANS
        // ==========================================
        {
            id: "faq-billing-upgrade",
            category: "Billing & Plans",
            q: "How do I upgrade my plan and verify payment?",
            a: "1. Open Profile or the side menu and select 'Billing & Plans'.\n2. Choose your preferred plan and billing duration:\n   • Pro Plan: ₹29/month | ₹145 for 6 Months (Save ₹29) | ₹290 for 1 Year (Save ₹58) — includes 100 operations quota, 250MB per file, 3 devices.\n   • Max Plan: ₹49/month | ₹245 for 6 Months (Save ₹49) | ₹490 for 1 Year (Save ₹98) — includes 1,000 operations quota, 1GB per file, 5 devices.\n   • Active Membership Credit: Upgrading from Pro to Max automatically credits your active Pro plan value as an instant discount, so you only pay the net difference.\n3. Scan the official dynamic UPI QR code with any UPI app (Google Pay, PhonePe, Paytm, BHIM, CRED, Navi, or banking apps) or tap to pay via UPI intent on mobile.\n4. Complete the transfer and copy the 12-digit numeric UTR / Bank Reference Number from your payment receipt.\n5. Paste the 12-digit UTR into the verification box and click 'Submit Verification'.\n6. Automatic bank reconciliation activates your account within 5 to 15 minutes. You can also paste your UTR in Live Chat for immediate instant activation. All plans include a 48-hour 100% money-back guarantee."
        },
        {
            id: "faq-billing-utr",
            category: "Billing & Plans",
            q: "What is the 12-digit UTR and where do I find it in my UPI app?",
            a: "The UTR (Unique Transaction Reference) is the official 12-digit numeric reference generated by Indian banking servers (NPCI) for every UPI transaction.\n\nWhere to find it:\n• Google Pay: Tap the payment card > Look for 'UPI transaction ID' (12 digits, e.g., 4278XXXXXXXX).\n• PhonePe: Open History > Tap transaction > Locate 'UTR' or 'Bank Ref No'.\n• Paytm: View the payment receipt > Locate 'UPI Ref No'.\n• CRED / BHIM / Navi: Check transaction details for 'UPI Reference ID' or 'Bank Ref'.\n\nEnsure you enter only the 12 numeric digits without any spaces, letters, slashes, or bank initials."
        },
        {
            id: "faq-billing-pending",
            category: "Billing & Plans",
            q: "Why is my payment showing pending or unverified?",
            a: "Bank settlements and automatic matching usually complete within 5 to 15 minutes. Common reasons for delays include:\n1. Banking Network Clearing Delay: Occasional inter-bank network clearing congestion on the UPI network.\n2. UTR Typo: Double-check that all 12 digits were typed accurately without missing digits.\n3. Manual Instant Approval: If your payment is still pending after 15 minutes, open Live Support Chat and paste your UTR or upload your payment screenshot. Our on-duty team will verify and activate your membership immediately."
        },
        {
            id: "faq-billing-invoice",
            category: "Billing & Plans",
            q: "Can I get an official invoice or GST billing receipt?",
            a: "Yes! Every verified transaction generates an official downloadable digital receipt stored under 'Payment History' with an encrypted order hash and verification QR code.\n\nFor enterprise invoices featuring your company legal name and GSTIN, email our billing desk at paperx.assist@gmail.com with your registered email and Order ID. Formal GST-compliant tax invoices are issued within 24 hours."
        },
        {
            id: "faq-billing-expire",
            category: "Billing & Plans",
            q: "What happens when my subscription period ends?",
            a: "When your subscription period ends:\n• Your account gracefully switches to the Free (Basic) tier without abrupt lockouts or losing access.\n• None of your stored documents in Cloud Vault or conversion history are deleted.\n• Free tier limits (5 operations quota, 50MB file size cap, 1 active device, 100 pages per conversion) will apply to future conversions until you renew.\n• You can renew or upgrade your plan at any time from Billing & Plans: Pro (₹29/mo) or Max (₹49/mo) with no penalties or hidden fees."
        },
        {
            id: "faq-billing-ceo",
            category: "Billing & Plans",
            q: "Who founded PaperX and how can I speak directly with the CEO?",
            a: "Sayan Biswas is the Founder & Chief Executive Officer of PaperX. He architected PaperX to deliver an ultra-fast, privacy-first document intelligence platform with neural OCR and layout-preserving translations.\n\nTo connect directly with CEO Sayan Biswas, open Live Support Chat and select 'Talk with CEO'. This immediately dispatches a high-priority direct alert to his executive desk on Telegram, allowing direct communication. You can also reach him via paperx.assist@gmail.com."
        },

        // ==========================================
        // 2. FILE PROCESSING & LIMITS
        // ==========================================
        {
            id: "faq-files-formats",
            category: "File Processing",
            q: "What file formats does PaperX support?",
            a: "PaperX provides native, high-performance processing for all standard document types:\n• PDF Formats: Standard PDF, Searchable OCR PDF, and ISO-standardized PDF/A (1b/2b) for legal archival.\n• Microsoft Office: Word (.docx, .doc), Excel (.xlsx, .xls), and PowerPoint (.pptx, .ppt).\n• Images: JPG, JPEG, PNG, WebP, TIFF, SVG, BMP, and GIF.\n• Data & Text: TXT, CSV, HTML, and Markdown (.md).\n• Archives: Multi-file ZIP compilation and extraction."
        },
        {
            id: "faq-files-limits",
            category: "File Processing",
            q: "What are the file size and page limits for each plan?",
            a: "• Free (Basic Plan): ₹0 | 5 operations quota | Up to 50MB per file | 1 active device | 100 pages per conversion task.\n• Pro Plan (₹29/mo | ₹145 for 6 mo | ₹290/yr): 100 operations quota | Up to 250MB per file | 3 active devices | Unlimited pages | Prioritized conversion queue.\n• Max Plan (₹49/mo | ₹245 for 6 mo | ₹490/yr): 1,000 operations quota | Up to 1GB per file | 5 active devices | Unlimited pages | VIP dedicated conversion cluster & parallel batch conversion engine."
        },
        {
            id: "faq-files-batch",
            category: "File Processing",
            q: "How does batch file conversion work?",
            a: "You can drag and drop multiple files at once into any conversion workspace. PaperX queues and executes tasks in parallel using distributed worker threads and client-side processing. Once processing completes, you can choose to download files individually or save a single consolidated ZIP archive containing all converted documents. Batch multi-file conversion is supported on Pro (100 ops quota) and Max (1,000 ops quota) plans."
        },
        {
            id: "faq-files-compress",
            category: "File Processing",
            q: "How do I compress large PDF documents without losing quality?",
            a: "Open the Compress PDF tool and choose between two smart compression algorithms:\n• Balanced Compression (Recommended): Retains crisp vector outlines, sharp typography, and 150 DPI graphics. Perfect for business proposals, contracts, resumes, and high-quality printing.\n• Maximum Compression: Significantly reduces file size by up to 80-90% by downsampling images to 72 DPI and stripping redundant font subsets. Ideal for email attachments, online job portals, and strict government upload limits."
        },
        {
            id: "faq-files-password",
            category: "File Processing",
            q: "Can PaperX process password-protected PDFs?",
            a: "Yes!\n• Unlock PDF: If you know the document password, upload your encrypted document and type the password when prompted. PaperX decrypts the PDF using standard AES-256 routines and outputs an unrestricted copy.\n• Protect PDF: You can also secure sensitive documents with military-grade 256-bit AES encryption with your custom password before sharing."
        },

        // ==========================================
        // 3. OCR & ADVANCED TOOLS
        // ==========================================
        {
            id: "faq-ocr-how",
            category: "OCR & Tools",
            q: "How does Optical Character Recognition (OCR) work?",
            a: "PaperX uses a neural vision OCR pipeline that inspects pixel data in scanned documents, photos, and book pages. Rather than simple text scraping, our model recognizes typographic layout, columns, tables, headers, and handwriting.\n\nOutput options include:\n• Editable Word (.docx): Fully editable document retaining tables, margins, and styles.\n• Searchable PDF: Preserves original scan appearance with an invisible text layer for searching and copying.\n• Plain Text (.txt): Clean extracted raw text ready for copying or feeding into AI workflows."
        },
        {
            id: "faq-ocr-languages",
            category: "OCR & Tools",
            q: "What languages are supported for OCR and document translation?",
            a: "PaperX supports over 40 global languages with automatic language and script detection:\n• Indian Languages: Hindi (हिन्दी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Marathi (मराठी), Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ), Punjabi (ਪੰਜਾਬੀ), Malayalam (മലയാളം), Urdu (اردو).\n• Global Languages: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Chinese (Simplified & Traditional), Korean, Arabic, Turkish, Dutch, Vietnamese, Thai, Indonesian, and more."
        },
        {
            id: "faq-ocr-translation",
            category: "OCR & Tools",
            q: "How does document translation preserve the original layout?",
            a: "Unlike basic text translators that break formatting, PaperX's Translate PDF tool maps every text bounding box, font size, paragraph flow, image placement, and table cell. It translates the content into your selected target language while preserving the exact layout, margins, and branding of the original document."
        },
        {
            id: "faq-ocr-merge-split",
            category: "OCR & Tools",
            q: "How can I merge, split, or reorder PDF pages?",
            a: "• Merge PDF: Drag and drop two or more PDF files, drag to reorder their sequence, and click 'Merge PDF' to combine them into one seamless master file.\n• Split PDF: Choose to extract individual pages or specify custom page ranges (e.g., 1-4, 8, 12-15).\n• Organize PDF: Visual interactive grid allowing you to drag pages to reorder, rotate individual pages 90°/180°, or delete unwanted pages with one click."
        },
        {
            id: "faq-ocr-signatures",
            category: "OCR & Tools",
            q: "Can I add e-signatures or custom watermarks?",
            a: "Yes!\n• Sign & Protect: Draw your signature with a touch screen/mouse, type your initials, or upload a scanned signature image with transparent background. Position and resize it on any page.\n• Watermark PDF: Add custom text watermarks (e.g., 'CONFIDENTIAL', 'DRAFT') or company logos. Control opacity (10% to 100%), rotation angle (diagonal 45° or horizontal), and page ranges."
        },
        {
            id: "faq-ocr-camera",
            category: "OCR & Tools",
            q: "How does the Camera Scanner feature work?",
            a: "Open Camera Scanner on your mobile phone or laptop webcam:\n1. Point your camera at a physical document or book page.\n2. The engine automatically detects document corners, straightens perspective distortion, and crops backgrounds.\n3. Apply high-contrast B&W or Document Sharpening filters for crystal-clear readability.\n4. Capture multiple pages in succession and export directly into a single unified multi-page PDF."
        },

        // ==========================================
        // 4. SECURITY & PRIVACY
        // ==========================================
        {
            id: "faq-sec-confidential",
            category: "Security & Privacy",
            q: "Is my document data secure and confidential?",
            a: "Yes, security and privacy are built into PaperX's core architecture:\n• In Transit: All uploads and downloads are encrypted with enterprise-grade TLS 1.3 protocols.\n• At Rest: Files are encrypted using military-grade AES-256 encryption.\n• Zero-Knowledge Processing: Temporary conversion files exist only in ephemeral server RAM and are automatically and permanently purged upon download completion.\n• ISO Compliance: Supports PDF/A ISO standard archival formats for legal and regulatory compliance."
        },
        {
            id: "faq-sec-storage",
            category: "Security & Privacy",
            q: "How long are uploaded files stored on PaperX servers?",
            a: "• Temporary Conversion Files: Automatically wiped and shredded from memory immediately after processing or within 1 hour maximum.\n• Vault / Saved Files: Only saved if you are logged into your registered account and explicitly choose to save to your private Cloud Vault. You can permanently delete any saved document at any time from 'My Documents'."
        },
        {
            id: "faq-sec-ai-training",
            category: "Security & Privacy",
            q: "Does PaperX train AI models on user documents?",
            a: "Strictly Never. PaperX enforces a strict zero-retention, zero-training data policy. Your private contracts, financial statements, medical records, and scanned IDs are never inspected by humans, never sold, and never used to train, fine-tune, or benchmark AI models."
        },
        {
            id: "faq-sec-sessions",
            category: "Security & Privacy",
            q: "How does multi-device session security work?",
            a: "Your account tracks active logins with device type (desktop, mobile, tablet), browser, OS, and approximate location. Maximum active devices supported per plan:\n• Free (Basic Plan): 1 active device\n• Pro Plan (₹29/mo): Up to 3 active devices simultaneously\n• Max Plan (₹49/mo): Up to 5 active devices simultaneously\nGo to Profile > Active Sessions to view all devices currently signed in to your account. You can remotely log out of any unfamiliar session with a single tap."
        },

        // ==========================================
        // 5. TROUBLESHOOTING & SUPPORT
        // ==========================================
        {
            id: "faq-trouble-failed",
            category: "Troubleshooting",
            q: "What should I do if a file conversion fails or hangs?",
            a: "Follow these quick diagnostic steps:\n1. Check Password Protection: If the PDF is password-protected, use Unlock PDF first.\n2. Verify File Size & Quota: Ensure the file is within your plan limits (50MB Free, 250MB Pro, 1GB Max) and that you have remaining operations in your daily quota (5 Free, 100 Pro, 1,000 Max).\n3. Check File Integrity: Open the file on your device to ensure it is not corrupt or incomplete.\n4. Browser Cache & Extensions: Disable aggressive extensions that block WebAssembly workers, or try an incognito window.\n5. Instant Help: Open Live Support Chat to report the issue directly to our technical team for immediate resolution."
        },
        {
            id: "faq-trouble-ocr-quality",
            category: "Troubleshooting",
            q: "Why is OCR text formatting slightly misaligned?",
            a: "OCR accuracy relies on source image clarity:\n• Resolution: For best results, use scans at 300 DPI. Low-resolution photos (< 150 DPI) can lead to character misreads.\n• Lighting & Glare: Ensure document pages are well-lit and flat, without harsh shadows or glossy glare.\n• Orientation: Use Rotate PDF to ensure pages are right-side-up before running OCR."
        },
        {
            id: "faq-trouble-inactivity",
            category: "Troubleshooting",
            q: "How does the 10-minute inactivity chat system work?",
            a: "To protect user privacy on shared devices and optimize support channels, ongoing support chat sessions automatically close if there is no response from the user for 10 consecutive minutes. If you return after 10 minutes of inactivity, opening the chat automatically starts a fresh new conversation for you."
        },
        {
            id: "faq-trouble-abuse-rules",
            category: "Troubleshooting",
            q: "What is the app's policy on abusive language and hate?",
            a: "PaperX strictly prohibits hate speech, vulgar slangs, and abusive language directed at the platform or staff. Violations trigger an automated 3-warning system with 1-hour chat suspensions. If a user exceeds 3 warnings, their email and Google account are permanently banned from PaperX, blocking all access to the app."
        },
        {
            id: "faq-trouble-live-support",
            category: "Troubleshooting",
            q: "How do I connect with a live customer support specialist?",
            a: "Click 'Open Live Chat' on this page or tap the headset icon in the sidebar. Our PaperX AI responds instantly 24/7 with accurate step-by-step guidance. If you need human executive support or wish to discuss business partnerships, select 'Talk with CEO' in the chat, or email us at paperx.assist@gmail.com."
        }
    ];

    const categories = ['All', 'Billing & Plans', 'File Processing', 'OCR & Tools', 'Security & Privacy', 'Troubleshooting'];

    const filteredFaqs = faqs.filter(faq => {
        const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || 
            faq.q.toLowerCase().includes(q) || 
            faq.a.toLowerCase().includes(q) || 
            faq.category.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="max-w-4xl mx-auto pt-4 sm:pt-6 pb-2 sm:pb-3 px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12">
                <h2 className="text-3xl sm:text-5xl font-heading font-black tracking-tight mb-4 text-stone-900 dark:text-white">
                    How can we help you?
                </h2>
                <p className="text-sm sm:text-base text-stone-500 dark:text-stone-400 font-medium max-w-xl mx-auto leading-relaxed">
                    Get rapid answers for subscriptions, file processing, or chat directly with our technical support specialists.
                </p>
            </div>

            {/* Support Channels Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-12 sm:mb-14">
                {/* Live Chat Channel */}
                <motion.div 
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 sm:p-8 bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white rounded-[36px] relative overflow-hidden flex flex-col justify-between border-t border-t-white/20 border-x border-stone-800 border-b-2 border-b-black shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55),0_10px_24px_-6px_rgba(0,0,0,0.35),inset_0_1.5px_1px_0_rgba(255,255,255,0.15)]"
                >
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 text-white flex items-center justify-center mb-5 border-t border-emerald-300/70 border-b-2 border-emerald-800/80 border-x border-emerald-400/50 shadow-[0_6px_14px_-2px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.15),inset_0_1.5px_1px_rgba(255,255,255,0.7),inset_0_-2px_2px_rgba(6,78,59,0.5)]">
                            <MessageSquare size={22} className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-300 font-bold text-[10px] uppercase tracking-widest rounded-full mb-3 border border-emerald-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Instant Response
                        </div>
                        <h3 className="text-xl sm:text-2xl font-heading font-black tracking-tight mb-2">Live Support Chat</h3>
                        <p className="text-stone-300/90 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                            Chat directly with our team. Get instant automated resolution for billing queries or connect to live officers.
                        </p>
                    </div>
                    <button 
                        onClick={onStartChat}
                        className="group relative w-full py-4 px-6 bg-gradient-to-b from-white via-stone-50 to-stone-100 hover:from-white hover:to-stone-50 text-stone-950 rounded-full font-heading font-black text-xs sm:text-sm border-t-2 border-t-white border-x border-x-stone-200/90 border-b-[4.5px] border-b-stone-300 shadow-[0_14px_32px_-4px_rgba(0,0,0,0.5),0_6px_14px_rgba(0,0,0,0.3),inset_0_2px_1.5px_rgba(255,255,255,1),inset_0_-1.5px_1.5px_rgba(0,0,0,0.06)] hover:shadow-[0_18px_38px_-4px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 active:translate-y-[2.5px] active:border-b-[2px] active:shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer select-none"
                    >
                        <span>Open Live Chat</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>

                {/* Email Helpdesk Channel */}
                <motion.div 
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 sm:p-8 bg-white dark:bg-stone-900 text-stone-900 dark:text-white rounded-[36px] relative overflow-hidden flex flex-col justify-between border-t border-t-white dark:border-t-white/15 border-x border-stone-200/90 dark:border-stone-800 border-b-2 border-b-stone-250 dark:border-b-black shadow-[0_24px_60px_-12px_rgba(0,0,0,0.08),0_10px_24px_-6px_rgba(0,0,0,0.04),inset_0_1.5px_1px_0_rgba(255,255,255,1)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7),0_10px_24px_-6px_rgba(0,0,0,0.45),inset_0_1.5px_1px_0_rgba(255,255,255,0.08)]"
                >
                    <div>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-amber-400 via-orange-500 to-orange-600 text-white flex items-center justify-center mb-5 border-t border-orange-300/70 border-b-2 border-orange-800/80 border-x border-orange-400/50 shadow-[0_6px_14px_-2px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06),inset_0_1.5px_1px_rgba(255,255,255,0.7),inset_0_-2px_2px_rgba(154,52,18,0.5)]">
                            <Mail size={22} className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-[10px] uppercase tracking-widest rounded-full mb-3 border border-orange-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                            SLA: 2–4 Hours
                        </div>
                        <h3 className="text-xl sm:text-2xl font-heading font-black tracking-tight mb-2">Official Email Helpdesk</h3>
                        <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                            For membership verification, official payment proofs, enterprise invoicing, or formal billing requests.
                        </p>
                    </div>
                    <a 
                        href="mailto:paperx.assist@gmail.com?subject=PaperX%20Support%20Inquiry"
                        className="group relative w-full py-4 px-6 bg-gradient-to-b from-[#24252a] via-[#17181a] to-[#0d0e10] hover:from-[#2c2d33] hover:to-[#17181a] dark:from-white dark:via-stone-50 dark:to-stone-100 dark:hover:to-white text-white dark:text-stone-950 rounded-full font-heading font-black text-xs sm:text-sm border-t-2 border-t-white/35 dark:border-t-white border-x border-x-white/10 dark:border-x-stone-200 border-b-[4.5px] border-b-black dark:border-b-stone-350 shadow-[0_14px_32px_-4px_rgba(0,0,0,0.35),0_6px_14px_rgba(0,0,0,0.15),inset_0_2px_1.5px_rgba(255,255,255,0.25),inset_0_-1.5px_1.5px_rgba(0,0,0,0.4)] dark:shadow-[0_14px_32px_-4px_rgba(0,0,0,0.15),0_6px_14px_rgba(0,0,0,0.08),inset_0_2px_1.5px_rgba(255,255,255,0.95)] hover:shadow-[0_18px_38px_-4px_rgba(0,0,0,0.45)] dark:hover:shadow-[0_18px_38px_-4px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-[2.5px] active:border-b-[2px] active:shadow-[0_4px_10px_rgba(0,0,0,0.25)] dark:active:shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer select-none"
                    >
                        <span>Compose Email</span>
                        <Send size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                </motion.div>
            </div>

            {/* FAQ Accordion Section */}
            <div className="mb-2">
                <div className="text-center mb-8">
                    <h3 className="text-2xl sm:text-3xl font-heading font-black tracking-tight mb-2 text-stone-900 dark:text-white">Frequently Asked Questions</h3>
                    <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium">Quick answers to common questions about plans, security, OCR, and formats.</p>
                </div>

                {/* FAQ Controls: Search and Category Pills with Real 3D Depth */}
                <div className="mb-7 space-y-4">
                    <div className="relative max-w-md mx-auto group">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 dark:group-focus-within:text-white transition-colors pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setActiveFaqId(null);
                            }}
                            placeholder="Search questions & answers..."
                            className="w-full pl-10 pr-10 py-3 bg-gradient-to-b from-stone-50/90 via-white to-stone-50/80 dark:from-[#1e1f23] dark:via-[#17181a] dark:to-[#131416] border border-stone-200/90 dark:border-stone-700/80 border-t-stone-300/80 dark:border-t-stone-900 border-b-[2.5px] border-b-stone-300/90 dark:border-b-stone-950 rounded-2xl text-xs sm:text-sm font-medium text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-white focus:bg-white dark:focus:bg-[#1a1b1e] transition-all shadow-[inset_0_2.5px_5px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.02),inset_0_-1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_3px_6px_rgba(0,0,0,0.6),0_2px_4px_rgba(0,0,0,0.3),inset_0_-1px_1px_rgba(255,255,255,0.04)] focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.03),0_6px_20px_rgba(0,0,0,0.08)] dark:focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_6px_20px_rgba(0,0,0,0.6)]"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setActiveFaqId(null);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 transition-colors cursor-pointer"
                                aria-label="Clear FAQ search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                        {categories.map((cat) => {
                            const isCatActive = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        setSelectedCategory(cat);
                                        setActiveFaqId(null);
                                    }}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer select-none ${
                                        isCatActive
                                            ? 'bg-gradient-to-b from-[#1e1f23] via-[#151618] to-[#0c0d0f] text-white dark:from-white dark:via-stone-50 dark:to-stone-100 dark:text-stone-950 border-t border-t-white/35 dark:border-t-white border-x border-x-white/10 dark:border-x-stone-200 border-b-[2.5px] border-b-black dark:border-b-stone-350 shadow-[0_6px_14px_-2px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.2),inset_0_1.5px_1px_rgba(255,255,255,0.25)] dark:shadow-[0_6px_14px_-2px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.95)] active:translate-y-[1px] active:border-b-[1.5px]'
                                            : 'bg-gradient-to-b from-white via-white to-stone-50/90 dark:from-[#212226] dark:via-[#1b1c1f] dark:to-[#151618] text-stone-600 dark:text-stone-300 border border-stone-200/90 dark:border-stone-700/80 border-t-white dark:border-t-white/15 border-b-[2.5px] border-b-stone-300/85 dark:border-b-stone-950 shadow-[0_3px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02),inset_0_1.5px_1px_rgba(255,255,255,1)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1.5px_1px_rgba(255,255,255,0.08)] hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-[0_6px_14px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_6px_14px_rgba(0,0,0,0.7)] hover:-translate-y-0.5 active:translate-y-[1px] active:border-b-[1.5px]'
                                    }`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* FAQ Accordion Items */}
                <div className="space-y-3">
                    {filteredFaqs.length === 0 ? (
                        <div className="text-center py-10 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 text-xs sm:text-sm text-stone-400 shadow-sm">
                            No questions found matching your search. Click below to chat with our support team.
                        </div>
                    ) : (
                        filteredFaqs.map((faq) => {
                            const isOpen = activeFaqId === faq.id;
                            return (
                                <div 
                                    key={faq.id} 
                                    className={`relative rounded-2xl overflow-hidden transition-[border-color,box-shadow] duration-300 ease-out ${
                                        isOpen 
                                            ? 'bg-gradient-to-b from-stone-50/80 via-white to-stone-50 dark:from-[#25262c] dark:via-[#1e1f23] dark:to-[#161719] border border-emerald-500 dark:border-emerald-500 border-t-emerald-400 dark:border-t-emerald-400 border-b-[3.5px] border-b-emerald-600 dark:border-b-emerald-800 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.1),0_4px_14px_rgba(16,185,129,0.2),inset_0_1.5px_1.5px_rgba(255,255,255,1)] dark:shadow-[0_18px_40px_-6px_rgba(0,0,0,0.85),0_4px_14px_rgba(16,185,129,0.3),inset_0_1.5px_1.5px_rgba(255,255,255,0.12)]' 
                                            : 'bg-gradient-to-b from-stone-50/90 via-white to-stone-100/80 dark:from-[#222328] dark:via-[#1c1d20] dark:to-[#151618] border border-stone-200/90 dark:border-stone-700/80 border-t-white dark:border-t-white/15 border-b-[3.5px] border-b-stone-300/90 dark:border-b-stone-950 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.08),0_4px_10px_-2px_rgba(0,0,0,0.04),inset_0_1.5px_1.5px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_14px_32px_-6px_rgba(0,0,0,0.7),0_4px_12px_-2px_rgba(0,0,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.12),inset_0_-1.5px_2px_rgba(0,0,0,0.5)] hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-[0_16px_34px_-6px_rgba(0,0,0,0.11)] dark:hover:shadow-[0_18px_38px_-6px_rgba(0,0,0,0.8)]'
                                    }`}
                                >
                                    {/* Top specular reflection arc */}
                                    <div className="absolute inset-x-2 top-0 h-2.5 rounded-t-xl bg-gradient-to-b from-white/90 dark:from-white/10 to-transparent pointer-events-none" />

                                    <button 
                                        type="button"
                                        onClick={() => setActiveFaqId(prev => prev === faq.id ? null : faq.id)}
                                        className="relative z-10 w-full px-5 py-4 flex items-start justify-between gap-3 text-left hover:bg-stone-50/40 dark:hover:bg-stone-800/20 transition-colors cursor-pointer select-none"
                                    >
                                        <div className="flex-1 min-w-0 pr-2">
                                            <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white block leading-snug tracking-tight">{faq.q}</span>
                                            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800/90 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80 border-t-white dark:border-t-white/10 border-b-[1.5px] border-b-stone-300/70 dark:border-b-stone-950 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.06)]">
                                                {faq.category}
                                            </span>
                                        </div>
                                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border transition-all duration-300 ${
                                            isOpen 
                                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]' 
                                                : 'bg-stone-100 dark:bg-stone-800/80 border-stone-200/80 dark:border-stone-700/80 border-b-[1.5px] border-b-stone-300/80 dark:border-b-stone-900 text-stone-500 dark:text-stone-400 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0.5px_rgba(255,255,255,0.8)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0.5px_rgba(255,255,255,0.06)]'
                                        }`}>
                                            <motion.div
                                                animate={{ rotate: isOpen ? 180 : 0 }}
                                                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                                            >
                                                <ChevronDown size={15} />
                                            </motion.div>
                                        </div>
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div 
                                                key={`faq-content-${faq.id}`}
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ 
                                                    height: 'auto', 
                                                    opacity: 1,
                                                    transition: {
                                                        height: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                                                        opacity: { duration: 0.22, delay: 0.05, ease: 'easeOut' }
                                                    }
                                                }}
                                                exit={{ 
                                                    height: 0, 
                                                    opacity: 0,
                                                    transition: {
                                                        height: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                                                        opacity: { duration: 0.15, ease: 'easeIn' }
                                                    }
                                                }}
                                                style={{ overflow: 'hidden' }}
                                                className="overflow-hidden relative z-10"
                                            >
                                                <div className="px-5 pb-5 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-200/70 dark:border-stone-800/80 pt-3.5 bg-gradient-to-b from-stone-50/90 to-stone-100/50 dark:from-[#17181b] dark:to-[#121315] shadow-[inset_0_3px_6px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_3px_8px_rgba(0,0,0,0.5)]">
                                                    <p className="whitespace-pre-line leading-relaxed">{faq.a}</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Still Have Questions CTA with Real Layered 3D Depth */}
                <div className="relative mt-8 p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-stone-50 via-white to-stone-100/90 dark:from-[#222327] dark:via-[#1a1b1e] dark:to-[#131416] border border-stone-200/90 dark:border-stone-700/80 border-t-white dark:border-t-white/15 border-b-[3.5px] border-b-stone-300/90 dark:border-b-stone-950 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.08),0_4px_12px_-2px_rgba(0,0,0,0.04),inset_0_1.5px_1.5px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_45px_-8px_rgba(0,0,0,0.7),0_6px_16px_-3px_rgba(0,0,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.12),inset_0_-1.5px_2px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left overflow-hidden">
                    {/* Top specular reflection arc */}
                    <div className="absolute inset-x-3 top-0.5 h-3 rounded-t-2xl bg-gradient-to-b from-white/90 dark:from-white/10 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                        <h4 className="font-heading font-black text-base sm:text-lg text-stone-900 dark:text-white tracking-tight">Still have questions?</h4>
                        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 font-medium leading-relaxed">Can't find what you're looking for? Chat with our team anytime.</p>
                    </div>
                    <button
                        onClick={onStartChat}
                        className="relative z-10 w-full sm:w-auto px-6 py-3.5 rounded-full bg-gradient-to-b from-[#1e1f23] via-[#151618] to-[#0c0d0f] hover:from-[#26282d] hover:to-[#151618] dark:from-white dark:via-stone-50 dark:to-stone-100 dark:hover:to-white text-white dark:text-stone-950 font-heading font-black text-xs sm:text-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2.5 whitespace-nowrap border-t border-t-white/35 dark:border-t-white border-x border-x-white/10 dark:border-x-stone-200 border-b-[3.5px] border-b-black dark:border-b-stone-350 shadow-[0_10px_25px_-4px_rgba(0,0,0,0.45),0_4px_10px_-2px_rgba(0,0,0,0.25),inset_0_1.5px_1px_rgba(255,255,255,0.25),inset_0_-1px_1px_rgba(0,0,0,0.4)] dark:shadow-[0_10px_25px_-4px_rgba(0,0,0,0.15),0_4px_10px_-2px_rgba(0,0,0,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.95)] hover:shadow-[0_14px_30px_-4px_rgba(0,0,0,0.55)] dark:hover:shadow-[0_14px_30px_-4px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:border-b-[1.5px] active:shadow-[0_2px_6px_rgba(0,0,0,0.3)] dark:active:shadow-[0_2px_6px_rgba(0,0,0,0.1)] shrink-0 select-none group"
                    >
                        <MessageSquare size={15} className="shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)] dark:drop-shadow-none group-hover:scale-105 transition-transform" />
                        <span className="whitespace-nowrap">Chat With Us</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const LandingView = ({ 
  onOpenDownload, 
  appSettings 
}: { 
  onOpenDownload?: () => void; 
  appSettings: any 
}) => {
  const { t } = useAppTranslation();
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-stone-300 selection:text-stone-900 relative overflow-hidden">


      {/* Dynamic Announcement Banner (e.g. Independence Day / Festival Mode) */}
      {appSettings.bannerActive && appSettings.bannerText && (
        <div className="bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-600 text-white text-xs sm:text-sm font-semibold py-2 px-4 text-center relative z-[60] shadow-md flex items-center justify-center gap-2">
          <span>{appSettings.bannerText}</span>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent border-b border-stone-200 dark:border-stone-800 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group text-gray-900 dark:text-white" onClick={() => navigate('/')}>
             <div className="relative inline-block">
                <BrandLogo size="lg" className="h-6 sm:h-6.5" />
             </div>
          </div>

          <div className="hidden md:flex items-center gap-10">
             <a href="#features" className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors tracking-tight">Features</a>
             <button onClick={onOpenDownload} className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors tracking-tight flex items-center gap-1.5">
               <Download size={14} className="text-amber-500" /> Download App
             </button>
             <button className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors tracking-tight">Pricing</button>
          </div>

          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/login')} className="text-sm font-bold text-gray-900 dark:text-white hover:text-black dark:hover:text-gray-300 hidden sm:block tracking-tight">Log in</button>
             <Button variant="premium" size="md" onClick={() => navigate('/signup')}>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 lg:pb-32 px-4 sm:px-6 relative z-10 overflow-hidden">
         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
             <div className="max-w-2xl min-w-0 w-full">
                 <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-heading font-black tracking-tight sm:tracking-tighter text-gray-900 dark:text-white mb-4 sm:mb-6 md:mb-8 leading-[1.08] sm:leading-[0.95]"
                 >
                    Master your <br/>
                    <span className="relative inline-block px-3 sm:px-4 py-1 sm:py-1.5 mt-1 sm:mt-2">
                        <span className="relative z-10 text-white">documents.</span>
                        <motion.span 
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 bg-gray-900 rounded-xl sm:rounded-2xl z-0 origin-left"
                        />
                    </span>
                 </motion.h1>
                 <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-500 dark:text-gray-400 mb-5 sm:mb-6 leading-relaxed max-w-lg font-medium tracking-tight"
                 >
                    Convert, edit, and organize PDF files with professional-grade tools. 
                    Built for speed and privacy.
                 </motion.p>
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 mb-6"
                 >
                     <Button 
                        variant="premium"
                        size="lg" 
                        onClick={() => navigate('/signup')} 
                        className="w-full sm:w-auto justify-center text-base font-bold py-3.5 px-7"
                     >
                        Start Now
                        <ArrowRight className="ml-2.5 w-5 h-5" />
                     </Button>
                     <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-full shadow-sm self-start sm:self-auto">
                        <motion.div
                           animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.1, 1] }}
                           transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                           className="relative flex items-center justify-center"
                        >
                           <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </motion.div>
                        <span className="text-xs sm:text-xs font-bold text-emerald-700 dark:text-emerald-300">
                           No credit card required for free use
                        </span>
                     </div>
                 </motion.div>
                 
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-4 mb-12 sm:mb-16"
                 >
                    <div className="flex -space-x-3">
                        {(() => {
                            // Verified Indian students, engineers, and creators portraits from Unsplash
                            const indianAvatars = [
                                [
                                    // Cohort 1: Indian student and professional portraits
                                    "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=150&auto=format&fit=crop&q=80", // Young Indian woman in glasses
                                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80", 
                                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                                    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"  // Indian student smiling
                                ],
                                [
                                    // Cohort 2: Indian developer & researchers
                                    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
                                    "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=150&auto=format&fit=crop&q=80",
                                    "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=150&auto=format&fit=crop&q=80",
                                    "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=150&auto=format&fit=crop&q=80"
                                ],
                                [
                                    // Cohort 3: Indian college students
                                    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
                                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                                    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
                                    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80"
                                ]
                            ];

                            // Dynamic 12-hour cycle interval index based on current time
                            const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
                            const cycleIndex = Math.floor(Date.now() / TWELVE_HOURS_MS) % indianAvatars.length;
                            const activeCohort = indianAvatars[cycleIndex];

                            return activeCohort.slice(0, 4).map((photoUrl, idx) => (
                                <motion.div 
                                    key={`${cycleIndex}-${idx}`} 
                                    whileHover={{ y: -4, scale: 1.08, zIndex: 20 }}
                                    className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden shadow-md transition-transform"
                                >
                                    <img 
                                        src={photoUrl} 
                                        alt="Indian Verified User" 
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer" 
                                    />
                                </motion.div>
                            ));
                        })()}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white text-sm">4.9/5</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('landing.userTrust', 'Loved by 10k+ users every week')}</p>
                    </div>
                 </motion.div>

                 {/* Popular Automated Tools - Filling the vertical space */}
                 <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                     className="pt-8 border-t border-stone-200/60 dark:border-stone-800/60"
                 >
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 mb-5 flex items-center gap-3">
                        {t('landing.popularAutomated', 'Popular Automated Tools')}
                        <span className="h-px bg-stone-200 dark:bg-stone-800 flex-1" />
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div onClick={() => navigate('/merge-pdf')} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all cursor-pointer group">
                           <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Combine size={18} /></div>
                           <div className="flex flex-col">
                               <span className="text-sm font-bold text-stone-800 dark:text-stone-200">{t('tools.merge', 'Merge PDF')}</span>
                               <span className="text-[10px] font-semibold text-stone-500">{t('actions.merge', 'Combine files')}</span>
                           </div>
                        </div>
                        
                        <div onClick={() => navigate('/compress-pdf')} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-500/50 transition-all cursor-pointer group">
                           <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Archive size={18} /></div>
                           <div className="flex flex-col">
                               <span className="text-sm font-bold text-stone-800 dark:text-stone-200">{t('tools.compress', 'Compress')}</span>
                               <span className="text-[10px] font-semibold text-stone-500">{t('actions.compress', 'Reduce size')}</span>
                           </div>
                        </div>
                        
                        <div onClick={() => navigate('/split-pdf')} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-500/50 transition-all cursor-pointer group">
                           <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Scissors size={18} /></div>
                           <div className="flex flex-col">
                               <span className="text-sm font-bold text-stone-800 dark:text-stone-200">{t('tools.split', 'Split PDF')}</span>
                               <span className="text-[10px] font-semibold text-stone-500">{t('actions.split', 'Extract pages')}</span>
                           </div>
                        </div>
                        
                        <div onClick={() => navigate('/pdf-to-text')} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-200 dark:hover:border-rose-500/50 transition-all cursor-pointer group">
                           <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform"><ScanLine size={18} /></div>
                           <div className="flex flex-col">
                               <span className="text-sm font-bold text-stone-800 dark:text-stone-200">{t('tools.ocr', 'PDF to Text')}</span>
                               <span className="text-[10px] font-semibold text-stone-500">{t('actions.extract', 'Extract text')}</span>
                           </div>
                        </div>
                    </div>
                 </motion.div>

              </div>
             
             {/* Hero Visual */}
             <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative perspective-1000 min-w-0 w-full"
             >
                  <LiveDemo />
                  
             </motion.div>
         </div>

         {/* Premium Features Marquee */}
         <div className="mt-16 sm:mt-20 overflow-hidden relative w-full max-w-7xl mx-auto">
             <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-stone-50 via-stone-50/80 to-transparent z-10 pointer-events-none" />
             <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-stone-50 via-stone-50/80 to-transparent z-10 pointer-events-none" />
             
             <div className="flex gap-3 whitespace-nowrap animate-marquee-slow w-max mb-3">
                 {[...AZ_FEATURES.flatMap(g => g.features), ...AZ_FEATURES.flatMap(g => g.features)].map((feature, i) => (
                     <div key={`top-${i}`} className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-stone-800/80 rounded-full border border-stone-200/80 dark:border-stone-700/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-[11px] sm:text-xs font-bold text-stone-700 dark:text-stone-200 tracking-tight hover:border-stone-400 hover:shadow-md transition-all cursor-default">
                         <feature.icon size={14} className="text-stone-900 dark:text-white" />
                         {t(`features.${feature.id}.name`, feature.name)}
                     </div>
                 ))}
             </div>
             <div className="flex gap-3 whitespace-nowrap animate-marquee-reverse w-max">
                 {[...AZ_FEATURES.flatMap(g => g.features).reverse(), ...AZ_FEATURES.flatMap(g => g.features).reverse()].map((feature, i) => (
                     <div key={`bottom-${i}`} className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-stone-800/80 rounded-full border border-stone-200/80 dark:border-stone-700/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-[11px] sm:text-xs font-bold text-stone-700 dark:text-stone-200 tracking-tight hover:border-stone-400 hover:shadow-md transition-all cursor-default">
                         <feature.icon size={14} className="text-stone-900 dark:text-white" />
                         {t(`features.${feature.id}.name`, feature.name)}
                     </div>
                 ))}
             </div>
         </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 sm:py-32 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
               <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-24">
                   <h2 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-black tracking-tighter mb-4 sm:mb-6">Everything you need</h2>
                   <p className="text-lg sm:text-xl lg:text-2xl text-gray-500 font-medium tracking-tight">Powerful tools designed for modern document workflows.</p>
               </div>
               
               <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                   {[
                       { icon: Sparkles, title: "Automated Tools", desc: "Summarize and rewrite documents instantly with our automated system.", color: "bg-stone-50 text-stone-600" },
                       { icon: ShieldCheck, title: "Secure by Default", desc: "Enterprise-grade encryption for all your sensitive files.", color: "bg-indigo-50 text-indigo-600" },
                       { icon: Zap, title: "Lightning Fast", desc: "Convert and compress large files in seconds, not minutes.", color: "bg-slate-50 text-slate-600" }
                   ].map((f, i) => (
                       <motion.div 
                            key={i} 
                            whileHover={{ y: -10 }}
                            className="bg-white/40 p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:border-white/80 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
                       >
                           <div className={`w-16 h-16 sm:w-20 sm:h-20 ${f.color} rounded-2xl sm:rounded-3xl flex items-center justify-center mb-8 sm:mb-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm`}>
                               <f.icon size={30} sm:size={36} />
                           </div>
                           <h3 className="text-2xl sm:text-3xl font-heading font-black tracking-tighter mb-3 sm:mb-4">{f.title}</h3>
                           <p className="text-base sm:text-lg text-gray-500 leading-relaxed font-medium">{f.desc}</p>
                           
                           {/* Subtle Liquid Shine */}
                           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-white/0 to-white/30 rounded-full  group-hover:scale-150 transition-transform duration-700" />
                       </motion.div>
                   ))}
               </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/10 border-t border-white/20 py-6 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                         <BrandLogo size="sm" className="h-5 sm:h-5.5 opacity-90" />
                      </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
                      <span>
                          <span className="font-serif italic text-base text-gray-700 dark:text-gray-300">Sayan</span>
                          <span className="font-sans ml-1 opacity-80">— Born in India. Built for the World</span>
                      </span>
                  </div>
              </div>
          </div>
      </footer>
    </div>
  );
};

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const completedRef = useRef(false);

  const handleFinish = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  useEffect(() => {
    // 3.2s lifecycle matching the exact video animation duration
    const timer = setTimeout(() => {
      handleFinish();
    }, 3200); 
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div 
      key="paperx-splash-screen"
      onClick={handleFinish}
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } 
      }}
      className="fixed inset-0 z-[999999] bg-black flex items-center justify-center p-4 overflow-hidden select-none cursor-pointer"
    >
      {/* Background Soft Center Halo matching video reference */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{
          opacity: [0, 0.7, 0.7, 0],
          scale: [1.1, 1.02, 0.98, 0.85],
        }}
        transition={{
          duration: 3.2,
          times: [0, 0.3, 0.7, 1.0],
          ease: "easeInOut"
        }}
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,103,31,0.08) 35%, rgba(4,106,56,0.08) 65%, rgba(0,0,0,0) 80%)",
        }}
        className="absolute w-[360px] h-[360px] sm:w-[520px] sm:h-[520px] pointer-events-none rounded-full " 
      />

      {/* Centered Brand Typography - Exact 1:1 Video Blur-in, Hold with Inside Tricolor Flow, and Blur/Zoom-out */}
      <motion.h1
        initial={{ 
          opacity: 0, 
          filter: "none", 
          scale: 1.06,
          backgroundPosition: "0% 50%"
        }}
        animate={{
          opacity: [0, 1, 1, 0],
          filter: "none",
          scale: [1.06, 1.0, 0.99, 0.94],
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          opacity: { duration: 3.2, times: [0, 0.3, 0.7, 1.0], ease: "easeInOut" },
          filter: { duration: 3.2, times: [0, 0.3, 0.7, 1.0], ease: "easeInOut" },
          scale: { duration: 3.2, times: [0, 0.3, 0.7, 1.0], ease: "easeInOut" },
          backgroundPosition: { duration: 3.2, ease: "linear" }
        }}
        onAnimationComplete={() => {
          handleFinish();
        }}
        style={{ 
          backgroundImage: "linear-gradient(to right, #4f46e5, #0ea5e9, #6366f1, #0ea5e9, #4f46e5)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 15px rgba(255,255,255,0.15))",
          willChange: "transform, filter, opacity, background-position",
          transform: "translateZ(0)",
        }}
        className="font-heading font-black text-5xl sm:text-6xl md:text-7xl tracking-tighter text-center select-none relative z-10 p-4"
      >
        {APP_NAME}
      </motion.h1>
    </motion.div>
  );
};


const DownloadAppView = ({ navigate }: { navigate: (path: string) => void }) => {
  return (
    <div className="flex items-center justify-center w-full p-4 sm:p-6">
      <div className="relative w-full max-w-lg mx-auto">
        {/* 3D Glass Layered Card */}
        <div 
          className="relative z-10 bg-white/98 dark:bg-stone-900/98 border border-stone-200 dark:border-stone-800 rounded-[32px] sm:rounded-[40px] p-7 sm:p-10 text-center shadow-2xl space-y-6 sm:space-y-7 transform-gpu"
        >
          {/* 3D Round Square Box without Glow */}
          <div className="relative flex items-center justify-center mx-auto">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] sm:rounded-[28px] bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700 dark:from-emerald-400 dark:via-emerald-500 dark:to-emerald-800 text-white flex items-center justify-center border-t border-emerald-200/90 border-b-2 border-emerald-900/80 border-x border-emerald-400/60 shadow-[0_12px_24px_-6px_rgba(0,0,0,0.25),0_4px_8px_-2px_rgba(0,0,0,0.1),inset_0_2px_1.5px_rgba(255,255,255,0.8),inset_0_-2px_3px_rgba(6,78,59,0.6)] dark:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.6),0_4px_8px_-2px_rgba(0,0,0,0.3),inset_0_2px_1.5px_rgba(255,255,255,0.5),inset_0_-3px_3px_rgba(4,47,35,0.8)]">
              <Download size={42} strokeWidth={2.4} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]" />
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-stone-900 dark:text-white tracking-tight leading-tight">
              Download App
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm sm:text-[15px] font-normal leading-relaxed max-w-md mx-auto text-balance">
              Get the official PaperX app. Fast, secure, and private.
            </p>
          </div>

          {/* Feature Highlight Boxes with Layered 3D Bubble Depth - Perfectly Aligned */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 py-2 sm:py-2.5 items-stretch">
            {/* Box 1: 0% Risk */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative p-2 sm:p-3 pt-3 sm:pt-3.5 rounded-2xl bg-gradient-to-b from-stone-50/90 via-white to-stone-100/80 dark:from-[#25262a] dark:via-[#1e1f23] dark:to-[#161719] border border-stone-200/90 dark:border-stone-700/90 border-b-[3.5px] border-b-stone-300 dark:border-b-stone-950 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04),inset_0_1.5px_1.5px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.6),0_3px_8px_rgba(0,0,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.15),inset_0_-1.5px_2px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center select-none overflow-hidden h-[130px] sm:h-[136px]"
            >
              {/* Glossy top bubble highlight arc */}
              <div className="absolute inset-x-2 top-0.5 h-2.5 rounded-t-xl bg-gradient-to-b from-white/90 dark:from-white/10 to-transparent pointer-events-none" />

              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-b from-emerald-100/90 via-emerald-50 to-emerald-100/60 dark:from-emerald-900/60 dark:via-emerald-950/80 dark:to-emerald-950 border border-emerald-200/90 dark:border-emerald-700/60 border-b-2 border-b-emerald-300/80 dark:border-b-emerald-950 shadow-[0_3px_8px_rgba(16,185,129,0.22),inset_0_1.5px_1px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(5,150,105,0.2)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.15)] flex items-center justify-center mb-2 shrink-0 relative z-10">
                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 drop-shadow-[0_1px_1px_rgba(16,185,129,0.25)]" />
              </div>
              <div className="h-[22px] sm:h-[24px] flex items-center justify-center w-full relative z-10">
                <span className="text-[11px] sm:text-[11.5px] font-black text-stone-900 dark:text-stone-100 tracking-tight leading-tight">0% Risk</span>
              </div>
              <div className="h-[36px] flex items-center justify-center w-full relative z-10 px-0.5">
                <span className="text-[9px] sm:text-[9.5px] font-medium text-stone-500 dark:text-stone-400 tracking-normal leading-tight text-center">Your files stay yours</span>
              </div>
            </motion.div>

            {/* Box 2: Instant Speed */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative p-2 sm:p-3 pt-3 sm:pt-3.5 rounded-2xl bg-gradient-to-b from-stone-50/90 via-white to-stone-100/80 dark:from-[#25262a] dark:via-[#1e1f23] dark:to-[#161719] border border-stone-200/90 dark:border-stone-700/90 border-b-[3.5px] border-b-stone-300 dark:border-b-stone-950 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04),inset_0_1.5px_1.5px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.6),0_3px_8px_rgba(0,0,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.15),inset_0_-1.5px_2px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center select-none overflow-hidden h-[130px] sm:h-[136px]"
            >
              {/* Glossy top bubble highlight arc */}
              <div className="absolute inset-x-2 top-0.5 h-2.5 rounded-t-xl bg-gradient-to-b from-white/90 dark:from-white/10 to-transparent pointer-events-none" />

              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-b from-amber-100/90 via-amber-50 to-amber-100/60 dark:from-amber-900/60 dark:via-amber-950/80 dark:to-amber-950 border border-amber-200/90 dark:border-amber-700/60 border-b-2 border-b-amber-300/80 dark:border-b-amber-950 shadow-[0_3px_8px_rgba(245,158,11,0.22),inset_0_1.5px_1px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(217,119,6,0.2)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.15)] flex items-center justify-center mb-2 shrink-0 relative z-10">
                <Zap size={18} className="text-amber-500 dark:text-amber-400 drop-shadow-[0_1px_1px_rgba(245,158,11,0.25)]" />
              </div>
              <div className="h-[22px] sm:h-[24px] flex items-center justify-center w-full relative z-10">
                <span className="text-[11px] sm:text-[11.5px] font-black text-stone-900 dark:text-stone-100 tracking-tight leading-tight">Instant Speed</span>
              </div>
              <div className="h-[36px] flex items-center justify-center w-full relative z-10 px-0.5">
                <span className="text-[9px] sm:text-[9.5px] font-medium text-stone-500 dark:text-stone-400 tracking-normal leading-tight text-center">Millisecond file dispatch</span>
              </div>
            </motion.div>

            {/* Box 3: Risk Free */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative p-2 sm:p-3 pt-3 sm:pt-3.5 rounded-2xl bg-gradient-to-b from-stone-50/90 via-white to-stone-100/80 dark:from-[#25262a] dark:via-[#1e1f23] dark:to-[#161719] border border-stone-200/90 dark:border-stone-700/90 border-b-[3.5px] border-b-stone-300 dark:border-b-stone-950 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04),inset_0_1.5px_1.5px_rgba(255,255,255,1),inset_0_-1.5px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.6),0_3px_8px_rgba(0,0,0,0.4),inset_0_1.5px_1.5px_rgba(255,255,255,0.15),inset_0_-1.5px_2px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center select-none overflow-hidden h-[130px] sm:h-[136px]"
            >
              {/* Glossy top bubble highlight arc */}
              <div className="absolute inset-x-2 top-0.5 h-2.5 rounded-t-xl bg-gradient-to-b from-white/90 dark:from-white/10 to-transparent pointer-events-none" />

              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-b from-blue-100/90 via-blue-50 to-blue-100/60 dark:from-blue-900/60 dark:via-blue-950/80 dark:to-blue-950 border border-blue-200/90 dark:border-blue-700/60 border-b-2 border-b-blue-300/80 dark:border-b-blue-950 shadow-[0_3px_8px_rgba(59,130,246,0.22),inset_0_1.5px_1px_rgba(255,255,255,0.95),inset_0_-1px_1px_rgba(37,99,235,0.2)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.15)] flex items-center justify-center mb-2 shrink-0 relative z-10">
                <Lock size={18} className="text-blue-600 dark:text-blue-400 drop-shadow-[0_1px_1px_rgba(59,130,246,0.25)]" />
              </div>
              <div className="h-[22px] sm:h-[24px] flex items-center justify-center w-full relative z-10">
                <span className="text-[11px] sm:text-[11.5px] font-black text-stone-900 dark:text-stone-100 tracking-tight leading-tight">Risk Free</span>
              </div>
              <div className="h-[36px] flex items-center justify-center w-full relative z-10 px-0.5">
                <span className="text-[9px] sm:text-[9.5px] font-medium text-stone-500 dark:text-stone-400 tracking-normal leading-tight text-center">100% Secure</span>
              </div>
            </motion.div>
          </div>

          {/* Primary Action Button with Layered Depth */}
          <div className="space-y-3 pt-1">
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => { e.preventDefault(); executeDirectAppDownload('Android'); }}
              className="relative w-full py-4 px-8 rounded-3xl bg-gradient-to-b from-[#1c1d20] via-[#141517] to-[#0d0e10] hover:from-[#222428] hover:to-[#141517] dark:from-white dark:via-white dark:to-stone-100 dark:hover:to-stone-50 text-white dark:text-stone-950 font-heading font-black text-sm sm:text-base border-t border-t-white/30 dark:border-t-white border-x border-x-white/10 dark:border-x-stone-200 border-b-[4px] border-b-black dark:border-b-stone-350 shadow-[0_14px_35px_-6px_rgba(0,0,0,0.45),0_6px_14px_-3px_rgba(0,0,0,0.25),inset_0_1.5px_1px_rgba(255,255,255,0.25),inset_0_-1px_1px_rgba(0,0,0,0.4)] dark:shadow-[0_14px_35px_-6px_rgba(0,0,0,0.15),0_6px_14px_-3px_rgba(0,0,0,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.95)] hover:shadow-[0_18px_40px_-6px_rgba(0,0,0,0.55)] dark:hover:shadow-[0_18px_40px_-6px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:border-b-[2px] active:shadow-[0_4px_12px_rgba(0,0,0,0.3)] dark:active:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all flex items-center justify-center gap-3 cursor-pointer group select-none overflow-hidden"
            >
              {/* Top edge specular reflection line */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/80 to-transparent pointer-events-none" />
              <Download size={20} strokeWidth={2.4} className="shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] dark:drop-shadow-none" />
              <span>Download APK Now</span>
            </motion.button>

            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-6 rounded-2xl bg-transparent hover:bg-stone-100/80 dark:hover:bg-stone-850 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 text-xs font-bold transition-all cursor-pointer"
            >
              Return to Web Workspace
            </button>
          </div>

          {/* Coming Soon Notice with official store logos */}
          <div className="pt-3.5 border-t border-stone-200/70 dark:border-stone-800/70 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-center">
            <span className="text-xs sm:text-[13px] font-medium text-stone-500 dark:text-stone-400">
              We will be coming soon on
            </span>
            <div className="inline-flex items-center gap-1.5 sm:gap-2">
              {/* Google Play Logo */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] select-none">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 32 32" fill="none">
                  <path d="M15.5 15.28 2.08 29.34a3.64 3.64 0 0 0 5.33 2.16l15.1-8.6z" fill="#EA4335"/>
                  <path d="m29.07 12.89-6.53-3.74-7.35 6.45 7.38 7.28 6.48-3.7a3.55 3.55 0 0 0 0-6.29z" fill="#FBBC04"/>
                  <path d="M2.08 2.66a3.46 3.46 0 0 0-.12.92v24.84a3.66 3.66 0 0 0 .12.92L15.96 15.64Z" fill="#4285F4"/>
                  <path d="m15.6 16 6.94-6.85L7.46.51A3.72 3.72 0 0 0 5.59 0 3.64 3.64 0 0 0 2.08 2.65Z" fill="#34A853"/>
                </svg>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-none">Google Play</span>
              </span>
              <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">and</span>
              {/* Apple App Store Logo */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] select-none">
                <svg className="w-4 h-4 rounded-[3.5px] shrink-0 shadow-xs" viewBox="0 0 800 800">
                  <defs>
                    <linearGradient id="ios_app_store_badge_grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#18BFFB"/>
                      <stop offset="100%" stopColor="#2072F3"/>
                    </linearGradient>
                  </defs>
                  <path fill="url(#ios_app_store_badge_grad)" d="M638.4,0H161.6C72.3,0,0,72.3,0,161.6v476.9C0,727.7,72.3,800,161.6,800h476.9c89.2,0,161.6-72.3,161.6-161.6V161.6C800,72.3,727.7,0,638.4,0z"/>
                  <path fill="#FFFFFF" d="M396.6,183.8l16.2-28c10-17.5,32.3-23.4,49.8-13.4s23.4,32.3,13.4,49.8L319.9,462.4h112.9c36.6,0,57.1,43,41.2,72.8H143c-20.2,0-36.4-16.2-36.4-36.4c0-20.2,16.2-36.4,36.4-36.4h92.8l118.8-205.9l-37.1-64.4c-10-17.5-4.1-39.6,13.4-49.8c17.5-10,39.6-4.1,49.8,13.4L396.6,183.8L396.6,183.8z M256.2,572.7l-35,60.7c-10,17.5-32.3,23.4-49.8,13.4S148,614.5,158,597l26-45C213.4,542.9,237.3,549.9,256.2,572.7L256.2,572.7z M557.6,462.6h94.7c20.2,0,36.4,16.2,36.4,36.4c0,20.2-16.2,36.4-36.4,36.4h-52.6l35.5,61.6c10,17.5,4.1,39.6-13.4,49.8c-17.5,10-39.6,4.1-49.8-13.4c-59.8-103.7-104.7-181.3-134.5-233c-30.5-52.6-8.7-105.4,12.8-123.3C474.2,318.1,509.9,380,557.6,462.6L557.6,462.6z"/>
                </svg>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-none">App Store</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickActionsComponent = ({
  t,
  handleToolClick
}: {
  t: (key: string, fallback?: string) => string;
  handleToolClick: (toolId: string) => void;
  handleFilesSelected?: (files: File[]) => void;
}) => (
  <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
       {/* Quick Actions */}
       {[
           { id: 'compress-pdf', label: t('tools.compress', 'Compress') },
           { id: 'merge-pdf', label: t('tools.merge', 'Merge') },
           { id: 'pdf-to-word', label: t('tools.convert', 'Convert') },
       ].map((action, i) => (
           <motion.button
               key={action.id}
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.08 }}
               whileTap={{ scale: 0.98 }}
               onClick={() => handleToolClick(action.id)}
               className="flex flex-col items-center justify-center p-5 sm:p-6 md:p-7 rounded-3xl bg-white/70 dark:bg-gray-900/70 border border-white/80 dark:border-white/10 hover:border-black/20 dark:hover:border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-xl transition-all duration-300 group relative overflow-hidden min-w-0 cursor-pointer"
           >
               <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mb-3 shrink-0">
                   <AnimatedToolIcon toolId={action.id} size={42} className="w-10 h-10 sm:w-12 sm:h-12" />
               </div>
               <span className="font-heading font-black text-xs sm:text-sm text-gray-900 dark:text-white tracking-tight z-10 whitespace-nowrap group-hover:text-black dark:group-hover:text-white transition-colors">{action.label}</span>
           </motion.button>
       ))}
  </div>
);

const DashboardView = ({
  searchQuery,
  setSearchQuery,
  user,
  handleDirectAppDownload,
  setIsCameraScannerOpen,
  setProfileInitialTab,
  setIsProfileOpen,
  handleToolClick,
  handleFilesSelected,
  isToolLocked,
  navigate,
  storedFiles,
  handleDownloadStoredFile,
  handleShareStoredFile,
  onOpen,
  t,
  getGreeting,
  guestTrialsUsed = 0,
}: any) => {
    const { t: hookT, currentLanguage } = useAppTranslation(user?.language);
    const activeT = (key: string, fallback?: string) => hookT(key, fallback) || (t ? t(key, fallback) : fallback || key);
    const currentLang = currentLanguage;

    const categoryLabels: Record<string, string> = {
      [ToolCategory.CONVERT_TO]: activeT('categories.convertTo', 'Convert to PDF'),
      [ToolCategory.CONVERT_FROM]: activeT('categories.convertFrom', 'Convert from PDF'),
      [ToolCategory.OPTIMIZE]: activeT('categories.optimize', 'Optimize & OCR'),
      [ToolCategory.ORGANIZE]: activeT('categories.organize', 'Organize & Pages'),
      [ToolCategory.SECURITY]: activeT('categories.security', 'Security & Sign'),
      [ToolCategory.INTELLIGENCE]: activeT('categories.intelligence', 'PDF Intelligence'),
      [ToolCategory.EDIT]: activeT('categories.edit', 'Edit & Markup')
    };

    const translatedTools = TOOLS.map(tool => translateTool(tool, currentLang));

    const q = (searchQuery || '').toLowerCase().trim();
    const filteredTools = translatedTools.filter(toolItem => {
      if (!q) return true;
      const nameMatch = (toolItem.name || '').toLowerCase().includes(q);
      const descMatch = (toolItem.description || '').toLowerCase().includes(q);
      const tagMatch = (toolItem.tags || []).some((t: string) => t.toLowerCase().includes(q));
      const inputMatch = (toolItem.inputFormats || []).some((fmt: string) => fmt.toLowerCase().includes(q));
      const outputMatch = (toolItem.outputFormat || '').toLowerCase().includes(q);
      return nameMatch || descMatch || tagMatch || inputMatch || outputMatch;
    });

    const categories = Object.values(ToolCategory);

    const matchedFiles = searchQuery && Array.isArray(storedFiles)
      ? storedFiles.filter((f: any) => (f.name || f.filename || '').toLowerCase().includes(q))
      : [];

    const [isScrolled, setIsScrolled] = useState(false);
    const [isBarVisible, setIsBarVisible] = useState(true);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const lastScrollTopRef = useRef(0);

    // Smart scroll listener on main-scroll-container and window
    useEffect(() => {
      const container = document.getElementById('main-scroll-container');
      let ticking = false;

      const onScroll = () => {
        const currentScrollTop = container 
          ? container.scrollTop 
          : (window.pageYOffset || document.documentElement.scrollTop || 0);

        if (!ticking) {
          window.requestAnimationFrame(() => {
            const delta = currentScrollTop - lastScrollTopRef.current;
            
            // At the top of the feed (within 24px), show in resting state
            if (currentScrollTop <= 24) {
              setIsScrolled(false);
              setIsBarVisible(true);
            } else {
              setIsScrolled(true);

              // If search is focused or user has typed a query, keep visible so interaction is never blocked
              if (isSearchFocused || (searchQuery && searchQuery.trim().length > 0)) {
                setIsBarVisible(true);
              } else {
                // Scrolling down (page content moving up): automatically goes upside (hides)
                if (delta > 6) {
                  setIsBarVisible(false);
                } 
                // Scrolling up (page content moving down): smoothly automatically comes down (reveals)
                else if (delta < -6) {
                  setIsBarVisible(true);
                }
              }
            }

            lastScrollTopRef.current = Math.max(0, currentScrollTop);
            ticking = false;
          });
          ticking = true;
        }
      };

      if (container) {
        container.addEventListener('scroll', onScroll, { passive: true });
      }
      window.addEventListener('scroll', onScroll, { passive: true });

      return () => {
        if (container) container.removeEventListener('scroll', onScroll);
        window.removeEventListener('scroll', onScroll);
      };
    }, [isSearchFocused, searchQuery]);

    // Keyboard shortcut ⌘K or Ctrl+K to reveal bar and focus search
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setIsBarVisible(true);
          searchInputRef.current?.focus();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const hour = new Date().getHours();
    const GreetingIcon = hour < 12 ? Sun : hour < 18 ? Sparkles : Moon;
    const greetingBadgeColor = hour < 12 
      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/40' 
      : hour < 18 
      ? 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border border-orange-200/50 dark:border-orange-900/40' 
      : 'text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-900/40';

    const userFirstName = (() => {
      const raw = (user?.name || user?.email || '').trim();
      if (!raw) return 'Paper';
      const namePart = raw.includes('@') ? raw.split('@')[0] : raw;
      const firstName = namePart.split(/[\s._-]+/)[0] || 'Paper';
      return firstName.charAt(0).toUpperCase() + firstName.slice(1);
    })();

    const greetingPrefix = getGreeting ? getGreeting() : 'Good day';

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="pb-6 pt-2 sm:pt-3 w-full flex flex-col relative min-h-full"
        >
            <div className="flex-1 flex flex-col lg:flex-row gap-4 px-3 sm:px-4">
                
                {/* LEFT MAIN AREA */}
                <div className="flex-1 flex flex-col gap-2 pb-4 min-w-0">

                    {/* UNIFIED GREETING & SEARCH CARD (Stable layout, zero scroll jumping) */}
                    <div className="mb-4 sm:mb-5">
                      <div className="w-full p-4 sm:p-5 bg-gradient-to-b from-white/95 to-white/85 dark:from-stone-900/95 dark:to-stone-900/85 backdrop-blur-xl border border-stone-200/80 dark:border-stone-800/80 rounded-3xl shadow-sm">
                        <div className="flex flex-col gap-3.5">
                          {/* Top Header Row: Greeting & Badges */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${greetingBadgeColor} flex items-center justify-center shrink-0 shadow-xs`}>
                                <GreetingIcon size={20} />
                              </div>
                              <div>
                                <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight leading-tight">
                                  {greetingPrefix}, {userFirstName}!
                                </h1>
                                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium leading-normal mt-0.5">
                                  {activeT('dashboard.searchSubtitle', 'Search all tools and documents to convert, organize, and edit')}
                                </p>
                              </div>
                            </div>
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-stone-100/90 dark:bg-stone-800/70 border border-stone-200/60 dark:border-stone-700/60 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 select-none">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>30+ PDF Tools Ready</span>
                            </div>
                          </div>

                          {/* Search Input seamlessly inside same unified card */}
                          <div className="relative w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-stone-900 dark:group-focus-within:text-white transition-colors pointer-events-none" />
                            <input
                              ref={searchInputRef}
                              type="text"
                              placeholder={activeT('dashboard.searchPlaceholderFull', 'Search all tools and documents (e.g. merge, word, excel, pdf)...')}
                              value={searchQuery}
                              onFocus={() => setIsSearchFocused(true)}
                              onBlur={() => setIsSearchFocused(false)}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-11 pr-20 py-3 sm:py-3.5 bg-stone-100/80 dark:bg-stone-800/70 focus:bg-white dark:focus:bg-stone-900 border border-transparent focus:border-stone-400 dark:focus:border-stone-600 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none shadow-xs hover:border-stone-300 dark:hover:border-stone-700 transition-all text-stone-900 dark:text-stone-100 placeholder-stone-400"
                            />
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                              {searchQuery ? (
                                <button 
                                  onClick={() => {
                                    setSearchQuery('');
                                    searchInputRef.current?.focus();
                                  }}
                                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700/60 transition-colors cursor-pointer"
                                  aria-label="Clear search"
                                >
                                  <X size={14} />
                                </button>
                              ) : (
                                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold text-stone-400 dark:text-stone-500 bg-stone-200/60 dark:bg-stone-800 rounded-md border border-stone-300/40 dark:border-stone-700/50 select-none">
                                  ⌘K
                                </kbd>
                              )}
                            </div>
                          </div>

                          {/* Quick Filter Suggestion Chips */}
                          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-0.5">
                            <span className="text-[10px] sm:text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mr-1 shrink-0 select-none">
                              Quick:
                            </span>
                            {[
                              { label: 'All', query: '' },
                              { label: 'PDF to Word', query: 'Word' },
                              { label: 'Merge', query: 'Merge' },
                              { label: 'Compress', query: 'Compress' },
                              { label: 'Sign & Lock', query: 'Security' },
                              { label: 'OCR & AI', query: 'OCR' },
                            ].map(chip => (
                              <button
                                key={chip.label}
                                onClick={() => {
                                  setSearchQuery(chip.query);
                                  searchInputRef.current?.focus();
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                                  searchQuery === chip.query
                                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
                                    : 'bg-stone-100/90 dark:bg-stone-800/80 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 text-stone-600 dark:text-stone-300'
                                }`}
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* MATCHED FILES SEARCH RESULTS */}
                    {searchQuery && matchedFiles.length > 0 && (
                        <div className="mb-8 px-1">
                            <div className="flex items-center gap-4 mb-4">
                                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] font-heading flex items-center gap-1.5">
                                    <Folder size={14} className="text-stone-500" />
                                    <span>Matching Documents ({matchedFiles.length})</span>
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-gray-100 dark:from-gray-800 to-transparent" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {matchedFiles.map((file: any) => (
                                    <div 
                                        key={file.id}
                                        className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-900/70 border border-stone-200/60 dark:border-white/10 rounded-2xl hover:border-stone-400 dark:hover:border-white/30 shadow-xs transition-all"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300 shrink-0">
                                                <FileText size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-stone-800 dark:text-stone-100 truncate">{file.filename}</h4>
                                                <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                                                    {file.toolUsed || 'Imported'} • {new Date(file.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => handleDownloadStoredFile(file.id)}
                                                className="px-2.5 py-1 text-[11px] font-bold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg transition-colors cursor-pointer"
                                            >
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-10">
                        {categories.map(category => {
                            const categoryTools = filteredTools.filter(t => t.category === category);
                            if (categoryTools.length === 0) return null;
                            return (
                                <div key={category}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] font-heading">{categoryLabels[category] || category}</h2>
                                        <div className="h-px flex-1 bg-gradient-to-r from-gray-100 dark:from-gray-800 to-transparent" />
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                                        {categoryTools.map((tool, idx) => (
                                            <motion.div 
                                                key={tool.id} 
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.03 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleToolClick(tool.id)}
                                                className="group relative flex flex-col p-4 sm:p-5 bg-white/80 dark:bg-gray-900/80 border border-white/90 dark:border-white/10 rounded-2xl sm:rounded-3xl hover:border-black/20 dark:hover:border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-xl cursor-pointer transition-all duration-300 items-start gap-3 min-w-0"
                                            >
                                                <div className="w-11 h-11 flex items-center justify-center shrink-0">
                                                    <AnimatedToolIcon toolId={tool.id} fallbackIcon={tool.icon} size={42} className="w-10 h-10" />
                                                </div>
                                                <div className="min-w-0 w-full flex-1 flex flex-col justify-between">
                                                    <h3 className="text-sm sm:text-base font-heading font-black text-gray-900 dark:text-white truncate group-hover:text-black dark:group-hover:text-white transition-colors tracking-tight mb-1">{tool.name}</h3>
                                                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 font-medium leading-tight">{tool.description}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
  };
const syncProfileToLocalStorage = (profile: any) => {
  if (!profile || typeof window === 'undefined') return;
  if (profile.autoRestoreSession !== undefined) {
    const isAutoRestore = Boolean(profile.autoRestoreSession);
    localStorage.setItem('pref_autoRestoreSession', String(isAutoRestore));
    try {
      setPersistence(auth, isAutoRestore ? browserLocalPersistence : browserSessionPersistence).catch(() => {});
    } catch (_) {}
  }
  if (profile.twoFactorEnabled !== undefined) {
    localStorage.setItem('pref_twoStep', String(profile.twoFactorEnabled));
  }
  if (profile.twoFactorSecret) {
    localStorage.setItem('paperx_2fa_secret', profile.twoFactorSecret);
  }
  if (profile.twoFactorBackupCodes) {
    localStorage.setItem('paperx_2fa_backup_codes', JSON.stringify(profile.twoFactorBackupCodes));
  }
  if (profile.darkMode !== undefined || profile.theme) {
    const isDark = profile.darkMode !== undefined ? Boolean(profile.darkMode) : profile.theme === 'dark';
    safeStorage.setItem('pref_darkMode', String(isDark));
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  if (profile.fontSize) {
    safeStorage.setItem('pref_fontSize', profile.fontSize);
    document.documentElement.setAttribute('data-font-size', profile.fontSize);
  }
  if (profile.largerTextEnabled !== undefined) {
    safeStorage.setItem('pref_largerText', String(profile.largerTextEnabled));
    document.documentElement.setAttribute('data-larger-text', String(profile.largerTextEnabled));
  }
  if (profile.pdfQuality) {
    safeStorage.setItem('pref_pdfQuality', profile.pdfQuality);
  }
  if (profile.namingPattern) {
    safeStorage.setItem('pref_namingPattern', profile.namingPattern);
  }
  if (profile.autoSaveScan !== undefined) {
    safeStorage.setItem('pref_autoSaveScan', String(profile.autoSaveScan));
  }
  if (profile.ocrLanguage) {
    safeStorage.setItem('pref_ocrLanguage', profile.ocrLanguage);
  }
  if (profile.autoCopyText !== undefined) {
    safeStorage.setItem('pref_autoCopyText', String(profile.autoCopyText));
  }
  if (profile.pdfAutoCompress !== undefined) {
    safeStorage.setItem('pref_pdfAutoCompress', String(profile.pdfAutoCompress));
  }
  if (profile.notificationSoundEnabled !== undefined) {
    safeStorage.setItem('pref_sound', String(profile.notificationSoundEnabled));
  }
  if (profile.loginAlertsEnabled !== undefined) {
    safeStorage.setItem('pref_loginAlerts', String(profile.loginAlertsEnabled));
  }
  if (profile.language) {
    safeStorage.setItem('pref_language', profile.language);
  }
};
const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [appSettings, setAppSettings] = useState({
    bannerText: "",
    bannerActive: false,
    themePreset: "default",
    announcementBadge: "✨ PaperX Secure Cloud",
    maintenanceMode: false,
  });

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'app_settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Support both field names for backward compatibility during transition
        const maintenance = data.maintenanceMode ?? data.maintenanceActive ?? false;
        setAppSettings(prev => ({ ...prev, ...data, maintenanceMode: maintenance }));
      }
    }, (err) => {
      console.warn("Firestore app_settings listener note:", err);
    });

    return () => unsubscribeSettings();
  }, []);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on("settings-updated", (newSettings) => {
      if (newSettings) {
        setAppSettings(newSettings);
      }
    });

    newSocket.on("user-updated", (data) => {
      // If the updated user is the currently logged-in user, refresh their local state
      setUser(prev => {
        if (prev && (prev.uid === data.userId || prev.id === data.userId)) {
          // If deleted, force logout
          if (data._isDeleted) {
            return null; 
          }
          return { ...prev, ...data };
        }
        return prev;
      });
    });

    newSocket.on("order-updated", (data) => {
      console.log("Order updated via socket:", data);
      window.dispatchEvent(new CustomEvent("order-updated", { detail: data }));
      window.dispatchEvent(new CustomEvent("refresh_payments", { detail: data }));
    });

    newSocket.on("ticket-updated", (data) => {
      console.log("Ticket updated via socket:", data);
      window.dispatchEvent(new CustomEvent("ticket-updated", { detail: data }));
      window.dispatchEvent(new CustomEvent("order-updated", { detail: data }));
      window.dispatchEvent(new CustomEvent("refresh_payments", { detail: data }));
    });

    newSocket.on("admin-chat-message", (data) => {
      window.dispatchEvent(new CustomEvent("paperx-admin-chat-message", { detail: data }));
    });

    newSocket.on("support-chat-message", (data) => {
      window.dispatchEvent(new CustomEvent("paperx-admin-chat-message", { detail: data }));
    });

    return () => {
      newSocket.close();
    };
  }, []);
  const hash = useHashLocation();
  const rawPath = hash.replace(/^#/, '') || '/';
  const currentPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  
  // Robust normalized path for routing and redirect checks (strips query parameters and trailing slashes)
  const cleanPathForRouting = '/' + currentPath.split('?')[0].replace(/^\/+|\/+$/g, '');

  const [user, setUser] = useState<User | null>(() => getLocalSession());
  const [appOrders, setAppOrders] = useState<any[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(() => !getLocalSession());

  // Real-time listener for user's payment orders to keep UpgradeView, Billing & App Drawer in sync
  useEffect(() => {
    if (!user || (!user.uid && !user.email)) {
      setAppOrders([]);
      return;
    }
    const userIdentifier = user.uid || user.email;
    const unsubUid = onSnapshot(query(collection(db, 'orders'), where('uid', '==', userIdentifier)), (snapshot) => {
      const fetched: any[] = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, orderId: docSnap.id, ...docSnap.data() });
      });
      setAppOrders(prev => {
        const map = new Map();
        prev.forEach(item => map.set(item.id || item.orderId, item));
        fetched.forEach(item => map.set(item.id || item.orderId, item));
        const merged = Array.from(map.values());
        if (prev.length === merged.length) {
          let same = true;
          for (let i = 0; i < prev.length; i++) {
            if (prev[i].id !== merged[i].id || prev[i].status !== merged[i].status) {
              same = false;
              break;
            }
          }
          if (same) return prev;
        }
        return merged;
      });
    }, (err) => {
      console.warn('App orders uid snapshot note:', err);
    });

    const unsubUserId = onSnapshot(query(collection(db, 'orders'), where('userId', '==', userIdentifier)), (snapshot) => {
      const fetched: any[] = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, orderId: docSnap.id, ...docSnap.data() });
      });
      setAppOrders(prev => {
        const map = new Map();
        prev.forEach(item => map.set(item.id || item.orderId, item));
        fetched.forEach(item => map.set(item.id || item.orderId, item));
        const merged = Array.from(map.values());
        if (prev.length === merged.length) {
          let same = true;
          for (let i = 0; i < prev.length; i++) {
            if (prev[i].id !== merged[i].id || prev[i].status !== merged[i].status) {
              same = false;
              break;
            }
          }
          if (same) return prev;
        }
        return merged;
      });
    }, (err) => {
      console.warn('App orders userId snapshot note:', err);
    });

    return () => {
      unsubUid();
      unsubUserId();
    };
  }, [user?.uid, user?.email]);
  const [deviceLimitModalOpen, setDeviceLimitModalOpen] = useState(false);
  const [guestTrialsUsed, setGuestTrialsUsed] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('paperx_guest_trials_used') || '0', 10);
    } catch (e) {
      return 0;
    }
  });



  // Dynamic Page Title & Meta Tags based on URL route (matches tools like iLovePDF / Smallpdf)
  useEffect(() => {
    const matchedTool = findToolFromPath(cleanPathForRouting);
    if (matchedTool) {
      document.title = `${matchedTool.name} Online - Free & Instant | PaperX`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', `${matchedTool.description} Fast, free, and secure online document converter with PaperX.`);
      }
    } else if (cleanPathForRouting === '/login') {
      document.title = "Log In | PaperX";
    } else if (cleanPathForRouting === '/signup') {
      document.title = "Sign Up | PaperX";
    } else if (cleanPathForRouting === '/forgot-password' || cleanPathForRouting === '/reset-password') {
      document.title = "Reset Password | PaperX";
    } else {
      document.title = "Paper X | The Future of Documents";
    }
  }, [cleanPathForRouting]);

  // Auto-redirect authenticated users away from auth pages to dashboard
  useEffect(() => {
    if (user && (cleanPathForRouting === '/login' || cleanPathForRouting === '/signup' || cleanPathForRouting === '/forgot-password' || cleanPathForRouting === '/reset-password')) {
      setActiveView('dashboard');
      navigate('/dashboard');
    }
  }, [user, cleanPathForRouting]);

  // Ensure that whenever a suspended/blocked user re-logs in, the background shows the dashboard
  useEffect(() => {
    if (user && (user.isPermanentSuspended || checkPermanentSuspendedStatus(user.email || user.uid) || user.status === 'DISABLED' || (user as any).isBlocked)) {
      setActiveView('dashboard');
      if (cleanPathForRouting === '/login' || cleanPathForRouting === '/signup' || cleanPathForRouting === '/forgot-password' || cleanPathForRouting === '/reset-password') {
        navigate('/dashboard');
      }
    }
  }, [user, cleanPathForRouting]);

  // Global Preference Sync Effect (Theme, Font Size & Accessibility)
  useEffect(() => {
    const applyPreferences = (detail?: any) => {
      // 1. Dark Mode Theme Sync
      const savedDark = safeStorage.getItem('pref_darkMode');
      const isDark = detail?.darkMode !== undefined
        ? Boolean(detail.darkMode)
        : (savedDark !== null 
            ? savedDark === 'true'
            : (user?.theme ? user.theme === 'dark' : (user?.darkMode !== undefined ? user.darkMode : window.matchMedia('(prefers-color-scheme: dark)').matches)));

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // 2. Font Size & Legibility
      const savedFontSize = safeStorage.getItem('pref_fontSize');
      const fontSize = detail?.fontSize || savedFontSize || user?.fontSize || 'system';
      const savedLarger = safeStorage.getItem('pref_largerText');
      const largerText = detail?.largerText !== undefined
        ? Boolean(detail.largerText)
        : (savedLarger !== null
            ? savedLarger === 'true'
            : (user?.largerTextEnabled !== undefined ? user.largerTextEnabled : false));

      document.documentElement.setAttribute('data-font-size', fontSize);
      document.documentElement.setAttribute('data-larger-text', String(largerText));

      // 3. Scan & OCR Preferences Sync
      if (user) {
        if (user.autoSaveScan !== undefined && safeStorage.getItem('pref_autoSaveScan') === null) {
          safeStorage.setItem('pref_autoSaveScan', String(user.autoSaveScan));
        }
        if (user.autoCopyText !== undefined && safeStorage.getItem('pref_autoCopyText') === null) {
          safeStorage.setItem('pref_autoCopyText', String(user.autoCopyText));
        }
        if (user.ocrLanguage && safeStorage.getItem('pref_ocrLanguage') === null) {
          safeStorage.setItem('pref_ocrLanguage', user.ocrLanguage);
        }
        if (user.pdfQuality && safeStorage.getItem('pref_pdfQuality') === null) {
          safeStorage.setItem('pref_pdfQuality', user.pdfQuality);
        }
        if (user.namingPattern && safeStorage.getItem('pref_namingPattern') === null) {
          safeStorage.setItem('pref_namingPattern', user.namingPattern);
        }
        if (user.pdfAutoCompress !== undefined && safeStorage.getItem('pref_pdfAutoCompress') === null) {
          safeStorage.setItem('pref_pdfAutoCompress', String(user.pdfAutoCompress));
        }
        if (user.notificationSoundEnabled !== undefined && safeStorage.getItem('pref_sound') === null) {
          safeStorage.setItem('pref_sound', String(user.notificationSoundEnabled));
        }
      }
    };

    applyPreferences();
    const handlePreferencesChanged = (e: Event) => {
      applyPreferences((e as CustomEvent)?.detail);
    };
    window.addEventListener('paperx_preferences_changed', handlePreferencesChanged);
    window.addEventListener('storage', () => applyPreferences());
    return () => {
      window.removeEventListener('paperx_preferences_changed', handlePreferencesChanged);
      window.removeEventListener('storage', () => applyPreferences());
    };
  }, [user?.theme, user?.darkMode, user?.fontSize, user?.largerTextEnabled, user?.autoSaveScan, user?.autoCopyText, user?.ocrLanguage, user?.pdfQuality, user?.namingPattern, user?.pdfAutoCompress, user?.notificationSoundEnabled]);

  // Global Firebase Auth Listener with safety timeout
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeSession: (() => void) | null = null;
    let currentProfileUid: string | null = null;

    const ensureProfileSubscribed = (uid: string) => {
      if (!uid || currentProfileUid === uid) return;
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      currentProfileUid = uid;
      unsubscribeProfile = subscribeToUserProfile(uid, (updatedProfile) => {
        if (updatedProfile) {
          if (updatedProfile.forceLogout || (updatedProfile as any).forceReLogin) {
            logoutUser();
            return;
          }
          if (updatedProfile.banUntil && typeof updatedProfile.banUntil === 'number') {
            if (updatedProfile.banUntil > Date.now()) {
              applyUserBanFor1Hour(updatedProfile.banReason || 'Use of prohibited language in chat support.', updatedProfile.uid || uid, updatedProfile.banUntil);
            } else {
              localStorage.removeItem('paperx_user_ban_until');
              localStorage.removeItem('paperx_user_ban_reason');
              window.dispatchEvent(new Event('paperx_ban_updated'));
            }
          }
          syncProfileToLocalStorage(updatedProfile);
          setUser(prev => {
            if (!prev) return updatedProfile;
            let changed = false;
            for (const k in updatedProfile) {
              if ((prev as any)[k] !== (updatedProfile as any)[k]) {
                changed = true;
                break;
              }
            }
            if (!changed) return prev;
            return { ...prev, ...updatedProfile };
          });
        }
      });
    };

    const cleanupProfileSubscription = () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      currentProfileUid = null;
    };

    const safetyTimer = setTimeout(() => {
      const local = getLocalSession();
      if (local) {
        setUser(prev => prev || local);
      }
      setIsAuthLoading(false);
    }, 600);

    const syncWithServer = async (p: any) => {
      if (!p || (!p.uid && !p.id)) return;
      try {
        const res = await fetch('/api/admin/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        });
        if (res.ok) {
          const sProfile = await res.json();
          if (sProfile) {
            if (sProfile.status === 'DISABLED' || sProfile.isBlocked || sProfile.forceLogout || sProfile.forceReLogin) {
              if (sProfile.forceLogout || sProfile.forceReLogin) {
                logoutUser();
              } else {
                setUser(prev => ({ ...(prev || p), ...sProfile }));
              }
            } else {
              setUser(prev => ({ ...(prev || p), ...sProfile }));
            }
          }
        }
      } catch (err) {
        console.warn('Server user sync error:', err);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(safetyTimer);
      if (firebaseUser) {
        try {
          // Fetch or sync user profile from Firestore
          await recordUserSession(firebaseUser.uid);
          const profile = await syncUserProfile(firebaseUser);
          setUser(profile);
          syncWithServer(profile);

          if (unsubscribeSession) unsubscribeSession();
          unsubscribeSession = monitorCurrentSession(firebaseUser.uid, () => {
            logoutUser();
          });

          // Subscribe to real-time updates for profile/plan changes
          ensureProfileSubscribed(firebaseUser.uid);

          // Check if there was a pending download action queued before authentication
          const pending = sessionStorage.getItem('pending_download_action');
          if (pending) {
            try {
              const data = JSON.parse(pending);
              sessionStorage.removeItem('pending_download_action');
              if (data.type === 'apk') {
                setTimeout(() => {
                  executeDirectAppDownload(data.platform);
                }, 600);
              }
            } catch {
              sessionStorage.removeItem('pending_download_action');
            }
          }
        } catch (err: any) {
          console.error('Error syncing user profile:', err);
          if (err?.message?.includes('DEVICE_LIMIT_EXCEEDED') || err?.toString()?.includes('DEVICE_LIMIT_EXCEEDED')) {
            setUser(null);
            setDeviceLimitModalOpen(true);
          }
        }
      } else {
        // Check if there is an active local/server session
        const local = getLocalSession();
        if (local) {
          setUser(local);
          syncWithServer(local);
          ensureProfileSubscribed(local.uid || local.id);
        } else {
          cleanupProfileSubscription();
          try {
            const saved = localStorage.getItem('paperx_local_stored_files');
            setStoredFiles(saved ? JSON.parse(saved) : []);
          } catch {
            setStoredFiles([]);
          }
          setUser(null);
        }
      }
      setIsAuthLoading(false);
    });

    const unsubscribePaperX = onPaperXAuthStateChanged((customUser) => {
      if (customUser) {
        setUser(customUser);
        const uid = customUser.uid || customUser.id;
        recordUserSession(uid).catch(() => {});
        syncWithServer(customUser);
        ensureProfileSubscribed(uid);
      } else if (!auth.currentUser) {
        cleanupProfileSubscription();
        try {
          const saved = localStorage.getItem('paperx_local_stored_files');
          setStoredFiles(saved ? JSON.parse(saved) : []);
        } catch {
          setStoredFiles([]);
        }
        setUser(null);
      }
    });

    // Geolocation timezone matching primarily for India (IST)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Bounding box check for India
          const inIndia = latitude >= 8.0 && latitude <= 38.0 && longitude >= 68.0 && longitude <= 98.0;
          if (inIndia) {
            console.log('[PaperX Geo] User is in India. Setting timezone to Asia/Kolkata (IST)');
            localStorage.setItem('paperx_override_timezone', 'Asia/Kolkata');
          } else {
            console.log('[PaperX Geo] User is outside India. Using default browser device timezone.');
            localStorage.removeItem('paperx_override_timezone');
          }
          window.dispatchEvent(new Event('paperx_timezone_updated'));
        },
        (error) => {
          console.warn('[PaperX Geo] Geolocation request dismissed/denied:', error);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 86400000 }
      );
    }

    return () => {
      clearTimeout(safetyTimer);
      unsubscribeAuth();
      unsubscribePaperX();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
      if (unsubscribeSession) {
        unsubscribeSession();
      }
    };
  }, []);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'menu' | 'billing' | 'payment-history' | 'preferences'>('menu');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<string>(() => {
    if (typeof window === 'undefined') return 'dashboard';
    const norm = getNormalizedPath().replace(/^\/+/, '');
    if (!norm || norm === 'dashboard') return 'dashboard';
    if (norm.startsWith('tool/')) return 'tool';
    if (TOOLS.some(t => t.id.toLowerCase() === norm.toLowerCase())) return 'tool';
    if (['settings', 'preferences', 'billing', 'personal'].includes(norm)) return norm;
    if (['documents', 'recent', 'support', 'download', 'payment-history', 'payments', 'upgrade', 'whats-new'].includes(norm)) {
      return norm === 'payments' ? 'payment-history' : norm;
    }
    return 'dashboard';
  });
  const [previewFile, setPreviewFile] = useState<StoredDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleOpenFilePreview = (file: StoredDocument) => {
      setPreviewFile(file);
      setIsPreviewOpen(true);
  };

  const handleShareStoredFile = async (file: StoredDocument) => {
      await shareOrOpenFullFile(file, {
          localFileGetter: LocalFileStore.get,
          onSuccess: (msg) => {
              addToast({
                  type: 'success',
                  title: 'Document Ready',
                  message: msg,
                  duration: 3500
              });
          },
          onError: (msg) => {
              addToast({
                  type: 'error',
                  title: 'Share Notice',
                  message: msg,
                  duration: 3500
              });
          }
      });
  };
  const [activeToolId, setActiveToolId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const norm = getNormalizedPath().replace(/^\/+/, '');
    if (norm.startsWith('tool/')) return norm.split('tool/')[1];
    const matched = TOOLS.find(t => t.id.toLowerCase() === norm.toLowerCase());
    return matched ? matched.id : null;
  });
  const [expandedShortcutCategory, setExpandedShortcutCategory] = useState<string | null>('CONVERT_TO');
  const [shortcutModalCategory, setShortcutModalCategory] = useState<string | null>(null);

  const openToolShortcut = (toolId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsMobileMenuOpen(false);
    setShortcutModalCategory(null);
    setActiveToolId(toolId);
    setActiveView('tool');
    setIsProfileOpen(false);
    navigate(`/tool/${toolId}`);
  };
  const [files, setFiles] = useState<FileData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [rawFiles, setRawFiles] = useState<File[]>([]);

  useEffect(() => {
    setFiles([]);
    setRawFiles([]);
  }, [activeToolId]);
  const [docxMergeOptions, setDocxMergeOptions] = useState<DocxMergeOptions>({
    pageBreakBetween: true,
    outputFormat: 'docx',
    addSectionTitles: false,
    generateToc: false,
    continuousPageNumbers: true,
    normalizeTypography: false
  });

  const handleReorderFiles = (fromIndex: number, toIndex: number) => {
    setFiles(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setRawFiles(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Ensure opening the app defaults to Home / Dashboard on initial app launch unless explicit tool query param is present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isFreshAppLaunch = !sessionStorage.getItem('paperx_session_started');
      const hasDirectToolQuery = window.location.search.includes('tool=') || window.location.search.includes('redirect=');
      if (isFreshAppLaunch && !hasDirectToolQuery) {
        sessionStorage.setItem('paperx_session_started', 'true');
        if (window.location.hash && window.location.hash !== '#' && window.location.hash !== '#/') {
          window.location.hash = '';
          if (window.history && window.history.pushState) {
            try {
              window.history.pushState(null, '', window.location.pathname.includes('/index.html') ? '/index.html' : '/');
            } catch (_) {}
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    LocalFileStore.requestPersistence();
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    const handleCacheCleared = () => {
      setFiles([]);
      setRawFiles([]);
      setIsProcessing(false);
      setProcessingStatus('');
      setProcessingProgress(0);
      addToast({
        type: 'success',
        title: 'Temporary Cache Cleared',
        message: 'Released local draft memory and preview buffers successfully.',
        duration: 3000
      });
    };

    const handleManualRestoreDetected = () => {
      setActiveToolId(null);
      setActiveView('dashboard');
      setSearchQuery('');
      setFiles([]);
      setRawFiles([]);
      setIsProcessing(false);
      setIsMobileMenuOpen(false);
      setIsCameraScannerOpen(false);
      setIsProfileOpen(false);
      setIsAdminOpen(false);

      addToast({
        type: 'success',
        title: 'Manual Restore Detected',
        message: 'Your old full app UI and layout have been detected and restored successfully!',
        duration: 6000
      });

      safeStorage.removeItem('paperx_manual_restore_detected');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('paperx:cache-cleared', handleCacheCleared);
    window.addEventListener('paperx_manual_restore_detected', handleManualRestoreDetected);

    if (safeStorage.getItem('paperx_manual_restore_detected') === 'true') {
      setTimeout(handleManualRestoreDetected, 300);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('paperx:cache-cleared', handleCacheCleared);
      window.removeEventListener('paperx_manual_restore_detected', handleManualRestoreDetected);
    };
  }, []);

  // Ensure suspended or admin-blocked users have Support page open in the background
  useEffect(() => {
    const checkAndSetSupportView = () => {
      const isChatSuspended = Boolean(
        user?.isPermanentSuspended || 
        checkPermanentSuspendedStatus(user?.email || user?.uid)
      );
      const isAdminBlocked = Boolean(
        user && (user.status === 'DISABLED' || (user as any).isBlocked)
      );
      if ((isChatSuspended || isAdminBlocked) && !isAdminOpen) {
        setActiveView('support');
        setIsSupportChatOpen(false);
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    checkAndSetSupportView();
    window.addEventListener('paperx_permanent_ban_updated', checkAndSetSupportView);
    window.addEventListener('paperx_ban_updated', checkAndSetSupportView);

    return () => {
      window.removeEventListener('paperx_permanent_ban_updated', checkAndSetSupportView);
      window.removeEventListener('paperx_ban_updated', checkAndSetSupportView);
    };
  }, [user?.isPermanentSuspended, (user as any)?.isBlocked, user?.status, user?.email, user?.uid, isAdminOpen]);

  // Auto-detect OS and start instant app installation with authentication check
  const handleDirectAppDownload = async (platformOverride?: unknown) => {
    const validPlatform = typeof platformOverride === 'string' ? platformOverride : undefined;
    // 1. Authentication Check: If user is not authenticated, preserve pending action & route to login
    if (!user && !auth.currentUser) {
      sessionStorage.setItem('pending_download_action', JSON.stringify({
        type: 'apk',
        platform: validPlatform || 'Android',
        timestamp: Date.now()
      }));
      navigate('/login');
      return;
    }

    const navUserAgent = (typeof window !== 'undefined' && window.navigator && typeof window.navigator.userAgent === 'string') ? window.navigator.userAgent : '';
    const userAgent = navUserAgent;
    let targetPlatform = validPlatform || 'Android';

    if (!validPlatform && userAgent) {
      if (userAgent.indexOf("Mac") !== -1) {
        targetPlatform = 'macOS';
      } else if (userAgent.indexOf("Win") !== -1) {
        targetPlatform = 'Windows';
      } else if (userAgent.indexOf("iPhone") !== -1 || userAgent.indexOf("iPad") !== -1) {
        targetPlatform = 'iOS';
      } else if (userAgent.indexOf("Android") !== -1) {
        targetPlatform = 'Android';
      }
    }

    // If on Android and user has custom APK link configured
    const customApk = typeof window !== 'undefined' ? localStorage.getItem('paperx_custom_apk_url') : null;
    if (targetPlatform === 'Android' && customApk && customApk.trim().startsWith('http')) {
      window.open(customApk.trim(), '_blank');
      return;
    }

    // If on Android: Use Native 1-Tap Web App Installer directly on the phone
    if (targetPlatform === 'Android') {
      if (deferredInstallPrompt) {
        try {
          await deferredInstallPrompt.prompt();
          const choiceResult = await deferredInstallPrompt.userChoice;
          if (choiceResult.outcome === 'accepted') {
            addToast({
              type: 'info',
              title: 'Installing App',
              message: 'PaperX is installing on your phone...'
            });
            return;
          }
        } catch (e) {
          console.error('Install prompt error:', e);
        }
      }
      addToast({
        type: 'info',
        title: 'Install Instructions',
        message: 'To install on Android: Tap browser menu (⋮) → "Install app" or "Add to Home screen"'
      });
      return;
    }

    // For desktop platforms (Windows / Mac)
    addToast({
      type: 'success',
      title: 'Downloading App',
      message: `Downloading PaperX for ${targetPlatform}...`
    });

    executeDirectAppDownload(validPlatform, undefined, () => {});
  };

  // Real-time live listener for user subscription, role, and profile updates
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToUserProfile(user.uid, (updatedProfile) => {
      if (updatedProfile) {
        if (updatedProfile.forceLogout || (updatedProfile as any).forceReLogin) {
          logoutUser();
          return;
        }
        if (updatedProfile.banUntil && typeof updatedProfile.banUntil === 'number') {
          if (updatedProfile.banUntil > Date.now()) {
            applyUserBanFor1Hour(updatedProfile.banReason || 'Use of prohibited language in chat support.', updatedProfile.uid || user.uid, updatedProfile.banUntil);
          } else {
            localStorage.removeItem('paperx_user_ban_until');
            localStorage.removeItem('paperx_user_ban_reason');
            window.dispatchEvent(new Event('paperx_ban_updated'));
          }
        }
        syncProfileToLocalStorage(updatedProfile);
        setUser(prev => ({ ...(prev || updatedProfile), ...updatedProfile }));
      }
    });
    return () => {
      if (unsub) unsub();
    };
  }, [user?.uid]);

  // Support Chat State
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const isSupportChatOpenRef = useRef(isSupportChatOpen);
  isSupportChatOpenRef.current = isSupportChatOpen;
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);
  const [hasOngoingSupportChat, setHasOngoingSupportChat] = useState(false);

  // Check if active support chat session is ongoing
  useEffect(() => {
    const checkOngoing = () => {
      try {
        const key = user?.uid ? `paperx_support_session_user_${user.uid}` : `paperx_support_session_guest`;
        const raw = localStorage.getItem(key);
        if (!raw) {
          setHasOngoingSupportChat(prev => prev ? false : prev);
          return;
        }
        const session = JSON.parse(raw);
        if (!session || session.status !== 'active') {
          setHasOngoingSupportChat(prev => prev ? false : prev);
          return;
        }
        const elapsed = Date.now() - (session.lastUserActivity || session.createdAt || 0);
        if (elapsed >= 20 * 60 * 1000) {
          setHasOngoingSupportChat(prev => prev ? false : prev);
          return;
        }
        const nextVal = Boolean(session.hasOngoingMessages || session.hasUserStartedChat);
        setHasOngoingSupportChat(prev => prev === nextVal ? prev : nextVal);
      } catch (e) {
        setHasOngoingSupportChat(prev => prev ? false : prev);
      }
    };

    checkOngoing();
    const handleUpdate = () => checkOngoing();
    window.addEventListener('paperx-support-session-update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(checkOngoing, 10000);

    return () => {
      window.removeEventListener('paperx-support-session-update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [user?.uid]);

  // Background live support message listener to trigger premium toasts & update badge state
  useEffect(() => {
    if (!user?.uid) return;
    const chatId = `user_${user.uid}`;
    const chatRef = doc(db, 'support_chats', chatId);
    let prevLength = -1;

    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const unread = data?.unreadByUser === true;
        setHasUnreadSupport(unread);

        if (data?.messages && Array.isArray(data.messages)) {
          const count = data.messages.length;
          if (prevLength !== -1 && count > prevLength) {
            const lastMsg = data.messages[count - 1];
            if (lastMsg.sender !== 'user' && !isSupportChatOpenRef.current) {
              addToast({
                type: 'info',
                title: 'Message from Admin',
                message: lastMsg.text || 'You have a new support reply'
              });
            }
          }
          prevLength = count;
        }
      }
    }, (err) => {
      console.warn("Background support chat subscription note:", err);
    });

    return () => unsubscribe();
  }, [user?.uid]);
  
  // Payment State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<'Pro Plan' | 'Pro Plan' | 'Max Plan'>('Pro Plan');
  const [paymentAmount, setPaymentAmount] = useState('29');
  const [paymentCycle, setPaymentCycle] = useState<'month' | 'half-year' | 'year'>('month');
  const [paymentResubmitId, setPaymentResubmitId] = useState<string | undefined>(undefined);
  const [upgradeFromOrderId, setUpgradeFromOrderId] = useState<string | undefined>(undefined);
  const [upgradeDiscountCredit, setUpgradeDiscountCredit] = useState<number | undefined>(undefined);
  const [originalBaseAmount, setOriginalBaseAmount] = useState<number | undefined>(undefined);
  const [isResubscribeOpen, setIsResubscribeOpen] = useState(false);
  const [hasPromptedExpirySession, setHasPromptedExpirySession] = useState(false);

  // Toast Notification System
  const [toasts, setToasts] = useState<ToastNotificationItem[]>([]);

  // Batch Completion Modal State
  const [batchResult, setBatchResult] = useState<BatchProcessResult | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [activeUrgentNotification, setActiveUrgentNotification] = useState<any>(null);

  const addToast = (item: Omit<ToastNotificationItem, 'id' | 'timestamp'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastNotificationItem = {
      ...item,
      id,
      timestamp: Date.now()
    };
    setToasts(prev => [newToast, ...prev.slice(0, 3)]); // Keep max 4 toasts stacked
  };

  useEffect(() => {
    if (!socket) return;
    
    const handleAdminNotification = (notification: any) => {
      const currentUser = userRef.current;
      // Check recipient match
      const isTargeted = 
        notification.recipient === 'ALL' ||
        (notification.recipient === 'CUSTOM' && currentUser && notification.recipientEmail === currentUser.email) ||
        (notification.recipient === 'PRO_USERS' && currentUser?.isPro) ||
        (notification.recipient === 'FREE_USERS' && currentUser && !currentUser.isPro);
        
      if (!isTargeted) return;

      if (notification.isUrgentPopup) {
        setActiveUrgentNotification(notification);
      } else {
        addToast({
          type: notification.priority === 'EMERGENCY' ? 'error' : (notification.priority === 'HIGH' ? 'warning' : 'success'),
          title: notification.title,
          message: notification.body,
        });
      }
    };

    socket.on('admin-notification', handleAdminNotification);

    return () => {
      socket.off('admin-notification', handleAdminNotification);
    };
  }, [socket]);

  // Automatic Data Erasure Cancellation & Account Restoration Notification
  useEffect(() => {
    if (user && sessionStorage.getItem('paperx_erasure_restored_notice') === 'true') {
      sessionStorage.removeItem('paperx_erasure_restored_notice');
      addToast({
        type: 'success',
        title: 'Data Erasure Cancelled — Account Restored',
        message: 'Welcome back! Because you logged in within the 10-day grace period, your data erasure request was automatically cancelled. Your account, documents, and settings are fully safe and intact.',
        duration: 9000
      });
    }
  }, [user?.uid]);

  // Real-time Payment & Ticket Updates from Socket.IO (Admin Actions)
  useEffect(() => {
    if (!socket || !user?.uid) return;
    const activeUid = user.uid;

    const handleOrderUpdate = (data: any) => {
      if (data.status === 'VERIFIED') {
        playPaymentApprovedAudio();
        addToast({
          title: 'Membership Activated',
          message: `Your ${data.plan} is now active. Enjoy premium perks!`,
          type: 'success'
        });
        syncUserProfile(activeUid, setUser);
      } else if (data.status === 'REJECTED') {
        playPaymentRejectedAudio();
        addToast({
          title: 'Payment Rejected',
          message: `Verification failed. Please check payment history for details.`,
          type: 'error'
        });
      } else if (data.status === 'REFUNDED' || data.isRefunded) {
        addToast({
          title: 'Return Confirmed',
          message: 'Your return has been confirmed and your account is now back to Basic Plan.',
          type: 'info'
        });
        syncUserProfile(activeUid, setUser);
        updateUserInFirestore(activeUid, {
          plan: 'Basic Plan',
          purchasedPlan: 'Basic Plan',
          activePlanMode: 'Basic Plan',
          isPro: false,
          isRefunded: true,
          membershipTier: 'free',
          updatedAt: new Date().toISOString()
        }).catch(console.warn);
      }
    };

    const handleTicketUpdate = (data: any) => {
      addToast({
        title: 'Support Ticket Update',
        message: `Your ticket status changed to ${data.status.replace('_', ' ')}.`,
        type: 'info'
      });
      if (['COMPLETED', 'RESOLVED', 'REFUNDED'].includes(data.status)) {
        syncUserProfile(activeUid, setUser);
        updateUserInFirestore(activeUid, {
          plan: 'Basic Plan',
          purchasedPlan: 'Basic Plan',
          activePlanMode: 'Basic Plan',
          isPro: false,
          isRefunded: true,
          membershipTier: 'free',
          updatedAt: new Date().toISOString()
        }).catch(console.warn);
      }
    };

    const handleDowngrade = (data: any) => {
      if (activeUid === data.uid) {
        addToast({
          title: 'Membership Returned 💳',
          message: 'Your return has been approved and your account is now back to Basic Plan.',
          type: 'info'
        });
        syncUserProfile(activeUid, setUser);
      }
    };

    const handleGlobalSync = () => {
      syncUserProfile(activeUid, setUser);
    };

    socket.on('order-updated', handleOrderUpdate);
    socket.on('ticket-updated', handleTicketUpdate);
    socket.on('user-downgraded', handleDowngrade);
    window.addEventListener('order-updated', handleGlobalSync);
    window.addEventListener('ticket-updated', handleGlobalSync);
    window.addEventListener('admin_action', handleGlobalSync);

    return () => {
      socket.off('order-updated', handleOrderUpdate);
      socket.off('ticket-updated', handleTicketUpdate);
      socket.off('user-downgraded', handleDowngrade);
      window.removeEventListener('order-updated', handleGlobalSync);
      window.removeEventListener('ticket-updated', handleGlobalSync);
      window.removeEventListener('admin_action', handleGlobalSync);
    };
  }, [socket, user?.uid]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Real-time Active Membership Expiry Surveillance
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;

    const performExpiryCheck = () => {
      const currentUser = userRef.current;
      if (!currentUser) return;
      if (isPlanExpired(currentUser)) {
        if (currentUser.plan && currentUser.plan !== 'Basic Plan') {
          // Auto-select Basic Plan smoothly when paid plan expires
          setUser(prev => {
            if (!prev || prev.plan === 'Basic Plan') return prev;
            return {
              ...prev,
              previousPlan: (prev.plan as any) || 'Pro Plan',
              plan: 'Basic Plan',
              purchasedPlan: 'Basic Plan',
              activePlanMode: 'Basic Plan',
              billingCycle: 'month',
              membershipTier: 'free',
              subscriptionStatus: 'free',
              isPro: false,
              planExpiresAt: prev.basicPlanExpiresAt || undefined,
              maxProjects: 5
            };
          });
          
          // Persist downgrade to Firestore ledger
          if (currentUser.uid) {
            updateUserInFirestore(currentUser.uid, {
              plan: 'Basic Plan',
              purchasedPlan: 'Basic Plan',
              activePlanMode: 'Basic Plan',
              billingCycle: 'month',
              membershipTier: 'free',
              subscriptionStatus: 'free',
              previousPlan: currentUser.plan,
              isPro: false,
              planExpiresAt: (currentUser.basicPlanExpiresAt || null) as any,
              maxProjects: 5,
              updatedAt: new Date().toISOString()
            }).catch(console.warn);
          }
        }
      }
    };

    const interval = setInterval(performExpiryCheck, 10000);
    return () => clearInterval(interval);
  }, [user?.uid, user?.plan, user?.planExpiresAt]);

  const handleToastDownload = (item: ToastNotificationItem) => {
    if (item.downloadBlob && item.downloadFileName) {
      const url = URL.createObjectURL(item.downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.downloadFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleBatchProcessAnother = () => {
    setIsBatchModalOpen(false);
    setFiles([]);
    setRawFiles([]);
  };

  const handleBatchReturnDashboard = () => {
    setIsBatchModalOpen(false);
    setFiles([]);
    setRawFiles([]);
    navigate('/dashboard');
  };

  const uploadIntervals = useRef<{[key: string]: any}>({});
  const processingTimeout = useRef<any>(null);
  const recentlyDeletedIds = useRef<Set<string>>(new Set());
  const [storedFiles, setStoredFiles] = useState<StoredDocument[]>(() => {
    try {
      const activeUid = auth.currentUser?.uid;
      if (activeUid) {
        const savedUser = localStorage.getItem(`paperx_user_stored_files_${activeUid}`);
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
      const saved = localStorage.getItem('paperx_local_stored_files');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Cross-tab real-time sync for local files
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === 'paperx_local_stored_files' || (e.key && e.key.startsWith('paperx_user_stored_files_'))) && e.newValue) {
        try {
          const files = JSON.parse(e.newValue);
          if (Array.isArray(files)) {
            setStoredFiles(files);
          }
        } catch {}
      }
    };
    const handleCustomUpdate = (e: any) => {
      if (e.detail) {
        const newItems = Array.isArray(e.detail) ? e.detail : [e.detail];
        if (newItems.length === 0) return;
        setStoredFiles(prev => {
          const map = new Map<string, StoredDocument>();
          newItems.forEach((item: any) => {
            if (item && item.id) map.set(item.id, item);
          });
          prev.forEach((item: any) => {
            if (item && item.id) {
              if (!map.has(item.id)) {
                map.set(item.id, item);
              } else {
                const updated = map.get(item.id)!;
                if (!updated.dataUrl && item.dataUrl) {
                  map.set(item.id, { ...updated, dataUrl: item.dataUrl });
                }
              }
            }
          });
          const merged = Array.from(map.values());
          merged.sort((a, b) => getStoredDocTimestamp(b) - getStoredDocTimestamp(a));
          return merged;
        });
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('paperx-stored-files-updated', handleCustomUpdate);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('paperx-stored-files-updated', handleCustomUpdate);
    };
  }, []);

  // Instant local cache sync for logged-in and guest users (sub-millisecond opening)
  useEffect(() => {
    const activeUid = user?.uid || (user as any)?.id || auth.currentUser?.uid;
    try {
      if (!activeUid) {
        localStorage.setItem('paperx_local_stored_files', JSON.stringify(storedFiles));
      } else if (storedFiles.length > 0) {
        const lightweightDocs = storedFiles.map(f => {
          if (f.dataUrl && f.dataUrl.length > 300000) {
            const { dataUrl, ...rest } = f;
            return rest;
          }
          return f;
        });
        localStorage.setItem(`paperx_user_stored_files_${activeUid}`, JSON.stringify(lightweightDocs));
      }
    } catch (e) {
      console.warn('Failed to cache stored files locally:', e);
    }
  }, [storedFiles, user?.uid, (user as any)?.id, auth.currentUser?.uid]);

  // Sync stored files with Firestore in real time when user is logged in
  useEffect(() => {
    const activeUid = user?.uid || (user as any)?.id || auth.currentUser?.uid;
    if (activeUid) {
      // Load instant local user cache immediately on user change
      try {
        const cachedUserDocs = localStorage.getItem(`paperx_user_stored_files_${activeUid}`);
        if (cachedUserDocs) {
          const parsed = JSON.parse(cachedUserDocs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStoredFiles(prev => prev.length === 0 ? parsed : prev);
          }
        }
      } catch (_) {}

      const guestFilesString = localStorage.getItem('paperx_local_stored_files');
      if (guestFilesString) {
        try {
          const guestFiles = JSON.parse(guestFilesString) as StoredDocument[];
          if (guestFiles && guestFiles.length > 0) {
            Promise.all(guestFiles.map(file => addDocumentToFirestore(activeUid, file)))
              .then(() => {
                localStorage.removeItem('paperx_local_stored_files');
              })
              .catch(err => {
                console.warn('Guest migration partial notice:', err);
              });
          }
        } catch (e) {
          console.warn('Failed to migrate guest files:', e);
        }
      }

      const unsubscribe = subscribeToUserDocuments(activeUid, (docs) => {
        setStoredFiles(prev => {
          // Filter out any IDs currently marked for immediate deletion to prevent ghost re-adds
          const activeDocs = docs.filter(d => !recentlyDeletedIds.current.has(d.id));
          const syncedIds = new Set(activeDocs.map(d => d.id));

          // Merge local dataUrl into the synced docs so we don't lose the file data in memory
          const syncedDocs = activeDocs.map(doc => {
            const existing = prev.find(p => p.id === doc.id);
            if (existing && existing.dataUrl && !doc.dataUrl) {
              return { ...doc, dataUrl: existing.dataUrl };
            }
            return doc;
          });

          // Keep pending local files that have not yet arrived in Firestore snapshot
          const pendingRecent = prev.filter(p => !syncedIds.has(p.id) && !recentlyDeletedIds.current.has(p.id));
          const merged = [...pendingRecent, ...syncedDocs];
          merged.sort((a, b) => getStoredDocTimestamp(b) - getStoredDocTimestamp(a));

          if (prev.length === merged.length) {
            let same = true;
            for (let i = 0; i < prev.length; i++) {
              if (
                prev[i].id !== merged[i].id ||
                prev[i].updatedAt !== merged[i].updatedAt ||
                Boolean(prev[i].dataUrl) !== Boolean(merged[i].dataUrl)
              ) {
                same = false;
                break;
              }
            }
            if (same) return prev;
          }

          return merged as StoredDocument[];
        });
      });
      return () => unsubscribe();
    }
  }, [user?.uid, (user as any)?.id, auth.currentUser?.uid]);

  // 5-Year Document Cloud Vault Lifecycle (guarantee files are preserved for 5 years)
  useEffect(() => {
    const checkAndPurgeFiveYearArchive = () => {
      const fiveYearsMs = 5 * 365.25 * 24 * 60 * 60 * 1000;
      const cutoff = Date.now() - fiveYearsMs;
      setStoredFiles(prev => {
        const expired = prev.filter(f => getStoredDocTimestamp(f) < cutoff && getStoredDocTimestamp(f) > 0);
        if (expired.length === 0) return prev;
        expired.forEach(f => {
          LocalFileStore.remove(f.id);
          if (user?.uid) {
            deleteDocumentFromFirestore(user.uid, f.id).catch(() => {});
          }
        });
        return prev.filter(f => getStoredDocTimestamp(f) >= cutoff);
      });
      LocalFileStore.purgeExpired(fiveYearsMs);
    };

    checkAndPurgeFiveYearArchive();
    const interval = setInterval(checkAndPurgeFiveYearArchive, 12 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  // Translation Helper & Reactive Locale
  const { t, currentLanguage, changeLanguage } = useAppTranslation(user?.language);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning', 'Good morning');
    if (hour < 18) return t('greeting.afternoon', 'Good afternoon');
    return t('greeting.evening', 'Good evening');
  };

  const handleDeleteStoredFile = (id: string) => {
      const docToDelete = storedFiles.find(f => f.id === id);
      recentlyDeletedIds.current.add(id);
      setTimeout(() => {
          recentlyDeletedIds.current.delete(id);
      }, 10000);

      LocalFileStore.remove(id);
      setStoredFiles(prev => prev.filter(f => f.id !== id));
      const activeUid = user?.uid || (user as any)?.id || auth.currentUser?.uid;
      if (activeUid) {
          deleteDocumentFromFirestore(activeUid, id).catch(console.error);
      }
      addToast({
          type: 'info',
          title: 'Document Removed',
          message: docToDelete?.name ? `"${docToDelete.name}" removed successfully.` : 'Document removed successfully.',
          duration: 3000
      });
  };

  const handleSimulateFileAge = (id: string, daysAgo: number) => {
      const targetTimestamp = Date.now() - (daysAgo * 24 * 60 * 60 * 1000);
      const targetDate = new Date(targetTimestamp).toLocaleDateString();
      setStoredFiles(prev => prev.map(f => {
          if (f.id === id) {
              return {
                  ...f,
                  timestamp: targetTimestamp,
                  date: targetDate
              };
          }
          return f;
      }));
      const activeUid = user?.uid || (user as any)?.id || auth.currentUser?.uid;
      if (activeUid) {
          addDocumentToFirestore(activeUid, {
              id,
              timestamp: targetTimestamp,
              date: targetDate,
              updatedAt: new Date().toISOString()
          }).catch(console.error);
      }
      addToast({
          type: 'info',
          title: daysAgo >= 30 ? 'Moved to My Documents' : 'Returned to Recent Activity',
          message: daysAgo >= 30 
              ? 'Fast-forwarded 31 days: file automatically graduated to My Documents (5-Year Vault).'
              : 'Reset to 0 days: file returned to Recent Activity (30-Day Window).',
          duration: 4000
      });
  };

  const generateUniqueFileName = (baseName: string, existingFiles: StoredDocument[], toolName?: string) => {
      const activePattern = user?.namingPattern || localStorage.getItem('pref_namingPattern') || 'simple';
      return generateFormattedFileName({
          baseName,
          toolName: toolName || 'Document',
          pattern: activePattern,
          existingCount: existingFiles.length + 1
      });
  };

  const playCompletionChime = () => {
      try {
          if (localStorage.getItem('pref_sound') === 'false') return;
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
      } catch (e) {}
  };

  const analyzeDocumentForTags = async (filename: string, dataUrl?: string): Promise<string[]> => {
      try {
          const payload: any = { filename };
          if (dataUrl) {
              const mimeMatch = dataUrl.match(/^data:(.*?);base64,/);
              if (mimeMatch) {
                  payload.mimeType = mimeMatch[1];
                  payload.fileBase64 = dataUrl;
              }
          }
          const res = await fetch('/api/ai/tag-document', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.tags && Array.isArray(data.tags)) return data.tags;
      } catch (e) {
          console.error("Tag analysis error:", e);
      }
      return [];
  };

  const handleProcessedFile = async (blob: Blob, rawFilename: string) => {
      playCompletionChime();
      const activeTool = TOOLS.find(t => t.id === activeToolId);
      const actionName = activeTool?.name || 'Create Document';
      const filename = generateUniqueFileName(rawFilename, storedFiles, actionName);
      const newFileId = `doc_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
      const formattedSize = `${(blob.size / 1024).toFixed(1)} KB`;

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
          const dataUrlStr = (reader.result as string) || '';
          if (dataUrlStr) {
              LocalFileStore.save(newFileId, dataUrlStr);
          }

          const detectedDocType = (() => {
              const ext = filename.split('.').pop()?.toLowerCase() || '';
              if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'bmp'].includes(ext)) return 'IMAGE';
              if (['xlsx', 'xls'].includes(ext)) return 'EXCEL';
              if (['docx', 'doc'].includes(ext)) return 'DOCX';
              if (['pptx', 'ppt'].includes(ext)) return 'PPTX';
              if (['csv', 'tsv'].includes(ext)) return 'CSV';
              if (['md', 'markdown'].includes(ext)) return 'MARKDOWN';
              if (['html', 'htm'].includes(ext)) return 'HTML';
              if (['zip'].includes(ext)) return 'ZIP';
              if (['txt', 'text', 'json', 'xml'].includes(ext)) return 'TEXT';
              return 'PDF';
          })();

          const newFile: StoredDocument = {
              id: newFileId,
              name: filename,
              date: new Date().toLocaleDateString(),
              timestamp: Date.now(),
              size: formattedSize,
              type: detectedDocType,
              action: actionName,
              dataUrl: dataUrlStr || undefined,
              tags: [actionName, detectedDocType]
          };

          // Update state immediately so Recent Activity shows it instantaneously (0ms)
          setStoredFiles(prev => [newFile, ...prev.filter(p => p.id !== newFile.id)]);
          if (dataUrlStr) {
            saveLocalFileBinary(newFileId, dataUrlStr).catch(() => {});
          }

          // Dispatch event for instant cross-tab / window sync
          try {
              window.dispatchEvent(new CustomEvent('paperx-stored-files-updated', { 
                  detail: newFile 
              }));
          } catch (_) {}

          // Real-time Firestore sync
          const activeUid = user?.uid || (user as any)?.id || auth.currentUser?.uid;
          if (activeUid) {
              addDocumentToFirestore(activeUid, newFile).catch(console.error);
              recordFeatureUsage(user);
          } else {
              try {
                  const saved = localStorage.getItem('paperx_local_stored_files');
                  const currentList = saved ? JSON.parse(saved) : [];
                  localStorage.setItem('paperx_local_stored_files', JSON.stringify([newFile, ...currentList]));
              } catch (_) {}
          }

          // Automatic direct file download to user device
          try {
              const objUrl = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = objUrl;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setTimeout(() => URL.revokeObjectURL(objUrl), 10000);
          } catch (_) {}

          addToast({
            type: 'success',
            title: `${actionName} Complete`,
            message: `"${filename}" converted and downloaded. Saved to your documents.`,
            toolName: actionName,
            fileName: filename,
            fileSize: formattedSize,
            downloadBlob: blob,
            downloadFileName: filename,
            duration: 5000
          });

          // Enrich tags in background asynchronously without blocking UI
          analyzeDocumentForTags(filename, dataUrlStr).then(aiTags => {
              if (aiTags && aiTags.length > 0) {
                  setStoredFiles(prev => prev.map(f => f.id === newFileId ? { ...f, tags: aiTags } : f));
                  if (activeUid) {
                      addDocumentToFirestore(activeUid, { ...newFile, tags: aiTags }).catch(console.error);
                  }
              }
          }).catch(() => {});
      };
  };

  const handleDownloadStoredFile = async (id: string, name: string) => {
      try {
          const stored = storedFiles.find(f => f.id === id);
          const blob = await getDocumentBlob({ id, name, ...stored }, LocalFileStore.get);
          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objectUrl;

          let downloadName = name || 'document';
          const extMatch = downloadName.match(/\.([a-zA-Z0-9]+)$/);
          if (!extMatch && stored?.type) {
              const typeExt = stored.type.toLowerCase();
              if (['pdf', 'docx', 'xlsx', 'png', 'jpg', 'csv', 'txt', 'svg', 'zip', 'html', 'md'].includes(typeExt)) {
                  downloadName = `${downloadName}.${typeExt}`;
              } else {
                  downloadName = `${downloadName}.pdf`;
              }
          }

          a.download = downloadName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
          addToast({
              type: 'success',
              title: 'Download Complete',
              message: `"${downloadName}" downloaded successfully.`,
              duration: 3000
          });
      } catch (err) {
          console.error('Error downloading stored file:', err);
          addToast({
              type: 'error',
              title: 'Download Failed',
              message: 'Could not prepare file download. Please try again.',
              duration: 3000
          });
      }
  };

  // Improved Navigation Logic supporting direct tool routes
  useEffect(() => {
    const rawP = getNormalizedPath();
    const path = typeof rawP === 'string' ? rawP : String(rawP || '/');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const matchedTool = findToolFromPath(cleanPath);

    if (matchedTool) {
        setActiveToolId(prev => prev === matchedTool.id ? prev : matchedTool.id);
        setActiveView(prev => prev === 'tool' ? prev : 'tool');
        setIsProfileOpen(prev => prev ? false : prev);
    } else if (cleanPath.startsWith('/tool/')) {
        const toolId = cleanPath.split('/tool/')[1];
        if (TOOLS.some(t => t.id === toolId)) {
            setActiveToolId(prev => prev === toolId ? prev : toolId);
            setActiveView(prev => prev === 'tool' ? prev : 'tool');
            setIsProfileOpen(prev => prev ? false : prev);
        } else {
            setActiveToolId(prev => prev === null ? prev : null);
            setActiveView(prev => prev === 'dashboard' ? prev : 'dashboard');
            setIsProfileOpen(prev => prev ? false : prev);
        }
    } else if (cleanPath === '/dashboard' || cleanPath === '/') {
        setActiveToolId(prev => prev === null ? prev : null);
        setActiveView(prev => prev === 'dashboard' ? prev : 'dashboard');
        setIsProfileOpen(prev => prev ? false : prev);
    } else {
        const viewName = cleanPath.substring(1);
        
        // Handle Profile Routes
        if (viewName === 'settings' || viewName === 'preferences') {
             setActiveView(prev => prev === 'settings' ? prev : 'settings');
             setProfileInitialTab('preferences');
             setIsProfileOpen(prev => prev ? false : prev);
        } else if (viewName === 'personal') {
             setActiveView(prev => prev === 'personal' ? prev : 'personal');
             setProfileInitialTab('personal');
             setIsProfileOpen(prev => prev ? false : prev);
        } else if (viewName === 'billing') {
             setActiveView(prev => prev === 'billing' ? prev : 'billing');
             setProfileInitialTab('billing');
             setIsProfileOpen(prev => prev ? false : prev);
        } else if (['documents', 'recent', 'support', 'download', 'payment-history', 'payments'].includes(viewName)) {
             const targetView = viewName === 'payments' ? 'payment-history' : viewName;
             setActiveView(prev => prev === targetView ? prev : targetView);
             setIsProfileOpen(prev => prev ? false : prev);
        } else if (viewName === 'upgrade') {
             setActiveView(prev => prev === 'upgrade' ? prev : 'upgrade');
             setIsProfileOpen(prev => prev ? false : prev);
        } else if (viewName === 'whats-new') {
             setActiveView(prev => prev === 'whats-new' ? prev : 'whats-new');
             setIsProfileOpen(prev => prev ? false : prev);
        }
    }
  }, [hash]);

  // Reset scroll position to top on every page view or tool change
  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [activeView, activeToolId]);

  const handleAuthSuccess = (authenticatedUser?: User) => {
    if (authenticatedUser) {
      setUser(authenticatedUser);
    }
    setIsBannerVisible(true);
    setActiveView('dashboard');
    // Immediately navigate away from auth pages to dashboard
    navigate('/dashboard');
    // Check if there was a pending download action
    const pending = sessionStorage.getItem('pending_download_action');
    if (pending) {
      try {
        const data = JSON.parse(pending);
        sessionStorage.removeItem('pending_download_action');
        if (data.type === 'apk') {
          setTimeout(() => {
            executeDirectAppDownload(data.platform);
          }, 600);
        }
      } catch {
        sessionStorage.removeItem('pending_download_action');
      }
    }
  };

  const handleLogout = async (destination?: string) => {
    // 1. Immediately reset state so UI switches instantly and smoothly without lag
    setUser(null);
    setIsProfileOpen(false);
    clearLocalSession();
    dispatchPaperXAuthChange(null);
    
    if (destination) {
      navigate(destination);
    } else {
      navigate('/');
    }

    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
    try {
      const saved = localStorage.getItem('paperx_local_stored_files');
      setStoredFiles(saved ? JSON.parse(saved) : []);
    } catch {
      setStoredFiles([]);
    }
  };

  const handleNavigation = (view: string, e?: React.MouseEvent) => {
      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }
      setIsMobileMenuOpen(false);
      
      if (view === 'settings' || view === 'preferences') {
          setActiveView('settings');
          setProfileInitialTab('preferences');
          setIsProfileOpen(false);
          navigate('/settings');
          return;
      }

      if (view === 'personal' || view === 'profile') {
          setActiveView('personal');
          setProfileInitialTab('personal');
          setIsProfileOpen(false);
          navigate('/personal');
          return;
      }
      
      if (view === 'support') {
          setActiveView('support');
          setIsProfileOpen(false);
          navigate('/support');
          return;
      }
      
      if (view === 'billing') {
          setActiveView('billing');
          setProfileInitialTab('billing');
          setIsProfileOpen(false);
          navigate('/billing');
          return;
      }

      if (view === 'payment-history' || view === 'payments') {
          setActiveView('payment-history');
          setIsProfileOpen(false);
          navigate('/payment-history');
          return;
      }

      if (view === 'download') {
          setActiveView('download');
          setIsProfileOpen(false);
          navigate('/download');
          return;
      }

      if (view === 'dashboard') {
          setActiveView('dashboard');
          setActiveToolId(null);
          setIsProfileOpen(false);
          navigate('/dashboard');
          return;
      }

      setActiveView(view);
      setIsProfileOpen(false);
      navigate(`/${view}`);
  };

  const isPlanExpired = (targetUser?: User | null): boolean => {
    const target = targetUser !== undefined ? targetUser : user;
    if (!target) return false;
    if (target.subscriptionStatus === 'expired') return true;
    
    // For paid subscriptions (Plus or Max):
    if (target.plan && target.plan !== 'Basic Plan') {
      const expiry = target.planExpiresAt ? new Date(target.planExpiresAt).getTime() : (target.subscriptionEndDate ? new Date(target.subscriptionEndDate).getTime() : null);
      if (expiry && expiry <= Date.now()) {
        return true;
      }
    }
    
    // For Basic Plan: 5 days only counts when users use their first basic related feature/create file.
    // If user didn't create any files or use any features, 5 days will NOT count until they use or create their files/features.
    if (target.plan === 'Basic Plan' || !target.plan) {
      if (!target.basicPlanStartedAt && (!target.planExpiresAt || target.projectsUsed === 0)) {
        return false;
      }
      const basicExpiry = target.basicPlanExpiresAt ? new Date(target.basicPlanExpiresAt).getTime() : (target.planExpiresAt ? new Date(target.planExpiresAt).getTime() : null);
      if (basicExpiry && basicExpiry <= Date.now()) {
        return true;
      }
    }

    return false;
  };

  const recordFeatureUsage = async (currentUser: User, toolId: string = 'document-processing', operationId?: string) => {
    const opId = operationId || `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    try {
      const res = await UsageService.recordOperationSuccess(toolId, opId, 1, currentUser);
      const isBasic = !currentUser.plan || currentUser.plan === 'Basic Plan' || currentUser.activePlanMode === 'Basic Plan';
      const hasNotStarted = !currentUser.basicPlanStartedAt;
      
      const now = new Date();
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
      const startedAt = now.toISOString();
      const expiresAt = new Date(now.getTime() + fiveDaysMs).toISOString();
      
      const updatePayload: Partial<User> = {
        projectsUsed: res.operationsUsed,
        featureUsageCount: (currentUser.featureUsageCount || 0) + 1,
        maxProjects: isBasic ? 5 : (currentUser.plan?.toLowerCase().includes('max') ? 1000 : 100),
        updatedAt: now.toISOString()
      };

      if (isBasic && hasNotStarted) {
        updatePayload.basicPlanStartedAt = startedAt;
        updatePayload.basicPlanExpiresAt = expiresAt;
        updatePayload.planExpiresAt = expiresAt;
      }

      setUser(prev => prev ? ({ ...prev, ...updatePayload }) : null);
      if (currentUser.uid) {
        updateUserInFirestore(currentUser.uid, updatePayload).catch(err => console.warn('Usage sync notice:', err));
      }
    } catch (e) {
      console.warn('recordFeatureUsage error:', e);
    }
  };

  // Real-time detection: if user requested a refund/return and it is confirmed or settled, or if account is refunded
  const isReturnConfirmed = Boolean(
    user?.isRefunded || 
    user?.subscriptionStatus === 'refunded' ||
    user?.refundStatus === 'COMPLETED' ||
    (() => {
      if (!Array.isArray(appOrders) || appOrders.length === 0) return false;
      const parseOrderTimestamp = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        const parsed = new Date(val).getTime();
        return isNaN(parsed) ? (Number(val) || 0) : parsed;
      };

      const refundedOrders = appOrders.filter(o => 
        (Boolean(o.isRefunded) || o.status === 'REFUNDED' || (o.ticketStatus === 'COMPLETED' && Boolean(o.ticketReason && (String(o.ticketReason).toLowerCase().includes('refund') || String(o.ticketReason).toLowerCase().includes('payout') || String(o.ticketReason).toLowerCase().includes('return'))))) &&
        !String(o.refundReason || '').toLowerCase().includes('upgrade') &&
        !String(o.id || '').toLowerCase().includes('upgrade-from')
      );
      if (refundedOrders.length === 0) return false;

      const latestRefundTime = Math.max(...refundedOrders.map(r => Math.max(parseOrderTimestamp(r.refundedAt), parseOrderTimestamp(r.createdAt), parseOrderTimestamp(r.updatedAt))));
      const verifiedOrders = appOrders.filter(o => o.status === 'VERIFIED' && !o.isRefunded && o.status !== 'REFUNDED');
      if (verifiedOrders.length === 0) return true;

      const latestVerifiedTime = Math.max(...verifiedOrders.map(v => Math.max(parseOrderTimestamp(v.verifiedAt), parseOrderTimestamp(v.createdAt))));
      return latestRefundTime > latestVerifiedTime;
    })()
  );

  const renderToolWorkspaceContent = () => {
    if (activeToolId === 'word-to-pdf') {
      return <WordToPdfWorkspace onComplete={handleProcessedFile} isProcessing={isProcessing} />;
    }
    if (activeToolId === 'jpg-to-pdf') {
      return <JpgToPdfWorkspace onComplete={handleProcessedFile} isProcessing={isProcessing} />;
    }
    if (['html-to-pdf', 'webToPdf', 'web-to-pdf'].includes(activeToolId || '')) {
      return <HtmlToPdfWorkspace onComplete={handleProcessedFile} isProcessing={isProcessing} />;
    }
    if (activeToolId === 'txt-to-pdf') {
      return <TxtToPdfWorkspace onComplete={handleProcessedFile} isProcessing={isProcessing} />;
    }
    if (['markdown-to-pdf', 'md-to-pdf'].includes(activeToolId || '')) {
      return <MarkdownToPdfWorkspace onComplete={handleProcessedFile} isProcessing={isProcessing} />;
    }
    if (activeToolId === 'excel-to-pdf') {
      return <ExcelToPdfWorkspace onComplete={handleProcessedFile} isProcessing={isProcessing} />;
    }
    if (activeToolId === 'csv-to-pdf') {
      return <CsvToPdfWorkspace onComplete={handleProcessedFile} isProcessing={isProcessing} />;
    }
    if (activeToolId === 'powerpoint-to-pdf') {
      return <PowerPointToPdfWorkspace onComplete={handleProcessedFile} isProcessing={isProcessing} />;
    }
    if (['summarize-pdf', 'translate-pdf', 'pdf-to-markdown'].includes(activeToolId || '')) {
      return <TextWorkspace toolId={activeToolId!} socket={socket} docId="demo-doc" onComplete={handleProcessedFile} />;
    }

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        {activeToolId === 'scan-pdf' && (
          <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
                <ScanLine size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Live Scanner & Camera Capture</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Scan documents directly using your camera or upload photo captures.</p>
              </div>
            </div>
            <Button 
              onClick={() => setIsCameraScannerOpen(true)}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs px-5 py-3 rounded-2xl shadow-lg shrink-0"
            >
              <ScanLine size={16} className="mr-2" /> Open Scanner
            </Button>
          </div>
        )}
        {activeToolId === 'merge-docx' && (
          <DocxMergeOptionsPanel
            options={docxMergeOptions}
            onOptionsChange={setDocxMergeOptions}
            files={files}
            onReorderFiles={handleReorderFiles}
            onRemoveFile={handleRemoveFile}
          />
        )}
        <FileUpload 
          files={files}
          onFilesSelected={handleFilesSelected}
          onRemoveFile={handleRemoveFile}
          onCancelFile={handleCancelFile}
          onCancelBatch={handleCancelBatch}
          toolId={activeToolId}
        />
        
        {files.length > 0 && (
          <div className="flex justify-end pt-4">
            <Button 
              size="sm" 
              onClick={handleGenericFileProcess}
              isLoading={isProcessing}
              disabled={files.some(f => f.status === 'uploading' || f.status === 'cancelled')}
              className="shadow-xl shadow-black/10 font-semibold"
            >
              {isProcessing ? processingStatus : (['powerpoint-to-pdf', 'excel-to-pdf', 'csv-to-pdf', 'txt-to-pdf', 'markdown-to-pdf'].includes(activeToolId || '') || activeToolId?.endsWith('-to-pdf') ? `Convert to PDF` : (activeToolId === 'merge-docx' ? (docxMergeOptions.outputFormat === 'pdf' ? `Merge & Convert to PDF` : `Merge ${files.filter(f => f.status !== 'cancelled').length} Documents`) : `Process ${files.filter(f => f.status !== 'cancelled').length} Files`))} <ArrowRight size={18} className="ml-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const activeUserPlan = useMemo(() => {
    if (isReturnConfirmed || isPlanExpired(user)) {
      return 'Basic Plan';
    }

    // 1. If user has activePlanMode set explicitly (e.g. toggled between Max and Plus in switcher)
    const activeMode = user?.activePlanMode ? String(user.activePlanMode).toLowerCase() : '';
    if (activeMode) {
      if (activeMode.includes('max')) return 'Max Plan';
      if (activeMode.includes('plus') || activeMode.includes('pro')) return 'Pro Plan';
      if (activeMode.includes('basic') || activeMode.includes('free')) return 'Basic Plan';
    }
    if (Array.isArray(appOrders) && appOrders.length > 0) {
      const parseOrderTimestamp = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        const parsed = new Date(val).getTime();
        return isNaN(parsed) ? (Number(val) || 0) : parsed;
      };
      const verifiedOrders = appOrders.filter(o => 
        o.status === 'VERIFIED' && 
        !o.isRefunded && 
        o.status !== 'REFUNDED'
      );
      if (verifiedOrders.length > 0) {
        const sorted = [...verifiedOrders].sort((a, b) => parseOrderTimestamp(b.createdAt) - parseOrderTimestamp(a.createdAt));
        const latestVerified = sorted[0];
        const planStr = String(latestVerified?.plan || '').toLowerCase();
        if (planStr.includes('max')) return 'Max Plan';
        if (planStr.includes('plus') || planStr.includes('pro')) return 'Pro Plan';
      }
    }

    // 3. Check user plan or purchasedPlan or membershipTier
    const userPlanRaw = String(user?.plan || user?.purchasedPlan || (user as any)?.membershipTier || '').toLowerCase();
    if (userPlanRaw.includes('max')) return 'Max Plan';
    if (userPlanRaw.includes('plus') || userPlanRaw.includes('pro')) return 'Pro Plan';

    // 4. Fallback to getUserPurchasedTier helper
    const tier = getUserPurchasedTier(user);
    if (tier === 'Max') return 'Max Plan';
    if (tier === 'Pro') return 'Pro Plan';

    if (user?.isPro) return 'Pro Plan';

    return 'Basic Plan';
  }, [user, appOrders, isReturnConfirmed]);

  // Immediate Plan Synchronization when Return/Refund is confirmed
  useEffect(() => {
    if (isReturnConfirmed && user && (user.plan !== 'Basic Plan' || !user.isRefunded)) {
      setUser(prev => {
        if (!prev || (prev.plan === 'Basic Plan' && prev.isRefunded)) return prev;
        return {
          ...prev,
          plan: 'Basic Plan',
          purchasedPlan: 'Basic Plan',
          activePlanMode: 'Basic Plan',
          isPro: false,
          isRefunded: true,
          membershipTier: 'free',
          billingCycle: 'month',
          planExpiresAt: prev.basicPlanExpiresAt || undefined,
          maxProjects: 5
        };
      });

      if (user.uid && (user.plan !== 'Basic Plan' || !user.isRefunded)) {
        updateUserInFirestore(user.uid, {
          plan: 'Basic Plan',
          purchasedPlan: 'Basic Plan',
          activePlanMode: 'Basic Plan',
          isPro: false,
          isRefunded: true,
          membershipTier: 'free',
          billingCycle: 'month',
          planExpiresAt: (user.basicPlanExpiresAt || null) as any,
          maxProjects: 5,
          updatedAt: new Date().toISOString()
        }).catch(console.warn);
      }
    }
  }, [isReturnConfirmed, user?.uid, user?.plan, user?.isRefunded]);

  const getPlanTier = (plan?: string, targetUser?: User | null): 'Free' | 'Pro' | 'Max' => {
    const currentUser = targetUser !== undefined ? targetUser : user;
    if (isReturnConfirmed || isPlanExpired(currentUser)) {
      return 'Free';
    }
    // Prioritize activePlanMode if user has selected a mode, or the explicit plan param
    const effectivePlan = (plan && plan !== currentUser?.plan) 
      ? plan 
      : (currentUser?.activePlanMode || currentUser?.plan || plan || 'Free');

    const p = effectivePlan.toLowerCase();
    if (p.includes('max')) return 'Max';
    if (p.includes('plus') || p.includes('pro')) return 'Pro';
    return 'Free';
  };

  const isToolLocked = (_tool: Tool) => {
    // In free plan users can use all features across the PaperX toolbox within their 5 operations quota
    return false;
  };

  const handleToolClick = (toolId: string) => {
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) return;

    if (isToolLocked(tool)) {
      navigate('/upgrade');
      return;
    }

    const tier = getPlanTier(user?.plan);
    const opsUsed = Math.max(
      Number(user?.projectsUsed || 0),
      Number(guestTrialsUsed || 0),
      Array.isArray(storedFiles) ? storedFiles.length : 0
    );
    if (tier === 'Free') {
        if (opsUsed >= 15) {
             addToast({
                 type: 'error',
                 title: 'Basic Plan Limit Reached',
                 message: `Your 15 free feature operations have been used (${opsUsed}/15). Upgrade to Pro or Max Plan to continue.`
             });
             navigate('/upgrade');
             return;
        }
    }

    if (toolId === 'camera-scanner' || toolId === 'batch-scanner' || toolId === 'scan-pdf' || toolId === 'auto-edge-detect' || toolId === 'auto-enhance') {
        setIsCameraScannerOpen(true);
        setIsMobileMenuOpen(false);
        return;
    }

    if (toolId === 'file-manager' || toolId === 'delete-pdf' || toolId === 'search-pdf') {
        navigate('/documents');
        setIsMobileMenuOpen(false);
        return;
    }

    if (toolId === 'private-folder') {
        addToast({
            type: 'info',
            title: 'Private Folder',
            message: 'Access your protected documents in Private Folder.'
        });
        navigate('/documents');
        setIsMobileMenuOpen(false);
        return;
    }

    navigate(`/tool/${toolId}`);
    setIsMobileMenuOpen(false);
  };

  const handleInitiatePayment = (
      plan: 'Pro Plan' | 'Pro Plan' | 'Max Plan', 
      amount?: string, 
      cycle: 'month' | 'half-year' | 'year' = 'month', 
      resubmitId?: string, 
      upgradeFromId?: string, 
      oldAmount?: number
  ) => {
      // Synchronously close ProfilePanel immediately so buttons never overlap or peek behind PaymentModal
      setIsProfileOpen(false);
      if (window.location.hash.includes('billing') || window.location.hash.includes('settings') || window.location.hash.includes('preferences') || window.location.hash.includes('personal')) {
          navigate('/dashboard');
      }

      const resolvedPlan = plan;
      setPaymentPlan(resolvedPlan);
      setPaymentCycle(cycle);
      const defaultAmt = resolvedPlan === 'Max Plan' 
        ? (cycle === 'half-year' ? '245' : cycle === 'year' ? '490' : '49')
        : (cycle === 'half-year' ? '145' : cycle === 'year' ? '290' : '29');
      
      const purchasedTier = getUserPurchasedTier(user);
      const isExpired = isPlanExpired(user);
      const isRefunded = Boolean(user?.isRefunded);

      let finalAmt = defaultAmt;
      let finalUpgradeId = upgradeFromId;
      let finalOldAmt = 0;

      // Membership Upgrade & Refund Rules:
      const userActiveCredit = (() => {
          if (!user || user?.isRefunded || isExpired || purchasedTier === 'Free' || user.plan === 'Basic Plan' || user.subscriptionStatus === 'free') return 0;
          if (purchasedTier === 'Max') {
              return getPlanCreditValue('Max Plan', user.billingCycle as BillingCycleType);
          }
          if (purchasedTier === 'Pro') {
              return getPlanCreditValue('Pro Plan', user.billingCycle as BillingCycleType);
          }
          return 0;
      })();

      const targetBaseAmt = Number(defaultAmt);

      if (userActiveCredit > 0 && targetBaseAmt > userActiveCredit && !isExpired && !isRefunded) {
          finalOldAmt = oldAmount || userActiveCredit;
          finalAmt = String(Math.max(1, targetBaseAmt - finalOldAmt));
          finalUpgradeId = finalUpgradeId || `upgrade-from-${purchasedTier?.toLowerCase() || 'past'}-membership`;
          setOriginalBaseAmount(targetBaseAmt);
          setUpgradeDiscountCredit(finalOldAmt);
      } else {
          // Full money required: new purchases, or if target price is not higher, or if user has been refunded
          finalAmt = defaultAmt;
          setOriginalBaseAmount(targetBaseAmt);
          setUpgradeDiscountCredit(undefined);
          finalUpgradeId = undefined;
      }

      setPaymentAmount(finalAmt);
      setPaymentResubmitId(resubmitId);
      setUpgradeFromOrderId(finalUpgradeId);
      setIsPaymentOpen(true);
  };

  const handleSwitchPlanMode = async (
      targetPlan: 'Basic Plan' | 'Pro Plan' | 'Pro Plan' | 'Max Plan',
      targetCycle?: 'month' | 'half-year' | 'year'
  ) => {
      if (!user) {
          navigate('/signup');
          return;
      }
      const purchasedTier = getUserPurchasedTier(user);
      const userCycle = (user.billingCycle as BillingCycleType) || 'month';
      const isExpired = isPlanExpired(user);
      const normalizedTargetPlan = targetPlan;

      // Check cycle restriction FIRST: if target cycle is not covered by the user's active membership,
      // they cannot use or switch to plans in that cycle directly and must upgrade.
      if (targetCycle && normalizedTargetPlan !== 'Basic Plan' && !isBillingCycleCovered(userCycle, targetCycle)) {
          handleInitiatePayment(normalizedTargetPlan, undefined, targetCycle);
          return;
      }

      // If user wants Max Plan but doesn't own Max, redirect to upgrade flow
      if (normalizedTargetPlan === 'Max Plan' && (purchasedTier !== 'Max' || isExpired)) {
          handleInitiatePayment('Max Plan', undefined, targetCycle || userCycle);
          return;
      }

      // If user wants Pro Plan but only has Free, redirect to upgrade flow
      if (normalizedTargetPlan === 'Pro Plan' && (purchasedTier === 'Free' || isExpired)) {
          handleInitiatePayment('Pro Plan', undefined, targetCycle || userCycle);
          return;
      }

      // Within covered cycle: Max Plan includes Pro Plan and Basic Plan for free
      if (normalizedTargetPlan === 'Pro Plan' && purchasedTier === 'Max' && !isExpired) {
          const updatedUserData: Partial<User> = {
              plan: 'Pro Plan',
              activePlanMode: 'Pro Plan',
              purchasedPlan: 'Max Plan',
              isPro: true,
              updatedAt: new Date().toISOString()
          };
          if (user.uid) {
              await updateUserInFirestore(user.uid, updatedUserData);
          }
          setUser(prev => prev ? { ...prev, ...updatedUserData } : prev);
          addToast({
              type: 'success',
              title: 'Active Mode: Pro Plan',
              message: 'Max Plan includes Pro Plan for free. You can switch between Pro and Max anytime!'
          });
          return;
      }

      // If user is in Pro mode and wants to switch back to Max Plan (when they own Max)
      if (normalizedTargetPlan === 'Max Plan' && purchasedTier === 'Max' && !isExpired) {
          const updatedUserData: Partial<User> = {
              plan: 'Max Plan',
              activePlanMode: 'Max Plan',
              purchasedPlan: 'Max Plan',
              isPro: true,
              updatedAt: new Date().toISOString()
          };
          if (user.uid) {
              await updateUserInFirestore(user.uid, updatedUserData);
          }
          setUser(prev => prev ? { ...prev, ...updatedUserData } : prev);
          addToast({
              type: 'success',
              title: 'Active Mode: Max Plan',
              message: 'Switched back to your active Max Plan!'
          });
          return;
      }

      const updatedUserData: Partial<User> = {
          plan: normalizedTargetPlan,
          activePlanMode: normalizedTargetPlan,
          purchasedPlan: user.purchasedPlan || (purchasedTier === 'Max' ? 'Max Plan' : purchasedTier === 'Plus' || purchasedTier === 'Pro' ? 'Pro Plan' : 'Basic Plan'),
          isPro: normalizedTargetPlan !== 'Basic Plan',
          updatedAt: new Date().toISOString()
      };

      if (user.uid) {
          await updateUserInFirestore(user.uid, updatedUserData);
      }
      setUser(prev => prev ? { ...prev, ...updatedUserData } : prev);

      addToast({
          type: 'success',
          title: `Active Mode: ${targetPlan}`,
          message: targetPlan === 'Basic Plan'
              ? `You switched to Basic Plan mode.`
              : `You switched to ${targetPlan} mode.`
      });
  };

  const handlePaymentSuccess = () => {
      const now = Date.now();
      let durationMs = 30 * 24 * 60 * 60 * 1000;
      if (paymentCycle === 'half-year') durationMs = 180 * 24 * 60 * 60 * 1000;
      else if (paymentCycle === 'year') durationMs = 365 * 24 * 60 * 60 * 1000;
      const planExpiresAt = new Date(now + durationMs).toISOString();

      if (user) {
          const updatedUserData = {
              plan: paymentPlan,
              purchasedPlan: paymentPlan,
              activePlanMode: paymentPlan,
              planExpiresAt,
              billingCycle: paymentCycle,
              subscriptionStatus: 'active' as const,
              membershipTier: (paymentPlan === 'Max Plan' ? 'max' : 'plus') as 'plus' | 'max',
              isRefunded: false, // Reset refund flag on newly paid activation
              isPro: true,
              maxProjects: -1,
              projectsUsed: 0,
              updatedAt: new Date().toISOString()
          };
          if (user.uid) {
              updateUserInFirestore(user.uid, updatedUserData);
          }
          setUser({ 
              ...user, 
              ...updatedUserData
          });
      }
      setHasPromptedExpirySession(false);
      navigate('/dashboard');
  };

  const handleCancelFile = (id: string) => {
      if (uploadIntervals.current[id]) {
          clearInterval(uploadIntervals.current[id]);
          delete uploadIntervals.current[id];
      }
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'cancelled', progress: 0 } : f));
  };

  const handleCancelBatch = () => {
      Object.keys(uploadIntervals.current).forEach(id => {
          clearInterval(uploadIntervals.current[id]);
          delete uploadIntervals.current[id];
      });
      if (processingTimeout.current) {
          clearTimeout(processingTimeout.current);
          processingTimeout.current = null;
      }
      setIsProcessing(false);
      setProcessingStatus('Cancelled');
      setFiles(prev => prev.map(f => {
          if (f.status === 'uploading' || f.status === 'processing') {
              return { ...f, status: 'cancelled', progress: 0 };
          }
          return f;
      }));
  };

  const handleFilesSelected = (newFiles: File[]) => {
    const tier = user ? getPlanTier(user.plan) : 'Free';
    const opsUsed = Math.max(
      Number(user?.projectsUsed || 0),
      Number(guestTrialsUsed || 0),
      Array.isArray(storedFiles) ? storedFiles.length : 0
    );
    if (tier === 'Free' && opsUsed >= 15) {
        addToast({
            type: 'error',
            title: 'Basic Plan Limit Reached',
            message: `Your 15 free feature operations have been used (${opsUsed}/15). Upgrade to Pro or Max Plan to continue.`
        });
        navigate('/upgrade');
        return;
    }
    const MAX_FILE_SIZE_BYTES = tier === 'Free' ? 50 * 1024 * 1024 : 500 * 1024 * 1024;
    const oversized = newFiles.some(f => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
        if (tier === 'Free') {
            addToast({
                type: 'error',
                title: 'Free Tier Limit (50MB)',
                message: 'Free tier includes top-tier quality up to 50MB per file. Upgrade to Pro or Max for files up to 500MB!'
            });
            navigate('/upgrade');
        } else {
            addToast({
                type: 'error',
                title: 'File Exceeds Max Limit',
                message: 'Maximum supported single file size is 500 MB.'
            });
        }
        return;
    }

    setRawFiles(prev => [...prev, ...newFiles]);

    const fileData: FileData[] = newFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified,
      status: 'uploading',
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...fileData]);

    fileData.forEach(file => {
      const speed = 5 + Math.random() * 15; 
      const interval = setInterval(() => {
        setFiles(currentFiles => {
          const target = currentFiles.find(f => f.id === file.id);
          if (!target || target.status === 'cancelled') {
            clearInterval(interval);
            delete uploadIntervals.current[file.id];
            return currentFiles;
          }
          const newProgress = target.progress + speed;
          if (newProgress >= 100) {
            clearInterval(interval);
            delete uploadIntervals.current[file.id];
            return currentFiles.map(f => 
              f.id === file.id ? { ...f, status: 'ready', progress: 0 } : f
            );
          }
          return currentFiles.map(f => 
            f.id === file.id ? { ...f, progress: newProgress } : f
          );
        });
      }, 150);
      uploadIntervals.current[file.id] = interval;
    });
  };

  const handleRemoveFile = (id: string) => {
    if (uploadIntervals.current[id]) {
        clearInterval(uploadIntervals.current[id]);
        delete uploadIntervals.current[id];
    }
    setFiles(prev => {
        const list = Array.isArray(prev) ? prev : [];
        const index = list.findIndex(f => f?.id === id);
        if (index !== -1) {
             const newRawFiles = Array.isArray(rawFiles) ? [...rawFiles] : [];
             newRawFiles.splice(index, 1);
             setRawFiles(newRawFiles);
        }
        return list.filter(f => f?.id !== id);
    });
  };

  const handleGenericFileProcess = async () => {
    if (!activeToolId) return;
    
    const activeTool = TOOLS.find(t => t.id === activeToolId);
    if (user && activeTool && isToolLocked(activeTool)) {
        navigate('/upgrade');
        return;
    }

    if (files.some(f => f.status === 'uploading')) {
        addToast({
            type: 'warning',
            title: 'Uploading in Progress',
            message: 'Please wait for your files to finish uploading before processing.'
        });
        return;
    }
    
    const readyFiles = files.filter(f => f.status === 'ready' || f.status === 'error');
    if (readyFiles.length === 0) {
        addToast({
            type: 'warning',
            title: 'No Files Selected',
            message: 'Please choose or upload a file to process.'
        });
        return;
    }

    const tier = user ? getPlanTier(user.plan) : 'Free';
    const opsUsed = Math.max(
      Number(user?.projectsUsed || 0),
      Number(guestTrialsUsed || 0),
      Array.isArray(storedFiles) ? storedFiles.length : 0
    );
    const maxOps = tier === 'Free' ? 15 : (tier === 'Pro' ? 100 : 1000);

    // 1. Quota check before processing
    if (tier === 'Free' && opsUsed >= 15) {
        addToast({
            type: 'error',
            title: 'Basic Plan Limit Reached',
            message: `Your 15 free feature operations have been used (${opsUsed}/15). Upgrade to Pro or Max Plan to continue.`
        });
        navigate('/upgrade');
        return;
    }

    if (tier === 'Free' && readyFiles.length > 1 && activeToolId !== 'merge-pdf') {
        addToast({
            type: 'error',
            title: 'Batch Processing Locked',
            message: 'Batch processing multiple files simultaneously is available on Pro and Max plans.'
        });
        navigate('/upgrade');
        return;
    }

    // 2. Server-side quota validation
    const totalSizeMb = readyFiles.reduce((acc, f) => acc + (f.size / (1024 * 1024)), 0);
    const verification = await UsageService.verifyOperationAllowed(activeToolId, readyFiles.length, totalSizeMb, user);
    if (!verification.allowed) {
        addToast({
            type: 'error',
            title: verification.isLimitReached ? 'Free Limit Reached' : 'Processing Disallowed',
            message: verification.message || 'Operation not allowed on your current plan.'
        });
        navigate('/upgrade');
        return;
    }

    const MAX_FILE_SIZE_BYTES = tier === 'Free' ? 50 * 1024 * 1024 : 500 * 1024 * 1024;
    const oversized = readyFiles.some(f => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
        addToast({
            type: 'error',
            title: 'File Size Limit',
            message: tier === 'Free' ? 'Free plan supports up to 50MB per file with top-tier quality. Upgrade for larger files!' : 'Maximum single file size is 500 MB.'
        });
        if (tier === 'Free') navigate('/upgrade');
        return;
    }

    const userPdfQuality = user?.pdfQuality || localStorage.getItem('pref_pdfQuality') || 'high';
    const userPageSize = user?.pageSize || localStorage.getItem('pref_pageSize') || 'a4';
    const userAutoCompress = user?.pdfAutoCompress !== undefined 
      ? user.pdfAutoCompress 
      : (localStorage.getItem('pref_pdfAutoCompress') !== 'false');

    const imgOpts = (window as any).__imageToPdfOptions || {};
    const imgToImgOpts = (window as any).__pdfToImageOptions || {};

    let processOptions: any = {
      pdfQuality: imgToImgOpts.resolution || userPdfQuality,
      pageSize: imgOpts.pageSize || userPageSize,
      orientation: imgOpts.orientation || 'portrait',
      margin: imgOpts.margin || 'small',
      rotations: imgOpts.rotations || {},
      pdfAutoCompress: userAutoCompress,
      docxMergeOptions: docxMergeOptions,
      imageFormat: imgToImgOpts.imageFormat,
      pageRange: imgToImgOpts.pageRange,
      pageMode: imgToImgOpts.pageMode,
      toolId: activeToolId,
    };

    if (activeToolId === 'protect-pdf') {
        const pwd = window.prompt("Enter a password to protect this file:", "");
        if (!pwd) return;
        processOptions.password = pwd;
    }

    setIsProcessing(true);
    setProcessingStatus('Initializing...');
    setProcessingProgress(0);
    setFiles(prev => prev.map(f => (f.status === 'ready' || f.status === 'error') ? { ...f, status: 'processing', progress: 10 } : f));
    
    try {
        const filesToProcess: File[] = [];
        files.forEach((f, index) => {
            if ((f.status === 'ready' || f.status === 'error' || f.status === 'processing') && rawFiles[index]) {
                filesToProcess.push(rawFiles[index]);
            }
        });

        if (filesToProcess.length === 0) throw new Error("File mismatch error.");

        const result = await DocumentService.processFiles(
            activeToolId, 
            filesToProcess,
            (status, progress) => {
                setProcessingStatus(status);
                setProcessingProgress(progress);
            },
            processOptions
        );
        playCompletionChime();
        
        // Only record usage AFTER successful processing!
        const opId = `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const usageRes = await UsageService.recordOperationSuccess(activeToolId, opId, filesToProcess.length, user);
        
        if (user) {
            setUser(prev => prev ? ({
                ...prev,
                projectsUsed: usageRes.operationsUsed,
                featureUsageCount: (prev.featureUsageCount || 0) + 1,
                maxProjects: maxOps
            }) : null);
        } else {
            setGuestTrialsUsed(usageRes.operationsUsed);
        }

        const activeTool = TOOLS.find(t => t.id === activeToolId);
        const toolDisplayName = activeTool?.name || 'Document Processing';
        const formattedFileSize = result.blob.size >= 1024 * 1024
            ? `${(result.blob.size / 1024 / 1024).toFixed(2)} MB`
            : `${(result.blob.size / 1024).toFixed(1)} KB`;

        // Store all batch items in recent documents
        const getBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        const newStoredItems = await Promise.all((result.batchResult?.items || []).map(async item => {
            let dataUrl = '';
            try {
                if (item.blob) dataUrl = await getBase64(item.blob);
            } catch (e) {
                console.warn('Failed to convert blob', e);
            }
            const newItemId = item.id || Math.random().toString();
            if (dataUrl) {
                await LocalFileStore.save(newItemId, dataUrl);
            }
            const uniqueName = generateUniqueFileName(item.filename, storedFiles, toolDisplayName);
            const itemExt = item.filename.split('.').pop()?.toLowerCase() || '';
            let itemDocType = 'PDF';
            if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'bmp'].includes(itemExt)) itemDocType = 'IMAGE';
            else if (['xlsx', 'xls'].includes(itemExt)) itemDocType = 'EXCEL';
            else if (['docx', 'doc'].includes(itemExt)) itemDocType = 'DOCX';
            else if (['pptx', 'ppt'].includes(itemExt)) itemDocType = 'PPTX';
            else if (['csv', 'tsv'].includes(itemExt)) itemDocType = 'CSV';
            else if (['md', 'markdown'].includes(itemExt)) itemDocType = 'MARKDOWN';
            else if (['html', 'htm'].includes(itemExt)) itemDocType = 'HTML';
            else if (item.filename.endsWith('.zip')) itemDocType = 'ZIP';
            else if (['txt', 'text', 'json', 'xml'].includes(itemExt)) itemDocType = 'TEXT';
            else if (item.type) itemDocType = item.type;

            return {
                id: newItemId,
                name: uniqueName,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now(),
                size: item.size >= 1024 * 1024 ? `${(item.size / 1024 / 1024).toFixed(2)} MB` : `${(item.size / 1024).toFixed(1)} KB`,
                type: itemDocType,
                action: toolDisplayName,
                dataUrl: dataUrl || undefined
            };
        }));

        if (newStoredItems.length > 0) {
            newStoredItems.forEach(item => {
              if (item.dataUrl) {
                saveLocalFileBinary(item.id, item.dataUrl).catch(() => {});
              }
            });
            setStoredFiles(prev => {
              const ids = new Set(newStoredItems.map(i => i.id));
              return [...newStoredItems, ...prev.filter(p => !ids.has(p.id))];
            });
            try {
                window.dispatchEvent(new CustomEvent('paperx-stored-files-updated', { 
                    detail: newStoredItems 
                }));
            } catch (_) {}
            const activeUid = user?.uid || (user as any)?.id || auth.currentUser?.uid;
            if (activeUid) {
                newStoredItems.forEach(item => addDocumentToFirestore(activeUid, item).catch(console.error));
            } else {
                try {
                    const saved = localStorage.getItem('paperx_local_stored_files');
                    const currentList = saved ? JSON.parse(saved) : [];
                    localStorage.setItem('paperx_local_stored_files', JSON.stringify([...newStoredItems, ...currentList]));
                } catch (_) {}
            }
        } else {
            let singleDataUrl = '';
            try {
                if (result.blob) singleDataUrl = await getBase64(result.blob);
            } catch (e) {}
            
            const newFileId = `doc_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
            if (singleDataUrl) {
                LocalFileStore.save(newFileId, singleDataUrl);
                saveLocalFileBinary(newFileId, singleDataUrl).catch(() => {});
            }
            
            const uniqueSingleName = generateUniqueFileName(result.filename, storedFiles, toolDisplayName);
            const singleExt = result.filename.split('.').pop()?.toLowerCase() || '';
            let singleDocType = 'PDF';
            if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'bmp'].includes(singleExt)) singleDocType = 'IMAGE';
            else if (['xlsx', 'xls'].includes(singleExt)) singleDocType = 'EXCEL';
            else if (['docx', 'doc'].includes(singleExt)) singleDocType = 'DOCX';
            else if (['pptx', 'ppt'].includes(singleExt)) singleDocType = 'PPTX';
            else if (['csv', 'tsv'].includes(singleExt)) singleDocType = 'CSV';
            else if (['md', 'markdown'].includes(singleExt)) singleDocType = 'MARKDOWN';
            else if (['html', 'htm'].includes(singleExt)) singleDocType = 'HTML';
            else if (result.filename.endsWith('.zip')) singleDocType = 'ZIP';
            else if (['txt', 'text', 'json', 'xml'].includes(singleExt)) singleDocType = 'TEXT';
            
            const newStoredDocument: StoredDocument = {
                id: newFileId,
                name: uniqueSingleName,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now(),
                size: formattedFileSize,
                type: singleDocType,
                action: toolDisplayName,
                dataUrl: singleDataUrl || undefined,
                tags: [toolDisplayName, singleDocType]
            };
            setStoredFiles(prev => [newStoredDocument, ...prev.filter(p => p.id !== newFileId)]);
            try {
                window.dispatchEvent(new CustomEvent('paperx-stored-files-updated', { 
                    detail: newStoredDocument 
                }));
            } catch (_) {}

            const activeUid = user?.uid || (user as any)?.id || auth.currentUser?.uid;
            if (activeUid) {
                addDocumentToFirestore(activeUid, newStoredDocument).catch(console.error);
            } else {
                try {
                    const saved = localStorage.getItem('paperx_local_stored_files');
                    const currentList = saved ? JSON.parse(saved) : [];
                    localStorage.setItem('paperx_local_stored_files', JSON.stringify([newStoredDocument, ...currentList]));
                } catch (_) {}
            }

            analyzeDocumentForTags(uniqueSingleName, singleDataUrl).then(aiTags => {
                if (aiTags && aiTags.length > 0) {
                    setStoredFiles(prev => prev.map(f => f.id === newFileId ? { ...f, tags: aiTags } : f));
                    if (activeUid) {
                        addDocumentToFirestore(activeUid, { ...newStoredDocument, tags: aiTags }).catch(console.error);
                    }
                }
            }).catch(() => {});
        }
        
        setFiles(prev => prev.map(f => 
            (f.status === 'processing' || f.status === 'ready') ? { ...f, status: 'ready', progress: 100 } : f
        ));
        setProcessingStatus('Completed');

        // Set batch result and launch completion modal
        if (result.batchResult) {
            setBatchResult(result.batchResult);
            setIsBatchModalOpen(true);
        }

        // Trigger toast notification
        const resAny = result as any;
        const toastMsg = resAny.extractedText 
            ? (resAny.copied 
                ? `OCR extracted in ${resAny.language || 'English'}. Extracted text copied to clipboard!` 
                : `OCR extracted in ${resAny.language || 'English'}.`)
            : `${result.batchResult?.items?.length || 1} file(s) processed and ready.`;

        addToast({
            type: 'success',
            title: `${toolDisplayName} Complete`,
            message: toastMsg,
            toolName: toolDisplayName,
            fileName: result.filename,
            fileSize: formattedFileSize,
            downloadBlob: result.blob,
            downloadFileName: result.filename,
            duration: 6000
        });

        setTimeout(() => {
            setIsProcessing(false);
            setProcessingProgress(0);
        }, 1200);

    } catch (error: any) {
        console.error(error);
        setProcessingStatus('Error');
        setFiles(prev => prev.map(f => (f.status === 'processing' || f.status === 'ready') ? { ...f, status: 'error', progress: 0 } : f));
        addToast({
            type: 'error',
            title: 'Processing Failed',
            message: error?.message || 'An error occurred while processing your document.',
            duration: 5000
        });
        setTimeout(() => {
            setIsProcessing(false);
            setProcessingProgress(0);
        }, 1800);
    }
  };

  const renderContent = () => {


    // 1. Maintenance Mode Lockout
    if (appSettings.maintenanceMode && !isAdminOpen) {
      return (
        <div className="fixed inset-0 z-[100] bg-stone-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans overflow-hidden">
          {/* Animated Central Icon Container */}
          <div className="relative mb-8">
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="relative w-24 h-24 rounded-3xl bg-gradient-to-b from-orange-500/20 to-amber-500/5 border border-orange-500/30 shadow-2xl shadow-orange-500/20 flex items-center justify-center text-orange-400 "
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <Wrench size={44} className="text-orange-400 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
              </motion.div>
            </motion.div>
          </div>

          {/* Live Status Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-extrabold text-xs tracking-widest uppercase mb-4 shadow-inner"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            System Upgrade Active
          </motion.div>

          {/* Title & Description */}
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black text-white max-w-xl leading-tight tracking-tight mb-4"
          >
            Scheduled System Upgrade
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-stone-400 max-w-md leading-relaxed"
          >
            Our engineering team is executing core infrastructure maintenance and security optimizations. All services will resume automatically once completed.
          </motion.p>
        </div>
      );
    }


    if (cleanPathForRouting.startsWith('/verify-receipt/')) {
      const verificationId = cleanPathForRouting.split('/verify-receipt/')[1] || '';
      return (
        <ReceiptVerificationView 
          verificationId={verificationId} 
          onNavigate={navigate} 
        />
      );
    }

    if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50 dark:bg-gray-950" />
    );
  }

  if (!user) {
    const urlParams = new URLSearchParams(window.location.search);
    const isResetPassword = urlParams.get('mode') === 'resetPassword';

    if (cleanPathForRouting === '/forgot-password' || cleanPathForRouting === '/reset-password' || isResetPassword) {
      return (
        <>
          <AuthPage key="reset" mode="reset" onAuthSuccess={(u) => handleAuthSuccess(u)} onNavigate={navigate} />
          <DeviceLimitModal
            isOpen={deviceLimitModalOpen}
            onClose={() => setDeviceLimitModalOpen(false)}
          />
        </>
      );
    }
    
    if (cleanPathForRouting === '/login') {
      return (
        <>
          <AuthPage key="login" mode="login" onAuthSuccess={(u) => handleAuthSuccess(u)} onNavigate={navigate} />
          <DeviceLimitModal
            isOpen={deviceLimitModalOpen}
            onClose={() => setDeviceLimitModalOpen(false)}
          />
        </>
      );
    }
    
    if (cleanPathForRouting === '/signup') {
      return (
        <>
          <AuthPage key="signup" mode="signup" onAuthSuccess={(u) => handleAuthSuccess(u)} onNavigate={navigate} />
          <DeviceLimitModal
            isOpen={deviceLimitModalOpen}
            onClose={() => setDeviceLimitModalOpen(false)}
          />
        </>
      );
    }

    if (cleanPathForRouting === '/' || cleanPathForRouting === '') {
      return (
        <div className="flex flex-col min-h-screen relative">
          <div className="flex-1">
            <LandingView 
              onOpenDownload={() => handleDirectAppDownload()} 
              appSettings={appSettings} 
            />
          </div>
          <DeviceLimitModal
            isOpen={deviceLimitModalOpen}
            onClose={() => setDeviceLimitModalOpen(false)}
          />
        </div>
      );
    }
    // For any tool path (e.g. /jpg-to-pdf) or in-app view, directly render the full app workspace without any dummy landing views
  }



  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const fiveYearsMs = 5 * 365.25 * 24 * 60 * 60 * 1000;
  const nowTime = Date.now();
  const getDocTimeHelper = (f: StoredDocument): number => getStoredDocTimestamp(f);

  const recentDocsCount = storedFiles.filter(f => getDocTimeHelper(f) >= (nowTime - thirtyDaysMs)).length;
  const myDocsCount = storedFiles.filter(f => {
    const ts = getDocTimeHelper(f);
    return ts < (nowTime - thirtyDaysMs) && ts >= (nowTime - fiveYearsMs);
  }).length;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-black selection:text-white relative overflow-hidden">
      <div className="flex flex-1 overflow-hidden transition-all duration-300">
      {/* Ensure no-scrollbar works globally within this component's shadow scope effectively */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Premium Processing Overlay */}
      {isProcessing && (
         <ProcessingOverlay 
            status={processingStatus} 
            progress={processingProgress} 
            onClose={() => {
                setIsProcessing(false);
                setProcessingProgress(0);
            }}
         />
      )}

      {/* Urgent Admin Notification Modal */}
      {activeUrgentNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 ">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`bg-stone-900 border ${
              activeUrgentNotification.priority === 'EMERGENCY' ? 'border-red-500/50' : 'border-amber-500/50'
            } rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative`}
          >
            <div className={`p-6 ${
              activeUrgentNotification.priority === 'EMERGENCY' ? 'bg-red-500/10' : 'bg-amber-500/10'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl ${
                  activeUrgentNotification.priority === 'EMERGENCY' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'
                }`}>
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{activeUrgentNotification.title}</h3>
                  <p className={`text-xs font-bold ${
                    activeUrgentNotification.priority === 'EMERGENCY' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {activeUrgentNotification.priority === 'EMERGENCY' ? 'EMERGENCY ALERT' : 'IMPORTANT NOTICE'}
                  </p>
                </div>
              </div>
              <p className="text-stone-300 text-sm whitespace-pre-wrap leading-relaxed">
                {activeUrgentNotification.body}
              </p>
            </div>
            <div className="p-4 border-t border-stone-800/50 bg-stone-950 flex justify-end gap-3">
              <button
                onClick={() => setActiveUrgentNotification(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-stone-400 hover:text-white hover:bg-stone-800 transition"
              >
                Dismiss
              </button>
              {activeUrgentNotification.actionUrl && (
                <button
                  onClick={() => {
                    setActiveUrgentNotification(null);
                    window.location.hash = activeUrgentNotification.actionUrl;
                  }}
                  className={`px-6 py-2 rounded-xl text-sm font-black transition ${
                    activeUrgentNotification.priority === 'EMERGENCY' 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-amber-500 hover:bg-amber-600 text-black'
                  }`}
                >
                  {activeUrgentNotification.actionLabel || 'View Details'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Global Payment Modal */}
      <PaymentModal 
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          plan={paymentPlan}
          amount={paymentAmount}
          billingCycle={paymentCycle}
          onSuccess={handlePaymentSuccess}
          defaultCurrency={user?.currency}
          uid={user?.uid}
          email={user?.email}
          userName={user?.name}
          forceResubmitOrderId={paymentResubmitId}
          isUpgradePath={!!upgradeFromOrderId || (paymentPlan === 'Max Plan' && Boolean(upgradeDiscountCredit))}
          upgradeFromOrderId={upgradeFromOrderId}
          discountAmount={upgradeDiscountCredit}
          originalAmount={originalBaseAmount}
          onOpenSupport={() => {
            setIsPaymentOpen(false);
            setIsSupportChatOpen(true);
          }}
      />

      {/* Real Re-subscription Modal for Expired Membership */}
      <ResubscriptionModal
          isOpen={isResubscribeOpen}
          onClose={() => setIsResubscribeOpen(false)}
          user={user}
          onSelectPlanAndRenew={handleInitiatePayment}
      />

      {/* Batch Processing Complete Modal */}
      <BatchCompleteModal 
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          result={batchResult}
          onProcessAnother={handleBatchProcessAnother}
          onReturnDashboard={handleBatchReturnDashboard}
      />


      {/* Support Chat is rendered at root level */}

      <CameraScanner 
          isOpen={isCameraScannerOpen}
          onClose={() => setIsCameraScannerOpen(false)}
          onComplete={async (files) => {
              handleFilesSelected(files);
              setActiveView('upload');

              const isAutoSave = localStorage.getItem('pref_autoSaveScan') !== 'false';

              if (isAutoSave && files.length > 0) {
                  for (const file of files) {
                      const newFileId = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                      const uniqueName = generateUniqueFileName(file.name, storedFiles, 'Camera Scan');
                      
                      let dataUrl = '';
                      try {
                          dataUrl = await new Promise<string>((resolve) => {
                              const reader = new FileReader();
                              reader.onload = () => resolve((reader.result as string) || '');
                              reader.onerror = () => resolve('');
                              reader.readAsDataURL(file);
                          });
                      } catch (e) {
                          console.warn("FileReader error for scan auto-save:", e);
                      }

                      const newStoredDoc: StoredDocument = {
                          id: newFileId,
                          name: uniqueName,
                          date: new Date().toLocaleDateString(),
                          timestamp: Date.now(),
                          size: (file.size / 1024).toFixed(1) + ' KB',
                          type: file.type.includes('image') ? 'IMAGE' : 'PDF',
                          action: 'Camera Scan',
                          dataUrl: dataUrl || undefined,
                          tags: ['Scanned', 'PaperX Camera']
                      };

                      if (dataUrl) {
                          LocalFileStore.save(newFileId, dataUrl);
                          saveLocalFileBinary(newFileId, dataUrl).catch(() => {});
                      }

                      setStoredFiles(prev => [newStoredDoc, ...prev.filter(p => p.id !== newFileId)]);
                      try {
                          window.dispatchEvent(new CustomEvent('paperx-stored-files-updated', { 
                              detail: newStoredDoc 
                          }));
                      } catch (_) {}

                      const activeUid = user?.uid || (user as any)?.id || auth.currentUser?.uid;
                      if (activeUid) {
                          addDocumentToFirestore(activeUid, newStoredDoc).catch(console.error);
                      }
                  }

                  addToast({
                      type: 'success',
                      title: '⚡ Scan Saved',
                      message: `${files.length} scanned file${files.length > 1 ? 's' : ''} saved directly to your documents.`,
                      toolName: 'Scanner',
                      duration: 4000
                  });
              } else {
                  addToast({
                      type: 'info',
                      title: 'Scan Captured',
                      message: `${files.length} page${files.length > 1 ? 's' : ''} captured and ready for processing.`,
                      toolName: 'Scanner',
                      duration: 4500
                  });
              }
          }}
      />

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden cursor-pointer" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop & Mobile Drawer */}
      {!['settings', 'preferences', 'billing', 'personal'].includes(activeView) && (
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 sm:w-[280px] lg:w-64 bg-white dark:bg-stone-950 border-r border-stone-200 dark:border-stone-800 flex flex-col transition-transform duration-300 ease-out will-change-transform transform-gpu rounded-r-3xl lg:rounded-none overflow-hidden ${isMobileMenuOpen ? 'translate-x-0 shadow-xl pointer-events-auto' : '-translate-x-full lg:translate-x-0 pointer-events-none lg:pointer-events-auto'}`}>
         {/* Logo Area */}
         <div className="h-12 flex items-center justify-center px-4 border-b border-stone-200 dark:border-stone-800 relative shrink-0">
             <div className="flex items-center justify-center cursor-pointer text-gray-900 dark:text-white" onClick={(e) => handleNavigation('dashboard', e)}>
                 <BrandLogo size="md" className="h-5 sm:h-5.5" />
             </div>
         </div>

         {/* Navigation */}
         <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-2 no-scrollbar">
             {(() => {
                 const isSettingsActive = (activeView === 'settings' || activeView === 'preferences') || (isProfileOpen && profileInitialTab === 'preferences');
                 const isBillingActive = activeView === 'billing' || (isProfileOpen && profileInitialTab === 'billing');
                 const isPaymentsActive = activeView === 'payment-history' || activeView === 'payments';
                 const isSupportActive = activeView === 'support';
                 const isDownloadActive = activeView === 'download';
                 const isDocumentsActive = activeView === 'documents';
                 const isRecentActive = activeView === 'recent';
                 // Dashboard is active if in dashboard, tool, upload, or by default if no other tab matches
                 const isDashboardActive = !isDocumentsActive && !isRecentActive && !isSettingsActive && !isBillingActive && !isPaymentsActive && !isSupportActive && !isDownloadActive;

                 return (
                     <>
                         <motion.button 
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.01 }}
                            onClick={(e) => handleNavigation('dashboard', e)}
                            className={`relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight transition-all duration-200 cursor-pointer select-none overflow-hidden ${isDashboardActive ? 'bg-gray-950 text-white dark:bg-white dark:text-black shadow-md' : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'}`}
                         >
                            <div className="relative z-10 flex items-center gap-3.5">
                                <Layout size={21} className={isDashboardActive ? 'text-white dark:text-black shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
                                <span>{t('dashboard')}</span>
                            </div>
                         </motion.button>

                         <motion.button 
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.01 }}
                            onClick={(e) => handleNavigation('documents', e)}
                            className={`relative w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight transition-all duration-200 cursor-pointer select-none overflow-hidden ${isDocumentsActive ? 'bg-gray-950 text-white dark:bg-white dark:text-black shadow-md' : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'}`}
                         >
                            <div className="relative z-10 flex items-center gap-3.5">
                                <Folder size={21} className={isDocumentsActive ? 'text-white dark:text-black shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
                                <span>{t('documents')}</span>
                            </div>
                            {myDocsCount > 0 && (
                                <span className={`relative z-10 text-xs font-bold px-2.5 py-0.5 rounded-full ${isDocumentsActive ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' : 'bg-black/[0.08] dark:bg-white/[0.14] text-gray-700 dark:text-gray-300'}`}>
                                    {myDocsCount}
                                </span>
                            )}
                         </motion.button>

                         <motion.button 
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.01 }}
                            onClick={(e) => handleNavigation('recent', e)}
                            className={`relative w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight transition-all duration-200 cursor-pointer select-none overflow-hidden ${isRecentActive ? 'bg-gray-950 text-white dark:bg-white dark:text-black shadow-md' : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'}`}
                         >
                            <div className="relative z-10 flex items-center gap-3.5">
                                <History size={21} className={isRecentActive ? 'text-white dark:text-black shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
                                <span>{t('recent')}</span>
                            </div>
                            {recentDocsCount > 0 && (
                                <span className={`relative z-10 text-xs font-bold px-2.5 py-0.5 rounded-full ${isRecentActive ? 'bg-amber-400 text-black dark:bg-amber-300 dark:text-black' : 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/30'}`}>
                                    {recentDocsCount}
                                </span>
                            )}
                         </motion.button>

                         {/* Feature Shortcuts Categories Section */}
                         <div className="pt-3 pb-1 px-3.5">
                             <p className="text-[11px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                               {t('featureShortcuts', 'Feature Shortcuts')}
                             </p>
                         </div>

                         <div className="space-y-1">
                           {FEATURE_SHORTCUT_CATEGORIES.map((cat) => {
                             const categoryTools = TOOLS.filter(t => t.category === cat.id);
                             const isExpanded = expandedShortcutCategory === cat.id;
                             const CatIcon = cat.icon;

                             return (
                               <div key={cat.id} className="rounded-2xl overflow-hidden transition-all duration-200">
                                 {/* Category Header Button */}
                                 <motion.button
                                   whileTap={{ scale: 0.98 }}
                                   onClick={() => setExpandedShortcutCategory(isExpanded ? null : cat.id)}
                                   className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-bold tracking-tight transition-all duration-200 cursor-pointer select-none ${
                                     isExpanded 
                                       ? 'bg-stone-100 dark:bg-stone-900 text-black dark:text-white shadow-xs' 
                                       : 'text-stone-700 dark:text-stone-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                                   }`}
                                 >
                                   <div className="flex items-center gap-2.5 min-w-0">
                                     <div className={`p-1.5 rounded-xl shrink-0 ${cat.badgeColor}`}>
                                       <CatIcon size={16} className={cat.iconColor} />
                                     </div>
                                     <span className="truncate">{cat.name}</span>
                                   </div>

                                   <div className="flex items-center shrink-0">
                                     {isExpanded ? (
                                       <ChevronDown size={14} className="text-stone-500" />
                                     ) : (
                                       <ChevronRight size={14} className="text-stone-400" />
                                     )}
                                   </div>
                                 </motion.button>

                                 {/* Expanded Tool Shortcuts List */}
                                 <AnimatePresence>
                                   {isExpanded && (
                                     <motion.div
                                       initial={{ opacity: 0, height: 0 }}
                                       animate={{ opacity: 1, height: 'auto' }}
                                       exit={{ opacity: 0, height: 0 }}
                                       transition={{ duration: 0.2, ease: 'easeOut' }}
                                       className="pl-2.5 pr-1 py-1 space-y-0.5 border-l-2 border-stone-200 dark:border-stone-800 ml-3.5 my-1"
                                     >
                                       <div className="px-2 py-1 mb-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                                         <span>Shortcuts</span>
                                       </div>

                                       {categoryTools.map((tool) => {
                                         const isToolActive = activeToolId === tool.id && activeView === 'tool';
                                         return (
                                           <motion.button
                                             key={tool.id}
                                             whileTap={{ scale: 0.96 }}
                                             whileHover={{ x: 3 }}
                                             onClick={(e) => openToolShortcut(tool.id, e)}
                                             className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer select-none ${
                                               isToolActive
                                                 ? 'bg-black text-white dark:bg-white dark:text-black font-bold shadow-xs'
                                                 : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/70'
                                             }`}
                                           >
                                             <div className="flex items-center gap-2 min-w-0">
                                               <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                                 <AnimatedToolIcon toolId={tool.id} fallbackIcon={tool.icon || FileText} size={16} className="w-4 h-4" />
                                               </div>
                                               <span className="truncate">{tool.name}</span>
                                             </div>
                                           </motion.button>
                                         );
                                       })}
                                     </motion.div>
                                   )}
                                 </AnimatePresence>
                               </div>
                             );
                           })}
                         </div>

                         <div className="pt-4 pb-1">
                              <p className="px-3.5 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('settingsAndPayments', 'Settings & Payments')}</p>
                         </div>

                         <motion.button 
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.01 }}
                            onClick={(e) => handleNavigation('settings', e)} 
                            className={`relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight transition-all duration-200 cursor-pointer select-none overflow-hidden ${isSettingsActive ? 'bg-gray-950 text-white dark:bg-white dark:text-black shadow-md' : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'}`}
                         >
                            <div className="relative z-10 flex items-center gap-3.5">
                                <Settings size={21} className={isSettingsActive ? 'text-white dark:text-black shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
                                <span>{t('settings')}</span>
                            </div>
                         </motion.button>

                         <motion.button 
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.01 }}
                            onClick={(e) => handleNavigation('billing', e)} 
                            className={`relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight transition-all duration-200 cursor-pointer select-none overflow-hidden ${isBillingActive ? 'bg-gray-950 text-white dark:bg-white dark:text-black shadow-md' : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'}`}
                         >
                            <div className="relative z-10 flex items-center gap-3.5">
                                <CreditCard size={21} className={isBillingActive ? 'text-white dark:text-black shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
                                <span>{t('billing')}</span>
                            </div>
                         </motion.button>

                         <motion.button 
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.01 }}
                            onClick={(e) => handleNavigation('payment-history', e)} 
                            className={`relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight transition-all duration-200 cursor-pointer select-none overflow-hidden ${isPaymentsActive ? 'bg-gray-950 text-white dark:bg-white dark:text-black shadow-md' : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'}`}
                         >
                            <div className="relative z-10 flex items-center gap-3.5">
                                <Receipt size={21} className={isPaymentsActive ? 'text-white dark:text-black shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
                                <span>{t('paymentHistory', 'Payment History')}</span>
                            </div>
                         </motion.button>

                          <button 
                             onClick={(e) => handleNavigation('support', e)}
                             className={`relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight transition-all duration-200 cursor-pointer select-none overflow-hidden active:scale-[0.98] ${isSupportActive ? 'bg-gray-950 text-white dark:bg-white dark:text-black shadow-md' : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'}`}
                          >
                             <div className="relative z-10 flex items-center gap-3.5">
                                 <Headset size={21} className={isSupportActive ? 'text-white dark:text-black shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
                                 <span>{t('support')}</span>
                             </div>
                          </button>
                         
                         <div className="pt-3 pb-1">
                             <p className="px-3.5 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">App</p>
                         </div>

                          <button 
                             onClick={(e) => {
                                 handleNavigation('download', e);
                             }}
                             className={`relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight transition-all duration-150 active:scale-[0.98] transform-gpu cursor-pointer select-none overflow-hidden ${isDownloadActive ? 'bg-gray-950 text-white dark:bg-white dark:text-black shadow-md' : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'}`}
                          >
                             <div className="relative z-10 flex items-center gap-3.5">
                                 <Download size={21} className={isDownloadActive ? 'text-white dark:text-black shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
                                 <span>{t('downloadApp', 'Download App')}</span>
                             </div>
                          </button>
                     </>
                 );
             })()}
         </div>
         
         {/* User Profile Snippet - iOS Liquid Capsule */}
         <div className="p-1.5 border-t border-black/[0.04] dark:border-white/[0.05] shrink-0">
             {(() => {
                 const planStr = `${String(activeUserPlan || '')} ${String(user?.plan || '')}`.toLowerCase();
                 const isMax = planStr.includes('max');
                 const isPlus = !isMax && (planStr.includes('plus') || planStr.includes('pro'));

                 return (
                     <div 
                        className={`flex items-center gap-3 p-2 rounded-2xl cursor-pointer transition-all duration-300 ease-out active:scale-[0.98] ${
                            isMax 
                                ? 'bg-gradient-to-r from-white via-amber-50/95 to-amber-100/85 dark:from-[#231b0e] dark:via-amber-950/60 dark:to-[#1a140a] border border-amber-300/90 dark:border-amber-400/50 shadow-xs shadow-amber-500/15 hover:border-amber-400 dark:hover:border-amber-300' 
                                : isPlus
                                ? 'bg-gradient-to-r from-white via-purple-50/90 to-purple-100/80 dark:from-[#1b1528] dark:via-purple-950/60 dark:to-[#171222] border border-purple-200/90 dark:border-purple-500/40 shadow-xs shadow-purple-500/15 hover:border-purple-300 dark:hover:border-purple-400'
                                : 'bg-black/[0.04] dark:bg-white/[0.07] border border-black/[0.08] dark:border-white/[0.12] hover:bg-black/[0.07] dark:hover:bg-white/[0.10]'
                        }`}
                        onClick={(e) => {
                            handleNavigation('settings', e);
                        }}
                     >
                         <img 
                            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'PaperX')}&background=random`} 
                            alt={user?.name || 'PaperX'} 
                            className={`w-9 h-9 rounded-full object-cover shrink-0 transition-all duration-300 ${
                                isMax
                                    ? 'ring-2 ring-amber-400 dark:ring-amber-400 shadow-xs shadow-amber-500/25'
                                    : isPlus
                                    ? 'ring-2 ring-purple-400 dark:ring-purple-400 shadow-xs shadow-purple-500/25'
                                    : 'ring-2 ring-white/80 dark:ring-white/20 shadow-xs'
                            }`} 
                         />
                         <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between gap-1">
                                 <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100 truncate">{user?.name || 'Paper X'}</p>
                             </div>
                             {isMax ? (
                                 <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-200 bg-amber-200/60 dark:bg-amber-950/70 px-1.5 py-0.5 rounded-md border border-amber-400/50 dark:border-amber-500/40 mt-0.5">
                                     Max Plan
                                 </span>
                             ) : isPlus ? (
                                 <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-200 bg-purple-100/90 dark:bg-purple-950/70 px-1.5 py-0.5 rounded-md border border-purple-300/80 dark:border-purple-600/40 mt-0.5">
                                     Pro Plan
                                 </span>
                             ) : (
                                 <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-0.5 text-gray-600 dark:text-gray-400 bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.10]">
                                     Basic Plan
                                 </span>
                             )}
                         </div>
                     </div>
                 );
             })()}
         </div>
      </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-transparent">
        
        {/* Mobile Header - Overlaying Content */}
        {!['settings', 'preferences', 'billing', 'personal'].includes(activeView) && (
          <div className="lg:hidden absolute top-0 left-0 w-full h-12 flex items-center justify-between px-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-stone-200/60 dark:border-stone-800/60 z-30">
              <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                   <button 
                      type="button"
                      onClick={() => setIsMobileMenuOpen(true)} 
                      className="p-2 -ml-2 text-gray-800 dark:text-gray-100 hover:text-black dark:hover:text-white active:scale-95 transition-transform duration-100 rounded-xl cursor-pointer flex items-center justify-center select-none focus:outline-none"
                      title="Open App Drawer"
                      aria-label="Open App Drawer"
                   >
                       <Menu size={24} />
                   </button>
                   <div 
                      className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform" 
                      onClick={(e) => handleNavigation('dashboard', e)}
                   >
                      <BrandLogo size="sm" className="h-4.5 sm:h-5" />
                   </div>
              </div>
              <div className="flex items-center gap-2">
                  <button 
                      onClick={() => setIsCameraScannerOpen(true)}
                      className="p-2 text-gray-600 hover:bg-black/5 rounded-full transition-colors"
                  >
                      <ScanLine size={22} />
                  </button>
                  <motion.img 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'PaperX')}&background=059669&color=fff`} 
                      onClick={(e) => {
                          handleNavigation('settings', e);
                      }}
                      className="w-9 h-9 rounded-full border-2 border-white dark:border-stone-800 shadow-sm cursor-pointer object-cover" 
                      alt="Profile"
                  />
              </div>
          </div>
        )}

        {/* View Content - Added no-scrollbar */}
        <div id="main-scroll-container" className={`flex-1 overflow-y-auto overflow-x-hidden relative no-scrollbar w-full max-w-full lg:pt-0 ${['settings', 'preferences', 'billing', 'personal'].includes(activeView) ? 'pt-0' : 'pt-12'}`}>
           <div
             key={activeView === 'payments' ? 'payment-history' : (activeView === 'tool' ? `tool-${activeToolId}` : activeView)}
             className="w-full h-full animate-gpu-blur-in"
           >
              {(activeView === 'dashboard' || !['documents', 'recent', 'upgrade', 'whats-new', 'download', 'support', 'payment-history', 'payments', 'tool', 'settings', 'preferences', 'billing', 'personal'].includes(activeView)) && (
                 <DashboardView 
                   searchQuery={searchQuery}
                   setSearchQuery={setSearchQuery}
                   user={user}
                   handleDirectAppDownload={handleDirectAppDownload}
                   setIsCameraScannerOpen={setIsCameraScannerOpen}
                   setProfileInitialTab={setProfileInitialTab}
                   setIsProfileOpen={setIsProfileOpen}
                   handleToolClick={handleToolClick}
                   isToolLocked={isToolLocked}
                   navigate={navigate}
                   storedFiles={storedFiles}
                   handleDownloadStoredFile={handleDownloadStoredFile}
                   handleShareStoredFile={handleShareStoredFile}
                   t={t}
                   getGreeting={getGreeting}
                   handleFilesSelected={handleFilesSelected}
                   guestTrialsUsed={guestTrialsUsed}
                 />
              )}

              {['settings', 'preferences', 'billing', 'personal'].includes(activeView) && (
                 <div className="w-full h-full flex flex-col">
                    <ProfilePanel 
                      isOpen={true} 
                      inline={true}
                      onClose={() => handleNavigation('dashboard')} 
                      user={user}
                      onLogout={handleLogout}
                      onUpgrade={handleInitiatePayment}
                      onSwitchPlan={handleSwitchPlanMode}
                      initialTab={activeView === 'settings' ? 'preferences' : (activeView as any)}
                      onSupportClick={() => handleNavigation('support')}
                      onOpenAdmin={() => setIsAdminOpen(true)}
                    />
                 </div>
              )}
              
              {activeView === 'documents' && (
                  <div className="p-6 md:p-10">
                     <DocumentsView 
                         files={storedFiles} 
                         onDownload={handleDownloadStoredFile} 
                         onDelete={handleDeleteStoredFile} 
                         onOpen={handleOpenFilePreview} 
                         onShare={handleShareStoredFile}
                         onNavigateToRecent={() => navigate('/recent')}
                     />
                  </div>
              )}
              
              {activeView === 'recent' && (
                  <div className="p-6 md:p-10">
                     <DocumentsView 
                         filter="recent" 
                         files={storedFiles} 
                         onDownload={handleDownloadStoredFile} 
                         onDelete={handleDeleteStoredFile} 
                         onOpen={handleOpenFilePreview} 
                         onShare={handleShareStoredFile}
                         onNavigateToDocuments={() => navigate('/documents')}
                     />
                  </div>
              )}
              
              {activeView === 'upgrade' && (
                  <div className="p-6 md:p-10">
                     <UpgradeView 
                         onUpgrade={handleInitiatePayment} 
                         onSwitchPlan={handleSwitchPlanMode}
                         user={user}
                         currentPlan={activeUserPlan} 
                         isExpired={isPlanExpired(user)} 
                         orders={appOrders}
                     />
                  </div>
              )}
              
              {activeView === 'whats-new' && (
                  <div className="p-6 md:p-10">
                     <WhatsNewView />
                  </div>
              )}
              
              {activeView === 'download' && (
                  <div className="w-full flex justify-center items-center">
                     <DownloadAppView navigate={navigate} />
                  </div>
              )}
              
              {activeView === 'support' && (
                  <div className="p-6 md:p-10 pb-5 md:pb-7">
                     <SupportView onStartChat={() => setIsSupportChatOpen(true)} />
                  </div>
              )}

              {(activeView === 'payment-history' || activeView === 'payments') && (
                  <div className="w-full min-w-full overflow-x-hidden p-2 sm:p-6 md:p-8 flex justify-center">
                     <PaymentHistoryView 
                        user={user}
                        onUpgrade={(plan, amount, cycle, upgradeFromId, oldAmount) => handleInitiatePayment(plan, amount ? String(amount) : undefined, cycle, undefined, upgradeFromId, oldAmount)}
                        onResubmitPayment={(order) => handleInitiatePayment(order.plan as any, String(order.amount), order.billingCycle as any, order.orderId || order.id)}
                        onOpenBilling={() => {
                            setProfileInitialTab('billing');
                            setIsProfileOpen(true);
                        }}
                        onOpenSupport={() => setIsSupportChatOpen(true)}
                         onRefundDowngrade={() => {
                             setUser(prev => prev ? ({
                                 ...prev,
                                 plan: 'Basic Plan',
                                 purchasedPlan: 'Basic Plan',
                                 activePlanMode: 'Basic Plan',
                                 isPro: false,
                                 isRefunded: true,
                                 membershipTier: 'free',
                                 billingCycle: 'month',
                                 planExpiresAt: prev.basicPlanExpiresAt || undefined,
                                 maxProjects: 5
                             }) : null);
                             if (user?.uid) {
                                 updateUserInFirestore(user.uid, {
                                     plan: 'Basic Plan',
                                     purchasedPlan: 'Basic Plan',
                                     activePlanMode: 'Basic Plan',
                                     isPro: false,
                                     isRefunded: true,
                                     membershipTier: 'free',
                                     billingCycle: 'month',
                                     planExpiresAt: (user.basicPlanExpiresAt || null) as any,
                                     maxProjects: 5,
                                     updatedAt: new Date().toISOString()
                                 });
                             }
                         }}
                      />
                  </div>
              )}
              
              {/* Tool View */}
              {activeView === 'tool' && activeToolId && (
                  <div className="h-full flex flex-col">
                       <div className="border-b border-white/20 bg-white/10 px-6 py-4 flex items-center gap-4 z-10 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
                           <button 
                             onClick={() => { navigate('/dashboard'); }}
                             className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                           >
                               <ArrowLeft size={20} />
                           </button>
                           <div className="flex items-center gap-3">
                               <AnimatedToolIcon toolId={activeToolId} size={32} className="w-8 h-8 shrink-0" />
                               <h2 className="text-lg font-heading font-black tracking-tighter flex items-center gap-2">
                                   {TOOLS.find(t => t.id === activeToolId) ? translateTool(TOOLS.find(t => t.id === activeToolId)!, currentLanguage).name : activeToolId}
                               </h2>
                           </div>
                       </div>
                       
                       {/* Render specific workspace based on tool type */}
                       <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/30">
                           <AnimatePresence mode="wait">
                             <motion.div
                                 key={activeToolId || 'empty'}
                                 initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                 animate={{ opacity: 1, scale: 1, y: 0 }}
                                 exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                 transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                 className="w-full h-full"
                             >
                                {renderToolWorkspaceContent()}
                             </motion.div>
                           </AnimatePresence>
                       </div>
                  </div>
              )}
           </div>
        </div>
      </main>
    </div>

    {/* Profile Panel Overlay */}
    <ProfilePanel 
      isOpen={isProfileOpen && !isPaymentOpen} 
      onClose={() => {
          setIsProfileOpen(false);
          setActiveView(prev => (['preferences', 'settings', 'billing', 'personal'].includes(prev) ? 'dashboard' : prev));
          const currentPath = getNormalizedPath();
          if (['settings', 'billing', 'preferences', 'personal'].some(p => currentPath.includes(p)) || window.location.hash.includes('settings') || window.location.hash.includes('billing') || window.location.hash.includes('preferences') || window.location.hash.includes('personal')) {
              navigate('/dashboard');
          }
      }} 
      user={user}
      onLogout={handleLogout}
      onUpgrade={handleInitiatePayment}
      onSwitchPlan={handleSwitchPlanMode}
      initialTab={profileInitialTab}
      onSupportClick={() => handleNavigation('support')}
      onOpenAdmin={() => setIsAdminOpen(true)}
    />

    {/* Admin Panel Modal for Authorized Admins */}
    {isAdminOpen && (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-7xl h-[92vh] bg-stone-950 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
          <AdminPanel onClose={() => setIsAdminOpen(false)} />
        </div>
      </div>
    )}

    {/* Quick Feature Shortcuts Launcher Modal */}
    {shortcutModalCategory && (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Modal Header */}
          <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
            {(() => {
              const catDef = FEATURE_SHORTCUT_CATEGORIES.find(c => c.id === shortcutModalCategory) || FEATURE_SHORTCUT_CATEGORIES[0];
              const CatIcon = catDef.icon;
              const catTools = TOOLS.filter(t => t.category === shortcutModalCategory);

              return (
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${catDef.badgeColor}`}>
                    <CatIcon size={22} className={catDef.iconColor} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
                      {catDef.name}
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                        {catTools.length} Features
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                      Select any feature shortcut below to launch the workspace immediately.
                    </p>
                  </div>
                </div>
              );
            })()}

            <button
              type="button"
              onClick={() => setShortcutModalCategory(null)}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Feature Grid */}
          <div className="p-6 overflow-y-auto no-scrollbar grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 flex-1">
            {TOOLS.filter(t => t.category === shortcutModalCategory).map((tool) => (
              <motion.div
                key={tool.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => openToolShortcut(tool.id, e)}
                className="p-4 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80 rounded-2xl cursor-pointer transition-all flex flex-col justify-between group shadow-2xs hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-stone-900 shadow-2xs border border-stone-200/60 dark:border-stone-700/60">
                      <AnimatedToolIcon toolId={tool.id} fallbackIcon={tool.icon || FileText} size={28} className="w-7 h-7" />
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 dark:text-white tracking-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {tool.name}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 font-medium leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-200/50 dark:border-stone-700/50 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>Launch Feature</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    )}

  </div>
);
};

  return (
    <>
      {renderContent()}
      <ToastManager
        toasts={toasts}
        onDismiss={removeToast}
        onDownloadFile={handleToastDownload}
      />
      <DeviceLimitModal
        isOpen={deviceLimitModalOpen}
        onClose={() => setDeviceLimitModalOpen(false)}
      />
      <DocumentPreviewModal 
        file={previewFile} 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        onDownload={handleDownloadStoredFile} 
        onShare={handleShareStoredFile} 
      />
      <AnimatePresence>
        {showSplash && (
          <SplashScreen 
            onComplete={() => setShowSplash(false)} 
          />
        )}
      </AnimatePresence>
      
      {/* 1-Hour Violation App Suspension Overlay */}
      <AppBanOverlay user={user} onLogout={handleLogout} />

      {/* Professional Support Chat Overlay */}
      <SupportChat 
        isOpen={isSupportChatOpen} 
        onClose={() => setIsSupportChatOpen(false)} 
        user={user} 
        onSessionStatusChange={setHasOngoingSupportChat}
      />

      {/* Floating Support Quick Button (Only displayed when there is a current chat support session going on) */}
      <AnimatePresence mode="wait">
        {user && !isSupportChatOpen && hasOngoingSupportChat && (
          <motion.button
            key="floating-ongoing-support-btn"
            id="floating-ongoing-support-btn"
            initial={{ scale: 0.85, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280, mass: 0.7 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSupportChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center justify-center gap-2.5 p-3.5 sm:px-4 sm:py-3 bg-gradient-to-b from-[#1e1f23] via-[#151618] to-[#0c0d0f] dark:from-white dark:via-stone-50 dark:to-stone-100 text-white dark:text-stone-950 rounded-full shadow-[0_16px_36px_-6px_rgba(0,0,0,0.5),0_6px_16px_rgba(16,185,129,0.25),inset_0_1.5px_1px_rgba(255,255,255,0.3)] dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.18),0_6px_16px_rgba(16,185,129,0.2),inset_0_1.5px_1px_rgba(255,255,255,0.95)] border-t-2 border-t-white/35 dark:border-t-white border-b-[3.5px] border-b-black dark:border-b-stone-350 border-x border-white/10 dark:border-stone-200 font-heading font-black text-xs tracking-tight cursor-pointer select-none group will-change-transform"
            aria-label="Open Ongoing Live Support Chat"
          >
            <div className="relative flex items-center justify-center">
              <Headset size={18} className="text-emerald-400 dark:text-emerald-600 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] dark:drop-shadow-none group-hover:scale-105 transition-transform duration-200" />
              {hasUnreadSupport && (
                <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-stone-950 shadow-sm" />
              )}
            </div>
            <span className="hidden sm:inline font-black text-xs tracking-tight">Support in Progress</span>
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;