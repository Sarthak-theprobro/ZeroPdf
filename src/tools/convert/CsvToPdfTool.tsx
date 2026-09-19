import React, { useState } from 'react';
import { 
  Table, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText 
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

export const CsvToPdfTool: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<string[][]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const loadCsv = async (f: File) => {
    try {
      setFile(f);
      sfx.playScan();
      const text = await f.text();
      const parsed = text
        .split('\n')
        .map((r) => r.split(',').map((c) => c.trim().replace(/^["']|["']$/g, '')))
        .filter((r) => r.some((c) => c.length > 0));

      setRows(parsed);
      sfx.playSuccess();
    } catch (err) {
      sfx.playError();
      alert('Could not parse CSV.');
    }
  };

  const handleExportPdf = async () => {
    if (!file || rows.length === 0) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const doc = await PDFDocument.create();
      let page = doc.addPage([842, 595]); // Landscape A4
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

      let y = 545;
      const colCount = Math.min(rows[0]?.length || 5, 7);
      const colWidth = 762 / colCount;

      // Header title
      page.drawText(`CSV Dataset: ${file.name}`, { x: 40, y, size: 14, font: fontBold, color: rgb(0.04, 0.4, 0.8) });
      y -= 25;

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (y < 45) {
          page = doc.addPage([842, 595]);
          y = 545;
        }

        const isHeader = r === 0;

        if (isHeader) {
          page.drawRectangle({ x: 40, y: y - 4, width: 762, height: 18, color: rgb(0.9, 0.94, 0.98) });
        } else if (r % 2 === 0) {
          page.drawRectangle({ x: 40, y: y - 4, width: 762, height: 16, color: rgb(0.98, 0.98, 0.99) });
        }

        for (let c = 0; c < colCount; c++) {
          const val = String(row[c] || '').slice(0, 22);
          page.drawText(val, {
            x: 45 + c * colWidth,
            y,
            size: isHeader ? 9 : 8,
            font: isHeader ? fontBold : fontRegular,
          });
        }

        y -= isHeader ? 20 : 16;
      }

      const pdfBytes = await doc.save();
      downloadUint8Array(pdfBytes, `${file.name.replace(/\.[^/.]+$/, '')}_table.pdf`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      alert('Failed to generate table PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400">
            <Table className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a CSV / TSV File</h4>
            <p className="text-xs text-slate-400 mt-1">Converts raw CSV datasets into formatted, styled multi-page PDF tables.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold font-fira text-xs cursor-pointer shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select .CSV File</span>
            <input type="file" accept=".csv,.tsv" onChange={(e) => e.target.files && loadCsv(e.target.files[0])} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-fira">
            <span className="text-white font-bold">{file.name}</span>
            <span className="text-slate-400">{rows.length} Total Records</span>
          </div>

          <div className="rounded-xl bg-black/40 border border-white/10 overflow-x-auto max-h-[300px] p-2">
            <table className="w-full text-left text-xs font-fira border-collapse">
              <thead>
                <tr className="bg-purple-500/10 text-purple-300">
                  {rows[0]?.map((col, i) => (
                    <th key={i} className="p-2 font-bold whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1, 30).map((r, idx) => (
                  <tr key={idx} className="border-b border-white/5">
                    {r.map((c, i) => (
                      <td key={i} className="p-1.5 text-slate-300 whitespace-nowrap truncate max-w-[150px]">{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Vector table formatting • Auto-calculates row widths</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleExportPdf}
            disabled={!file || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold font-fira text-xs shadow-lg shadow-purple-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Compiling...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Table Downloaded!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Export Table PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};