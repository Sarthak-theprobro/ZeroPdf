import React, { useState, useEffect, useRef } from 'react';
import { 
  Type, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  Plus, 
  Trash2, 
  Move,
  Palette
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface TextAnnotation {
  id: string;
  pageIndex: number;
  text: string;
  x: number; // canvas coordinates
  y: number;
  fontSize: number;
  fontFamily: 'Helvetica' | 'TimesRoman' | 'Courier';
  color: [number, number, number]; // RGB 0-1
  whiteoutBackground: boolean;
}

export const EditPdfTextTool: React.FC<{ preloadedFile?: File | null; onClose: () => void }> = ({ 
  preloadedFile, 
  onClose 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0); // 0-based
  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pdfScale, setPdfScale] = useState(1.2);
  const [pageViewport, setPageViewport] = useState<{ width: number; height: number }>({ width: 600, height: 800 });

  useEffect(() => {
    if (preloadedFile) {
      loadDocument(preloadedFile);
    }
  }, [preloadedFile]);

  const loadDocument = async (f: File) => {
    try {
      setFile(f);
      sfx.playScan();
      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPageCount(pdf.numPages);
      await renderPage(pdf, 1);
      sfx.playSuccess();
    } catch (err) {
      sfx.playError();
      console.error('Error loading PDF for text editing:', err);
      alert('Could not render document text layer.');
    }
  };

  const renderPage = async (pdfDoc: any, pageNum: number) => {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: pdfScale });
    setPageViewport({ width: viewport.width, height: viewport.height });

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      await page.render({ canvasContext: ctx, viewport }).promise;
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Don't add if clicking an existing input
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }

    sfx.playClick();
    const newAnnotation: TextAnnotation = {
      id: `text-${Date.now()}`,
      pageIndex: currentPage,
      text: 'New Text',
      x,
      y,
      fontSize: 14,
      fontFamily: 'Helvetica',
      color: [0, 0, 0],
      whiteoutBackground: true,
    };

    setAnnotations((prev) => [...prev, newAnnotation]);
    setActiveAnnotationId(newAnnotation.id);
  };

  const updateAnnotation = (id: string, updates: Partial<TextAnnotation>) => {
    setAnnotations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeAnnotation = (id: string) => {
    sfx.playClick();
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveDocument = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const buffer = await fileToUint8Array(file);
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      const helveticaFont = await doc.embedFont(StandardFonts.Helvetica);
      const timesFont = await doc.embedFont(StandardFonts.TimesRoman);
      const courierFont = await doc.embedFont(StandardFonts.Courier);

      for (const ann of annotations) {
        const page = doc.getPage(ann.pageIndex);
        const { width: pdfWidth, height: pdfHeight } = page.getSize();

        // Convert UI canvas coordinates to PDF point coordinates (PDF origin is bottom-left)
        const scaleX = pdfWidth / pageViewport.width;
        const scaleY = pdfHeight / pageViewport.height;

        const pdfX = ann.x * scaleX;
        const pdfY = pdfHeight - (ann.y * scaleY) - (ann.fontSize * 0.8);

        let chosenFont = helveticaFont;
        if (ann.fontFamily === 'TimesRoman') chosenFont = timesFont;
        if (ann.fontFamily === 'Courier') chosenFont = courierFont;

        const textWidth = chosenFont.widthOfTextAtSize(ann.text, ann.fontSize);
        const textHeight = chosenFont.heightAtSize(ann.fontSize);

        // Optional whiteout patch behind text to cover original typo
        if (ann.whiteoutBackground) {
          page.drawRectangle({
            x: pdfX - 2,
            y: pdfY - 2,
            width: textWidth + 4,
            height: textHeight + 4,
            color: rgb(1, 1, 1),
          });
        }

        page.drawText(ann.text, {
          x: pdfX,
          y: pdfY,
          size: ann.fontSize,
          font: chosenFont,
          color: rgb(ann.color[0], ann.color[1], ann.color[2]),
        });
      }

      const outputBytes = await doc.save();
      downloadUint8Array(outputBytes, `edited_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Text edit save failed:', err);
      alert('Failed to save edited PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const activeAnnotation = annotations.find((a) => a.id === activeAnnotationId);

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400">
            <Type className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF for In-Place Text Editing</h4>
            <p className="text-xs text-slate-400 mt-1">Click anywhere on the document to edit typos, insert text, or add callouts.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold font-fira text-xs cursor-pointer shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF File</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && loadDocument(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Active Tool Inspector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-fira">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Page {currentPage + 1} of {pageCount}</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400">{annotations.length} In-Place Text Items</span>
            </div>

            {activeAnnotation ? (
              <div className="flex items-center gap-3">
                <select
                  value={activeAnnotation.fontFamily}
                  onChange={(e) => updateAnnotation(activeAnnotation.id, { fontFamily: e.target.value as any })}
                  className="px-2 py-1 rounded bg-white/10 text-white border border-white/10 text-xs"
                >
                  <option value="Helvetica">Helvetica</option>
                  <option value="TimesRoman">Times New Roman</option>
                  <option value="Courier">Courier</option>
                </select>

                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Size:</span>
                  <input
                    type="number"
                    min="8"
                    max="72"
                    value={activeAnnotation.fontSize}
                    onChange={(e) => updateAnnotation(activeAnnotation.id, { fontSize: parseInt(e.target.value) || 12 })}
                    className="w-14 px-1.5 py-0.5 rounded bg-white/10 text-white text-center"
                  />
                </div>

                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeAnnotation.whiteoutBackground}
                    onChange={(e) => updateAnnotation(activeAnnotation.id, { whiteoutBackground: e.target.checked })}
                    className="w-3.5 h-3.5 accent-blue-500"
                  />
                  <span>Whiteout Typo</span>
                </label>
              </div>
            ) : (
              <span className="text-slate-500 italic">Click anywhere on the document canvas below to place text</span>
            )}
          </div>

          {/* Interactive Document Canvas Area */}
          <div className="p-2 rounded-2xl bg-black/60 border border-white/10 flex justify-center max-h-[440px] overflow-y-auto">
            <div
              ref={containerRef}
              onClick={handleCanvasClick}
              className="relative cursor-crosshair shadow-2xl rounded overflow-hidden"
              style={{ width: pageViewport.width, height: pageViewport.height }}
            >
              <canvas ref={canvasRef} className="pointer-events-none" />

              {/* Placed Interactive Text Overlays */}
              {annotations
                .filter((ann) => ann.pageIndex === currentPage)
                .map((ann) => (
                  <div
                    key={ann.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAnnotationId(ann.id);
                    }}
                    style={{
                      left: `${ann.x}px`,
                      top: `${ann.y}px`,
                    }}
                    className={`absolute flex items-center gap-1.5 p-1 rounded transition-all group ${
                      ann.whiteoutBackground ? 'bg-white text-black' : 'text-black'
                    } ${
                      activeAnnotationId === ann.id
                        ? 'ring-2 ring-blue-500 shadow-xl'
                        : 'border border-dashed border-blue-400/40 hover:border-blue-500'
                    }`}
                  >
                    <input
                      type="text"
                      value={ann.text}
                      onChange={(e) => updateAnnotation(ann.id, { text: e.target.value })}
                      style={{
                        fontSize: `${ann.fontSize}px`,
                        fontFamily: ann.fontFamily,
                      }}
                      className="bg-transparent text-slate-900 focus:outline-none min-w-[60px]"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAnnotation(ann.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-rose-500 hover:text-rose-700 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Vector font mapping • Lossless typography injection</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleSaveDocument}
            disabled={!file || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold font-fira text-xs shadow-lg shadow-blue-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Embedding Text Streams...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Changes Baked & Saved!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Save Edited PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};