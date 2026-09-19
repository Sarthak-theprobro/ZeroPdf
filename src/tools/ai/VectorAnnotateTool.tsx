import React, { useState, useEffect, useRef } from 'react';
import { 
  Highlighter, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  PenTool, 
  Square, 
  RotateCcw 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

export const VectorAnnotateTool: React.FC<{ preloadedFile?: File | null; onClose: () => void }> = ({ 
  preloadedFile, 
  onClose 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [toolMode, setToolMode] = useState<'pen' | 'highlighter' | 'rect'>('highlighter');
  const [strokeColor, setStrokeColor] = useState<string>('#facc15'); // Yellow highlighter
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      loadFile(preloadedFile);
    }
  }, [preloadedFile]);

  const loadFile = async (f: File) => {
    try {
      setFile(f);
      sfx.playScan();
      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.2 });

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
      sfx.playSuccess();
    } catch (err) {
      sfx.playError();
      alert('Could not open PDF.');
    }
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = toolMode === 'highlighter' ? 18 : 3;
    ctx.strokeStyle = toolMode === 'highlighter' ? 'rgba(250, 204, 21, 0.4)' : strokeColor;

    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const handleSaveAnnotated = async () => {
    if (!file || !canvasRef.current) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const doc = await PDFDocument.create();
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      const pngBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
      const embeddedImg = await doc.embedPng(pngBytes);

      const page = doc.addPage([canvas.width, canvas.height]);
      page.drawImage(embeddedImg, { x: 0, y: 0, width: canvas.width, height: canvas.height });

      const pdfBytes = await doc.save();
      downloadUint8Array(pdfBytes, `annotated_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      alert('Failed to save annotations.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400">
            <Highlighter className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF for Markup & Annotations</h4>
            <p className="text-xs text-slate-400 mt-1">Highlighters, freehand pen stylus, callout boxes, and markup.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF Document</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && loadFile(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Annotation Toolbar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-fira">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setToolMode('highlighter')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                  toolMode === 'highlighter' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400'
                }`}
              >
                <Highlighter className="w-3.5 h-3.5" /> Highlighter
              </button>
              <button
                type="button"
                onClick={() => setToolMode('pen')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                  toolMode === 'pen' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" /> Pen Stylus
              </button>
            </div>

            <div className="flex items-center gap-2">
              {['#facc15', '#06b6d4', '#ec4899', '#10b981'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setStrokeColor(c)}
                  style={{ backgroundColor: c }}
                  className="w-5 h-5 rounded-full cursor-pointer hover:scale-110"
                />
              ))}
            </div>
          </div>

          {/* Canvas Markup Area */}
          <div className="p-2 rounded-2xl bg-black/60 border border-white/10 flex justify-center max-h-[420px] overflow-y-auto">
            <canvas
              ref={canvasRef}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              className="cursor-crosshair shadow-2xl rounded"
            />
          </div>

        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Figma-grade vector stroke renderer</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleSaveAnnotated}
            disabled={!file || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold font-fira text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Baking Strokes...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Markup Saved!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Save Annotated PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};