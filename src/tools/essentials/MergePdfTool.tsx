import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, ArrowUp, ArrowDown, Trash2, Sparkles, CheckCircle2, Loader2, Download } from 'lucide-react';
import { workerBridge } from '@/core/workers/workerBridge';
import { filesToUint8Arrays, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface MergePdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const MergePdfTool: React.FC<MergePdfToolProps> = ({ preloadedFile, onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      setFiles([preloadedFile]);
    }
  }, [preloadedFile]);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      sfx.playSuccess();
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    sfx.playHover();
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return updated;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    sfx.playHover();
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return updated;
    });
  };

  const handleRemove = (index: number) => {
    sfx.playClick();
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExecuteMerge = async () => {
    if (files.length < 2) {
      alert('Please add at least 2 PDF files to merge.');
      return;
    }

    try {
      setIsProcessing(true);
      sfx.playScan();

      // Convert files to Uint8Arrays on main thread
      const buffers = await filesToUint8Arrays(files);

      // Execute merging off the main thread in background Web Worker
      const worker = workerBridge.getWorker();
      const mergedBytes = await worker.mergePdfs(buffers);

      // Download merged file from client memory
      downloadUint8Array(mergedBytes, `merged_document_${Date.now()}.pdf`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Merge error:', err);
      alert('Failed to merge documents. Please verify they are valid PDF files.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* File Upload Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
        <div>
          <h4 className="font-semibold text-sm text-white">Select Documents to Combine</h4>
          <p className="text-xs text-slate-400">Add 2 or more PDF files and arrange their order.</p>
        </div>
        <label className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2">
          <UploadCloud className="w-4 h-4" />
          <span>Add More PDFs</span>
          <input type="file" multiple accept=".pdf" onChange={handleAddFiles} className="hidden" />
        </label>
      </div>

      {/* Reorderable File List */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {files.length === 0 ? (
          <div className="py-10 text-center text-slate-500 font-fira text-xs border border-dashed border-white/10 rounded-2xl">
            No files loaded yet. Click &quot;Add More PDFs&quot; above.
          </div>
        ) : (
          files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-[11px] font-fira font-bold text-cyan-300 flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400 font-fira">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === files.length - 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleRemove(idx)}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{files.length} document(s) queued</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-fira transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteMerge}
            disabled={files.length < 2 || isProcessing}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Merging in Worker...</span>
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Merged & Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Merge & Download</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};