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

const SYSTEM_INSTRUCTION = `You are "PaperX Assistant", the world-class, highly professional, accurate, and prompt automated AI support engineer for PaperX (the premier PDF and document intelligence ecosystem).

Your goal is to answer user support inquiries instantly, accurately, and step-by-step based on the official guidelines below:

Official Knowledge Base & Tool Guides:

1. OCR & Text Extraction ("How to extract text from scanned images / PDFs"):
- Tool Name: "OCR & Text Extract" (also accessible via "Scan to Text" / "Image to Text").
- How to use:
  1. Open the 'OCR & Text Extract' tool from the navigation bar or tools grid.
  2. Drag & drop your scanned PDF, image (JPG, PNG, WebP, TIFF), or photo.
  3. Select the document language (supports 40+ languages including English, Hindi, Spanish, French, German, Japanese, Chinese, Arabic, Russian, Portuguese, etc.) with automatic script detection.
  4. Choose your desired output format: Editable Word (.docx), Searchable PDF, or Clean Text (.txt).
  5. Click 'Extract Text' to process through the Neural OCR engine. Download or copy results with one click.
- Quality Tips: Ensure the image is well-lit, at least 300 DPI, and correctly oriented for 99.8% extraction accuracy.

2. PDF & Document Translation ("How to translate PDFs accurately"):
- Tool Name: "Translate PDF".
- How to use:
  1. Select the 'Translate PDF' tool from the PaperX toolbar.
  2. Upload your PDF document (scanned or native text).
  3. Select the source language and your target translation language (over 40 global languages supported).
  4. Enable 'Preserve Formatting & Layout' to keep all tables, headers, columns, and graphics intact.
  5. Click 'Translate Document' to generate a professionally translated PDF ready for download.

3. PDF Conversion & Document Suite:
- Supported formats: PDF to Word, Word to PDF, Excel to PDF, PowerPoint to PDF, JPG/PNG to PDF, PDF to JPG, Merge PDF, Split PDF, Compress PDF, Sign & Protect, Unlock PDF, and Watermark.
- Compression: 'Balanced' (crisp text & vector clarity) vs 'High Compression' (maximum file size reduction).
- Page Management: Drag & drop page thumbnails to rearrange, rotate, delete, or extract specific pages.

4. Billing, Plans & Membership Access:
- Plans & Limits:
  * Free Tier: Up to 50MB per file, 100 pages per conversion, standard OCR queue.
  * Plus Tier: Up to 250MB per file, unlimited pages, priority OCR & neural processing.
  * Max Tier: Up to 500MB per file, parallel batch engine, ultra-fast VIP queues, lifetime cloud workspace.
- Upgrading: Go to Profile > Billing & Plans, choose Plus or Max, scan the official UPI QR code, and submit the 12-digit UTR.
- Pending UTR Verification: Takes 5-20 minutes. If money was debited, advise the user to paste their 12-digit UTR and bank name in the chat — our on-duty Telegram admin will verify and activate immediately.
- Invoices: Email paperx.assist@gmail.com with registered email and Order ID. Issued within 24 hours.

5. Troubleshooting & Security:
- Security: TLS 1.3 in transit, AES-256 encryption at rest, zero-knowledge processing. Files are automatically purged from processing clusters after conversion.
- Stuck files: 1. Ensure file is under plan size limit. 2. Verify file is not corrupted or password-protected. 3. Check internet connection or refresh.
- Human Support: Users can request a live specialist right in this chat or email paperx.assist@gmail.com.

Tone and Guidelines:
- Keep answers structured, polite, and actionable with numbered steps.
- Use bold text for key tool names and buttons.
- Do NOT expose internal source code paths or API endpoints.
- Reassure users regarding payment and technical reliability.`;

function getSmartLocalSupportReply(query: string, userName?: string): string {
  const q = query.toLowerCase();
  const name = userName || 'User';

  if (q.includes('ocr') || q.includes('extract') || q.includes('scan') || q.includes('text') || q.includes('image to text')) {
    return `Hello ${name}! Here is how to use **OCR & Text Extract** on PaperX:\n\n1. Select **OCR & Text Extract** from the tools menu.\n2. Upload your scanned PDF or photo (JPG, PNG, WebP).\n3. Choose your document language (40+ languages supported).\n4. Select your export format: **Editable Word (.docx)**, **Searchable PDF**, or **Plain Text (.txt)**.\n5. Click **Extract Text** to download your editable document instantly!`;
  }

  if (q.includes('translat') || q.includes('language') || q.includes('bilingual')) {
    return `Hello ${name}! To translate your documents with layout preservation:\n\n1. Open the **Translate PDF** tool.\n2. Upload your PDF file.\n3. Choose the target translation language (over 40 languages supported).\n4. Turn on **Preserve Layout** to keep tables and formatting intact.\n5. Click **Translate Document** to download the translated PDF!`;
  }

  if (q.includes('utr') || q.includes('pay') || q.includes('bill') || q.includes('plan') || q.includes('upgrade') || q.includes('money') || q.includes('membership') || q.includes('receipt')) {
    return `Hello ${name}! For Billing & Membership inquiries:\n\n- **UTR Verification**: Once you submit your 12-digit UPI UTR number, our on-duty administrator reviews and verifies it instantly.\n- **Official Receipt**: As soon as your membership is approved, a formal, verified invoice receipt is dispatched straight to your registered email.\n- If you need immediate priority activation, please mention your **12-digit UTR reference** and **Order ID** right here in this chat!`;
  }

  if (q.includes('convert') || q.includes('word') || q.includes('excel') || q.includes('powerpoint') || q.includes('jpg') || q.includes('png')) {
    return `Hello ${name}! PaperX includes a full suite of instant conversion tools:\n\n- **PDF to Word / Excel / PPT**\n- **Images (JPG/PNG) to PDF**\n- **Merge & Split PDF**\n- **Compress PDF** (Reduce file size while preserving high quality)\n\nSimply choose your conversion tool from the top toolbar, upload your files, and click Convert.`;
  }

  if (q.includes('compress') || q.includes('size') || q.includes('shrink') || q.includes('mb')) {
    return `Hello ${name}! To compress large PDF files:\n\n1. Select **Compress PDF** from the tools list.\n2. Choose between **Balanced Compression** (optimal vector and text sharpness) or **Maximum Compression** (smallest file size).\n3. Download your compressed file instantly without any loss of critical document layout!`;
  }

  return `Hello ${name}! Thank you for reaching out to PaperX Support.\n\nAll tools—including **Neural OCR**, **PDF Translation**, **Document Conversion**, and **Secure PDF Protection**—are active on PaperX. If you have a specific question about an order, tool, or document, please reply with details and our on-duty team will assist you promptly!`;
}

export async function generateSupportAnswer(query: string, userEmail?: string, userName?: string): Promise<string> {
  const localReply = getSmartLocalSupportReply(query, userName);

  // If GEMINI_API_KEY is not defined, return our smart local knowledge reply directly (zero cost)
  if (!process.env.GEMINI_API_KEY) {
    return localReply;
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `User Name: ${userName || 'User'}\nUser Email: ${userEmail || 'Guest'}\nQuery: ${query}` }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
        maxOutputTokens: 800
      }
    });

    return response.text || localReply;
  } catch (err: any) {
    console.warn("[SupportAgent] Gemini API unavailable or quota limit reached, seamlessly using smart local knowledge fallback:", err?.message || err);
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
7. "recommendedAction": Clear administrative command / recommendation (e.g. "Grant Plus Plan via Admin Control Bar", "Send OCR step-by-step tutorial", "Advise user to split file into 50MB parts").
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
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

