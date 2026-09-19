import React, { useState } from 'react';
import { 
  Truck, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  FileText, 
  MapPin, 
  Barcode 
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

export const EwayBillGeneratorTool: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [docNumber, setDocNumber] = useState(`EWB-${Date.now().toString().slice(-6)}`);
  const [vehicleNo, setVehicleNo] = useState('MH-04-AB-1234');
  const [dispatchFrom, setDispatchFrom] = useState('Warehouse 4B, Bhiwandi, Maharashtra');
  const [shipTo, setShipTo] = useState('Central Hub, Whitefield, Bengaluru, Karnataka');
  const [distanceKm, setDistanceKm] = useState('980 KM');
  const [goodsDescription, setGoodsDescription] = useState('High-Density Server Hardware & Network Switches');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleGenerateChallan = async () => {
    try {
      setIsProcessing(true);
      sfx.playScan();

      const doc = await PDFDocument.create();
      const page = doc.addPage([595, 842]);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

      page.drawRectangle({ x: 0, y: 762, width: 595, height: 80, color: rgb(0.05, 0.08, 0.15) });
      page.drawText('E-WAY BILL & DELIVERY CHALLAN', { x: 40, y: 800, size: 16, font: fontBold, color: rgb(0.96, 0.62, 0.04) });
      page.drawText(`Challan #: ${docNumber}  |  Generated: ${new Date().toLocaleDateString()}`, { x: 40, y: 780, size: 9, font: fontRegular, color: rgb(0.8, 0.8, 0.8) });

      let y = 730;
      page.drawText('PART-A: VEHICLE & TRANSPORT DETAILS', { x: 40, y, size: 10, font: fontBold });
      y -= 18;
      page.drawText(`Vehicle Registration Number: ${vehicleNo}`, { x: 40, y, size: 9, font: fontRegular });
      page.drawText(`Approx Distance: ${distanceKm}`, { x: 340, y, size: 9, font: fontRegular });
      y -= 25;

      page.drawText('PART-B: DISPATCH & DESTINATION ROUTE', { x: 40, y, size: 10, font: fontBold });
      y -= 18;
      page.drawText(`Dispatch Origin: ${dispatchFrom}`, { x: 40, y, size: 9, font: fontRegular });
      y -= 14;
      page.drawText(`Delivery Destination: ${shipTo}`, { x: 40, y, size: 9, font: fontRegular });
      y -= 25;

      page.drawText('PART-C: CONSIGNMENT SPECIFICATION', { x: 40, y, size: 10, font: fontBold });
      y -= 18;
      page.drawText(`Goods: ${goodsDescription}`, { x: 40, y, size: 9, font: fontRegular });
      y -= 40;

      // Barcode simulation
      page.drawText('|||| || ||||| || |||||| | |||| |||||| ||', { x: 40, y, size: 14, font: fontBold });
      y -= 15;
      page.drawText('Authorized Logistics Dispatch Officer Stamp', { x: 40, y, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

      const pdfBytes = await doc.save();
      downloadUint8Array(pdfBytes, `${docNumber}_Challan.pdf`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      alert('Could not generate delivery challan.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-fira">
        <div>
          <label className="text-slate-400 block mb-1">Challan / E-Way Number</label>
          <input
            type="text"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
          />
        </div>
        <div>
          <label className="text-slate-400 block mb-1">Vehicle Registration Number</label>
          <input
            type="text"
            value={vehicleNo}
            onChange={(e) => setVehicleNo(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-slate-400 block mb-1">Dispatch From</label>
          <input
            type="text"
            value={dispatchFrom}
            onChange={(e) => setDispatchFrom(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-slate-400 block mb-1">Ship To Destination</label>
          <input
            type="text"
            value={shipTo}
            onChange={(e) => setShipTo(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-slate-400 block mb-1">Consignment Goods Description</label>
          <input
            type="text"
            value={goodsDescription}
            onChange={(e) => setGoodsDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Logistics standard transport compliance</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleGenerateChallan}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold font-fira text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating Challan...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" /> Challan Saved!
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" /> Generate E-Way Challan PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};