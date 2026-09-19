import React, { useState, useEffect } from 'react';
import { 
  RotateCw, 
  RotateCcw, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  RefreshCw,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface RotatePdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

interface PageState {
  pageNumber: number; // 1-based original index
  rotation: number;   // Cumulative rotation (0, 90, 180, 270)
  selected: boolean;
}

export const RotatePdfTool: React.FC<RotatePdfToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageState[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      loadPdfFile(preloadedFile);
    }
  }, [preloadedFile]);

  const loadPdfFile = async (selectedFile: File) => {
    try {
      setIsLoadingPages(true);
      setFile(selectedFile);
      sfx.playScan();

      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();

      const initialPages: PageState[] = [];
      for (let i = 0; i < count; i++) {
        const existingRot = pdfDoc.getPage(i).getRotation().angle;
        initialPages.push({
          pageNumber: i + 1,
          rotation: (existingRot % 360 + 360) % 360,
          selected: true,
        });
      }
      setPages(initialPages);
      sfx.playSuccess();
    } catch (err) {
      sfx.playError();
      console.error('Error loading PDF for rotation:', err);
      alert('Could not parse PDF. Please ensure it is an uncorrupted document.');
    } finally {
      setIsLoadingPages(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadPdfFile(e.target.files[0]);
    }
  };

  // Batch rotation operations
  const rotateAll = (delta: number) => {
    sfx.playHover();
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + delta + 360) % 360,
      }))
    );
  };

  const rotateSelected = (delta: number) => {
    sfx.playHover();
    setPages((prev) =>
      prev.map((p) =>
        p.selected ? { ...p, rotation: (p.rotation + delta + 360) % 360 } : p
      )
    );
  };

  const rotateSinglePage = (pageNumber: number, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.playClick();
    setPages((prev) =>
      prev.map((p) =>
        p.pageNumber === pageNumber
          ? { ...p, rotation: (p.rotation + delta + 360) % 360 }
          : p
      )
    );
  };

  const togglePageSelection = (pageNumber: number) => {
    sfx.playClick();
    setPages((prev) =>
      prev.map((p) =>
        p.pageNumber === pageNumber ? { ...p, selected: !p.selected } : p
      )
    );
  };

  const selectAll = (select: boolean) => {
    sfx.playClick();
    setPages((prev) => prev.map((p) => ({ ...p, selected: select })));
  };

  const selectOddPages = () => {
    sfx.playClick();
    setPages((prev) =>
      prev.map((p) => ({ ...p, selected: p.pageNumber % 2 !== 0 }))
    );
  };

  const selectEvenPages = () => {
    sfx.playClick();
    setPages((prev) =>
      prev.map((p) => ({ ...p, selected: p.pageNumber % 2 === 0 }))
    );
  };

  const handleExecuteRotation = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const buffer = await fileToUint8Array(file);
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      // Apply the per-page target rotations directly onto the PDF tree
      for (const pageState of pages) {
        const page = pdfDoc.getPage(pageState.pageNumber - 1);
        page.setRotation({ type: 'degrees', angle: pageState.rotation } as any);
      }

      const savedBytes = await pdfDoc.save();
      downloadUint8Array(savedBytes, `rotated_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Rotation failed:', err);
      alert('Failed to rotate PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* File Loader Header */}
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400">
            <RotateCw className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF to Rotate</h4>
            <p className="text-xs text-slate-400 mt-1">Rotate all pages, individual pages, or odd/even sets with zero quality loss.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF File</span>
            <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="space-y-5">
          {/* File Metadata & Quick Batch Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-[10px] text-slate-400 font-fira">
                  {pages.length} Pages • {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            {/* Quick Batch Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => rotateAll(90)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-fira text-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Rotate all pages 90° Clockwise"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>All +90°</span>
              </button>
              <button
                onClick={() => rotateAll(-90)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-fira text-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Rotate all pages 90° Counter-Clockwise"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>All -90°</span>
              </button>
              <button
                onClick={() => rotateAll(180)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-fira text-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Flip all pages 180°"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Flip 180°</span>
              </button>
              <label className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-fira text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer">
                <span>Replace</span>
                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* Selection Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-fira text-slate-400 bg-white/[0.02] p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Selection:</span>
              <button
                onClick={() => selectAll(true)}
                className="hover:text-cyan-300 transition-colors cursor-pointer underline"
              >
                All
              </button>
              <span>•</span>
              <button
                onClick={() => selectAll(false)}
                className="hover:text-cyan-300 transition-colors cursor-pointer underline"
              >
                None
              </button>
              <span>•</span>
              <button
                onClick={selectOddPages}
                className="hover:text-cyan-300 transition-colors cursor-pointer underline"
              >
                Odd Pages
              </button>
              <span>•</span>
              <button
                onClick={selectEvenPages}
                className="hover:text-cyan-300 transition-colors cursor-pointer underline"
              >
                Even Pages
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => rotateSelected(90)}
                className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-[11px] transition-all cursor-pointer"
              >
                Rotate Selected +90°
              </button>
            </div>
          </div>

          {/* Interactive Visual Pages Grid */}
          {isLoadingPages ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <p className="text-xs font-fira text-slate-400">Loading document pages...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-72 overflow-y-auto p-1">
              {pages.map((p) => (
                <div
                  key={p.pageNumber}
                  onClick={() => togglePageSelection(p.pageNumber)}
                  className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-between group ${
                    p.selected
                      ? 'bg-cyan-500/[0.08] border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Selection Checkbox & Page Label */}
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-[10px] font-fira font-bold text-slate-300">
                      Pg {p.pageNumber}
                    </span>
                    {p.selected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />
                    )}
                  </div>

                  {/* Real-Time Visual Sheet Preview with CSS Transform */}
                  <div className="w-16 h-22 my-2 flex items-center justify-center relative">
                    <div
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                      className="w-14 h-20 rounded-md bg-white/[0.08] border border-white/20 shadow-inner flex flex-col items-center justify-center text-center p-1 transition-transform duration-300"
                    >
                      <Layers className="w-4 h-4 text-cyan-400/60 mb-1" />
                      <div className="w-8 h-1 bg-white/20 rounded-full mb-1" />
                      <div className="w-6 h-1 bg-white/10 rounded-full" />
                    </div>
                  </div>

                  {/* Rotation Angle & Individual Controls */}
                  <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    <span className="text-[9px] font-fira text-cyan-300/80 font-bold">
                      {p.rotation}°
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => rotateSinglePage(p.pageNumber, -90, e)}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                        title="Rotate -90°"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => rotateSinglePage(p.pageNumber, 90, e)}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                        title="Rotate +90°"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>
            {pages.length > 0
              ? `${pages.filter((p) => p.selected).length} of ${pages.length} pages selected`
              : 'Zero cloud upload • 100% Client-Side'}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-fira transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteRotation}
            disabled={!file || pages.length === 0 || isProcessing}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Applying Rotations...</span>
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Saved & Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Rotate & Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};