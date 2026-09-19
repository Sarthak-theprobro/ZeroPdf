import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  Maximize2 
} from 'lucide-react';
import { PDFDocument, PageSizes, degrees } from 'pdf-lib';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface NUpPdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const NUpPdfTool: React.FC<NUpPdfToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [nUp, setNUp] = useState<2 | 4 | 9>(2);
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
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

  const handleExecuteNUp = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const buffer = await fileToUint8Array(file);
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const outDoc = await PDFDocument.create();

      const totalPages = srcDoc.getPageCount();
      const sheetWidth = pageSize === 'A4' ? PageSizes.A4[1] : PageSizes.Letter[1]; // Landscape A4 / Letter
      const sheetHeight = pageSize === 'A4' ? PageSizes.A4[0] : PageSizes.Letter[0];

      const gridCols = nUp === 2 ? 2 : nUp === 4 ? 2 : 3;
      const gridRows = nUp === 2 ? 1 : nUp === 4 ? 2 : 3;

      const cellWidth = (sheetWidth - 40) / gridCols;
      const cellHeight = (sheetHeight - 40) / gridRows;

      for (let i = 0; i < totalPages; i += nUp) {
        const sheet = outDoc.addPage([sheetWidth, sheetHeight]);

        for (let cell = 0; cell < nUp; cell++) {
          const pageIdx = i + cell;
          if (pageIdx >= totalPages) break;

          const col = cell % gridCols;
          const row = Math.floor(cell / gridCols);

          const [embeddedPage] = await outDoc.embedPdf(srcDoc, [pageIdx]);
          const { width: pWidth, height: pHeight } = embeddedPage;

          const scale = Math.min((cellWidth - 10) / pWidth, (cellHeight - 10) / pHeight);
          const drawW = pWidth * scale;
          const drawH = pHeight * scale;

          const x = 20 + col * cellWidth + (cellWidth - drawW) / 2;
          const y = sheetHeight - 20 - (row + 1) * cellHeight + (cellHeight - drawH) / 2;

          sheet.drawPage(embeddedPage, {
            x,
            y,
            width: drawW,
            height: drawH,
          });
        }
      }

      const outputBytes = await outDoc.save();
      downloadUint8Array(outputBytes, `${nUp}up_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('N-Up imposition failed:', err);
      alert('Failed to generate N-Up imposition.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400">
            <Grid className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF for N-Up Imposition</h4>
            <p className="text-xs text-slate-400 mt-1">Impose 2, 4, or 9 pages onto a single sheet for booklet printing.</p>
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
          {/* Metadata */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-[10px] text-slate-400 font-fira">{pageCount} Original Pages</p>
              </div>
            </div>
          </div>

          {/* N-Up Selection Options */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { val: 2, label: '2 Pages Per Sheet', desc: 'Side-by-side (2x1)' },
              { val: 4, label: '4 Pages Per Sheet', desc: 'Quadrant Grid (2x2)' },
              { val: 9, label: '9 Pages Per Sheet', desc: 'Handout Grid (3x3)' },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => {
                  sfx.playHover();
                  setNUp(opt.val as any);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  nUp === opt.val
                    ? 'bg-blue-500/20 border-blue-500/40 shadow-xl text-white'
                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xs font-bold font-orbitron block">{opt.label}</span>
                <span className="text-[10px] font-fira text-slate-400">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Vector sub-page rendering • Zero resolution loss</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleExecuteNUp}
            disabled={!file || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold font-fira text-xs shadow-lg shadow-blue-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Imposing Sheets...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" /> Imposed & Saved!
              </>
            ) : (
              <>
                <Grid className="w-4 h-4" /> Impose & Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};