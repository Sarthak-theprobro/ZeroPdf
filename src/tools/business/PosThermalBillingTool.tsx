import React, { useState } from 'react';
import { 
  Printer, 
  Plus, 
  Trash2, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Store, 
  Barcode 
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface PosItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export const PosThermalBillingTool: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [storeName, setStoreName] = useState('CYBER CAFE & RETAIL');
  const [cashier, setCashier] = useState('Terminal #04 (Alex)');
  const [receiptNumber, setReceiptNumber] = useState(`REC-${Date.now().toString().slice(-5)}`);
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');

  const [items, setItems] = useState<PosItem[]>([
    { id: '1', name: 'Cold Brew Espresso', qty: 2, price: 180 },
    { id: '2', name: 'Avocado Toast Deluxe', qty: 1, price: 320 },
    { id: '3', name: 'Mineral Water 500ml', qty: 1, price: 40 },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + tax;

  const addItem = () => {
    sfx.playClick();
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), name: 'New Item', qty: 1, price: 100 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    sfx.playClick();
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof PosItem, val: any) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: val } : i))
    );
  };

  const handlePrintReceipt = async () => {
    try {
      setIsProcessing(true);
      sfx.playScan();

      const doc = await PDFDocument.create();
      // 80mm = ~226 points width, 58mm = ~164 points width
      const width = paperWidth === '80mm' ? 226 : 164;
      const height = 450 + items.length * 20;

      const page = doc.addPage([width, height]);
      const fontMono = await doc.embedFont(StandardFonts.Courier);
      const fontBold = await doc.embedFont(StandardFonts.CourierBold);

      let y = height - 30;

      // Centered Store Header
      page.drawText(storeName, { x: 20, y, size: 10, font: fontBold });
      y -= 14;
      page.drawText('Point of Sale Receipt', { x: 30, y, size: 8, font: fontMono });
      y -= 12;
      page.drawText(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, { x: 10, y, size: 7, font: fontMono });
      y -= 10;
      page.drawText(`Order #: ${receiptNumber}  |  ${cashier}`, { x: 10, y, size: 7, font: fontMono });
      y -= 14;

      page.drawLine({ start: { x: 10, y }, end: { x: width - 10, y }, thickness: 1, color: rgb(0, 0, 0) });
      y -= 14;

      // Table Header
      page.drawText('Item', { x: 10, y, size: 8, font: fontBold });
      page.drawText('Qty', { x: width - 65, y, size: 8, font: fontBold });
      page.drawText('Price', { x: width - 35, y, size: 8, font: fontBold });
      y -= 12;

      for (const item of items) {
        page.drawText(item.name.slice(0, 14), { x: 10, y, size: 7.5, font: fontMono });
        page.drawText(item.qty.toString(), { x: width - 60, y, size: 7.5, font: fontMono });
        page.drawText((item.qty * item.price).toString(), { x: width - 35, y, size: 7.5, font: fontMono });
        y -= 12;
      }

      page.drawLine({ start: { x: 10, y }, end: { x: width - 10, y }, thickness: 0.8, color: rgb(0, 0, 0) });
      y -= 14;

      // Totals
      page.drawText(`Subtotal: ${subtotal}`, { x: width - 85, y, size: 8, font: fontMono });
      y -= 11;
      page.drawText(`GST (5%): ${tax}`, { x: width - 85, y, size: 8, font: fontMono });
      y -= 14;
      page.drawText(`TOTAL: INR ${grandTotal}`, { x: width - 100, y, size: 9, font: fontBold });
      y -= 25;

      // Barcode & Footer
      page.drawText('||| | | |||| || ||| | |||||', { x: 30, y, size: 12, font: fontMono });
      y -= 12;
      page.drawText('* THANK YOU FOR YOUR VISIT *', { x: 18, y, size: 7, font: fontMono });

      const pdfBytes = await doc.save();
      downloadUint8Array(pdfBytes, `${receiptNumber}_POS_Receipt.pdf`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error(err);
      alert('Could not compile thermal receipt.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Config & Line Items (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-fira">
            <div>
              <label className="text-slate-400 block mb-1">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Paper Roll Format</label>
              <div className="flex gap-2">
                {['80mm', '58mm'].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setPaperWidth(w as any)}
                    className={`flex-1 py-1 rounded font-bold cursor-pointer ${
                      paperWidth === w ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* POS Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-fira">
              <span className="text-slate-300 font-bold">Register Items</span>
              <button
                onClick={addItem}
                className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-fira">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-white/5 text-white"
                  />
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                    className="w-14 px-2 py-1 rounded bg-white/5 text-white text-center"
                  />
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 rounded bg-white/5 text-white text-right"
                  />
                  <button onClick={() => removeItem(item.id)} className="p-1 text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Thermal Receipt Simulation (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
          <div className="w-48 bg-white text-slate-900 p-4 rounded-lg shadow-2xl font-mono text-[9px] space-y-2 border border-slate-300">
            <div className="text-center font-bold text-[10px]">{storeName}</div>
            <div className="text-center text-slate-500 text-[8px]">POS Thermal Receipt</div>
            <div className="border-b border-dashed border-slate-400 pb-1 text-[7px] text-slate-500">
              {new Date().toLocaleDateString()} • {receiptNumber}
            </div>

            <div className="space-y-1">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span>{i.name.slice(0, 10)} x{i.qty}</span>
                  <span>{i.qty * i.price}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-400 pt-1 space-y-0.5">
              <div className="flex justify-between"><span>Subtotal:</span><span>{subtotal}</span></div>
              <div className="flex justify-between"><span>GST:</span><span>{tax}</span></div>
              <div className="flex justify-between font-bold text-[10px]"><span>TOTAL:</span><span>{grandTotal}</span></div>
            </div>

            <div className="text-center text-[10px] pt-1">||| | || ||| ||</div>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Thermal 58mm / 80mm POS Roll Formatting</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handlePrintReceipt}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold font-fira text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating Receipt...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Receipt Downloaded!
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" /> Generate Thermal Receipt PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};