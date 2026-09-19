import React, { useState, useEffect } from 'react';
import { 
  Moon, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  Sun, 
  Flame 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface InvertPdfColorsToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const InvertPdfColorsTool: React.FC<InvertPdfColorsToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [theme, setTheme] = useState<'oled-dark' | 'sepia' | 'cyber-amber'>('oled-dark');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      setFile(preloadedFile);
    }
  }, [preloadedFile]);

  const handleInvertDocument = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      const outputDoc = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport }).promise;

          // Apply pixel-level color transformations
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          for (let p = 0; p < data.length; p += 4) {
            const r = data[p];
            const g = data[p + 1];
            const b = data[p + 2];

            if (theme === 'oled-dark') {
              data[p] = 255 - r;
              data[p + 1] = 255 - g;
              data[p + 2] = 255 - b;
            } else if (theme === 'sepia') {
              data[p] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
              data[p + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
              data[p + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
            } else if (theme === 'cyber-amber') {
              const gray = (r + g + b) / 3;
              data[p] = 255 - gray;
              data[p + 1] = Math.round((255 - gray) * 0.65);
              data[p + 2] = 0;
            }
          }

          ctx.putImageData(imgData, 0, 0);

          const dataUrl = canvas.toDataURL('image/png');
          const pngBytes = await fetch(dataUrl).then((res) => res.arrayBuffer());
          const embeddedImage = await outputDoc.embedPng(pngBytes);

          const newPage = outputDoc.addPage([page.view[2], page.view[3]]);
          newPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: page.view[2],
            height: page.view[3],
          });
        }
      }

      const outputBytes = await outputDoc.save();
      downloadUint8Array(outputBytes, `darkmode_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Inversion failed:', err);
      alert('Failed to invert document colors.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400">
            <Moon className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF for Dark Mode Conversion</h4>
            <p className="text-xs text-slate-400 mt-1">Convert glaring white documents into comfortable OLED Midnight or Warm Sepia.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold font-fira text-xs cursor-pointer shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2">
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
        <div className="space-y-5">
          {/* File Metadata */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-[10px] text-slate-400 font-fira">Ready for Inversion</p>
              </div>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'oled-dark', label: 'OLED Midnight Dark', color: 'bg-black border-slate-700 text-white' },
              { id: 'sepia', label: 'Warm Sepia Reader', color: 'bg-[#f4ecd8] border-amber-300 text-amber-900' },
              { id: 'cyber-amber', label: 'High Contrast Amber', color: 'bg-black border-amber-500 text-amber-400' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id as any)}
                className={`p-4 rounded-2xl border text-xs font-fira font-bold transition-all cursor-pointer ${t.color} ${
                  theme === t.id ? 'ring-2 ring-purple-400 scale-105 shadow-xl' : 'opacity-70 hover:opacity-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Pixel shader transformation • Eye strain reduction</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleInvertDocument}
            disabled={!file || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold font-fira text-xs shadow-lg shadow-purple-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Inverting Pixels...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Converted & Saved!
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" /> Invert Colors & Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};