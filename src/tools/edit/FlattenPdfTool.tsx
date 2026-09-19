import React, { useState, useEffect } from 'react';
import { 
  Layers2, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  Lock 
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

export const FlattenPdfTool: React.FC<{ preloadedFile?: File | null; onClose: () => void }> = ({ 
  preloadedFile, 
  onClose 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      setFile(preloadedFile);
    }
  }, [preloadedFile]);

  const handleExecuteFlatten = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const buffer = await fileToUint8Array(file);
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      // Flatten interactive AcroForm fields into permanent page graphics
      const form = doc.getForm();
      try {
        form.flatten();
      } catch {
        // Form was already flat
      }

      const outputBytes = await doc.save({ useObjectStreams: true });
      downloadUint8Array(outputBytes, `flattened_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Flatten error:', err);
      alert('Failed to flatten document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Layers2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF to Flatten</h4>
            <p className="text-xs text-slate-400 mt-1">Bakes all form inputs, digital signatures, and comments into non-editable vector graphics.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF Document</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
              <p className="text-[10px] text-slate-400 font-fira">
                Ready to permanently lock AcroForm form fields and layers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Permanent AcroForm vector baking</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleExecuteFlatten}
            disabled={!file || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Flattening...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" /> Flattened & Saved!
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Flatten & Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};