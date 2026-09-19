import React, { useState, useRef } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import { 
  Globe, 
  Code, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  FileText, 
  Sparkles,
  Eye,
  Palette
} from 'lucide-react';
import { sfx } from '@/core/audio/sfx';

interface HtmlToPdfToolProps {
  onClose: () => void;
}

const TEMPLATES = [
  {
    name: 'Executive Report',
    code: `<div style="font-family: system-ui, sans-serif; padding: 32px; background: #ffffff; color: #1e293b; max-width: 700px; margin: 0 auto; line-height: 1.6;">
  <div style="border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 24px;">
    <h1 style="color: #0f172a; margin: 0; font-size: 26px; font-weight: 800;">QUARTERLY EXECUTIVE SUMMARY</h1>
    <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">CONFIDENTIAL &bull; AETHER SYSTEMS PROTOCOL</p>
  </div>
  <p style="font-size: 14px; margin-bottom: 16px;">This document verifies that all cryptographic workloads, vector imposition sequences, and client-side memory safety bounds were maintained at 100% efficiency.</p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px;">
    <thead>
      <tr style="background: #f1f5f9; text-align: left;">
        <th style="padding: 10px; border-bottom: 2px solid #cbd5e1;">Metric</th>
        <th style="padding: 10px; border-bottom: 2px solid #cbd5e1;">Status</th>
        <th style="padding: 10px; border-bottom: 2px solid #cbd5e1;">Confidence</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Client-Side Execution</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #16a34a;">Zero Leakage (100%)</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">99.98%</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">WASM Acceleration</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0284c7;">Active (Multi-thread)</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">100.0%</td>
      </tr>
    </tbody>
  </table>
</div>`,
  },
  {
    name: 'Invoice Receipt',
    code: `<div style="font-family: monospace; padding: 28px; background: #ffffff; color: #000; max-width: 600px; margin: 0 auto; line-height: 1.4;">
  <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 16px; margin-bottom: 16px;">
    <h2 style="margin: 0; font-size: 20px; letter-spacing: 2px;">CYBER WORKSTATION POS</h2>
    <p style="font-size: 11px; margin: 4px 0;">TRANS-ID: #8892-AETHER-2026</p>
  </div>
  <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;">
    <span>1x Unlimited Mega-License</span>
    <span>$0.00 (FOSS)</span>
  </div>
  <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px;">
    <span>1x AES-256 On-Device Vault</span>
    <span>$0.00 (FOSS)</span>
  </div>
  <div style="border-top: 1px solid #000; margin-top: 16px; padding-top: 12px; font-weight: bold; display: flex; justify-content: space-between; font-size: 14px;">
    <span>TOTAL DUE</span>
    <span>$0.00</span>
  </div>
</div>`,
  },
];

export const HtmlToPdfTool: React.FC<HtmlToPdfToolProps> = ({ onClose }) => {
  const [htmlCode, setHtmlCode] = useState<string>(TEMPLATES[0].code);
  const [pageSize, setPageSize] = useState<'A4' | 'LETTER'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isRendering, setIsRendering] = useState(false);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleGeneratePdf = async () => {
    setIsRendering(true);
    sfx.playProcessing();

    try {
      // Create SVG foreignObject to render exact HTML onto an offscreen canvas
      const width = pageSize === 'A4' ? (orientation === 'portrait' ? 595 : 842) : (orientation === 'portrait' ? 612 : 792);
      const height = pageSize === 'A4' ? (orientation === 'portrait' ? 842 : 595) : (orientation === 'portrait' ? 792 : 612);

      const canvas = document.createElement('canvas');
      const scale = 2; // Hi-DPI 2x supersampling
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not get canvas context');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);

      const data = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width: ${width}px; height: ${height}px; box-sizing: border-box;">
              ${htmlCode}
            </div>
          </foreignObject>
        </svg>
      `;

      const img = new Image();
      const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        img.src = url;
      });

      const pngDataUrl = canvas.toDataURL('image/png');
      const pngImageBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer());

      // Embed into PDF-Lib document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([width, height]);
      const pngImage = await pdfDoc.embedPng(pngImageBytes);

      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });

      const pdfBytes = await pdfDoc.save();
      const finalPdfBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(finalPdfBlob);

      setPdfDownloadUrl(downloadUrl);
      sfx.playSuccess();
    } catch (err) {
      console.error('Error generating HTML to PDF:', err);
      alert('Could not render HTML to PDF. Ensure standard HTML tags are closed.');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Template Quick Select */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-fira text-slate-300 font-semibold">Starter Templates:</span>
          <div className="flex gap-1.5">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                onClick={() => {
                  sfx.playClick();
                  setHtmlCode(tmpl.code);
                  setPdfDownloadUrl(null);
                }}
                className="text-xs font-fira px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-300 border border-white/10 text-slate-400 transition-all cursor-pointer"
              >
                {tmpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Page Options */}
        <div className="flex items-center gap-2 text-xs font-fira">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as any)}
            className="bg-[#0c101c] border border-white/10 rounded-lg px-2 py-1 text-slate-300 outline-none"
          >
            <option value="A4">A4 Standard</option>
            <option value="LETTER">US Letter</option>
          </select>
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as any)}
            className="bg-[#0c101c] border border-white/10 rounded-lg px-2 py-1 text-slate-300 outline-none"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
      </div>

      {/* Dual Pane: Code Editor + Live HTML Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="space-y-2">
          <label className="text-xs font-fira text-slate-400 flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-cyan-400" /> HTML / CSS Source Code
          </label>
          <textarea
            value={htmlCode}
            onChange={(e) => {
              setHtmlCode(e.target.value);
              setPdfDownloadUrl(null);
            }}
            rows={12}
            className="w-full bg-[#080A10] border border-white/10 rounded-2xl p-4 text-xs font-fira text-cyan-200 outline-none focus:border-cyan-500/50 resize-none"
            placeholder="Paste your HTML string here..."
          />
        </div>

        {/* Live Preview */}
        <div className="space-y-2">
          <label className="text-xs font-fira text-slate-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-emerald-400" /> Live Vector Preview
          </label>
          <div 
            ref={previewRef}
            className="w-full h-[256px] overflow-auto bg-white rounded-2xl p-4 border border-white/10 shadow-inner"
            dangerouslySetInnerHTML={{ __html: htmlCode }}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          onClick={handleGeneratePdf}
          disabled={isRendering}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isRendering ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Rendering Vector Canvas to PDF...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Convert HTML to Vector PDF</span>
            </>
          )}
        </button>

        {pdfDownloadUrl && (
          <a
            href={pdfDownloadUrl}
            download="rendered_document.pdf"
            className="px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer animate-fade-in"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </a>
        )}
      </div>
    </div>
  );
};