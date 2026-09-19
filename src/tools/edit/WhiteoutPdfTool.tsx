import React, { useState, useEffect, useRef } from 'react';
import { 
  Eraser, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  Undo2, 
  Trash2, 
  Sparkles, 
  Palette,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface WhiteoutPdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

interface WhiteoutMask {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  page: number;
}

export const WhiteoutPdfTool: React.FC<WhiteoutPdfToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [maskColor, setMaskColor] = useState<string>('#ffffff');
  const [masks, setMasks] = useState<WhiteoutMask[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [processedBytes, setProcessedBytes] = useState<Uint8Array | null>(null);

  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (preloadedFile) {
      handleFileSelected(preloadedFile);
    }
  }, [preloadedFile]);

  useEffect(() => {
    if (file) {
      renderPage(file, currentPage);
    }
  }, [file, currentPage]);

  useEffect(() => {
    redrawOverlay();
  }, [masks, currentRect, currentPage]);

  const handleFileSelected = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setMasks([]);
    setProcessedBytes(null);
    sfx.playClick();

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
    } catch (err) {
      console.error('PDF load error:', err);
    }
  };

  const renderPage = async (f: File, pageNum: number) => {
    try {
      const buffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.2 });

      const pdfCanvas = pdfCanvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      if (!pdfCanvas || !overlayCanvas) return;

      pdfCanvas.width = viewport.width;
      pdfCanvas.height = viewport.height;
      overlayCanvas.width = viewport.width;
      overlayCanvas.height = viewport.height;

      const ctx = pdfCanvas.getContext('2d');
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
      redrawOverlay();
    } catch (err) {
      console.error('Render error:', err);
    }
  };

  const redrawOverlay = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing masks for current page
    masks
      .filter((m) => m.page === currentPage)
      .forEach((m) => {
        ctx.fillStyle = m.color;
        ctx.fillRect(m.x, m.y, m.width, m.height);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(m.x, m.y, m.width, m.height);
        ctx.setLineDash([]);
      });

    // Draw active drawing rectangle
    if (currentRect) {
      ctx.fillStyle = `${maskColor}bb`;
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = overlayCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    const rect = overlayCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(startPoint.x, currentX);
    const y = Math.min(startPoint.y, currentY);
    const width = Math.abs(currentX - startPoint.x);
    const height = Math.abs(currentY - startPoint.y);

    setCurrentRect({ x, y, width, height });
  };

  const handlePointerUp = () => {
    if (isDrawing && currentRect && currentRect.width > 5 && currentRect.height > 5) {
      const newMask: WhiteoutMask = {
        id: `mask-${Date.now()}`,
        ...currentRect,
        color: maskColor,
        page: currentPage,
      };
      setMasks((prev) => [...prev, newMask]);
      sfx.playClick();
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRect(null);
  };

  const handleBakeWhiteout = async () => {
    if (!file) return;

    try {
      sfx.playScan();
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Convert hex color to rgb
      const hexToRgb = (hex: string) => {
        const num = parseInt(hex.replace('#', ''), 16);
        return {
          r: ((num >> 16) & 255) / 255,
          g: ((num >> 8) & 255) / 255,
          b: (num & 255) / 255,
        };
      };

      const canvas = pdfCanvasRef.current;
      const viewportWidth = canvas ? canvas.width : 595;
      const viewportHeight = canvas ? canvas.height : 842;

      masks.forEach((m) => {
        const page = pages[m.page - 1];
        if (!page) return;
        const { width, height } = page.getSize();

        // Scale factors from canvas coordinates to PDF point coordinates
        const scaleX = width / viewportWidth;
        const scaleY = height / viewportHeight;

        const pdfX = m.x * scaleX;
        const pdfWidth = m.width * scaleX;
        const pdfHeight = m.height * scaleY;
        const pdfY = height - (m.y * scaleY) - pdfHeight; // PDF origin is bottom-left

        const { r, g, b } = hexToRgb(m.color);

        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: pdfWidth,
          height: pdfHeight,
          color: rgb(r, g, b),
        });
      });

      const savedBytes = await pdfDoc.save();
      setProcessedBytes(savedBytes);
      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Whiteout error:', err);
      alert('Failed to bake whiteout masks.');
      sfx.playError();
    }
  };

  const handleDownload = () => {
    if (!processedBytes || !file) return;
    sfx.playClick();
    const blob = new Blob([processedBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '-whiteout.pdf');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-blue-500/30 hover:border-blue-400/60 rounded-3xl bg-blue-950/10 cursor-pointer transition-all hover:bg-blue-950/20 group">
          <Eraser className="w-14 h-14 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF for Vector Whiteout & Eraser</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Draw clean rectangular eraser masks to permanently hide logos, text typos, barcodes, or unwanted graphics.
          </p>
          <span className="mt-4 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-300 font-fira text-xs font-semibold border border-blue-500/40">
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
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-3 rounded-2xl bg-[#0c101c] border border-white/10 flex items-center justify-between text-xs font-fira">
            {/* Color Palette */}
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-bold">Mask Color:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { hex: '#ffffff', label: 'White' },
                  { hex: '#fbf5e6', label: 'Cream' },
                  { hex: '#000000', label: 'Black' },
                  { hex: '#0f172a', label: 'Slate' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => {
                      setMaskColor(c.hex);
                      sfx.playClick();
                    }}
                    className={`w-5 h-5 rounded-md border transition-all ${
                      maskColor === c.hex ? 'scale-125 border-cyan-400 shadow-md' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-slate-300 font-bold">
                Page {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Undo / Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMasks((prev) => prev.slice(0, -1));
                  sfx.playClick();
                }}
                disabled={masks.length === 0}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer disabled:opacity-30"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo
              </button>

              {!processedBytes ? (
                <button
                  onClick={handleBakeWhiteout}
                  disabled={masks.length === 0}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-400 hover:to-cyan-300 text-black font-bold font-fira text-xs shadow-lg shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Bake Whiteout ({masks.length})
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
              )}
            </div>
          </div>

          {/* Interactive Canvas Workspace */}
          <div className="flex justify-center p-4 rounded-2xl bg-black/60 border border-white/10 overflow-auto max-h-[520px]">
            <div className="relative border border-white/20 shadow-2xl rounded bg-white select-none">
              <canvas ref={pdfCanvasRef} className="block pointer-events-none" />
              <canvas
                ref={overlayCanvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="absolute inset-0 cursor-crosshair touch-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
