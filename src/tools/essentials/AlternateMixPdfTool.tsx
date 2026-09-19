import React, { useState } from 'react';
import { 
  Shuffle, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  ArrowDownUp, 
  Layers 
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface AlternateMixPdfToolProps {
  onClose: () => void;
}

export const AlternateMixPdfTool: React.FC<AlternateMixPdfToolProps> = ({ onClose }) => {
  const [oddFile, setOddFile] = useState<File | null>(null);
  const [evenFile, setEvenFile] = useState<File | null>(null);
  const [reverseEven, setReverseEven] = useState<boolean>(true); // Scanners usually output back pages in reverse

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleExecuteMix = async () => {
    if (!oddFile || !evenFile) {
      alert('Please select both Odd and Even scanned documents.');
      return;
    }

    try {
      setIsProcessing(true);
      sfx.playScan();

      const oddBuffer = await fileToUint8Array(oddFile);
      const evenBuffer = await fileToUint8Array(evenFile);

      const oddDoc = await PDFDocument.load(oddBuffer, { ignoreEncryption: true });
      const evenDoc = await PDFDocument.load(evenBuffer, { ignoreEncryption: true });

      const mergedDoc = await PDFDocument.create();

      const oddCount = oddDoc.getPageCount();
      const evenCount = evenDoc.getPageCount();
      const maxPages = Math.max(oddCount, evenCount);

      const oddIndices = oddDoc.getPageIndices();
      let evenIndices = evenDoc.getPageIndices();

      if (reverseEven) {
        evenIndices = evenIndices.reverse();
      }

      for (let i = 0; i < maxPages; i++) {
        if (i < oddCount) {
          const [oddPage] = await mergedDoc.copyPages(oddDoc, [oddIndices[i]]);
          mergedDoc.addPage(oddPage);
        }
        if (i < evenCount) {
          const [evenPage] = await mergedDoc.copyPages(evenDoc, [evenIndices[i]]);
          mergedDoc.addPage(evenPage);
        }
      }

      const outputBytes = await mergedDoc.save();
      downloadUint8Array(outputBytes, `interleaved_${Date.now()}.pdf`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Alternate mix error:', err);
      alert('Failed to interleave PDF documents.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Description */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
        <h4 className="font-semibold text-sm text-white flex items-center gap-2">
          <Shuffle className="w-4 h-4 text-cyan-400" /> Duplex Scanner Page Interleaver
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Combine single-sided scanner outputs: File 1 (Pages 1, 3, 5...) + File 2 (Pages 2, 4, 6...) into sequential order.
        </p>
      </div>

      {/* Two File Upload Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* SLOT A: Odd Pages */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 w-10 h-10 mx-auto flex items-center justify-center font-bold font-fira text-sm">
            1,3
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Document A: Front / Odd Pages</span>
            <p className="text-[10px] text-slate-400">Pages 1, 3, 5, 7, 9...</p>
          </div>
          {oddFile ? (
            <div className="p-2 rounded-xl bg-white/5 text-xs font-fira text-cyan-300 truncate">
              {oddFile.name}
            </div>
          ) : (
            <label className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 font-fira text-xs cursor-pointer block transition-colors">
              <span>Select Odd Scans</span>
              <input type="file" accept=".pdf" onChange={(e) => e.target.files && setOddFile(e.target.files[0])} className="hidden" />
            </label>
          )}
        </div>

        {/* SLOT B: Even Pages */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 w-10 h-10 mx-auto flex items-center justify-center font-bold font-fira text-sm">
            2,4
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Document B: Back / Even Pages</span>
            <p className="text-[10px] text-slate-400">Pages 2, 4, 6, 8, 10...</p>
          </div>
          {evenFile ? (
            <div className="p-2 rounded-xl bg-white/5 text-xs font-fira text-purple-300 truncate">
              {evenFile.name}
            </div>
          ) : (
            <label className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 font-fira text-xs cursor-pointer block transition-colors">
              <span>Select Even Scans</span>
              <input type="file" accept=".pdf" onChange={(e) => e.target.files && setEvenFile(e.target.files[0])} className="hidden" />
            </label>
          )}
        </div>

      </div>

      {/* Reverse Option Checkbox */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-fira">
        <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={reverseEven}
            onChange={(e) => setReverseEven(e.target.checked)}
            className="w-4 h-4 rounded accent-cyan-400"
          />
          <span>Reverse Document B order (Automatic for reverse-feed feeder scans)</span>
        </label>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Lossless page copying • Instant client-side join</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleExecuteMix}
            disabled={!oddFile || !evenFile || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Interleaving Pages...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Interleaved & Saved!
              </>
            ) : (
              <>
                <ArrowDownUp className="w-4 h-4" /> Interleave & Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};