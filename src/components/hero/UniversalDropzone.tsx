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
  Layers,
  FileSpreadsheet,
  FileCode,
  Bot,
  Sparkles
} from 'lucide-react';
import { sfx } from '@/core/audio/sfx';
import { ToolDefinition } from '@/core/types/tool';
import { getToolById } from '@/core/registry/tools';

interface UniversalDropzoneProps {
  onLaunchToolWithFile: (tool: ToolDefinition, file: File) => void;
  onSelectTool?: (tool: ToolDefinition) => void;
}

const POPULAR_SHORTCUTS = [
  { id: 'word-to-pdf', label: 'Word to PDF', icon: FileText, color: 'text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/10' },
  { id: 'merge-pdf', label: 'Merge PDF', icon: Layers, color: 'text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/10' },
  { id: 'compress-pdf', label: 'Compress PDF', icon: Zap, color: 'text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10' },
  { id: 'excel-to-pdf', label: 'Excel to PDF', icon: FileSpreadsheet, color: 'text-teal-400 hover:border-teal-500/50 hover:bg-teal-500/10' },
  { id: 'edit-pdf-text', label: 'Edit PDF', icon: FileCode, color: 'text-violet-400 hover:border-violet-500/50 hover:bg-violet-500/10' },
  { id: 'chat-with-pdf', label: 'AI Chat PDF', icon: Bot, color: 'text-pink-400 hover:border-pink-500/50 hover:bg-pink-500/10' },
];

export const UniversalDropzone: React.FC<UniversalDropzoneProps> = ({ 
  onLaunchToolWithFile,
  onSelectTool 
}) => {
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
      toolIds.push('compress-pdf', 'edit-pdf-text', 'word-to-pdf', 'chat-with-pdf', 'pdf-to-word', 'sign-pdf');
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 sm:pt-5 pb-4 text-center space-y-4 sm:space-y-5">
      
      {/* Catchy, Compact Modern Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-fira font-semibold text-amber-300 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
          <span>100% PRIVATE • ZERO SERVER UPLOADS • IN-RAM ONLY</span>
        </div>
        
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-orbitron font-extrabold tracking-tight text-white leading-tight">
          All-in-One <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400">PDF Workstation</span>
        </h1>
        
        <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm font-fira leading-relaxed">
          Convert, edit, merge, and compress PDFs instantly in your browser with 73+ free sovereign tools.
        </p>
      </div>

      {/* High-Impact Interactive Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl p-5 sm:p-7 transition-all duration-300 border ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/15 scale-[1.01] shadow-2xl shadow-emerald-500/25 ring-2 ring-emerald-400/50'
            : selectedFile
            ? 'border-emerald-500/50 bg-emerald-950/20 shadow-xl'
            : 'border-white/15 bg-[#0a0d16]/90 backdrop-blur-xl hover:border-amber-500/40 hover:bg-[#0c101c]/95 shadow-xl'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        {!selectedFile ? (
          /* STATE A: IDLE DROPZONE WITH INSTANT SELECT BUTTON */
          <div className="flex flex-col items-center justify-center space-y-3.5">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col sm:flex-row items-center gap-3 cursor-pointer group"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sfx.playClick();
                  fileInputRef.current?.click();
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-orbitron font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <UploadCloud className="w-4 h-4 text-slate-950" />
                <span>Select or Drop Document</span>
              </button>
              
              <span className="text-xs font-fira text-slate-400">
                or drag & drop files here
              </span>
            </div>

            {/* Supported Format Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {[
                { ext: 'PDF', color: 'bg-amber-400' },
                { ext: 'DOCX', color: 'bg-blue-400' },
                { ext: 'XLSX', color: 'bg-emerald-400' },
                { ext: 'PPTX', color: 'bg-orange-400' },
                { ext: 'JPG/PNG', color: 'bg-cyan-400' },
                { ext: 'AUDIO', color: 'bg-purple-400' },
                { ext: 'EPUB', color: 'bg-teal-400' },
              ].map((item) => (
                <span 
                  key={item.ext} 
                  className="px-2 py-0.5 text-[10px] font-fira font-medium rounded-md bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-1"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                  <span>.{item.ext}</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          /* STATE B: FILE LOADED WITH SMART ACTIONS */
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.05] border border-emerald-500/30 max-w-lg mx-auto shadow-md">
              <div className="flex items-center gap-3 text-left min-w-0">
                <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm text-white truncate">{selectedFile.name}</h4>
                  <p className="text-[11px] text-slate-300 font-fira flex items-center gap-2">
                    <span>{formatFileSize(selectedFile.size)}</span>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Ready in-memory
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Suggested Operations */}
            <div className="space-y-2 max-w-xl mx-auto">
              <p className="text-[11px] font-fira text-amber-300 uppercase tracking-wider font-semibold">
                Choose an action to perform:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {getSmartToolSuggestions(selectedFile).map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      sfx.playSuccess();
                      onLaunchToolWithFile(tool, selectedFile);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.06] hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors block truncate">
                        {tool.title}
                      </span>
                      <p className="text-[10px] text-slate-400 truncate font-fira">{tool.description}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Quick 1-Click Popular Tool Shortcuts */}
      <div className="pt-1">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-[11px] font-fira text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
            Popular:
          </span>
          {POPULAR_SHORTCUTS.map((item) => {
            const Icon = item.icon;
            const toolDef = getToolById(item.id);
            return (
              <button
                key={item.id}
                onClick={() => {
                  sfx.playClick();
                  if (toolDef && onSelectTool) {
                    onSelectTool(toolDef);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-fira text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${item.color}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};