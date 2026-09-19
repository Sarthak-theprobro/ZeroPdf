import React, { useState, useEffect, useRef } from 'react';
import { 
  Feather, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Sliders, 
  RotateCcw,
  Palette,
  FileText,
  FileDown
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

interface HandwritingSimulatorToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

const DEFAULT_TEXT = `The concept of zero-knowledge cryptography allows one party to prove to another that a statement is true, without revealing any information beyond the validity of the statement itself.

In modern distributed networks, verifiable computation and client-side processing guarantee privacy by design. All cryptographic operations remain strictly local to the user's execution environment.`;

export const HandwritingSimulatorTool: React.FC<HandwritingSimulatorToolProps> = ({ preloadedFile, onClose }) => {
  const [text, setText] = useState<string>(DEFAULT_TEXT);
  const [paperType, setPaperType] = useState<'ruled' | 'grid' | 'parchment' | 'plain'>('ruled');
  const [inkColor, setInkColor] = useState<string>('#1e3a8a'); // Royal blue default
  const [fontSize, setFontSize] = useState<number>(20);
  const [jitter, setJitter] = useState<number>(1.2); // Baseline jitter
  const [slant, setSlant] = useState<number>(-3); // Degrees slant
  const [letterSpacing, setLetterSpacing] = useState<number>(1.5);
  const [lineHeight, setLineHeight] = useState<number>(34);
  const [isRendering, setIsRendering] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    renderHandwriting();
  }, [text, paperType, inkColor, fontSize, jitter, slant, letterSpacing, lineHeight]);

  const renderHandwriting = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // A4 ratio (width 800px, height 1130px)
    canvas.width = 800;
    canvas.height = 1130;

    // 1. Draw Paper Background
    if (paperType === 'plain') {
      ctx.fillStyle = '#fcfcfc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (paperType === 'parchment') {
      ctx.fillStyle = '#fbf5e6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Subtle vintage texture noise
      ctx.fillStyle = 'rgba(180, 150, 100, 0.05)';
      for (let i = 0; i < 2000; i++) {
        const rx = Math.random() * canvas.width;
        const ry = Math.random() * canvas.height;
        ctx.fillRect(rx, ry, 2, 2);
      }
    } else if (paperType === 'ruled') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Red left vertical margin line
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(90, 0);
      ctx.lineTo(90, canvas.height);
      ctx.stroke();

      // Blue horizontal lines
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 1;
      for (let y = 100; y < canvas.height - 40; y += lineHeight) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    } else if (paperType === 'grid') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
      ctx.lineWidth = 0.75;
      const gridSize = 25;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // 2. Draw Organic Handwriting Text
    ctx.fillStyle = inkColor;
    ctx.font = `italic ${fontSize}px "Caveat", "Dancing Script", "Segoe Script", "Comic Sans MS", cursive`;

    const startX = paperType === 'ruled' ? 110 : 70;
    const startY = paperType === 'ruled' ? 95 : 80;
    const maxLineWidth = canvas.width - startX - 60;

    const words = text.split(' ');
    let currentX = startX;
    let currentY = startY;

    // Pseudo-random deterministic generator based on word index
    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Handle explicit line breaks
      if (word.includes('\n')) {
        const parts = word.split('\n');
        for (let p = 0; p < parts.length; p++) {
          if (p > 0) {
            currentX = startX;
            currentY += lineHeight;
          }
          drawWordWithJitter(ctx, parts[p], currentX, currentY);
          currentX += ctx.measureText(parts[p]).width + (8 * letterSpacing);
        }
        continue;
      }

      const wordWidth = ctx.measureText(word).width;
      if (currentX + wordWidth > startX + maxLineWidth) {
        currentX = startX;
        currentY += lineHeight;
      }

      if (currentY > canvas.height - 50) break; // End of page

      drawWordWithJitter(ctx, word, currentX, currentY);
      currentX += wordWidth + (7 * letterSpacing);
    }
  };

  const drawWordWithJitter = (
    ctx: CanvasRenderingContext2D,
    word: string,
    x: number,
    y: number
  ) => {
    ctx.save();

    // Word-level baseline wobble
    const wordJitterY = (Math.sin(x * 0.05) + (Math.random() - 0.5)) * jitter;
    const wordSlant = (slant + (Math.random() - 0.5) * 1.5) * (Math.PI / 180);

    ctx.translate(x, y + wordJitterY);
    ctx.transform(1, 0, Math.tan(wordSlant), 1, 0, 0);

    // Letter-by-letter rendering for micro-organic variance
    let letterX = 0;
    for (let c = 0; c < word.length; c++) {
      const char = word[c];
      const charJitterY = (Math.random() - 0.5) * (jitter * 0.6);
      const charScale = 1 + (Math.random() - 0.5) * 0.04;

      ctx.save();
      ctx.translate(letterX, charJitterY);
      ctx.scale(charScale, charScale);
      
      // Variable ink pressure opacity
      const opacity = 0.88 + Math.random() * 0.12;
      ctx.globalAlpha = opacity;
      ctx.fillText(char, 0, 0);
      ctx.restore();

      letterX += ctx.measureText(char).width + (letterSpacing * 0.3);
    }

    ctx.restore();
  };

  const handleExportPdf = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsRendering(true);
      sfx.playScan();

      const imgDataUrl = canvas.toDataURL('image/png');
      const imgBytes = await (await fetch(imgDataUrl)).arrayBuffer();

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4 in points
      const pngImage = await pdfDoc.embedPng(imgBytes);

      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: 595,
        height: 842,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'handwritten-document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate handwritten PDF.');
      sfx.playError();
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Side: Live Canvas Preview */}
        <div className="md:col-span-7 flex flex-col items-center justify-center p-4 rounded-2xl bg-black/50 border border-white/10 relative overflow-hidden">
          <div className="border border-white/20 shadow-2xl rounded-xl overflow-hidden bg-white max-h-[580px] overflow-y-auto">
            <canvas ref={canvasRef} className="block w-full max-w-[440px] h-auto" />
          </div>
          <div className="mt-3 text-[11px] font-fira text-slate-400">
            Rendered with continuous micro-jitter, cursive baseline drift, and ink pressure simulation
          </div>
        </div>

        {/* Right Side: Text Input & Physics Controls */}
        <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Input Text Area */}
            <div>
              <label className="text-xs font-bold text-slate-300 font-orbitron block mb-1">
                Text to Humanize
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-white p-3 text-xs font-fira focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
                placeholder="Type or paste text to convert into organic handwriting..."
              />
            </div>

            {/* Paper Presets */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 font-fira">Paper Style:</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'ruled', label: 'Ruled Lined' },
                  { id: 'grid', label: 'Graph Grid' },
                  { id: 'parchment', label: 'Vintage' },
                  { id: 'plain', label: 'Clean White' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPaperType(p.id as any);
                      sfx.playClick();
                    }}
                    className={`py-1 px-2 rounded-lg text-[11px] font-fira border transition-all cursor-pointer ${
                      paperType === p.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ink Color Selector */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 font-fira">Pen Ink Color:</span>
              <div className="flex items-center gap-3">
                {[
                  { id: '#1e3a8a', label: 'Royal Blue', color: 'bg-blue-700' },
                  { id: '#09090b', label: 'Gel Black', color: 'bg-zinc-950 border border-white/30' },
                  { id: '#991b1b', label: 'Crimson', color: 'bg-red-700' },
                  { id: '#065f46', label: 'Emerald', color: 'bg-emerald-800' },
                ].map((ink) => (
                  <button
                    key={ink.id}
                    onClick={() => {
                      setInkColor(ink.id);
                      sfx.playClick();
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-fira border transition-all cursor-pointer ${
                      inkColor === ink.id
                        ? 'border-cyan-400 bg-white/10 text-white font-bold'
                        : 'border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${ink.color}`} />
                    {ink.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hand Variance Parameters */}
            <div className="space-y-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs font-fira">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Hand Jitter / Tremor</span>
                <span className="text-cyan-300 font-bold">{jitter}x</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.2"
                value={jitter}
                onChange={(e) => setJitter(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400">Handwriting Slant</span>
                <span className="text-cyan-300 font-bold">{slant}°</span>
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="1"
                value={slant}
                onChange={(e) => setSlant(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>

          {/* Action Export Button */}
          <div className="pt-2 border-t border-white/10 flex justify-end">
            <button
              onClick={handleExportPdf}
              disabled={isRendering}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-bold font-fira text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Feather className="w-4 h-4" />
              Download Handwritten PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
