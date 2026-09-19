import React, { useState, useEffect } from 'react';
import { 
  ScanText, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  Copy, 
  Check, 
  Languages, 
  Layers 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface OcrPdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const OcrPdfTool: React.FC<OcrPdfToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [language, setLanguage] = useState<'eng' | 'spa' | 'fra' | 'deu' | 'hin'>('eng');
  const [extractedText, setExtractedText] = useState<string>('');
  const [progress, setProgress] = useState<{ status: string; progress: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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
      sfx.playSuccess();
    } catch (err) {
      sfx.playError();
      console.error('Error loading PDF for OCR:', err);
      alert('Could not read PDF file.');
    }
  };

  const handleExecuteOcr = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();
      setProgress({ status: 'Initializing Tesseract WASM Engine...', progress: 5 });

      const worker = await createWorker(language);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      let combinedOcrText = '';

      for (let i = 1; i <= Math.min(totalPages, 10); i++) {
        setProgress({
          status: `Rendering & OCR Processing Page ${i} of ${totalPages}...`,
          progress: Math.round((i / totalPages) * 90),
        });

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for higher OCR character clarity

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport }).promise;

          const dataUrl = canvas.toDataURL('image/png');
          const ret = await worker.recognize(dataUrl);
          combinedOcrText += `\n--- [PAGE ${i}] ---\n\n` + ret.data.text.trim() + '\n';
        }
      }

      await worker.terminate();

      setExtractedText(combinedOcrText.trim());
      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('OCR failed:', err);
      alert('OCR recognition failed. Please try a clearer scan.');
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const handleDownloadTxt = () => {
    sfx.playSuccess();
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr_extracted_${file?.name || 'document'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSearchablePdf = async () => {
    try {
      sfx.playScan();
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      
      const pages = extractedText.split(/--- \[PAGE \d+\] ---/).filter(Boolean);

      for (const pageText of pages) {
        const page = doc.addPage([595, 842]);
        const lines = pageText.split('\n').filter(Boolean);
        let y = 800;

        for (const line of lines) {
          if (y < 50) break;
          page.drawText(line.slice(0, 80), { x: 50, y, size: 10, font });
          y -= 14;
        }
      }

      const bytes = await doc.save();
      downloadUint8Array(bytes, `searchable_${file?.name || 'document.pdf'}`);
      sfx.playSuccess();
    } catch (err) {
      console.error(err);
      alert('Could not compile PDF.');
    }
  };

  const handleCopy = () => {
    sfx.playClick();
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400">
            <ScanText className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a Scanned PDF for On-Device OCR</h4>
            <p className="text-xs text-slate-400 mt-1">Runs 100% locally via Tesseract WebAssembly without server uploads.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select Scanned Document</span>
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
          
          {/* Metadata & Language Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-[10px] text-slate-400 font-fira">
                  {pageCount} Total Pages • Scanned Raster Layer
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-cyan-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs font-fira text-white focus:outline-none cursor-pointer"
              >
                <option value="eng">English (Latin)</option>
                <option value="spa">Spanish (Español)</option>
                <option value="fra">French (Français)</option>
                <option value="deu">German (Deutsch)</option>
                <option value="hin">Hindi (हिन्दी)</option>
              </select>
            </div>
          </div>

          {/* Progress Bar */}
          {progress && (
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-2">
              <div className="flex justify-between text-xs font-fira text-cyan-300">
                <span>{progress.status}</span>
                <span>{progress.progress}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  style={{ width: `${progress.progress}%` }}
                  className="h-full bg-cyan-400 transition-all duration-300"
                />
              </div>
            </div>
          )}

          {/* OCR Result Box */}
          {extractedText && (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-fira text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> OCR Text Extracted Successfully
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-xs font-fira text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-xs font-fira text-cyan-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Export .TXT
                  </button>
                  <button
                    onClick={handleDownloadSearchablePdf}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-xs font-fira text-cyan-300 transition-colors cursor-pointer"
                  >
                    Export Searchable PDF
                  </button>
                </div>
              </div>

              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                rows={10}
                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}

        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>WASM neural OCR • Zero cloud transfer</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          {!extractedText && (
            <button
              onClick={handleExecuteOcr}
              disabled={!file || isProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Running Tesseract WASM...
                </>
              ) : (
                <>
                  <ScanText className="w-4 h-4" /> Start On-Device OCR
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};