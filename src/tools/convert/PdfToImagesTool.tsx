import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  Layers,
  Archive
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

// Configure PDF.js worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface PdfToImagesToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const PdfToImagesTool: React.FC<PdfToImagesToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [dpi, setDpi] = useState<number>(300); // 150, 300, 600
  const [format, setFormat] = useState<'jpg' | 'png'>('png');
  const [renderedProgress, setRenderedProgress] = useState<{ current: number; total: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

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
      console.error('Error loading PDF:', err);
      alert('Could not parse PDF. Please provide a valid document.');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadFile(e.target.files[0]);
    }
  };

  const handleExportImages = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      // Scale factor mapping (72 DPI baseline: 150 DPI = 2.08x, 300 DPI = 4.16x, 600 DPI = 8.33x)
      const scale = dpi === 600 ? 8.33 : dpi === 300 ? 4.16 : 2.08;

      const zip = new JSZip();

      for (let i = 1; i <= totalPages; i++) {
        setRenderedProgress({ current: i, total: totalPages });
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) continue;

        // Render white background for JPG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport }).promise;

        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.95);
        const base64Data = dataUrl.split(',')[1];

        const filename = `page_${String(i).padStart(3, '0')}.${format}`;
        zip.file(filename, base64Data, { base64: true });
      }

      // Generate zip and download
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${file.name.replace(/\.[^/.]+$/, '')}_${dpi}dpi_images.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('PDF to Image export error:', err);
      alert('Failed to render PDF pages to images.');
    } finally {
      setIsProcessing(false);
      setRenderedProgress(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF to Convert to Images</h4>
            <p className="text-xs text-slate-400 mt-1">Export pages at up to 600 DPI ultra-high archival resolution.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF File</span>
            <input type="file" accept=".pdf" onChange={handleFileInput} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="space-y-5">
          {/* File Metadata */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
              <p className="text-[10px] text-slate-400 font-fira">
                {pageCount} Total Pages • {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>

          {/* Export Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            
            {/* Resolution Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-fira text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" /> Export Resolution
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 150, label: '150 DPI (Web)' },
                  { val: 300, label: '300 DPI (HD)' },
                  { val: 600, label: '600 DPI (Archival)' },
                ].map((d) => (
                  <button
                    key={d.val}
                    type="button"
                    onClick={() => {
                      sfx.playHover();
                      setDpi(d.val);
                    }}
                    className={`py-2 px-1 rounded-lg text-xs font-fira transition-all cursor-pointer ${
                      dpi === d.val
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                        : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Format */}
            <div className="space-y-1.5">
              <label className="text-xs font-fira text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" /> Image Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'png', label: 'PNG (Lossless Vector Crispness)' },
                  { id: 'jpg', label: 'JPG (Compressed Photo Quality)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      sfx.playHover();
                      setFormat(f.id as any);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-fira transition-all cursor-pointer ${
                      format === f.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Render Progress Bar */}
          {renderedProgress && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex justify-between text-xs font-fira text-amber-300">
                <span>Rasterizing Page {renderedProgress.current} of {renderedProgress.total}...</span>
                <span>{Math.round((renderedProgress.current / renderedProgress.total) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  style={{ width: `${(renderedProgress.current / renderedProgress.total) * 100}%` }}
                  className="h-full bg-amber-400 transition-all duration-200"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Archive className="w-4 h-4 text-amber-400" />
          <span>Multi-threaded client-side rasterization • Downloads as ZIP</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-fira transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleExportImages}
            disabled={!file || isProcessing}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-bold font-fira text-xs shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting Images...</span>
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>ZIP Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export & Download Images</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};