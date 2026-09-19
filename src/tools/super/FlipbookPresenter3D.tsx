import React, { useState, useEffect } from 'react';
import { 
  Box, 
  UploadCloud, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  FileText, 
  Layers, 
  Loader2 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface FlipbookPresenter3DProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const FlipbookPresenter3D: React.FC<FlipbookPresenter3DProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0); // 0-based index
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      loadPdfAndRenderPages(preloadedFile);
    }
  }, [preloadedFile]);

  const loadPdfAndRenderPages = async (f: File) => {
    try {
      setFile(f);
      setIsLoading(true);
      sfx.playScan();

      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      const rendered: string[] = [];

      for (let i = 1; i <= Math.min(totalPages, 20); i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
          rendered.push(canvas.toDataURL('image/jpeg', 0.9));
        }
      }

      setPageImages(rendered);
      setCurrentPage(0);
      sfx.playSuccess();
    } catch (err) {
      sfx.playError();
      console.error('Error rendering 3D flipbook:', err);
      alert('Could not render document for 3D flipbook.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextPage = () => {
    if (currentPage < pageImages.length - 1) {
      sfx.playHover();
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      sfx.playHover();
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className={`space-y-4 text-left ${isFullscreen ? 'fixed inset-0 z-50 bg-[#080A10] p-6 flex flex-col justify-between' : ''}`}>
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400">
            <Box className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF for 3D Flipbook</h4>
            <p className="text-xs text-slate-400 mt-1">Interactive 3D presentation book with realistic page physics and lighting.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold font-fira text-xs cursor-pointer shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF File</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && loadPdfAndRenderPages(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Header Controls */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-[10px] text-slate-400 font-fira">
                  Page {currentPage + 1} of {pageImages.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 3D Holographic Stage */}
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              <p className="text-xs font-fira text-slate-400">Rendering high-fidelity 3D textures...</p>
            </div>
          ) : (
            <div className="relative h-[380px] sm:h-[420px] rounded-2xl bg-gradient-to-b from-[#0e1424] to-[#070a12] border border-white/10 flex items-center justify-center overflow-hidden [perspective:1200px]">
              
              {/* Holographic Backing Glow */}
              <div className="absolute inset-0 bg-radial-gradient from-purple-500/10 to-transparent pointer-events-none" />

              {/* Navigation Left */}
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className="absolute left-4 z-20 p-3 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/80 disabled:opacity-20 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* 3D Page Book Representation */}
              {pageImages.length > 0 && (
                <div className="relative w-[280px] sm:w-[340px] h-[340px] sm:h-[380px] shadow-2xl transition-transform duration-500 [transform-style:preserve-3d] hover:[transform:rotateY(-5deg)_rotateX(5deg)]">
                  
                  {/* Underlay Page Spine Depth */}
                  <div className="absolute -left-2 top-2 w-full h-full bg-slate-800 rounded-r-lg opacity-40 shadow-xl" />

                  {/* Active 3D Page Sheet */}
                  <div className="w-full h-full rounded-r-lg overflow-hidden bg-white shadow-2xl border-l-4 border-slate-700 flex items-center justify-center relative">
                    <img
                      src={pageImages[currentPage]}
                      alt={`Page ${currentPage + 1}`}
                      className="w-full h-full object-contain"
                    />

                    {/* Page Corner Fold Effect */}
                    <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/40 via-white/10 to-transparent pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Navigation Right */}
              <button
                onClick={nextPage}
                disabled={currentPage === pageImages.length - 1}
                className="absolute right-4 z-20 p-3 rounded-full bg-black/60 border border-white/10 text-white hover:bg-black/80 disabled:opacity-20 transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Progress Slider */}
          <div className="flex items-center gap-3 px-2">
            <span className="text-[10px] font-fira text-slate-500">1</span>
            <input
              type="range"
              min={0}
              max={Math.max(0, pageImages.length - 1)}
              value={currentPage}
              onChange={(e) => {
                sfx.playHover();
                setCurrentPage(parseInt(e.target.value));
              }}
              className="flex-1 accent-purple-400 cursor-pointer"
            />
            <span className="text-[10px] font-fira text-slate-500">{pageImages.length}</span>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-fira text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>GPU-accelerated CSS 3D Perspective</span>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          Close Flipbook
        </button>
      </div>
    </div>
  );
};