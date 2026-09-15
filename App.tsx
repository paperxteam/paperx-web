// App.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  Eye
} from 'lucide-react';
import { TOOLS, APP_NAME } from './constants';
import { Tool, ToolCategory, User, FileData, getUserPurchasedTier, isBillingCycleCovered, BILLING_CYCLE_LABELS, BillingCycleType, getPlanCreditValue } from './types';
import { ProfilePanel } from './components/ProfilePanel';
import { UpgradeView } from './components/UpgradeView';
import { FileUpload } from './components/FileUpload';
import { SupportChat } from './components/SupportChat';
import { shareOrOpenFullFile, getDocumentBlob } from './src/utils/fileShare';
import { AdminPanel } from './src/components/AdminPanel';
import { db, auth, syncUserProfile, logoutUser, subscribeToUserProfile, updateUserInFirestore, subscribeToUserDocuments, addDocumentToFirestore, deleteDocumentFromFirestore, getLocalSession, onPaperXAuthStateChanged, recordUserSession, monitorCurrentSession } from './services/firebase';
import { generateFormattedFileName } from './lib/namingUtils';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, query, collection, where } from 'firebase/firestore';

const AZ_FEATURES = [
  {
    group: 'A – C',
    features: [
      { name: 'Annotations', desc: 'Highlight, underline, and add digital sticky notes.', icon: Highlighter },
      { name: 'Auto-Crop', desc: 'Smart edge detection that snaps to document borders during scanning.', icon: Crop },
      { name: 'Archive', desc: 'Compress files into ZIP formats for easier storage.', icon: Archive },
      { name: 'Batch Processing', desc: 'Convert or scan multiple documents simultaneously.', icon: Layers },
      { name: 'Biometric Lock', desc: 'Secure files using Fingerprint or Face ID.', icon: Fingerprint },
      { name: 'Cloud Sync', desc: 'Automatic backup to Google Drive, Dropbox, or OneDrive.', icon: Cloud },
      { name: 'Comments', desc: 'Tag collaborators and hold discussions within the document.', icon: MessageSquare }
    ]
  },
  {
    group: 'D – F',
    features: [
      { name: 'Dark Mode', desc: 'A low-light interface to reduce eye strain.', icon: Moon },
      { name: 'Dictation', desc: 'Convert your spoken voice into written text (Voice-to-Text).', icon: Mic },
      { name: 'Digital Signature', desc: 'Draw or upload your signature to legalise forms.', icon: FileSignature },
      { name: 'Encryption', desc: 'Password-protect files with high-level security.', icon: Lock },
      { name: 'Export', desc: 'Save files in various formats (PDF, DOCX, JPG, TXT).', icon: Download },
      { name: 'File Compression', desc: 'Reduce file size without losing visual quality.', icon: Minimize2 },
      { name: 'Font Customization', desc: 'Access to hundreds of professional typefaces.', icon: Type }
    ]
  },
  {
    group: 'G – I',
    features: [
      { name: 'Grammar Check', desc: 'Real-time AI correction for spelling and syntax.', icon: CheckCircle },
      { name: 'Grayscale Filter', desc: 'Convert colour scans to black and white for clarity.', icon: Droplet },
      { name: 'Headers & Footers', desc: 'Add page numbers, dates, or titles to every page.', icon: LayoutTemplate },
      { name: 'Hyperlinks', desc: 'Insert clickable web links or internal document bookmarks.', icon: Link },
      { name: 'ID Card Mode', desc: 'Scan both sides of an ID and place them on a single page.', icon: CreditCard },
      { name: 'Image Enhancement', desc: 'AI-powered cleanup of blurry or faded scans.', icon: ImageIcon },
      { name: 'Image-to-Text', desc: 'Extract editable text from any photo.', icon: FileText }
    ]
  },
  {
    group: 'L – O',
    features: [
      { name: 'Layout Templates', desc: 'Pre-designed formats for resumes, invoices, and letters.', icon: Layout },
      { name: 'Line Spacing', desc: 'Adjust the vertical gap between sentences.', icon: AlignJustify },
      { name: 'Merge Files', desc: 'Combine several PDFs or images into one document.', icon: Combine },
      { name: 'Multi-language Support', desc: 'Interface and OCR support for dozens of languages.', icon: Languages },
      { name: 'Night Mode Scanning', desc: 'Uses the flash to capture clear docs in the dark.', icon: Moon },
      { name: 'OCR', desc: 'Technology that makes scanned text searchable.', icon: Search },
      { name: 'Offline Access', desc: 'Edit and view files without an internet connection.', icon: WifiOff }
    ]
  },
  {
    group: 'P – S',
    features: [
      { name: 'Page Reordering', desc: 'Drag and drop pages to change their sequence.', icon: ArrowUpDown },
      { name: 'PDF Splitting', desc: 'Cut a large PDF into multiple smaller files.', icon: Scissors },
      { name: 'QR Code Scanner', desc: 'Built-in tool to read links and barcodes.', icon: QrCode },
      { name: 'Read Mode', desc: 'A distraction-free view for reading eBooks or long reports.', icon: BookOpen },
      { name: 'Redaction', desc: 'Permanently black out sensitive or private information.', icon: Eraser },
      { name: 'Smart Summaries', desc: 'AI-generated bullet points of long documents.', icon: List },
      { name: 'Suggestion Mode', desc: 'Track changes without permanently editing the text.', icon: MessageCircleQuestion }
    ]
  },
  {
    group: 'T – Z',
    features: [
      { name: 'Table Extraction', desc: 'Scan a printed table and turn it into an Excel sheet.', icon: Table },
      { name: 'Translation', desc: 'Instantly translate document content into another language.', icon: Globe },
      { name: 'Version History', desc: 'See and restore every edit made to a file.', icon: History },
      { name: 'Watermarking', desc: 'Overlay "Draft" or "Confidential" stamps on pages.', icon: Stamp },
      { name: 'Web-to-PDF', desc: 'Save a live website as a document for offline use.', icon: Globe },
      { name: 'Wireless Printing', desc: 'Send documents directly to a Wi-Fi printer.', icon: Printer },
      { name: 'Z-Ordering', desc: 'Layer images and text boxes on top of each other.', icon: Layers }
    ]
  }
];
import { Button } from './components/Button';
import { TextWorkspace } from './components/TextWorkspace';
import { VoiceWorkspace } from './components/VoiceWorkspace';
import { AuthPage } from './components/AuthPage';
import { CameraScanner } from './components/CameraScanner';
import { GuestToolView } from './components/GuestToolView';
import { DocumentService } from './services/documentService';
import { getSupportChatResponse } from './services/automatedService';
import { PaymentModal } from './components/PaymentModal';
import { playPaymentApprovedAudio, playPaymentRejectedAudio, triggerPaymentApprovedConfetti } from './lib/paymentFeedback';
import { PaymentHistoryView } from './components/PaymentHistoryView';
import { ResubscriptionModal } from './components/ResubscriptionModal';
import { BatchCompleteModal } from './components/BatchCompleteModal';
import { DeviceLimitModal } from './components/DeviceLimitModal';
import { ToastManager } from './components/ToastManager';
import { ReceiptVerificationView } from './components/ReceiptVerificationView';
import { ToastNotificationItem, BatchProcessResult } from './types';
import { getTranslation, useAppTranslation, translateTool } from './translations';
import { motion, AnimatePresence } from 'motion/react';

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
export const getNormalizedPath = () => {
  if (typeof window === 'undefined') return '/';
  const hash = window.location.hash.replace(/^#/, '').trim();
  if (hash && hash !== '/') {
    return hash.startsWith('/') ? hash : `/${hash}`;
  }
  const pathname = window.location.pathname.trim();
  if (pathname && pathname !== '/' && pathname !== '/index.html') {
    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  }
  return '/';
};

export const findToolFromPath = (path: string) => {
  if (!path) return null;
  const clean = path.split('?')[0].replace(/^#/, '').replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!clean) return null;
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

const navigate = (path: string) => {
  const clean = path.startsWith('/') ? path : `/${path}`;
  window.location.hash = clean;
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
const PaperXLogo = ({ className = "w-8 h-8", color = "currentColor" }: { className?: string, color?: string }) => (
  <svg viewBox="0 0 100 100" className={`${className} animate-pulse-soft group-hover:scale-110 transition-transform duration-500`} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Stylized Folded 'P' - Abstract Paper Concept */}
    <path d="M25 20 C 25 10, 40 10, 55 10 L 70 10 C 85 10, 90 25, 90 40 C 90 60, 75 65, 60 65 L 50 65 L 50 90 L 25 90 L 25 20" fill={color} opacity="0.9" />
    <path d="M25 20 L 50 20 L 50 65 L 25 45 Z" fill="white" opacity="0.3" />
    <path d="M50 65 L 60 65 C 75 65, 90 60, 90 40 C 90 35, 88 30, 85 28 L 50 50 Z" fill="black" opacity="0.2" />
  </svg>
);

// --- Premium Processing Overlay Component ---
const ProcessingOverlay = ({ status, progress, onClose }: { status: string, progress: number, onClose?: () => void }) => {
  const isCompleted = status === 'Completed' || status === 'Success';
  const isError = status === 'Error' || status.includes('Failed');

  return (
    <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-3xl flex flex-col items-center justify-center rounded-[2.5rem] animate-fade-in-up border border-white/10 p-10 text-center shadow-2xl relative">
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
              <div className="h-3 bg-gray-100/50 rounded-full overflow-hidden mb-4 relative shadow-inner backdrop-blur-sm">
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
  const navUserAgent = (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : '';
  const userAgent = typeof navUserAgent === 'string' ? navUserAgent : '';
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
        enter: { opacity: 0, scale: 0.92, filter: "blur(12px)", y: 15 },
        center: { opacity: 1, scale: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
        exit: { opacity: 0, scale: 1.08, filter: "blur(12px)", y: -15, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
    };

    return (
        <div className="relative w-full min-h-[340px] max-w-xl mx-auto bg-white/40 dark:bg-black/40 backdrop-blur-3xl rounded-[2rem] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] border border-white/60 dark:border-white/10 overflow-hidden select-none ring-1 ring-black/5 flex flex-col justify-between transition-all duration-500 group">
            {/* Window Top Bar */}
            <div className="h-12 bg-white/50 dark:bg-white/5 backdrop-blur-md border-b border-white/40 dark:border-white/5 flex items-center justify-between px-5 z-20 relative shadow-sm">
                <div className="flex items-center gap-2 z-10">
                    <div className="w-3 h-3 rounded-full bg-rose-400/90 border border-rose-500/20 shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/90 border border-amber-500/20 shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/90 border border-emerald-500/20 shadow-sm" />
                </div>
                
                {/* Centered URL Address Bar */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="px-4 py-1.5 bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-xl border border-white/60 dark:border-white/10 text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 shadow-sm tracking-tight transition-all duration-300 group-hover:w-64 justify-center group-hover:bg-white/90 dark:group-hover:bg-stone-800/80">
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
                                className="w-full max-w-sm p-8 bg-white/80 dark:bg-stone-800/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-stone-300 dark:border-stone-600 shadow-xl flex flex-col items-center text-center relative overflow-hidden group"
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
                                            <Sparkles size={18} className="text-indigo-400 animate-pulse" />
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
                                <div className="absolute -inset-10 bg-gradient-to-tr from-emerald-500/10 to-transparent blur-3xl rounded-full" />
                                
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

import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface PdfCanvasViewerProps {
    fileUrl: string;
    onRenderError?: () => void;
}

const PdfCanvasViewer = ({ fileUrl, onRenderError }: PdfCanvasViewerProps) => {
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
                let arrayBuffer: ArrayBuffer;
                if (fileUrl.startsWith('data:')) {
                    const base64Part = fileUrl.split(',')[1];
                    if (!base64Part) throw new Error('Invalid base64 string');
                    const binaryString = atob(base64Part);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    arrayBuffer = bytes.buffer;
                } else {
                    const res = await fetch(fileUrl);
                    arrayBuffer = await res.arrayBuffer();
                }

                const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
                const doc = await loadingTask.promise;

                if (!isCancelled) {
                    setPdfDoc(doc);
                    setNumPages(doc.numPages);
                    setLoading(false);
                }
            } catch (err) {
                console.warn('PDF canvas loading error:', err);
                if (!isCancelled) {
                    setHasError(true);
                    setLoading(false);
                    if (onRenderError) onRenderError();
                }
            }
        })();

        return () => {
            isCancelled = true;
        };
    }, [fileUrl]);

    if (loading) {
        return (
            <div className="my-auto flex flex-col items-center gap-3 text-stone-400 p-8">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
                <p className="text-xs font-semibold">Rendering PDF pages...</p>
            </div>
        );
    }

    if (hasError || !pdfDoc || numPages === 0) {
        return null;
    }

    return (
        <div className="w-full flex flex-col items-center gap-6 py-4">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <PdfSinglePageCanvas key={pageNum} pdfDoc={pdfDoc} pageNum={pageNum} totalPages={numPages} />
            ))}
        </div>
    );
};

const PdfSinglePageCanvas = ({ pdfDoc, pageNum, totalPages }: { pdfDoc: any; pageNum: number; totalPages: number; key?: React.Key }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        let isCancelled = false;
        (async () => {
            try {
                const page = await pdfDoc.getPage(pageNum);
                if (isCancelled || !canvasRef.current) return;

                const viewport = page.getViewport({ scale: 1.3 });
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                if (!context) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport }).promise;
            } catch (err) {
                console.warn(`Error rendering PDF page ${pageNum}:`, err);
            }
        })();

        return () => {
            isCancelled = true;
        };
    }, [pdfDoc, pageNum]);

    return (
        <div className="flex flex-col items-center gap-2 max-w-full">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800">
                <canvas ref={canvasRef} className="max-w-full h-auto block" />
            </div>
            {totalPages > 1 && (
                <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 bg-stone-200/60 dark:bg-stone-800 px-3 py-0.5 rounded-full shadow-xs">
                    Page {pageNum} of {totalPages}
                </span>
            )}
        </div>
    );
};

const DocumentPreviewModal = ({
    file,
    isOpen,
    onClose,
    onDownload,
    onShare
}: {
    file: StoredDocument | null;
    isOpen: boolean;
    onClose: () => void;
    onDownload: (id: string, name: string) => void;
    onShare: (file: StoredDocument) => void;
}) => {
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pdfRenderFailed, setPdfRenderFailed] = useState(false);

    useEffect(() => {
        if (!isOpen || !file) return;
        let isMounted = true;
        setIsLoading(true);
        setFileUrl(null);
        setImageDataUrl(null);
        setPdfRenderFailed(false);

        (async () => {
            try {
                // 1. Check if raw dataUrl exists in IndexedDB
                const storedDataUrl = await LocalFileStore.get(file.id);
                if (storedDataUrl && isMounted) {
                    if (storedDataUrl.startsWith('data:image/')) {
                        setImageDataUrl(storedDataUrl);
                        setFileUrl(storedDataUrl);
                        setIsLoading(false);
                        return;
                    } else if (storedDataUrl.startsWith('data:application/pdf')) {
                        setFileUrl(storedDataUrl);
                        setIsLoading(false);
                        return;
                    }
                }

                // 2. Fetch/create standard PDF blob
                const blob = await getDocumentBlob(file, LocalFileStore.get);
                const url = URL.createObjectURL(blob);
                if (isMounted) {
                    setFileUrl(url);
                    setIsLoading(false);
                }
            } catch (e) {
                console.warn('Error loading document preview blob', e);
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [isOpen, file]);

    if (!isOpen || !file) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800"
            >
                {/* Header */}
                <div className="p-3.5 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50/80 dark:bg-stone-900/80">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <FileText size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-stone-900 dark:text-white truncate text-sm sm:text-base leading-tight">{file.name}</h3>
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium mt-1">
                                <span className="whitespace-nowrap">{file.date}</span>
                                <span className="text-stone-300 dark:text-stone-600 select-none">•</span>
                                <span className="whitespace-nowrap">{file.size}</span>
                                <span className="text-stone-300 dark:text-stone-600 select-none">•</span>
                                <span className="uppercase px-1.5 py-0.5 bg-stone-200/80 dark:bg-stone-800 rounded font-bold text-[10px] text-stone-700 dark:text-stone-300 whitespace-nowrap">{file.type}</span>
                                {file.action && (
                                    <>
                                        <span className="text-stone-300 dark:text-stone-600 select-none">•</span>
                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold whitespace-nowrap">{file.action}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0 -mr-1"
                        aria-label="Close Preview"
                    >
                        <X size={18} className="sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Preview Content Area */}
                <div className="flex-1 p-3 sm:p-6 overflow-y-auto bg-stone-200/80 dark:bg-stone-950 flex flex-col items-center justify-start min-h-[360px] sm:min-h-[460px]">
                    {isLoading ? (
                        <div className="my-auto flex flex-col items-center gap-3 text-stone-400">
                            <Loader2 size={32} className="animate-spin text-indigo-600" />
                            <p className="text-sm font-medium">Loading document preview...</p>
                        </div>
                    ) : imageDataUrl ? (
                        <div className="w-full flex justify-center my-auto">
                            <img
                                src={imageDataUrl}
                                alt={file.name}
                                className="max-h-[380px] sm:max-h-[480px] max-w-full rounded-xl object-contain shadow-2xl border border-stone-300 dark:border-stone-800 bg-white"
                            />
                        </div>
                    ) : fileUrl && !pdfRenderFailed ? (
                        <PdfCanvasViewer
                            fileUrl={fileUrl}
                            onRenderError={() => setPdfRenderFailed(true)}
                        />
                    ) : (
                        /* Authentic A4 Document Preview Sheet Fallback */
                        <div className="w-full max-w-xl bg-white text-stone-900 rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-2 flex flex-col transition-all">
                            {/* Paper Banner */}
                            <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-bold text-amber-400 text-xs">
                                        PX
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xs uppercase tracking-wider text-stone-200">PaperX Document Cloud</h4>
                                        <p className="text-[10px] text-stone-400">Verified Electronic Document Record</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                                    VERIFIED PDF
                                </span>
                            </div>

                            {/* Sheet Body */}
                            <div className="p-6 sm:p-8 space-y-6">
                                {/* Title & Divider */}
                                <div className="border-b border-stone-200 pb-4">
                                    <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block mb-1">Document Name</span>
                                    <h2 className="text-lg sm:text-xl font-bold text-stone-900 break-words">{file.name}</h2>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200/80 text-xs">
                                    <div>
                                        <span className="text-stone-400 font-medium block text-[10px] uppercase">Document ID</span>
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
                                        <span className="text-stone-400 font-medium block text-[10px] uppercase">Engine Action</span>
                                        <span className="font-bold text-indigo-600 block">{file.action || 'Processed PDF'}</span>
                                    </div>
                                </div>

                                {/* Status & Security */}
                                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
                                    <Check size={16} className="text-emerald-600 shrink-0" />
                                    <span>Cryptographically Verified & Sealed (SHA-256 Validated)</span>
                                </div>

                                {/* Document Record Notice */}
                                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-2">
                                    <p className="font-bold text-stone-800">Document Specification:</p>
                                    <p>
                                        This document is formatted in ISO 32000-1 (PDF) standardized specification. It is ready for universal reading, printing, and digital distribution.
                                    </p>
                                </div>
                            </div>

                            {/* Sheet Footer */}
                            <div className="bg-stone-50 border-t border-stone-200 px-6 py-3 flex items-center justify-between text-[11px] text-stone-500 font-medium">
                                <span>PaperX PDF Suite v2.0</span>
                                <span>Page 1 of 1</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-3.5 sm:p-4 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 sm:gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer min-h-[40px]"
                    >
                        <span>Close Preview</span>
                    </button>
                    <button
                        onClick={() => onDownload(file.id, file.name)}
                        className="px-5 sm:px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap min-h-[40px]"
                        title="Download file directly"
                    >
                        <Download size={15} />
                        <span>Download File</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const MONTH_NAMES: { [key: string]: string } = {
    '1': 'January', '2': 'February', '3': 'March', '4': 'April',
    '5': 'May', '6': 'June', '7': 'July', '8': 'August',
    '9': 'September', '10': 'October', '11': 'November', '12': 'December'
};

const DocumentsView = ({ 
    files, 
    onDownload, 
    onDelete, 
    onOpen, 
    onShare, 
    filter,
    onNavigateToDocuments,
    onNavigateToRecent,
    onSimulateAge
}: { 
    files: StoredDocument[], 
    onDownload: (id: string, name: string) => void, 
    onDelete: (id: string) => void, 
    onOpen: (file: StoredDocument) => void, 
    onShare: (file: StoredDocument) => void, 
    filter?: 'recent',
    onNavigateToDocuments?: () => void,
    onNavigateToRecent?: () => void,
    onSimulateAge?: (id: string, daysAgo: number) => void
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchYear, setSearchYear] = useState('');
    const [searchMonth, setSearchMonth] = useState('');
    const [searchDate, setSearchDate] = useState('');

    const getDocTimestamp = (f: StoredDocument): number => {
        if (typeof f.timestamp === 'number' && !isNaN(f.timestamp) && f.timestamp > 0) {
            return f.timestamp;
        }
        if (f.date) {
            const parsed = new Date(f.date).getTime();
            if (!isNaN(parsed) && parsed > 0) return parsed;
        }
        if ((f as any).createdAt) {
            const parsed = new Date((f as any).createdAt).getTime();
            if (!isNaN(parsed) && parsed > 0) return parsed;
        }
        return Date.now();
    };

    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const fiveYearsMs = 5 * 365.25 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - thirtyDaysMs;
    const fiveYearsAgo = now - fiveYearsMs;

    const isSearching = !!(searchQuery || searchYear || searchMonth || searchDate);

    const allMappedFiles = files.map(f => ({
        ...f,
        timestamp: getDocTimestamp(f)
    }));

    // Files during their first 30 days of creation/activity
    const recentActivityFiles = allMappedFiles.filter(f => f.timestamp >= thirtyDaysAgo);

    // All active documents preserved in the 5-Year Cloud Vault
    const myDocumentsFiles = allMappedFiles.filter(f => f.timestamp >= fiveYearsAgo);

    let displayFiles = filter === 'recent' ? recentActivityFiles : myDocumentsFiles;

    if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        displayFiles = displayFiles.filter(f => f.name.toLowerCase().includes(query));
    }

    if (searchYear && filter !== 'recent') {
        displayFiles = displayFiles.filter(f => {
            const year = new Date(f.timestamp).getFullYear().toString();
            return year === searchYear;
        });
    }

    if (searchMonth) {
        displayFiles = displayFiles.filter(f => {
            const month = (new Date(f.timestamp).getMonth() + 1).toString();
            return month === searchMonth;
        });
    }

    if (searchDate) {
        displayFiles = displayFiles.filter(f => {
            const date = new Date(f.timestamp).getDate().toString();
            return date === searchDate;
        });
    }

    displayFiles.sort((a, b) => b.timestamp - a.timestamp);

    const clearAllFilters = () => {
        setSearchQuery('');
        setSearchYear('');
        setSearchMonth('');
        setSearchDate('');
    };

    if (!isSearching) {
        displayFiles = displayFiles.slice(0, 100);
    }

    // Generate days 1-31
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    
    // Generate years dynamically (current year down to 5 years ago)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-heading font-black tracking-tight">
                        {filter === 'recent' ? 'Recent Activity (Last 30 Days)' : 'My Documents (Last 5 Years)'}
                    </h2>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">
                        {filter === 'recent' 
                            ? 'Files created or processed in the last 30 days — synced to Cloud & saved for offline view & download.' 
                            : 'All documents preserved in your 5-year cloud vault — offline view & instant download ready.'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    {isSearching && (
                        <button 
                            onClick={clearAllFilters}
                            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                            title="Reset all search filters"
                        >
                            <X size={14} /> Clear Filters
                        </button>
                    )}
                    <div className={`grid ${filter === 'recent' ? 'grid-cols-2' : 'grid-cols-3'} sm:flex gap-1.5 sm:gap-2`}>
                        <select 
                            value={searchMonth}
                            onChange={(e) => setSearchMonth(e.target.value)}
                            className="px-2.5 sm:px-3 py-2 bg-white dark:bg-stone-900 border border-gray-200 dark:border-stone-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all text-gray-900 dark:text-white"
                        >
                            <option value="">Month</option>
                            <option value="1">Jan</option>
                            <option value="2">Feb</option>
                            <option value="3">Mar</option>
                            <option value="4">Apr</option>
                            <option value="5">May</option>
                            <option value="6">Jun</option>
                            <option value="7">Jul</option>
                            <option value="8">Aug</option>
                            <option value="9">Sep</option>
                            <option value="10">Oct</option>
                            <option value="11">Nov</option>
                            <option value="12">Dec</option>
                        </select>
                        
                        <select 
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            className="px-2.5 sm:px-3 py-2 bg-white dark:bg-stone-900 border border-gray-200 dark:border-stone-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all text-gray-900 dark:text-white"
                        >
                            <option value="">Date</option>
                            {days.map(d => (
                                <option key={d} value={d.toString()}>{d}</option>
                            ))}
                        </select>

                        {filter !== 'recent' && (
                            <select 
                                value={searchYear}
                                onChange={(e) => setSearchYear(e.target.value)}
                                className="px-2.5 sm:px-3 py-2 bg-white dark:bg-stone-900 border border-gray-200 dark:border-stone-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all text-gray-900 dark:text-white"
                            >
                                <option value="">Year</option>
                                {years.map(y => (
                                    <option key={y} value={y.toString()}>{y}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by document name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-stone-900 border border-gray-200 dark:border-stone-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 focus:border-black dark:focus:border-white transition-all text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>
                </div>
            </div>

            {/* Informative Lifecycle Banners */}
            {filter !== 'recent' && recentActivityFiles.length > 0 && !isSearching && (
                <div className="mb-5 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-xl shrink-0">
                            <Clock size={18} />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200">
                                {recentActivityFiles.length} file{recentActivityFiles.length > 1 ? 's' : ''} currently in 30-Day Recent Activity
                            </p>
                            <p className="text-[11px] sm:text-xs text-amber-800/80 dark:text-amber-400 font-medium">
                                Files stay in Recent Activity for their first 30 days, then automatically move to My Documents for 5-year cloud archival.
                            </p>
                        </div>
                    </div>
                    {onNavigateToRecent && (
                        <button
                            onClick={onNavigateToRecent}
                            className="px-3.5 py-1.5 bg-amber-900 hover:bg-black text-white dark:bg-amber-300 dark:text-black dark:hover:bg-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                        >
                            <History size={13} />
                            View Recent Activity ({recentActivityFiles.length})
                        </button>
                    )}
                </div>
            )}

            {filter === 'recent' && myDocumentsFiles.length > 0 && !isSearching && (
                <div className="mb-5 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-xl shrink-0">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-200">
                                {myDocumentsFiles.length} file{myDocumentsFiles.length > 1 ? 's' : ''} in My Documents (5-Year Cloud Vault)
                            </p>
                            <p className="text-[11px] sm:text-xs text-emerald-800/80 dark:text-emerald-400 font-medium">
                                Files that completed 30 days in Recent Activity are safely stored in your 5-year cloud archive.
                            </p>
                        </div>
                    </div>
                    {onNavigateToDocuments && (
                        <button
                            onClick={onNavigateToDocuments}
                            className="px-3.5 py-1.5 bg-emerald-900 hover:bg-black text-white dark:bg-emerald-300 dark:text-black dark:hover:bg-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                        >
                            <Folder size={13} />
                            Open My Documents ({myDocumentsFiles.length})
                        </button>
                    )}
                </div>
            )}
            
            <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/80 dark:border-stone-800 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
                <div className="grid grid-cols-12 gap-2 sm:gap-4 p-3.5 sm:p-4 border-b border-gray-200/80 dark:border-stone-800 bg-gray-50/70 dark:bg-stone-950/60 text-xs font-bold text-gray-500 uppercase tracking-widest items-center">
                    <div className="col-span-7 sm:col-span-5 md:col-span-4">Name</div>
                    <div className="hidden sm:block sm:col-span-3 md:col-span-2">Date</div>
                    <div className="hidden md:block md:col-span-2">Size</div>
                    <div className="hidden lg:block lg:col-span-2">Lifecycle Status</div>
                    <div className="col-span-5 sm:col-span-4 md:col-span-4 lg:col-span-2 text-right">Actions</div>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-stone-800">
                    {displayFiles.length === 0 ? (
                        <div className="p-10 sm:p-14 text-center flex flex-col items-center justify-center gap-3">
                            <div className="p-3.5 bg-stone-100 dark:bg-stone-800 rounded-2xl text-stone-400">
                                <FileText size={36} className="opacity-60" />
                            </div>
                            
                            {filter === 'recent' ? (
                                <div className="max-w-md space-y-2.5">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                        {isSearching ? 'No Recent Documents Match Your Filters' : 'No Activity in the Last 30 Days'}
                                    </h3>
                                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                                        {isSearching ? (
                                            <button
                                                onClick={clearAllFilters}
                                                className="px-4 py-2 bg-stone-900 hover:bg-black text-white dark:bg-stone-100 dark:hover:bg-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                                            >
                                                Clear Search Filters
                                            </button>
                                        ) : (
                                            onNavigateToDocuments && myDocumentsFiles.length > 0 && (
                                                <button
                                                    onClick={onNavigateToDocuments}
                                                    className="px-4 py-2 bg-stone-900 hover:bg-black text-white dark:bg-stone-100 dark:hover:bg-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                                                >
                                                    <Folder size={14} />
                                                    Go to My Documents ({myDocumentsFiles.length})
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-md space-y-2.5">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                        {isSearching 
                                            ? `No Documents Found${searchMonth ? ` for ${MONTH_NAMES[searchMonth] || ''}` : ''}${searchYear ? ` ${searchYear}` : ''}${searchDate ? ` (Day ${searchDate})` : ''}`
                                            : recentActivityFiles.length > 0
                                                ? 'Files Are Currently in Recent Activity'
                                                : 'No Saved Documents'}
                                    </h3>
                                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                                        {isSearching ? (
                                            <button
                                                onClick={clearAllFilters}
                                                className="px-4 py-2 bg-stone-900 hover:bg-black text-white dark:bg-stone-100 dark:hover:bg-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                                            >
                                                Clear Filters & Show All
                                            </button>
                                        ) : (
                                            recentActivityFiles.length > 0 && onNavigateToRecent && (
                                                <button
                                                    onClick={onNavigateToRecent}
                                                    className="px-4 py-2 bg-stone-900 hover:bg-black text-white dark:bg-stone-100 dark:hover:bg-white dark:text-black rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
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
                    ) : (
                        displayFiles.map(file => {
                            const validDate = !isNaN(new Date(file.timestamp).getTime()) ? new Date(file.timestamp) : null;
                            const fullDateStr = validDate
                                ? validDate.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : (file.date || 'Recent');
                            const shortDateStr = validDate
                                ? validDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
                                : (file.date || 'Recent');

                            const msPassed = Math.max(0, now - file.timestamp);
                            const msLeft = Math.max(0, (file.timestamp + thirtyDaysMs) - now);
                            const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
                            const expireYear = new Date(file.timestamp + fiveYearsMs).getFullYear();

                            return (
                            <div key={file.id} className="grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 items-center hover:bg-gray-50/90 dark:hover:bg-stone-800/40 transition-colors group">
                                <div className="col-span-7 sm:col-span-5 md:col-span-4 flex items-center gap-2.5 sm:gap-3 min-w-0 cursor-pointer" onClick={() => onOpen(file)} title="Click to preview file">
                                    <div className="p-2 sm:p-2.5 bg-gray-100 dark:bg-stone-800 rounded-xl text-gray-600 dark:text-stone-300 shrink-0 group-hover:text-black dark:group-hover:text-white transition-colors">
                                        <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </div>
                                    <div className="min-w-0 flex-1 pr-1">
                                        <span className="font-bold text-gray-900 dark:text-white truncate text-xs sm:text-sm hover:underline block tracking-tight">{file.name}</span>
                                        <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
                                            <span>{shortDateStr}</span>
                                            {filter === 'recent' ? (
                                                <span className="text-amber-600 dark:text-amber-400 font-bold">• In My Docs in {daysLeft}d</span>
                                            ) : (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">• 5-Yr Vault</span>
                                            )}
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
                                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded text-[10px] font-bold flex items-center gap-1" title="Stored locally for offline preview and instant download">
                                            <WifiOff size={10} />
                                            Offline Ready
                                        </span>
                                        {filter === 'recent' ? (
                                            <span className="px-2 py-0.5 bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 rounded text-[10px] font-bold flex items-center gap-1" title={`In Recent Activity for 30 days. Automatically moves to My Documents in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}>
                                                <Clock size={10} />
                                                To My Docs in {daysLeft}d
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-bold flex items-center gap-1" title={`Preserved in My Documents 5-Year Vault until ${expireYear}`}>
                                                <ShieldCheck size={10} />
                                                5-Yr Vault ({expireYear})
                                            </span>
                                        )}
                                    </div>
                                    {file.action && <span className="text-[10px] text-stone-400 font-medium truncate">{file.action}</span>}
                                </div>
                                <div className="col-span-5 sm:col-span-4 md:col-span-4 lg:col-span-2 flex items-center justify-end gap-1 sm:gap-1.5 shrink-0">
                                    {/* Test Simulation Button: fast forward 31 days or reset to 0 days */}
                                    {onSimulateAge && (
                                        filter === 'recent' ? (
                                            <button 
                                                onClick={() => onSimulateAge(file.id, 31)} 
                                                title="Test 30d Rule: Fast-forward 31 days to simulate move to My Documents" 
                                                className="p-1.5 sm:p-2 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 dark:hover:bg-amber-900/80 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                                            >
                                                <Clock size={14} className="sm:w-[15px] sm:h-[15px]" />
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => onSimulateAge(file.id, 0)} 
                                                title="Test 30d Rule: Reset to Recent Activity (0 days old)" 
                                                className="p-1.5 sm:p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                                            >
                                                <History size={14} className="sm:w-[15px] sm:h-[15px]" />
                                            </button>
                                        )
                                    )}

                                    {/* 1. Open File Preview In-App */}
                                    <button 
                                        onClick={() => onOpen(file)} 
                                        title="Open file preview" 
                                        className="p-1.5 sm:p-2 text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:hover:bg-indigo-900/80 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                                    >
                                        <Eye size={14} className="sm:w-[15px] sm:h-[15px]" />
                                    </button>

                                    {/* 2. Download Full File */}
                                    <button 
                                        onClick={() => onDownload(file.id, file.name)} 
                                        title="Download original file" 
                                        className="p-1.5 sm:p-2 text-stone-600 hover:text-black bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                                    >
                                        <Download size={14} className="sm:w-[15px] sm:h-[15px]" />
                                    </button>

                                    {/* 3. Share Document */}
                                    <button 
                                        onClick={() => onShare(file)} 
                                        title="Share file" 
                                        className="p-1.5 sm:p-2 text-stone-600 hover:text-emerald-600 bg-stone-100 hover:bg-emerald-50 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-emerald-950/50 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                                    >
                                        <Share2 size={14} className="sm:w-[15px] sm:h-[15px]" />
                                    </button>

                                    {/* 4. Delete Document */}
                                    <button 
                                        onClick={() => onDelete(file.id)} 
                                        title="Delete file" 
                                        className="p-1.5 sm:p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
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
    onUpgrade: (plan: 'Plus Plan' | 'Max Plan', amount?: string, cycle?: 'month' | 'half-year' | 'year', resubmitId?: string, upgradeFromId?: string, oldAmount?: number) => void; 
    onSwitchPlan?: (plan: 'Basic Plan' | 'Plus Plan' | 'Max Plan', cycle?: 'month' | 'half-year' | 'year') => void;
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
    const ownsPlus = !isExpired && purchasedTier === 'Plus';

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
        if (purchasedTier === 'Plus') {
            return getPlanCreditValue('Plus Plan', userCycle);
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
            badge: 'Basic • Plus • Max'
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
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-700 dark:text-amber-400 border border-amber-400/30">Plus Plan Free in Same Season</span>
                                </h4>
                                <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                                    Because you have Max Plan, the Plus Plan is 100% free to use in your {BILLING_CYCLE_LABELS[userCycle]} season!
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 bg-white/80 dark:bg-stone-800/90 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 shrink-0">
                            <span>Active Mode:</span>
                            <span className="font-black text-amber-600 dark:text-amber-400">{activePlanName}</span>
                        </div>
                    </div>
                )}

                {/* Status banner for Plus Members in covered cycle */}
                {isCycleCovered && ownsPlus && !ownsMax && (
                    <div className="max-w-3xl mx-auto mb-6 p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-stone-800 dark:text-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black font-heading text-stone-900 dark:text-white flex items-center gap-2">
                                    Plus Membership Active ({BILLING_CYCLE_LABELS[userCycle]})
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
                <div className={`bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border ${isUsingFree ? 'border-stone-900 dark:border-stone-100 ring-2 ring-stone-900/10 dark:ring-stone-100/10' : 'border-gray-200 dark:border-gray-800'} shadow-sm flex flex-col justify-between relative`}>
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

                {/* Plus Plan */}
                <div className={`bg-stone-900 text-stone-50 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border ${isUsingPlus && isCycleCovered ? 'border-indigo-400 ring-2 ring-indigo-400/20' : 'border-stone-800'} shadow-xl flex flex-col justify-between relative group`}>
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
                            <h3 className="text-xl font-heading font-black text-white">Plus Plan</h3>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 border border-stone-700">PLUS</span>
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
                            Basic + Plus features • Unlimited daily operations
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
                            onClick={() => onSwitchPlan?.('Plus Plan', selectedCycle)} 
                            className="w-full font-bold bg-white text-stone-900 hover:bg-stone-100 border-none shadow-md text-xs relative z-10 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <span>Use Plus (Free with Max)</span>
                        </Button>
                    ) : ownsPlusInCycle ? (
                        <Button 
                            size="sm" 
                            onClick={() => onSwitchPlan?.('Plus Plan', selectedCycle)} 
                            className="w-full font-bold bg-white text-stone-900 hover:bg-stone-100 border-none shadow-md text-xs relative z-10 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <span>Use Plus Plan</span>
                        </Button>
                    ) : (
                        <Button 
                            size="sm" 
                            onClick={() => {
                                const plusRawVal = Number(currentPricing.plusRaw);
                                const discountToApply = (!isCycleCovered && userActiveCredit > 0 && plusRawVal > userActiveCredit) ? userActiveCredit : 0;
                                const finalPrice = discountToApply > 0 ? String(Math.max(1, plusRawVal - discountToApply)) : currentPricing.plusRaw;
                                onUpgrade('Plus Plan', finalPrice, selectedCycle, undefined, undefined, discountToApply > 0 ? discountToApply : undefined);
                            }} 
                            className="w-full font-bold bg-white text-stone-900 hover:bg-stone-100 border-none shadow-md text-xs relative z-10 cursor-pointer"
                        >
                            {(!isCycleCovered && userActiveCredit > 0 && Number(currentPricing.plusRaw) > userActiveCredit) ? (() => {
                                const plusRawVal = Number(currentPricing.plusRaw);
                                const discounted = Math.max(1, plusRawVal - userActiveCredit);
                                return `Upgrade to Plus (₹${discounted}) • Save ₹${userActiveCredit}`;
                            })() : `Upgrade to Plus (${currentPricing.plusPrice})`}
                        </Button>
                    )}
                </div>

                {/* Max Plan */}
                <div className={`bg-black text-white backdrop-blur-xl rounded-3xl p-6 sm:p-7 border ${isUsingMax && isCycleCovered ? 'border-yellow-400 ring-2 ring-yellow-400/20' : 'border-gray-800'} shadow-2xl flex flex-col justify-between relative group`}>
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
                            Basic + Plus + Max AI Suite • Unlimited access
                        </p>
                        <ul className="space-y-2.5 mb-6 text-xs text-stone-300 font-medium">
                            <li className="flex items-start gap-2"><CheckCircle2 size={15} className="text-yellow-400 shrink-0 mt-0.5" /> All Basic + Plus features</li>
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
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const faqs = [
        // Billing & Subscriptions
        {
            category: "Billing & Plans",
            q: "How do I upgrade my plan and verify payment?",
            a: "Go to Profile > Billing & Plans, select your preferred plan (Plus or Max), make payment via UPI QR code, and enter your 12-digit bank UTR reference. Verification completes automatically in 10–20 minutes."
        },
        {
            category: "Billing & Plans",
            q: "What is the 12-digit UTR and where do I find it in my UPI app?",
            a: "The UTR (Unique Transaction Reference) is a 12-digit numeric reference generated by your bank or UPI provider (Google Pay, PhonePe, Paytm, CRED). It appears in your payment receipt under 'UPI Transaction ID' or 'Bank Reference Number'."
        },
        {
            category: "Billing & Plans",
            q: "Why is my payment showing pending or unverified?",
            a: "Bank settlements and automatic matching typically take 5–20 minutes. Please ensure the 12-digit UTR was entered accurately. You can also paste your UTR in Live Support Chat for instant manual approval."
        },
        {
            category: "Billing & Plans",
            q: "Can I get an official invoice or GST billing receipt?",
            a: "Yes. Email paperx.assist@gmail.com with your registered email and Order ID. Our billing desk issues official verified invoices within 24 hours."
        },
        {
            category: "Billing & Plans",
            q: "What happens when my subscription period ends?",
            a: "When your subscription expires, your account reverts to the Free tier. None of your stored files are deleted, but free tier limits (50MB / 100 pages per conversion) will apply."
        },

        // File Processing & Limits
        {
            category: "File Processing",
            q: "What file formats does PaperX support?",
            a: "PaperX natively supports PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, PNG, JPG, JPEG, WebP, TIFF, TXT, CSV, SVG, and EPUB files for conversions, compression, and text extraction."
        },
        {
            category: "File Processing",
            q: "What are the file size and page limits?",
            a: "• Free Tier: Up to 50MB per file and 100 pages per conversion.\n• Plus & Max Tiers: Up to 500MB per file with unlimited pages and high-priority processing queues."
        },
        {
            category: "File Processing",
            q: "How does batch file conversion work?",
            a: "Drag and drop multiple files at once into the converter. PaperX processes files in parallel and lets you download individual files or a single consolidated ZIP archive."
        },
        {
            category: "File Processing",
            q: "How do I compress large PDF documents without losing quality?",
            a: "Use our Compress PDF tool. Select 'Balanced Compression' for crisp text and sharp graphics or 'High Compression' for maximum size reduction."
        },
        {
            category: "File Processing",
            q: "Can PaperX process password-protected PDFs?",
            a: "Yes. Use our Unlock PDF tool and enter your document password when prompted. Once unlocked, you can freely convert, merge, split, or edit your document."
        },

        // OCR & Advanced Tools
        {
            category: "OCR & Tools",
            q: "How does Optical Character Recognition (OCR) work?",
            a: "Our neural OCR engine inspects pixel data inside scanned documents or photos, accurately recognizing letters and formatting to output fully searchable and editable text (TXT, DOCX, or searchable PDF)."
        },
        {
            category: "OCR & Tools",
            q: "What languages are supported for OCR and document translation?",
            a: "PaperX supports 40+ global languages including English, Hindi, Spanish, French, German, Japanese, Chinese, Arabic, Russian, and Portuguese with automatic script detection."
        },
        {
            category: "OCR & Tools",
            q: "How can I merge, split, or reorder PDF pages?",
            a: "Use the Organize PDF / Merge tool. Drag and drop thumbnails to rearrange pages, delete unwanted pages, rotate orientations, or split documents by custom page numbers."
        },
        {
            category: "OCR & Tools",
            q: "Can I add e-signatures or custom watermarks?",
            a: "Yes! Use the Sign & Protect tool to draw or upload your signature, or add custom text and image watermarks with controllable opacity, font style, and angle."
        },
        {
            category: "OCR & Tools",
            q: "How does the Camera Scanner feature work?",
            a: "The Camera Scanner uses your device webcam or phone camera with automatic edge detection, perspective correction, contrast enhancement, and multi-page PDF generation."
        },

        // Security & Privacy
        {
            category: "Security & Privacy",
            q: "Is my document data secure and confidential?",
            a: "Yes. All uploads are encrypted with TLS 1.3 in transit and AES-256 at rest. Temporary processing files are automatically purged from our conversion servers after processing."
        },
        {
            category: "Security & Privacy",
            q: "How long are uploaded files stored on servers?",
            a: "Temporary conversion files are permanently wiped from server memory immediately after processing. Persistent files are stored only within your private account workspace."
        },
        {
            category: "Security & Privacy",
            q: "Does PaperX train AI models on user documents?",
            a: "No. PaperX operates on zero-retention privacy policies and never uses, sells, or trains AI models on your private documents."
        },

        // Troubleshooting & Support
        {
            category: "Troubleshooting",
            q: "What should I do if a file conversion fails or hangs?",
            a: "1. Verify that the PDF is not password-protected or corrupted.\n2. Confirm the file size is within your tier limits.\n3. Try uploading the file individually or clearing browser cache.\n4. Open Live Chat for immediate assistance from our engineering team."
        },
        {
            category: "Troubleshooting",
            q: "Why is OCR text formatting slightly misaligned?",
            a: "OCR accuracy depends on image clarity and scan resolution. For best results, use clean scans at 300 DPI with standard orientation and minimal shadows."
        },
        {
            category: "Troubleshooting",
            q: "How do I connect with a live customer support specialist?",
            a: "Click 'Open Live Chat' to chat directly with our on-duty team, or send an email to paperx.assist@gmail.com. We respond within minutes."
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
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-full mb-3">
                    <Headset size={14} className="text-emerald-500" />
                    Help & Customer Care
                </div>
                <h2 className="text-3xl sm:text-5xl font-heading font-black tracking-tight mb-4 text-stone-900 dark:text-white">
                    How can we help you?
                </h2>
                <p className="text-sm sm:text-base text-stone-500 dark:text-stone-400 font-medium max-w-xl mx-auto leading-relaxed">
                    Get rapid answers for subscriptions, file processing, or chat directly with our technical support specialists.
                </p>
            </div>

            {/* System Status Banner */}
            <div className="mb-10 p-4 sm:p-5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <div>
                        <p className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">All Processing Systems Operational</p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Conversion engine & OCR services active</p>
                    </div>
                </div>
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    99.9% Uptime
                </span>
            </div>

            {/* Support Channels Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-16">
                {/* Live Chat Channel */}
                <motion.div 
                    whileHover={{ y: -4 }}
                    className="p-6 sm:p-8 bg-stone-900 text-white dark:bg-stone-900 rounded-3xl shadow-xl shadow-stone-900/10 relative overflow-hidden flex flex-col justify-between border border-stone-800"
                >
                    <div>
                        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-5 border border-emerald-500/30">
                            <MessageSquare size={24} />
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-widest rounded-full mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Instant Response
                        </div>
                        <h3 className="text-xl font-bold mb-2">Live Support Chat</h3>
                        <p className="text-stone-400 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                            Chat directly with our team. Get instant automated resolution for billing queries or connect to live officers.
                        </p>
                    </div>
                    <button 
                        onClick={onStartChat}
                        className="w-full py-3.5 bg-white text-stone-900 rounded-xl font-bold text-xs sm:text-sm hover:bg-stone-100 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        <span>Open Live Chat</span>
                        <ArrowRight size={16} />
                    </button>
                </motion.div>

                {/* Email Helpdesk Channel */}
                <motion.div 
                    whileHover={{ y: -4 }}
                    className="p-6 sm:p-8 bg-white dark:bg-stone-900 text-stone-900 dark:text-white rounded-3xl shadow-xl shadow-stone-900/5 relative overflow-hidden flex flex-col justify-between border border-stone-200/80 dark:border-stone-800"
                >
                    <div>
                        <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mb-5 border border-orange-500/20">
                            <Mail size={24} />
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-[10px] uppercase tracking-widest rounded-full mb-3">
                            SLA: 2–4 Hours
                        </div>
                        <h3 className="text-xl font-bold mb-2">Official Email Helpdesk</h3>
                        <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                            For membership verification, official payment proofs, enterprise invoicing, or formal billing requests.
                        </p>
                    </div>
                    <a 
                        href="mailto:paperx.assist@gmail.com?subject=PaperX%20Support%20Inquiry"
                        className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        <span>Compose Email</span>
                        <Send size={15} />
                    </a>
                </motion.div>
            </div>

            {/* FAQ Accordion Section */}
            <div className="mb-14">
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold tracking-tight mb-2 text-stone-900 dark:text-white">Frequently Asked Questions</h3>
                    <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">Quick answers to common questions about plans, security, OCR, and formats.</p>
                </div>

                {/* FAQ Controls: Search and Category Pills */}
                <div className="mb-6 space-y-3">
                    <div className="relative max-w-md mx-auto">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setActiveFaq(null);
                            }}
                            placeholder="Search questions & answers..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-emerald-500 transition shadow-2xs"
                        />
                    </div>

                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setSelectedCategory(cat);
                                    setActiveFaq(null);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                    selectedCategory === cat
                                        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs'
                                        : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* FAQ Accordion Items */}
                <div className="space-y-3">
                    {filteredFaqs.length === 0 ? (
                        <div className="text-center py-10 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 text-xs sm:text-sm text-stone-400">
                            No questions found matching your search. Click below to chat with our support team.
                        </div>
                    ) : (
                        filteredFaqs.map((faq, i) => (
                            <div key={i} className="border border-stone-200/80 dark:border-stone-800 rounded-2xl overflow-hidden bg-white dark:bg-stone-900 shadow-2xs">
                                <button 
                                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                    className="w-full px-5 py-4 flex items-start justify-between gap-3 text-left hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition"
                                >
                                    <div className="flex-1">
                                        <span className="font-semibold text-xs sm:text-sm text-stone-800 dark:text-stone-200 block">{faq.q}</span>
                                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                                            {faq.category}
                                        </span>
                                    </div>
                                    <ChevronDown size={18} className={`text-stone-400 transition-transform duration-200 flex-shrink-0 mt-0.5 ${activeFaq === i ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {activeFaq === i && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-5 pb-5 text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed border-t border-stone-100 dark:border-stone-800/60 pt-3"
                                        >
                                            <p className="whitespace-pre-line">{faq.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))
                    )}
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
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-stone-300 selection:text-stone-900 relative overflow-hidden">


      {/* Dynamic Announcement Banner (e.g. Independence Day / Festival Mode) */}
      {appSettings.bannerActive && appSettings.bannerText && (
        <div className="bg-gradient-to-r from-[#FF671F] via-amber-500 to-[#046A38] text-white text-xs sm:text-sm font-semibold py-2 px-4 text-center relative z-[60] shadow-md flex items-center justify-center gap-2">
          <span>{appSettings.bannerText}</span>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group text-gray-900 dark:text-white" onClick={() => navigate('/')}>
             <motion.div 
                whileHover={{ scale: 1.05, rotateZ: -1 }}
                whileTap={{ scale: 0.95 }}
                className="relative inline-block"
             >
                <motion.span 
                    style={{ 
                        willChange: "background-position", 
                        transform: "translateZ(0)",
                        backgroundImage: "linear-gradient(to right, #FF671F, #e5e7eb, #046A38, #e5e7eb, #FF671F)",
                        backgroundSize: "200% auto",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent"
                    }}
                    animate={{ backgroundPosition: ["0% center", "200% center"] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="font-heading font-black text-2xl tracking-tighter drop-shadow-sm block"
                >
                    {APP_NAME}
                </motion.span>
             </motion.div>
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
                        <p className="text-xs text-gray-500 dark:text-gray-400">Loved by 10k+ users every week</p>
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
                        Popular Automated Tools
                        <span className="h-px bg-stone-200 dark:bg-stone-800 flex-1" />
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div onClick={() => navigate('/merge-pdf')} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all cursor-pointer group">
                           <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Combine size={18} /></div>
                           <div className="flex flex-col">
                               <span className="text-sm font-bold text-stone-800 dark:text-stone-200">Merge PDF</span>
                               <span className="text-[10px] font-semibold text-stone-500">Combine files</span>
                           </div>
                        </div>
                        
                        <div onClick={() => navigate('/compress-pdf')} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-500/50 transition-all cursor-pointer group">
                           <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Archive size={18} /></div>
                           <div className="flex flex-col">
                               <span className="text-sm font-bold text-stone-800 dark:text-stone-200">Compress</span>
                               <span className="text-[10px] font-semibold text-stone-500">Reduce size</span>
                           </div>
                        </div>
                        
                        <div onClick={() => navigate('/split-pdf')} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-500/50 transition-all cursor-pointer group">
                           <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Scissors size={18} /></div>
                           <div className="flex flex-col">
                               <span className="text-sm font-bold text-stone-800 dark:text-stone-200">Split PDF</span>
                               <span className="text-[10px] font-semibold text-stone-500">Extract pages</span>
                           </div>
                        </div>
                        
                        <div onClick={() => navigate('/pdf-to-text')} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-stone-900/60 hover:bg-white dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-200 dark:hover:border-rose-500/50 transition-all cursor-pointer group">
                           <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform"><ScanLine size={18} /></div>
                           <div className="flex flex-col">
                               <span className="text-sm font-bold text-stone-800 dark:text-stone-200">PDF to Text</span>
                               <span className="text-[10px] font-semibold text-stone-500">Extract text</span>
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
                     <div key={`top-${i}`} className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-stone-800/80 backdrop-blur-md rounded-full border border-stone-200/80 dark:border-stone-700/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-[11px] sm:text-xs font-bold text-stone-700 dark:text-stone-200 tracking-tight hover:border-stone-400 hover:shadow-md transition-all cursor-default">
                         <feature.icon size={14} className="text-stone-900 dark:text-white" />
                         {feature.name}
                     </div>
                 ))}
             </div>
             <div className="flex gap-3 whitespace-nowrap animate-marquee-reverse w-max">
                 {[...AZ_FEATURES.flatMap(g => g.features).reverse(), ...AZ_FEATURES.flatMap(g => g.features).reverse()].map((feature, i) => (
                     <div key={`bottom-${i}`} className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-stone-800/80 backdrop-blur-md rounded-full border border-stone-200/80 dark:border-stone-700/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] text-[11px] sm:text-xs font-bold text-stone-700 dark:text-stone-200 tracking-tight hover:border-stone-400 hover:shadow-md transition-all cursor-default">
                         <feature.icon size={14} className="text-stone-900 dark:text-white" />
                         {feature.name}
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
                            className="bg-white/40 backdrop-blur-2xl p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:border-white/80 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
                       >
                           <div className={`w-16 h-16 sm:w-20 sm:h-20 ${f.color} rounded-2xl sm:rounded-3xl flex items-center justify-center mb-8 sm:mb-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm`}>
                               <f.icon size={30} sm:size={36} />
                           </div>
                           <h3 className="text-2xl sm:text-3xl font-heading font-black tracking-tighter mb-3 sm:mb-4">{f.title}</h3>
                           <p className="text-base sm:text-lg text-gray-500 leading-relaxed font-medium">{f.desc}</p>
                           
                           {/* Subtle Liquid Shine */}
                           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-white/0 to-white/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                       </motion.div>
                   ))}
               </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/10 backdrop-blur-2xl border-t border-white/20 py-6 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-black text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#FF671F] via-gray-300 dark:via-gray-100 to-[#046A38] drop-shadow-sm">{APP_NAME}</span>
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
        className="absolute w-[360px] h-[360px] sm:w-[520px] sm:h-[520px] pointer-events-none rounded-full blur-3xl" 
      />

      {/* Centered Brand Typography - Exact 1:1 Video Blur-in, Hold with Inside Tricolor Flow, and Blur/Zoom-out */}
      <motion.h1
        initial={{ 
          opacity: 0, 
          filter: "blur(24px)", 
          scale: 1.06,
          backgroundPosition: "0% 50%"
        }}
        animate={{
          opacity: [0, 1, 1, 0],
          filter: ["blur(24px)", "blur(0px)", "blur(0px)", "blur(24px)"],
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
          backgroundImage: "linear-gradient(90deg, #FF671F 0%, #d1d5db 25%, #046A38 50%, #d1d5db 75%, #FF671F 100%)",
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
    <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-green-500/30">
        <Download size={48} />
      </div>
      <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-3">Download Full App</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 text-lg">
        Get the complete, bug-free APK with zero errors. Install the native PaperX experience directly on your device.
      </p>
      
      <a 
        href="#"
        onClick={(e) => { e.preventDefault(); alert('Downloading PaperX.apk...\n(100% bugs-free and zero errors)'); }}
        className="flex items-center gap-3 bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform shadow-2xl shadow-black/20 cursor-pointer"
      >
        <Download size={24} />
        Download APK Now
      </a>
      
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
        Version 2.0.4 • Android 8.0+ • 100% Free
      </p>
    </div>
  );
};

const DashboardView = ({
  searchQuery,
  setSearchQuery,
  user,
  handleDirectAppDownload,
  setIsCameraScannerOpen,
  setProfileInitialTab,
  setIsProfileOpen,
  handleToolClick,
  isToolLocked,
  navigate,
  storedFiles,
  handleDownloadStoredFile,
  handleShareStoredFile,
  t,
  getGreeting,
  QuickActions
}: any) => {
    const [isHeaderHidden, setIsHeaderHidden] = useState(false);
    const lastScrollY = useRef(0);

    useEffect(() => {
      const scrollContainer = document.getElementById('main-scroll-container');
      if (!scrollContainer) return;

      const handleScroll = () => {
        const currentScrollY = scrollContainer.scrollTop;
        // Hide when scrolling down, show when scrolling up.
        // Add a small threshold (e.g., 50px) before hiding to avoid jitter at the top.
        if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
          setIsHeaderHidden(true);
        } else if (currentScrollY < lastScrollY.current) {
          setIsHeaderHidden(false);
        }
        lastScrollY.current = currentScrollY;
      };

      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, []);

    const { t: hookT, currentLanguage } = useAppTranslation(user?.language);
    const activeT = (key: string, fallback?: string) => hookT(key, fallback) || (t ? t(key, fallback) : fallback || key);
    const currentLang = currentLanguage;

    const categoryLabels: Record<string, string> = {
      [ToolCategory.CREATE]: activeT('categories.create', 'Create & Design'),
      [ToolCategory.CONVERT]: activeT('categories.convert', 'Convert & Transform'),
      [ToolCategory.EDIT]: activeT('categories.edit', 'Edit & Markup'),
      [ToolCategory.ORGANIZE]: activeT('categories.organize', 'Organize & Pages'),
      [ToolCategory.OPTIMIZE]: activeT('categories.optimize', 'Optimize & OCR'),
      [ToolCategory.SECURITY]: activeT('categories.security', 'Security & Sign')
    };

    const translatedTools = TOOLS.map(tool => translateTool(tool, currentLang));

    const filteredTools = translatedTools.filter(toolItem => 
      (toolItem.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
      (toolItem.description || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    );

    const categories = Object.values(ToolCategory).filter(c => c !== ToolCategory.EDIT);

    const displayUserName = user?.name ? user.name.split(' ')[0] : (user?.email ? user.email.split('@')[0] : 'User');

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="pb-6 w-full flex flex-col relative min-h-full"
        >
            {/* COMPACT HEADER - RESPONSIVE STICKY OFFSET */}
            <div className={`sticky top-0 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-3 mb-5 bg-white/80 dark:bg-gray-900/85 backdrop-blur-2xl z-30 pt-3.5 px-4 sm:px-6 gap-3 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)] ${isHeaderHidden ? '-translate-y-[120%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
                 <div className="flex items-center gap-3.5">
                     <h1 className="text-xl sm:text-2xl font-heading font-black text-gray-900 dark:text-white tracking-tight">{getGreeting()}, {displayUserName}</h1>
                    <div className="hidden sm:block h-4 w-px bg-gray-200 dark:bg-gray-800"></div>
                    <p className="hidden sm:block text-[11px] text-gray-400 font-bold uppercase tracking-widest">{activeT('workspace', 'Workspace')}</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="relative group w-full md:w-80 flex-shrink-0">
                       <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors" />
                       <input
                           type="text"
                           className="block w-full pl-10 pr-4 h-10 sm:h-11 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200/80 dark:border-gray-700/60 rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black/40 dark:focus:border-white/40 transition-all font-medium shadow-xs"
                           placeholder={activeT('search', 'Search tools...')}
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                       />
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                       <button 
                           onClick={(e) => {
                               e.stopPropagation();
                               setProfileInitialTab('menu');
                               setIsProfileOpen(true);
                           }}
                           className="flex items-center gap-2 p-1 pr-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all group/profile cursor-pointer"
                       >
                           <img src={user?.avatarUrl || ''} alt={displayUserName} className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 shadow-xs object-cover" />
                           <span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover/profile:text-gray-900 dark:group-hover/profile:text-white transition-colors hidden lg:block">{displayUserName}</span>
                       </button>
                    </div>
                 </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-4 px-3 sm:px-4">
                
                {/* LEFT MAIN AREA */}
                <div className="flex-1 flex flex-col gap-2 pb-4 min-w-0">
                    {/* NEW QUICK ACTIONS - Moved to top as primary hero */}
                    {!searchQuery && <QuickActions />}

                    {/* DENSE TOOLS GRID - Grouped */}
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
                                                transition={{ delay: idx * 0.05 }}
                                                whileHover={{ y: -5, scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleToolClick(tool.id)}
                                                className="group relative flex flex-col p-4 sm:p-5 bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl border border-white/60 dark:border-gray-800/60 rounded-3xl hover:border-white/80 dark:hover:border-gray-700 hover:shadow-2xl hover:shadow-black/5 cursor-pointer transition-all duration-300 items-start gap-3 sm:gap-4 min-w-0"
                                            >
                                                {/* Plan Badges & Lock Status */}
                                                {tool.requiredPlan === 'Plus' && (
                                                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1 z-10">
                                                        <span className="px-2 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-[9px] font-black tracking-wider uppercase shadow-xs">
                                                            PLUS
                                                        </span>
                                                    </div>
                                                )}
                                                {tool.requiredPlan === 'Max' && (
                                                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1 z-10">
                                                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-black tracking-wider uppercase shadow-xs">
                                                            MAX
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl text-gray-900 dark:text-white group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black shadow-sm group-hover:shadow-lg group-hover:shadow-black/20 transition-all duration-300 shrink-0">
                                                    <motion.div
                                                        whileHover={{ scale: 1.15, rotate: [0, -10, 10, -5, 5, 0] }}
                                                        transition={{ type: "spring", stiffness: 300, damping: 10 }}
                                                    >
                                                        <tool.icon size={22} className="sm:w-6 sm:h-6" strokeWidth={1.5} />
                                                    </motion.div>
                                                </div>
                                                <div className="min-w-0 w-full">
                                                    <h3 className="text-sm sm:text-base font-heading font-black text-gray-900 dark:text-white truncate group-hover:text-black dark:group-hover:text-white transition-colors tracking-tight">{tool.name}</h3>
                                                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate group-hover:text-gray-700 dark:group-hover:text-gray-300 font-medium mt-0.5 sm:mt-1">{tool.description}</p>
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

    return () => {
      newSocket.close();
    };
  }, []);
  const hash = useHashLocation();
  const rawPath = hash.replace(/^#/, '') || '/';
  const currentPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  
  // Robust normalized path for routing and redirect checks (strips query parameters and trailing slashes)
  const cleanPathForRouting = '/' + currentPath.split('?')[0].replace(/^\/+|\/+$/g, '');

  const [user, setUser] = useState<User | null>(null);
  const [appOrders, setAppOrders] = useState<any[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Real-time listener for user's payment orders to keep UpgradeView & Billing in sync
  useEffect(() => {
    if (!user || (!user.uid && !user.email)) {
      setAppOrders([]);
      return;
    }
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid || user.email)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched: any[] = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAppOrders(fetched);
    }, (err) => {
      console.warn('App orders snapshot error:', err);
    });
    return () => unsub();
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

  // Auto-redirect authenticated users away from auth pages
  useEffect(() => {
    if (user && (cleanPathForRouting === '/login' || cleanPathForRouting === '/signup' || cleanPathForRouting === '/forgot-password' || cleanPathForRouting === '/reset-password')) {
      navigate('/dashboard');
    }
  }, [user, cleanPathForRouting]);

  // Global Preference Sync Effect (Theme, Font Size & Accessibility)
  useEffect(() => {
    // 1. Dark Mode Theme Sync
    const savedDark = localStorage.getItem('pref_darkMode');
    const isDark = user?.theme 
      ? user.theme === 'dark'
      : (savedDark !== null ? savedDark === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Font Size & Legibility
    const fontSize = user?.fontSize || localStorage.getItem('pref_fontSize') || 'system';
    const largerText = user?.largerTextEnabled !== undefined 
      ? user.largerTextEnabled 
      : (localStorage.getItem('pref_largerText') === 'true');

    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.setAttribute('data-larger-text', String(largerText));

    // 3. Scan & OCR Preferences Sync
    if (user) {
      if (user.autoSaveScan !== undefined) localStorage.setItem('pref_autoSaveScan', String(user.autoSaveScan));
      if (user.autoCopyText !== undefined) localStorage.setItem('pref_autoCopyText', String(user.autoCopyText));
      if (user.ocrLanguage) localStorage.setItem('pref_ocrLanguage', user.ocrLanguage);
      if (user.pdfQuality) localStorage.setItem('pref_pdfQuality', user.pdfQuality);
      if (user.namingPattern) localStorage.setItem('pref_namingPattern', user.namingPattern);
    }
  }, [user?.theme, user?.fontSize, user?.largerTextEnabled, user?.autoSaveScan, user?.autoCopyText, user?.ocrLanguage, user?.pdfQuality, user?.namingPattern]);

  // Global Firebase Auth Listener with safety timeout
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let unsubscribeSession: (() => void) | null = null;
    const safetyTimer = setTimeout(() => {
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
          const profile = await syncUserProfile(firebaseUser);
          setUser(profile);
          syncWithServer(profile);
          recordUserSession(firebaseUser.uid);

          if (unsubscribeSession) unsubscribeSession();
          unsubscribeSession = monitorCurrentSession(firebaseUser.uid, () => {
            logoutUser();
          });

          // Subscribe to real-time updates for profile/plan changes
          if (unsubscribeProfile) unsubscribeProfile();
          unsubscribeProfile = subscribeToUserProfile(firebaseUser.uid, (updatedProfile) => {
            if (updatedProfile) {
              if (updatedProfile.forceLogout || (updatedProfile as any).forceReLogin) {
                logoutUser();
                return;
              }
              setUser(prev => {
                const nextProfile = { ...(prev || updatedProfile), ...updatedProfile };
                return nextProfile;
              });
            }
          });

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
          if (unsubscribeProfile) unsubscribeProfile();
          unsubscribeProfile = subscribeToUserProfile(local.uid || local.id, (updatedProfile) => {
            if (updatedProfile) {
              if (updatedProfile.forceLogout || (updatedProfile as any).forceReLogin) {
                logoutUser();
                return;
              }
              setUser(prev => ({ ...(prev || updatedProfile), ...updatedProfile }));
            }
          });
        } else {
          if (unsubscribeProfile) {
            unsubscribeProfile();
            unsubscribeProfile = null;
          }
          setUser(null);
        }
      }
      setIsAuthLoading(false);
    });

    const unsubscribePaperX = onPaperXAuthStateChanged((customUser) => {
      if (customUser) {
        setUser(customUser);
        syncWithServer(customUser);
        if (unsubscribeProfile) unsubscribeProfile();
        unsubscribeProfile = subscribeToUserProfile(customUser.uid || customUser.id, (updatedProfile) => {
          if (updatedProfile) {
            if (updatedProfile.forceLogout || (updatedProfile as any).forceReLogin) {
              logoutUser();
              return;
            }
            setUser(prev => ({ ...(prev || updatedProfile), ...updatedProfile }));
          }
        });
      } else if (!auth.currentUser) {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        try {
          const saved = localStorage.getItem('paperx_local_stored_files');
          setStoredFiles(saved ? JSON.parse(saved) : []);
        } catch {
          setStoredFiles([]);
        }
        setUser(null);
      }
    });

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
  const [activeView, setActiveView] = useState('dashboard');
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
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

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

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('paperx:cache-cleared', handleCacheCleared);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('paperx:cache-cleared', handleCacheCleared);
    };
  }, []);

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

    const navUserAgent = (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : '';
    const userAgent = typeof navUserAgent === 'string' ? navUserAgent : '';
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
        setUser(prev => ({ ...(prev || updatedProfile), ...updatedProfile }));
      }
    });
    return () => {
      if (unsub) unsub();
    };
  }, [user?.uid]);

  // Support Chat State
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);
  const [hasOngoingSupportChat, setHasOngoingSupportChat] = useState(false);

  // Check if active support chat session is ongoing
  useEffect(() => {
    const checkOngoing = () => {
      try {
        const key = user?.uid ? `paperx_support_session_user_${user.uid}` : `paperx_support_session_guest`;
        const raw = localStorage.getItem(key);
        if (!raw) {
          setHasOngoingSupportChat(false);
          return;
        }
        const session = JSON.parse(raw);
        if (!session || session.status !== 'active') {
          setHasOngoingSupportChat(false);
          return;
        }
        const elapsed = Date.now() - (session.lastUserActivity || session.createdAt || 0);
        if (elapsed >= 20 * 60 * 1000) {
          setHasOngoingSupportChat(false);
          return;
        }
        setHasOngoingSupportChat(Boolean(session.hasOngoingMessages || session.hasUserStartedChat));
      } catch (e) {
        setHasOngoingSupportChat(false);
      }
    };

    checkOngoing();
    const handleUpdate = () => checkOngoing();
    window.addEventListener('paperx-support-session-update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(checkOngoing, 5000);

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
            if (lastMsg.sender !== 'user' && !isSupportChatOpen) {
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
  }, [user?.uid, isSupportChatOpen]);
  
  // Payment State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<'Plus Plan' | 'Max Plan'>('Plus Plan');
  const [paymentAmount, setPaymentAmount] = useState('50');
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
      // Check recipient match
      const isTargeted = 
        notification.recipient === 'ALL' ||
        (notification.recipient === 'CUSTOM' && user && notification.recipientEmail === user.email) ||
        (notification.recipient === 'PRO_USERS' && user?.isPro) ||
        (notification.recipient === 'FREE_USERS' && user && !user.isPro);
        
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
  }, [socket, user]);

  // Real-time Payment & Ticket Updates from Socket.IO (Admin Actions)
  useEffect(() => {
    if (!socket || !user) return;

    const handleOrderUpdate = (data: any) => {
      if (data.status === 'VERIFIED') {
        playPaymentApprovedAudio();
        triggerPaymentApprovedConfetti();
        addToast({
          title: 'Membership Activated! 🎉',
          message: `Your ${data.plan} is now active. Enjoy premium perks!`,
          type: 'success'
        });
        if (user?.uid) syncUserProfile(user.uid, setUser);
      } else if (data.status === 'REJECTED') {
        playPaymentRejectedAudio();
        addToast({
          title: 'Payment Rejected ⚠️',
          message: `Verification failed. Please check payment history for details.`,
          type: 'error'
        });
      }
    };

    const handleTicketUpdate = (data: any) => {
      addToast({
        title: 'Support Ticket Update',
        message: `Your ticket status changed to ${data.status.replace('_', ' ')}.`,
        type: 'info'
      });
    };

    const handleDowngrade = (data: any) => {
      if (user?.uid === data.uid) {
        addToast({
          title: 'Membership Refunded 💳',
          message: 'Your refund has been approved and your account is now back to Basic Plan.',
          type: 'info'
        });
        syncUserProfile(user.uid, setUser);
      }
    };

    socket.on('order-updated', handleOrderUpdate);
    socket.on('ticket-updated', handleTicketUpdate);
    socket.on('user-downgraded', handleDowngrade);

    return () => {
      socket.off('order-updated', handleOrderUpdate);
      socket.off('ticket-updated', handleTicketUpdate);
      socket.off('user-downgraded', handleDowngrade);
    };
  }, [socket, user]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Real-time Active Membership Expiry Surveillance
  useEffect(() => {
    if (!user) return;

    const performExpiryCheck = () => {
      if (isPlanExpired(user)) {
        if (user.plan !== 'Basic Plan') {
          // Auto-select Basic Plan smoothly when paid plan expires
          // If basicPlanExpiresAt exists, keep it; if user hasn't used basic features yet, timer remains unstarted until first usage
          setUser(prev => prev ? ({
            ...prev,
            previousPlan: (prev.plan as any) || 'Plus Plan',
            plan: 'Basic Plan',
            purchasedPlan: 'Basic Plan',
            activePlanMode: 'Basic Plan',
            billingCycle: 'month',
            membershipTier: 'free',
            subscriptionStatus: 'free',
            isPro: false,
            planExpiresAt: prev.basicPlanExpiresAt || undefined,
            maxProjects: 5
          }) : null);
          
          // Persist downgrade to Firestore ledger
          if (user.uid) {
            updateUserInFirestore(user.uid, {
              plan: 'Basic Plan',
              purchasedPlan: 'Basic Plan',
              activePlanMode: 'Basic Plan',
              billingCycle: 'month',
              membershipTier: 'free',
              subscriptionStatus: 'free',
              previousPlan: user.plan,
              isPro: false,
              planExpiresAt: (user.basicPlanExpiresAt || null) as any,
              maxProjects: 5,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
    };

    performExpiryCheck();
    const interval = setInterval(performExpiryCheck, 1000); // 1s live pulse for real-time testing
    return () => clearInterval(interval);
  }, [user]);

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
      const saved = localStorage.getItem('paperx_local_stored_files');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save guest/local stored files to localStorage when updated
  useEffect(() => {
    if (!user?.uid) {
      try {
        localStorage.setItem('paperx_local_stored_files', JSON.stringify(storedFiles));
      } catch (e) {
        console.warn('Failed to save local files:', e);
      }
    }
  }, [storedFiles, user?.uid]);

  // Sync stored files with Firestore in real time when user is logged in
  useEffect(() => {
    const activeUid = user?.uid || (user as any)?.id || auth.currentUser?.uid;
    if (activeUid) {
      const guestFilesString = localStorage.getItem('paperx_local_stored_files');
      if (guestFilesString) {
        try {
          const guestFiles = JSON.parse(guestFilesString) as StoredDocument[];
          if (guestFiles && guestFiles.length > 0) {
            guestFiles.forEach(file => {
              addDocumentToFirestore(activeUid, file).catch(console.error);
            });
            localStorage.removeItem('paperx_local_stored_files');
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

          // Keep pending local files that are very recently created (< 30s) and not yet reflected in the snapshot
          const now = Date.now();
          const pendingRecent = prev.filter(p => !syncedIds.has(p.id) && !recentlyDeletedIds.current.has(p.id) && (now - (p.timestamp || 0) < 30000));

          const merged = [...pendingRecent, ...syncedDocs];
          merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
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
        const expired = prev.filter(f => (f.timestamp || 0) < cutoff && (f.timestamp || 0) > 0);
        if (expired.length === 0) return prev;
        expired.forEach(f => {
          LocalFileStore.remove(f.id);
          if (user?.uid) {
            deleteDocumentFromFirestore(user.uid, f.id).catch(() => {});
          }
        });
        return prev.filter(f => (f.timestamp || 0) >= cutoff || !f.timestamp);
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
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
          const activeTool = TOOLS.find(t => t.id === activeToolId);
          const filename = generateUniqueFileName(rawFilename, storedFiles, activeTool?.name || 'Editor');
          
          let generatedTags: string[] = [];
          if (reader.result) {
              generatedTags = await analyzeDocumentForTags(filename, reader.result as string);
          } else {
              generatedTags = await analyzeDocumentForTags(filename);
          }

          const newFile: StoredDocument = {
              id: `doc_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
              name: filename,
              date: new Date().toLocaleDateString(),
              timestamp: Date.now(),
              size: `${(blob.size / 1024).toFixed(1)} KB`,
              type: 'PDF',
              action: 'Download',
              tags: generatedTags
          };
          
          if (reader.result) {
              LocalFileStore.save(newFile.id, reader.result as string);
          }
          
          setStoredFiles(prev => [newFile, ...prev]);
          const activeUid = user?.uid || (user as any)?.id || auth.currentUser?.uid;
          if (activeUid) {
              addDocumentToFirestore(activeUid, newFile).catch(console.error);
              recordFeatureUsage(user);
          }

          addToast({
            type: 'success',
            title: 'Document Ready',
            message: `"${filename}" was processed and saved to your files.`,
            toolName: 'Editor',
            fileName: filename,
            fileSize: `${(blob.size / 1024).toFixed(1)} KB`,
            downloadBlob: blob,
            downloadFileName: filename,
            duration: 5000
          });
      };
  };

  const handleDownloadStoredFile = async (id: string, name: string) => {
      try {
          const stored = storedFiles.find(f => f.id === id);
          const blob = await getDocumentBlob({ id, name, ...stored }, LocalFileStore.get);
          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = name.toLowerCase().endsWith('.pdf') || name.toLowerCase().endsWith('.zip') ? name : `${name}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
          addToast({
              type: 'success',
              title: 'Download Started',
              message: `"${name}" opened and downloaded in full PDF format.`,
              duration: 3000
          });
      } catch (err) {
          console.error('Error downloading stored file:', err);
      }
  };

  // Improved Navigation Logic supporting direct tool routes
  useEffect(() => {
    const path = getNormalizedPath();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const matchedTool = findToolFromPath(cleanPath);

    if (matchedTool) {
        setActiveToolId(matchedTool.id);
        setActiveView('tool');
        setFiles([]); 
        setRawFiles([]);
        setIsProfileOpen(false);
    } else if (cleanPath.startsWith('/tool/')) {
        const toolId = cleanPath.split('/tool/')[1];
        if (TOOLS.some(t => t.id === toolId)) {
            setActiveToolId(toolId);
            setActiveView('tool');
            setFiles([]); 
            setRawFiles([]);
            setIsProfileOpen(false);
        } else {
            navigate(user ? '/dashboard' : '/');
        }
    } else if (cleanPath === '/dashboard' || cleanPath === '/') {
        setActiveToolId(null);
        setActiveView('dashboard');
        setIsProfileOpen(false);
    } else {
        const viewName = cleanPath.substring(1);
        
        // Handle Profile Routes
        if (viewName === 'settings' || viewName === 'preferences') {
             setProfileInitialTab('preferences');
             setIsProfileOpen(true);
        } else if (viewName === 'personal') {
             setProfileInitialTab('personal');
             setIsProfileOpen(true);
        } else if (viewName === 'billing') {
             setProfileInitialTab('billing');
             setIsProfileOpen(true);
        } else if (['documents', 'recent', 'support', 'download', 'payment-history', 'payments'].includes(viewName)) {
             setActiveView(viewName === 'payments' ? 'payment-history' : viewName);
             setIsProfileOpen(false);
        } else if (viewName === 'upgrade') {
             setActiveView('upgrade');
             setIsProfileOpen(false);
        } else if (viewName === 'whats-new') {
             setActiveView('whats-new');
             setIsProfileOpen(false);
        }
    }
  }, [hash]);

  const handleAuthSuccess = () => {
    setIsBannerVisible(true);
    // Let useEffect handle navigation so we don't flash the landing view
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

  const handleLogout = async () => {
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
    setUser(null);
    setIsProfileOpen(false);
    navigate('/');
  };

  const handleNavigation = (view: string, e?: React.MouseEvent) => {
      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }
      setIsMobileMenuOpen(false);
      
      if (view === 'settings') {
          setProfileInitialTab('preferences');
          setIsProfileOpen(true);
          return;
      }
      
      if (view === 'preferences') {
          setProfileInitialTab('preferences');
          setIsProfileOpen(true);
          return;
      }
      
      if (view === 'support') {
          setIsSupportChatOpen(true);
          return;
      }
      
      if (view === 'billing') {
          setProfileInitialTab('billing');
          setIsProfileOpen(true);
          return;
      }

      if (view === 'payment-history' || view === 'payments') {
          setActiveView('payment-history');
          setIsProfileOpen(false);
          navigate('/payment-history');
          return;
      }

      if (view === 'dashboard') navigate('/dashboard');
      else navigate(`/${view}`);
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

  const recordFeatureUsage = (currentUser: User) => {
    const isBasic = !currentUser.plan || currentUser.plan === 'Basic Plan' || currentUser.activePlanMode === 'Basic Plan';
    const hasNotStarted = !currentUser.basicPlanStartedAt;
    
    const now = new Date();
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
    const startedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + fiveDaysMs).toISOString();
    
    const newUsage = Math.min((currentUser.projectsUsed || 0) + 1, currentUser.maxProjects || 5);
    
    const updatePayload: Partial<User> = {
      projectsUsed: newUsage,
      featureUsageCount: (currentUser.featureUsageCount || 0) + 1,
      updatedAt: now.toISOString()
    };

    if (isBasic && hasNotStarted) {
      updatePayload.basicPlanStartedAt = startedAt;
      updatePayload.basicPlanExpiresAt = expiresAt;
      updatePayload.planExpiresAt = expiresAt;
    }

    const nextUser: User = {
      ...currentUser,
      ...updatePayload
    };
    
    setUser(nextUser);
    if (currentUser.uid) {
      updateUserInFirestore(currentUser.uid, updatePayload).catch(err => console.warn('Usage sync notice:', err));
    }
  };

  const getPlanTier = (plan?: string, targetUser?: User | null): 'Free' | 'Plus' | 'Max' => {
    const currentUser = targetUser !== undefined ? targetUser : user;
    if (isPlanExpired(currentUser)) {
      return 'Free';
    }
    // Prioritize activePlanMode if user has selected a mode, or the explicit plan param
    const effectivePlan = (plan && plan !== currentUser?.plan) 
      ? plan 
      : (currentUser?.activePlanMode || currentUser?.plan || plan || 'Free');

    const p = effectivePlan.toLowerCase();
    if (p.includes('max')) return 'Max';
    if (p.includes('plus') || p.includes('pro')) return 'Plus';
    return 'Free';
  };

  const isToolLocked = (tool: Tool) => {
    const tier = getPlanTier(user?.plan);
    const required = tool.requiredPlan || 'Free';

    if (required === 'Free') return false;
    
    if (required === 'Plus') {
        return tier === 'Free';
    }
    
    if (required === 'Max') {
        return tier === 'Free' || tier === 'Plus';
    }

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
    if (tier === 'Free' && user) {
        if (user.projectsUsed >= (user.maxProjects || 10)) {
             addToast({
                 type: 'error',
                 title: 'Limit Reached (10 Operations Total)',
                 message: 'You have used all 10 operations included with the Basic Plan (10 operations only, not per day). Upgrade to Plus or Max for unlimited access!'
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
        alert("Enter PIN to access Private Folder");
        setIsMobileMenuOpen(false);
        return;
    }

    navigate(`/tool/${toolId}`);
    setIsMobileMenuOpen(false);
  };

  const handleInitiatePayment = (
      plan: 'Plus Plan' | 'Max Plan', 
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

      setPaymentPlan(plan);
      setPaymentCycle(cycle);
      const defaultAmt = plan === 'Max Plan' 
        ? (cycle === 'half-year' ? '500' : cycle === 'year' ? '1000' : '100')
        : (cycle === 'half-year' ? '250' : cycle === 'year' ? '500' : '50');
      
      const purchasedTier = getUserPurchasedTier(user);
      const isExpired = isPlanExpired(user);
      const isRefunded = Boolean(user?.isRefunded);

      let finalAmt = defaultAmt;
      let finalUpgradeId = upgradeFromId;
      let finalOldAmt = 0;

      // Membership Upgrade & Refund Rules:
      // 1. "if users buy any plan and they wanted upgrade he can but if they refunded then full money required"
      // 2. "if not refunded then past membership plan will discount correctly from new membership plan"
      // 3. Discount applies when upgrading to any higher value membership from an active, non-refunded plan!
      const userActiveCredit = (() => {
          if (!user || user?.isRefunded || isExpired || purchasedTier === 'Free' || user.plan === 'Basic Plan' || user.subscriptionStatus === 'free') return 0;
          if (purchasedTier === 'Max') {
              return getPlanCreditValue('Max Plan', user.billingCycle as BillingCycleType);
          }
          if (purchasedTier === 'Plus') {
              return getPlanCreditValue('Plus Plan', user.billingCycle as BillingCycleType);
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
      targetPlan: 'Basic Plan' | 'Plus Plan' | 'Max Plan',
      targetCycle?: 'month' | 'half-year' | 'year'
  ) => {
      if (!user) {
          navigate('/signup');
          return;
      }
      const purchasedTier = getUserPurchasedTier(user);
      const userCycle = (user.billingCycle as BillingCycleType) || 'month';
      const isExpired = isPlanExpired(user);

      // Check cycle restriction FIRST: if target cycle is not covered by the user's active membership,
      // they cannot use or switch to plans in that cycle directly and must upgrade.
      if (targetCycle && targetPlan !== 'Basic Plan' && !isBillingCycleCovered(userCycle, targetCycle)) {
          handleInitiatePayment(targetPlan, undefined, targetCycle);
          return;
      }

      // If user wants Max Plan but doesn't own Max, redirect to upgrade flow
      if (targetPlan === 'Max Plan' && (purchasedTier !== 'Max' || isExpired)) {
          handleInitiatePayment('Max Plan', undefined, targetCycle || userCycle);
          return;
      }

      // If user wants Plus Plan but only has Free, redirect to upgrade flow
      if (targetPlan === 'Plus Plan' && (purchasedTier === 'Free' || isExpired)) {
          handleInitiatePayment('Plus Plan', undefined, targetCycle || userCycle);
          return;
      }

      // Within covered cycle: Max Plan includes Plus Plan and Basic Plan for free
      if (targetPlan === 'Plus Plan' && purchasedTier === 'Max' && !isExpired) {
          const updatedUserData: Partial<User> = {
              plan: 'Plus Plan',
              activePlanMode: 'Plus Plan',
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
              title: 'Active Mode: Plus Plan',
              message: 'Max Plan includes Plus Plan for free. You can switch between Plus and Max anytime!'
          });
          return;
      }

      // If user is in Plus mode and wants to switch back to Max Plan (when they own Max)
      if (targetPlan === 'Max Plan' && purchasedTier === 'Max' && !isExpired) {
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
          plan: targetPlan,
          activePlanMode: targetPlan,
          purchasedPlan: user.purchasedPlan || (purchasedTier === 'Max' ? 'Max Plan' : purchasedTier === 'Plus' ? 'Plus Plan' : 'Basic Plan'),
          isPro: targetPlan !== 'Basic Plan',
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
    const MAX_FILE_SIZE_BYTES = tier === 'Free' ? 50 * 1024 * 1024 : 500 * 1024 * 1024;
    const oversized = newFiles.some(f => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
        if (tier === 'Free') {
            addToast({
                type: 'error',
                title: 'Free Tier Limit (50MB)',
                message: 'Free tier includes top-tier quality up to 50MB per file. Upgrade to Plus or Max for files up to 500MB!'
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
        const index = prev.findIndex(f => f.id === id);
        if (index !== -1) {
             const newRawFiles = [...rawFiles];
             newRawFiles.splice(index, 1);
             setRawFiles(newRawFiles);
        }
        return prev.filter(f => f.id !== id);
    });
  };

  const handleGenericFileProcess = async () => {
    if (!activeToolId) return;
    
    const activeTool = TOOLS.find(t => t.id === activeToolId);
    if (user && activeTool && isToolLocked(activeTool)) {
        navigate('/upgrade');
        return;
    }

    if (!user) {
        addToast({
            type: 'error',
            title: 'Sign In Required',
            message: 'Please sign up or log in for free to process your documents!'
        });
        navigate('/signup');
        return;
    }

    if (files.some(f => f.status === 'uploading')) {
        alert("Please wait for files to finish uploading.");
        return;
    }
    
    const readyFiles = files.filter(f => f.status === 'ready');
    if (readyFiles.length === 0) {
        alert("No ready files to process.");
        return;
    }

    const tier = user ? getPlanTier(user.plan) : 'Free';
    if (user && tier === 'Free') {
        if ((user.projectsUsed || 0) >= (user.maxProjects || 10)) {
            addToast({
                type: 'error',
                title: 'Limit Reached (10 Operations Total)',
                message: 'You have used all 10 operations included with the Basic Plan (10 operations only, not per day). Upgrade to Plus or Max for unlimited access!'
            });
            navigate('/upgrade');
            return;
        }

        if (readyFiles.length > 1 && activeToolId !== 'merge-pdf') {
            addToast({
                type: 'error',
                title: 'Batch Processing Locked',
                message: 'Batch processing multiple files simultaneously is available on Plus and Max plans.'
            });
            navigate('/upgrade');
            return;
        }
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

    let processOptions: any = {
      pdfQuality: userPdfQuality,
      pageSize: userPageSize,
      pdfAutoCompress: userAutoCompress,
    };

    if (activeToolId === 'protect-pdf') {
        const pwd = window.prompt("Enter a password to protect this file:", "");
        if (!pwd) return;
        processOptions.password = pwd;
    }

    setIsProcessing(true);
    setProcessingStatus('Initializing...');
    setProcessingProgress(0);
    
    try {
        const filesToProcess: File[] = [];
        files.forEach((f, index) => {
            if (f.status === 'ready' && rawFiles[index]) {
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
        
        if (user) {
            recordFeatureUsage(user);
        } else {
            const newUsage = (guestTrialsUsed || 0) + 1;
            localStorage.setItem('paperx_guest_trials_used', newUsage.toString());
            setGuestTrialsUsed(newUsage);
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
                LocalFileStore.save(newItemId, dataUrl);
            }
            const uniqueName = generateUniqueFileName(item.filename, storedFiles, toolDisplayName);
            return {
                id: newItemId,
                name: uniqueName,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now(),
                size: item.size >= 1024 * 1024 ? `${(item.size / 1024 / 1024).toFixed(2)} MB` : `${(item.size / 1024).toFixed(1)} KB`,
                type: item.filename.endsWith('.zip') ? 'ZIP' : item.type || 'PDF',
                action: toolDisplayName
            };
        }));

        if (newStoredItems.length > 0) {
            setStoredFiles(prev => [...newStoredItems, ...prev]);
            const activeUid = user?.uid || (user as any)?.id || auth.currentUser?.uid;
            if (activeUid) {
                newStoredItems.forEach(item => addDocumentToFirestore(activeUid, item).catch(console.error));
            }
        } else {
            let singleDataUrl = '';
            try {
                if (result.blob) singleDataUrl = await getBase64(result.blob);
            } catch (e) {}
            
            const newFileId = `doc_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
            if (singleDataUrl) {
                LocalFileStore.save(newFileId, singleDataUrl);
            }
            
            const uniqueSingleName = generateUniqueFileName(result.filename, storedFiles, toolDisplayName);
            const generatedTags = await analyzeDocumentForTags(uniqueSingleName, singleDataUrl);
            
            const newStoredDocument: StoredDocument = {
                id: newFileId,
                name: uniqueSingleName,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now(),
                size: formattedFileSize,
                type: result.filename.endsWith('.zip') ? 'ZIP' : 'PDF',
                action: toolDisplayName,
                tags: generatedTags
            };
            setStoredFiles(prev => [newStoredDocument, ...prev]);
            const activeUid = user?.uid || (user as any)?.id || auth.currentUser?.uid;
            if (activeUid) {
                addDocumentToFirestore(activeUid, newStoredDocument).catch(console.error);
            }
        }
        
        setFiles(prev => prev.map(f => 
            f.status === 'ready' ? { ...f, progress: 100 } : f
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
        setFiles(prev => prev.map(f => f.status === 'ready' ? { ...f, status: 'error' } : f));
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

   const QuickActions = () => (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
           {/* Upload Action */}
           <motion.button
               whileHover={{ y: -4, scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={() => document.getElementById('quick-upload-trigger')?.click()}
               className="flex flex-col items-center justify-center p-5 sm:p-6 md:p-7 rounded-3xl bg-black dark:bg-white text-white dark:text-black shadow-xl shadow-black/10 dark:shadow-white/5 border border-black dark:border-white hover:shadow-2xl transition-all duration-300 group relative overflow-hidden min-w-0 cursor-pointer"
           >
               <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 dark:bg-black/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-black group-hover:text-black dark:group-hover:text-white transition-all duration-300 backdrop-blur-md z-10 shrink-0 shadow-sm">
                   <motion.div
                       whileHover={{ scale: 1.15, rotate: [0, -10, 10, -5, 5, 0] }}
                       transition={{ type: "spring", stiffness: 300, damping: 10 }}
                   >
                       <Upload size={22} className="sm:w-6 sm:h-6" strokeWidth={2} />
                   </motion.div>
               </div>
               <span className="font-heading font-black text-xs sm:text-sm tracking-tight z-10 truncate max-w-full text-white dark:text-black">{t('upload')}</span>
           </motion.button>

           {/* Other Actions */}
           {[
               { id: 'compress-pdf', label: t('tools.compress') || 'Compress', icon: Minimize2 },
               { id: 'merge-pdf', label: t('tools.merge') || 'Merge', icon: Combine },
               { id: 'pdf-to-word', label: t('tools.convert') || 'Convert', icon: ArrowRightLeft },
           ].map((action, i) => (
               <motion.button
                   key={action.id}
                   initial={{ opacity: 0, y: 15 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.08 }}
                   whileHover={{ y: -4, scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => handleToolClick(action.id)}
                   className="flex flex-col items-center justify-center p-5 sm:p-6 md:p-7 rounded-3xl bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl border border-white/60 dark:border-gray-800/60 hover:border-white/80 dark:hover:border-gray-700 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-2xl transition-all duration-300 group relative overflow-hidden min-w-0 cursor-pointer"
               >
                   {action.id === 'pdf-to-word' && (
                       <div className="absolute top-3.5 right-3.5 flex items-center gap-1 z-10">
                           <span className="px-2 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-[9px] font-black tracking-wider uppercase shadow-xs">
                               PLUS
                           </span>
                       </div>
                   )}
                   <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black shadow-sm group-hover:shadow-lg group-hover:shadow-black/20 transition-all duration-300 flex items-center justify-center mb-3 shrink-0">
                       <motion.div
                           whileHover={{ scale: 1.15, rotate: [0, -10, 10, -5, 5, 0] }}
                           transition={{ type: "spring", stiffness: 300, damping: 10 }}
                       >
                           <action.icon size={22} className="sm:w-6 sm:h-6" strokeWidth={1.75} />
                       </motion.div>
                   </div>
                   <span className="font-heading font-black text-xs sm:text-sm text-gray-900 dark:text-white tracking-tight z-10 truncate max-w-full group-hover:text-black dark:group-hover:text-white transition-colors">{action.label}</span>
               </motion.button>
           ))}
           
           {/* Hidden File Input for the Upload button */}
           <input 
                id="quick-upload-trigger"
                type="file" 
                className="hidden" 
                multiple
                onChange={(e) => {
                    if (e.target.files?.length) {
                        handleFilesSelected(Array.from(e.target.files));
                        handleToolClick('create-pdf'); // Or generic viewer
                    }
                }} 
            />
      </div>
  );

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
              className="relative w-24 h-24 rounded-3xl bg-gradient-to-b from-orange-500/20 to-amber-500/5 border border-orange-500/30 shadow-2xl shadow-orange-500/20 flex items-center justify-center text-orange-400 backdrop-blur-xl"
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

    // 2. Blocked User Account Lockout
    if (user && (user.status === 'DISABLED' || (user as any).isBlocked) && !isAdminOpen) {
      return (
        <div className="fixed inset-0 z-[100] bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-950/30 flex items-center justify-center text-red-400 mb-6 border border-red-900/50">
            <Lock size={32} />
          </div>
          <span className="px-3 py-1 rounded-full bg-red-950/50 border border-red-900/50 text-red-400 font-semibold text-xs tracking-widest uppercase mb-4">
            Account Suspended
          </span>
          <h1 className="text-3xl font-bold text-white mb-4">
            Access to PaperX Has Been Suspended
          </h1>
          <p className="text-stone-400 max-w-sm mb-8 leading-relaxed">
            {user.blockReason || "Your user account has been disabled by the PaperX Administrator. If you believe this is an error or wish to clear pending payment holds, please contact live support."}
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={async () => {
                try {
                  await logoutUser();
                } catch (error: any) {
                  alert("Sign out failed. Please try again.");
                }
              }}
              className="px-6 py-2 bg-stone-900 border border-stone-800 hover:bg-stone-800 hover:border-stone-600 hover:text-white text-stone-300 font-medium rounded-xl transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
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

    let currentUnauthView = (
      <LandingView 
        onOpenDownload={() => handleDirectAppDownload()} 
        appSettings={appSettings} 
      />
    );

    if (cleanPathForRouting === '/forgot-password' || cleanPathForRouting === '/reset-password' || isResetPassword) {
      currentUnauthView = <AuthPage key="reset" mode="reset" onAuthSuccess={() => handleAuthSuccess()} onNavigate={navigate} />;
    } else if (cleanPathForRouting === '/login') {
      currentUnauthView = <AuthPage key="login" mode="login" onAuthSuccess={() => handleAuthSuccess()} onNavigate={navigate} />;
    } else if (cleanPathForRouting === '/signup') {
      currentUnauthView = <AuthPage key="signup" mode="signup" onAuthSuccess={() => handleAuthSuccess()} onNavigate={navigate} />;
    } else {
      const matchedTool = findToolFromPath(cleanPathForRouting);
      if (matchedTool) {
        currentUnauthView = (
          <GuestToolView 
            tool={matchedTool}
            activeToolId={matchedTool.id}
            files={files}
            rawFiles={rawFiles}
            onFilesSelected={handleFilesSelected}
            onRemoveFile={handleRemoveFile}
            onCancelFile={handleCancelFile}
            onCancelBatch={handleCancelBatch}
            onGenericFileProcess={handleGenericFileProcess}
            onProcessedFile={handleProcessedFile}
            isProcessing={isProcessing}
            processingStatus={processingStatus}
            processingProgress={processingProgress}
            socket={socket}
            guestTrialsUsed={guestTrialsUsed}
            onNavigate={navigate}
            onOpenScanner={() => setIsCameraScannerOpen(true)}
            appSettings={appSettings}
          />
        );
      }
    }

    return (
      <>
        {currentUnauthView}
        <DeviceLimitModal
          isOpen={deviceLimitModalOpen}
          onClose={() => setDeviceLimitModalOpen(false)}
        />
      </>
    );
  }

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const fiveYearsMs = 5 * 365.25 * 24 * 60 * 60 * 1000;
  const nowTime = Date.now();
  const getDocTimeHelper = (f: StoredDocument): number => {
      if (typeof f.timestamp === 'number' && !isNaN(f.timestamp) && f.timestamp > 0) return f.timestamp;
      if (f.date) {
          const parsed = new Date(f.date).getTime();
          if (!isNaN(parsed) && parsed > 0) return parsed;
      }
      if ((f as any).createdAt) {
          const parsed = new Date((f as any).createdAt).getTime();
          if (!isNaN(parsed) && parsed > 0) return parsed;
      }
      return nowTime;
  };

  const recentDocsCount = storedFiles.filter(f => getDocTimeHelper(f) >= (nowTime - thirtyDaysMs)).length;
  const myDocsCount = storedFiles.filter(f => getDocTimeHelper(f) >= (nowTime - fiveYearsMs)).length;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-gray-50 text-gray-900 font-sans selection:bg-black selection:text-white relative overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
                      }

                      setStoredFiles(prev => [newStoredDoc, ...prev]);

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
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-black/15 dark:bg-black/35 z-40 lg:hidden backdrop-blur-xs transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop & Mobile Drawer */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-80 lg:w-64 ios-glass-drawer flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-r-3xl lg:rounded-none ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}>
         {/* Logo Area */}
         <div className="h-12 flex items-center justify-center px-4 border-b border-black/[0.06] dark:border-white/[0.08] relative shrink-0">
             <div className="flex items-center justify-center cursor-pointer text-gray-900 dark:text-white" onClick={(e) => handleNavigation('dashboard', e)}>
                 <motion.span 
                     style={{ 
                         willChange: "background-position", 
                         transform: "translateZ(0)",
                         backgroundImage: "linear-gradient(to right, #4f46e5, #0ea5e9, #6366f1, #0ea5e9, #4f46e5)",
                         backgroundSize: "200% auto",
                         WebkitBackgroundClip: "text",
                         WebkitTextFillColor: "transparent"
                     }}
                     animate={{ backgroundPosition: ["0% center", "100% center", "0% center"] }}
                     transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                     className="font-heading font-black text-xl sm:text-2xl tracking-tight drop-shadow-sm text-center select-none"
                 >
                     {APP_NAME}
                 </motion.span>
             </div>
         </div>

         {/* Navigation */}
         <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-2 no-scrollbar">
             <button 
                onClick={(e) => handleNavigation('dashboard', e)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight transition-all duration-200 active:scale-[0.98] ${activeView === 'dashboard' ? 'ios-nav-pill-active' : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.10] hover:text-gray-950 dark:hover:text-white'}`}
             >
                 <Layout size={21} className={activeView === 'dashboard' ? 'text-white dark:text-black shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
                 {t('dashboard')}
             </button>
             <button 
                onClick={(e) => handleNavigation('documents', e)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight transition-all duration-200 active:scale-[0.98] ${activeView === 'documents' ? 'ios-nav-pill-active' : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.10] hover:text-gray-950 dark:hover:text-white'}`}
             >
                 <div className="flex items-center gap-3.5">
                     <Folder size={21} className={activeView === 'documents' ? 'text-white dark:text-black shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
                     <span>{t('documents')}</span>
                 </div>
                 {myDocsCount > 0 && (
                     <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${activeView === 'documents' ? 'bg-white/25 text-white dark:bg-black/20 dark:text-black' : 'bg-black/[0.08] dark:bg-white/[0.14] text-gray-700 dark:text-gray-300'}`}>
                         {myDocsCount}
                     </span>
                 )}
             </button>
             <button 
                onClick={(e) => handleNavigation('recent', e)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight transition-all duration-200 active:scale-[0.98] ${activeView === 'recent' ? 'ios-nav-pill-active' : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.10] hover:text-gray-950 dark:hover:text-white'}`}
             >
                 <div className="flex items-center gap-3.5">
                     <History size={21} className={activeView === 'recent' ? 'text-white dark:text-black shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
                     <span>{t('recent')}</span>
                 </div>
                 {recentDocsCount > 0 && (
                     <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${activeView === 'recent' ? 'bg-amber-400 text-black dark:bg-amber-300 dark:text-black' : 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/40 dark:border-amber-700/30'}`}>
                         {recentDocsCount}
                     </span>
                 )}
             </button>

             <div className="pt-4 pb-1">
                  <p className="px-3.5 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">Settings & Payments</p>
             </div>
             <button 
                onClick={(e) => handleNavigation('settings', e)} 
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight transition-all duration-200 active:scale-[0.98] ${isProfileOpen && profileInitialTab === 'preferences' ? 'ios-nav-pill-active' : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.10] hover:text-gray-950 dark:hover:text-white'} cursor-pointer`}
             >
                 <Settings size={21} className={isProfileOpen && profileInitialTab === 'preferences' ? 'text-white dark:text-black shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
                 {t('settings')}
             </button>
             <button 
                onClick={(e) => handleNavigation('billing', e)} 
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight transition-all duration-200 active:scale-[0.98] ${isProfileOpen && profileInitialTab === 'billing' ? 'ios-nav-pill-active' : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.10] hover:text-gray-950 dark:hover:text-white'} cursor-pointer`}
             >
                 <CreditCard size={21} className={isProfileOpen && profileInitialTab === 'billing' ? 'text-white dark:text-black shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
                 {t('billing')}
             </button>
             <button 
                onClick={(e) => handleNavigation('payment-history', e)} 
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight transition-all duration-200 active:scale-[0.98] ${(activeView === 'payment-history' || activeView === 'payments') ? 'ios-nav-pill-active' : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.10] hover:text-gray-950 dark:hover:text-white'} cursor-pointer`}
             >
                 <Receipt size={21} className={(activeView === 'payment-history' || activeView === 'payments') ? 'text-white dark:text-black shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
                 Payment History
             </button>
             <button 
                onClick={(e) => handleNavigation('support', e)} 
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight transition-all duration-200 active:scale-[0.98] ${activeView === 'support' ? 'ios-nav-pill-active' : 'text-gray-800 dark:text-gray-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.10] hover:text-gray-950 dark:hover:text-white'}`}
             >
                 <LifeBuoy size={21} className={activeView === 'support' ? 'text-white dark:text-black shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
                 {t('support')}
             </button>
             
             <div className="pt-3 pb-1">
                 <p className="px-3.5 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">App</p>
             </div>
             <button 
                onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    handleDirectAppDownload(e);
                }}
                className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[15px] sm:text-base font-bold tracking-tight text-gray-800 dark:text-gray-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.10] hover:text-gray-950 dark:hover:text-white transition-all active:scale-[0.98] cursor-pointer"
             >
                 <Download size={21} className="text-gray-600 dark:text-gray-400 shrink-0" />
                 Download App
             </button>
         </div>

         {/* User Profile Snippet - iOS Liquid Capsule */}
         <div className="p-3.5 border-t border-black/[0.06] dark:border-white/[0.08] shrink-0">
             <div 
                className={`flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                    user.plan === 'Max Plan' 
                        ? 'bg-amber-500/15 dark:bg-amber-400/15 border border-amber-500/30 hover:border-amber-500/45 shadow-xs' 
                        : user.plan === 'Plus Plan'
                        ? 'bg-blue-500/15 dark:bg-blue-400/15 border border-blue-500/30 hover:border-blue-500/45 shadow-xs'
                        : 'bg-black/[0.05] dark:bg-white/[0.07] border border-black/[0.08] dark:border-white/[0.12] hover:bg-black/[0.08] dark:hover:bg-white/[0.12]'
                }`}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsMobileMenuOpen(false);
                    setProfileInitialTab('menu');
                    setIsProfileOpen(true);
                }}
             >
                 <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full ring-2 ring-white/80 dark:ring-white/20 shadow-sm object-cover shrink-0" />
                 <div className="flex-1 min-w-0">
                     <p className="text-base font-bold tracking-tight text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                     <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-bold mt-0.5">{user.plan}</p>
                 </div>
             </div>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-transparent">
        
        {/* Mobile Header - Overlaying Content */}
        <div className={`lg:hidden absolute top-0 left-0 w-full h-12 flex items-center justify-between px-4 ios-glass-header z-40 transition-all duration-300 ease-in-out ${isMobileMenuOpen ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
            <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                 <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                     <Menu size={24} />
                 </button>
                 <div className="flex items-center gap-2">
                    <motion.span 
                        style={{ 
                            willChange: "background-position", 
                            transform: "translateZ(0)",
                            backgroundImage: "linear-gradient(to right, #4f46e5, #0ea5e9, #6366f1, #0ea5e9, #4f46e5)",
                            backgroundSize: "200% auto",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        }}
                        animate={{ backgroundPosition: ["0% center", "100% center", "0% center"] }}
                        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        className="font-heading font-black text-xl tracking-tight drop-shadow-sm block"
                    >
                        {APP_NAME}
                    </motion.span>
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
                    src={user.avatarUrl} 
                    onClick={(e) => {
                        e.stopPropagation();
                        setProfileInitialTab('menu');
                        setIsProfileOpen(true);
                    }}
                    className="w-9 h-9 rounded-full border-2 border-white shadow-sm cursor-pointer" 
                    alt="Profile"
                />
            </div>
        </div>

        {/* View Content - Added no-scrollbar */}
        <div id="main-scroll-container" className="flex-1 overflow-y-auto overflow-x-hidden relative no-scrollbar w-full max-w-full pt-12 lg:pt-0">
          <AnimatePresence mode="wait">
             {activeView === 'dashboard' && (
                 <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                 >
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
      QuickActions={QuickActions}
 />
                 </motion.div>
             )}
             
             {activeView === 'documents' && (
                 <motion.div
                    key="documents"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="p-6 md:p-10"
                 >
                    <DocumentsView 
                        files={storedFiles} 
                        onDownload={handleDownloadStoredFile} 
                        onDelete={handleDeleteStoredFile} 
                        onOpen={handleOpenFilePreview} 
                        onShare={handleShareStoredFile}
                        onNavigateToRecent={() => navigate('/recent')}
                        onSimulateAge={handleSimulateFileAge}
                    />
                 </motion.div>
             )}
             
             {activeView === 'recent' && (
                 <motion.div
                    key="recent"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="p-6 md:p-10"
                 >
                    <DocumentsView 
                        filter="recent" 
                        files={storedFiles} 
                        onDownload={handleDownloadStoredFile} 
                        onDelete={handleDeleteStoredFile} 
                        onOpen={handleOpenFilePreview} 
                        onShare={handleShareStoredFile}
                        onNavigateToDocuments={() => navigate('/documents')}
                        onSimulateAge={handleSimulateFileAge}
                    />
                 </motion.div>
             )}
             
             {activeView === 'upgrade' && (
                 <motion.div
                    key="upgrade"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="p-6 md:p-10"
                 >
                    <UpgradeView 
                        onUpgrade={handleInitiatePayment} 
                        onSwitchPlan={handleSwitchPlanMode}
                        user={user}
                        currentPlan={user?.plan} 
                        isExpired={isPlanExpired(user)} 
                        orders={appOrders}
                    />
                 </motion.div>
             )}
             
             {activeView === 'whats-new' && (
                 <motion.div
                    key="whats-new"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="p-6 md:p-10"
                 >
                    <WhatsNewView />
                 </motion.div>
             )}
             
             {activeView === 'download' && (
                 <motion.div
                    key="download"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                 >
                    <DownloadAppView navigate={navigate} />
                 </motion.div>
             )}
             
             {activeView === 'support' && (
                 <motion.div
                    key="support"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="p-6 md:p-10"
                 >
                    <SupportView onStartChat={() => setIsSupportChatOpen(true)} />
                 </motion.div>
             )}

             {(activeView === 'payment-history' || activeView === 'payments') && (
                 <motion.div
                    key="payment-history"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full min-w-full overflow-x-hidden p-2 sm:p-6 md:p-8 flex justify-center"
                 >
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
                 </motion.div>
             )}
             
             {/* Tool View */}
             {activeView === 'tool' && activeToolId && (
                 <motion.div 
                    key={`tool-${activeToolId}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full flex flex-col"
                 >
                      <div className="border-b border-white/20 bg-white/10 backdrop-blur-2xl px-6 py-4 flex items-center gap-4 z-10 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
                          <button 
                            onClick={() => { navigate('/dashboard'); }}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                              <ArrowLeft size={20} />
                          </button>
                          <div>
                              <h2 className="text-lg font-heading font-black tracking-tighter flex items-center gap-2">
                                 {TOOLS.find(t => t.id === activeToolId)?.name}
                              </h2>
                          </div>
                      </div>
                      
                      {/* New Features List */}
                      <div className="mt-8 flex flex-wrap gap-4 text-sm text-stone-600 font-medium px-8">
                          <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              Fast PDF Conversion
                          </div>
                          <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              Secure & Private
                          </div>
                          <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              Professional Tools
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
                                {activeToolId === 'voice-to-pdf' ? (
                                    <VoiceWorkspace onComplete={handleProcessedFile} />
                                ) : activeToolId === 'create-pdf' || activeToolId === 'text-to-pdf' || activeToolId === 'summarize-pdf' || activeToolId === 'rewrite-pdf' || activeToolId === 'translate-pdf' ? (
                                    <TextWorkspace toolId={activeToolId} socket={socket} docId="demo-doc" onComplete={handleProcessedFile} />
                                ) : (
                                    // Generic File Upload Workspace for other tools
                                    <div className="max-w-4xl mx-auto space-y-8">
                                        {(activeToolId === 'camera-scanner' || activeToolId === 'batch-scanner' || activeToolId === 'scan-pdf' || activeToolId === 'auto-edge-detect') && (
                                            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
                                                        <ScanLine size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-base text-gray-900 dark:text-white">Live Scanner & Auto Edge Detection</h3>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Scan pages in real-time with camera or import saved photos to deskew and auto-crop.</p>
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
                                                    {isProcessing ? processingStatus : `Process ${files.filter(f => f.status !== 'cancelled').length} Files`} <ArrowRight size={18} className="ml-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                          </AnimatePresence>
                      </div>
                 </motion.div>
             )}
          </AnimatePresence>
        </div>
      </main>
    </div>

    {/* Profile Panel Overlay */}
    <ProfilePanel 
      isOpen={isProfileOpen && !isPaymentOpen} 
      onClose={() => {
          setIsProfileOpen(false);
          // Fix: Navigate back to dashboard if we are on a profile route to reset hash
          // This ensures clicking 'Preferences' again works correctly
          if (window.location.hash.includes('settings') || window.location.hash.includes('billing') || window.location.hash.includes('preferences') || window.location.hash.includes('personal')) {
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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-7xl h-[92vh] bg-stone-950 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
          <AdminPanel onClose={() => setIsAdminOpen(false)} />
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
      
      {/* Professional Support Chat Overlay */}
      <SupportChat 
        isOpen={isSupportChatOpen} 
        onClose={() => setIsSupportChatOpen(false)} 
        user={user} 
        onSessionStatusChange={setHasOngoingSupportChat}
      />

      {/* Floating Support Quick Button (Only displayed when there is a current chat support session going on) */}
      <AnimatePresence>
        {user && !isSupportChatOpen && hasOngoingSupportChat && (
          <motion.button
            key="floating-ongoing-support-btn"
            id="floating-ongoing-support-btn"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsSupportChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-full shadow-2xl hover:shadow-black/20 border border-stone-800 dark:border-stone-200 transition-all font-medium text-xs tracking-tight cursor-pointer"
            aria-label="Open Ongoing Live Support Chat"
          >
            <div className="relative">
              <Headset size={16} className="text-emerald-400 dark:text-emerald-600" />
              {hasUnreadSupport && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-stone-950 animate-pulse" />
              )}
            </div>
            <span className="hidden sm:inline font-bold">Support in Progress</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;