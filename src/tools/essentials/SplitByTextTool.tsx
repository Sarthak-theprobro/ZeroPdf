import React, { useState, useEffect } from 'react';
import { 
  SearchCode, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  FileText, 
  Archive,
  Layers,
  Scissors
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface SplitByTextToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

interface SplitSegment {
  name: string;
  startPage: number;
  endPage: number;
  matchedKeyword: string;
  blob?: Blob;
}

export const SplitByTextTool: React.FC<SplitByTextToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [keyword, setKeyword] = useState<string>('Invoice');
  const [isRegex, setIsRegex] = useState<boolean>(false);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [segments, setSegments] = useState<SplitSegment[]>([]);
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
    setSegments([]);
    setZipBlob(null);
    sfx.playClick();
  };

  const handleExecuteSplit = async () => {
    if (!file || !keyword.trim()) return;

    try {
      setIsProcessing(true);
      setProgress(10);
      setStatusMessage('Scanning document text streams for split triggers...');
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      const triggerPages: { pageNum: number; matchText: string }[] = [];

      // Create regex or text matcher
      let matcher: RegExp;
      try {
        if (isRegex) {
          matcher = new RegExp(keyword, caseSensitive ? 'g' : 'gi');
        } else {
          const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          matcher = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
        }
      } catch {
        alert('Invalid Regular Expression pattern.');
        setIsProcessing(false);
        return;
      }

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setProgress(Math.round(10 + (pageNum / numPages) * 50));
        setStatusMessage(`Analyzing text on Page ${pageNum} of ${numPages}...`);

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const fullText = textContent.items.map((it: any) => it.str).join(' ');

        if (matcher.test(fullText)) {
          triggerPages.push({ pageNum, matchText: keyword });
        }
      }

      if (triggerPages.length === 0) {
        alert(`No occurrences of "${keyword}" found to split by.`);
        setIsProcessing(false);
        return;
      }

      // Compute page ranges
      const calculatedSegments: SplitSegment[] = [];
      for (let i = 0; i < triggerPages.length; i++) {
        const start = triggerPages[i].pageNum;
        const end = i < triggerPages.length - 1 ? triggerPages[i + 1].pageNum - 1 : numPages;
        if (end >= start) {
          calculatedSegments.push({
            name: `${file.name.replace(/\.pdf$/i, '')}_Part_${i + 1}_(p${start}-p${end}).pdf`,
            startPage: start,
            endPage: end,
            matchedKeyword: triggerPages[i].matchText,
          });
        }
      }

      setStatusMessage('Extracting and compiling split PDF files...');
      setProgress(70);

      const srcDoc = await PDFDocument.load(arrayBuffer);
      const zip = new JSZip();

      for (let sIdx = 0; sIdx < calculatedSegments.length; sIdx++) {
        const seg = calculatedSegments[sIdx];
        const newDoc = await PDFDocument.create();
        
        // Zero-based page indices
        const pageIndices: number[] = [];
        for (let p = seg.startPage - 1; p <= seg.endPage - 1; p++) {
          pageIndices.push(p);
        }

        const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
        copiedPages.forEach((p) => newDoc.addPage(p));

        const newPdfBytes = await newDoc.save();
        const segBlob = new Blob([newPdfBytes as any], { type: 'application/pdf' });
        seg.blob = segBlob;

        zip.file(seg.name, segBlob);
      }

      setSegments(calculatedSegments);
      setStatusMessage('Packaging ZIP archive...');
      setProgress(90);

      const finalZip = await zip.generateAsync({ type: 'blob' });
      setZipBlob(finalZip);

      setProgress(100);
      setStatusMessage('Split Complete!');
      sfx.playSuccess();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Split by text error:', err);
      alert('Failed to split PDF by text match.');
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
    a.download = `${file.name.replace(/\.pdf$/i, '')}-text-split-collection.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSingle = (seg: SplitSegment) => {
    if (!seg.blob) return;
    sfx.playClick();
    const url = URL.createObjectURL(seg.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = seg.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-3xl bg-cyan-950/10 cursor-pointer transition-all hover:bg-cyan-950/20 group">
          <SearchCode className="w-14 h-14 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF for Keyword / Regex Auto-Split</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Automatically cuts document into separate files whenever a keyword (e.g., "Invoice #", "Chapter", "CONFIDENTIAL") occurs.
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
          {/* Top Options Bar */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-300">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-slate-400 font-fira">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setSegments([]);
                setZipBlob(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white font-fira"
            >
              Change File
            </button>
          </div>

          {/* Trigger Keyword Configuration */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <label className="text-xs font-bold text-slate-300 font-orbitron block">
              Split Trigger Keyword or Regex Pattern:
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. Invoice, Chapter, Confidential..."
                className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 text-white p-2.5 text-xs font-fira focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-5 text-xs font-fira pt-1">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={isRegex}
                  onChange={(e) => setIsRegex(e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-cyan-500"
                />
                Use Regular Expression (RegEx)
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-cyan-500"
                />
                Case Sensitive
              </label>
            </div>
          </div>

          {/* Progress Indicator */}
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

          {/* Segments Display or Action Button */}
          {!zipBlob ? (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleExecuteSplit}
                disabled={isProcessing || !keyword.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Scissors className="w-4 h-4" />
                Auto-Split Document
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white font-orbitron">
                      Split into {segments.length} Documents Successfully
                    </h4>
                    <p className="text-xs text-slate-400 font-fira">
                      Matched keyword: "{keyword}" across page boundaries
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadZip}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Archive className="w-4 h-4" />
                  Download All as ZIP
                </button>
              </div>

              {/* Segmented Files List */}
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {segments.map((seg, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-fira"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                        #{idx + 1}
                      </span>
                      <span className="text-white truncate max-w-sm">{seg.name}</span>
                      <span className="text-slate-500">
                        (Pages {seg.startPage} - {seg.endPage})
                      </span>
                    </div>

                    <button
                      onClick={() => handleDownloadSingle(seg)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-white cursor-pointer"
                      title="Download Segment"
                    >
                      <Download className="w-4 h-4" />
                    </button>
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