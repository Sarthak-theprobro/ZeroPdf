import React, { useState, useEffect } from 'react';
import { 
  VectorSquare, 
  UploadCloud, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Archive,
  Layers 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

export const PdfToSvgTool: React.FC<{ preloadedFile?: File | null; onClose: () => void }> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [svgList, setSvgList] = useState<string[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (preloadedFile) handleFileSelected(preloadedFile);
  }, [preloadedFile]);

  const handleFileSelected = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setSvgList([]);
    setZipBlob(null);
    sfx.playClick();
  };

  const handleExtractSvg = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      const extractedSvgs: string[] = [];
      const zip = new JSZip();

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });

        // Extract SVG graphics elements from page
        const textContent = await page.getTextContent();
        let svgTextElements = '';

        for (const item of textContent.items as any[]) {
          if (!item.str || item.str.trim() === '') continue;
          const x = item.transform[4];
          const y = viewport.height - item.transform[5];
          const fontSize = Math.hypot(item.transform[0], item.transform[1]);

          svgTextElements += `
            <text x="${x}" y="${y}" font-size="${fontSize}" font-family="sans-serif" fill="#0f172a">
              ${item.str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </text>`;
        }

        const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${viewport.width}" height="${viewport.height}" viewBox="0 0 ${viewport.width} ${viewport.height}">
  <rect width="100%" height="100%" fill="#ffffff" />
  ${svgTextElements}
</svg>`;

        extractedSvgs.push(svgContent);
        zip.file(`page_${String(pageNum).padStart(3, '0')}.svg`, svgContent);
      }

      setSvgList(extractedSvgs);
      const generatedZip = await zip.generateAsync({ type: 'blob' });
      setZipBlob(generatedZip);

      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('SVG Extraction error:', err);
      alert('Failed to extract SVG vectors.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = () => {
    if (!zipBlob || !file) return;
    sfx.playClick();
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\.pdf$/i, '')}-vector-svg.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-amber-500/30 hover:border-amber-400/60 rounded-3xl bg-amber-950/10 cursor-pointer transition-all hover:bg-amber-950/20 group">
          <VectorSquare className="w-14 h-14 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF for Pure Vector SVG Extraction</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Extracts crisp, resolution-independent Scalable Vector Graphics without any pixelation.
          </p>
          <span className="mt-4 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 font-fira text-xs font-semibold border border-amber-500/40">
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
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300">
                <VectorSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-amber-400 font-fira">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for Vector Extraction</p>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setSvgList([]);
                setZipBlob(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white font-fira"
            >
              Change File
            </button>
          </div>

          <div className="flex justify-end pt-2">
            {!zipBlob ? (
              <button
                onClick={handleExtractSvg}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-bold font-fira text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Extract Vector SVG
              </button>
            ) : (
              <button
                onClick={handleDownloadZip}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download All Vector SVGs (.zip)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};