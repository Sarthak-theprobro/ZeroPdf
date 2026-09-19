import React, { useState } from 'react';
import { 
  ReceiptText, 
  Plus, 
  Trash2, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Building2, 
  Calculator 
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface InvoiceItem {
  id: string;
  description: string;
  hsn: string;
  quantity: number;
  rate: number;
  gstRate: number; // 5, 12, 18, 28
}

export const GstInvoiceGeneratorTool: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Seller & Buyer State
  const [sellerName, setSellerName] = useState('CYBERTECH ENTERPRISES');
  const [sellerGst, setSellerGst] = useState('27AADCB2234P1Z2');
  const [sellerAddress, setSellerAddress] = useState('Sector 62, Cyber City, Mumbai, MH');

  const [buyerName, setBuyerName] = useState('AETHER CLIENT CORP');
  const [buyerGst, setBuyerGst] = useState('27BBDCE3345Q1Z8');
  const [buyerAddress, setBuyerAddress] = useState('Level 4, Tech Park, Bengaluru, KA');

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'Cloud Infrastructure License', hsn: '998313', quantity: 1, rate: 45000, gstRate: 18 },
    { id: '2', description: 'Cybersecurity Audit & Penetration Testing', hsn: '998319', quantity: 2, rate: 25000, gstRate: 18 },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Computed Financials
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const totalTax = items.reduce((sum, item) => sum + (item.quantity * item.rate * item.gstRate) / 100, 0);
  const grandTotal = subtotal + totalTax;

  const isInterState = sellerGst.slice(0, 2) !== buyerGst.slice(0, 2);
  const cgst = isInterState ? 0 : totalTax / 2;
  const sgst = isInterState ? 0 : totalTax / 2;
  const igst = isInterState ? totalTax : 0;

  const addItem = () => {
    sfx.playClick();
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: 'New Service Item', hsn: '9983', quantity: 1, rate: 1000, gstRate: 18 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    sfx.playClick();
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, val: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleGeneratePdf = async () => {
    try {
      setIsProcessing(true);
      sfx.playScan();

      const doc = await PDFDocument.create();
      const page = doc.addPage([595, 842]); // Standard A4
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

      // Header Banner
      page.drawRectangle({ x: 0, y: 762, width: 595, height: 80, color: rgb(0.04, 0.06, 0.1) });
      page.drawText('TAX INVOICE', { x: 40, y: 800, size: 20, font: fontBold, color: rgb(0.06, 0.73, 0.83) });
      page.drawText(`Invoice #: ${invoiceNumber}  |  Date: ${invoiceDate}`, { x: 40, y: 780, size: 10, font: fontRegular, color: rgb(0.8, 0.8, 0.8) });

      // Seller & Buyer Blocks
      let y = 730;
      page.drawText('BILLED FROM (SELLER):', { x: 40, y, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
      page.drawText('BILLED TO (BUYER):', { x: 320, y, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });

      y -= 15;
      page.drawText(sellerName, { x: 40, y, size: 10, font: fontBold });
      page.drawText(buyerName, { x: 320, y, size: 10, font: fontBold });

      y -= 12;
      page.drawText(`GSTIN: ${sellerGst}`, { x: 40, y, size: 9, font: fontRegular });
      page.drawText(`GSTIN: ${buyerGst}`, { x: 320, y, size: 9, font: fontRegular });

      y -= 12;
      page.drawText(sellerAddress, { x: 40, y, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
      page.drawText(buyerAddress, { x: 320, y, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

      // Items Table Header
      y -= 35;
      page.drawRectangle({ x: 40, y: y - 5, width: 515, height: 20, color: rgb(0.93, 0.95, 0.98) });
      page.drawText('Description', { x: 45, y, size: 9, font: fontBold });
      page.drawText('HSN/SAC', { x: 260, y, size: 9, font: fontBold });
      page.drawText('Qty', { x: 340, y, size: 9, font: fontBold });
      page.drawText('Rate (INR)', { x: 390, y, size: 9, font: fontBold });
      page.drawText('Amount (INR)', { x: 475, y, size: 9, font: fontBold });

      // Table Rows
      for (const item of items) {
        y -= 22;
        page.drawText(item.description.slice(0, 35), { x: 45, y, size: 9, font: fontRegular });
        page.drawText(item.hsn, { x: 260, y, size: 9, font: fontRegular });
        page.drawText(item.quantity.toString(), { x: 345, y, size: 9, font: fontRegular });
        page.drawText(item.rate.toLocaleString('en-IN'), { x: 390, y, size: 9, font: fontRegular });
        page.drawText((item.quantity * item.rate).toLocaleString('en-IN'), { x: 475, y, size: 9, font: fontBold });
      }

      // Totals & Tax Breakdown Box
      y -= 40;
      page.drawRectangle({ x: 320, y: y - 75, width: 235, height: 95, color: rgb(0.97, 0.98, 1) });
      page.drawText(`Taxable Subtotal: INR ${subtotal.toLocaleString('en-IN')}`, { x: 330, y, size: 9, font: fontRegular });
      y -= 15;
      if (isInterState) {
        page.drawText(`IGST (18%): INR ${igst.toLocaleString('en-IN')}`, { x: 330, y, size: 9, font: fontRegular });
      } else {
        page.drawText(`CGST (9%): INR ${cgst.toLocaleString('en-IN')}  |  SGST (9%): INR ${sgst.toLocaleString('en-IN')}`, { x: 330, y, size: 8, font: fontRegular });
      }
      y -= 20;
      page.drawText(`GRAND TOTAL: INR ${grandTotal.toLocaleString('en-IN')}`, { x: 330, y, size: 11, font: fontBold, color: rgb(0.04, 0.4, 0.8) });

      // Signatory Note
      page.drawText('Authorized Signatory & Digital Stamp', { x: 40, y: 100, size: 9, font: fontBold });
      page.drawText('Generated via AETHER Studio • Zero-Server Local Billing', { x: 40, y: 40, size: 8, font: fontRegular, color: rgb(0.6, 0.6, 0.6) });

      const pdfBytes = await doc.save();
      downloadUint8Array(pdfBytes, `${invoiceNumber}_GST_Invoice.pdf`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Invoice generation failed:', err);
      alert('Failed to generate GST invoice PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Invoice Config */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
        <div>
          <label className="text-xs font-fira text-slate-400">Invoice Number</label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white font-fira text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-fira text-slate-400">Invoice Date</label>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white font-fira text-xs"
          />
        </div>
      </div>

      {/* Seller & Buyer Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
          <span className="text-[10px] font-fira text-cyan-400 font-bold uppercase">Seller (Billed From)</span>
          <input
            type="text"
            placeholder="Seller Name"
            value={sellerName}
            onChange={(e) => setSellerName(e.target.value)}
            className="w-full px-3 py-1 rounded bg-white/5 border border-white/10 text-white text-xs"
          />
          <input
            type="text"
            placeholder="Seller GSTIN"
            value={sellerGst}
            onChange={(e) => setSellerGst(e.target.value)}
            className="w-full px-3 py-1 rounded bg-white/5 border border-white/10 text-white text-xs font-mono"
          />
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
          <span className="text-[10px] font-fira text-purple-400 font-bold uppercase">Buyer (Billed To)</span>
          <input
            type="text"
            placeholder="Buyer Name"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            className="w-full px-3 py-1 rounded bg-white/5 border border-white/10 text-white text-xs"
          />
          <input
            type="text"
            placeholder="Buyer GSTIN"
            value={buyerGst}
            onChange={(e) => setBuyerGst(e.target.value)}
            className="w-full px-3 py-1 rounded bg-white/5 border border-white/10 text-white text-xs font-mono"
          />
        </div>
      </div>

      {/* Line Items Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-fira text-slate-300 font-semibold">Billable Line Items</span>
          <button
            onClick={addItem}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-fira flex items-center gap-1 hover:bg-cyan-500/30 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/10">
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                className="flex-1 px-2 py-1 rounded bg-white/5 text-white text-xs"
                placeholder="Item Description"
              />
              <input
                type="text"
                value={item.hsn}
                onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                className="w-16 px-2 py-1 rounded bg-white/5 text-white text-xs font-mono text-center"
                placeholder="HSN"
              />
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                className="w-14 px-2 py-1 rounded bg-white/5 text-white text-xs text-center"
                placeholder="Qty"
              />
              <input
                type="number"
                value={item.rate}
                onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 rounded bg-white/5 text-white text-xs text-right"
                placeholder="Rate"
              />
              <button onClick={() => removeItem(item.id)} className="p-1 text-rose-400 hover:text-rose-300">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-fira">
        <div className="text-slate-400">
          <span>Subtotal: INR {subtotal.toLocaleString('en-IN')}</span> • <span>GST: INR {totalTax.toLocaleString('en-IN')}</span>
        </div>
        <div className="text-sm font-bold text-cyan-300">
          Grand Total: INR {grandTotal.toLocaleString('en-IN')}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Calculator className="w-4 h-4 text-cyan-400" />
          <span>Auto-calculates CGST/SGST/IGST inter-state taxes</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating Invoice...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Invoice Saved!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Generate & Download Invoice
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};