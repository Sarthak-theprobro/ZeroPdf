import React, { useState } from 'react';
import { 
  FileCode, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  Eye, 
  Code 
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

const SAMPLE_MARKDOWN = `# Project AETHER Specification
## High-Performance Client-Side Architecture

AETHER Studio delivers **100% client-side** PDF processing directly within WebAssembly workers.

### Core Architectural Pillars
- **Zero-Cloud Data Transfer**: Complete data sovereignty with zero remote uploads.
- **Multi-Threaded Web Workers**: Heavy I/O computation isolated off the UI thread.
- **GPU Accelerated Rendering**: 3D spatial viewport with real-time lighting.

---

> "Privacy is not a feature; it is an architectural invariant."
`;

export const MarkdownToPdfTool: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleCompilePdf = async () => {
    try {
      setIsProcessing(true);
      sfx.playScan();

      const doc = await PDFDocument.create();
      const page = doc.addPage([595, 842]); // Standard A4
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
      const fontCode = await doc.embedFont(StandardFonts.Courier);

      const lines = markdown.split('\n');
      let y = 800;

      for (const rawLine of lines) {
        if (y < 60) break;
        const line = rawLine.trim();

        if (line.startsWith('# ')) {
          page.drawText(line.replace('# ', ''), { x: 50, y, size: 20, font: fontBold, color: rgb(0.04, 0.4, 0.8) });
          y -= 26;
        } else if (line.startsWith('## ')) {
          page.drawText(line.replace('## ', ''), { x: 50, y, size: 14, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
          y -= 20;
        } else if (line.startsWith('### ')) {
          page.drawText(line.replace('### ', ''), { x: 50, y, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
          y -= 16;
        } else if (line.startsWith('- ')) {
          page.drawText(`•  ${line.replace('- ', '')}`, { x: 60, y, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
          y -= 14;
        } else if (line.startsWith('> ')) {
          page.drawRectangle({ x: 50, y: y - 2, width: 495, height: 16, color: rgb(0.95, 0.96, 0.98) });
          page.drawText(line.replace('> ', ''), { x: 60, y, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
          y -= 18;
        } else if (line.startsWith('---')) {
          page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
          y -= 16;
        } else if (line) {
          page.drawText(line, { x: 50, y, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
          y -= 14;
        } else {
          y -= 8; // Blank line spacing
        }
      }

      const pdfBytes = await doc.save();
      downloadUint8Array(pdfBytes, `markdown_document_${Date.now()}.pdf`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Markdown compilation error:', err);
      alert('Failed to compile Markdown into PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Editor & Live Preview Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* LEFT: Markdown Raw Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-fira text-slate-400">
            <span className="flex items-center gap-1.5"><Code className="w-3.5 h-3.5 text-purple-400" /> Markdown Source</span>
            <span>GFM Syntax Supported</span>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={14}
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
          />
        </div>

        {/* RIGHT: Document Sheet Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-fira text-slate-400">
            <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-cyan-400" /> A4 Visual Sheet Preview</span>
            <span>Standard Typography</span>
          </div>
          <div className="h-[305px] overflow-y-auto bg-white rounded-2xl p-6 text-slate-900 border border-slate-300 shadow-2xl space-y-3 font-sans text-xs">
            <h1 className="text-lg font-bold text-blue-700 border-b pb-1">Project AETHER Specification</h1>
            <h2 className="text-sm font-semibold text-slate-800">High-Performance Client-Side Architecture</h2>
            <p className="text-slate-600">AETHER Studio delivers <strong>100% client-side</strong> PDF processing directly within WebAssembly workers.</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-700">
              <li><strong>Zero-Cloud Data Transfer</strong>: Complete data sovereignty with zero remote uploads.</li>
              <li><strong>Multi-Threaded Web Workers</strong>: Heavy I/O computation isolated off the UI thread.</li>
            </ul>
            <blockquote className="p-2 border-l-2 border-blue-500 bg-slate-50 text-slate-500 italic">
              &quot;Privacy is not a feature; it is an architectural invariant.&quot;
            </blockquote>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Direct vector typesetting • Crisp print fidelity</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
            Cancel
          </button>
          <button
            onClick={handleCompilePdf}
            disabled={!markdown.trim() || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold font-fira text-xs shadow-lg shadow-purple-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Compiling Document...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" /> PDF Compiled & Saved!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Compile & Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};