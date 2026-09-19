import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, Loader2, Download, Scissors } from 'lucide-react';
import { workerBridge } from '@/core/workers/workerBridge';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

interface SplitPdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const SplitPdfTool: React.FC<SplitPdfToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(preloadedFile || null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rangeInput, setRangeInput] = useState<string>('');
  const [splitMode, setSplitMode] = useState<'range' | 'all'>('range');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (file) {
      // Inspect page count in-memory
      fileToUint8Array(file).then(async (bytes) => {
        try {
          const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
          const count = doc.getPageCount();
          setPageCount(count);
          setRangeInput(`1-${Math.min(count, 3)}`);
        } catch {
          setPageCount(0);
        }
      });
    }
  }, [file]);

  const parseRanges = (input: string, maxPages: number): number[][] => {
    const parts = input.split(',').map((p) => p.trim()).filter(Boolean);
    const ranges: number[][] = [];

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          const pageList: number[] = [];
          for (let p = Math.max(1, start); p <= Math.min(maxPages, end); p++) {
            pageList.push(p);
          }
          if (pageList.length > 0) ranges.push(pageList);
        }
      } else {
        const single = parseInt(part, 10);
        if (!isNaN(single) && single >= 1 && single <= maxPages) {
          ranges.push([single]);
        }
      }
    }

    return ranges;
  };

  const handleExecuteSplit = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const bytes = await fileToUint8Array(file);
      let targetRanges: number[][] = [];

      if (splitMode === 'all') {
        // Extract every single page into individual documents
        for (let i = 1; i <= pageCount; i++) {
          targetRanges.push([i]);
        }
      } else {
        targetRanges = parseRanges(rangeInput, pageCount);
      }

      if (targetRanges.length === 0) {
        alert('Please enter valid page ranges (e.g. 1-3, 5, 8-10).');
        setIsProcessing(false);
        return;
      }

      const worker = workerBridge.getWorker();
      const outputBuffers = await worker.splitPdf(bytes, targetRanges);

      if (outputBuffers.length === 1) {
        downloadUint8Array(outputBuffers[0], `split_part_1.pdf`);
      } else {
        // Bundle multiple split PDFs into a clean ZIP file
        const zip = new JSZip();
        outputBuffers.forEach((buf, idx) => {
          zip.file(`split_document_part_${idx + 1}.pdf`, buf);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = zipUrl;
        a.download = `split_documents_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70 });
    } catch (err) {
      sfx.playError();
      console.error(err);
      alert('Failed to split document. Please check page numbers.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white/[0.03] border-2 border-dashed border-white/10 text-center space-y-3">
          <UploadCloud className="w-10 h-10 text-cyan-400" />
          <h4 className="font-semibold text-white">Select PDF to Split</h4>
          <label className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-cyan-500/20 transition-all">
            Browse Document
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Info Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{file.name}</p>
                <p className="text-xs text-slate-400 font-fira">
                  {pageCount > 0 ? `${pageCount} Total Pages` : 'Reading pages...'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-xs font-fira text-slate-400 hover:text-white"
            >
              Change File
            </button>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                sfx.playClick();
                setSplitMode('range');
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                splitMode === 'range'
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.04]'
              }`}
            >
              <h5 className="font-semibold text-sm text-white">Custom Ranges</h5>
              <p className="text-xs text-slate-400 mt-1">Extract specific intervals (e.g. 1-3, 5, 8-10)</p>
            </button>
            <button
              onClick={() => {
                sfx.playClick();
                setSplitMode('all');
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                splitMode === 'all'
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.04]'
              }`}
            >
              <h5 className="font-semibold text-sm text-white">Extract All Pages</h5>
              <p className="text-xs text-slate-400 mt-1">Save every page as a separate PDF in a ZIP</p>
            </button>
          </div>

          {/* Range Input Box */}
          {splitMode === 'range' && (
            <div className="space-y-2">
              <label className="text-xs font-fira text-slate-300">Page Range Intervals:</label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="e.g. 1-2, 4, 6-8"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white font-fira text-sm focus:outline-none focus:border-cyan-400"
              />
              <p className="text-[11px] font-fira text-slate-500">
                Tip: Enter &apos;1-3&apos; to extract pages 1 through 3 as a document, or &apos;1, 3, 5&apos; for individual pages.
              </p>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-fira"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteSplit}
              disabled={isProcessing || pageCount === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-40 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Splitting in Worker...</span>
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4" />
                  <span>Split & Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};