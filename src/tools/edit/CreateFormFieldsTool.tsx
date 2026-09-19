import React, { useState, useEffect, useRef } from 'react';
import { 
  FormInput, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles, 
  Type, 
  CheckSquare, 
  FileSignature, 
  Layers 
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface CreateFormFieldsToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

interface PlacedField {
  id: string;
  name: string;
  type: 'text' | 'checkbox' | 'signature';
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export const CreateFormFieldsTool: React.FC<CreateFormFieldsToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [fields, setFields] = useState<PlacedField[]>([]);
  const [selectedFieldType, setSelectedFieldType] = useState<'text' | 'checkbox' | 'signature'>('text');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [savedBlob, setSavedBlob] = useState<Blob | null>(null);

  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (preloadedFile) handleFileSelected(preloadedFile);
  }, [preloadedFile]);

  useEffect(() => {
    if (file) renderPage(file, currentPage);
  }, [file, currentPage]);

  useEffect(() => {
    redrawOverlay();
  }, [fields, currentPage]);

  const handleFileSelected = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setFields([]);
    setSavedBlob(null);
    sfx.playClick();

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
    } catch (err) {
      console.error('PDF load error:', err);
    }
  };

  const renderPage = async (f: File, pageNum: number) => {
    try {
      const buffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.2 });

      const pdfCanvas = pdfCanvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      if (!pdfCanvas || !overlayCanvas) return;

      pdfCanvas.width = viewport.width;
      pdfCanvas.height = viewport.height;
      overlayCanvas.width = viewport.width;
      overlayCanvas.height = viewport.height;

      const ctx = pdfCanvas.getContext('2d');
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
      redrawOverlay();
    } catch (err) {
      console.error('Render error:', err);
    }
  };

  const redrawOverlay = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    fields
      .filter((f) => f.page === currentPage)
      .forEach((f) => {
        // Draw Field Bounding Box
        ctx.fillStyle = f.type === 'text' ? 'rgba(59, 130, 246, 0.15)' : f.type === 'checkbox' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(168, 85, 247, 0.15)';
        ctx.fillRect(f.x, f.y, f.width, f.height);
        
        ctx.strokeStyle = f.type === 'text' ? '#3b82f6' : f.type === 'checkbox' ? '#10b981' : '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(f.x, f.y, f.width, f.height);

        // Draw Field Label Tag
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(f.x, f.y - 18, ctx.measureText(f.name).width + 12, 18);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(f.name, f.x + 6, f.y - 5);
      });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = overlayCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = selectedFieldType === 'checkbox' ? 24 : selectedFieldType === 'signature' ? 180 : 160;
    const height = selectedFieldType === 'checkbox' ? 24 : selectedFieldType === 'signature' ? 50 : 30;

    const newField: PlacedField = {
      id: `field_${Date.now()}`,
      name: `${selectedFieldType}_field_${fields.length + 1}`,
      type: selectedFieldType,
      x: clickX,
      y: clickY,
      width,
      height,
      page: currentPage,
    };

    setFields((prev) => [...prev, newField]);
    sfx.playClick();
  };

  const handleBakeAcroForm = async () => {
    if (!file || fields.length === 0) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const form = pdfDoc.getForm();
      const pages = pdfDoc.getPages();

      const canvas = pdfCanvasRef.current;
      const viewportWidth = canvas ? canvas.width : 595;
      const viewportHeight = canvas ? canvas.height : 842;

      fields.forEach((f) => {
        const page = pages[f.page - 1];
        if (!page) return;
        const { width, height } = page.getSize();

        const scaleX = width / viewportWidth;
        const scaleY = height / viewportHeight;

        const pdfX = f.x * scaleX;
        const pdfWidth = f.width * scaleX;
        const pdfHeight = f.height * scaleY;
        const pdfY = height - (f.y * scaleY) - pdfHeight;

        if (f.type === 'text') {
          const textField = form.createTextField(f.name);
          textField.addToPage(page, {
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
            borderWidth: 1,
            borderColor: rgb(0.2, 0.4, 0.8),
            backgroundColor: rgb(0.95, 0.97, 1.0),
          });
        } else if (f.type === 'checkbox') {
          const checkBox = form.createCheckBox(f.name);
          checkBox.addToPage(page, {
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
            borderWidth: 1,
            borderColor: rgb(0.1, 0.6, 0.3),
            backgroundColor: rgb(0.95, 1.0, 0.95),
          });
        } else if (f.type === 'signature') {
          // Signature placeholder text box
          const sigField = form.createTextField(f.name);
          sigField.addToPage(page, {
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
            borderWidth: 1,
            borderColor: rgb(0.6, 0.2, 0.8),
            backgroundColor: rgb(0.98, 0.95, 1.0),
          });
        }
      });

      const savedBytes = await pdfDoc.save();
      const blob = new Blob([savedBytes as any], { type: 'application/pdf' });
      setSavedBlob(blob);

      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('AcroForm generation error:', err);
      alert('Failed to generate interactive form.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!savedBlob || !file) return;
    sfx.playClick();
    const url = URL.createObjectURL(savedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '-interactive-form.pdf');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-blue-500/30 hover:border-blue-400/60 rounded-3xl bg-blue-950/10 cursor-pointer transition-all hover:bg-blue-950/20 group">
          <FormInput className="w-14 h-14 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF to Add Interactive Form Fields</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Click anywhere on the document canvas to place fillable text boxes, checkboxes, and signature blocks.
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
        <div className="space-y-4">
          {/* Top Control Bar */}
          <div className="p-3 rounded-2xl bg-[#0c101c] border border-white/10 flex items-center justify-between text-xs font-fira">
            {/* Field Type Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">Tool:</span>
              {[
                { id: 'text', label: 'Text Field', icon: Type },
                { id: 'checkbox', label: 'Checkbox', icon: CheckSquare },
                { id: 'signature', label: 'Signature Block', icon: FileSignature },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedFieldType(t.id as any);
                      sfx.playClick();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      selectedFieldType === t.id
                        ? 'bg-blue-500 text-black font-bold shadow-lg shadow-blue-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFields((prev) => prev.slice(0, -1));
                  sfx.playClick();
                }}
                disabled={fields.length === 0}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 hover:text-white cursor-pointer disabled:opacity-30"
              >
                Undo Field ({fields.length})
              </button>

              {!savedBlob ? (
                <button
                  onClick={handleBakeAcroForm}
                  disabled={fields.length === 0 || isProcessing}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-black font-bold font-fira text-xs shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Fillable Form ({fields.length})
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Fillable PDF
                </button>
              )}
            </div>
          </div>

          {/* Interactive Canvas Stage */}
          <div className="flex justify-center p-4 rounded-2xl bg-black/60 border border-white/10 overflow-auto max-h-[520px]">
            <div className="relative border border-white/20 shadow-2xl rounded bg-white select-none">
              <canvas ref={pdfCanvasRef} className="block pointer-events-none" />
              <canvas
                ref={overlayCanvasRef}
                onClick={handleCanvasClick}
                className="absolute inset-0 cursor-crosshair touch-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};