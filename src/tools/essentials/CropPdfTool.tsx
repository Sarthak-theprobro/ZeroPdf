import React, { useState, useEffect, useRef } from 'react';
import { 
  Crop, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  Loader2, 
  Sliders, 
  Sparkles,
  Maximize2,
  FileCheck
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface CropPdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const CropPdfTool: React.FC<CropPdfToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({ width: 595, height: 842 });
  
  // Margins in points (72 pt = 1 inch, 2.83 pt = 1 mm)
  const [margins, setMargins] = useState({
    top: 36,     // 0.5 in
    bottom: 36,
    left: 36,
    right: 36,
  });

  const [applyMode, setApplyMode] = useState<'all' | 'current' | 'odd' | 'even'>('all');
  const [croppedPdfBytes, setCroppedPdfBytes] = useState<Uint8Array | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (preloadedFile) {
      handleFileSelected(preloadedFile);
    }
  }, [preloadedFile]);

  const handleFileSelected = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setCroppedPdfBytes(null);
    sfx.playClick();

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      renderPagePreview(pdf, 1);
    } catch (err) {
      console.error('Failed to load PDF preview:', err);
    }
  };

  const renderPagePreview = async (pdfDoc: any, pageNum: number) => {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      setPageDimensions({ width: viewport.width, height: viewport.height });

      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const scale = 300 / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
    } catch (err) {
      console.error('Page render error:', err);
    }
  };

  const applyPreset = (type: 'trim-light' | 'trim-heavy' | 'a4-letter' | 'reset') => {
    sfx.playClick();
    if (type === 'reset') {
      setMargins({ top: 0, bottom: 0, left: 0, right: 0 });
    } else if (type === 'trim-light') {
      setMargins({ top: 20, bottom: 20, left: 20, right: 20 });
    } else if (type === 'trim-heavy') {
      setMargins({ top: 50, bottom: 50, left: 50, right: 50 });
    } else if (type === 'a4-letter') {
      setMargins({ top: 36, bottom: 36, left: 28, right: 28 });
    }
  };

  const handleExecuteCrop = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(20);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page, idx) => {
        const pageNum = idx + 1;
        const shouldApply = 
          applyMode === 'all' ||
          (applyMode === 'current' && pageNum === currentPage) ||
          (applyMode === 'odd' && pageNum % 2 !== 0) ||
          (applyMode === 'even' && pageNum % 2 === 0);

        if (shouldApply) {
          const { width, height } = page.getSize();
          
          // PDF coordinates start from bottom-left (0,0)
          const newX = Math.max(0, margins.left);
          const newY = Math.max(0, margins.bottom);
          const newWidth = Math.max(10, width - margins.left - margins.right);
          const newHeight = Math.max(10, height - margins.top - margins.bottom);

          page.setCropBox(newX, newY, newWidth, newHeight);
        }
      });

      setProgress(80);
      const savedBytes = await pdfDoc.save();
      setCroppedPdfBytes(savedBytes);
      setProgress(100);
      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Crop PDF error:', err);
      alert('Failed to crop PDF document.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!croppedPdfBytes || !file) return;
    sfx.playClick();
    const blob = new Blob([croppedPdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '-cropped.pdf');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-3xl bg-cyan-950/10 cursor-pointer transition-all hover:bg-cyan-950/20 group">
          <Crop className="w-14 h-14 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF to Crop Margins & Resize</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Trim printer marks, unwanted borders, header margins, and standardize canvas bounding boxes.
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
          {/* Left Canvas Preview with Crop Guides */}
          <div className="md:col-span-6 flex flex-col items-center justify-center p-6 rounded-2xl bg-black/40 border border-white/10 relative overflow-hidden">
            <div className="relative border border-white/20 shadow-2xl rounded bg-white">
              <canvas ref={canvasRef} className="block max-w-full h-auto" />
              
              {/* Visual Crop Box Overlay */}
              <div 
                className="absolute border-2 border-cyan-400 bg-cyan-500/15 pointer-events-none transition-all duration-200"
                style={{
                  top: `${(margins.top / pageDimensions.height) * 100}%`,
                  bottom: `${(margins.bottom / pageDimensions.height) * 100}%`,
                  left: `${(margins.left / pageDimensions.width) * 100}%`,
                  right: `${(margins.right / pageDimensions.width) * 100}%`,
                }}
              >
                <div className="absolute top-1 left-1 bg-cyan-950/90 text-cyan-300 px-1.5 py-0.5 rounded text-[9px] font-fira font-bold border border-cyan-400/40">
                  Target Canvas
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs font-fira text-slate-400 flex items-center gap-2">
              <span>Original: {Math.round(pageDimensions.width)} × {Math.round(pageDimensions.height)} pt</span>
              <span>•</span>
              <span className="text-cyan-300">
                Cropped: {Math.round(pageDimensions.width - margins.left - margins.right)} × {Math.round(pageDimensions.height - margins.top - margins.bottom)} pt
              </span>
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="md:col-span-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white font-orbitron">Margin Dimensions (pt)</h4>
                <p className="text-xs text-slate-400 font-fira">
                  Adjust boundary trim offsets in PostScript points (72 pt = 1 in)
                </p>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyPreset('reset')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-fira text-slate-300 hover:text-white"
                >
                  Reset (0pt)
                </button>
                <button
                  onClick={() => applyPreset('trim-light')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-fira text-slate-300 hover:text-white"
                >
                  Light Trim (20pt)
                </button>
                <button
                  onClick={() => applyPreset('trim-heavy')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-fira text-slate-300 hover:text-white"
                >
                  Heavy Trim (50pt)
                </button>
                <button
                  onClick={() => applyPreset('a4-letter')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-fira text-slate-300 hover:text-white"
                >
                  Standard 0.5" Margins
                </button>
              </div>

              {/* Sliders / Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="flex justify-between text-xs font-fira">
                    <span className="text-slate-400">Top Margin</span>
                    <span className="text-cyan-300 font-bold">{margins.top} pt</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.round(pageDimensions.height / 3)}
                    value={margins.top}
                    onChange={(e) => setMargins({ ...margins, top: Number(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="flex justify-between text-xs font-fira">
                    <span className="text-slate-400">Bottom Margin</span>
                    <span className="text-cyan-300 font-bold">{margins.bottom} pt</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.round(pageDimensions.height / 3)}
                    value={margins.bottom}
                    onChange={(e) => setMargins({ ...margins, bottom: Number(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="flex justify-between text-xs font-fira">
                    <span className="text-slate-400">Left Margin</span>
                    <span className="text-cyan-300 font-bold">{margins.left} pt</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.round(pageDimensions.width / 3)}
                    value={margins.left}
                    onChange={(e) => setMargins({ ...margins, left: Number(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="flex justify-between text-xs font-fira">
                    <span className="text-slate-400">Right Margin</span>
                    <span className="text-cyan-300 font-bold">{margins.right} pt</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.round(pageDimensions.width / 3)}
                    value={margins.right}
                    onChange={(e) => setMargins({ ...margins, right: Number(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              {/* Page Scope Mode */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 font-fira">Apply Crop To:</span>
                <div className="grid grid-cols-4 gap-2">
                  {(['all', 'current', 'odd', 'even'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setApplyMode(mode)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-fira capitalize transition-all cursor-pointer ${
                        applyMode === mode
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode === 'all' ? 'All Pages' : mode === 'current' ? 'Page 1' : `${mode} Pages`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Execute or Download */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setFile(null);
                  setCroppedPdfBytes(null);
                  sfx.playClick();
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white font-fira text-xs"
              >
                Change File
              </button>

              {!croppedPdfBytes ? (
                <button
                  onClick={handleExecuteCrop}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  Apply Crop to Document
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Cropped PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
