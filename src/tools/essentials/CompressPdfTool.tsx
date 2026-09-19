import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, Loader2, Minimize2, Sparkles } from 'lucide-react';
import { workerBridge } from '@/core/workers/workerBridge';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface CompressPdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const CompressPdfTool: React.FC<CompressPdfToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(preloadedFile || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleExecuteCompress = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const bytes = await fileToUint8Array(file);
      const worker = workerBridge.getWorker();
      const compressedBytes = await worker.compressPdf(bytes);

      setCompressedSize(compressedBytes.length);
      downloadUint8Array(compressedBytes, `compressed_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70 });
    } catch (err) {
      sfx.playError();
      console.error(err);
      alert('Failed to compress document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white/[0.03] border-2 border-dashed border-white/10 text-center space-y-3">
          <UploadCloud className="w-10 h-10 text-emerald-400" />
          <h4 className="font-semibold text-white">Select PDF to Compress</h4>
          <label className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-emerald-500/20 transition-all">
            Browse Document
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Card with Size Comparison */}
          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{file.name}</p>
                <p className="text-xs text-slate-400 font-fira">Original Size: {formatSize(file.size)}</p>
              </div>
            </div>

            {compressedSize && (
              <div className="text-right">
                <span className="text-xs text-emerald-400 font-bold font-fira">
                  Reduced to {formatSize(compressedSize)}
                </span>
                <p className="text-[11px] text-slate-400 font-fira">
                  Saved {Math.max(0, Math.round(((file.size - compressedSize) / file.size) * 100))}%
                </p>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300 font-fira">
            <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Lossless stream optimization & metadata stripping applied. Text and vector clarity preserved 100%.</span>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-fira"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteCompress}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-40 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compressing in Worker...</span>
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>Compressed & Downloaded!</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span>Compress & Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};