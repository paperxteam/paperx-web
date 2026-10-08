import React, { useState } from 'react';
import { Receipt, Download, Plus, Trash2, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Button } from '../Button';

export const InvoiceCreatorWorkspace: React.FC<{
  onComplete?: (blob: Blob, filename: string) => void;
  isProcessing?: boolean;
}> = ({ onComplete }) => {
  const [invoiceNumber, setInvoiceNumber] = useState('INV-001');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [items, setItems] = useState<{ description: string; qty: number; rate: number }[]>([
    { description: 'Professional Services', qty: 1, rate: 100 }
  ]);

  const addItem = () => {
    setItems([...items, { description: '', qty: 1, rate: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0);

  const handleGeneratePdf = () => {
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('INVOICE', 14, 22);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice Number: ${invoiceNumber}`, 14, 32);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 38);

      doc.text(`Billed To: ${clientName || 'Valued Client'}`, 14, 48);
      if (clientEmail) doc.text(`Email: ${clientEmail}`, 14, 54);

      let yPos = 68;
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 14, yPos);
      doc.text('Qty', 120, yPos);
      doc.text('Rate', 145, yPos);
      doc.text('Amount', 175, yPos);
      doc.line(14, yPos + 2, 196, yPos + 2);

      yPos += 8;
      doc.setFont('helvetica', 'normal');
      items.forEach((item) => {
        const itemTotal = (Number(item.qty) || 0) * (Number(item.rate) || 0);
        doc.text(item.description || 'Item', 14, yPos);
        doc.text(String(item.qty), 120, yPos);
        doc.text(`$${Number(item.rate).toFixed(2)}`, 145, yPos);
        doc.text(`$${itemTotal.toFixed(2)}`, 175, yPos);
        yPos += 7;
      });

      doc.line(14, yPos + 2, 196, yPos + 2);
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: $${subtotal.toFixed(2)}`, 145, yPos);

      const blob = doc.output('blob');
      if (onComplete) {
        onComplete(blob, `${invoiceNumber || 'Invoice'}.pdf`);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoiceNumber || 'Invoice'}.pdf`;
        a.click();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
            <Receipt size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">Invoice Generator</h3>
            <p className="text-xs text-stone-500">Create clean, professional PDF invoices instantly</p>
          </div>
        </div>
        <Button onClick={handleGeneratePdf} className="flex items-center gap-2">
          <Download size={16} /> Generate Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-stone-600 dark:text-stone-400">Invoice Number</label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full mt-1 p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-stone-600 dark:text-stone-400">Client Name</label>
          <input
            type="text"
            placeholder="Acme Corp"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full mt-1 p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">Line Items</h4>
          <button
            onClick={addItem}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>

        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(idx, 'description', e.target.value)}
              className="flex-1 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-sm"
            />
            <input
              type="number"
              placeholder="Qty"
              value={item.qty}
              onChange={(e) => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
              className="w-20 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-sm"
            />
            <input
              type="number"
              placeholder="Rate"
              value={item.rate}
              onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
              className="w-28 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-sm"
            />
            <button
              onClick={() => removeItem(idx)}
              className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-between items-center">
        <span className="text-sm font-semibold text-stone-600 dark:text-stone-400">Total</span>
        <span className="text-xl font-bold text-stone-900 dark:text-stone-100">${subtotal.toFixed(2)}</span>
      </div>
    </div>
  );
};
export default InvoiceCreatorWorkspace;
