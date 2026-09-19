import React, { useState, useEffect, useRef } from 'react';
import { 
  FlipHorizontal, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  FileText,
  RotateCw
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface FlipPdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const FlipPdfTool: React.FC<FlipPdfToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [flipMode, setFlipMode] = useState<'horizontal' | 'vertical' | 'both'>('horizontal');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [flippedBlob, setFlippedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (preloadedFile) handleFileSelected(preloadedFile);
  }, [preloadedFile]);

  const handleFileSelected = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setFlippedBlob(null);
    sfx.playClick();

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });

      const canvas = canvasRef.current;
      if (canvas) {
        const scale = 280 / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
        }
      }
    } catch (err) {
      console.error('Preview error:', err);
    }
  };

  const handleExecuteFlip = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const newDoc = await PDFDocument.create();

      const pages = srcDoc.getPages();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        // Embed the page as an XObject to apply scale transformations
        const [embeddedPage] = await newDoc.embedPages([page]);
        const newPage = newDoc.addPage([width, height]);

        if (flipMode === 'horizontal') {
          // Scale X by -1 and translate by width
          newPage.drawPage(embeddedPage, {
            x: width,
            y: 0,
            xScale: -1,
            yScale: 1,
          });
        } else if (flipMode === 'vertical') {
          // Scale Y by -1 and translate by height
          newPage.drawPage(embeddedPage, {
            x: 0,
            y: height,
            xScale: 1,
            yScale: -1,
          });
        } else if (flipMode === 'both') {
          newPage.drawPage(embeddedPage, {
            x: width,
            y: height,
            xScale: -1,
            yScale: -1,
          });
        }
      }

      const savedBytes = await newDoc.save();
      const blob = new Blob([savedBytes as any], { type: 'application/pdf' });
      setFlippedBlob(blob);

      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Flip PDF error:', err);
      alert('Failed to flip PDF pages.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!flippedBlob || !file) return;
    sfx.playClick();
    const url = URL.createObjectURL(flippedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, `-flipped-${flipMode}.pdf`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-3xl bg-cyan-950/10 cursor-pointer transition-all hover:bg-cyan-950/20 group">
          <FlipHorizontal className="w-14 h-14 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF to Flip / Mirror Imposition</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Mirror PDF pages horizontally or vertically for specialized printing, t-shirt transfers, and transparency films.
          </p>
          <span className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 font-fira text-xs font-semibold border border-cyan-500/40">
            Select PDF File
          </span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
            }}
          />
        </label>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Canvas Preview */}
          <div className="md:col-span-6 flex flex-col items-center justify-center p-6 rounded-2xl bg-black/40 border border-white/10">
            <div 
              className="border border-white/20 shadow-2xl rounded bg-white transition-transform duration-300"
              style={{
                transform: `${flipMode === 'horizontal' ? 'scaleX(-1)' : flipMode === 'vertical' ? 'scaleY(-1)' : 'scale(-1, -1)'}`,
              }}
            >
              <canvas ref={canvasRef} className="block max-w-full h-auto" />
            </div>
            <span className="mt-3 text-[11px] font-fira text-cyan-300">
              Simulated {flipMode.toUpperCase()} Mirror Transformation
            </span>
          </div>

          {/* Right Mode Selection & Actions */}
          <div className="md:col-span-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-white truncate max-w-xs">{file.name}</h4>
                  <p className="text-xs text-slate-400 font-fira">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready
                  </p>
                </div>

                <button
                  onClick={() => {
                    setFile(null);
                    setFlippedBlob(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white font-fira"
                >
                  Change File
                </button>
              </div>

              {/* Mode Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 font-orbitron block">
                  Select Mirror Axis:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'horizontal', label: 'Horizontal (X-Axis)' },
                    { id: 'vertical', label: 'Vertical (Y-Axis)' },
                    { id: 'both', label: 'Both Axes' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setFlipMode(m.id as any);
                        sfx.playClick();
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-fira font-bold transition-all cursor-pointer ${
                        flipMode === m.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex justify-end pt-2">
              {!flippedBlob ? (
                <button
                  onClick={handleExecuteFlip}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  Execute Mirror Transformation
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Flipped PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};