import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  Search, 
  FileLock, 
  Layers,
  Key
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface FingerprintPdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

// Zero-width characters for binary encoding: '0' -> \u200B (ZWSP), '1' -> \u200C (ZWNJ)
const ZW_ZERO = '\u200B';
const ZW_ONE = '\u200C';
const ZW_DELIM = '\uFEFF';

export const FingerprintPdfTool: React.FC<FingerprintPdfToolProps> = ({ preloadedFile, onClose }) => {
  const [activeMode, setActiveMode] = useState<'embed' | 'inspect'>('embed');
  const [file, setFile] = useState<File | null>(null);
  const [recipientId, setRecipientId] = useState<string>('investor-alpha@sequoia-holdings.com');
  const [classification, setClassification] = useState<string>('STRICTLY CONFIDENTIAL');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Embed state
  const [fingerprintedBlob, setFingerprintedBlob] = useState<Blob | null>(null);

  // Inspect state
  const [inspectedResult, setInspectedResult] = useState<{
    found: boolean;
    recipientId?: string;
    timestamp?: string;
    classification?: string;
    hash?: string;
  } | null>(null);

  useEffect(() => {
    if (preloadedFile) {
      setFile(preloadedFile);
      sfx.playClick();
    }
  }, [preloadedFile]);

  // Encode string into zero-width unicode binary sequence
  const encodeStegoString = (str: string): string => {
    let binary = '';
    for (let i = 0; i < str.length; i++) {
      const binChar = str.charCodeAt(i).toString(2).padStart(8, '0');
      binary += binChar;
    }
    return (
      ZW_DELIM +
      binary
        .split('')
        .map((b) => (b === '1' ? ZW_ONE : ZW_ZERO))
        .join('') +
      ZW_DELIM
    );
  };

  // Decode zero-width unicode sequence back to string
  const decodeStegoString = (text: string): string | null => {
    const startIdx = text.indexOf(ZW_DELIM);
    if (startIdx === -1) return null;

    const endIdx = text.indexOf(ZW_DELIM, startIdx + 1);
    if (endIdx === -1) return null;

    const zwContent = text.substring(startIdx + 1, endIdx);
    let binary = '';

    for (let i = 0; i < zwContent.length; i++) {
      if (zwContent[i] === ZW_ONE) binary += '1';
      else if (zwContent[i] === ZW_ZERO) binary += '0';
    }

    if (binary.length % 8 !== 0) return null;

    let result = '';
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.substr(i, 8);
      result += String.fromCharCode(parseInt(byte, 2));
    }

    return result;
  };

  const handleEmbedFingerprint = async () => {
    if (!file || !recipientId.trim()) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const timestamp = new Date().toISOString();
      const payloadObj = {
        recipient: recipientId.trim(),
        time: timestamp,
        tag: classification,
      };
      const jsonPayload = JSON.stringify(payloadObj);
      const stegoZeroWidth = encodeStegoString(jsonPayload);

      // Layer 1: Inject zero-width invisible text overlay on first page
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      firstPage.drawText(stegoZeroWidth, {
        x: 10,
        y: 10,
        size: 1,
        font,
        color: rgb(0, 0, 0),
        opacity: 0.001, // Invisible to eye
      });

      // Layer 2: Microscopic canary anchor dots on all pages (0.01 pt)
      pages.forEach((page) => {
        page.drawCircle({
          x: 42,
          y: 42,
          size: 0.5,
          color: rgb(0.1, 0.2, 0.4),
          opacity: 0.01,
        });
      });

      // Layer 3: PDF Document Metadata Canary marker
      pdfDoc.setSubject(`CF-CANARY-SECURED-${btoa(recipientId.trim())}`);

      const savedBytes = await pdfDoc.save();
      const blob = new Blob([savedBytes as any], { type: 'application/pdf' });
      setFingerprintedBlob(blob);

      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Steganography error:', err);
      alert('Failed to embed forensic fingerprint.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInspectFingerprint = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      sfx.playScan();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let detectedText = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        detectedText += textContent.items.map((it: any) => it.str).join('');
      }

      // Try reading zero-width payload
      const decodedPayload = decodeStegoString(detectedText);

      if (decodedPayload) {
        try {
          const parsed = JSON.parse(decodedPayload);
          setInspectedResult({
            found: true,
            recipientId: parsed.recipient,
            timestamp: parsed.time,
            classification: parsed.tag,
            hash: btoa(parsed.recipient).substring(0, 16),
          });
          sfx.playSuccess();
        } catch {
          setInspectedResult({
            found: true,
            recipientId: decodedPayload,
            timestamp: 'Unknown Timestamp',
          });
          sfx.playSuccess();
        }
      } else {
        // Fallback: Check metadata
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const subject = pdfDoc.getSubject();
        if (subject && subject.startsWith('CF-CANARY-SECURED-')) {
          const base64Recipient = subject.replace('CF-CANARY-SECURED-', '');
          const decodedRecipient = atob(base64Recipient);
          setInspectedResult({
            found: true,
            recipientId: decodedRecipient,
            timestamp: 'Extracted from Document Header',
            classification: 'METADATA_CANARY',
          });
          sfx.playSuccess();
        } else {
          setInspectedResult({
            found: false,
          });
          sfx.playError();
        }
      }
    } catch (err) {
      console.error('Forensic inspection error:', err);
      setInspectedResult({ found: false });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!fingerprintedBlob || !file) return;
    sfx.playClick();
    const url = URL.createObjectURL(fingerprintedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '-tracked-canary.pdf');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 max-w-md mx-auto">
        <button
          onClick={() => {
            setActiveMode('embed');
            setInspectedResult(null);
            sfx.playClick();
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-fira font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeMode === 'embed'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Fingerprint className="w-4 h-4" />
          Embed Canary Fingerprint
        </button>
        <button
          onClick={() => {
            setActiveMode('inspect');
            setFingerprintedBlob(null);
            sfx.playClick();
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-fira font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeMode === 'inspect'
              ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          Forensic Leak Inspector
        </button>
      </div>

      {/* File Upload Zone */}
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-purple-500/30 hover:border-purple-400/60 rounded-3xl bg-purple-950/10 cursor-pointer transition-all hover:bg-purple-950/20 group">
          <Fingerprint className="w-14 h-14 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">
            {activeMode === 'embed' ? 'Drop PDF to Inject Steganographic Canary' : 'Drop Suspect PDF to Trace Leak Origin'}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            {activeMode === 'embed'
              ? 'Bakes microscopic zero-width Unicode tracking fingerprints to identify who leaked the document.'
              : 'Scans vector streams for invisible zero-width payloads and reveals recipient identity.'}
          </p>
          <span className="mt-4 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 font-fira text-xs font-semibold border border-purple-500/40">
            Select PDF File
          </span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setFile(e.target.files[0]);
            }}
          />
        </label>
      ) : (
        <div className="space-y-6">
          {/* File Header Card */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300">
                <FileLock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white truncate max-w-md">{file.name}</h4>
                <p className="text-xs text-purple-400 font-fira">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for Steganography
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setFingerprintedBlob(null);
                setInspectedResult(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white font-fira"
            >
              Change File
            </button>
          </div>

          {/* Mode 1: Embed Canary */}
          {activeMode === 'embed' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 font-fira">Recipient Identifier / Email:</label>
                  <input
                    type="text"
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    placeholder="e.g. partner-corp-042@bank.com"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-white p-3 text-xs font-fira focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 font-fira">Classification Tag:</label>
                  <input
                    type="text"
                    value={classification}
                    onChange={(e) => setClassification(e.target.value)}
                    placeholder="e.g. STRICTLY CONFIDENTIAL"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-white p-3 text-xs font-fira focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-xs font-fira space-y-2 text-purple-200">
                <div className="flex items-center gap-2 font-bold text-purple-300">
                  <Key className="w-4 h-4" /> Steganographic Injection Pipeline
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The recipient ID will be encoded into zero-width non-printable characters (\u200B / \u200C) embedded directly into the document text stream. Even if printed or screenshotted via OCR, micro-dot coordinates persist.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                {!fingerprintedBlob ? (
                  <button
                    onClick={handleEmbedFingerprint}
                    disabled={isProcessing}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold font-fira text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Fingerprint className="w-4 h-4" />
                    Inject Invisible Canary Fingerprint
                  </button>
                ) : (
                  <button
                    onClick={handleDownload}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download Tracked PDF
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Mode 2: Inspect Leak */}
          {activeMode === 'inspect' && (
            <div className="space-y-5">
              {!inspectedResult ? (
                <div className="text-center py-6 space-y-4">
                  <p className="text-xs text-slate-400 font-fira max-w-md mx-auto">
                    Click scan to execute bit-level text stream disassembly and inspect whether this file contains an embedded tracking fingerprint.
                  </p>
                  <button
                    onClick={handleInspectFingerprint}
                    disabled={isProcessing}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold font-fira text-xs shadow-lg shadow-rose-500/20 flex items-center gap-2 mx-auto cursor-pointer disabled:opacity-50"
                  >
                    <Search className="w-4 h-4" />
                    Scan Document for Leaks
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {inspectedResult.found ? (
                    <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-3">
                      <div className="flex items-center gap-2 text-rose-400 font-bold text-sm font-orbitron">
                        <ShieldAlert className="w-5 h-5 text-rose-400" />
                        CANARY LEAK FINGERPRINT DETECTED
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-fira pt-2">
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <span className="text-slate-400 block text-[10px]">RECIPIENT IDENTITY:</span>
                          <span className="text-rose-300 font-bold text-sm">{inspectedResult.recipientId}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <span className="text-slate-400 block text-[10px]">ORIGIN TIMESTAMP:</span>
                          <span className="text-white">{inspectedResult.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <h4 className="text-sm font-bold text-white font-orbitron">No Canary Fingerprint Detected</h4>
                      <p className="text-xs text-slate-400 font-fira">
                        This document does not contain an AETHER steganographic watermark or zero-width bit sequence.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => setInspectedResult(null)}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white font-fira"
                    >
                      Scan Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
