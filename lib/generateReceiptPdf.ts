import { jsPDF } from 'jspdf';

export interface ReceiptData {
  invoiceNumber: string;
  orderTime: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: string;
  planName: string;
  utrNumber?: string;
  userEmail?: string;
  userName?: string;
}

/**
 * Generates an official, high-resolution PDF receipt matching the PaperX voucher layout.
 */
export function generateReceiptPdf(data: ReceiptData): void {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [105, 175], // Clean compact thermal receipt size (105mm x 175mm)
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 14;

    // --- Header Background Accent ---
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 42, 'F');

    // --- Success Green Circle with Checkmark ---
    doc.setFillColor(0, 176, 80); // #00B050
    doc.circle(pageWidth / 2, y + 6, 9, 'F');

    // White Checkmark
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.4);
    doc.line(pageWidth / 2 - 4.2, y + 6, pageWidth / 2 - 1.2, y + 9.2);
    doc.line(pageWidth / 2 - 1.2, y + 9.2, pageWidth / 2 + 4.5, y + 3.2);

    y += 20;

    // --- Brand Title & Subtitle ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39);
    doc.text('Payment Successful', pageWidth / 2, y, { align: 'center' });

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('PaperX Document AI Cloud', pageWidth / 2, y, { align: 'center' });

    y += 7;

    // --- Dashed Perforation Line ---
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.4);
    doc.setLineDashPattern([2, 1.5], 0);
    doc.line(8, y, pageWidth - 8, y);
    doc.setLineDashPattern([], 0); // reset

    y += 8;

    // --- Section Header: Payment Details ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text('Payment Details', 10, y);

    y += 7;

    // --- Structured Details Rows ---
    const rows = [
      { label: 'Invoice Number', value: data.invoiceNumber || 'PX-REC-9941' },
      { label: 'Order Time', value: data.orderTime || new Date().toLocaleString() },
      { label: 'Payment Method', value: data.paymentMethod || 'UPI / QR Scan' },
      { label: 'Payment Status', value: data.paymentStatus || 'Successful', isStatus: true },
      { label: 'Amount', value: data.amount.startsWith('₹') ? data.amount : `₹${data.amount}` },
      { label: 'Plan Upgraded', value: data.planName || 'PaperX Pro' },
    ];

    if (data.utrNumber) {
      rows.push({ label: '12-Digit UTR', value: data.utrNumber });
    }
    if (data.userEmail) {
      rows.push({ label: 'Customer', value: data.userEmail });
    }

    const labelX = 10;
    const colonX = 44;
    const valueX = 47;

    rows.forEach((row) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(row.label, labelX, y);
      doc.text(':', colonX, y);

      if (row.isStatus) {
        // Green status pill
        doc.setFillColor(0, 176, 80);
        doc.roundedRect(valueX, y - 3.2, 20, 4.6, 1.2, 1.2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text(row.value, valueX + 10, y - 0.2, { align: 'center' });
      } else if (row.label === 'Amount') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(31, 41, 55);
        // Fallback for rupee symbol, which might not render correctly in default PDF fonts
        const displayValue = row.value.replace('₹', 'Rs. ');
        doc.text(String(displayValue), valueX, y);
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(31, 41, 55);
        doc.text(String(row.value), valueX, y);
      }

      y += 6.5;
    });

    y += 3;

    // --- Customer Signature Area ---
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    // Draw a stylized signature using a script-like font or italic
    const customerName = data.userName || data.userEmail?.split('@')[0] || 'Customer';
    doc.text(customerName, pageWidth - 10, y, { align: 'right' });
    
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.3);
    doc.line(pageWidth - 45, y + 1, pageWidth - 10, y + 1);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(156, 163, 175);
    doc.text('Customer Signature', pageWidth - 27.5, y + 4, { align: 'center' });

    y += 10;

    // --- Dashed Perforation Line before footer ---
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.4);
    doc.setLineDashPattern([2, 1.5], 0);
    doc.line(8, y, pageWidth - 8, y);
    doc.setLineDashPattern([], 0); // reset

    y += 7;

    // --- Official Verification Stamp Box ---
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(10, y, pageWidth - 20, 15, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text('✓ Verified Digital Proof', 14, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(74, 222, 128);
    doc.text('Authorized PaperX Payments • All features unlocked immediately', 14, y + 10.5);

    y += 22;

    // --- Footer Notes ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(156, 163, 175);
    doc.text('Thank you for subscribing to PaperX!', pageWidth / 2, y, { align: 'center' });
    doc.text('Support: paperx.team@gmail.com • www.paperx.app', pageWidth / 2, y + 3.5, { align: 'center' });

    // Save PDF
    const cleanId = (data.invoiceNumber || 'receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`PaperX_Receipt_${cleanId}.pdf`);
  } catch (err) {
    console.error('Failed to generate PDF receipt:', err);
  }
}
