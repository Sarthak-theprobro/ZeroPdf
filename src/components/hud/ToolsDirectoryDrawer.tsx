import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  ChevronRight, 
  Layers, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  LayoutGrid
} from 'lucide-react';
import { CATEGORIES, getToolsByCategory } from '@/core/registry/tools';
import { ToolDefinition, ToolCategory } from '@/core/types/tool';
import { IconRenderer } from '@/components/common/IconRenderer';
import { sfx } from '@/core/audio/sfx';

interface ToolsDirectoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: ToolDefinition) => void;
  onSelectCategory: (category: string) => void;
}

export const ToolsDirectoryDrawer: React.FC<ToolsDirectoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTool,
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tools and categories based on search
  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return CATEGORIES;

    return CATEGORIES.map((cat) => {
      const tools = getToolsByCategory(cat.id as ToolCategory).filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.keywords?.some((k: string) => k.toLowerCase().includes(query))
      );
      return { ...cat, matchingTools: tools };
    }).filter((cat) => cat.matchingTools && cat.matchingTools.length > 0);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleCategoryClick = (categoryId: string) => {
    sfx.playClick();
    onSelectCategory(categoryId);
    onClose();
    
    // Smooth scroll to section on the page
    setTimeout(() => {
      const section = document.getElementById(categoryId) || document.getElementById('tools-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleToolClick = (tool: ToolDefinition) => {
    sfx.playClick();
    onSelectTool(tool);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      {/* Backdrop */}
      <div 
        onClick={() => {
          sfx.playClick();
          onClose();
        }}
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
      />

      {/* Drawer Content */}
      <div className="relative w-full max-w-md sm:max-w-lg h-full bg-[#080c18] border-r border-white/10 shadow-2xl flex flex-col z-10 animate-slide-right">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#05070d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black font-bold shadow-md shadow-amber-500/20">
              <LayoutGrid className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-sm text-white tracking-wide flex items-center gap-2">
                <span>TOOLS DIRECTORY</span>
                <span className="text-[10px] font-fira font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  8 HUBS
                </span>
              </h2>
              <p className="text-[11px] font-fira text-slate-400">Select any hub to jump directly to its tools</p>
            </div>
          </div>

          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Close Drawer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar in Drawer */}
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search 73+ tools (e.g. merge, split, ocr, excel)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs font-fira text-white placeholder-slate-500 outline-none focus:border-amber-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-white font-fira"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Body: Category Hubs (or Search Results if searching) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
          
          {/* Option to View All Tools */}
          {!searchQuery && (
            <button
              onClick={() => handleCategoryClick('all')}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-emerald-500/10 hover:from-amber-500/20 hover:via-yellow-500/20 hover:to-emerald-500/20 border border-amber-500/30 hover:border-amber-400/50 transition-all flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-fira text-white group-hover:text-amber-300 transition-colors">
                      All Sovereign Tools
                    </span>
                    <span className="text-[9px] font-fira font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200">
                      73+ Total
                    </span>
                  </div>
                  <p className="text-[10px] font-fira text-slate-400">
                    Explore all 8 mega-categories in a single unified view
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {/* If Search Query: Show matching tools directly */}
          {searchQuery ? (
            <div className="space-y-4">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <p className="text-xs font-fira text-slate-400">No tools found matching "{searchQuery}"</p>
                  <p className="text-[10px] font-fira text-slate-500">Try searching for merge, compress, sign, redact, or ocr</p>
                </div>
              ) : (
                filteredCategories.map((cat: any) => (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="text-[10px] font-fira font-bold uppercase tracking-wider text-amber-400 px-1">
                      {cat.name} ({cat.matchingTools?.length})
                    </div>
                    <div className="space-y-1">
                      {cat.matchingTools?.map((tool: ToolDefinition) => (
                        <button
                          key={tool.id}
                          onClick={() => handleToolClick(tool)}
                          className="w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-white/[0.04] group-hover:bg-amber-500/10 flex items-center justify-center text-slate-400 group-hover:text-amber-300 transition-colors shrink-0">
                              <IconRenderer name={tool.iconName} className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-fira font-semibold text-slate-200 group-hover:text-white truncate block">
                                {tool.title}
                              </span>
                              <p className="text-[10px] font-fira text-slate-400 truncate">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Clean Minimalist Category Cards */
            CATEGORIES.map((cat) => {
              const toolsInCat = getToolsByCategory(cat.id as ToolCategory);
              const toolPreviewNames = toolsInCat.slice(0, 5).map(t => t.title).join(' • ');

              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="w-full p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] hover:border-amber-500/40 transition-all duration-200 flex items-center justify-between text-left group cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-white/[0.04] group-hover:bg-amber-500/10 border border-white/5 group-hover:border-amber-500/30 text-amber-400 group-hover:text-amber-300 transition-all shrink-0 mt-0.5">
                      <IconRenderer name={cat.iconName} className="w-4.5 h-4.5" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold font-fira text-white group-hover:text-amber-300 transition-colors truncate">
                          {cat.name}
                        </h3>
                        <span className="text-[10px] font-fira font-bold uppercase px-1.5 py-0.2 rounded bg-white/[0.06] group-hover:bg-amber-500/20 text-slate-300 group-hover:text-amber-200 border border-white/10 group-hover:border-amber-500/30 shrink-0">
                          {toolsInCat.length} Tools
                        </span>
                      </div>

                      {/* Preview of key tools */}
                      <p className="text-[10px] font-fira text-slate-400 group-hover:text-slate-300 truncate">
                        {toolPreviewNames}{toolsInCat.length > 5 ? '...' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="pl-2 shrink-0 flex items-center gap-1 text-slate-500 group-hover:text-amber-400 transition-colors">
                    <span className="text-[10px] font-fira hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 border-t border-white/10 bg-[#05070d] flex items-center justify-between text-[11px] font-fira text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>100% In-RAM Processing</span>
          </div>
          <span className="text-slate-500">Press ⌘K for Search</span>
        </div>

      </div>
    </div>
  );
};
