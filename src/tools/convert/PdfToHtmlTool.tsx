import React, { useState, useEffect } from 'react';
import { 
  Code, 
  UploadCloud, 
  Download, 
  Eye, 
  Sparkles, 
  Loader2, 
  FileText,
  Copy,
  Check,
  CheckCircle2
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface PdfToHtmlToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const PdfToHtmlTool: React.FC<PdfToHtmlToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [copied, setCopied] = useState(false);

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
    setHtmlContent('');
    sfx.playClick();
  };

  const processPdfToHtml = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      let pagesHtml = '';

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];

        let pageElements = '';
        for (const item of items) {
          if (!item.str || item.str.trim() === '') continue;
          const x = Math.round(item.transform[4]);
          const y = Math.round(viewport.height - item.transform[5]); // convert from bottom-left to top-left
          const fontSize = Math.round(Math.hypot(item.transform[0], item.transform[1]));

          const safeText = item.str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

          pageElements += `
            <div style="position: absolute; left: ${x}px; top: ${y - fontSize}px; font-size: ${fontSize}px; white-space: pre; line-height: 1;">
              ${safeText}
            </div>`;
        }

        pagesHtml += `
          <div class="pdf-page" style="position: relative; width: ${viewport.width}px; height: ${viewport.height}px; margin: 24px auto; background: #ffffff; color: #0f172a; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border-radius: 8px; overflow: hidden; page-break-after: always;">
            ${pageElements}
            <div class="page-footer" style="position: absolute; bottom: 12px; right: 20px; font-size: 10px; color: #94a3b8; font-family: monospace;">
              Page ${pageNum} of ${numPages}
            </div>
          </div>`;
      }

      const fullDocumentHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${file.name.replace(/\.pdf$/i, '')} — Web Edition</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0b0f19;
      color: #f8fafc;
      padding: 30px 10px;
    }
    .header-bar {
      max-width: 800px;
      margin: 0 auto 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: #1e293b;
      border-radius: 12px;
      font-size: 13px;
    }
    .header-bar h1 { font-size: 15px; font-weight: 600; color: #38bdf8; }
    @media print {
      body { background: #fff; padding: 0; }
      .header-bar { display: none; }
      .pdf-page { margin: 0; box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <h1>${file.name}</h1>
    <span>Exported with AETHER PDF Workstation</span>
  </div>
  ${pagesHtml}
</body>
</html>`;

      setHtmlContent(fullDocumentHtml);
      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('HTML conversion error:', err);
      alert('Failed to convert PDF to HTML.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!htmlContent || !file) return;
    sfx.playClick();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '.html');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-amber-500/30 hover:border-amber-400/60 rounded-3xl bg-amber-950/10 cursor-pointer transition-all hover:bg-amber-950/20 group">
          <Code className="w-14 h-14 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF for Webpage (.html) Conversion</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Converts PDF into a standalone, searchable, responsive HTML5 webpage with exact visual positioning.
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
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300">
                <Code className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-slate-400 font-fira">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFile(null);
                  setHtmlContent('');
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white font-fira"
              >
                Change File
              </button>

              {!htmlContent ? (
                <button
                  onClick={processPdfToHtml}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-bold font-fira text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Compile to HTML5
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold font-fira text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .html
                </button>
              )}
            </div>
          </div>

          {/* HTML Isolated IFrame Preview */}
          {htmlContent && (
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-white shadow-2xl">
              <div className="px-4 py-2 bg-slate-900 border-b border-white/10 flex items-center justify-between text-xs font-fira">
                <span className="text-amber-400 font-bold">Live Standalone HTML Webpage Preview</span>
                <span className="text-slate-400 text-[10px]">Selectable Text & CSS Layout Active</span>
              </div>
              <iframe
                srcDoc={htmlContent}
                title="HTML Preview"
                className="w-full h-[480px] border-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
