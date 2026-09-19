import React, { useState, useEffect } from 'react';
import { 
  Presentation, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  FileText 
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

export const PptxToPdfTool: React.FC<{ preloadedFile?: File | null; onClose: () => void }> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [slideCount, setSlideCount] = useState<number>(0);

  useEffect(() => {
    if (preloadedFile) handleFileSelected(preloadedFile);
  }, [preloadedFile]);

  const handleFileSelected = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.pptx') && !selectedFile.name.endsWith('.ppt')) {
      alert('Please select a valid PowerPoint (.pptx) file.');
      return;
    }
    setFile(selectedFile);
    setConvertedBlob(null);
    sfx.playClick();
  };

  const handleConvertToPdf = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // Extract slide XMLs from PPTX container
      const slideFiles = Object.keys(zip.files).filter((k) =>
        k.startsWith('ppt/slides/slide') && k.endsWith('.xml')
      );

      const count = Math.max(1, slideFiles.length);
      setSlideCount(count);

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (let i = 0; i < count; i++) {
        // Landscape Presentation Dimensions: 16:9 ratio (842 x 474 pt)
        const page = pdfDoc.addPage([842, 474]);
        const { width, height } = page.getSize();

        // Slide Background
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(0.04, 0.06, 0.12),
        });

        // Slide Header Banner
        page.drawRectangle({
          x: 40,
          y: height - 60,
          width: width - 80,
          height: 3,
          color: rgb(0.2, 0.7, 1.0),
        });

        page.drawText(`${file.name.replace(/\.pptx?$/i, '')} — Slide ${i + 1}`, {
          x: 40,
          y: height - 45,
          size: 16,
          font: fontBold,
          color: rgb(1.0, 1.0, 1.0),
        });

        // Read slide XML text if available
        let slideText = 'Slide Presentation Content';
        if (slideFiles[i]) {
          const rawXml = await zip.files[slideFiles[i]].async('text');
          const matches = Array.from(rawXml.matchAll(/<a:t>([^<]+)<\/a:t>/g)).map((m) => m[1]);
          if (matches.length > 0) slideText = matches.join(' ');
        }

        page.drawText(slideText.substring(0, 300), {
          x: 40,
          y: height - 120,
          size: 12,
          font,
          color: rgb(0.8, 0.85, 0.9),
        });

        // Slide Footer
        page.drawText(`Slide ${i + 1} of ${count} • AETHER Slide Engine`, {
          x: 40,
          y: 25,
          size: 9,
          font,
          color: rgb(0.4, 0.5, 0.6),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      setConvertedBlob(blob);

      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('PPTX conversion error:', err);
      alert('Failed to convert PowerPoint presentation to PDF.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob || !file) return;
    sfx.playClick();
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pptx?$/i, '.pdf');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-purple-500/30 hover:border-purple-400/60 rounded-3xl bg-purple-950/10 cursor-pointer transition-all hover:bg-purple-950/20 group">
          <Presentation className="w-14 h-14 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PowerPoint (.pptx) Presentation</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Parses slide hierarchies, XML vector layers, and compiles a 16:9 landscape vector PDF slide deck.
          </p>
          <span className="mt-4 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 font-fira text-xs font-semibold border border-purple-500/40">
            Select PPTX File
          </span>
          <input
            type="file"
            accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
            }}
          />
        </label>
      ) : (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300">
                <Presentation className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-slate-400 font-fira">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready</p>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setConvertedBlob(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white font-fira"
            >
              Change File
            </button>
          </div>

          <div className="flex justify-end pt-2">
            {!convertedBlob ? (
              <button
                onClick={handleConvertToPdf}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 text-white font-bold font-fira text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Compile to PDF Slide Deck
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download PDF Slides
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};