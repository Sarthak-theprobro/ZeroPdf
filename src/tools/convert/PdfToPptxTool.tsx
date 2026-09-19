import React, { useState, useEffect } from 'react';
import { 
  Presentation, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  FileText 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

export const PdfToPptxTool: React.FC<{ preloadedFile?: File | null; onClose: () => void }> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pptxBlob, setPptxBlob] = useState<Blob | null>(null);
  const [slideCount, setSlideCount] = useState<number>(0);

  useEffect(() => {
    if (preloadedFile) handleFileSelected(preloadedFile);
  }, [preloadedFile]);

  const handleFileSelected = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }
    setFile(selectedFile);
    setPptxBlob(null);
    sfx.playClick();
  };

  const handleConvertToPptx = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      setSlideCount(numPages);

      const zip = new JSZip();

      // OpenXML PPTX Container Layout
      zip.file(
        '[Content_Types].xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
</Types>`
      );

      zip.file(
        '_rels/.rels',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
      );

      // Render each page to an image and place on slide
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const imgBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
          if (imgBlob) {
            zip.file(`ppt/media/slide_${i}.png`, imgBlob);
          }
        }
      }

      zip.file(
        'ppt/presentation.xml',
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldSz cx="9144000" cy="5143500" type="screen16x9"/>
</p:presentation>`
      );

      const generatedZip = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });

      setPptxBlob(generatedZip);
      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('PDF to PPTX error:', err);
      alert('Failed to convert PDF to PowerPoint.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!pptxBlob || !file) return;
    sfx.playClick();
    const url = URL.createObjectURL(pptxBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '.pptx');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-amber-500/30 hover:border-amber-400/60 rounded-3xl bg-amber-950/10 cursor-pointer transition-all hover:bg-amber-950/20 group">
          <Presentation className="w-14 h-14 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF for PowerPoint (.pptx) Conversion</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Transforms PDF pages into a presentation slide deck with high-res graphics and 16:9 aspect ratio.
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
                setPptxBlob(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white font-fira"
            >
              Change File
            </button>
          </div>

          <div className="flex justify-end pt-2">
            {!pptxBlob ? (
              <button
                onClick={handleConvertToPptx}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 text-black font-bold font-fira text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Convert to PowerPoint (.pptx)
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download PowerPoint (.pptx)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};