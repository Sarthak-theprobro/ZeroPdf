import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  UploadCloud, 
  Search, 
  CheckCircle2, 
  Terminal, 
  Layers, 
  Braces 
} from 'lucide-react';
import { sfx } from '@/core/audio/sfx';

export const ForensicHexInspectorTool: React.FC<{ preloadedFile?: File | null; onClose: () => void }> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [hexView, setHexView] = useState<{ offset: string; hex: string; ascii: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('/Type /Catalog');

  useEffect(() => {
    if (preloadedFile) handleFileSelected(preloadedFile);
  }, [preloadedFile]);

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    sfx.playScan();

    const buffer = await selectedFile.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 4096)); // First 4KB for hex view

    // Build Hex Grid
    const rows: { offset: string; hex: string; ascii: string }[] = [];
    for (let i = 0; i < bytes.length; i += 16) {
      const chunk = bytes.slice(i, i + 16);
      const offset = i.toString(16).padStart(8, '0');
      const hex = Array.from(chunk).map((b) => b.toString(16).padStart(2, '0')).join(' ');
      const ascii = Array.from(chunk).map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
      rows.push({ offset, hex, ascii });
    }
    setHexView(rows);

    const decoder = new TextDecoder('latin1');
    setRawText(decoder.decode(buffer));
  };

  const objectMatches = rawText.match(/(\d+\s+\d+\s+obj[\s\S]*?endobj)/g) || [];

  return (
    <div className="space-y-5">
      {!file ? (
        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-3xl bg-cyan-950/10 cursor-pointer transition-all hover:bg-cyan-950/20 group">
          <Cpu className="w-14 h-14 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-white font-orbitron">Drop PDF for Hex & Dictionary Forensics</h3>
          <p className="text-xs text-slate-400 mt-2 font-fira text-center max-w-md">
            Disassembles PDF dictionary object trees, cross-reference (xref) streams, and binary offsets.
          </p>
          <span className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 font-fira text-xs font-semibold border border-cyan-500/40">Select PDF File</span>
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileSelected(e.target.files[0]); }} />
        </label>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs font-fira">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300"><Terminal className="w-5 h-5" /></div>
              <div>
                <h4 className="font-semibold text-white truncate max-w-xs">{file.name}</h4>
                <p className="text-slate-400">{objectMatches.length} PDF Objects Disassembled</p>
              </div>
            </div>
            <button onClick={() => { setFile(null); setHexView([]); setRawText(''); }} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white">Change File</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Hex Dump Window */}
            <div className="md:col-span-6 rounded-2xl bg-black/80 border border-white/10 p-3 font-mono text-[10px] space-y-1 max-h-[380px] overflow-y-auto">
              <div className="text-slate-400 font-bold border-b border-white/10 pb-1 mb-2">RAW BYTE STREAM (FIRST 4KB)</div>
              {hexView.map((row, idx) => (
                <div key={idx} className="flex gap-2 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                  <span className="text-cyan-500 select-none">{row.offset}</span>
                  <span className="text-slate-300 flex-1">{row.hex.padEnd(48, ' ')}</span>
                  <span className="text-amber-300">{row.ascii}</span>
                </div>
              ))}
            </div>

            {/* Object Tree Disassembler */}
            <div className="md:col-span-6 rounded-2xl bg-black/80 border border-white/10 p-3 font-mono text-[11px] space-y-2 max-h-[380px] overflow-y-auto">
              <div className="text-cyan-300 font-bold border-b border-white/10 pb-1 flex justify-between">
                <span>PDF OBJECT TREE ({objectMatches.length})</span>
                <span className="text-slate-500">ISO 32000-1</span>
              </div>
              {objectMatches.slice(0, 20).map((obj, oIdx) => (
                <div key={oIdx} className="p-2 rounded-lg bg-white/[0.02] border border-white/5 text-slate-300">
                  <div className="text-cyan-400 font-bold text-[10px] mb-1">NODE #{oIdx + 1}</div>
                  <pre className="whitespace-pre-wrap overflow-x-auto text-[10px] text-slate-300">{obj}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};