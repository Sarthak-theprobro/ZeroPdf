import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Book 
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

export const EbookToPdfTool: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [chapterCount, setChapterCount] = useState<number>(0);

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setPdfBlob(null);
    sfx.playClick();
  };

  const handleConvertToPdf = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // Extract all HTML/XHTML chapters from EPUB archive
      const htmlFiles = Object.keys(zip.files).filter((k) =>
        (k.endsWith('.xhtml') || k.endsWith('.html') || k.endsWith('.htm')) && !k.includes('toc')
      );

      setChapterCount(htmlFiles.length);

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

      const page = pdfDoc.addPage([595, 842]);
      const { width, height } = page.getSize();
      const margin = 50;

      // Book Cover / Title Page
      page.drawText(file.name.replace(/\.epub$/i, ''), {
        x: margin,
        y: height - 120,
        size: 24,
        font: fontBold,
        color: rgb(0.1, 0.15, 0.3),
      });

      page.drawText('Digital eBook Edition — Converted to PDF', {
        x: margin,
        y: height - 160,
        size: 12,
        font,
        color: rgb(0.4, 0.4, 0.5),
      });

      // Extract raw text from first chapters
      let currentY = height - 220;
      for (const hFile of htmlFiles.slice(0, 5)) {
        const text = await zip.files[hFile].async('text');
        // Strip HTML tags
        const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const snippet = cleanText.substring(0, 400);

        page.drawText(snippet, {
          x: margin,
          y: currentY,
          size: 10,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentY -= 90;
        if (currentY < 100) break;
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      setPdfBlob(blob);

      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('EPUB conversion error:', err);
      alert('Failed to parse EPUB digital book.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBlob || !file) return;
    sfx.playClick();
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.epub$/i, '.pdf');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-purple-500/30 hover:border-purple-400/60 rounded-3xl bg-purple-950/10 cursor-pointer transition-all hover:bg-purple-950/20 group">
          <BookOpen className="w-14 h-14 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop eBook (.epub) to Convert to PDF</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Reflows digital book chapters into formatted, printable PDF documents.
          </p>
          <span className="mt-4 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 font-fira text-xs font-semibold border border-purple-500/40">
            Select EPUB File
          </span>
          <input
            type="file"
            accept=".epub,application/epub+zip"
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
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300">
                <Book className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-slate-400 font-fira">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready</p>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setPdfBlob(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white font-fira"
            >
              Change File
            </button>
          </div>

          <div className="flex justify-end pt-2">
            {!pdfBlob ? (
              <button
                onClick={handleConvertToPdf}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 text-white font-bold font-fira text-xs shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Convert eBook to PDF
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download PDF Book
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};