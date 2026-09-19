import React, { useState } from 'react';
import { 
  FilePlus, 
  Download, 
  Sparkles, 
  Bold, 
  Italic, 
  List, 
  Heading1, 
  Heading2, 
  AlignLeft, 
  AlignCenter,
  Eye,
  FileCheck
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import confetti from 'canvas-confetti';
import { sfx } from '@/core/audio/sfx';

export const CreatePdfStudioTool: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [docTitle, setDocTitle] = useState<string>('Executive Summary');
  const [author, setAuthor] = useState<string>('AETHER Studio');
  const [content, setContent] = useState<string>(
`# Executive Briefing & Architecture Overview

The purpose of this document is to outline the core technical specifications for our next-generation client-side computational engine.

## Key Architectural Highlights
- 100% Client-Side In-Memory Execution
- Zero External Server Telemetry or Cloud Uploads
- Hardware-Accelerated WebAssembly and Web Audio Synthesis

## Conclusion
All cryptographic invariants and user privacy guarantees are maintained strictly within the browser runtime environment.`
  );

  const [fontSize, setFontSize] = useState<number>(11);
  const [fontFamily, setFontFamily] = useState<'Helvetica' | 'TimesRoman' | 'Courier'>('Helvetica');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleExportPdf = async () => {
    try {
      setIsProcessing(true);
      sfx.playScan();

      const pdfDoc = await PDFDocument.create();
      let font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      let fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      if (fontFamily === 'TimesRoman') {
        font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      } else if (fontFamily === 'Courier') {
        font = await pdfDoc.embedFont(StandardFonts.Courier);
        fontBold = await pdfDoc.embedFont(StandardFonts.CourierBold);
      }

      const page = pdfDoc.addPage([595, 842]); // A4 dimensions
      const { width, height } = page.getSize();
      const margin = 50;

      let currentY = height - margin;

      // Draw Document Title Header Bar
      page.drawRectangle({
        x: margin,
        y: currentY - 2,
        width: width - (margin * 2),
        height: 2,
        color: rgb(0.1, 0.6, 0.8),
      });
      currentY -= 20;

      const lines = content.split('\n');

      for (const line of lines) {
        if (currentY < margin + 40) break; // Simple single-page layout protection

        if (line.startsWith('# ')) {
          const h1Text = line.replace('# ', '');
          currentY -= 15;
          page.drawText(h1Text, {
            x: margin,
            y: currentY,
            size: 20,
            font: fontBold,
            color: rgb(0.05, 0.1, 0.2),
          });
          currentY -= 24;
        } else if (line.startsWith('## ')) {
          const h2Text = line.replace('## ', '');
          currentY -= 10;
          page.drawText(h2Text, {
            x: margin,
            y: currentY,
            size: 15,
            font: fontBold,
            color: rgb(0.1, 0.4, 0.7),
          });
          currentY -= 18;
        } else if (line.startsWith('- ')) {
          const bulletText = line.replace('- ', '');
          page.drawCircle({
            x: margin + 6,
            y: currentY + 3,
            size: 2,
            color: rgb(0.2, 0.2, 0.2),
          });
          page.drawText(bulletText, {
            x: margin + 16,
            y: currentY,
            size: fontSize,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
          currentY -= 16;
        } else if (line.trim() === '') {
          currentY -= 10;
        } else {
          page.drawText(line, {
            x: margin,
            y: currentY,
            size: fontSize,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
          currentY -= 16;
        }
      }

      // Footer
      page.drawText(`Created with AETHER Studio • Author: ${author}`, {
        x: margin,
        y: 25,
        size: 8,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      sfx.playSuccess();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Create PDF error:', err);
      alert('Failed to generate PDF document.');
      sfx.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Document Metadata Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          value={docTitle}
          onChange={(e) => setDocTitle(e.target.value)}
          placeholder="Document Title"
          className="rounded-xl bg-white/[0.04] border border-white/10 text-white p-2.5 text-xs font-fira focus:border-cyan-400 focus:outline-none"
        />
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author Name"
          className="rounded-xl bg-white/[0.04] border border-white/10 text-white p-2.5 text-xs font-fira focus:border-cyan-400 focus:outline-none"
        />
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-3">
          <span className="text-xs text-slate-400 font-fira">Font:</span>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value as any)}
            className="bg-transparent text-white text-xs font-fira focus:outline-none flex-1"
          >
            <option value="Helvetica" className="bg-slate-900">Helvetica</option>
            <option value="TimesRoman" className="bg-slate-900">Times New Roman</option>
            <option value="Courier" className="bg-slate-900">Courier Mono</option>
          </select>
        </div>
      </div>

      {/* Editor & Live Layout Preview */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6 space-y-2">
          <div className="text-xs font-bold text-slate-400 font-fira flex justify-between">
            <span>Markdown / Text Editor</span>
            <span>Supports # H1, ## H2, - Bullets</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            className="w-full rounded-2xl bg-black/60 border border-white/10 p-3.5 text-xs font-fira text-slate-200 focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Live A4 Paper Simulation Preview */}
        <div className="md:col-span-6 space-y-2">
          <div className="text-xs font-bold text-slate-400 font-fira">Live Document Paper Canvas</div>
          <div className="p-6 rounded-2xl bg-white shadow-2xl text-slate-900 h-[340px] overflow-y-auto space-y-3 font-sans text-xs select-none">
            <h1 className="text-base font-bold text-slate-900 border-b-2 border-cyan-500 pb-1">{docTitle}</h1>
            {content.split('\n').map((line, idx) => {
              if (line.startsWith('# ')) return <h2 key={idx} className="text-sm font-bold text-slate-900">{line.replace('# ', '')}</h2>;
              if (line.startsWith('## ')) return <h3 key={idx} className="text-xs font-bold text-cyan-800">{line.replace('## ', '')}</h3>;
              if (line.startsWith('- ')) return <li key={idx} className="list-disc ml-4 text-[11px] text-slate-700">{line.replace('- ', '')}</li>;
              if (line.trim() === '') return <div key={idx} className="h-1.5" />;
              return <p key={idx} className="text-[11px] text-slate-700 leading-relaxed">{line}</p>;
            })}
          </div>
        </div>
      </div>

      {/* Action Export Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleExportPdf}
          disabled={isProcessing}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 hover:from-purple-400 hover:to-cyan-300 text-black font-bold font-fira text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Compile & Download PDF Document
        </button>
      </div>
    </div>
  );
};