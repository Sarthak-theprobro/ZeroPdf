import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CornerDownLeft, Sparkles } from 'lucide-react';
import { searchTools } from '@/core/registry/tools';
import { ToolDefinition } from '@/core/types/tool';
import { IconRenderer } from '@/components/common/IconRenderer';
import { sfx } from '@/core/audio/sfx';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: ToolDefinition) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelectTool }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTools = searchTools(query);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        sfx.playHover();
        setSelectedIndex((prev) => (prev < filteredTools.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        sfx.playHover();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredTools.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredTools[selectedIndex]) {
          sfx.playSuccess();
          onSelectTool(filteredTools[selectedIndex]);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredTools, selectedIndex, onClose, onSelectTool]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md">
      <div 
        className="w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-[#090d16]/95 shadow-2xl overflow-hidden shadow-black/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-amber-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a tool name or format (e.g. Merge, Compress, Word, OCR, Redact)..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 font-fira text-sm focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[11px] font-fira text-slate-400 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
            ESC to exit
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-fira text-sm">
              <p>No tools matched &quot;{query}&quot;</p>
              <p className="text-xs text-slate-600 mt-1">Try searching &apos;merge&apos;, &apos;compress&apos;, &apos;ocr&apos;, or &apos;encrypt&apos;</p>
            </div>
          ) : (
            filteredTools.map((tool, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={tool.id}
                  onClick={() => {
                    sfx.playSuccess();
                    onSelectTool(tool);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200'
                      : 'border border-transparent text-slate-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-400'}`}>
                      <IconRenderer name={tool.iconName} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{tool.title}</span>
                        {tool.badge && (
                          <span className="text-[9px] font-fira px-1.5 py-0.2 rounded-full font-bold bg-amber-500/20 border border-amber-500/30 text-amber-300">
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{tool.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {tool.shortcut && (
                      <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-fira bg-white/5 border border-white/10 rounded text-slate-400">
                        {tool.shortcut}
                      </kbd>
                    )}
                    {isSelected && <CornerDownLeft className="w-4 h-4 text-amber-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2.5 bg-[#07090e] border-t border-white/10 flex items-center justify-between text-[11px] font-fira text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>73+ Client-Side Sovereign Tools Indexed</span>
          </div>
          <span>Use ↑ ↓ to navigate, ↵ to select</span>
        </div>
      </div>
    </div>
  );
};