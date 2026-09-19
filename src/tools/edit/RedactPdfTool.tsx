import React, { useState, useEffect, useRef } from 'react';
import { 
  EyeOff, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  RotateCcw 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb } from 'pdf-lib';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface RedactBox {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const RedactPdfTool: React.FC<{ preloadedFile?: File | null; onClose: () => void }> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [redactBoxes, setRedactBoxes] = useState<RedactBox[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

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
      setPageCount(pdf.numPages);
      renderPage(pdf, 1);
      sfx.playSuccess();
    } catch (err) {
      sfx.playError();
      console.error(err);
      alert('Could not open PDF for redaction.');
    }
  };

  const renderPage = async (pdfDoc: any, pageNum: number) => {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.2 });
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      await page.render({ canvasContext: ctx, viewport }).promise;
    }
  };

  const startBox = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setIsDrawing(true);
  };

  const drawBox = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(startPos.x, startPos.y, currentX - startPos.x, currentY - startPos.y);
  };

  const endBox = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const box: RedactBox = {
      pageIndex: currentPage,
      x: Math.min(startPos.x, endX),
      y: Math.min(startPos.y, endY),
      width: Math.abs(endX - startPos.x),
      height: Math.abs(endY - startPos.y),
    };

    if (box.width > 5 && box.height > 5) {
      sfx.playClick();
      setRedactBoxes((prev) => [...prev, box]);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(box.x, box.y, box.width, box.height);
      }
    }

    setIsDrawing(false);
    setStartPos(null);
  };

  const clearRedactions = () => {
    sfx.playClick();
    setRedactBoxes([]);
    if (file) loadFile(file);
  };

  const handleApplyPermanentRedaction = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const buffer = await fileToUint8Array(file);
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      for (const box of redactBoxes) {
        const page = doc.getPage(box.pageIndex);
        const { height } = page.getSize();
        
        // Permanent vector blackout patch
        page.drawRectangle({
          x: box.x,
          y: height - box.y - box.height, // PDF coordinates are bottom-up
          width: box.width,
          height: box.height,
          color: rgb(0, 0, 0),
        });
      }

      const outputBytes = await doc.save();
      downloadUint8Array(outputBytes, `redacted_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Redaction failed:', err);
      alert('Failed to redact document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400">
            <EyeOff className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF for Permanent Vector Redaction</h4>
            <p className="text-xs text-slate-400 mt-1">Draw black-out censor boxes over confidential text and graphics.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold font-fira text-xs cursor-pointer shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF File</span>
            <input type="file" accept=".pdf" onChange={(e) => e.target.files && loadFile(e.target.files[0])} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-[10px] text-slate-400 font-fira">{redactBoxes.length} Redaction Boxes Drawn</p>
              </div>
            </div>

            <button
              onClick={clearRedactions}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-fira text-slate-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear Boxes
            </button>
          </div>

          <div className="p-2 rounded-xl bg-black/50 border border-white/10 flex justify-center max-h-[380px] overflow-y-auto">
            <canvas
              ref={canvasRef}
              onMouseDown={startBox}
              onMouseMove={drawBox}
              onMouseUp={endBox}
              className="cursor-crosshair shadow-2xl rounded"
            />
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span>Permanently burns blackout rectangles into the PDF stream</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleApplyPermanentRedaction}
            disabled={!file || redactBoxes.length === 0 || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold font-fira text-xs shadow-lg shadow-rose-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Burning Redactions...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Redacted & Saved!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Burn Redactions & Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};