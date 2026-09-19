import React from 'react';
import { CATEGORIES, getToolsByCategory } from '@/core/registry/tools';
import { ToolCategory, ToolDefinition, AccentColor } from '@/core/types/tool';
import { IconRenderer } from '@/components/common/IconRenderer';
import { sfx } from '@/core/audio/sfx';
import { ArrowUpRight, LayoutGrid } from 'lucide-react';

interface ToolGridProps {
  onSelectTool: (tool: ToolDefinition) => void;
  activeCategory: string;
  onSelectCategory?: (category: string) => void;
}

export const ToolGrid: React.FC<ToolGridProps> = ({ 
  onSelectTool, 
  activeCategory,
  onSelectCategory 
}) => {
  
  // Helper to map category accent color to custom glowing class
  const getGlowClass = (accent: AccentColor): string => {
    switch (accent) {
      case 'cyan':
      case 'blue':
        return 'glow-amber hover:border-amber-500/40';
      case 'rose':
        return 'glow-coral hover:border-rose-500/40';
      case 'emerald':
        return 'glow-emerald hover:border-emerald-500/40';
      case 'purple':
        return 'glow-purple hover:border-purple-500/40';
      case 'amber':
        return 'glow-amber hover:border-amber-500/40';
      default:
        return 'glow-emerald hover:border-emerald-500/40';
    }
  };

  const categoriesToRender = activeCategory === 'all'
    ? CATEGORIES
    : CATEGORIES.filter((c) => c.id === activeCategory);

  return (
    <div id="tools-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Interactive Category Filter Pills */}
      {onSelectCategory && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/5">
          <button
            onClick={() => {
              sfx.playClick();
              onSelectCategory('all');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-fira font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>All Categories (80+)</span>
          </button>

          {CATEGORIES.map((cat) => {
            const count = getToolsByCategory(cat.id as ToolCategory).length;
            const isSelected = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  sfx.playClick();
                  onSelectCategory(cat.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-fira font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <IconRenderer name={cat.iconName} className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Category Sections */}
      {categoriesToRender.map((category) => {
        const categoryTools = getToolsByCategory(category.id as ToolCategory);

        return (
          <section key={category.id} id={category.id} className="space-y-6">
            
            {/* 1. CLEAN SECTION HEADER */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <IconRenderer name={category.iconName} className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold font-orbitron text-white tracking-wide">
                      {category.name}
                    </h2>
                    <span className="text-[11px] font-fira px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                      {categoryTools.length} tools
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-fira">{category.tagline}</p>
                </div>
              </div>
            </div>

            {/* 2. RESPONSIVE STUDIO CARD GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryTools.map((tool) => {
                const glowClass = getGlowClass(tool.accentColor);

                return (
                  <div
                    key={tool.id}
                    onClick={() => {
                      sfx.playSuccess();
                      onSelectTool(tool);
                    }}
                    onMouseEnter={() => sfx.playHover()}
                    className={`studio-glass studio-glass-hover ${glowClass} p-5 rounded-2xl cursor-pointer flex flex-col justify-between group relative overflow-hidden`}
                  >
                    <div>
                      {/* Card Top: Icon & Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white group-hover:scale-110 group-hover:text-amber-300 group-hover:border-amber-500/30 transition-all duration-300">
                          <IconRenderer name={tool.iconName} className="w-5 h-5" />
                        </div>
                        {tool.badge && (
                          <span className="text-[10px] font-fira font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                            {tool.badge}
                          </span>
                        )}
                      </div>

                      {/* Tool Title & Description */}
                      <h3 className="font-semibold text-white text-sm group-hover:text-amber-300 transition-colors mb-1.5 flex items-center justify-between">
                        <span>{tool.title}</span>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-amber-400 transition-all" />
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {tool.description}
                      </p>
                    </div>

                    {/* Card Footer: Category Tag & Shortcut */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-fira text-slate-400">
                      <span className="capitalize">{tool.category.replace('-', ' ')}</span>
                      {tool.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-[9px] font-fira bg-white/5 border border-white/10 rounded text-slate-300">
                          {tool.shortcut}
                        </kbd>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </section>
        );
      })}

    </div>
  );
};