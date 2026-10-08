import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  containsProfanityOrBadWords, 
  applyUserBanFor1Hour, 
  checkUserBanStatus,
  applyPermanentBan,
  getUserStrikes,
  recordUserStrike,
  setStoredUserStrikes,
  checkPermanentSuspendedStatus
} from '../src/utils/profanityFilter';
import { 
  X, 
  Send, 
  ArrowLeft, 
  Copy, 
  Headset, 
  Sparkles, 
  MessageSquare, 
  Bot, 
  Check, 
  CheckCheck,
  Search, 
  ChevronRight, 
  ChevronDown,
  Zap, 
  CreditCard, 
  FileText, 
  UserCheck, 
  Mail, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  PlusCircle, 
  Paperclip, 
  RotateCcw,
  ExternalLink,
  LifeBuoy,
  Crown,
  PhoneOff
} from 'lucide-react';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebase';
import { User } from '../types';

export interface SupportChatProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  initialTopic?: string;
  onSessionStatusChange?: (hasOngoingChat: boolean) => void;
}

interface ChatMessage {
  id?: string;
  type: 'user' | 'bot' | 'admin' | 'system';
  text: string;
  time: string;
  timestamp?: number;
  isSystemNotice?: boolean;
  attachment?: string;
}

interface QuickTopic {
  id: string;
  icon: React.ReactNode;
  category: string;
  title: string;
  subtitle: string;
  query: string;
  botAnswer: string;
}

interface SupportSessionData {
  sessionId: string;
  chatId: string;
  status: 'active' | 'closed';
  closedReason?: 'inactivity_timeout' | 'user_closed' | 'admin_resolved';
  closedAt?: number;
  createdAt: number;
  lastUserActivity: number;
  hasUserStartedChat?: boolean;
  hasOngoingMessages?: boolean;
}

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const QUICK_TOPICS: QuickTopic[] = [
  {
    id: 'ceo_paperx',
    icon: <Sparkles size={15} className="text-amber-500" />,
    category: 'About PaperX',
    title: 'PaperX & CEO Info',
    subtitle: 'Founder Sayan Biswas & platform vision',
    query: 'Who is the CEO of PaperX and what is PaperX?',
    botAnswer: '✨ **PaperX & Founder Info**\n\n• **Founder & CEO**: Sayan Biswas\n• **Platform**: PaperX is an all-in-one PDF & document intelligence suite powered by Neural OCR (40+ languages), PDF Translation, instant conversions, compression, e-signing, and AES-256 security.'
  },
  {
    id: 'payment_approval',
    icon: <CreditCard size={15} className="text-emerald-500" />,
    category: 'Billing & Plans',
    title: 'Verify 12-Digit UTR',
    subtitle: 'Check UPI approval or speed up verification',
    query: 'I completed payment via UPI QR code. Please verify my 12-digit UTR reference and approve my membership.',
    botAnswer: '⚡ **Payment & Membership Verification**\n\n• Thank you for subscribing! Your verification request is queued with priority.\n• The PaperX verification desk matches your 12-digit bank UTR reference within 5–10 minutes.\n• Once verified, your account tier upgrades automatically across all your devices.\n\n💬 Feel free to paste your 12-digit UTR number or attach the transaction receipt here!'
  },
  {
    id: 'limits_files',
    icon: <Zap size={15} className="text-blue-500" />,
    category: 'Limits & Performance',
    title: 'File & Page Limits',
    subtitle: '1GB batch limit & upload rules',
    query: 'What are the file size and page limits for conversions and batch processing?',
    botAnswer: '📄 **PaperX Processing Limits & Plans**\n\n• **Free Tier (₹0)**: 5 operations quota, up to 50MB per file, 1 device, 100 pages per conversion.\n• **Pro Plan (₹29/mo | ₹145 for 6 mo | ₹290/yr)**: 100 operations quota, up to 250MB per file, 3 devices, unlimited pages & priority conversion queue.\n• **Max Plan (₹49/mo | ₹245 for 6 mo | ₹490/yr)**: 1,000 operations quota, up to 1GB per file, 5 devices, unlimited pages, VIP dedicated cluster & parallel batch engine.'
  },
  {
    id: 'ocr_tools',
    icon: <FileText size={15} className="text-emerald-500" />,
    category: 'Features',
    title: 'OCR & Text Extraction',
    subtitle: 'Extract text from scanned PDFs & images',
    query: 'How do I extract text from scanned documents or translate PDFs accurately?',
    botAnswer: '🔍 **OCR & Text Extraction Guide**\n\n• Use our **OCR / Extract Text** tool for image and PDF scans.\n• For sharpest precision, upload clean scans at 300 DPI with standard orientation.\n• PaperX supports 40+ global languages with automated script detection.'
  },
  {
    id: 'human_officer',
    icon: <UserCheck size={15} className="text-purple-500" />,
    category: 'Live Support',
    title: 'Talk to Live Specialist',
    subtitle: 'Connect directly with on-duty operations team',
    query: 'I need assistance from a live customer support specialist.',
    botAnswer: '👨‍💼 **Live Specialist Dispatched**\n\n• A direct priority notification has been sent to our on-duty support operations desk.\n• PaperX Team will review your account details and reply in this thread shortly.\n• Replies are saved in real-time — feel free to write down any specific questions!'
  },
  {
    id: 'talk_with_ceo',
    icon: <Crown size={15} className="text-amber-500" />,
    category: 'Executive Line',
    title: 'Talk with CEO',
    subtitle: 'Direct high-priority line to CEO Sayan Biswas on Telegram',
    query: 'Talk with CEO: I would like to speak directly with CEO Sayan Biswas.',
    botAnswer: '👑 **Connected to CEO Sayan Biswas**\n\n• Your inquiry has been escalated directly to CEO Sayan Biswas\'s personal executive desk on Telegram.\n• Sayan Biswas and the executive team will review your message and reply directly in this live chat shortly!\n• You can write any additional questions or details right here.'
  }
];

const FAQS = [
  // ==========================================
  // 1. BILLING & PLANS
  // ==========================================
  {
    category: "Billing & Plans",
    q: "How do I upgrade my plan and verify payment?",
    a: "1. Open Profile or the side menu and select 'Billing & Plans'.\n2. Choose your preferred plan and billing duration:\n   • Pro Plan: ₹29/month | ₹145 for 6 Months (Save ₹29) | ₹290 for 1 Year (Save ₹58) — includes 100 operations quota, 250MB per file, 3 devices.\n   • Max Plan: ₹49/month | ₹245 for 6 Months (Save ₹49) | ₹490 for 1 Year (Save ₹98) — includes 1,000 operations quota, 1GB per file, 5 devices.\n   • Active Membership Credit: Upgrading from Pro to Max automatically credits your active Pro plan value as an instant discount, so you only pay the net difference.\n3. Scan the official dynamic UPI QR code with any UPI app (Google Pay, PhonePe, Paytm, BHIM, CRED, Navi, or banking apps) or tap to pay via UPI intent on mobile.\n4. Complete the transfer and copy the 12-digit numeric UTR / Bank Reference Number from your payment receipt.\n5. Paste the 12-digit UTR into the verification box and click 'Submit Verification'.\n6. Automatic bank reconciliation activates your account within 5 to 15 minutes. You can also paste your UTR in Live Chat for immediate instant activation. All plans include a 48-hour 100% money-back guarantee."
  },
  {
    category: "Billing & Plans",
    q: "What is the 12-digit UTR and where do I find it in my UPI app?",
    a: "The UTR (Unique Transaction Reference) is the official 12-digit numeric reference generated by Indian banking servers (NPCI) for every UPI transaction.\n\nWhere to find it:\n• Google Pay: Tap the payment card > Look for 'UPI transaction ID' (12 digits, e.g., 4278XXXXXXXX).\n• PhonePe: Open History > Tap transaction > Locate 'UTR' or 'Bank Ref No'.\n• Paytm: View the payment receipt > Locate 'UPI Ref No'.\n• CRED / BHIM / Navi: Check transaction details for 'UPI Reference ID' or 'Bank Ref'.\n\nEnsure you enter only the 12 numeric digits without any spaces, letters, slashes, or bank initials."
  },
  {
    category: "Billing & Plans",
    q: "Why is my payment showing pending or unverified?",
    a: "Bank settlements and automatic matching usually complete within 5 to 15 minutes. Common reasons for delays include:\n1. Banking Network Clearing Delay: Occasional inter-bank network clearing congestion on the UPI network.\n2. UTR Typo: Double-check that all 12 digits were typed accurately without missing digits.\n3. Manual Instant Approval: If your payment is still pending after 15 minutes, open Live Support Chat and paste your UTR or upload your payment screenshot. Our on-duty team will verify and activate your membership immediately."
  },
  {
    category: "Billing & Plans",
    q: "Can I get an official invoice or GST billing receipt?",
    a: "Yes! Every verified transaction generates an official downloadable digital receipt stored under 'Payment History' with an encrypted order hash and verification QR code.\n\nFor enterprise invoices featuring your company legal name and GSTIN, email our billing desk at paperx.assist@gmail.com with your registered email and Order ID. Formal GST-compliant tax invoices are issued within 24 hours."
  },
  {
    category: "Billing & Plans",
    q: "What happens when my subscription period ends?",
    a: "When your subscription period ends:\n• Your account gracefully switches to the Free (Basic) tier without abrupt lockouts or losing access.\n• None of your stored documents in Cloud Vault or conversion history are deleted.\n• Free tier limits (5 operations quota, 50MB file size cap, 1 active device, 100 pages per conversion) will apply to future conversions until you renew.\n• You can renew or upgrade your plan at any time from Billing & Plans: Pro (₹29/mo) or Max (₹49/mo) with no penalties or hidden fees."
  },
  {
    category: "Billing & Plans",
    q: "Who founded PaperX and how can I speak directly with the CEO?",
    a: "Sayan Biswas is the Founder & Chief Executive Officer of PaperX. He architected PaperX to deliver an ultra-fast, privacy-first document intelligence platform with neural OCR and layout-preserving translations.\n\nTo connect directly with CEO Sayan Biswas, open Live Support Chat and select 'Talk with CEO'. This immediately dispatches a high-priority direct alert to his executive desk on Telegram, allowing direct communication. You can also reach him via paperx.assist@gmail.com."
  },

  // ==========================================
  // 2. FILE PROCESSING & LIMITS
  // ==========================================
  {
    category: "File Processing",
    q: "What file formats does PaperX support?",
    a: "PaperX provides native, high-performance processing for all standard document types:\n• PDF Formats: Standard PDF, Searchable OCR PDF, and ISO-standardized PDF/A (1b/2b) for legal archival.\n• Microsoft Office: Word (.docx, .doc), Excel (.xlsx, .xls), and PowerPoint (.pptx, .ppt).\n• Images: JPG, JPEG, PNG, WebP, TIFF, SVG, BMP, and GIF.\n• Data & Text: TXT, CSV, HTML, and Markdown (.md).\n• Archives: Multi-file ZIP compilation and extraction."
  },
  {
    category: "File Processing",
    q: "What are the file size and page limits for each plan?",
    a: "• Free (Basic Plan): ₹0 | 5 operations quota | Up to 50MB per file | 1 active device | 100 pages per conversion task.\n• Pro Plan (₹29/mo | ₹145 for 6 mo | ₹290/yr): 100 operations quota | Up to 250MB per file | 3 active devices | Unlimited pages | Prioritized conversion queue.\n• Max Plan (₹49/mo | ₹245 for 6 mo | ₹490/yr): 1,000 operations quota | Up to 1GB per file | 5 active devices | Unlimited pages | VIP dedicated conversion cluster & parallel batch conversion engine."
  },
  {
    category: "File Processing",
    q: "How does batch file conversion work?",
    a: "You can drag and drop multiple files at once into any conversion workspace. PaperX queues and executes tasks in parallel using distributed worker threads and client-side processing. Once processing completes, you can choose to download files individually or save a single consolidated ZIP archive containing all converted documents. Batch multi-file conversion is supported on Pro (100 ops quota) and Max (1,000 ops quota) plans."
  },
  {
    category: "File Processing",
    q: "How do I compress large PDF documents without losing quality?",
    a: "Open the Compress PDF tool and choose between two smart compression algorithms:\n• Balanced Compression (Recommended): Retains crisp vector outlines, sharp typography, and 150 DPI graphics. Perfect for business proposals, contracts, resumes, and high-quality printing.\n• Maximum Compression: Significantly reduces file size by up to 80-90% by downsampling images to 72 DPI and stripping redundant font subsets. Ideal for email attachments, online job portals, and strict government upload limits."
  },
  {
    category: "File Processing",
    q: "Can PaperX process password-protected PDFs?",
    a: "Yes!\n• Unlock PDF: If you know the document password, upload your encrypted document and type the password when prompted. PaperX decrypts the PDF using standard AES-256 routines and outputs an unrestricted copy.\n• Protect PDF: You can also secure sensitive documents with military-grade 256-bit AES encryption with your custom password before sharing."
  },

  // ==========================================
  // 3. OCR & ADVANCED TOOLS
  // ==========================================
  {
    category: "OCR & Tools",
    q: "How does Optical Character Recognition (OCR) work?",
    a: "PaperX uses a neural vision OCR pipeline that inspects pixel data in scanned documents, photos, and book pages. Rather than simple text scraping, our model recognizes typographic layout, columns, tables, headers, and handwriting.\n\nOutput options include:\n• Editable Word (.docx): Fully editable document retaining tables, margins, and styles.\n• Searchable PDF: Preserves original scan appearance with an invisible text layer for searching and copying.\n• Plain Text (.txt): Clean extracted raw text ready for copying or feeding into AI workflows."
  },
  {
    category: "OCR & Tools",
    q: "What languages are supported for OCR and document translation?",
    a: "PaperX supports over 40 global languages with automatic language and script detection:\n• Indian Languages: Hindi (हिन्दी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Marathi (मराठी), Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ), Punjabi (ਪੰਜਾਬੀ), Malayalam (മലയാളം), Urdu (اردو).\n• Global Languages: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Chinese (Simplified & Traditional), Korean, Arabic, Turkish, Dutch, Vietnamese, Thai, Indonesian, and more."
  },
  {
    category: "OCR & Tools",
    q: "How does document translation preserve the original layout?",
    a: "Unlike basic text translators that break formatting, PaperX's Translate PDF tool maps every text bounding box, font size, paragraph flow, image placement, and table cell. It translates the content into your selected target language while preserving the exact layout, margins, and branding of the original document."
  },
  {
    category: "OCR & Tools",
    q: "How can I merge, split, or reorder PDF pages?",
    a: "• Merge PDF: Drag and drop two or more PDF files, drag to reorder their sequence, and click 'Merge PDF' to combine them into one seamless master file.\n• Split PDF: Choose to extract individual pages or specify custom page ranges (e.g., 1-4, 8, 12-15).\n• Organize PDF: Visual interactive grid allowing you to drag pages to reorder, rotate individual pages 90°/180°, or delete unwanted pages with one click."
  },
  {
    category: "OCR & Tools",
    q: "Can I add e-signatures or custom watermarks?",
    a: "Yes!\n• Sign & Protect: Draw your signature with a touch screen/mouse, type your initials, or upload a scanned signature image with transparent background. Position and resize it on any page.\n• Watermark PDF: Add custom text watermarks (e.g., 'CONFIDENTIAL', 'DRAFT') or company logos. Control opacity (10% to 100%), rotation angle (diagonal 45° or horizontal), and page ranges."
  },
  {
    category: "OCR & Tools",
    q: "How does the Camera Scanner feature work?",
    a: "Open Camera Scanner on your mobile phone or laptop webcam:\n1. Point your camera at a physical document or book page.\n2. The engine automatically detects document corners, straightens perspective distortion, and crops backgrounds.\n3. Apply high-contrast B&W or Document Sharpening filters for crystal-clear readability.\n4. Capture multiple pages in succession and export directly into a single unified multi-page PDF."
  },

  // ==========================================
  // 4. SECURITY & PRIVACY
  // ==========================================
  {
    category: "Security & Privacy",
    q: "Is my document data secure and confidential?",
    a: "Yes, security and privacy are built into PaperX's core architecture:\n• In Transit: All uploads and downloads are encrypted with enterprise-grade TLS 1.3 protocols.\n• At Rest: Files are encrypted using military-grade AES-256 encryption.\n• Zero-Knowledge Processing: Temporary conversion files exist only in ephemeral server RAM and are automatically and permanently purged upon download completion.\n• ISO Compliance: Supports PDF/A ISO standard archival formats for legal and regulatory compliance."
  },
  {
    category: "Security & Privacy",
    q: "How long are uploaded files stored on PaperX servers?",
    a: "• Temporary Conversion Files: Automatically wiped and shredded from memory immediately after processing or within 1 hour maximum.\n• Vault / Saved Files: Only saved if you are logged into your registered account and explicitly choose to save to your private Cloud Vault. You can permanently delete any saved document at any time from 'My Documents'."
  },
  {
    category: "Security & Privacy",
    q: "Does PaperX train AI models on user documents?",
    a: "Strictly Never. PaperX enforces a strict zero-retention, zero-training data policy. Your private contracts, financial statements, medical records, and scanned IDs are never inspected by humans, never sold, and never used to train, fine-tune, or benchmark AI models."
  },
  {
    category: "Security & Privacy",
    q: "How does multi-device session security work?",
    a: "Your account tracks active logins with device type (desktop, mobile, tablet), browser, OS, and approximate location. Maximum active devices supported per plan:\n• Free (Basic Plan): 1 active device\n• Pro Plan (₹29/mo): Up to 3 active devices simultaneously\n• Max Plan (₹49/mo): Up to 5 active devices simultaneously\nGo to Profile > Active Sessions to view all devices currently signed in to your account. You can remotely log out of any unfamiliar session with a single tap."
  },

  // ==========================================
  // 5. TROUBLESHOOTING & SUPPORT
  // ==========================================
  {
    category: "Troubleshooting",
    q: "What should I do if a file conversion fails or hangs?",
    a: "Follow these quick diagnostic steps:\n1. Check Password Protection: If the PDF is password-protected, use Unlock PDF first.\n2. Verify File Size & Quota: Ensure the file is within your plan limits (50MB Free, 250MB Pro, 1GB Max) and that you have remaining operations in your daily quota (5 Free, 100 Pro, 1,000 Max).\n3. Check File Integrity: Open the file on your device to ensure it is not corrupt or incomplete.\n4. Browser Cache & Extensions: Disable aggressive extensions that block WebAssembly workers, or try an incognito window.\n5. Instant Help: Open Live Support Chat to report the issue directly to our technical team for immediate resolution."
  },
  {
    category: "Troubleshooting",
    q: "Why is OCR text formatting slightly misaligned?",
    a: "OCR accuracy relies on source image clarity:\n• Resolution: For best results, use scans at 300 DPI. Low-resolution photos (< 150 DPI) can lead to character misreads.\n• Lighting & Glare: Ensure document pages are well-lit and flat, without harsh shadows or glossy glare.\n• Orientation: Use Rotate PDF to ensure pages are right-side-up before running OCR."
  },
  {
    category: "Troubleshooting",
    q: "How does the 10-minute inactivity chat system work?",
    a: "To protect user privacy on shared devices and optimize support channels, ongoing support chat sessions automatically close if there is no response from the user for 10 consecutive minutes. If you return after 10 minutes of inactivity, opening the chat automatically starts a fresh new conversation for you."
  },
  {
    category: "Troubleshooting",
    q: "What is the app's policy on abusive language and hate?",
    a: "PaperX strictly prohibits hate speech, vulgar slangs, and abusive language directed at the platform or staff. Violations trigger an automated 3-warning system with 1-hour chat suspensions. If a user exceeds 3 warnings, their email and Google account are permanently banned from PaperX, blocking all access to the app."
  },
  {
    category: "Troubleshooting",
    q: "How do I connect with a live customer support specialist?",
    a: "Click 'Open Live Chat' on this page or tap the headset icon in the sidebar. Our PaperX AI responds instantly 24/7 with accurate step-by-step guidance. If you need human executive support or wish to discuss business partnerships, select 'Talk with CEO' in the chat, or email us at paperx.assist@gmail.com."
  }
];

// Helper to get time-based greeting (Good morning / Good afternoon / Good evening)
const getRealTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Helper to render text with bold and bullet highlights cleanly
const formatMessageText = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <span key={idx} className="block leading-relaxed">
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-semibold text-stone-900 dark:text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </span>
    );
  });
};

const EMOJIS = ['👋', '⚡', '👍', '🙏', '📄', '✅', '❤️', '🔥', '😊', '💳'];

function getLocalSupportFallback(query: string): string {
  const q = query.toLowerCase().trim();

  if (
    q.includes('talk with ceo') ||
    q.includes('talk to ceo') ||
    q.includes('speak with ceo') ||
    q.includes('speak to ceo') ||
    q.includes('connect with ceo') ||
    q.includes('connect to ceo') ||
    q.includes('contact ceo') ||
    q.includes('reach ceo') ||
    q.includes('chat with ceo') ||
    q.includes('message ceo') ||
    q.includes('call ceo') ||
    q.includes('talk to sayan') ||
    q.includes('talk with sayan') ||
    q.includes('meet ceo') ||
    q.includes('escalate to ceo') ||
    q.includes('ceo support')
  ) {
    return `👑 **Connecting You to CEO Sayan Biswas**\n\nYour message has been dispatched with high priority directly to CEO Sayan Biswas's personal executive desk on Telegram.\n\n• **Status**: Transmitted to CEO Admin Panel\n• **Direct Recipient**: Sayan Biswas (Founder & CEO)\n• **Next Step**: Sayan Biswas and the executive team will review your message and reply directly inside this chat thread shortly!\n\nPlease feel free to write down any additional details here while you wait.`;
  }

  if (q.includes('who is ceo') || q.includes('who made') || q.includes('who is sayan') || q.includes('founder') || q.includes('owner') || q.includes('creator') || q.includes('who built')) {
    return `Sayan Biswas is the Founder & CEO of PaperX. He created PaperX to deliver an all-in-one document intelligence platform featuring Neural OCR, PDF Translation, and high-performance document processing. If you want to talk directly with him, simply choose or type **"Talk with CEO"**!`;
  }

  if (q.includes('how are') || q.includes('how r u') || q.includes('how do you do') || q.includes('whats up') || q.includes("what's up")) {
    return `I am doing great! PaperX AI Support is 100% active and operational. How can I assist you with PaperX tools, PDF conversions, or account plans today?`;
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('namaste') || q.includes('hola') || q.includes('greetings')) {
    return `Hello! Welcome to PaperX Support. I am your AI assistant. How can I help you with our PDF tools, OCR, translation, or subscription plans today?`;
  }

  if (q.includes('thank') || q.includes('thanks') || q.includes('good') || q.includes('awesome') || q.includes('great')) {
    return `You are very welcome! If you have any other questions about PaperX tools or features, feel free to ask anytime.`;
  }

  if (q.includes('paperx') || q.includes('what is paperx') || q.includes('about app') || q.includes('what can this app do')) {
    return `PaperX is an all-in-one PDF and document intelligence platform. It includes Neural OCR (40+ languages), PDF Translation with layout preservation, PDF Conversion (Word, Excel, PPT, Images), Merge, Split, Compress, e-Sign, and Password Security.`;
  }

  if (q.includes('ocr') || q.includes('extract') || q.includes('scan') || q.includes('text') || q.includes('image to text')) {
    return `To extract text with OCR on PaperX:\n1. Open **OCR & Text Extract**.\n2. Upload your scanned PDF or photo (JPG, PNG, WebP).\n3. Choose your language (40+ languages supported).\n4. Select export format: **Word (.docx)**, **Searchable PDF**, or **Plain Text (.txt)**.\n5. Click **Extract Text** to download.`;
  }

  if (q.includes('translat') || q.includes('language') || q.includes('bilingual')) {
    return `To translate documents with layout preservation:\n1. Open **Translate PDF**.\n2. Upload your PDF file.\n3. Choose target language (40+ global languages).\n4. Enable **Preserve Layout**.\n5. Click **Translate Document** to download.`;
  }

  if (
    q.includes('debit') || 
    q.includes('deduct') || 
    (q.includes('money') && (q.includes('not') || q.includes('cut') || q.includes('deducted'))) || 
    (q.includes('plan') && (q.includes('not') || q.includes('pending') || q.includes('issue') || q.includes('failed'))) || 
    (q.includes('paid') && (q.includes('not') || q.includes('pending'))) || 
    q.includes('not upgrade') ||
    q.includes('not upgraded') ||
    q.includes('payment issue')
  ) {
    return `⚡ **Payment Verification & Plan Upgrade Assistance**\n\n• If your money was debited but your plan is not yet upgraded, please submit your **12-digit UPI UTR / Bank Reference number** in the Upgrade modal or paste it right here in this chat.\n• You can also attach your payment screenshot or transaction receipt using the paperclip button below.\n• The PaperX billing desk verifies the bank settlement credit and activates your Pro/Max membership within **5–10 minutes**!`;
  }

  if (q.includes('refund') || q.includes('money back') || q.includes('cancellation') || q.includes('cancel') || q.includes('return policy') || q.includes('payout')) {
    return `🛡️ **PaperX 100% Refund & Cancellation Policy:**\n\n• **48-Hour (2-Day) Upgrade Guarantee**: If you subscribed to a membership and upgrade to a higher tier within 48 hours, you get an instant 100% full refund on your original plan.\n• **Duplicate Charges**: 100% automatic refund for accidental double payments or duplicate transactions.\n• **Money Debited but Plan Inactive**: Instant full refund or manual plan credit within 5–10 minutes if your bank debited funds but the upgrade didn't reflect.\n• **Technical Failures**: Full refund if persistent technical errors prevent you from using your paid features.\n• **Processing Speed**: Refund approval and dispatch takes **1–12 hours**, credited directly back to your original payment method (UPI / Bank / Card).\n\n📝 **How to Claim Your Refund:**\n1. Send your **12-digit UPI UTR / Bank Reference Number** right here in Live Chat or email **paperx.assist@gmail.com**.\n2. Include your registered email or phone number.\n3. Our billing desk reviews and settles your refund immediately!`;
  }

  if (q.includes('utr') || q.includes('bill') || q.includes('plan') || q.includes('upgrade') || q.includes('money') || q.includes('membership') || q.includes('receipt') || q.includes('pricing') || q.includes('price')) {
    return `**PaperX Official Plans & Pricing:**\n• **Free (Basic Plan)**: ₹0 | 5 operations quota | Up to 50MB per file | 1 active device.\n• **Pro Plan**: ₹29/month | ₹145 for 6 Months (Save ₹29) | ₹290 for 1 Year (Save ₹58) — includes 100 operations quota, 250MB per file, 3 devices, priority conversion queue.\n• **Max Plan**: ₹49/month | ₹245 for 6 Months (Save ₹49) | ₹490 for 1 Year (Save ₹98) — includes 1,000 operations quota, 1GB per file, 5 devices, VIP dedicated cluster.\n• **Active Membership Credit**: When upgrading from Pro to Max within your cycle, your active membership value is credited directly as an instant discount!\n\nTo upgrade, visit Profile > Billing & Plans, pay via official UPI QR code or mobile UPI intent, and submit your 12-digit UTR reference number.`;
  }

  if (q.includes('convert') || q.includes('word') || q.includes('excel') || q.includes('powerpoint') || q.includes('jpg') || q.includes('png')) {
    return `PaperX includes full conversion tools:\n- **PDF to Word / Excel / PPT**\n- **Images to PDF**\n- **Merge & Split PDF**\n- **Compress PDF**\nSelect your tool from the top navigation bar, upload your file, and process instantly.`;
  }

  if (q.includes('compress') || q.includes('size') || q.includes('shrink') || q.includes('mb')) {
    return `To compress PDF files:\n1. Open **Compress PDF**.\n2. Choose **Balanced Compression** or **Maximum Compression**.\n3. Download your optimized file instantly.`;
  }

  return `PaperX AI Support is active and operational. All tools including Neural OCR, PDF Translation, and Document Conversions are available. Please ask any question about PaperX features, pricing, or CEO Sayan Biswas for instant accurate answers!`;
}

const getInitialSupportData = (userUid?: string) => {
  const storageKey = userUid ? `paperx_support_session_user_${userUid}` : `paperx_support_session_guest`;
  let session: SupportSessionData | null = null;
  let msgs: ChatMessage[] = [];
  let isClosedVal = false;
  let reason: string | null = null;
  let lastAct = Date.now();

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      session = JSON.parse(raw);
      if (session) {
        lastAct = session.lastUserActivity || session.createdAt || Date.now();
        const elapsed = Date.now() - lastAct;
        const isPast10Min = elapsed >= INACTIVITY_TIMEOUT_MS;
        if (session.status === 'closed' || (session.hasUserStartedChat && isPast10Min)) {
          isClosedVal = true;
          reason = session.closedReason || 'inactivity_timeout';
        }
        if (session.chatId) {
          const rawMsgs = localStorage.getItem(`paperx_support_messages_${session.chatId}`);
          if (rawMsgs) {
            msgs = JSON.parse(rawMsgs);
          }
        }
      }
    }
  } catch (e) {}

  return { session, msgs, isClosedVal, reason, lastAct };
};

export const SupportChat: React.FC<SupportChatProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  initialTopic, 
  onSessionStatusChange 
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'faqs'>('chat');
  const initialSupportRef = useRef<{ uid?: string; data: ReturnType<typeof getInitialSupportData> } | null>(null);
  if (!initialSupportRef.current || initialSupportRef.current.uid !== user?.uid) {
    initialSupportRef.current = {
      uid: user?.uid,
      data: getInitialSupportData(user?.uid)
    };
  }

  const [chatSession, setChatSession] = useState<SupportSessionData | null>(() => initialSupportRef.current!.data.session);
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialSupportRef.current!.data.msgs);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('All');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [attachmentData, setAttachmentData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inactivity & Session Management States
  const [isClosed, setIsClosed] = useState<boolean>(() => initialSupportRef.current!.data.isClosedVal);
  const [closedReason, setClosedReason] = useState<string | null>(() => initialSupportRef.current!.data.reason);
  const [lastUserActivityTime, setLastUserActivityTime] = useState<number>(() => initialSupportRef.current!.data.lastAct);
  const [showEndChatConfirm, setShowEndChatConfirm] = useState<boolean>(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const initialMessageCountRef = useRef<number>(initialSupportRef.current!.data.msgs.length);

  // 1-Hour Suspension & 3-Warning Tracking
  const [userStrikes, setUserStrikes] = useState<number>(() => {
    return getUserStrikes(user?.email || user?.uid);
  });
  const [bannedUntil, setBannedUntil] = useState<number | null>(() => {
    const status = checkUserBanStatus(user?.email || user?.uid);
    return status.isBanned && !status.isPermanent ? status.banUntil : null;
  });
  const [banCountdown, setBanCountdown] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const status = checkUserBanStatus(user?.email || user?.uid);
      const currentStrikes = status.strikes || getUserStrikes(user?.email || user?.uid);
      setUserStrikes(status.isBanned ? Math.max(1, currentStrikes) : currentStrikes);
      if (status.isBanned && !status.isPermanent) {
        setBannedUntil(status.banUntil);
        const secTotal = Math.max(0, Math.floor(status.timeRemainingMs / 1000));
        const mins = Math.floor(secTotal / 60);
        const secs = secTotal % 60;
        setBanCountdown(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      } else {
        setBannedUntil(null);
        setBanCountdown('');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    const handleBanEvent = () => updateCountdown();
    window.addEventListener('paperx_ban_updated', handleBanEvent);
    window.addEventListener('paperx_permanent_ban_updated', handleBanEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('paperx_ban_updated', handleBanEvent);
      window.removeEventListener('paperx_permanent_ban_updated', handleBanEvent);
    };
  }, [user?.email, user?.uid]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getStorageKey = useCallback(() => {
    return user?.uid ? `paperx_support_session_user_${user.uid}` : `paperx_support_session_guest`;
  }, [user?.uid]);

  const prevOngoingRef = useRef<boolean | null>(null);
  const onSessionStatusChangeRef = useRef(onSessionStatusChange);
  const getStorageKeyRef = useRef(getStorageKey);

  useEffect(() => {
    onSessionStatusChangeRef.current = onSessionStatusChange;
    getStorageKeyRef.current = getStorageKey;
  });

  // Synchronize active ongoing chat status to parent and local storage
  useEffect(() => {
    const hasOngoing = !isClosed && chatSession?.status === 'active' && messages.length > 0 && (Date.now() - lastUserActivityTime < INACTIVITY_TIMEOUT_MS);
    if (prevOngoingRef.current === hasOngoing) return;
    prevOngoingRef.current = hasOngoing;

    if (onSessionStatusChangeRef.current) {
      onSessionStatusChangeRef.current(hasOngoing);
    }
    try {
      const key = getStorageKeyRef.current();
      const raw = localStorage.getItem(key);
      if (raw) {
        const session = JSON.parse(raw);
        session.hasOngoingMessages = hasOngoing;
        session.hasUserStartedChat = messages.length > 0;
        session.status = isClosed ? 'closed' : session.status;
        localStorage.setItem(key, JSON.stringify(session));
      }
    } catch (e) {}
  }, [messages.length, isClosed, chatSession?.status, lastUserActivityTime]);

  const recordUserActivity = useCallback(() => {
    const now = Date.now();
    setLastUserActivityTime(now);
    try {
      const key = getStorageKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const session: SupportSessionData = JSON.parse(raw);
        session.lastUserActivity = now;
        if (session.status !== 'closed') {
          session.status = 'active';
        }
        localStorage.setItem(key, JSON.stringify(session));
      }
    } catch (e) {}
  }, [getStorageKey]);

  // Persist full message history for active chat session
  useEffect(() => {
    if (!chatSession?.chatId || messages.length === 0) return;
    try {
      localStorage.setItem(`paperx_support_messages_${chatSession.chatId}`, JSON.stringify(messages));
    } catch (e) {}
  }, [messages, chatSession?.chatId]);

  const generateNewSession = useCallback((reasonToReset?: string): SupportSessionData => {
    const now = Date.now();
    const newSessionId = `${now.toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const baseId = user?.uid ? `user_${user.uid}` : `guest_${Math.random().toString(36).substring(2, 8)}`;
    const newChatId = `${baseId}_${newSessionId}`;

    const sessionData: SupportSessionData = {
      sessionId: newSessionId,
      chatId: newChatId,
      status: 'active',
      createdAt: now,
      lastUserActivity: now,
      hasUserStartedChat: false,
      hasOngoingMessages: false
    };

    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(sessionData));
    } catch (e) {
      console.warn("Storage write note:", e);
    }

    setChatSession(sessionData);
    setIsClosed(false);
    setClosedReason(null);
    setLastUserActivityTime(now);
    setMessages([]);
    return sessionData;
  }, [user?.uid, getStorageKey]);

  // Initialize or resume chat session when modal opens or in background
  useEffect(() => {
    const storageKey = getStorageKey();
    let currentSession: SupportSessionData | null = null;

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        currentSession = JSON.parse(raw);
      }
    } catch (e) {
      currentSession = null;
    }

    const now = Date.now();

    if (!isOpen) {
      // Just load session state silently in background if it exists
      if (currentSession) {
        const lastAct = currentSession.lastUserActivity || currentSession.createdAt || now;
        const elapsed = now - lastAct;
        const isPast10Min = elapsed >= INACTIVITY_TIMEOUT_MS;

        let savedMsgs: ChatMessage[] = [];
        try {
          const rawMsgs = localStorage.getItem(`paperx_support_messages_${currentSession.chatId}`);
          if (rawMsgs) {
            savedMsgs = JSON.parse(rawMsgs);
          }
        } catch (e) {}

        if (currentSession.status === 'closed' || (currentSession.hasUserStartedChat && isPast10Min)) {
          if (currentSession.status !== 'closed') {
            currentSession.status = 'closed';
            currentSession.closedReason = currentSession.closedReason || 'inactivity_timeout';
            currentSession.closedAt = currentSession.closedAt || now;
            currentSession.hasOngoingMessages = false;
            try {
              localStorage.setItem(storageKey, JSON.stringify(currentSession));
            } catch (e) {}

            // Update on Firestore silently too!
            if (currentSession.chatId) {
              const systemNoticeMsg = {
                id: `msg_sys_${now}`,
                sender: 'system',
                senderName: 'System Notice',
                text: '⏱️ This chat session has been closed due to 10 minutes of inactivity.',
                timestamp: now,
                isSystemNotice: true
              };
              const chatRef = doc(db, 'support_chats', currentSession.chatId);
              updateDoc(chatRef, {
                status: 'closed',
                closedReason: 'inactivity_timeout',
                closedAt: now,
                messages: arrayUnion(systemNoticeMsg),
                lastMessage: 'Chat closed due to 10 minutes of inactivity'
              }).catch((e) => {
                console.warn("Firestore status update notice:", e);
              });
            }
          }

          setChatSession(currentSession);
          setIsClosed(true);
          setClosedReason(currentSession.closedReason || 'inactivity_timeout');
          setLastUserActivityTime(lastAct);
          if (savedMsgs.length > 0) {
            setMessages(savedMsgs);
          }
        } else {
          setChatSession(currentSession);
          setIsClosed(false);
          setClosedReason(null);
          setLastUserActivityTime(lastAct);
          if (savedMsgs.length > 0) {
            setMessages(savedMsgs);
          }
        }
      }
      return;
    }

    // BELOW IS THE ORIGINAL LOGIC FOR WHEN MODAL OPENS (isOpen === true)
    if (!currentSession) {
      currentSession = generateNewSession('initial');
      return;
    }

    const lastAct = currentSession.lastUserActivity || currentSession.createdAt || now;
    const elapsed = now - lastAct;
    const isPast10Min = elapsed >= INACTIVITY_TIMEOUT_MS;

    // Load exact cached chat history for this session
    let savedMsgs: ChatMessage[] = [];
    try {
      const rawMsgs = localStorage.getItem(`paperx_support_messages_${currentSession.chatId}`);
      if (rawMsgs) {
        savedMsgs = JSON.parse(rawMsgs);
      }
    } catch (e) {}

    // Case 1: Session was closed OR user was inactive for 10 minutes or more
    if (currentSession.status === 'closed' || (currentSession.hasUserStartedChat && isPast10Min)) {
      currentSession.status = 'closed';
      currentSession.closedReason = currentSession.closedReason || 'inactivity_timeout';
      currentSession.closedAt = currentSession.closedAt || now;
      currentSession.hasOngoingMessages = false;
      try {
        localStorage.setItem(storageKey, JSON.stringify(currentSession));
      } catch (e) {}

      setChatSession(currentSession);
      setIsClosed(true);
      setClosedReason(currentSession.closedReason);
      setLastUserActivityTime(lastAct);

      // Preserve full chat history so user sees everything exact!
      if (savedMsgs.length > 0) {
        setMessages(savedMsgs);
      }
      return;
    }

    // Case 2: Active session opened within 10 minutes!
    // "If users open app any times between 10min that time full chat history will there exact"
    // "if users active then unlimited times chat will open if users is active"
    currentSession.status = 'active';
    currentSession.closedReason = undefined;
    try {
      localStorage.setItem(storageKey, JSON.stringify(currentSession));
    } catch (e) {}

    setChatSession(currentSession);
    setIsClosed(false);
    setClosedReason(null);
    setLastUserActivityTime(lastAct);

    if (savedMsgs.length > 0) {
      setMessages(savedMsgs);
    }
  }, [isOpen, getStorageKey, generateNewSession]);

  const activeChatId = chatSession?.chatId || (user?.uid ? `user_${user.uid}` : `guest_temp`);
  const currentUserId = user?.id || user?.uid || (chatSession?.chatId || 'guest');
  const currentUserName = user?.name || (user?.uid ? `User ${user.uid.substring(0, 5)}` : `Guest User`);
  const userFirstName = user?.name ? user.name.trim().split(' ')[0] : '';
  const currentUserEmail = user?.email || 'Guest User';

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      if (smooth) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  // Real-time Firestore subscription to active support_chats thread (deferred 100ms for 60fps entrance)
  useEffect(() => {
    if (!isOpen || !chatSession?.chatId) return;

    let unsubscribe: () => void = () => {};
    const timer = setTimeout(() => {
      const chatRef = doc(db, 'support_chats', chatSession.chatId);
      unsubscribe = onSnapshot(chatRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          
          if (data?.status === 'closed' && !isClosed) {
            setIsClosed(true);
            setClosedReason(data?.closedReason || 'admin_resolved');
          }

          if (data?.abuseStrikes) {
            const s = Number(data.abuseStrikes);
            if (s > 0) {
              setUserStrikes(s);
              setStoredUserStrikes(s, user?.email || user?.uid);
            }
          }
          if (data?.bannedUntil && Number(data.bannedUntil) > Date.now()) {
            setBannedUntil(Number(data.bannedUntil));
          }

          if (data?.messages && Array.isArray(data.messages)) {
            const formatted: ChatMessage[] = data.messages.map((m: any, idx: number) => ({
              id: m.id || `msg_${idx}`,
              type: m.sender === 'user' ? 'user' : (m.sender === 'system' ? 'system' : (m.sender === 'admin' ? 'admin' : 'bot')),
              text: m.text,
              time: m.timestamp 
                ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: m.timestamp || Date.now(),
              isSystemNotice: m.sender === 'system' || m.isSystemNotice === true,
              attachment: m.attachment
            }));

            setMessages(formatted);

            const userMsgs = data.messages.filter((m: any) => m.sender === 'user');
            if (userMsgs.length > 0) {
              const lastUserMsg = userMsgs[userMsgs.length - 1];
              if (lastUserMsg.timestamp) {
                setLastUserActivityTime(lastUserMsg.timestamp);
              }
            }

            const lastMsg = data.messages[data.messages.length - 1];
            if (lastMsg && (lastMsg.sender === 'bot' || lastMsg.sender === 'admin')) {
              setIsTyping(false);
            }
          }

          if (data?.unreadByUser) {
            updateDoc(chatRef, { unreadByUser: false }).catch(() => {});
          }
        }
      }, (err) => {
        console.warn("Support chat snapshot notice:", err);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [isOpen, chatSession?.chatId, isClosed, user?.email, user?.uid]);

  // Secondary subscription for base user doc (support_chats/user_${user.uid}) to catch Telegram broadcast messages
  useEffect(() => {
    if (!isOpen || !user?.uid) return;
    const baseChatId = `user_${user.uid}`;
    if (chatSession?.chatId === baseChatId) return;

    let unsubscribe: () => void = () => {};
    const timer = setTimeout(() => {
      const baseRef = doc(db, 'support_chats', baseChatId);
      unsubscribe = onSnapshot(baseRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.messages && Array.isArray(data.messages)) {
            const adminMessages: ChatMessage[] = data.messages
              .filter((m: any) => m.sender === 'admin')
              .map((m: any, idx: number) => ({
                id: m.id || `admin_base_${idx}_${m.timestamp || Date.now()}`,
                type: 'admin' as const,
                text: m.text,
                time: m.timestamp 
                  ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                  : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: m.timestamp || Date.now(),
                attachment: m.attachment
              }));

            if (adminMessages.length > 0) {
              setMessages(prev => {
                const newMsgs = [...prev];
                let hasNew = false;
                for (const am of adminMessages) {
                  const exists = newMsgs.some(
                    em => em.id === am.id || (em.text === am.text && Math.abs((em.timestamp || 0) - (am.timestamp || 0)) < 15000)
                  );
                  if (!exists) {
                    newMsgs.push(am);
                    hasNew = true;
                  }
                }
                return hasNew ? newMsgs : prev;
              });
              setIsTyping(false);
            }
          }
        }
      }, (err) => {
        console.warn("Base chat snapshot notice:", err);
      });
    }, 120);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [isOpen, user?.uid, chatSession?.chatId]);

  // Direct WebSocket message handler for 0ms instantaneous Telegram message delivery
  useEffect(() => {
    const handleAdminSocketMessage = (event: any) => {
      const detail = event?.detail;
      if (!detail || !detail.message) return;
      const targetUserId = detail.userId ? String(detail.userId).replace(/^user_/, '') : '';
      const currentUid = user?.uid || (user?.id ? String(user.id) : '');

      if (
        (targetUserId && currentUid && (targetUserId === currentUid || targetUserId === user?.email)) ||
        detail.chatId === chatSession?.chatId ||
        detail.chatId === `user_${currentUid}`
      ) {
        const m = detail.message;
        const formatted: ChatMessage = {
          id: m.id || `msg_sock_${Date.now()}`,
          type: m.sender === 'admin' ? 'admin' : (m.sender === 'user' ? 'user' : 'bot'),
          text: m.text,
          time: new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: m.timestamp || Date.now(),
          attachment: m.attachment
        };

        setMessages(prev => {
          if (prev.some(em => em.id === formatted.id || (em.text === formatted.text && Math.abs((em.timestamp || 0) - (formatted.timestamp || 0)) < 10000))) {
            return prev;
          }
          return [...prev, formatted];
        });
        setIsTyping(false);
      }
    };

    window.addEventListener('paperx-admin-chat-message', handleAdminSocketMessage);
    return () => window.removeEventListener('paperx-admin-chat-message', handleAdminSocketMessage);
  }, [user?.uid, user?.id, user?.email, chatSession?.chatId]);

  // Real-time 10-minute Inactivity Detection Interval
  useEffect(() => {
    // Only monitor for inactivity if the user ALREADY started chatting (sent at least one message)
    if (isClosed || !chatSession || (!chatSession.hasUserStartedChat && !messages.some(m => m.type === 'user'))) return;

    const checkInactivity = () => {
      const now = Date.now();
      const lastAct = chatSession.lastUserActivity || lastUserActivityTime || chatSession.createdAt || now;
      const elapsed = now - lastAct;

      // Real 10-minute inactivity check (10 * 60 * 1000 ms = 600,000 ms)
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        setIsClosed(true);
        setClosedReason('inactivity_timeout');

        const updatedSession: SupportSessionData = {
          ...chatSession,
          status: 'closed',
          closedReason: 'inactivity_timeout',
          closedAt: now,
          hasOngoingMessages: false
        };
        setChatSession(updatedSession);

        try {
          localStorage.setItem(getStorageKey(), JSON.stringify(updatedSession));
        } catch (e) {}

        const systemNoticeMsg = {
          id: `msg_sys_${now}`,
          sender: 'system',
          senderName: 'System Notice',
          text: '⏱️ This chat session has been closed due to 10 minutes of inactivity.',
          timestamp: now,
          isSystemNotice: true
        };

        setMessages(prev => {
          if (prev.some(m => m.isSystemNotice && m.text.includes('10 minutes of inactivity'))) {
            return prev;
          }
          const next: ChatMessage[] = [
            ...prev,
            {
              id: systemNoticeMsg.id,
              type: 'system',
              text: systemNoticeMsg.text,
              time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: now,
              isSystemNotice: true
            }
          ];
          try {
            localStorage.setItem(`paperx_support_messages_${chatSession.chatId}`, JSON.stringify(next));
          } catch (_) {}
          return next;
        });

        if (chatSession.chatId) {
          const chatRef = doc(db, 'support_chats', chatSession.chatId);
          updateDoc(chatRef, {
            status: 'closed',
            closedReason: 'inactivity_timeout',
            closedAt: now,
            messages: arrayUnion(systemNoticeMsg),
            lastMessage: 'Chat closed due to 10 minutes of inactivity'
          }).catch((e) => {
            console.warn("Firestore status update notice:", e);
          });
        }
      }
    };

    checkInactivity();
    const interval = setInterval(checkInactivity, 2000);

    return () => clearInterval(interval);
  }, [isClosed, chatSession, lastUserActivityTime, messages, getStorageKey]);

  // Instant scroll on open/tab change without triggering smooth scrolling animations that fight modal entrance
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      scrollToBottom(false);
      const timer = setTimeout(() => scrollToBottom(false), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, scrollToBottom]);

  // Smooth scroll for subsequent message updates while already open
  const prevMsgCountRef = useRef(messages.length);
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      if (messages.length > prevMsgCountRef.current || isTyping) {
        scrollToBottom(true);
      }
      prevMsgCountRef.current = messages.length;
    }
  }, [messages.length, isTyping, isOpen, activeTab, scrollToBottom]);

  const notifyAdmin = async (
    queryText: string, 
    targetChatId: string, 
    hasBotAnswer: boolean = false,
    attachmentObj?: any
  ) => {
    if (hasBotAnswer) return;

    let botReplyText = "";

    try {
      const historyPayload = messages.slice(-10).map(m => ({
        role: m.type === 'user' ? 'user' : 'model',
        text: m.text
      }));

      let payloadAttachment = null;
      if (attachmentObj) {
        if (typeof attachmentObj === 'string') {
          payloadAttachment = {
            data: attachmentObj,
            url: attachmentObj,
            name: 'payment_proof.jpg',
            type: 'image/jpeg',
            mimeType: 'image/jpeg'
          };
        } else {
          payloadAttachment = attachmentObj;
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const res = await fetch('/api/admin/support/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          userId: currentUserId,
          userName: currentUserName,
          userEmail: currentUserEmail,
          query: queryText,
          chatId: targetChatId,
          hasBotAnswer,
          clientStrikes: userStrikes,
          history: historyPayload,
          attachment: payloadAttachment,
          wantsCeo: queryText.toLowerCase().includes('ceo') || queryText.toLowerCase().includes('sayan')
        })
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data?.permanentBanned) {
          applyPermanentBan(data?.botReply, currentUserEmail, currentUserId);
          setUserStrikes(4);
        } else if (data?.banned && data?.bannedUntil) {
          const newStrikes = data.strikes || Math.max(1, (userStrikes || 0) + 1);
          applyUserBanFor1Hour('Abusive language or hate', currentUserEmail, data.bannedUntil, newStrikes);
          setBannedUntil(data.bannedUntil);
          setUserStrikes(newStrikes);
        }

        if (data?.botReply) {
          botReplyText = data.botReply;
        }

        if (data?.planUpgraded) {
          window.dispatchEvent(new CustomEvent('paperx-user-plan-updated', { detail: data }));
        }
      }
    } catch (err) {
      console.warn("Support API dispatch note:", err);
    }

    if (!botReplyText) {
      botReplyText = getLocalSupportFallback(queryText);
    }

    const botNow = Date.now();
    const botMsg = {
      id: `msg_bot_${botNow}`,
      sender: 'bot',
      senderName: 'PaperX Assistant',
      text: botReplyText,
      timestamp: botNow
    };

    const botFormatted: ChatMessage = {
      id: `msg_bot_${botNow}`,
      type: 'bot',
      text: botReplyText,
      time: new Date(botNow).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: botNow
    };

    setMessages(prev => {
      const exists = prev.some(m => m.text === botReplyText && Math.abs(m.timestamp - botNow) < 10000);
      return exists ? prev : [...prev, botFormatted];
    });
    setIsTyping(false);

    try {
      const chatRef = doc(db, 'support_chats', targetChatId);
      await setDoc(chatRef, {
        chatId: targetChatId,
        userId: currentUserId,
        userName: currentUserName,
        userEmail: currentUserEmail,
        messages: arrayUnion(botMsg),
        lastMessage: botReplyText,
        updatedAt: botNow,
        status: 'active',
        unreadByUser: false
      }, { merge: true });
    } catch (fsErr) {
      console.warn("Firestore sync botMsg notice:", fsErr);
    }
  };

  const handleStartNewChat = () => {
    generateNewSession('manual_new');
    setActiveTab('chat');
  };

  const handleEndChatByUser = async () => {
    setShowEndChatConfirm(false);
    const now = Date.now();
    setIsClosed(true);
    setClosedReason('user_closed');

    const endMsg: ChatMessage = {
      id: `msg_user_end_${now}`,
      type: 'system',
      isSystemNotice: true,
      text: 'Chat conversation ended by user.',
      time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now
    };

    setMessages(prev => [...prev, endMsg]);

    if (chatSession) {
      const updated: SupportSessionData = {
        ...chatSession,
        status: 'closed',
        closedReason: 'user_closed',
        closedAt: now,
        hasOngoingMessages: false
      };
      setChatSession(updated);
      try {
        localStorage.setItem(getStorageKey(), JSON.stringify(updated));
        localStorage.setItem(`paperx_support_messages_${chatSession.chatId}`, JSON.stringify([...messages, endMsg]));
      } catch (e) {}
    }

    onSessionStatusChange?.(false);

    if (chatSession?.chatId) {
      try {
        const chatRef = doc(db, 'support_chats', chatSession.chatId);
        await updateDoc(chatRef, {
          status: 'closed',
          closedReason: 'user_closed',
          closedAt: now,
          messages: arrayUnion({
            id: `msg_user_end_${now}`,
            sender: 'system',
            isSystemNotice: true,
            text: 'Chat conversation ended by user.',
            timestamp: now
          }),
          updatedAt: now,
          unreadByAdmin: true
        });
      } catch (err) {
        console.warn("Firestore user end chat note:", err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string, predefinedBotAnswer?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text && !attachmentData) return;

    // 0. Check if account is permanently suspended
    if (checkPermanentSuspendedStatus(currentUserEmail) || user?.isPermanentSuspended) {
      return;
    }

    // 1. Check if user is currently banned/suspended
    const banStatus = checkUserBanStatus(currentUserEmail);
    if (banStatus.isBanned) {
      setBannedUntil(banStatus.banUntil);
      return;
    }

    // 2. Client-side instant check for abusive language / vulgar slang (1-Hour Suspension or Permanent Ban)
    if (text && containsProfanityOrBadWords(text)) {
      const prior = getUserStrikes(currentUserEmail);
      const newStrikes = prior + 1;
      setUserStrikes(newStrikes);

      if (newStrikes > 3) {
        applyPermanentBan('Giving hate and slangs to PaperX after receiving 3 warnings', currentUserEmail, currentUserId);
        setInputValue('');
        setAttachmentData(null);
        const permFormatted: ChatMessage = {
          id: `msg_perm_${Date.now()}`,
          type: 'bot',
          text: '🚫 **Account Permanently Suspended**\n\nYour account has been permanently suspended for giving hate and slangs to PaperX after receiving 3 warnings. Giving hate and slangs is strictly prohibited by our app rules.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, permFormatted]);
        return;
      }

      const res = applyUserBanFor1Hour(
        `Warning ${newStrikes}/3: Inappropriate language or hate against PaperX`,
        currentUserEmail,
        undefined,
        newStrikes
      );
      setBannedUntil(res.banUntil);
      setInputValue('');
      setAttachmentData(null);

      let warnText = "";
      if (newStrikes === 1) {
        warnText = '⚠️ **Warning 1 of 3: Chat Access Suspended for 1 Hour**\n\nYour chat access has been suspended for 60 minutes due to abusive language or hate against PaperX. Giving hate and slangs is strictly prohibited by our app rules. You have 2 warnings remaining before this account is permanently suspended.';
      } else if (newStrikes === 2) {
        warnText = '⚠️ **Warning 2 of 3: Chat Access Suspended for 1 Hour**\n\nYour chat access has been suspended for 60 minutes. This is your second warning for using slangs or hate against PaperX. One more warning will result in permanent account termination.';
      } else {
        warnText = '🚨 **Final Warning 3 of 3: Chat Access Suspended for 1 Hour**\n\nThis is your LAST warning. Any further abusive language, slangs, or hate will PERMANENTLY SUSPEND this account and its associated email without further notice.';
      }

      const banFormatted: ChatMessage = {
        id: `msg_ban_${Date.now()}`,
        type: 'bot',
        text: warnText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, banFormatted]);
      return;
    }

    let targetSession = chatSession;
    if (isClosed || !targetSession || targetSession.status === 'closed') {
      targetSession = generateNewSession('send_message_reset');
    }

    const now = Date.now();
    setInputValue('');
    const attachmentToSent = attachmentData;
    setAttachmentData(null);
    setLastUserActivityTime(now);

    if (targetSession) {
      const updated = {
        ...targetSession,
        lastUserActivity: now,
        status: 'active' as const,
        hasUserStartedChat: true,
        hasOngoingMessages: true
      };
      setChatSession(updated);
      try {
        localStorage.setItem(getStorageKey(), JSON.stringify(updated));
      } catch (e) {}
    }
    
    if (activeTab !== 'chat') {
      setActiveTab('chat');
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const msgId = `msg_${now}_${Math.random().toString(36).substring(2, 6)}`;
    const userMsg: any = {
      id: msgId,
      sender: 'user',
      senderName: currentUserName,
      text,
      timestamp: now
    };
    if (attachmentToSent) {
      userMsg.attachment = attachmentToSent;
    }

    const localFormatted: ChatMessage = {
      id: msgId,
      type: 'user',
      text,
      time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now,
      attachment: attachmentToSent || undefined
    };

    setMessages(prev => [...prev, localFormatted]);

    const destinationChatId = targetSession?.chatId || activeChatId;

    notifyAdmin(text + (attachmentToSent ? ' [Attachment sent]' : ''), destinationChatId, !!predefinedBotAnswer, attachmentToSent);
    if (!predefinedBotAnswer) {
      setIsTyping(true);
    }

    try {
      const chatRef = doc(db, 'support_chats', destinationChatId);
      await setDoc(chatRef, {
        chatId: destinationChatId,
        userId: currentUserId,
        userName: currentUserName,
        userEmail: currentUserEmail,
        messages: arrayUnion(userMsg),
        lastMessage: text,
        updatedAt: now,
        status: 'active',
        lastUserActivity: now,
        unreadByAdmin: true,
        unreadByUser: false
      }, { merge: true });

      if (predefinedBotAnswer) {
        setIsTyping(true);
        setTimeout(async () => {
          const botNow = Date.now();
          const botMsg = {
            id: `msg_bot_${botNow}`,
            sender: 'bot',
            senderName: 'PaperX Assistant',
            text: predefinedBotAnswer,
            timestamp: botNow
          };
          try {
            await updateDoc(chatRef, {
              messages: arrayUnion(botMsg),
              lastMessage: predefinedBotAnswer,
              updatedAt: botNow
            });
          } catch (e) {
            console.warn("Support automated reply note:", e);
          }
          setIsTyping(false);
        }, 600);
      }
    } catch (err) {
      console.warn("Support message sync note:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      recordUserActivity();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    recordUserActivity();
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const copyEmail = () => {
    navigator.clipboard.writeText('paperx.assist@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const copyMessageText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 1800);
  };

  const faqCategories = ['All', 'Billing & Plans', 'File Processing', 'OCR & Tools', 'Security & Privacy', 'Troubleshooting'];

  const filteredFaqs = FAQS.filter(faq => {
    const matchesCategory = selectedFaqCategory === 'All' || faq.category === selectedFaqCategory;
    const query = faqSearch.toLowerCase();
    const matchesSearch = !query || 
      faq.q.toLowerCase().includes(query) || 
      faq.a.toLowerCase().includes(query) ||
      faq.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            setAttachmentData(compressed);
          } else {
            setAttachmentData(rawDataUrl);
          }
          setLastUserActivityTime(Date.now());
        };
        img.onerror = () => {
          setAttachmentData(rawDataUrl);
          setLastUserActivityTime(Date.now());
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachmentData(event.target?.result as string);
        setLastUserActivityTime(Date.now());
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearAttachment = () => {
    setAttachmentData(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          id="support-chat-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[90] bg-stone-950/40 backdrop-blur-sm flex items-end sm:items-auto justify-center sm:justify-end"
          style={{ willChange: 'opacity' }}
          onClick={onClose}
        >
          <motion.div
            id="support-chat-container"
            initial={{ opacity: 0, y: 32, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 22, scale: 0.985 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{ willChange: 'transform, opacity' }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={() => {
              if (!isClosed) recordUserActivity();
            }}
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-6 sm:right-6 w-full sm:w-[440px] h-[92dvh] sm:h-[680px] sm:max-h-[88vh] bg-white dark:bg-[#18191c] rounded-t-[28px] sm:rounded-3xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45),0_0_0_1px_rgba(0,0,0,0.08),inset_0_1.5px_1.5px_0_rgba(255,255,255,0.9)] dark:shadow-[0_24px_70px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1.5px_1.5px_0_rgba(255,255,255,0.12)] border-t border-t-white dark:border-t-white/20 flex flex-col overflow-hidden select-text z-[99] transform-gpu will-change-transform"
          >
          {/* ================= HEADER BAR ================= */}
          <div className="relative px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-b from-white via-stone-50/90 to-stone-100/70 dark:from-[#222328] dark:via-[#1c1d21] dark:to-[#151619] backdrop-blur-xl border-b-[2.5px] border-b-stone-200/90 dark:border-b-stone-950 border-t border-t-white dark:border-t-white/15 flex items-center justify-between flex-shrink-0 z-10 shadow-[0_6px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.03),inset_0_1.5px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6),0_2px_8px_-2px_rgba(0,0,0,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.1),inset_0_-1px_1px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="relative shrink-0">
                <motion.div 
                  whileHover={{ scale: 1.08 }}
                  className="w-9 h-9 rounded-2xl bg-gradient-to-b from-[#1e1f23] via-[#151618] to-[#0c0d0f] dark:from-white dark:via-stone-50 dark:to-stone-100 text-amber-400 dark:text-stone-950 flex items-center justify-center border-t border-t-white/35 dark:border-t-white border-b-[2.5px] border-b-black dark:border-b-stone-350 border-x border-white/10 dark:border-stone-200 shadow-[0_4px_12px_rgba(0,0,0,0.35),inset_0_1.5px_1px_rgba(255,255,255,0.25)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_1.5px_1px_rgba(255,255,255,0.95)]"
                >
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  >
                    <Headset size={18} className="text-amber-400 dark:text-stone-900 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] dark:drop-shadow-none" />
                  </motion.div>
                </motion.div>
              </div>
              
              <div className="min-w-0">
                {!isClosed ? (
                  /* When user is chatting: PaperX AI is shifted to the left side below title so it never overlaps with End Chat button */
                  <div className="flex flex-col items-start justify-center">
                    <h3 className="font-heading font-black text-sm text-stone-900 dark:text-white tracking-tight whitespace-nowrap leading-tight">
                      PaperX Support
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-b from-stone-900 via-stone-900 to-black text-stone-100 dark:from-white dark:via-stone-50 dark:to-stone-100 dark:text-stone-950 border border-stone-800 dark:border-stone-200 border-t-white/20 dark:border-t-white border-b-[1.5px] border-b-black dark:border-b-stone-350 shadow-[0_2px_5px_rgba(0,0,0,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.2)] dark:shadow-[0_2px_5px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,0.9)] select-none shrink-0">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.12, 1] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                          className="flex items-center justify-center shrink-0"
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="shrink-0 overflow-visible"
                          >
                            <defs>
                              <linearGradient id="support-header-real-ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#38bdf8" />
                                <stop offset="30%" stopColor="#818cf8" />
                                <stop offset="65%" stopColor="#c084fc" />
                                <stop offset="100%" stopColor="#f472b6" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M12 0C12 6.62742 6.62742 12 0 12C6.62742 12 12 17.3726 12 24C12 17.3726 17.3726 12 24 12C17.3726 12 12 6.62742 12 0Z"
                              fill="url(#support-header-real-ai-grad)"
                            />
                            <circle cx="12" cy="12" r="2.2" fill="#ffffff" opacity="0.9" />
                          </svg>
                        </motion.div>
                        <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-pink-400 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 bg-clip-text text-transparent font-black tracking-wide">
                          PaperX AI
                        </span>
                      </span>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium truncate">
                        • Instant Support
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-black text-sm text-stone-900 dark:text-white tracking-tight whitespace-nowrap">PaperX Support</h3>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-b from-stone-900 via-stone-900 to-black text-stone-100 dark:from-white dark:via-stone-50 dark:to-stone-100 dark:text-stone-950 border border-stone-800 dark:border-stone-200 border-t-white/20 dark:border-t-white border-b-[1.5px] border-b-black dark:border-b-stone-350 shadow-[0_2px_5px_rgba(0,0,0,0.2),inset_0_1px_0.5px_rgba(255,255,255,0.2)] dark:shadow-[0_2px_5px_rgba(0,0,0,0.08),inset_0_1px_0.5px_rgba(255,255,255,0.9)] select-none shrink-0">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.12, 1] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                          className="flex items-center justify-center shrink-0"
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="shrink-0 overflow-visible"
                          >
                            <defs>
                              <linearGradient id="support-header-real-ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#38bdf8" />
                                <stop offset="30%" stopColor="#818cf8" />
                                <stop offset="65%" stopColor="#c084fc" />
                                <stop offset="100%" stopColor="#f472b6" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M12 0C12 6.62742 6.62742 12 0 12C6.62742 12 12 17.3726 12 24C12 17.3726 17.3726 12 24 12C17.3726 12 12 6.62742 12 0Z"
                              fill="url(#support-header-real-ai-grad)"
                            />
                            <circle cx="12" cy="12" r="2.2" fill="#ffffff" opacity="0.9" />
                          </svg>
                        </motion.div>
                        <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-pink-400 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 bg-clip-text text-transparent font-black tracking-wide">
                          PaperX AI
                        </span>
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Instant AI Answers • Support Desk</p>
                  </div>
                )}
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* End Chat Button (Visible during active conversation) */}
              {!isClosed && (
                <motion.button
                  id="support-end-chat-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setShowEndChatConfirm(true)}
                  title="End and resolve current chat session"
                  aria-label="End current chat session"
                  className="h-8 px-2.5 sm:px-3 rounded-xl bg-gradient-to-b from-rose-50 via-rose-100/80 to-rose-200/70 dark:from-[#2e1216] dark:via-[#260c10] dark:to-[#1a0609] text-rose-600 dark:text-rose-300 hover:text-rose-700 dark:hover:text-rose-200 border-t border-t-rose-300 dark:border-t-rose-400/40 border-b-[2.5px] border-b-rose-400 dark:border-b-rose-950 border-x border-rose-300/80 dark:border-rose-900/60 font-heading font-black text-[11px] tracking-tight flex items-center justify-center gap-1.5 shadow-[0_3px_8px_-2px_rgba(244,63,94,0.25),0_1px_3px_rgba(0,0,0,0.08),inset_0_1.5px_0.5px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(244,63,94,0.15)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.6),inset_0_1.5px_0.5px_rgba(255,255,255,0.1),inset_0_-1px_1px_rgba(0,0,0,0.5)] cursor-pointer select-none transition-all overflow-visible shrink-0"
                >
                  <div className="flex items-center justify-center w-4 h-4 overflow-visible shrink-0">
                    <PhoneOff size={13} strokeWidth={2.3} className="text-rose-600 dark:text-rose-400 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-none overflow-visible" />
                  </div>
                  <span className="font-heading font-black text-[11px] tracking-tight whitespace-nowrap">End Chat</span>
                </motion.button>
              )}

              <motion.button
                id="support-close-btn"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                aria-label="Close support"
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white border-t border-t-white dark:border-t-white/15 border-b-[2px] border-b-stone-300 dark:border-b-stone-950 border-x border-stone-200 dark:border-stone-700 shadow-[0_2px_5px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_3px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all cursor-pointer overflow-visible shrink-0 select-none"
              >
                <div className="flex items-center justify-center w-4 h-4 overflow-visible shrink-0">
                  <X size={14} strokeWidth={2.2} className="overflow-visible shrink-0 drop-shadow-[0_0.5px_0.5px_rgba(255,255,255,0.8)] dark:drop-shadow-none" />
                </div>
              </motion.button>
            </div>
          </div>

          {/* End Chat Confirmation Modal Overlay */}
          <AnimatePresence>
            {showEndChatConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 select-none"
                onClick={() => setShowEndChatConfirm(false)}
              >
                <motion.div
                  initial={{ scale: 0.92, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.92, y: 15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/90 dark:border-stone-800 shadow-[0_20px_50px_rgba(0,0,0,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1.5px_1px_rgba(255,255,255,0.1)] space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-rose-500 to-rose-700 text-white flex items-center justify-center shrink-0 border-t border-t-rose-300 border-b-2 border-b-rose-900 shadow-[0_4px_10px_rgba(244,63,94,0.35)]">
                      <PhoneOff size={18} />
                    </div>
                    <div>
                      <h4 className="font-heading font-black text-sm text-stone-900 dark:text-white tracking-tight">
                        End Support Chat?
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium leading-tight mt-0.5">
                        Close and resolve current support session.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                    Are you sure you want to end this conversation? Your session will be closed. You can start a new support conversation anytime.
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <button
                      onClick={() => setShowEndChatConfirm(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="confirm-end-chat-btn"
                      onClick={handleEndChatByUser}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-b from-rose-500 to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white border-t border-t-rose-300 border-b-2 border-b-rose-900 shadow-[0_4px_10px_rgba(244,63,94,0.3)] cursor-pointer transition flex items-center gap-1.5"
                    >
                      <PhoneOff size={13} />
                      <span>End Chat</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================= VIEW CONTAINER ================= */}
          <div className="flex-1 min-h-0 flex flex-col bg-stone-50/50 dark:bg-stone-950">
            {activeTab === 'chat' ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Main Message Stream */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
                  {/* Security Notice Pill */}
                  <div className="text-center my-1">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold bg-gradient-to-b from-white via-white to-stone-50 dark:from-[#212226] dark:via-[#1a1b1e] dark:to-[#141517] text-stone-600 dark:text-stone-300 border border-stone-200/90 dark:border-stone-700/80 border-t-white dark:border-t-white/20 border-b-[2px] border-b-stone-300/80 dark:border-b-stone-950 shadow-[0_3px_8px_-2px_rgba(0,0,0,0.05),inset_0_1px_0.5px_rgba(255,255,255,1)] dark:shadow-[0_4px_10px_-2px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                      >
                        <ShieldCheck size={12} className="text-emerald-500" />
                      </motion.div>
                      PaperX Support Desk • End-to-End Encrypted
                    </span>
                  </div>

                  {/* Real-time greeting message bubble */}
                  {messages.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col items-start group relative my-2"
                    >
                      <div className="flex items-end gap-2 max-w-[88%]">
                        <motion.div 
                          whileHover={{ scale: 1.15 }}
                          className="w-6 h-6 rounded-lg bg-gradient-to-b from-stone-800 to-stone-950 dark:from-white dark:to-stone-100 text-amber-400 dark:text-stone-900 flex items-center justify-center shrink-0 mb-1 border-t border-t-white/20 dark:border-t-white border-b border-b-black dark:border-b-stone-300 border-x border-stone-800 dark:border-stone-200 shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                        >
                          <motion.div
                            animate={{ rotate: [0, 8, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                          >
                            <Headset size={12} className="text-amber-400 dark:text-stone-900" />
                          </motion.div>
                        </motion.div>

                        <div className="px-4 py-3 bg-gradient-to-b from-stone-50/90 via-white to-stone-100/80 dark:from-[#222328] dark:via-[#1c1d20] dark:to-[#151618] text-stone-900 dark:text-stone-100 rounded-2xl rounded-bl-xs border border-stone-200/90 dark:border-stone-700/80 border-t-white dark:border-t-white/15 border-b-[2.5px] border-b-stone-300/90 dark:border-b-stone-950 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.03),inset_0_1.5px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.6),0_3px_8px_-2px_rgba(0,0,0,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.1),inset_0_-1px_1px_rgba(0,0,0,0.5)] text-xs sm:text-[13px] leading-relaxed space-y-1">
                          <p className="font-bold text-stone-900 dark:text-white">
                            {getRealTimeGreeting()}{userFirstName ? `, ${userFirstName}` : ''}! 👋
                          </p>
                          <p className="text-stone-600 dark:text-stone-300">
                            How can I help you today?
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-stone-400 ml-8">
                        <span>Just now</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Render Message Feed */}
                  {messages.map((msg, idx) => {
                    const isUser = msg.type === 'user';
                    const isSystem = msg.type === 'system' || msg.isSystemNotice;
                    const isHistorical = idx < initialMessageCountRef.current;

                    if (isSystem) {
                      return (
                        <motion.div 
                          key={msg.id || idx} 
                          initial={isHistorical ? false : { opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="my-2 text-center"
                        >
                          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-b from-stone-50 via-white to-stone-100/90 dark:from-[#212226] dark:via-[#1a1b1e] dark:to-[#141517] text-stone-600 dark:text-stone-400 border border-stone-200/90 dark:border-stone-700/80 border-t-white dark:border-t-white/15 border-b-[2px] border-b-stone-300/80 dark:border-b-stone-950 text-[11px] font-medium max-w-[90%] shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05),inset_0_1px_0.5px_rgba(255,255,255,1)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.08)]">
                            <AlertCircle size={13} className="shrink-0 text-amber-500" />
                            <span>{msg.text}</span>
                          </div>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div
                        key={msg.id || idx}
                        initial={isHistorical ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group relative`}
                      >
                        <div className="flex items-end gap-2 max-w-[88%]">
                          {!isUser && (
                            <motion.div 
                              whileHover={{ scale: 1.15 }}
                              className="w-6 h-6 rounded-lg bg-gradient-to-b from-stone-800 to-stone-950 dark:from-white dark:to-stone-100 text-amber-400 dark:text-stone-900 flex items-center justify-center shrink-0 mb-1 border-t border-t-white/20 dark:border-t-white border-b border-b-black dark:border-b-stone-300 border-x border-stone-800 dark:border-stone-200 shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                            >
                              <motion.div
                                animate={{ rotate: [0, 8, -8, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                              >
                                <Headset size={12} className="text-amber-400 dark:text-stone-900" />
                              </motion.div>
                            </motion.div>
                          )}

                          <div
                            className={`px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap ${
                              isUser
                                ? 'bg-gradient-to-b from-[#1e1f23] via-[#151618] to-[#0c0d0f] text-white dark:from-white dark:via-stone-50 dark:to-stone-100 dark:text-stone-950 rounded-2xl rounded-br-xs border-t border-t-white/35 dark:border-t-white border-b-[2.5px] border-b-black dark:border-b-stone-350 border-x border-white/10 dark:border-stone-200 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.4),0_2px_6px_-1px_rgba(0,0,0,0.2),inset_0_1.5px_1px_rgba(255,255,255,0.25)] dark:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12),0_2px_6px_-1px_rgba(0,0,0,0.08),inset_0_1.5px_1px_rgba(255,255,255,0.95)] font-normal'
                                : 'bg-gradient-to-b from-stone-50/90 via-white to-stone-100/80 dark:from-[#222328] dark:via-[#1c1d20] dark:to-[#151618] text-stone-900 dark:text-stone-100 rounded-2xl rounded-bl-xs border border-stone-200/90 dark:border-stone-700/80 border-t-white dark:border-t-white/15 border-b-[2.5px] border-b-stone-300/90 dark:border-b-stone-950 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06),0_2px_6px_-2px_rgba(0,0,0,0.03),inset_0_1.5px_1px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.6),0_3px_8px_-2px_rgba(0,0,0,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.1),inset_0_-1px_1px_rgba(0,0,0,0.5)]'
                            }`}
                          >
                            {msg.attachment && (
                              <div className="mb-2">
                                <img 
                                  src={msg.attachment} 
                                  alt="attachment" 
                                  className="max-w-[200px] sm:max-w-[240px] rounded-xl border border-stone-200 dark:border-stone-700 shadow-[0_4px_12px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]" 
                                />
                              </div>
                            )}
                            <div>
                              {formatMessageText(msg.text)}
                            </div>
                          </div>
                        </div>

                        {/* Timestamp and action icons */}
                        <div className={`flex items-center gap-1 mt-1 px-1 text-[10px] text-stone-400 ${isUser ? 'mr-1' : 'ml-8'}`}>
                          <span>{msg.time}</span>
                          {isUser && (
                            <CheckCheck size={12} className="text-stone-400 inline ml-0.5" />
                          )}
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => copyMessageText(msg.id || `${idx}`, msg.text)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer"
                            title="Copy message text"
                          >
                            {copiedMsgId === (msg.id || `${idx}`) ? (
                              <Check size={11} className="text-emerald-500" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-end gap-2 max-w-[85%]"
                    >
                      <div className="w-6 h-6 rounded-lg bg-stone-900 text-amber-400 dark:bg-white dark:text-stone-900 flex items-center justify-center shrink-0 mb-1 shadow-xs border border-stone-800 dark:border-stone-200">
                        <motion.div
                          animate={{ scale: [1, 1.25, 1] }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                        >
                          <Headset size={12} className="text-amber-400 dark:text-stone-900" />
                        </motion.div>
                      </div>
                      <div className="px-3.5 py-2 bg-white dark:bg-stone-900 rounded-2xl rounded-bl-xs border border-stone-200/80 dark:border-stone-800 flex items-center gap-1.5 h-8 shadow-2xs">
                        <motion.span 
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          className="w-1.5 h-1.5 bg-stone-900 dark:bg-white rounded-full" 
                        />
                        <motion.span 
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                          className="w-1.5 h-1.5 bg-stone-900 dark:bg-white rounded-full" 
                        />
                        <motion.span 
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                          className="w-1.5 h-1.5 bg-stone-900 dark:bg-white rounded-full" 
                        />
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Container */}
                {isClosed ? (
                  <div className="p-3.5 bg-white dark:bg-stone-900 border-t border-stone-200/90 dark:border-stone-800 flex-shrink-0 space-y-2.5">
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 text-xs">
                      <Clock size={16} className="text-stone-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[12px] font-heading text-stone-900 dark:text-white">Chat Session Closed</p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          {closedReason === 'inactivity_timeout'
                            ? 'This session was closed due to 10 minutes of inactivity.'
                            : 'This conversation has been closed.'}
                        </p>
                      </div>
                    </div>

                    <motion.button
                      id="support-restart-chat-btn"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStartNewChat}
                      className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <PlusCircle size={15} />
                      <span>Start New Conversation</span>
                    </motion.button>
                  </div>
                ) : (bannedUntil && Date.now() < bannedUntil) ? (() => {
                  const displayStrikes = Math.max(1, Math.min(userStrikes || 1, 3));
                  return (
                    <div className="p-3.5 bg-gradient-to-b from-red-50 via-rose-50 to-red-100/90 dark:from-[#2a1316] dark:via-[#210d10] dark:to-[#17080a] border-t border-t-red-200 dark:border-t-red-800/80 border-b-[3px] border-b-red-300 dark:border-b-black shadow-[0_-4px_16px_rgba(239,68,68,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.08)] flex-shrink-0 space-y-2 select-none">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-red-100 to-red-200 dark:from-red-900/60 dark:to-red-950 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-300/80 dark:border-red-800/60 shadow-[0_2px_4px_rgba(239,68,68,0.15),inset_0_1px_0.5px_rgba(255,255,255,0.8)]">
                            <AlertCircle size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-red-900 dark:text-red-200 truncate">
                              Chat Access Suspended (Warning {displayStrikes}/3)
                            </p>
                            <p className="text-[11px] text-red-600 dark:text-red-400 leading-tight">
                              {displayStrikes >= 3 
                                ? '🚨 Final warning! Further slangs or hate will permanently ban this account.' 
                                : `Warning ${displayStrikes}/3. Slangs/hate strictly prohibited. Restores in: `}
                            </p>
                          </div>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-gradient-to-b from-red-500 to-red-700 text-white font-mono font-black text-xs tracking-wider shrink-0 border-t border-t-red-300 border-b-2 border-b-red-900 border-x border-red-600 shadow-[0_4px_10px_rgba(239,68,68,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.4)]">
                          {banCountdown || '60m 00s'}
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="p-3 bg-white dark:bg-stone-900 border-t border-stone-200/80 dark:border-stone-800 flex-shrink-0">
                    {attachmentData && (
                      <div className="mb-2 relative inline-block">
                        <img src={attachmentData} alt="attachment" className="h-16 w-16 object-cover rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm" />
                        <button
                          onClick={clearAttachment}
                          className="absolute -top-1.5 -right-1.5 bg-stone-900 text-white p-0.5 rounded-full hover:bg-black transition cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 bg-stone-100/90 dark:bg-stone-950/90 backdrop-blur-md rounded-2xl p-1.5 border border-stone-200/90 dark:border-stone-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.04)] focus-within:border-stone-900 dark:focus-within:border-stone-100 transition">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition rounded-xl cursor-pointer shrink-0 self-center"
                        title="Attach image or receipt proof"
                      >
                        <Paperclip size={17} />
                      </motion.button>

                      <textarea
                        id="support-chat-input"
                        ref={textareaRef}
                        value={inputValue}
                        onChange={handleTextareaInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Write a message..."
                        rows={1}
                        className="flex-1 bg-transparent py-2 text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 resize-none outline-none max-h-24 custom-scrollbar leading-relaxed"
                      />

                      <motion.button
                        id="support-chat-send-btn"
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim() && !attachmentData}
                        className="relative w-[34px] h-[34px] rounded-xl bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 border-t border-t-white/30 dark:border-t-white border-x border-x-white/10 dark:border-x-stone-200 border-b-2 border-b-black dark:border-b-stone-300 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1.5px_0_rgba(255,255,255,0.2)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_0_1.5px_0_rgba(255,255,255,0.9)] active:translate-y-[1px] active:border-b-[1px] active:shadow-[0_1px_3px_rgba(0,0,0,0.2)] disabled:opacity-25 disabled:border-b disabled:shadow-none disabled:active:translate-y-0 disabled:cursor-not-allowed transition flex items-center justify-center shrink-0 self-center my-auto cursor-pointer overflow-hidden"
                        title="Send message"
                      >
                        <motion.div
                          whileHover={{ x: 1.5, y: -1.5 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center justify-center pl-0.5"
                        >
                          <Send size={15} />
                        </motion.div>
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ================= VIEW: FAQS & KNOWLEDGE BASE ================= */
              <div className="flex-1 flex flex-col min-h-0 bg-stone-50/40 dark:bg-stone-950 p-4 sm:p-5 overflow-y-auto custom-scrollbar">
                {/* Search Bar */}
                <div className="relative mb-3 flex-shrink-0">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    id="support-faq-search"
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Search articles & questions..."
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200/90 dark:border-stone-800 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 transition shadow-2xs"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5 mb-2 flex-shrink-0">
                  {faqCategories.map((cat) => (
                    <motion.button
                      key={cat}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedFaqCategory(cat);
                        setExpandedFaq(null);
                      }}
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        selectedFaqCategory === cat
                          ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs'
                          : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-800'
                      }`}
                    >
                      {cat}
                    </motion.button>
                  ))}
                </div>

                {/* FAQ List */}
                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                  {filteredFaqs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-stone-400">
                      No matching questions found.
                    </div>
                  ) : (
                    filteredFaqs.map((faq, idx) => {
                      const isItemOpen = expandedFaq === idx;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs overflow-hidden"
                        >
                          <button
                            onClick={() => setExpandedFaq(isItemOpen ? null : idx)}
                            className="w-full p-3.5 text-left flex items-start justify-between gap-2 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
                          >
                            <div className="flex-1 min-w-0 pr-1">
                              <span className="block font-bold">{faq.q}</span>
                              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                                {faq.category}
                              </span>
                            </div>
                            <motion.div
                              animate={{ rotate: isItemOpen ? 180 : 0 }}
                              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                            >
                              <ChevronDown
                                size={15}
                                className="text-stone-400 shrink-0 mt-0.5"
                              />
                            </motion.div>
                          </button>

                          <AnimatePresence initial={false}>
                            {isItemOpen && (
                              <motion.div 
                                key={`faq-chat-item-${idx}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ 
                                  height: "auto", 
                                  opacity: 1,
                                  transition: {
                                    height: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                                    opacity: { duration: 0.22, delay: 0.05, ease: "easeOut" }
                                  }
                                }}
                                exit={{ 
                                  height: 0, 
                                  opacity: 0,
                                  transition: {
                                    height: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                                    opacity: { duration: 0.15, ease: "easeIn" }
                                  }
                                }}
                                style={{ overflow: 'hidden' }}
                                className="overflow-hidden"
                              >
                                <div className="px-3.5 pb-3.5 text-xs text-stone-600 dark:text-stone-400 leading-relaxed border-t border-stone-100 dark:border-stone-800/80 pt-3 bg-stone-50/50 dark:bg-stone-950/50">
                                  <p className="whitespace-pre-line">{faq.a}</p>
                                  <button
                                    onClick={() => {
                                      handleSendMessage(faq.q, faq.a);
                                      setActiveTab('chat');
                                    }}
                                    className="mt-3 text-[11px] font-bold text-stone-900 dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    Ask in Live Chat <ArrowLeft size={11} className="rotate-180" />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Direct Live Help Banner */}
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="mt-3 p-3 rounded-2xl bg-stone-900 text-white dark:bg-stone-800 flex items-center justify-between text-xs shrink-0 shadow-sm"
                >
                  <div>
                    <span className="font-bold block font-heading">Have a custom question?</span>
                    <span className="text-[11px] text-stone-300">Talk directly with our team.</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('chat')}
                    className="px-3 py-1.5 rounded-xl bg-white text-stone-900 dark:bg-white dark:text-stone-900 font-bold hover:bg-stone-100 transition cursor-pointer shadow-xs"
                  >
                    Open Chat
                  </motion.button>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SupportChat;
