import React, { useState, useEffect, useRef } from 'react';
import { 
  Heading, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  Sliders,
  Type,
  FileCheck
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface HeadersFootersToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const HeadersFootersTool: React.FC<HeadersFootersToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [processedBytes, setProcessedBytes] = useState<Uint8Array | null>(null);

  // 6 Header & Footer Positions
  const [slots, setSlots] = useState({
    topLeft: '{{title}}',
    topCenter: '',
    topRight: '{{date}}',
    bottomLeft: 'CONFIDENTIAL',
    bottomCenter: 'Page {{page}} of {{total}}',
    bottomRight: '',
  });

  const [startPage, setStartPage] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(9);
  const [fontFamily, setFontFamily] = useState<'Helvetica' | 'TimesRoman' | 'Courier'>('Helvetica');
  const [marginOffset, setMarginOffset] = useState<number>(24); // points from edge

  useEffect(() => {
    if (preloadedFile) {
      handleFileSelected(preloadedFile);
    }
  }, [preloadedFile]);

  const handleFileSelected = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setProcessedBytes(null);
    sfx.playClick();

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      setTotalPages(pdf.numPages);
    } catch (err) {
      console.error('Failed to read page count:', err);
    }
  };

  const interpolateMacros = (template: string, pageNum: number, total: number, fileName: string): string => {
    if (!template) return '';
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const cleanTitle = fileName.replace(/\.pdf$/i, '');

    return template
      .replace(/\{\{page\}\}/gi, String(pageNum))
      .replace(/\{\{total\}\}/gi, String(total))
      .replace(/\{\{date\}\}/gi, today)
      .replace(/\{\{title\}\}/gi, cleanTitle)
      .replace(/\{\{confidential\}\}/gi, 'CONFIDENTIAL');
  };

  const handleApplyHeadersFooters = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      const font = await pdfDoc.embedFont(
        fontFamily === 'TimesRoman'
          ? StandardFonts.TimesRoman
          : fontFamily === 'Courier'
          ? StandardFonts.Courier
          : StandardFonts.Helvetica
      );

      const pages = pdfDoc.getPages();
      const count = pages.length;

      pages.forEach((page, idx) => {
        const pageNum = idx + 1;
        if (pageNum < startPage) return;

        const { width, height } = page.getSize();
        const textColor = rgb(0.3, 0.35, 0.4);

        // 1. Top Left
        if (slots.topLeft) {
          const text = interpolateMacros(slots.topLeft, pageNum, count, file.name);
          page.drawText(text, {
            x: marginOffset,
            y: height - marginOffset,
            size: fontSize,
            font,
            color: textColor,
          });
        }

        // 2. Top Center
        if (slots.topCenter) {
          const text = interpolateMacros(slots.topCenter, pageNum, count, file.name);
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          page.drawText(text, {
            x: (width - textWidth) / 2,
            y: height - marginOffset,
            size: fontSize,
            font,
            color: textColor,
          });
        }

        // 3. Top Right
        if (slots.topRight) {
          const text = interpolateMacros(slots.topRight, pageNum, count, file.name);
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          page.drawText(text, {
            x: width - marginOffset - textWidth,
            y: height - marginOffset,
            size: fontSize,
            font,
            color: textColor,
          });
        }

        // 4. Bottom Left
        if (slots.bottomLeft) {
          const text = interpolateMacros(slots.bottomLeft, pageNum, count, file.name);
          page.drawText(text, {
            x: marginOffset,
            y: marginOffset,
            size: fontSize,
            font,
            color: textColor,
          });
        }

        // 5. Bottom Center
        if (slots.bottomCenter) {
          const text = interpolateMacros(slots.bottomCenter, pageNum, count, file.name);
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          page.drawText(text, {
            x: (width - textWidth) / 2,
            y: marginOffset,
            size: fontSize,
            font,
            color: textColor,
          });
        }

        // 6. Bottom Right
        if (slots.bottomRight) {
          const text = interpolateMacros(slots.bottomRight, pageNum, count, file.name);
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          page.drawText(text, {
            x: width - marginOffset - textWidth,
            y: marginOffset,
            size: fontSize,
            font,
            color: textColor,
          });
        }
      });

      const savedBytes = await pdfDoc.save();
      setProcessedBytes(savedBytes);
      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Headers/Footers error:', err);
      alert('Failed to stamp headers and footers.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedBytes || !file) return;
    sfx.playClick();
    const blob = new Blob([processedBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '-headers-footers.pdf');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-3xl bg-cyan-950/10 cursor-pointer transition-all hover:bg-cyan-950/20 group">
          <Heading className="w-14 h-14 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF for Running Headers & Footers</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Insert multi-column legal running headers, dynamic date stamps, document titles, and page numbering.
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
        <div className="space-y-6">
          {/* File Card & Global Options */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 md:col-span-2 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-slate-400 font-fira">{totalPages} Pages detected</p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setProcessedBytes(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white font-fira"
              >
                Change File
              </button>
            </div>

            {/* Typography Controls */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3 text-xs font-fira">
              <span className="text-slate-400">Font:</span>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value as any)}
                className="bg-black/60 border border-white/10 text-white rounded-lg px-2 py-1 flex-1 text-xs"
              >
                <option value="Helvetica">Helvetica</option>
                <option value="TimesRoman">Times New Roman</option>
                <option value="Courier">Courier Mono</option>
              </select>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3 text-xs font-fira">
              <span className="text-slate-400">Start Page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={startPage}
                onChange={(e) => setStartPage(Number(e.target.value))}
                className="w-16 bg-black/60 border border-white/10 text-cyan-300 font-bold rounded-lg px-2 py-1 text-center text-xs"
              />
            </div>
          </div>

          {/* 6-Zone Positioning Canvas Simulation */}
          <div className="p-6 rounded-3xl bg-black/50 border border-white/10 space-y-6">
            <div className="flex justify-between items-center text-xs font-fira text-slate-400">
              <span className="font-bold text-white uppercase tracking-wider">6-Zone Layout Grid</span>
              <span>Available Tokens: {'{{page}}, {{total}}, {{date}}, {{title}}, {{confidential}}'}</span>
            </div>

            {/* Top Running Header Zone */}
            <div className="space-y-2">
              <span className="text-[11px] font-fira font-bold text-cyan-300">TOP RUNNING HEADER</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Top Left (e.g. {{title}})"
                  value={slots.topLeft}
                  onChange={(e) => setSlots({ ...slots, topLeft: e.target.value })}
                  className="rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white p-2.5 font-fira focus:border-cyan-400 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Top Center"
                  value={slots.topCenter}
                  onChange={(e) => setSlots({ ...slots, topCenter: e.target.value })}
                  className="rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white p-2.5 font-fira focus:border-cyan-400 focus:outline-none text-center"
                />
                <input
                  type="text"
                  placeholder="Top Right (e.g. {{date}})"
                  value={slots.topRight}
                  onChange={(e) => setSlots({ ...slots, topRight: e.target.value })}
                  className="rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white p-2.5 font-fira focus:border-cyan-400 focus:outline-none text-right"
                />
              </div>
            </div>

            {/* Simulated Document Body Space */}
            <div className="h-20 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center text-xs font-fira text-slate-500">
              [Document Content Area — Preserved Untouched]
            </div>

            {/* Bottom Running Footer Zone */}
            <div className="space-y-2">
              <span className="text-[11px] font-fira font-bold text-cyan-300">BOTTOM RUNNING FOOTER</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Bottom Left (e.g. CONFIDENTIAL)"
                  value={slots.bottomLeft}
                  onChange={(e) => setSlots({ ...slots, bottomLeft: e.target.value })}
                  className="rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white p-2.5 font-fira focus:border-cyan-400 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Bottom Center (e.g. Page {{page}} of {{total}})"
                  value={slots.bottomCenter}
                  onChange={(e) => setSlots({ ...slots, bottomCenter: e.target.value })}
                  className="rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white p-2.5 font-fira focus:border-cyan-400 focus:outline-none text-center"
                />
                <input
                  type="text"
                  placeholder="Bottom Right"
                  value={slots.bottomRight}
                  onChange={(e) => setSlots({ ...slots, bottomRight: e.target.value })}
                  className="rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white p-2.5 font-fira focus:border-cyan-400 focus:outline-none text-right"
                />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-end gap-3 pt-2">
            {!processedBytes ? (
              <button
                onClick={handleApplyHeadersFooters}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Stamp Headers & Footers
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Paginated PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
