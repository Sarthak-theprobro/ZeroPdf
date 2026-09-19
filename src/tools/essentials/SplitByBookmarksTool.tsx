import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { 
  Bookmark, 
  Scissors, 
  Download, 
  FolderArchive, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  FileText,
  Layers
} from 'lucide-react';
import { sfx } from '@/core/audio/sfx';

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface BookmarkChapter {
  id: string;
  title: string;
  startPage: number; // 1-indexed
  endPage: number;   // 1-indexed
  pageCount: number;
  selected: boolean;
}

interface SplitByBookmarksToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const SplitByBookmarksTool: React.FC<SplitByBookmarksToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(preloadedFile || null);
  const [chapters, setChapters] = useState<BookmarkChapter[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasBookmarks, setHasBookmarks] = useState<boolean | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitComplete, setSplitComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [zipFileName, setZipFileName] = useState<string>('');

  useEffect(() => {
    if (file) {
      parseBookmarks(file);
    }
  }, [file]);

  // Parse embedded PDF Bookmarks / Outline tree
  const parseBookmarks = async (targetFile: File) => {
    setIsAnalyzing(true);
    setSplitComplete(false);
    setDownloadUrl(null);

    try {
      const arrayBuffer = await targetFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      const total = pdf.numPages;
      setTotalPages(total);

      const outline = await pdf.getOutline();

      if (outline && outline.length > 0) {
        setHasBookmarks(true);
        const parsedChapters: { title: string; startPage: number }[] = [];

        for (const item of outline) {
          let destPage = 1;
          try {
            if (typeof item.dest === 'string') {
              const destObj = await pdf.getDestination(item.dest);
              if (destObj && destObj[0]) {
                const pageIndex = await pdf.getPageIndex(destObj[0]);
                destPage = pageIndex + 1;
              }
            } else if (Array.isArray(item.dest) && item.dest[0]) {
              const pageIndex = await pdf.getPageIndex(item.dest[0]);
              destPage = pageIndex + 1;
            }
          } catch (e) {
            console.warn('Bookmark dest resolution error', e);
          }

          parsedChapters.push({
            title: item.title?.replace(/[/\\?%*:|"<>]/g, '_') || `Chapter_${parsedChapters.length + 1}`,
            startPage: Math.max(1, Math.min(total, destPage)),
          });
        }

        // Sort by start page
        parsedChapters.sort((a, b) => a.startPage - b.startPage);

        // Calculate end pages
        const computedChapters: BookmarkChapter[] = parsedChapters.map((chap, idx) => {
          const nextStart = parsedChapters[idx + 1]?.startPage;
          const endPage = nextStart ? nextStart - 1 : total;
          const safeEnd = Math.max(chap.startPage, endPage);
          return {
            id: `chap-${idx}`,
            title: chap.title,
            startPage: chap.startPage,
            endPage: safeEnd,
            pageCount: safeEnd - chap.startPage + 1,
            selected: true,
          };
        });

        setChapters(computedChapters);
      } else {
        // Fallback: No native outline found -> Auto-partition into equal chapters or provide custom splits
        setHasBookmarks(false);
        const chunkSize = Math.max(1, Math.ceil(total / 4));
        const autoChapters: BookmarkChapter[] = [];

        let currentStart = 1;
        let index = 1;
        while (currentStart <= total) {
          const currentEnd = Math.min(total, currentStart + chunkSize - 1);
          autoChapters.push({
            id: `auto-${index}`,
            title: `Section ${index} (Pages ${currentStart}-${currentEnd})`,
            startPage: currentStart,
            endPage: currentEnd,
            pageCount: currentEnd - currentStart + 1,
            selected: true,
          });
          currentStart = currentEnd + 1;
          index++;
        }
        setChapters(autoChapters);
      }
      sfx.playSuccess();
    } catch (err) {
      console.error('Failed to parse bookmarks:', err);
      setHasBookmarks(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleChapter = (id: string) => {
    sfx.playClick();
    setChapters(prev =>
      prev.map(c => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const updateChapterTitle = (id: string, newTitle: string) => {
    setChapters(prev =>
      prev.map(c => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  // Perform split and package as ZIP
  const handleExecuteSplit = async () => {
    if (!file) return;
    const selectedChapters = chapters.filter(c => c.selected);
    if (selectedChapters.length === 0) {
      alert('Please select at least one bookmark chapter to extract.');
      return;
    }

    setIsProcessing(true);
    sfx.playProcessing();

    try {
      const fileBytes = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(fileBytes);
      const zip = new JSZip();

      for (let i = 0; i < selectedChapters.length; i++) {
        const chap = selectedChapters[i];
        const newPdf = await PDFDocument.create();

        const pageIndices: number[] = [];
        for (let p = chap.startPage; p <= chap.endPage; p++) {
          pageIndices.push(p - 1); // 0-indexed
        }

        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));

        const newPdfBytes = await newPdf.save();
        const cleanName = `${String(i + 1).padStart(2, '0')}_${chap.title.trim() || `Chapter_${i + 1}`}.pdf`;
        zip.file(cleanName, newPdfBytes);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(new Blob([zipBlob as any], { type: 'application/zip' }));
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const finalZipName = `${baseName}_bookmarks_split.zip`;

      setDownloadUrl(url);
      setZipFileName(finalZipName);
      setSplitComplete(true);
      sfx.playSuccess();
    } catch (err) {
      console.error('Error executing bookmark split:', err);
      alert('Failed to split PDF by bookmarks. Check document structure.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* File Drop / Select Area */}
      {!file ? (
        <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center space-y-4 hover:border-cyan-500/30 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white font-orbitron">Select PDF Document</h3>
            <p className="text-xs text-slate-400 font-fira mt-1">
              Extract chapters based on Table of Contents / Outline bookmarks.
            </p>
          </div>
          <label className="inline-block px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-fira text-xs font-semibold cursor-pointer border border-cyan-500/40 transition-all">
            Choose PDF File
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setFile(e.target.files[0]);
              }}
            />
          </label>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header File Card */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white truncate max-w-sm">{file.name}</h4>
                <p className="text-xs text-slate-400 font-fira">
                  {totalPages} Total Pages • {hasBookmarks ? 'Embedded Bookmarks Detected' : 'Auto Sections Generated'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setChapters([]);
                setSplitComplete(false);
              }}
              className="text-xs text-slate-400 hover:text-white font-fira px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
            >
              Change File
            </button>
          </div>

          {isAnalyzing ? (
            <div className="text-center py-10 space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs font-fira text-slate-400">Scanning PDF outline tree & page indices...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Banner */}
              {!hasBookmarks && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-fira flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>No native PDF bookmarks found. Created {chapters.length} auto-partitioned sections.</span>
                </div>
              )}

              {/* Chapters List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {chapters.map((chap, idx) => (
                  <div
                    key={chap.id}
                    className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      chap.selected
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                        : 'bg-white/[0.02] border-white/5 text-slate-500 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={chap.selected}
                      onChange={() => toggleChapter(chap.id)}
                      className="w-4 h-4 rounded text-cyan-500 bg-white/5 border-white/20 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-fira font-bold text-cyan-400 w-6">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={chap.title}
                      onChange={(e) => updateChapterTitle(chap.id, e.target.value)}
                      className="flex-1 bg-transparent border-b border-transparent hover:border-white/20 focus:border-cyan-400 text-xs font-semibold text-white px-1 py-0.5 outline-none font-fira"
                    />
                    <div className="text-right">
                      <span className="text-[11px] font-fira px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                        pp. {chap.startPage}-{chap.endPage} ({chap.pageCount} {chap.pageCount === 1 ? 'page' : 'pages'})
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              {!splitComplete ? (
                <button
                  disabled={isProcessing}
                  onClick={handleExecuteSplit}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Extracting Chapter PDFs...</span>
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4" />
                      <span>Split into {chapters.filter(c => c.selected).length} Chapter PDFs (ZIP)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-fira text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Bookmark Splitting Complete!</span>
                  </div>
                  <a
                    href={downloadUrl!}
                    download={zipFileName}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <FolderArchive className="w-4 h-4" />
                    <span>Download {zipFileName}</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};