import React, { useState, useEffect } from 'react';
import { 
  Columns2, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  Scissors, 
  BookOpen 
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

export const SplitInHalfTool: React.FC<{ preloadedFile?: File | null; onClose: () => void }> = ({ 
  preloadedFile, 
  onClose 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [splitDirection, setSplitDirection] = useState<'vertical' | 'horizontal'>('vertical');
  const [pageOrder, setPageOrder] = useState<'left-to-right' | 'right-to-left'>('left-to-right');

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
      const buffer = await f.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
      sfx.playSuccess();
    } catch (err) {
      sfx.playError();
      alert('Could not open PDF.');
    }
  };

  const handleExecuteSplit = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const buffer = await fileToUint8Array(file);
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const outDoc = await PDFDocument.create();

      const totalPages = srcDoc.getPageCount();

      for (let i = 0; i < totalPages; i++) {
        const srcPage = srcDoc.getPage(i);
        const { width, height } = srcPage.getSize();

        if (splitDirection === 'vertical') {
          const halfWidth = width / 2;

          // Embed page twice
          const [leftEmbed] = await outDoc.embedPdf(srcDoc, [i]);
          const [rightEmbed] = await outDoc.embedPdf(srcDoc, [i]);

          const p1 = outDoc.addPage([halfWidth, height]);
          const p2 = outDoc.addPage([halfWidth, height]);

          if (pageOrder === 'left-to-right') {
            p1.drawPage(leftEmbed, { x: 0, y: 0 });
            p2.drawPage(rightEmbed, { x: -halfWidth, y: 0 });
          } else {
            p1.drawPage(rightEmbed, { x: -halfWidth, y: 0 });
            p2.drawPage(leftEmbed, { x: 0, y: 0 });
          }
        } else {
          const halfHeight = height / 2;

          const [topEmbed] = await outDoc.embedPdf(srcDoc, [i]);
          const [bottomEmbed] = await outDoc.embedPdf(srcDoc, [i]);

          const p1 = outDoc.addPage([width, halfHeight]);
          const p2 = outDoc.addPage([width, halfHeight]);

          p1.drawPage(topEmbed, { x: 0, y: -halfHeight });
          p2.drawPage(bottomEmbed, { x: 0, y: 0 });
        }
      }

      const outputBytes = await outDoc.save();
      downloadUint8Array(outputBytes, `halved_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Split in half error:', err);
      alert('Failed to split spreads in half.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400">
            <Columns2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a Two-Page Scanned PDF Spread</h4>
            <p className="text-xs text-slate-400 mt-1">Slices 2-page scanned book spreads into clean, single portrait pages.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select Spread Document</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && loadFile(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-5">
          {/* File Metadata */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-[10px] text-slate-400 font-fira">{pageCount} Two-Page Spreads ({pageCount * 2} Target Single Pages)</p>
              </div>
            </div>
          </div>

          {/* Split Mode Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-fira">
            
            {/* Cut Axis */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <span className="text-slate-400 block font-bold">Cut Orientation:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSplitDirection('vertical')}
                  className={`py-2 px-3 rounded-lg font-bold cursor-pointer transition-all ${
                    splitDirection === 'vertical'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  Vertical (Book Spreads)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitDirection('horizontal')}
                  className={`py-2 px-3 rounded-lg font-bold cursor-pointer transition-all ${
                    splitDirection === 'horizontal'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  Horizontal (Top / Bottom)
                </button>
              </div>
            </div>

            {/* Reading Sequence */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <span className="text-slate-400 block font-bold">Reading Order:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPageOrder('left-to-right')}
                  className={`py-2 px-3 rounded-lg font-bold cursor-pointer transition-all ${
                    pageOrder === 'left-to-right'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  Left ➔ Right (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setPageOrder('right-to-left')}
                  className={`py-2 px-3 rounded-lg font-bold cursor-pointer transition-all ${
                    pageOrder === 'right-to-left'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  Right ➔ Left (Manga)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Lossless vector clipping box calculation</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleExecuteSplit}
            disabled={!file || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Slicing Spreads...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" /> Sliced & Saved!
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4" /> Split Spreads & Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};