import React, { useState, useEffect } from 'react';
import { 
  Stamp, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  Eye,
  Sliders,
  Palette
} from 'lucide-react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface WatermarkPdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { name: 'Red / Alert', rgb: [0.88, 0.2, 0.2] as [number, number, number], hex: '#e11d48' },
  { name: 'Cyber Cyan', rgb: [0.02, 0.71, 0.83] as [number, number, number], hex: '#06b6d4' },
  { name: 'Dark Slate', rgb: [0.2, 0.25, 0.33] as [number, number, number], hex: '#334155' },
  { name: 'Emerald', rgb: [0.06, 0.73, 0.5] as [number, number, number], hex: '#10b981' },
  { name: 'Amber Gold', rgb: [0.96, 0.62, 0.04] as [number, number, number], hex: '#f59e0b' },
];

export const WatermarkPdfTool: React.FC<WatermarkPdfToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.25);
  const [rotation, setRotation] = useState(45);
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [applyTo, setApplyTo] = useState<'all' | 'first' | 'odd' | 'even'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      loadPdf(preloadedFile);
    }
  }, [preloadedFile]);

  const loadPdf = async (f: File) => {
    try {
      setFile(f);
      sfx.playScan();
      const buffer = await f.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
      sfx.playSuccess();
    } catch (err) {
      sfx.playError();
      console.error('Error loading PDF for watermark:', err);
      alert('Could not read PDF. Please provide a valid file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadPdf(e.target.files[0]);
    }
  };

  const handleApplyWatermark = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const buffer = await fileToUint8Array(file);
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const totalPages = doc.getPageCount();

      for (let i = 0; i < totalPages; i++) {
        const pageNum = i + 1;
        if (applyTo === 'first' && pageNum !== 1) continue;
        if (applyTo === 'odd' && pageNum % 2 === 0) continue;
        if (applyTo === 'even' && pageNum % 2 !== 0) continue;

        const page = doc.getPage(i);
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        page.drawText(watermarkText, {
          x: width / 2 - textWidth / 2,
          y: height / 2 - textHeight / 2,
          size: fontSize,
          font,
          color: rgb(selectedColor.rgb[0], selectedColor.rgb[1], selectedColor.rgb[2]),
          opacity: opacity,
          rotate: degrees(rotation),
        });
      }

      const outputBytes = await doc.save();
      downloadUint8Array(outputBytes, `watermarked_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Watermark application error:', err);
      alert('Failed to stamp watermark onto PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400">
            <Stamp className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF to Watermark</h4>
            <p className="text-xs text-slate-400 mt-1">Stamp confidential labels, copyrights, or company tags across pages.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF File</span>
            <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Watermark Configuration Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Watermark Text Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-fira font-semibold text-slate-300">Watermark Text</label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="e.g. CONFIDENTIAL, DRAFT, COPY..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white font-fira text-sm focus:outline-none focus:border-cyan-500"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {['CONFIDENTIAL', 'DRAFT', 'ORIGINAL', 'COPY', 'PRIVATE'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      sfx.playHover();
                      setWatermarkText(preset);
                    }}
                    className="text-[10px] font-fira px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-cyan-300 transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div className="space-y-1.5">
              <label className="text-xs font-fira font-semibold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" /> Color Tone
              </label>
              <div className="flex items-center gap-2">
                {COLOR_PRESETS.map((col) => (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => {
                      sfx.playHover();
                      setSelectedColor(col);
                    }}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                    className={`w-7 h-7 rounded-lg transition-transform cursor-pointer ${
                      selectedColor.name === col.name
                        ? 'ring-2 ring-white scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Sliders: Opacity, Size, Rotation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div>
                <div className="flex justify-between text-[11px] font-fira text-slate-400 mb-1">
                  <span>Opacity</span>
                  <span className="text-white font-bold">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.9"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-fira text-slate-400 mb-1">
                  <span>Size</span>
                  <span className="text-white font-bold">{fontSize}pt</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-fira text-slate-400 mb-1">
                  <span>Angle</span>
                  <span className="text-white font-bold">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  step="15"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            {/* Target Pages Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-fira font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Apply To Pages
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'all', label: 'All Pages' },
                  { id: 'first', label: 'Page 1 Only' },
                  { id: 'odd', label: 'Odd Pages' },
                  { id: 'even', label: 'Even Pages' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      sfx.playHover();
                      setApplyTo(opt.id as any);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-fira transition-all cursor-pointer ${
                      applyTo === opt.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: Real-Time Live Sheet Simulation Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.02] border border-white/10 relative overflow-hidden">
            <div className="text-[10px] font-fira text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" /> Live Simulation
            </div>

            {/* Simulated Sheet */}
            <div className="w-48 h-64 rounded-xl bg-white shadow-2xl relative overflow-hidden flex items-center justify-center p-4 border border-slate-300">
              
              {/* Simulated Document Lines */}
              <div className="w-full space-y-2 opacity-25">
                <div className="w-3/4 h-2 bg-slate-400 rounded" />
                <div className="w-full h-1.5 bg-slate-300 rounded" />
                <div className="w-full h-1.5 bg-slate-300 rounded" />
                <div className="w-5/6 h-1.5 bg-slate-300 rounded" />
                <div className="w-full h-1.5 bg-slate-300 rounded" />
                <div className="w-4/5 h-1.5 bg-slate-300 rounded" />
              </div>

              {/* Watermark Layer Overlay */}
              <div
                style={{
                  transform: `rotate(${rotation}deg)`,
                  color: selectedColor.hex,
                  opacity: opacity,
                  fontSize: `${fontSize * 0.35}px`,
                }}
                className="absolute font-black tracking-widest text-center uppercase whitespace-nowrap pointer-events-none transition-transform duration-200"
              >
                {watermarkText || 'WATERMARK'}
              </div>
            </div>

            <p className="text-[11px] font-fira text-slate-400 mt-4 text-center">
              {file.name} • {pageCount} pages
            </p>
          </div>

        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Vector font embedding • Zero raster blur</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-fira transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyWatermark}
            disabled={!file || !watermarkText.trim() || isProcessing}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Stamping Watermark...</span>
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Watermarked & Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Apply & Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};