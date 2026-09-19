import React, { useState } from 'react';
import { 
  GitCompare, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  FileText, 
  Layers, 
  Eye 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

export const ComparePdfsTool: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [docA, setDocA] = useState<File | null>(null);
  const [docB, setDocB] = useState<File | null>(null);
  const [pageAUrl, setPageAUrl] = useState<string | null>(null);
  const [pageBUrl, setPageBUrl] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [diffPercent, setDiffPercent] = useState<number | null>(null);

  const handleCompare = async () => {
    if (!docA || !docB) {
      alert('Please upload both Document A (Original) and Document B (Revision).');
      return;
    }

    try {
      setIsComparing(true);
      sfx.playScan();

      const bufA = await docA.arrayBuffer();
      const bufB = await docB.arrayBuffer();

      const pdfA = await pdfjsLib.getDocument({ data: bufA }).promise;
      const pdfB = await pdfjsLib.getDocument({ data: bufB }).promise;

      // Render Page 1 of both documents
      const pA = await pdfA.getPage(1);
      const pB = await pdfB.getPage(1);

      const vpA = pA.getViewport({ scale: 1.2 });
      const vpB = pB.getViewport({ scale: 1.2 });

      const cA = document.createElement('canvas');
      cA.width = vpA.width;
      cA.height = vpA.height;
      const ctxA = cA.getContext('2d');
      if (ctxA) {
        ctxA.fillStyle = '#ffffff';
        ctxA.fillRect(0, 0, cA.width, cA.height);
        await pA.render({ canvasContext: ctxA, viewport: vpA }).promise;
        setPageAUrl(cA.toDataURL('image/png'));
      }

      const cB = document.createElement('canvas');
      cB.width = vpB.width;
      cB.height = vpB.height;
      const ctxB = cB.getContext('2d');
      if (ctxB) {
        ctxB.fillStyle = '#ffffff';
        ctxB.fillRect(0, 0, cB.width, cB.height);
        await pB.render({ canvasContext: ctxB, viewport: vpB }).promise;
        setPageBUrl(cB.toDataURL('image/png'));
      }

      // Calculate pixel diff percentage
      let diffPixels = 0;
      if (ctxA && ctxB) {
        const imgA = ctxA.getImageData(0, 0, cA.width, cA.height).data;
        const imgB = ctxB.getImageData(0, 0, cB.width, cB.height).data;
        const len = Math.min(imgA.length, imgB.length);

        for (let i = 0; i < len; i += 4) {
          if (Math.abs(imgA[i] - imgB[i]) > 30 || Math.abs(imgA[i + 1] - imgB[i + 1]) > 30) {
            diffPixels++;
          }
        }
        const total = len / 4;
        setDiffPercent(Math.round((diffPixels / total) * 100));
      }

      sfx.playSuccess();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error(err);
      alert('Failed to compare documents.');
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Upload slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Original File */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-2">
          <span className="text-xs font-bold text-cyan-400 block font-orbitron">Original Document (v1)</span>
          {docA ? (
            <div className="p-2 rounded-xl bg-white/5 text-xs font-fira text-white truncate">{docA.name}</div>
          ) : (
            <label className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-fira cursor-pointer block">
              <span>Select Document A</span>
              <input type="file" accept=".pdf" onChange={(e) => e.target.files && setDocA(e.target.files[0])} className="hidden" />
            </label>
          )}
        </div>

        {/* Revision File */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-2">
          <span className="text-xs font-bold text-purple-400 block font-orbitron">Revision Document (v2)</span>
          {docB ? (
            <div className="p-2 rounded-xl bg-white/5 text-xs font-fira text-white truncate">{docB.name}</div>
          ) : (
            <label className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-xs font-fira cursor-pointer block">
              <span>Select Document B</span>
              <input type="file" accept=".pdf" onChange={(e) => e.target.files && setDocB(e.target.files[0])} className="hidden" />
            </label>
          )}
        </div>

      </div>

      {/* Sync Diff Viewport */}
      {pageAUrl && pageBUrl && (
        <div className="space-y-3">
          {diffPercent !== null && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center text-xs font-fira text-cyan-300">
              Visual Variance Detected: <strong>{diffPercent}% Pixel Discrepancy</strong> between Version A and Version B
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-center space-y-2">
              <span className="text-[10px] font-fira text-slate-400">Version A (Page 1)</span>
              <div className="h-64 overflow-y-auto bg-white rounded-lg p-2 border border-slate-300 flex justify-center">
                <img src={pageAUrl} alt="Doc A" className="object-contain max-h-full" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-center space-y-2">
              <span className="text-[10px] font-fira text-slate-400">Version B (Page 1)</span>
              <div className="h-64 overflow-y-auto bg-white rounded-lg p-2 border border-slate-300 flex justify-center">
                <img src={pageBUrl} alt="Doc B" className="object-contain max-h-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Pixel-diff synchronized raster comparison</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleCompare}
            disabled={!docA || !docB || isComparing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isComparing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Running Dual Diff...
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4" /> Compare Documents
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};