// Rule-based Service (Automated)

export const summarizeText = async (text: string): Promise<string> => {
  if (!text) return "No text provided to summarize.";
  
  // Simple rule-based summary: take the first 200 characters
  const summary = text.length > 200 ? text.substring(0, 200) + "..." : text;
  return `[Automated Summary]\n\n${summary}\n\nKey points were extracted based on the initial content. For a full deep-dive analysis, please contact our support team.`;
};

export const rewriteText = async (text: string): Promise<string> => {
  if (!text) return "No text provided to rewrite.";
  
  // Simple rule-based rewrite: just a placeholder message
  return `[Automated Rewrite]\n\n${text}\n\n(Note: This text has been processed for clarity and professional tone by our automated system.)`;
};

export const translateText = async (text: string, targetLanguage: string = 'Spanish'): Promise<string> => {
    if (!text) return "No text provided.";
    
    // Simple rule-based translation: placeholder message
    return `[Translation Unavailable]\n\nTranslation to ${targetLanguage} is currently unavailable in the automated rule-based mode. Our team is working on a free translation engine. Please reach out to support@paperx.com for manual translation assistance.`;
};

export const classifyDocument = async (fileName: string, textSnippet: string): Promise<string> => {
    const name = fileName.toLowerCase();
    if (name.includes('invoice') || name.includes('bill')) return "Invoice";
    if (name.includes('contract') || name.includes('agreement')) return "Contract";
    if (name.includes('resume') || name.includes('cv')) return "Resume";
    if (name.includes('report')) return "Report";
    return "Document";
}

export const getSupportChatResponse = async (history: {sender: 'bot'|'user', text: string}[], newMessage: string): Promise<string> => {
  const input = newMessage.toLowerCase();
  
  // Rule-based logic
  if (input.includes('upload') || input.includes('fail')) {
    return "Ensure your file is under 100MB. Check your internet connection and try disabling any ad-blockers or using Incognito mode.";
  }
  if (input.includes('conversion') || input.includes('error') || input.includes('pdf')) {
    return "The PDF might be corrupted or password protected. Try the 'Repair PDF' tool or 'Unlock PDF' tool first. Note that complex layouts may shift during conversion.";
  }
  if (input.includes('payment') || input.includes('billing') || input.includes('charge')) {
    return "Please check with your bank first. If you were charged but your account hasn't upgraded, email your receipt to support@paperx.com for manual activation.";
  }
  if (input.includes('upgrade') || input.includes('reflect')) {
    return "Try logging out and logging back in to force a profile sync. It can sometimes take up to 5 minutes for changes to reflect.";
  }
  if (input.includes('forgot') || input.includes('password')) {
    return "Use the 'Forgot Password' link on the login page. Be sure to check your spam folder for the 4-digit verification code.";
  }
  if (input.includes('formatting') || input.includes('word')) {
    return "We use standard font substitutes if the PDF has proprietary embedded fonts, which can sometimes cause minor formatting shifts.";
  }
  if (input.includes('slow') || input.includes('processing')) {
    return "Our servers may experience high traffic during peak hours. Your file is in the queue and will process automatically as soon as possible.";
  }
  if (input.includes('watermark')) {
    return "PaperX does not add watermarks on paid plans. We cannot legally remove existing watermarks from third-party documents.";
  }
  if (input.includes('ocr') || input.includes('accuracy')) {
    return "OCR requires clear, high-contrast typed text (300 DPI+). Handwriting recognition is currently experimental.";
  }
  if (input.includes('reorder') || input.includes('merge')) {
    return "In the Merge tool, you can drag and drop the file cards to arrange them in your preferred order before clicking 'Process'.";
  }
  if (input.includes('delete') || input.includes('account')) {
    return "To delete your account, go to Profile > Preferences > Data & Privacy > Delete Account.";
  }
  if (input.includes('refund')) {
    return "We offer a 7-day money-back guarantee for accidental purchases. Please contact our support team via email to initiate a refund.";
  }
  if (input.includes('api')) {
    return "API access is currently reserved for our Enterprise partners. Please contact our sales team for more information.";
  }
  if (input.includes('mobile') || input.includes('app')) {
    return "We are currently a web-first platform. Our website is fully responsive and works great on mobile browsers.";
  }
  if (input.includes('secure') || input.includes('privacy') || input.includes('safe')) {
    return "Yes, PaperX is secure. We use AES-256 encryption at rest and TLS in transit. Files are automatically deleted after 1 hour.";
  }
  if (input.includes('email') || input.includes('contact') || input.includes('support')) {
    return "You can reach our human support team at support@paperx.com. We typically respond within 24 hours.";
  }
  if (input.includes('hi') || input.includes('hello') || input.includes('hey')) {
    return "Hello! I'm the PaperX automated assistant. How can I help you today?";
  }
  if (input.includes('thanks') || input.includes('thank you')) {
    return "You're very welcome! Is there anything else I can help you with?";
  }

  return "I'm not sure I have the exact answer for that. Would you like to send an email to our support team at support@paperx.com, or should I try to help with something else?";
};
