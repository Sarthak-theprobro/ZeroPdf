import React, { useState, useEffect } from 'react';
import { 
  Sheet, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  Table, 
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { downloadUint8Array } from '@/core/utils/download';
import { sanitizeForPdf } from '@/core/utils/pdfText';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface ExcelToPdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const ExcelToPdfTool: React.FC<ExcelToPdfToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [sheetData, setSheetData] = useState<string[][]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [workbookRef, setWorkbookRef] = useState<XLSX.WorkBook | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (preloadedFile && (preloadedFile.name.toLowerCase().endsWith('.xlsx') || preloadedFile.name.toLowerCase().endsWith('.xls') || preloadedFile.name.toLowerCase().endsWith('.csv'))) {
      loadSpreadsheet(preloadedFile);
    }
  }, [preloadedFile]);

  const loadSpreadsheet = async (f: File) => {
    try {
      setFile(f);
      sfx.playScan();

      const arrayBuffer = await f.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      setWorkbookRef(wb);
      setSheets(wb.SheetNames);

      const firstSheet = wb.SheetNames[0];
      setActiveSheet(firstSheet);
      renderSheetGrid(wb, firstSheet);
      sfx.playSuccess();
    } catch (err) {
      sfx.playError();
      console.error('Spreadsheet load error:', err);
      alert('Could not read Excel file.');
    }
  };

  const renderSheetGrid = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    const data: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    setSheetData(data.slice(0, 50)); // Render top 50 rows for preview
  };

  const handleSheetSwitch = (sheetName: string) => {
    sfx.playClick();
    setActiveSheet(sheetName);
    if (workbookRef) {
      renderSheetGrid(workbookRef, sheetName);
    }
  };

  const handleExportPdf = async () => {
    if (!file || sheetData.length === 0) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const doc = await PDFDocument.create();
      const isLandscape = orientation === 'landscape';
      const pageWidth = isLandscape ? 842 : 595;
      const pageHeight = isLandscape ? 595 : 842;

      let page = doc.addPage([pageWidth, pageHeight]);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

      let y = pageHeight - 50;

      // Title & Sheet Name (Safe Sanitized)
      const cleanTitle = sanitizeForPdf(`${file.name} - [Sheet: ${activeSheet}]`);
      page.drawText(cleanTitle, {
        x: 40,
        y,
        size: 14,
        font: fontBold,
        color: rgb(0.06, 0.5, 0.4),
      });
      y -= 25;

      const colCount = Math.min(sheetData[0]?.length || 6, 8);
      const colWidth = (pageWidth - 80) / colCount;

      for (let r = 0; r < sheetData.length; r++) {
        const row = sheetData[r];
        if (y < 45) {
          page = doc.addPage([pageWidth, pageHeight]);
          y = pageHeight - 50;
        }

        const isHeader = r === 0;

        // Alternating row background
        if (isHeader) {
          page.drawRectangle({
            x: 40,
            y: y - 4,
            width: pageWidth - 80,
            height: 18,
            color: rgb(0.9, 0.95, 0.93),
          });
        } else if (r % 2 === 0) {
          page.drawRectangle({
            x: 40,
            y: y - 4,
            width: pageWidth - 80,
            height: 16,
            color: rgb(0.98, 0.98, 0.99),
          });
        }

        for (let c = 0; c < colCount; c++) {
          const cellVal = sanitizeForPdf(String(row[c] || '').slice(0, 20));
          page.drawText(cellVal, {
            x: 45 + c * colWidth,
            y,
            size: isHeader ? 9 : 8,
            font: isHeader ? fontBold : fontRegular,
            color: rgb(0.1, 0.1, 0.1),
          });
        }

        y -= isHeader ? 20 : 16;
      }

      const pdfBytes = await doc.save();
      const outputFilename = `${sanitizeForPdf(file.name.replace(/\.[^/.]+$/, ''))}_ledger.pdf`;
      downloadUint8Array(pdfBytes, outputFilename);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Excel PDF export failed:', err);
      alert('Failed to compile Excel to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Sheet className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select an Excel (.xlsx / .csv) Spreadsheet</h4>
            <p className="text-xs text-slate-400 mt-1">Transforms worksheets into clean, structured multi-page PDF tables.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select Spreadsheet</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files && loadSpreadsheet(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Top Sticky Export Action Bar */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">{file.name}</p>
                <p className="text-xs text-slate-400 font-fira flex items-center gap-2">
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready ({sheets.length} Sheets)
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-fira text-slate-300 cursor-pointer transition-colors">
                <span>Change File</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => e.target.files && loadSpreadsheet(e.target.files[0])}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleExportPdf}
                disabled={!file || isProcessing}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-bold font-fira text-xs shadow-lg shadow-emerald-500/25 cursor-pointer flex items-center gap-2 transition-all disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...
                  </>
                ) : isCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-950" /> PDF Downloaded!
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Export Table to PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sheet Selector & Orientation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-fira">
            
            {/* Sheet Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-slate-500 uppercase mr-1">Sheets:</span>
              {sheets.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSheetSwitch(s)}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeSheet === s
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Layout Orientation */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Layout:</span>
              <button
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  orientation === 'landscape' ? 'bg-white/15 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Landscape
              </button>
              <button
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  orientation === 'portrait' ? 'bg-white/15 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Portrait
              </button>
            </div>

          </div>

          {/* Interactive Data Table Preview */}
          <div className="rounded-2xl bg-black/40 border border-white/10 overflow-x-auto max-h-[360px] p-2">
            <table className="w-full text-left text-xs font-fira border-collapse">
              <thead>
                <tr className="bg-emerald-500/10 text-emerald-300 border-b border-white/10">
                  {sheetData[0]?.map((col, idx) => (
                    <th key={idx} className="p-2.5 font-bold whitespace-nowrap">
                      {String(col || `Col ${idx + 1}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheetData.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-white/5 hover:bg-white/[0.02]">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2 text-slate-300 whitespace-nowrap max-w-xs truncate">
                        {String(cell)}
                      </td>
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
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Multi-sheet table generator • Formatted row borders</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleExportPdf}
            disabled={!file || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating Ledger PDF...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" /> PDF Downloaded!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Export Table to PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};