import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  Eye, 
  Layers 
} from 'lucide-react';
import { renderAsync } from 'docx-preview';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface WordToPdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const WordToPdfTool: React.FC<WordToPdfToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (preloadedFile && preloadedFile.name.endsWith('.docx')) {
      loadDocx(preloadedFile);
    }
  }, [preloadedFile]);

  const loadDocx = async (f: File) => {
    try {
      setFile(f);
      setIsRendering(true);
      sfx.playScan();

      const arrayBuffer = await f.arrayBuffer();
      if (previewContainerRef.current) {
        previewContainerRef.current.innerHTML = '';
        await renderAsync(arrayBuffer, previewContainerRef.current, undefined, {
          className: 'docx-rendered-preview',
          inWrapper: false,
        });
      }
      sfx.playSuccess();
    } catch (err) {
      sfx.playError();
      console.error('DOCX render error:', err);
      alert('Could not render DOCX preview.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleConvertToPdf = async () => {
    if (!file || !previewContainerRef.current) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const rawText = previewContainerRef.current.innerText || '';
      const paragraphs = rawText.split('\n').filter((p) => p.trim().length > 0);

      const doc = await PDFDocument.create();
      let page = doc.addPage([595, 842]); // Standard A4
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

      let y = 790;

      // Document Title Header
      page.drawText(file.name.replace(/\.[^/.]+$/, ''), {
        x: 50,
        y,
        size: 16,
        font: fontBold,
        color: rgb(0.04, 0.4, 0.8),
      });
      y -= 25;

      page.drawLine({
        start: { x: 50, y: y + 10 },
        end: { x: 545, y: y + 10 },
        thickness: 1,
        color: rgb(0.85, 0.85, 0.85),
      });

      for (const p of paragraphs) {
        if (y < 60) {
          page = doc.addPage([595, 842]);
          y = 790;
        }

        // Word wrap long lines
        const words = p.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = fontRegular.widthOfTextAtSize(testLine, 10);

          if (textWidth > 490) {
            page.drawText(currentLine, { x: 50, y, size: 10, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
            y -= 14;
            currentLine = word;
            if (y < 60) {
              page = doc.addPage([595, 842]);
              y = 790;
            }
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          page.drawText(currentLine, { x: 50, y, size: 10, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
          y -= 18;
        }
      }

      const pdfBytes = await doc.save();
      downloadUint8Array(pdfBytes, `${file.name.replace(/\.[^/.]+$/, '')}.pdf`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Word to PDF compilation failed:', err);
      alert('Failed to compile Word document into PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a Word (.docx) Document</h4>
            <p className="text-xs text-slate-400 mt-1">Converts Microsoft Word files into crisp, standardized vector PDFs.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold font-fira text-xs cursor-pointer shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select .DOCX File</span>
            <input
              type="file"
              accept=".docx"
              onChange={(e) => e.target.files && loadDocx(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* File Metadata Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-[10px] text-slate-400 font-fira">
                  {(file.size / 1024).toFixed(1)} KB • Word Document
                </p>
              </div>
            </div>

            <label className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-fira text-slate-300 cursor-pointer transition-colors">
              <span>Change Document</span>
              <input type="file" accept=".docx" onChange={(e) => e.target.files && loadDocx(e.target.files[0])} className="hidden" />
            </label>
          </div>

          {/* Rendered Live HTML Preview */}
          <div className="relative rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-2xl p-6 max-h-[380px] overflow-y-auto">
            {isRendering && (
              <div className="py-20 flex flex-col items-center justify-center space-y-2 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <p className="text-xs font-fira">Parsing DOCX XML structures...</p>
              </div>
            )}
            <div ref={previewContainerRef} className="prose prose-sm max-w-none text-xs" />
          </div>

        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Client-side Word XML unbundling • Zero cloud transfer</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleConvertToPdf}
            disabled={!file || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold font-fira text-xs shadow-lg shadow-blue-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Compiling PDF...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" /> PDF Saved!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Convert to PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};