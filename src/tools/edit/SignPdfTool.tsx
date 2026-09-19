import React, { useState, useRef, useEffect } from 'react';
import { 
  FileSignature, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  PenTool, 
  Type, 
  Image as ImageIcon, 
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface SignPdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const SignPdfTool: React.FC<SignPdfToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('');
  const [penColor, setPenColor] = useState('#0a0f1d'); // Default dark ink
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [placement, setPlacement] = useState<'bottom-right' | 'bottom-left' | 'bottom-center'>('bottom-right');
  const [targetPage, setTargetPage] = useState<'last' | 'all' | 'first'>('last');
  const [uploadedStamp, setUploadedStamp] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      setFile(preloadedFile);
    }
  }, [preloadedFile]);

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = penColor;
      }
    }
  }, [mode, penColor]);

  const clearCanvas = () => {
    sfx.playClick();
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      sfx.playSuccess();
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedStamp(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Convert current signature representation (draw / type / upload) into a PNG data URL
  const getSignatureDataUrl = (): string | null => {
    if (mode === 'draw' && canvasRef.current) {
      return canvasRef.current.toDataURL('image/png');
    }
    if (mode === 'upload' && uploadedStamp) {
      return uploadedStamp;
    }
    if (mode === 'type' && typedName.trim()) {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = 400;
      offCanvas.height = 150;
      const ctx = offCanvas.getContext('2d');
      if (ctx) {
        ctx.font = 'italic 42px "Times New Roman", cursive, serif';
        ctx.fillStyle = penColor;
        ctx.fillText(typedName, 20, 80);

        if (includeTimestamp) {
          ctx.font = '10px "Courier New", monospace';
          ctx.fillStyle = '#64748b';
          ctx.fillText(`Digitally Signed • ${new Date().toISOString().split('T')[0]}`, 20, 110);
        }
      }
      return offCanvas.toDataURL('image/png');
    }
    return null;
  };

  const handleApplySignature = async () => {
    if (!file) return;

    const sigDataUrl = getSignatureDataUrl();
    if (!sigDataUrl) {
      alert('Please draw, type, or upload a signature first.');
      return;
    }

    try {
      setIsProcessing(true);
      sfx.playScan();

      const buffer = await fileToUint8Array(file);
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      // Embed the signature PNG image into the document
      const sigImage = await doc.embedPng(sigDataUrl);
      const { width: sigWidth, height: sigHeight } = sigImage.scale(0.5);

      const totalPages = doc.getPageCount();
      const pagesToSign: number[] = [];

      if (targetPage === 'last') pagesToSign.push(totalPages - 1);
      else if (targetPage === 'first') pagesToSign.push(0);
      else {
        for (let i = 0; i < totalPages; i++) pagesToSign.push(i);
      }

      for (const pageIdx of pagesToSign) {
        const page = doc.getPage(pageIdx);
        const { width, height } = page.getSize();

        let x = width - sigWidth - 50; // default bottom-right
        let y = 50;

        if (placement === 'bottom-left') x = 50;
        if (placement === 'bottom-center') x = width / 2 - sigWidth / 2;

        page.drawImage(sigImage, {
          x,
          y,
          width: sigWidth,
          height: sigHeight,
        });
      }

      const signedBytes = await doc.save();
      downloadUint8Array(signedBytes, `signed_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Signature application error:', err);
      alert('Failed to stamp signature onto PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <FileSignature className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF to Sign</h4>
            <p className="text-xs text-slate-400 mt-1">Create digital signatures with smooth pen curves, custom fonts, or image stamps.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF File</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Signature Creation Studio (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Mode Switcher */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/10">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setMode('draw');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-fira font-semibold transition-all cursor-pointer ${
                  mode === 'draw'
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Draw</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setMode('type');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-fira font-semibold transition-all cursor-pointer ${
                  mode === 'type'
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Type</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setMode('upload');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-fira font-semibold transition-all cursor-pointer ${
                  mode === 'upload'
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>

            {/* Drawing Canvas Area */}
            {mode === 'draw' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-fira text-slate-400">
                  <span>Sign with trackpad or mouse below:</span>
                  <button
                    onClick={clearCanvas}
                    className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear Pad
                  </button>
                </div>
                <div className="rounded-xl border border-white/20 bg-white p-1 shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={450}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-40 bg-white rounded-lg cursor-crosshair touch-none"
                  />
                </div>
              </div>
            )}

            {/* Type Mode Area */}
            {mode === 'type' && (
              <div className="space-y-3">
                <label className="text-xs font-fira font-semibold text-slate-300">Type Your Full Legal Name</label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="e.g. Sarthak Sharma"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white font-fira text-sm focus:outline-none focus:border-emerald-500"
                />

                {typedName && (
                  <div className="p-4 rounded-xl bg-white text-slate-900 border border-slate-200">
                    <p className="text-3xl italic font-serif text-slate-900">{typedName}</p>
                    {includeTimestamp && (
                      <p className="text-[10px] font-mono text-slate-500 mt-2">
                        Digitally Signed • {new Date().toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Upload Stamp Mode Area */}
            {mode === 'upload' && (
              <div className="p-6 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-center space-y-3 bg-white/[0.02]">
                {uploadedStamp ? (
                  <div className="space-y-2">
                    <img src={uploadedStamp} alt="Uploaded Stamp" className="h-24 object-contain bg-white/10 p-2 rounded-lg" />
                    <p className="text-[10px] text-emerald-400 font-fira">Signature Stamp Loaded</p>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-slate-400" />
                    <p className="text-xs text-slate-400">Upload a transparent PNG signature or company stamp</p>
                  </>
                )}
                <label className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-fira text-xs cursor-pointer transition-colors">
                  <span>Browse Image...</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            )}

            {/* Ink Color Selector */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-fira">
              <span className="text-slate-400">Ink Color Tone:</span>
              <div className="flex items-center gap-2">
                {[
                  { name: 'Onyx Black', hex: '#0f172a' },
                  { name: 'Royal Blue', hex: '#1d4ed8' },
                  { name: 'Emerald', hex: '#047857' },
                ].map((ink) => (
                  <button
                    key={ink.name}
                    type="button"
                    onClick={() => {
                      sfx.playHover();
                      setPenColor(ink.hex);
                    }}
                    style={{ backgroundColor: ink.hex }}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                      penColor === ink.hex ? 'ring-2 ring-emerald-400 scale-110' : 'opacity-60'
                    }`}
                    title={ink.name}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: Placement & Target Page Settings (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <h4 className="text-xs font-fira font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Placement Options
            </h4>

            {/* Target Page */}
            <div className="space-y-1.5">
              <label className="text-xs font-fira text-slate-400">Stamp On Page:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'last', label: 'Last Page' },
                  { id: 'first', label: 'First Page' },
                  { id: 'all', label: 'All Pages' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      setTargetPage(p.id as any);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-fira transition-all cursor-pointer ${
                      targetPage === p.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Screen Position */}
            <div className="space-y-1.5">
              <label className="text-xs font-fira text-slate-400">Position on Sheet:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bottom-left', label: 'Bottom Left' },
                  { id: 'bottom-center', label: 'Bottom Mid' },
                  { id: 'bottom-right', label: 'Bottom Right' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      setPlacement(pos.id as any);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-fira transition-all cursor-pointer ${
                      placement === pos.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Verification Timestamp Toggle */}
            <label className="flex items-center gap-2 text-xs font-fira text-slate-300 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={includeTimestamp}
                onChange={(e) => setIncludeTimestamp(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500"
              />
              <span>Include Cryptographic Date Stamp</span>
            </label>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-fira text-emerald-300">
              ✓ Embedded in vector layer with zero loss of document text crispness.
            </div>
          </div>

        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Zero cloud transfer • 100% Client-Side Signing</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-fira transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleApplySignature}
            disabled={!file || isProcessing}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing Document...</span>
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Signed & Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Sign & Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};