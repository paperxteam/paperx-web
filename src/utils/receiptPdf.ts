import { jsPDF } from 'jspdf';
import domtoimage from 'dom-to-image';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface ReceiptData {
  orderId: string;
  plan: string;
  billingCycle?: string;
  amount: number | string;
  userName?: string;
  userEmail?: string;
  userUid?: string;
  createdAt?: number | string | Date;
  paymentMode?: string;
  utr?: string;
  isRefunded?: boolean;
}

/**
 * Robustly converts any OKLCH/unsupported color string to standard sRGB hex or rgb.
 */
function sanitizeColor(val: string): string {
  if (!val || typeof val !== 'string') return val;
  if (val.includes('oklch') || val.includes('color(')) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillStyle = val;
        return ctx.fillStyle;
      }
    } catch {
      return '#333333';
    }
  }
  return val;
}

/**
 * Recursively cleans inline & computed OKLCH styles from an element and its children.
 */
export function sanitizeElementColors(element: HTMLElement): void {
  const colorProperties = [
    'color',
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'outlineColor',
    'fill',
    'stroke',
  ];

  const elements = [element, ...Array.from(element.querySelectorAll('*'))] as HTMLElement[];
  elements.forEach((el) => {
    try {
      const computed = window.getComputedStyle(el);
      colorProperties.forEach((prop) => {
        const currentStyleVal = (el.style as any)[prop];
        if (currentStyleVal && (currentStyleVal.includes('oklch') || currentStyleVal.includes('color('))) {
          (el.style as any)[prop] = sanitizeColor(currentStyleVal);
        } else {
          const computedVal = computed.getPropertyValue(prop);
          if (computedVal && (computedVal.includes('oklch') || computedVal.includes('color('))) {
            (el.style as any)[prop] = sanitizeColor(computedVal);
          }
        }
      });
    } catch {
      // Ignore individual element access errors
    }
  });
}

/**
 * Direct Vector PDF generator via pdf-lib for bulletproof zero-failure receipts.
 */
export async function generateDirectVectorReceiptPdf(data: ReceiptData): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 (210 x 297 mm)
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Background card outline
  const margin = 36;
  const contentWidth = width - margin * 2;

  // Header Box
  page.drawRectangle({
    x: margin,
    y: height - 120,
    width: contentWidth,
    height: 75,
    color: rgb(0.08, 0.09, 0.12),
  });

  page.drawText('PaperX Cloud Suite', {
    x: margin + 20,
    y: height - 75,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('Official Electronic Tax-Exempt Payment Receipt', {
    x: margin + 20,
    y: height - 98,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.75, 0.8, 0.85),
  });

  // Status Badge
  const isRefunded = !!data.isRefunded;
  const statusText = isRefunded ? 'REFUNDED & CLOSED' : 'PAID & VERIFIED';
  const badgeWidth = 130;
  page.drawRectangle({
    x: width - margin - badgeWidth - 20,
    y: height - 85,
    width: badgeWidth,
    height: 24,
    color: isRefunded ? rgb(0.85, 0.45, 0.1) : rgb(0.1, 0.65, 0.4),
  });

  page.drawText(statusText, {
    x: width - margin - badgeWidth - 10,
    y: height - 78,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`${isRefunded ? 'REF-' : 'INV-'}${data.orderId}`, {
    x: width - margin - badgeWidth - 10,
    y: height - 102,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.7, 0.75, 0.8),
  });

  // Section 1: Customer and Transaction Info
  let currentY = height - 155;

  page.drawText('BILLED TO', {
    x: margin + 20,
    y: currentY,
    size: 9,
    font: fontBold,
    color: rgb(0.45, 0.5, 0.55),
  });

  page.drawText('TRANSACTION DETAILS', {
    x: margin + contentWidth / 2 + 10,
    y: currentY,
    size: 9,
    font: fontBold,
    color: rgb(0.45, 0.5, 0.55),
  });

  currentY -= 16;
  const userName = data.userName || data.userEmail?.split('@')[0] || 'Subscriber';
  page.drawText(userName, {
    x: margin + 20,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.12, 0.15),
  });

  const formattedDate = data.createdAt
    ? typeof data.createdAt === 'number'
      ? new Date(data.createdAt).toLocaleString()
      : String(data.createdAt)
    : new Date().toLocaleString();

  page.drawText(`Date: ${formattedDate}`, {
    x: margin + contentWidth / 2 + 10,
    y: currentY,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.2, 0.22, 0.25),
  });

  currentY -= 14;
  page.drawText(data.userEmail || 'N/A', {
    x: margin + 20,
    y: currentY,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.35, 0.4, 0.45),
  });

  page.drawText(`Payment Mode: ${data.paymentMode || 'UPI (Instant)'}`, {
    x: margin + contentWidth / 2 + 10,
    y: currentY,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.2, 0.22, 0.25),
  });

  currentY -= 14;
  page.drawText(`User ID: ${data.userUid || 'N/A'}`, {
    x: margin + 20,
    y: currentY,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.6),
  });

  page.drawText(`UTR / RRN: ${data.utr || 'Verified'}`, {
    x: margin + contentWidth / 2 + 10,
    y: currentY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.1, 0.12, 0.15),
  });

  // Table Line Separator
  currentY -= 25;
  page.drawLine({
    start: { x: margin + 20, y: currentY },
    end: { x: width - margin - 20, y: currentY },
    thickness: 1,
    color: rgb(0.85, 0.87, 0.9),
  });

  // Table Header
  currentY -= 18;
  page.drawText('ITEM DESCRIPTION', {
    x: margin + 20,
    y: currentY,
    size: 9,
    font: fontBold,
    color: rgb(0.45, 0.5, 0.55),
  });

  page.drawText('AMOUNT (INR)', {
    x: width - margin - 110,
    y: currentY,
    size: 9,
    font: fontBold,
    color: rgb(0.45, 0.5, 0.55),
  });

  currentY -= 8;
  page.drawLine({
    start: { x: margin + 20, y: currentY },
    end: { x: width - margin - 20, y: currentY },
    thickness: 1,
    color: rgb(0.85, 0.87, 0.9),
  });

  // Table Item
  currentY -= 22;
  page.drawText(`${data.plan || 'Plus Plan'} (${data.billingCycle || 'Monthly'} Subscription)`, {
    x: margin + 20,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.12, 0.15),
  });

  const amountStr = `Rs. ${data.amount || 50}.00`;
  page.drawText(amountStr, {
    x: width - margin - 110,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.12, 0.15),
  });

  currentY -= 15;
  page.drawLine({
    start: { x: margin + 20, y: currentY },
    end: { x: width - margin - 20, y: currentY },
    thickness: 1,
    color: rgb(0.85, 0.87, 0.9),
  });

  // Total Summary
  currentY -= 22;
  page.drawText(isRefunded ? 'TOTAL REFUNDED:' : 'TOTAL PAID:', {
    x: width - margin - 220,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.12, 0.15),
  });

  page.drawText(amountStr, {
    x: width - margin - 110,
    y: currentY,
    size: 13,
    font: fontBold,
    color: isRefunded ? rgb(0.85, 0.45, 0.1) : rgb(0.1, 0.65, 0.4),
  });

  // Signatory & Stamps
  currentY -= 60;
  const sigX = width - margin - 150;

  page.drawText('PaperX CEO', {
    x: sigX,
    y: currentY + 15,
    size: 16,
    font: fontOblique,
    color: rgb(0.15, 0.2, 0.4),
  });

  page.drawLine({
    start: { x: sigX - 10, y: currentY + 8 },
    end: { x: sigX + 110, y: currentY + 8 },
    thickness: 1,
    color: rgb(0.6, 0.65, 0.7),
  });

  page.drawText('AUTHORIZED SIGNATORY', {
    x: sigX - 5,
    y: currentY - 4,
    size: 8,
    font: fontBold,
    color: rgb(0.3, 0.35, 0.4),
  });

  page.drawText('Chief Executive Officer', {
    x: sigX,
    y: currentY - 15,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.6),
  });

  // Footer Disclaimer
  page.drawText('This is an official electronically generated tax-exempt receipt from PaperX Cloud Suite.', {
    x: margin + 20,
    y: 45,
    size: 8,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.6),
  });

  page.drawText('Support Contact: paperx.assist@gmail.com | Verification Portal: https://paperx.team', {
    x: margin + 20,
    y: 32,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.6, 0.65, 0.7),
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Primary export: renders DOM printable-receipt or falls back to vector PDF safely.
 */
export async function downloadReceiptPdf(
  receiptElement: HTMLElement | null,
  fileName: string,
  metadata?: ReceiptData
): Promise<void> {
  try {
    if (receiptElement) {
      // Ensure element colors are sanitized from OKLCH
      sanitizeElementColors(receiptElement);

      try {
        const dataUrl = await domtoimage.toPng(receiptElement, {
          quality: 0.98,
          bgcolor: '#ffffff',
          style: {
            opacity: '1',
            visibility: 'visible',
            transform: 'none',
          },
        });

        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 12;
        const pdfWidth = pageWidth - margin * 2;
        const pdfHeight = (img.height * pdfWidth) / img.width;

        pdf.addImage(dataUrl, 'PNG', margin, margin, pdfWidth, Math.min(pdfHeight, 270));
        pdf.save(fileName);
        return;
      } catch (domImgErr) {
        console.warn('DOM rasterization note, switching to robust vector engine:', domImgErr);
      }
    }

    // Fallback directly to pdf-lib vector generator
    if (metadata) {
      const blob = await generateDirectVectorReceiptPdf(metadata);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (metadata) {
      const blob = await generateDirectVectorReceiptPdf(metadata);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }
}
