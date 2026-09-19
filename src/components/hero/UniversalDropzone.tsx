import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  X, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Cpu
} from 'lucide-react';
import { sfx } from '@/core/audio/sfx';
import { ToolDefinition } from '@/core/types/tool';
import { getToolById } from '@/core/registry/tools';

interface UniversalDropzoneProps {
  onLaunchToolWithFile: (tool: ToolDefinition, file: File) => void;
}

export const UniversalDropzone: React.FC<UniversalDropzoneProps> = ({ onLaunchToolWithFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragging) {
      sfx.playHover();
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      sfx.playSuccess();
      setSelectedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      sfx.playSuccess();
      setSelectedFile(file);
    }
  };

  const getSmartToolSuggestions = (file: File): ToolDefinition[] => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const toolIds: string[] = [];

    if (ext === 'pdf') {
      toolIds.push('compress-pdf', 'edit-pdf-text', 'auto-redact-pii', 'chat-with-pdf', 'pdf-to-word', 'sign-pdf');
    } else if (['doc', 'docx'].includes(ext || '')) {
      toolIds.push('word-to-pdf');
    } else if (['xls', 'xlsx'].includes(ext || '')) {
      toolIds.push('excel-to-pdf');
    } else if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext || '')) {
      toolIds.push('images-to-pdf', 'ocr-searchable-pdf');
    } else if (['mp3', 'wav', 'm4a'].includes(ext || '')) {
      toolIds.push('audio-to-pdf');
    } else {
      toolIds.push('compress-pdf', 'edit-pdf-text', 'chat-with-pdf');
    }

    return toolIds.map((id) => getToolById(id)).filter((t): t is ToolDefinition => !!t);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-8 text-center space-y-7">
      
      {/* Dynamic Master Headline */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-amber-500/30 text-xs font-medium backdrop-blur-xl shadow-lg shadow-amber-500/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          <span className="font-fira font-semibold text-amber-300">
            AIR-GAP AIR-LOCK // 0 BYTES UPLOADED // CLIENT-SIDE ONLY
          </span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-orbitron font-extrabold tracking-tight leading-[1.1] space-y-2">
          <div className="text-titanium-chrome tracking-wider">
            SOVEREIGN PDF
          </div>
          <div className="text-plasma-gradient tracking-wide">
            MEGA-WORKSTATION
          </div>
        </h1>
        
        <p className="text-slate-300 max-w-2xl mx-auto text-xs sm:text-sm font-fira leading-relaxed">
          Zero cloud data surveillance. 73+ high-precision tools executing 100% locally inside your browser's private memory with multi-threaded WebAssembly.
        </p>
      </div>

      {/* Holographic Quantum Intake Portal */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-3xl p-8 sm:p-12 transition-all duration-300 border ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01] shadow-2xl shadow-emerald-500/20 ring-2 ring-emerald-400/50'
            : selectedFile
            ? 'border-emerald-500/50 bg-emerald-950/20 shadow-xl'
            : 'border-white/10 bg-[#0a0d16]/80 backdrop-blur-2xl hover:border-amber-500/40 hover:bg-[#0c101c]/90 shadow-2xl'
        }`}
      >
        {/* Holographic Corner Reticles */}
        <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-400/60" />
        <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-400/60" />
        <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-400/60" />
        <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-400/60" />

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        {!selectedFile ? (
          /* STATE A: IDLE HOLOGRAPHIC INTAKE PORTAL */
          <div className="flex flex-col items-center justify-center space-y-5">
            {/* Cybernetic Rotating Aperture & Core Icon */}
            <div className="relative w-22 h-22 flex items-center justify-center group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {/* Outer Rotating Cyber Ring */}
              <div className="absolute inset-0 rounded-2xl border border-dashed border-amber-400/30 animate-spin-slow" />
              {/* Inner Counter-Rotating Reticle */}
              <div className="absolute inset-1.5 rounded-2xl border border-emerald-400/20 animate-spin-reverse-slow" />
              {/* Core Icon Box */}
              <div className="relative w-16 h-16 rounded-xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-indigo-500/20 border border-white/15 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:border-amber-400/40 transition-all duration-300">
                <UploadCloud className="w-8 h-8 text-amber-300 group-hover:text-amber-200 transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-bold text-white font-orbitron tracking-wide">
                Drag & drop document here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-amber-400 underline underline-offset-4 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  browse device
                </button>
              </h3>
              <p className="text-xs text-slate-300 font-fira">
                Instant in-RAM intake for PDF, Office, Vector, Audio & Document Formats
              </p>
            </div>

            {/* Supported Format Chips with Cyber Glow Dots */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {[
                { ext: '.PDF', color: 'bg-amber-400' },
                { ext: '.DOCX', color: 'bg-blue-400' },
                { ext: '.XLSX', color: 'bg-emerald-400' },
                { ext: '.PPTX', color: 'bg-orange-400' },
                { ext: '.PNG / JPG', color: 'bg-cyan-400' },
                { ext: '.MP3 (TTS)', color: 'bg-purple-400' },
                { ext: '.MD', color: 'bg-slate-300' },
                { ext: '.EPUB', color: 'bg-teal-400' },
              ].map((item) => (
                <span 
                  key={item.ext} 
                  className="px-2.5 py-1 text-[11px] font-fira font-medium rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white hover:border-amber-500/40 flex items-center gap-1.5 transition-all"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                  <span>{item.ext}</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          /* STATE B: FILE LOADED WITH SMART ACTION CHIPS */
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.05] border border-emerald-500/30 max-w-lg mx-auto shadow-lg">
              <div className="flex items-center gap-3 text-left">
                <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white line-clamp-1">{selectedFile.name}</h4>
                  <p className="text-xs text-slate-300 font-fira flex items-center gap-2">
                    <span>{formatFileSize(selectedFile.size)}</span>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% In-RAM Isolated
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Smart Suggested Action Buttons */}
            <div className="space-y-2.5 max-w-xl mx-auto">
              <p className="text-xs font-fira text-amber-300 uppercase tracking-wider font-semibold">
                Select an operation to execute on this document:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {getSmartToolSuggestions(selectedFile).map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      sfx.playSuccess();
                      onLaunchToolWithFile(tool, selectedFile);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.06] hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {tool.title}
                      </span>
                      <p className="text-[10px] text-slate-400 line-clamp-1 font-fira">{tool.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};