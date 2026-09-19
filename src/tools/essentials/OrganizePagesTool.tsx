import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  ArrowLeft, 
  ArrowRight, 
  Trash2, 
  Copy, 
  RotateCw,
  Shuffle,
  Layers
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface OrganizePagesToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

interface PageItem {
  id: string;             // Unique ID for react keys
  sourceIndex: number;    // 0-based source page in original PDF
  displayNumber: number;  // Original 1-based page number
  rotation: number;       // Cumulative rotation angle
}

export const OrganizePagesTool: React.FC<OrganizePagesToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      loadPdfFile(preloadedFile);
    }
  }, [preloadedFile]);

  const loadPdfFile = async (selectedFile: File) => {
    try {
      setIsLoading(true);
      setFile(selectedFile);
      sfx.playScan();

      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();

      const initialPages: PageItem[] = [];
      for (let i = 0; i < count; i++) {
        const existingRot = pdfDoc.getPage(i).getRotation().angle;
        initialPages.push({
          id: `page-${i}-${Date.now()}`,
          sourceIndex: i,
          displayNumber: i + 1,
          rotation: (existingRot % 360 + 360) % 360,
        });
      }
      setPages(initialPages);
      sfx.playSuccess();
    } catch (err) {
      sfx.playError();
      console.error('Failed to load PDF for organizing:', err);
      alert('Could not parse PDF. Please ensure it is a valid document.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadPdfFile(e.target.files[0]);
    }
  };

  // Reordering & Page Manipulation
  const movePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    sfx.playHover();
    setPages((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      return updated;
    });
  };

  const duplicatePage = (index: number) => {
    sfx.playSuccess();
    setPages((prev) => {
      const updated = [...prev];
      const itemToDuplicate = updated[index];
      const clone: PageItem = {
        ...itemToDuplicate,
        id: `page-copy-${Date.now()}-${Math.random()}`,
      };
      updated.splice(index + 1, 0, clone);
      return updated;
    });
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      alert('Document must contain at least one page.');
      return;
    }
    sfx.playClick();
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const rotatePage = (index: number) => {
    sfx.playClick();
    setPages((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        rotation: (updated[index].rotation + 90) % 360,
      };
      return updated;
    });
  };

  const reverseAllPages = () => {
    sfx.playHover();
    setPages((prev) => [...prev].reverse());
  };

  const resetOrder = async () => {
    if (file) {
      await loadPdfFile(file);
    }
  };

  const handleExecuteOrganize = async () => {
    if (!file || pages.length === 0) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const buffer = await fileToUint8Array(file);
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      // Copy and place pages according to the user-defined order
      for (const pageItem of pages) {
        const [copiedPage] = await newDoc.copyPages(srcDoc, [pageItem.sourceIndex]);
        copiedPage.setRotation(degrees(pageItem.rotation));
        newDoc.addPage(copiedPage);
      }

      const savedBytes = await newDoc.save();
      downloadUint8Array(savedBytes, `organized_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Error organizing PDF:', err);
      alert('Failed to construct organized PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400">
            <LayoutGrid className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF to Organize</h4>
            <p className="text-xs text-slate-400 mt-1">Reorder, delete, duplicate, and rotate individual pages visually.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF File</span>
            <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Metadata & Quick Tools Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-[10px] text-slate-400 font-fira">
                  {pages.length} Pages • Output order ready
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={reverseAllPages}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-fira text-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Invert page order"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Reverse Order</span>
              </button>
              <button
                onClick={resetOrder}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-fira text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Reset to original order"
              >
                <span>Reset</span>
              </button>
              <label className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-fira text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer">
                <span>Replace</span>
                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* Page Grid */}
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <p className="text-xs font-fira text-slate-400">Loading pages...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-72 overflow-y-auto p-1">
              {pages.map((item, idx) => (
                <div
                  key={item.id}
                  className="relative p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:border-cyan-500/40 transition-all flex flex-col items-center justify-between group"
                >
                  {/* Sequence Position & Original Reference */}
                  <div className="w-full flex items-center justify-between mb-1 text-[10px] font-fira">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                      #{idx + 1}
                    </span>
                    <span className="text-slate-500">
                      Orig Pg {item.displayNumber}
                    </span>
                  </div>

                  {/* Thumbnail Card with Dynamic Rotation */}
                  <div className="w-16 h-22 my-2 flex items-center justify-center relative">
                    <div
                      style={{ transform: `rotate(${item.rotation}deg)` }}
                      className="w-14 h-20 rounded-md bg-white/[0.08] border border-white/20 shadow-inner flex flex-col items-center justify-center text-center p-1 transition-transform duration-300"
                    >
                      <Layers className="w-4 h-4 text-cyan-400/60 mb-1" />
                      <div className="w-8 h-1 bg-white/20 rounded-full mb-1" />
                      <div className="w-6 h-1 bg-white/10 rounded-full" />
                    </div>
                  </div>

                  {/* Per-Page Actions Toolbar */}
                  <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-slate-400">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => movePage(idx, idx - 1)}
                        disabled={idx === 0}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 hover:text-white disabled:opacity-20 transition-all"
                        title="Move Left"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => movePage(idx, idx + 1)}
                        disabled={idx === pages.length - 1}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 hover:text-white disabled:opacity-20 transition-all"
                        title="Move Right"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => rotatePage(idx)}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 hover:text-cyan-300 transition-all"
                        title="Rotate Page +90°"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => duplicatePage(idx)}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 hover:text-emerald-300 transition-all"
                        title="Duplicate Page"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deletePage(idx)}
                        className="p-1 rounded bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3 h-3" />
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
          <span>{pages.length} total pages in output sequence</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-fira transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteOrganize}
            disabled={!file || pages.length === 0 || isProcessing}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Document...</span>
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Organized & Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Save & Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};