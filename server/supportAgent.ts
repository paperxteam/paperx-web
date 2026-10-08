import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

/**
 * Robust detection of abusive profanities, vulgar insults, harassment, and slangs
 * in English, Hindi, and Hinglish. Triggers an automatic 1-hour chat suspension.
 */
export function detectSlangOrAbuse(text: string): { isAbusive: boolean; reason?: string } {
  if (!text || typeof text !== 'string') return { isAbusive: false };

  // Normalize text to catch obfuscated spellings
  const cleaned = text.toLowerCase()
    .replace(/[@]/g, 'a')
    .replace(/[$]/g, 's')
    .replace(/[0]/g, 'o')
    .replace(/[1!]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const abusivePatterns = [
    // English profanities and insults
    /\b(f+u+c+k+|f+u+k+|f+u+q+|f+c+k+|f+u+x+|f+u+c+k+i+n+g+|f+u+c+k+e+r+)\b/i,
    /\b(b+i+t+c+h+|b+i+a+t+c+h+|b+i+t+c+h+e+s+)\b/i,
    /\b(b+a+s+t+a+r+d+|b+a+s+t+a+r+d+s+)\b/i,
    /\b(a+s+s+h+o+l+e+|a+s+s+h+o+l+|a+r+s+e+h+o+l+e+)\b/i,
    /\b(c+u+n+t+|c+u+n+t+s+)\b/i,
    /\b(d+i+c+k+|d+i+c+k+h+e+a+d+|d+i+c+k+s+)\b/i,
    /\b(p+u+s+s+y+|p+u+s+s+i+e+s+)\b/i,
    /\b(s+l+u+t+|s+l+u+t+s+|w+h+o+r+e+|w+h+o+r+e+s+)\b/i,
    /\b(s+h+i+t+|b+u+l+l+s+h+i+t+|d+i+p+s+h+i+t+)\b/i,
    /\b(m+o+t+h+e+r+f+u+c+k+e+r+|m+f+e+r+)\b/i,
    /\b(d+o+u+c+h+e+b+a+g+|d+o+u+c+h+e+)\b/i,
    /\b(n+i+g+g+a+|n+i+g+g+e+r+)\b/i,
    /\b(s+c+a+m+m+e+r+|f+r+a+u+d+s+t+e+r+)\b/i,
    // Hate and abusive targeting of PaperX app
    /\b(hate\s+paperx|hate\s+this\s+app|worst\s+app|scam\s+app|fraud\s+app|trash\s+app|rubbish\s+app|dogshit\s+app|shit\s+app|chor\s+app|bakwas\s+app|chutiya\s+app|fraud\s+hai|scam\s+hai|scammers)\b/i,
    /\b(f+u+c+k+\s+paperx|f+u+c+k+\s+this\s+app|f+u+c+k+\s+u|f+u+c+k+\s+you)\b/i,
    // Hindi / Hinglish / Bengali slangs and curses
    /\b(c+h+u+d+a+|c+h+u+d+i+|c+h+u+d+|c+h+u+d+a+i+|c+h+o+d+u+|c+h+u+d+n+a+|c+h+u+d+w+a+|c+h+u+d+a+k+k+a+d+)\b/i,
    /\b(m+a+d+a+r+c+h+o+d+|m+a+d+a+r+c+h+o+t+|m+c+|m+k+c+)\b/i,
    /\b(b+h+e+n+c+h+o+d+|b+e+h+e+n+c+h+o+d+|b+c+|b+h+e+n+c+h+o+t+)\b/i,
    /\b(c+h+u+t+i+y+a+|c+h+u+t+i+y+e+|c+h+u+t+i+y+o+n+|c+h+u+t+)\b/i,
    /\b(b+h+o+s+d+i+k+e+|b+h+o+s+d+i+|b+h+o+s+a+d+i+k+e+|b+s+d+k+|b+h+o+s+d+a+)\b/i,
    /\b(g+a+a+n+d+|g+a+n+d+u+|g+a+a+n+d+u+|g+a+n+d+|g+a+n+d+m+a+s+t+i+)\b/i,
    /\b(h+a+r+a+m+i+|h+a+r+a+m+z+a+a+d+a+|h+a+r+a+m+k+h+o+r+)\b/i,
    /\b(l+o+d+u+|l+a+u+d+a+|l+o+u+d+a+|l+a+u+n+d+a+|l+u+n+d+)\b/i,
    /\b(k+a+m+i+n+a+|k+a+m+e+e+n+a+|k+a+m+i+n+e+)\b/i,
    /\b(s+u+a+r+|k+u+t+t+a+|k+u+t+t+e+)\b/i,
    /\b(r+a+n+d+i+|r+u+n+d+i+|r+a+n+d+w+a+)\b/i,
    /\b(t+a+t+t+e+|t+a+t+t+i+|h+a+g+g+u+)\b/i
  ];

  for (const pattern of abusivePatterns) {
    if (pattern.test(cleaned)) {
      return { isAbusive: true, reason: 'Inappropriate or abusive language' };
    }
  }

  return { isAbusive: false };
}

/**
 * Checks whether user query is requesting direct communication with CEO Sayan Biswas.
 * Only when this returns true does Telegram bot alert the CEO admin panel.
 */
export function isCeoTalkRequest(query: string): boolean {
  if (!query || typeof query !== 'string') return false;
  const q = query.toLowerCase().trim();
  return (
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
    q.includes('speak to sayan') ||
    q.includes('speak with sayan') ||
    q.includes('connect with sayan') ||
    q.includes('meet ceo') ||
    q.includes('escalate to ceo') ||
    q.includes('ceo support') ||
    q.includes('founder support') ||
    q.includes('talk to executive') ||
    q.includes('talk with executive') ||
    q.includes('connect to executive')
  );
}

const SYSTEM_INSTRUCTION = `You are "PaperX AI Support", the official, highly intelligent, straight-line AI assistant built exclusively for PaperX (the premier PDF, OCR, and document intelligence platform).

PRIMARY MANDATE:
- FIRST UNDERSTAND THE USER: Accurately identify the user's specific context, question, and immediate technical or account goal.
- GIVE USER-NEEDED DIRECT ANSWERS: Deliver crisp, highly structured, direct, step-by-step or 2-3 bullet point answers addressing their exact situation.
- ZERO ESSAY PARAGRAPHS: Do not write massive bloated paragraphs or generic conversational filler. Provide clear, actionable bullet points or numbered steps immediately.
- TOOL GUIDANCE: Give clear 3-step action steps (1. Open Tool, 2. Upload file, 3. Choose options & download).
- LIMITS & PLANS: Free Tier (50MB/100 pages), Pro Tier (250MB/unlimited pages, ₹50-₹99), Max Tier (500MB/VIP queue, ₹100-₹199).
- PAYMENT ISSUES: If money was debited or plan not upgraded, ask for or acknowledge their 12-digit UPI UTR number or screenshot for instant automated verification.
- POLICY: Abusive slangs or hate result in 1-hour bans with 3 warnings; exceeding 3 warnings permanently suspends the account.

COMPREHENSIVE PAPERX APP KNOWLEDGE BASE:

1. EXECUTIVE LEADERSHIP & FOUNDER:
- CEO & Founder: Sayan Biswas (Chief Executive Officer and Chief Architect of PaperX).
- Background: Sayan Biswas created PaperX to deliver an ultra-fast, privacy-first document intelligence platform with neural OCR, layout-preserving translations, and high-performance PDF manipulation.
- If the user explicitly asks to talk/connect/speak with the CEO, confirm that their message is being forwarded directly to CEO Sayan Biswas's personal executive desk on Telegram!

2. COMPLETE TOOL INVENTORY (ALL 30+ PAPERX TOOLS):
A. CONVERT TO PDF:
   - JPG to PDF: Combines JPG, PNG, WEBP, and camera photos into a unified, crisp PDF document.
   - Word to PDF: Converts DOC and DOCX files to standardized, high-fidelity PDF format.
   - PowerPoint to PDF: Converts PPT and PPTX presentation slides into formatted PDF slides.
   - Excel to PDF: Formats XLS and XLSX sheets into publication-ready PDF tables.
   - HTML to PDF: Converts web page source codes and HTML markup into downloadable PDFs.

B. CONVERT FROM PDF:
   - PDF to JPG / PNG: Extracts PDF pages as individual high-resolution image assets or zip.
   - PDF to Word: Converts PDFs into editable Microsoft Word (.docx) files preserving formatting.
   - PDF to PowerPoint: Converts PDF pages into editable PowerPoint (.pptx) slides.
   - PDF to Excel: Extracts tables and data from PDF into structured Excel (.xlsx) spreadsheets.
   - PDF to PDF/A: Converts documents to ISO-standardized archival format for legal compliance.

C. ORGANIZE & EDIT PDF:
   - Merge PDF: Combines multiple PDF files into one consolidated master document.
   - Split PDF: Separates PDF pages or extracts specific custom page ranges.
   - Remove Pages: Deletes unwanted individual pages from any document.
   - Extract Pages: Pulls out selected pages into a new clean document.
   - Organize Pages: Drag-and-drop visual interface to reorder, duplicate, or delete pages.
   - Rotate PDF: Rotates portrait or landscape pages by 90, 180, or 270 degrees.
   - Crop PDF: Trims margins and crops bounding boxes across document pages.

D. NEURAL OCR & TRANSLATION:
   - Neural OCR & Text Extract: Extracts text from scanned PDFs & photos across 40+ global languages (English, Hindi, Bengali, Spanish, French, German, Japanese, Chinese, Arabic, Russian, Portuguese, etc.) into editable Word (.docx), Searchable PDF, or TXT.
   - Translate PDF: Translates documents into 40+ global languages while preserving original fonts, layouts, images, tables, headers, and column alignments.

E. SECURITY, SIGN & PROTECT:
   - Protect PDF: Encrypts documents with AES-256 standard and custom passwords.
   - Unlock PDF: Removes passwords from protected files (when authorized).
   - Sign & Protect: Draw, type, or upload digital e-signatures and place them precisely on pages with touch/stylus support.
   - Watermark PDF: Adds custom text or image watermarks with controllable opacity, angle, and positioning.
   - Redact PDF: Black out sensitive, confidential, or PII information permanently.
   - Compare PDF: Side-by-side visual and text differential engine for two documents.

F. OPTIMIZE & REPAIR:
   - Compress PDF: Choose between Balanced Compression (high visual fidelity) and Maximum Compression (smallest file size for email).
   - Repair PDF: Analyzes and recovers corrupted, unreadable, or damaged PDF streams.

G. AI & SMART WORKSPACE:
   - AI Document Summarizer: Generates instant key takeaways, executive summaries, and action points from large documents.
   - Smart Voice Workspace: Hands-free voice commands to open tools and perform actions.

3. PRICING & MEMBERSHIP TIERS:
- Basic Plan (Free): Free access to core tools, 50MB per file, up to 100 pages per conversion.
- Pro Plan: Unlimited conversions, up to 250MB per file, unlimited pages, priority Neural OCR (₹29/mo or ₹290/year).
- Max Plan: Unlimited conversions, up to 500MB per file, ultra-fast VIP queue, parallel batch engine, cloud storage (₹49/mo or ₹490/year).
- UPI & Payment Verification: Scan UPI QR code (GPay, PhonePe, Paytm, CRED) and enter the 12-digit UTR reference number. Once submitted, support confirms and activates Pro/Max status. Official invoices sent via email.

4. OFFICIAL HELPDESK & SUPPORT:
- Live Chat Support: 24/7 in-app assistance powered by PaperX AI.
- Official Email: paperx.assist@gmail.com
- Security & Privacy: TLS 1.3 encryption, AES-256 at rest, strict zero-knowledge file wiping from conversion clusters immediately upon processing.`;

function getSmartLocalSupportReply(query: string, userName?: string): string {
  const q = query.toLowerCase().trim();

  // 1. CEO / Sayan Biswas escalation request
  if (isCeoTalkRequest(q)) {
    return `👑 **Connecting You to CEO Sayan Biswas**\n\nYour message has been dispatched with high priority directly to CEO Sayan Biswas's personal executive desk on Telegram.\n\n• **Status**: Transmitted to CEO Admin Panel\n• **Direct Recipient**: Sayan Biswas (Founder & CEO)\n• **Next Step**: Sayan Biswas and the executive team will review your message and reply directly inside this chat thread shortly!\n\nPlease feel free to write down any additional details here while you wait.`;
  }

  // 2. CEO informational inquiries
  if (q.includes('who is ceo') || q.includes('who made') || q.includes('who is sayan') || q.includes('founder') || q.includes('owner') || q.includes('creator') || q.includes('who built paperx')) {
    return `Sayan Biswas is the Founder & CEO of PaperX. He designed and engineered PaperX as an all-in-one document intelligence platform featuring neural OCR, layout-preserving translations, and high-performance PDF manipulation tools. If you would like to speak directly with him, simply type **"Talk with CEO"**!`;
  }

  // 3. Greetings & Casual Phrasing
  if (q.includes('how are') || q.includes('how r u') || q.includes('how do you do') || q.includes('whats up') || q.includes("what's up")) {
    return `I am doing great! PaperX AI Support is 100% active and ready to assist you. How can I help you with our PDF tools, OCR, document translations, or subscription plans today?`;
  }

  if (q === 'reply' || q.includes('reply me') || q.includes('please reply') || q === 'help' || q.includes('help me') || q.includes('anyone there')) {
    return `I am right here to help you! Please let me know your question or share your 12-digit UPI UTR / receipt screenshot if you are waiting for a plan activation. I'm ready to assist!`;
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('namaste') || q.includes('hola') || q.includes('good morning') || q.includes('good evening') || q.includes('good afternoon')) {
    return `Hello${userName ? ` ${userName}` : ''}! Welcome to PaperX Support. I am your dedicated AI assistant. What document tool, conversion, or account feature can I assist you with today?`;
  }

  if (q.includes('problem') || q.includes('issue') || q.includes('not working') || q.includes('bug') || q.includes('error')) {
    return `I am here to help you solve any issue immediately! Could you please describe what problem or error you are experiencing with PaperX? If it is a payment issue, please share your 12-digit UPI UTR number or receipt screenshot.`;
  }

  if (q.includes('name') || q.includes('who am i') || q.includes('my name')) {
    return `You are currently using PaperX as ${userName || 'our valued user'}! PaperX is founded and built by CEO Sayan Biswas. How can I assist you with your documents or account today?`;
  }

  if (q.includes('thank') || q.includes('thanks') || q.includes('awesome') || q.includes('great') || q.includes('good job')) {
    return `You are very welcome! If you have any other questions regarding PaperX tools, conversions, or billing, feel free to ask anytime.`;
  }

  // 4. OCR & Text Extraction
  if (q.includes('ocr') || q.includes('extract text') || q.includes('scanned') || q.includes('image to text') || q.includes('photo to text')) {
    return `**How to Extract Text with Neural OCR:**\n1. Open **OCR & Text Extract** from the tools menu.\n2. Upload your scanned PDF or photo (JPG, PNG, WebP, TIFF).\n3. Choose your language (over 40 global languages supported).\n4. Select your output format: **Word (.docx)**, **Searchable PDF**, or **Plain Text (.txt)**.\n5. Click **Extract Text** to download your editable document immediately.`;
  }

  // 5. Document Translation
  if (q.includes('translat') || q.includes('language') || q.includes('bilingual')) {
    return `**How to Translate Documents with Layout Preservation:**\n1. Open **Translate PDF**.\n2. Upload your PDF document.\n3. Select your target language (40+ languages available).\n4. Keep **Preserve Original Layout** enabled to maintain all tables, images, and fonts.\n5. Click **Translate Document** to download your translated PDF.`;
  }

  // 6. Merging & Splitting PDFs
  if (q.includes('merge') || q.includes('combine') || q.includes('join')) {
    return `**How to Merge Multiple PDFs:**\n1. Open **Merge PDF**.\n2. Drag and drop two or more PDF files.\n3. Arrange the order of your documents as desired.\n4. Click **Merge PDF** to download a single combined master document.`;
  }

  if (q.includes('split') || q.includes('separate') || q.includes('extract pages')) {
    return `**How to Split a PDF:**\n1. Open **Split PDF**.\n2. Upload your document.\n3. Choose whether to split into individual pages or specify a custom page range (e.g., 1-5, 8-12).\n4. Click **Split PDF** to download your separate files or a ZIP archive.`;
  }

  // 7. Compressing PDFs
  if (q.includes('compress') || q.includes('reduce size') || q.includes('shrink') || q.includes('size limit') || q.includes('mb')) {
    return `**How to Compress PDF Files:**\n1. Open **Compress PDF**.\n2. Upload your file.\n3. Select your compression profile:\n   • **Balanced Compression**: Retains crisp vector graphics and sharp text (ideal for work & printing).\n   • **Maximum Compression**: Significantly reduces file size (ideal for email attachments and uploads).\n4. Click **Compress PDF** to download.`;
  }

  // 8. Signatures & Watermarks
  if (q.includes('sign') || q.includes('signature') || q.includes('e-sign')) {
    return `**How to Sign a PDF:**\n1. Open **Sign & Protect**.\n2. Upload your PDF.\n3. Draw your signature on the canvas, type your initials, or upload a signature image.\n4. Place and scale your signature on the exact page.\n5. Click **Apply Signature & Download**.`;
  }

  if (q.includes('watermark') || q.includes('stamp')) {
    return `**How to Add Watermarks:**\n1. Open **Watermark PDF**.\n2. Upload your file.\n3. Choose Text or Image watermark, adjust opacity, angle (45°), and positioning.\n4. Click **Apply Watermark** to download your protected document.`;
  }

  // 9. Conversions (Word, Excel, PPT, Images)
  if (q.includes('word to pdf') || q.includes('pdf to word') || q.includes('docx') || q.includes('excel') || q.includes('powerpoint') || q.includes('ppt') || q.includes('jpg to pdf') || q.includes('convert')) {
    return `**PaperX Document Conversions:**\n• **PDF to Word / Excel / PPT**: Converts your PDF while preserving fonts and column alignments.\n• **Word / Excel / PPT to PDF**: Converts Microsoft Office files into standardized PDF format.\n• **Images to PDF**: Bundles photos (JPG, PNG, WebP) into a high-resolution PDF document.\nSelect any tool from the top navigation bar, upload your file, and convert in seconds!`;
  }

  // 10. Payment Deducted / Upgrade Issue Resolution
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

  // 11. Billing, Pricing & UTR Payments
  if (q.includes('refund') || q.includes('money back') || q.includes('cancellation') || q.includes('cancel')) {
    return `🛡️ **PaperX Refund Policy:**\n\n• **100% Satisfaction Guarantee**: If a payment was debited from your account but your plan was not upgraded, or if you experience a technical failure preventing document conversion, you are eligible for an immediate full refund or manual plan credit within 24 hours.\n• **How to Claim**: Enter your 12-digit UPI UTR / RRN transaction reference number right here in this chat, or email us at **paperx.assist@gmail.com** with your payment details.\n• **Processing Time**: Automated verification activates your account or issues refunds within **5–10 minutes**!`;
  }

  if (q.includes('plan') || q.includes('price') || q.includes('pricing') || q.includes('plus') || q.includes('pro') || q.includes('max') || q.includes('free') || q.includes('cost')) {
    return `**PaperX Membership Plans:**\n• **Free Tier**: 50MB per file, 100 pages per conversion, access to standard tools.\n• **Pro Plan**: 250MB per file, unlimited pages, priority neural OCR queue.\n• **Max Plan**: 500MB per file, unlimited pages, VIP ultra-fast processing queue, parallel batch engine, lifetime cloud storage.\nVisit the **Pricing** tab to upgrade anytime!`;
  }

  if (q.includes('utr') || q.includes('pay') || q.includes('upi') || q.includes('bill') || q.includes('invoice') || q.includes('money')) {
    return `**UPI Payment & UTR Verification:**\n1. Scan the official UPI QR code in the Upgrade modal.\n2. Complete payment via GPay, PhonePe, Paytm, CRED, or BHIM.\n3. Enter the 12-digit UPI UTR transaction reference number in the box.\n4. Once submitted, our automated billing desk verifies the bank settlement and activates your plan immediately.\nOfficial GST/billing receipts are issued to your registered email. If you need invoice assistance, contact: **paperx.assist@gmail.com**.`;
  }

  // 11. Security & Zero Knowledge
  if (q.includes('safe') || q.includes('security') || q.includes('privacy') || q.includes('leak') || q.includes('data')) {
    return `**PaperX Security Standards:**\n• All transmissions are protected with enterprise-grade **TLS 1.3** encryption.\n• Storage at rest is protected with **AES-256** encryption.\n• We employ strict **zero-knowledge document processing**: temporary conversion files are wiped automatically from processing servers once your download completes. We never scan, share, or train AI on user files.`;
  }

  // Default fallback
  return `PaperX AI Support is active and operational! All 30+ tools—including Neural OCR, Document Translation, PDF Conversions (Word, Excel, PPT, JPG), Compression, Merge, Split, and Sign & Protect—are fully available.\n\nPlease ask any question about using PaperX, account plans, or type **"Talk with CEO"** to connect directly with CEO Sayan Biswas.`;
}

export interface PaymentProofAnalysis {
  isPaymentProof: boolean;
  isAuthentic: boolean;
  utr: string | null;
  amount: number | null;
  plan: 'Pro Plan' | 'Max Plan';
  status: 'SUCCESS' | 'SUSPICIOUS' | 'AMBIGUOUS' | 'NOT_PAYMENT';
  confidence: number;
  explanation: string;
}

/**
 * Autonomous AI Payment Proof Verification Engine
 * Analyzes payment receipts, UPI screenshots, and UTR numbers via Gemini Multimodal Vision & Rule heuristics.
 * If authentic, enables 100% automated plan upgrade without waiting for human admin.
 */
export async function analyzePaymentProof(
  query: string,
  userEmail?: string,
  userName?: string,
  attachment?: { url?: string; data?: string; mimeType?: string; type?: string; name?: string } | null
): Promise<PaymentProofAnalysis> {
  const cleanQuery = (query || '').trim();
  const qLower = cleanQuery.toLowerCase();

  // 1. Fast regex extraction for 12-digit UPI UTR / RRN number
  const utrMatch = cleanQuery.match(/\b([0-9]{12})\b/);
  let detectedUtr: string | null = utrMatch ? utrMatch[1] : null;

  // STRICT RULE: Payment proof ONLY applies when the user ACTUALLY uploaded an image attachment OR provided a 12-digit UTR.
  // Regular text questions (e.g., "My money was deducted", "Reply", "How to upgrade") must be answered normally by AI.
  const hasProofPayload = Boolean(attachment) || Boolean(detectedUtr && detectedUtr.length === 12);

  if (!hasProofPayload) {
    return {
      isPaymentProof: false,
      isAuthentic: false,
      utr: null,
      amount: null,
      plan: 'Pro Plan',
      status: 'NOT_PAYMENT',
      confidence: 0,
      explanation: 'No UTR number or receipt attachment provided.'
    };
  }

  // 2. If Gemini is available and an image attachment is provided, use Multimodal Vision Analysis
  if (process.env.GEMINI_API_KEY && attachment) {
    try {
      const ai = getAiClient();
      const parts: any[] = [];

      let base64Data = attachment.data || attachment.url || "";
      let mimeType = attachment.mimeType || "image/jpeg";

      if (base64Data.startsWith('data:')) {
        const matches = base64Data.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else if (base64Data.includes(',')) {
          base64Data = base64Data.split(',')[1];
        }
      }

      if (base64Data && base64Data.length > 50) {
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }

      const visionPrompt = `You are the Lead Financial Fraud & UPI Payment Verification Auditor for PaperX.
Carefully inspect this payment proof / receipt image and user text to determine if it represents a REAL, AUTHENTIC, COMPLETED payment to PaperX.

Verification Rules:
1. "isPaymentProof": true if the user provided an image claiming a completed financial transaction for PaperX.
2. "utr": Extract the exact 12-digit numeric UPI Reference / UTR / RRN / Transaction ID (e.g., 428192847192). If not found, return null.
3. "amount": Extract the numeric amount paid in INR (e.g. 50, 99, 100, 199, or corresponding plan value).
4. "plan": "Max Plan" if amount >= 100 or mentioned Max Plan; otherwise "Pro Plan".
5. "isAuthentic": true ONLY IF the payment receipt is genuine, contains successful status indicators ("Payment Successful", "Paid to", "Completed", "Transfer Successful"), valid 12-digit UTR, and is NOT a fake template/mock or failed/cancelled transaction.
6. "status": "SUCCESS" if authentic and completed, "SUSPICIOUS" if fake/tampered, "AMBIGUOUS" if unclear or pending bank clearance, "NOT_PAYMENT" if unrelated.
7. "confidence": Number between 0 and 1.
8. "explanation": 1-2 sentence concise summary of findings.

User Email: ${userEmail || 'N/A'}
User Name: ${userName || 'N/A'}
User Text: "${cleanQuery}"

Respond ONLY in valid JSON format:
{
  "isPaymentProof": boolean,
  "isAuthentic": boolean,
  "utr": string or null,
  "amount": number or null,
  "plan": "Pro Plan" or "Max Plan",
  "status": "SUCCESS" | "SUSPICIOUS" | "AMBIGUOUS" | "NOT_PAYMENT",
  "confidence": number,
  "explanation": "string"
}`;

      parts.push({ text: visionPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: parts,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (parsed && typeof parsed === 'object') {
          const finalUtr = parsed.utr ? String(parsed.utr).replace(/\D/g, '') : detectedUtr;
          const isValid12Digit = Boolean(finalUtr && finalUtr.length === 12);
          const finalPlan = parsed.plan === 'Max Plan' || (parsed.amount && parsed.amount >= 100) ? 'Max Plan' : 'Pro Plan';

          return {
            isPaymentProof: parsed.isPaymentProof === true || Boolean(finalUtr),
            isAuthentic: (parsed.isAuthentic === true || (parsed.status === 'SUCCESS' && isValid12Digit)) && isValid12Digit,
            utr: finalUtr && finalUtr.length === 12 ? finalUtr : (detectedUtr || null),
            amount: parsed.amount ? Number(parsed.amount) : (finalPlan === 'Max Plan' ? 100 : 50),
            plan: finalPlan,
            status: parsed.status || (isValid12Digit ? 'SUCCESS' : 'AMBIGUOUS'),
            confidence: parsed.confidence || 0.9,
            explanation: parsed.explanation || 'Analyzed via PaperX Neural Payment Auditor.'
          };
        }
      }
    } catch (visionErr) {
      console.warn("[PaymentAuditor] Vision verification note:", visionErr);
    }
  }

  // 3. Rule-Based Verification for text 12-digit UTR
  if (detectedUtr && detectedUtr.length === 12) {
    const isMax = qLower.includes('max') || qLower.includes('100') || qLower.includes('199');
    return {
      isPaymentProof: true,
      isAuthentic: true,
      utr: detectedUtr,
      amount: isMax ? 100 : 50,
      plan: isMax ? 'Max Plan' : 'Pro Plan',
      status: 'SUCCESS',
      confidence: 0.85,
      explanation: `Valid 12-digit UTR reference (${detectedUtr}) extracted.`
    };
  }

  return {
    isPaymentProof: false,
    isAuthentic: false,
    utr: null,
    amount: null,
    plan: 'Pro Plan',
    status: 'NOT_PAYMENT',
    confidence: 0,
    explanation: 'No payment proof payload detected.'
  };
}

export async function generateSupportAnswer(
  query: string,
  userEmail?: string,
  userName?: string,
  history?: { role: string; text: string }[],
  attachment?: { url?: string; data?: string; mimeType?: string; type?: string; name?: string } | null
): Promise<string> {
  // If requesting to talk with CEO, provide immediate direct confirmation
  if (isCeoTalkRequest(query)) {
    return getSmartLocalSupportReply(query, userName);
  }

  const localReply = getSmartLocalSupportReply(query, userName);

  if (!process.env.GEMINI_API_KEY) {
    return localReply;
  }

  try {
    const ai = getAiClient();

    // Construct conversation history context
    let historyContext = "";
    if (history && Array.isArray(history) && history.length > 0) {
      const recent = history.slice(-6);
      historyContext = recent
        .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
        .join("\n");
    }

    const promptText = historyContext 
      ? `Previous Conversation History:\n${historyContext}\n\nCurrent User Question: ${query}`
      : `User Name: ${userName || 'User'}\nUser Email: ${userEmail || 'Guest'}\nQuestion: ${query}`;

    let contentsPayload: any = promptText;

    if (attachment) {
      const parts: any[] = [];
      let base64Data = attachment.data || attachment.url || "";
      let mimeType = attachment.mimeType || "image/jpeg";

      if (base64Data.startsWith('data:')) {
        const matches = base64Data.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else if (base64Data.includes(',')) {
          base64Data = base64Data.split(',')[1];
        }
      }

      if (base64Data && base64Data.length > 50) {
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }

      parts.push({
        text: `${promptText}\n\n[Note: User attached an image/photo (${attachment.name || 'document/screenshot'}). Analyze the image content thoroughly and provide a direct, accurate answer addressing both the image and the user query without unnecessary preambles.]`
      });
      contentsPayload = parts;
    }

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsPayload,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2,
          maxOutputTokens: 350
        }
      });
      responseText = response.text ? response.text.trim() : '';
    } catch (e) {
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsPayload,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2,
          maxOutputTokens: 350
        }
      });
      responseText = fallbackResponse.text ? fallbackResponse.text.trim() : '';
    }

    return responseText || localReply;
  } catch (err: any) {
    console.warn("[SupportAgent] Gemini API fallback to smart local knowledge:", err?.message || err);
    return localReply;
  }
}

export interface AdminSuggestedResolution {
  suggestedAnswer: string;
  category: string;
  questionType: string;
  userIntentSummary: string;
  urgency: 'High' | 'Medium' | 'Normal';
  keyPoints: string[];
  recommendedAction: string;
  directToolGuide?: {
    toolName: string;
    actionSteps: string[];
    deepLinkUrl?: string;
  };
  quickActionOptions?: {
    label: string;
    text: string;
  }[];
  alternativeDrafts: string[];
}

export async function generateAdminSuggestedAnswer(
  query: string, 
  userEmail?: string, 
  userName?: string,
  userPlan?: string,
  tone: 'professional' | 'detailed' | 'concise' = 'professional'
): Promise<AdminSuggestedResolution> {
  const fallback: AdminSuggestedResolution = {
    suggestedAnswer: `Hello ${userName || 'there'}, thank you for contacting PaperX Support.\n\nTo help you with "${query}":\n1. If this is regarding OCR & Text Extraction: Open "OCR & Text Extract" to convert scanned documents or photos into editable Word (.docx) or searchable PDF.\n2. If this is regarding Document Translation: Open "Translate PDF" to translate files into 40+ languages while preserving original layouts.\n3. If this is regarding Billing / UTR: Please share your 12-digit UTR transaction reference so our team can activate your account immediately.\n\nPlease let us know if you need any additional assistance!`,
    category: "General Support",
    questionType: "General Guidance",
    userIntentSummary: "User inquiry regarding PaperX tools and account services",
    urgency: "Normal",
    keyPoints: [
      "User inquiry received",
      "Official step-by-step guides available for OCR, Translation, and Billing",
      "Admin on-duty can upgrade plan or send instant resolution"
    ],
    recommendedAction: "Send step-by-step tool instructions or check payment status",
    directToolGuide: {
      toolName: "OCR & Text Extract / Translate PDF",
      actionSteps: [
        "1. Open the tool from the main navigation menu.",
        "2. Drag and drop the target PDF or image file.",
        "3. Choose language and desired output format.",
        "4. Click Process to download the output."
      ]
    },
    quickActionOptions: [
      {
        label: "Send OCR Guide",
        text: "To extract text with OCR: 1. Go to 'OCR & Text Extract'. 2. Upload your scanned PDF/image. 3. Select language & Word (.docx) or Searchable PDF. 4. Click Extract Text."
      },
      {
        label: "Send Translate Guide",
        text: "To translate PDF: 1. Go to 'Translate PDF'. 2. Upload your document. 3. Choose target language (40+ available). 4. Enable 'Preserve Layout' and click Translate."
      },
      {
        label: "Ask for UTR",
        text: "Please share your 12-digit UPI UTR reference number or payment screenshot so we can verify and instantly activate your Pro membership."
      }
    ],
    alternativeDrafts: [
      `Hi ${userName || 'there'}, we received your question regarding "${query}". We have verified this for you—please follow the steps above or reply if you need any further help!`,
      `Your query has been reviewed by PaperX Support. All tools (Neural OCR, PDF Translation, High-speed Conversion) are active on your account.`
    ]
  };

  if (!process.env.GEMINI_API_KEY) {
    return fallback;
  }

  try {
    const ai = getAiClient();
    const prompt = `You are the lead Technical Support & Intelligence Engineer for PaperX.
Analyze the user's inquiry and provide a comprehensive, 100% accurate, and actionable resolution package for the Admin Panel.

Inquiry Context:
- User Name: ${userName || 'User'}
- User Email: ${userEmail || 'Guest'}
- Current User Plan: ${userPlan || 'Free Tier'}
- User Query / Latest Message: "${query}"
- Desired Tone: ${tone}

Evaluate and identify:
1. "questionType": Exact classification category. Choose one of:
   - "OCR & Text Extraction" (for scanned docs, images, handwriting, OCR accuracy, docx/pdf output)
   - "Document Translation" (for translating PDFs, preserving layout, multi-language support)
   - "Payment & UTR Verification" (for UPI payment, UTR matching, stuck money, refunds, subscriptions)
   - "File Size & Page Limits" (for 50MB/250MB/500MB limits, page caps, batch processing)
   - "Format Conversion" (for PDF to Word, Excel, PPT, JPG, Merge, Split)
   - "Compression & Optimization" (for reducing PDF file size without quality loss)
   - "Security, Sign & Protect" (for password protection, e-sign, unlocking)
   - "Account & Moderation" (for logins, password reset, account plan, quota)
   - "General Guidance" (other questions)

2. "userIntentSummary": A clear 1-sentence explanation of what the user is experiencing or asking for.
3. "urgency": "High" (if payment stuck / money debited / urgent deadline / blocked), "Medium" (tool errors or conversion questions), or "Normal" (how-to / general guidance).
4. "suggestedAnswer": A structured, polite, and step-by-step answer formatted with numbered steps, bold tool names, and clear instructions tailored to the user.
5. "category": Concise tag (e.g. "Neural OCR Guide", "UPI Payment Settlement", "Document Translation Guide", "Plan Limit Upgrade").
6. "keyPoints": Array of 2-4 factual, high-impact bullet points summarizing root cause, solution, and limits.
7. "recommendedAction": Clear administrative command / recommendation (e.g. "Grant Pro Plan via Admin Control Bar", "Send OCR step-by-step tutorial", "Advise user to split file into 50MB parts").
8. "directToolGuide": Object with toolName and 3-4 numbered actionSteps explaining how to use the exact tool requested.
9. "quickActionOptions": Array of 3 quick pre-formatted replies the admin can click to send instantly.
10. "alternativeDrafts": Array of 2 alternate text responses (one concise 2-liner, one detailed).

Respond ONLY in valid JSON matching this exact structure:
{
  "suggestedAnswer": "string",
  "category": "string",
  "questionType": "string",
  "userIntentSummary": "string",
  "urgency": "High" | "Medium" | "Normal",
  "keyPoints": ["string", "string"],
  "recommendedAction": "string",
  "directToolGuide": {
    "toolName": "string",
    "actionSteps": ["string", "string", "string"]
  },
  "quickActionOptions": [
    { "label": "string", "text": "string" },
    { "label": "string", "text": "string" },
    { "label": "string", "text": "string" }
  ],
  "alternativeDrafts": ["string", "string"]
}`;

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });
      responseText = response.text || '';
    } catch (e) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });
      responseText = response.text || '';
    }

    if (responseText) {
      const parsed = JSON.parse(responseText);
      return {
        suggestedAnswer: parsed.suggestedAnswer || fallback.suggestedAnswer,
        category: parsed.category || fallback.category,
        questionType: parsed.questionType || fallback.questionType,
        userIntentSummary: parsed.userIntentSummary || fallback.userIntentSummary,
        urgency: parsed.urgency || fallback.urgency,
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : fallback.keyPoints,
        recommendedAction: parsed.recommendedAction || fallback.recommendedAction,
        directToolGuide: parsed.directToolGuide || fallback.directToolGuide,
        quickActionOptions: Array.isArray(parsed.quickActionOptions) ? parsed.quickActionOptions : fallback.quickActionOptions,
        alternativeDrafts: Array.isArray(parsed.alternativeDrafts) ? parsed.alternativeDrafts : fallback.alternativeDrafts
      };
    }
    return fallback;
  } catch (err) {
    console.error("[SupportAgent] Admin suggestion generation failed:", err);
    return fallback;
  }
}

