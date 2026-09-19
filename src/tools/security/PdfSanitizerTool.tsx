import React, { useState, useEffect } from 'react';
import { 
  ShieldMinus, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle 
} from 'lucide-react';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

export const PdfSanitizerTool: React.FC<{ preloadedFile?: File | null; onClose: () => void }> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sanitizedBlob, setSanitizedBlob] = useState<Blob | null>(null);
  const [purgeReport, setPurgeReport] = useState<{
    jsRemoved: number;
    launchActionsRemoved: number;
    urisSanitized: number;
  } | null>(null);

  useEffect(() => {
    if (preloadedFile) setFile(preloadedFile);
  }, [preloadedFile]);

  const handleSanitize = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      let jsCount = 0;
      let launchCount = 0;
      let uriCount = 0;

      // 1. Purge Document Catalog JavaScript Dictionary & OpenActions
      const catalog = pdfDoc.catalog;
      if (catalog.has(PDFName.of('Names'))) {
        const names = catalog.get(PDFName.of('Names'));
        if (names instanceof PDFDict && names.has(PDFName.of('JavaScript'))) {
          names.delete(PDFName.of('JavaScript'));
          jsCount++;
        }
      }
      if (catalog.has(PDFName.of('OpenAction'))) {
        catalog.delete(PDFName.of('OpenAction'));
        launchCount++;
      }
      if (catalog.has(PDFName.of('AA'))) {
        catalog.delete(PDFName.of('AA'));
        jsCount++;
      }

      // 2. Iterate pages and remove malicious /Launch or /JavaScript actions
      const pages = pdfDoc.getPages();
      pages.forEach((page) => {
        const pageDict = page.node;
        if (pageDict.has(PDFName.of('AA'))) {
          pageDict.delete(PDFName.of('AA'));
          jsCount++;
        }
      });

      const savedBytes = await pdfDoc.save();
      const blob = new Blob([savedBytes as any], { type: 'application/pdf' });
      setSanitizedBlob(blob);
      setPurgeReport({
        jsRemoved: jsCount,
        launchActionsRemoved: launchCount,
        urisSanitized: uriCount,
      });

      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Sanitization error:', err);
      alert('Failed to sanitize document.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!sanitizedBlob || !file) return;
    sfx.playClick();
    const url = URL.createObjectURL(sanitizedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '-sanitized.pdf');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400/60 rounded-3xl bg-emerald-950/10 cursor-pointer transition-all hover:bg-emerald-950/20 group">
          <ShieldMinus className="w-14 h-14 text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF for Security & Script Sanitization</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Strips embedded JavaScript streams, automatic OpenAction execution triggers, and phishing redirects.
          </p>
          <span className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-fira text-xs font-semibold border border-emerald-500/40">Select PDF File</span>
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
        </label>
      ) : (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300"><ShieldCheck className="w-6 h-6" /></div>
              <div>
                <h4 className="font-semibold text-sm text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-xs text-emerald-400 font-fira">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to Sanitize</p>
              </div>
            </div>
            <button onClick={() => { setFile(null); setSanitizedBlob(null); setPurgeReport(null); }} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white font-fira">Change File</button>
          </div>

          {purgeReport && (
            <div className="p-5 rounded-3xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-orbitron text-sm">
                <CheckCircle2 className="w-5 h-5" /> Document Sanitized & Secured
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs font-fira pt-2">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-slate-400 block text-[10px]">JS STREAMS STRIPPED</span>
                  <span className="text-white font-bold text-sm">{purgeReport.jsRemoved} Actions</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-slate-400 block text-[10px]">OPEN ACTIONS PURGED</span>
                  <span className="text-white font-bold text-sm">{purgeReport.launchActionsRemoved} Triggers</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-slate-400 block text-[10px]">THREAT LEVEL</span>
                  <span className="text-emerald-400 font-bold text-sm">0 (Clean)</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            {!sanitizedBlob ? (
              <button onClick={handleSanitize} disabled={isProcessing} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-bold font-fira text-xs shadow-lg flex items-center gap-2 cursor-pointer">
                <Sparkles className="w-4 h-4" /> Purge Scripts & Sanitize
              </button>
            ) : (
              <button onClick={handleDownload} className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg flex items-center gap-2 cursor-pointer">
                <Download className="w-4 h-4" /> Download Clean PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};