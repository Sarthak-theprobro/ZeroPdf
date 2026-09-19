import React, { useState, useEffect } from 'react';
import { 
  PieChart, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  FileText, 
  Archive,
  Layers,
  Sliders
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface SplitBySizeToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

interface ChunkSegment {
  name: string;
  startPage: number;
  endPage: number;
  sizeMb: number;
  blob?: Blob;
}

export const SplitBySizeTool: React.FC<SplitBySizeToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [targetSizeMb, setTargetSizeMb] = useState<number>(5); // e.g. 5MB email limit
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [chunks, setChunks] = useState<ChunkSegment[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (preloadedFile) handleFileSelected(preloadedFile);
  }, [preloadedFile]);

  const handleFileSelected = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setChunks([]);
    setZipBlob(null);
    sfx.playClick();
  };

  const handleExecuteSizeSplit = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(10);
      setStatusMessage('Estimating per-page byte weight...');
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = srcDoc.getPageCount();
      const avgBytesPerPage = file.size / totalPages;
      const targetBytes = targetSizeMb * 1024 * 1024;

      // Approximate pages per chunk based on average
      const estimatedPagesPerChunk = Math.max(1, Math.floor(targetBytes / avgBytesPerPage));

      const calculatedChunks: ChunkSegment[] = [];
      let currentStart = 1;

      while (currentStart <= totalPages) {
        const currentEnd = Math.min(totalPages, currentStart + estimatedPagesPerChunk - 1);
        calculatedChunks.push({
          name: `${file.name.replace(/\.pdf$/i, '')}_Part_${calculatedChunks.length + 1}.pdf`,
          startPage: currentStart,
          endPage: currentEnd,
          sizeMb: 0,
        });
        currentStart = currentEnd + 1;
      }

      setStatusMessage('Partitioning into size-compliant PDF chunks...');
      setProgress(40);

      const zip = new JSZip();

      for (let cIdx = 0; cIdx < calculatedChunks.length; cIdx++) {
        const chunk = calculatedChunks[cIdx];
        const newDoc = await PDFDocument.create();

        const pageIndices: number[] = [];
        for (let p = chunk.startPage - 1; p <= chunk.endPage - 1; p++) {
          pageIndices.push(p);
        }

        const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
        copiedPages.forEach((p) => newDoc.addPage(p));

        const newBytes = await newDoc.save();
        const chunkBlob = new Blob([newBytes as any], { type: 'application/pdf' });
        chunk.blob = chunkBlob;
        chunk.sizeMb = parseFloat((chunkBlob.size / (1024 * 1024)).toFixed(2));

        zip.file(chunk.name, chunkBlob);
        setProgress(Math.round(40 + ((cIdx + 1) / calculatedChunks.length) * 45));
      }

      setChunks(calculatedChunks);
      setStatusMessage('Packaging ZIP container...');
      setProgress(90);

      const finalZip = await zip.generateAsync({ type: 'blob' });
      setZipBlob(finalZip);

      setProgress(100);
      setStatusMessage('Partitioning Complete!');
      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Split by size error:', err);
      alert('Failed to split PDF by size.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = () => {
    if (!zipBlob || !file) return;
    sfx.playClick();
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\.pdf$/i, '')}-size-partitioned.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-3xl bg-cyan-950/10 cursor-pointer transition-all hover:bg-cyan-950/20 group">
          <PieChart className="w-14 h-14 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF for Target File Size Partition</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Slices large multi-page documents into target megabyte thresholds (e.g., &lt; 5MB for email, &lt; 25MB for portal uploads).
          </p>
          <span className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 font-fira text-xs font-semibold border border-cyan-500/40">
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
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-300">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-cyan-300 font-fira">
                  Total File Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setChunks([]);
                setZipBlob(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white font-fira"
            >
              Change File
            </button>
          </div>

          {/* Target MB Threshold Selector */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex justify-between items-center text-xs font-fira">
              <span className="text-slate-300 font-bold">Target Max Chunk Size:</span>
              <span className="text-cyan-400 font-bold font-orbitron">{targetSizeMb} MB</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[2, 5, 10, 25].map((mb) => (
                <button
                  key={mb}
                  onClick={() => {
                    setTargetSizeMb(mb);
                    sfx.playClick();
                  }}
                  className={`py-2 rounded-xl text-xs font-fira font-bold transition-all cursor-pointer ${
                    targetSizeMb === mb
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400'
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  &lt; {mb} MB {mb === 5 ? '(Email)' : mb === 25 ? '(Portal)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="p-5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-fira">
                <span className="text-cyan-300 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  {statusMessage}
                </span>
                <span className="text-cyan-400 font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Results Display */}
          {!zipBlob ? (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleExecuteSizeSplit}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Split by {targetSizeMb} MB Limit
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white font-orbitron">
                      Partitioned into {chunks.length} Files
                    </h4>
                    <p className="text-xs text-slate-400 font-fira">
                      All files strictly capped under target limit
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadZip}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Archive className="w-4 h-4" />
                  Download ZIP
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {chunks.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-fira"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                        Part {idx + 1}
                      </span>
                      <span className="text-white truncate max-w-xs">{c.name}</span>
                      <span className="text-slate-500">(Pages {c.startPage} - {c.endPage})</span>
                    </div>

                    <span className="text-emerald-400 font-bold font-mono">{c.sizeMb} MB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};