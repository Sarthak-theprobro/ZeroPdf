import React, { useState, useEffect } from 'react';
import { 
  Binary, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Sliders,
  Scale,
  FileCheck,
  Hash
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface BatesNumberingToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const BatesNumberingTool: React.FC<BatesNumberingToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedBytes, setProcessedBytes] = useState<Uint8Array | null>(null);

  // Bates Configuration
  const [prefix, setPrefix] = useState<string>('PLAINTIFF-EX-');
  const [suffix, setSuffix] = useState<string>('');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [digitCount, setDigitCount] = useState<number>(6);
  const [position, setPosition] = useState<'bottom-right' | 'bottom-center' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [fontSize, setFontSize] = useState<number>(10);
  const [fontFamily, setFontFamily] = useState<'Courier' | 'Helvetica' | 'TimesRoman'>('Courier');
  const [margin, setMargin] = useState<number>(24);

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
      console.error('PDF page count error:', err);
    }
  };

  const formatBatesNumber = (index: number): string => {
    const num = startNumber + index;
    const padded = String(num).padStart(digitCount, '0');
    return `${prefix}${padded}${suffix}`;
  };

  const handleApplyBates = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(
        fontFamily === 'Courier'
          ? StandardFonts.CourierBold
          : fontFamily === 'TimesRoman'
          ? StandardFonts.TimesRomanBold
          : StandardFonts.HelveticaBold
      );

      const pages = pdfDoc.getPages();

      pages.forEach((page, idx) => {
        const batesText = formatBatesNumber(idx);
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(batesText, fontSize);
        const textColor = rgb(0.15, 0.15, 0.15);

        let x = width - margin - textWidth;
        let y = margin;

        if (position === 'bottom-left') {
          x = margin;
          y = margin;
        } else if (position === 'bottom-center') {
          x = (width - textWidth) / 2;
          y = margin;
        } else if (position === 'bottom-right') {
          x = width - margin - textWidth;
          y = margin;
        } else if (position === 'top-left') {
          x = margin;
          y = height - margin;
        } else if (position === 'top-right') {
          x = width - margin - textWidth;
          y = height - margin;
        }

        page.drawText(batesText, {
          x,
          y,
          size: fontSize,
          font,
          color: textColor,
        });
      });

      const savedBytes = await pdfDoc.save();
      setProcessedBytes(savedBytes);
      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Bates error:', err);
      alert('Failed to stamp Bates numbering.');
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
    a.download = file.name.replace(/\.pdf$/i, '-bates-stamped.pdf');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-blue-500/30 hover:border-blue-400/60 rounded-3xl bg-blue-950/10 cursor-pointer transition-all hover:bg-blue-950/20 group">
          <Binary className="w-14 h-14 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF for Legal Bates Numbering</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Sequential zero-padded legal discovery label stamping (e.g., PLAINTIFF-000001 through PLAINTIFF-000420).
          </p>
          <span className="mt-4 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-300 font-fira text-xs font-semibold border border-blue-500/40">
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
          {/* File Card & Range Summary */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-300">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-blue-300 font-fira">
                  {totalPages} Pages • Range: {formatBatesNumber(0)} → {formatBatesNumber(totalPages - 1)}
                </p>
              </div>
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

          {/* Bates Customization Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 font-fira">Prefix Tag:</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. PLAINTIFF-EX-"
                className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-white p-2.5 text-xs font-fira focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 font-fira">Suffix Tag (Optional):</label>
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="e.g. -CONFIDENTIAL"
                className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-white p-2.5 text-xs font-fira focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 font-fira">Start Number:</label>
                <input
                  type="number"
                  min="1"
                  value={startNumber}
                  onChange={(e) => setStartNumber(Number(e.target.value))}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-cyan-300 font-bold p-2.5 text-xs font-fira focus:border-blue-400 focus:outline-none text-center"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 font-fira">Digits (Padding):</label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={digitCount}
                  onChange={(e) => setDigitCount(Number(e.target.value))}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-cyan-300 font-bold p-2.5 text-xs font-fira focus:border-blue-400 focus:outline-none text-center"
                />
              </div>
            </div>
          </div>

          {/* Position & Typography */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 font-fira">Stamp Placement:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bottom-right', label: 'Bottom Right' },
                  { id: 'bottom-center', label: 'Bottom Center' },
                  { id: 'bottom-left', label: 'Bottom Left' },
                  { id: 'top-right', label: 'Top Right' },
                  { id: 'top-left', label: 'Top Left' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => setPosition(pos.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-fira transition-all cursor-pointer ${
                      position === pos.id
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400 font-bold'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-center space-y-2">
              <span className="text-[11px] font-fira text-slate-400 uppercase tracking-wider">
                Live Stamp Output Sample
              </span>
              <div className="p-2 rounded-lg bg-white/5 font-mono text-cyan-300 font-bold text-sm tracking-widest text-center border border-cyan-500/30">
                {formatBatesNumber(0)}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-end gap-3 pt-2">
            {!processedBytes ? (
              <button
                onClick={handleApplyBates}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-400 hover:to-cyan-300 text-black font-bold font-fira text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Stamp All {totalPages} Pages
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Bates Stamped PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
