import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  UploadCloud, 
  Download, 
  Sparkles, 
  Loader2, 
  CheckCircle2,
  Image,
  Sliders
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface PdfToZipToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const PdfToZipTool: React.FC<PdfToZipToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [dpi, setDpi] = useState<number>(300); // 150, 300, 600
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);

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
    setZipBlob(null);
    sfx.playClick();

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      setTotalPages(pdf.numPages);
    } catch (err) {
      console.error('Failed to get page count:', err);
    }
  };

  const processPdfToZip = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(5);
      setStatusMessage('Initializing multi-threaded rasterizer...');
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      const zip = new JSZip();
      const scale = dpi / 72; // Standard PDF is 72 DPI

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setStatusMessage(`Rasterizing page ${pageNum} of ${numPages} at ${dpi} DPI...`);
        setProgress(Math.round(5 + (pageNum / numPages) * 75));

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) continue;

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Get blob
        const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
        const imgBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.95));

        if (imgBlob) {
          const paddedNum = String(pageNum).padStart(3, '0');
          const ext = format === 'jpeg' ? 'jpg' : format;
          zip.file(`page_${paddedNum}.${ext}`, imgBlob);
        }
      }

      setStatusMessage('Compressing images into ZIP container...');
      setProgress(90);

      const generatedZip = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      setZipBlob(generatedZip);
      setProgress(100);
      setStatusMessage('ZIP Archive Ready!');
      sfx.playSuccess();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error('ZIP generation error:', err);
      alert('Failed to bundle pages into ZIP archive.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!zipBlob || !file) return;
    sfx.playClick();
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '-images.zip');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-amber-500/30 hover:border-amber-400/60 rounded-3xl bg-amber-950/10 cursor-pointer transition-all hover:bg-amber-950/20 group">
          <Archive className="w-14 h-14 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF to Package as High-Res Images ZIP</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Renders every page up to 600 DPI and bundles the entire collection into a single downloadable ZIP.
          </p>
          <span className="mt-4 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 font-fira text-xs font-semibold border border-amber-500/40">
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300">
                <Archive className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm text-white truncate">{file.name}</h4>
                <p className="text-xs text-slate-400 font-fira">{totalPages} Pages detected</p>
              </div>
            </div>

            {/* Format Selection */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-fira">
              <span className="text-slate-400">Format:</span>
              <div className="flex gap-1">
                {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`px-2.5 py-1 rounded uppercase font-bold text-[11px] cursor-pointer ${
                      format === fmt ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {fmt === 'jpeg' ? 'JPG' : fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* DPI Resolution */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-fira">
              <span className="text-slate-400">DPI:</span>
              <div className="flex gap-1">
                {[150, 300, 600].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDpi(d)}
                    className={`px-2.5 py-1 rounded font-bold text-[11px] cursor-pointer ${
                      dpi === d ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d} DPI
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-fira">
                <span className="text-amber-300 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  {statusMessage}
                </span>
                <span className="text-amber-400 font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setFile(null);
                setZipBlob(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white font-fira text-xs"
            >
              Change File
            </button>

            {!zipBlob ? (
              <button
                onClick={processPdfToZip}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-bold font-fira text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Package All Pages to ZIP
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Images (.zip)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
