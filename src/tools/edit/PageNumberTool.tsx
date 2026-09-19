import React, { useState, useEffect } from 'react';
import { 
  ListOrdered, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  AlignLeft, 
  AlignCenter, 
  AlignRight 
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface PageNumberToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const PageNumberTool: React.FC<PageNumberToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState<'number-only' | 'page-x-of-y' | 'roman'>('page-x-of-y');
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-center'>('bottom-center');
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(10);

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
      console.error(err);
      alert('Could not read PDF.');
    }
  };

  const toRoman = (num: number): string => {
    const lookup: { [key: string]: number } = { m: 1000, cm: 900, d: 500, cd: 400, c: 100, xc: 90, l: 50, xl: 40, x: 10, ix: 9, v: 5, iv: 4, i: 1 };
    let roman = '';
    for (const i in lookup) {
      while (num >= lookup[i]) {
        roman += i;
        num -= lookup[i];
      }
    }
    return roman.toLowerCase();
  };

  const handleApplyPageNumbers = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const buffer = await fileToUint8Array(file);
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const totalPages = doc.getPageCount();

      for (let i = 0; i < totalPages; i++) {
        const page = doc.getPage(i);
        const { width, height } = page.getSize();
        const currentNum = i + startNumber;

        let label = '';
        if (format === 'page-x-of-y') {
          label = `Page ${currentNum} of ${totalPages + startNumber - 1}`;
        } else if (format === 'roman') {
          label = toRoman(currentNum);
        } else {
          label = `${currentNum}`;
        }

        const textWidth = font.widthOfTextAtSize(label, fontSize);

        let x = width / 2 - textWidth / 2; // default center
        let y = 30; // default bottom

        if (position.includes('right')) x = width - textWidth - 40;
        if (position.includes('left')) x = 40;
        if (position.includes('top')) y = height - 30;

        page.drawText(label, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.35, 0.35, 0.35),
        });
      }

      const outputBytes = await doc.save();
      downloadUint8Array(outputBytes, `paginated_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Pagination failed:', err);
      alert('Failed to insert page numbers.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400">
            <ListOrdered className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF for Page Numbering</h4>
            <p className="text-xs text-slate-400 mt-1">Inject dynamic page numbers, roman numerals, or header/footer templates.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold font-fira text-xs cursor-pointer shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF Document</span>
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
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-[10px] text-slate-400 font-fira">{pageCount} Pages Total</p>
              </div>
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-fira">
            
            {/* Format Style */}
            <div className="space-y-1.5">
              <label className="text-slate-400">Numbering Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white focus:outline-none cursor-pointer"
              >
                <option value="page-x-of-y">Page X of Y (e.g. Page 1 of 12)</option>
                <option value="number-only">Number Only (e.g. 1, 2, 3)</option>
                <option value="roman">Roman Numerals (e.g. i, ii, iii)</option>
              </select>
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <label className="text-slate-400">Position Placement</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white focus:outline-none cursor-pointer"
              >
                <option value="bottom-center">Bottom Center (Standard)</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right (Header)</option>
                <option value="top-center">Top Center (Header)</option>
              </select>
            </div>

            {/* Start Number */}
            <div className="space-y-1.5">
              <label className="text-slate-400">Start Page Offset</label>
              <input
                type="number"
                min="1"
                value={startNumber}
                onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-center"
              />
            </div>

          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Vector PostScript typography injection</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleApplyPageNumbers}
            disabled={!file || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold font-fira text-xs shadow-lg shadow-blue-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Numbering Document...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Paginated & Saved!
              </>
            ) : (
              <>
                <ListOrdered className="w-4 h-4" /> Number & Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};