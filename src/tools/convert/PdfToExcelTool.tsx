import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  Table, 
  Layers,
  FileDown,
  Plus,
  Trash2
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface PdfToExcelToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

interface TableRow {
  [colIndex: number]: string;
}

export const PdfToExcelTool: React.FC<PdfToExcelToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [tableData, setTableData] = useState<string[][]>([]);
  const [excelBlob, setExcelBlob] = useState<Blob | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'export'>('preview');

  useEffect(() => {
    if (preloadedFile) {
      handleFileSelected(preloadedFile);
    }
  }, [preloadedFile]);

  const handleFileSelected = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setTableData([]);
    setExcelBlob(null);
    sfx.playClick();
  };

  const processPdfToExcel = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(10);
      setStatusMessage('Extracting tabular spatial coordinates...');
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      const allRows: string[][] = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setStatusMessage(`Processing tables on Page ${pageNum} of ${numPages}...`);
        setProgress(Math.round(10 + (pageNum / numPages) * 60));

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];

        if (items.length === 0) continue;

        // Group text items by Y coordinate (Row detection)
        const rowMap = new Map<number, { text: string; x: number }[]>();
        const yTolerance = 5;

        for (const item of items) {
          if (!item.str || item.str.trim() === '') continue;
          const y = Math.round(item.transform[5]);
          const x = Math.round(item.transform[4]);

          let matchedY = Array.from(rowMap.keys()).find(k => Math.abs(k - y) <= yTolerance);
          if (matchedY === undefined) {
            matchedY = y;
            rowMap.set(matchedY, []);
          }
          rowMap.get(matchedY)!.push({ text: item.str.trim(), x });
        }

        // Sort rows top-to-bottom
        const sortedY = Array.from(rowMap.keys()).sort((a, b) => b - a);

        // Find all distinct column X boundaries
        const allXCoordinates: number[] = [];
        for (const y of sortedY) {
          const cells = rowMap.get(y)!;
          for (const cell of cells) {
            allXCoordinates.push(cell.x);
          }
        }
        allXCoordinates.sort((a, b) => a - b);

        // Cluster X coordinates into column bins
        const columnBins: number[] = [];
        const xTolerance = 30;
        for (const x of allXCoordinates) {
          const existingBin = columnBins.find(bin => Math.abs(bin - x) <= xTolerance);
          if (existingBin === undefined) {
            columnBins.push(x);
          }
        }
        columnBins.sort((a, b) => a - b);

        // Map row items into columns
        for (const y of sortedY) {
          const itemsInRow = rowMap.get(y)!;
          itemsInRow.sort((a, b) => a.x - b.x);

          const rowCells = new Array(Math.max(1, columnBins.length)).fill('');

          for (const item of itemsInRow) {
            // Find closest column bin
            let closestColIdx = 0;
            let minDiff = Infinity;
            columnBins.forEach((binX, colIdx) => {
              const diff = Math.abs(binX - item.x);
              if (diff < minDiff) {
                minDiff = diff;
                closestColIdx = colIdx;
              }
            });

            if (rowCells[closestColIdx]) {
              rowCells[closestColIdx] += ` ${item.text}`;
            } else {
              rowCells[closestColIdx] = item.text;
            }
          }

          // Filter out completely empty rows
          if (rowCells.some(c => c.trim().length > 0)) {
            allRows.push(rowCells);
          }
        }
      }

      if (allRows.length === 0) {
        throw new Error('No structured text or tables detected in this PDF.');
      }

      // Pad all rows to uniform column count
      const maxCols = Math.max(...allRows.map(r => r.length));
      const normalizedRows = allRows.map(r => {
        while (r.length < maxCols) r.push('');
        return r;
      });

      setTableData(normalizedRows);
      setStatusMessage('Generating Microsoft Excel (.xlsx) workbook...');
      setProgress(85);

      // Create XLSX Workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(normalizedRows);
      
      // Auto-fit column widths
      const colWidths = normalizedRows[0]?.map((_, colIdx) => {
        let maxLen = 10;
        normalizedRows.forEach(row => {
          const val = row[colIdx] ? String(row[colIdx]) : '';
          if (val.length > maxLen) maxLen = Math.min(val.length, 50);
        });
        return { wch: maxLen + 2 };
      });
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      setExcelBlob(blob);
      setProgress(100);
      setStatusMessage('Extraction Complete!');
      sfx.playSuccess();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error('PDF to Excel error:', err);
      alert(err.message || 'Failed to extract tables from PDF.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    const updated = [...tableData];
    updated[rowIndex][colIndex] = val;
    setTableData(updated);

    // Rebuild Blob
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(updated);
    XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    setExcelBlob(new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  };

  const handleDownloadExcel = () => {
    if (!excelBlob || !file) return;
    sfx.playClick();
    const url = URL.createObjectURL(excelBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '.xlsx');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    if (tableData.length === 0 || !file) return;
    sfx.playClick();
    const csvContent = tableData
      .map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-3xl bg-cyan-950/10 cursor-pointer transition-all hover:bg-cyan-950/20 group">
          <FileSpreadsheet className="w-14 h-14 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF for Excel (.xlsx) Extraction</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Spatial coordinate engine auto-detects rows, columns, numerical figures, and financial statements.
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
          {/* File Card & Stats */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white truncate max-w-md">{file.name}</h4>
                <p className="text-xs text-slate-400 font-fira">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Spatial Table Scanner Active
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setTableData([]);
                setExcelBlob(null);
                sfx.playClick();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white font-fira"
            >
              Change File
            </button>
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
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Table Data Preview & Editable Grid */}
          {!excelBlob ? (
            <div className="flex justify-end pt-2">
              <button
                onClick={processPdfToExcel}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Extract Tables to Excel (.xlsx)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white font-orbitron">
                      Table Extracted Successfully
                    </h4>
                    <p className="text-xs text-slate-400 font-fira">
                      {tableData.length} Rows × {tableData[0]?.length || 0} Columns detected
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadCsv}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-fira text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleDownloadExcel}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    Download Excel (.xlsx)
                  </button>
                </div>
              </div>

              {/* Editable Interactive Table Grid */}
              <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
                <div className="px-4 py-2 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 font-fira">
                    Interactive Grid Preview (Editable)
                  </span>
                  <span className="text-[10px] text-slate-500 font-fira">
                    Click any cell to edit values prior to download
                  </span>
                </div>
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-left text-xs font-fira border-collapse">
                    <tbody>
                      {tableData.slice(0, 30).map((row, rIdx) => (
                        <tr 
                          key={rIdx} 
                          className={`border-b border-white/5 ${rIdx === 0 ? 'bg-cyan-500/10 font-bold text-cyan-200' : 'hover:bg-white/[0.02]'}`}
                        >
                          <td className="p-2 text-[10px] text-slate-600 border-r border-white/5 select-none w-8 text-center">
                            {rIdx + 1}
                          </td>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-1 border-r border-white/5">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                className="w-full bg-transparent border-none text-slate-200 px-2 py-1 focus:bg-cyan-950/40 focus:outline-none rounded text-xs"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {tableData.length > 30 && (
                  <div className="p-2 text-center text-[10px] text-slate-500 bg-white/[0.01]">
                    Showing 30 of {tableData.length} rows. All rows will be included in the .xlsx download.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
