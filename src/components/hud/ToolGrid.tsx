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
  
  const getToolColorStyles = (accent: AccentColor) => {
    switch (accent) {
      case 'rose':
        return {
          iconBox: 'bg-rose-500/15 text-rose-400 border-rose-500/30 group-hover:bg-rose-500/25 group-hover:border-rose-400',
          titleHover: 'group-hover:text-rose-300',
          cardBorder: 'hover:border-rose-500/50 hover:shadow-rose-500/10'
        };
      case 'emerald':
        return {
          iconBox: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 group-hover:bg-emerald-500/25 group-hover:border-emerald-400',
          titleHover: 'group-hover:text-emerald-300',
          cardBorder: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10'
        };
      case 'purple':
        return {
          iconBox: 'bg-purple-500/15 text-purple-400 border-purple-500/30 group-hover:bg-purple-500/25 group-hover:border-purple-400',
          titleHover: 'group-hover:text-purple-300',
          cardBorder: 'hover:border-purple-500/50 hover:shadow-purple-500/10'
        };
      case 'amber':
        return {
          iconBox: 'bg-amber-500/15 text-amber-400 border-amber-500/30 group-hover:bg-amber-500/25 group-hover:border-amber-400',
          titleHover: 'group-hover:text-amber-300',
          cardBorder: 'hover:border-amber-500/50 hover:shadow-amber-500/10'
        };
      case 'blue':
        return {
          iconBox: 'bg-blue-500/15 text-blue-400 border-blue-500/30 group-hover:bg-blue-500/25 group-hover:border-blue-400',
          titleHover: 'group-hover:text-blue-300',
          cardBorder: 'hover:border-blue-500/50 hover:shadow-blue-500/10'
        };
      case 'cyan':
      default:
        return {
          iconBox: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 group-hover:bg-cyan-500/25 group-hover:border-cyan-400',
          titleHover: 'group-hover:text-cyan-300',
          cardBorder: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10'
        };
    }
  };

  const categoriesToRender = activeCategory === 'all'
    ? CATEGORIES
    : CATEGORIES.filter((c) => c.id === activeCategory);

  return (
    <div id="tools-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      
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
          <section key={category.id} id={category.id} className="space-y-4">
            
            {/* 1. CLEAN SECTION HEADER */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <IconRenderer name={category.iconName} className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold font-orbitron text-white tracking-wide">
                      {category.name}
                    </h2>
                    <span className="text-[10px] font-fira px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                      {categoryTools.length} tools
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-fira">{category.tagline}</p>
                </div>
              </div>
            </div>

            {/* 2. RESPONSIVE HIGH-CONTRAST STUDIO CARD GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {categoryTools.map((tool) => {
                const colorStyle = getToolColorStyles(tool.accentColor);

                return (
                  <div
                    key={tool.id}
                    onClick={() => {
                      sfx.playSuccess();
                      onSelectTool(tool);
                    }}
                    onMouseEnter={() => sfx.playHover()}
                    className={`bg-[#0d111d]/90 hover:bg-[#111728] border border-white/10 ${colorStyle.cardBorder} p-4.5 rounded-2xl cursor-pointer flex flex-col justify-between group relative overflow-hidden transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5`}
                  >
                    <div>
                      {/* Card Top: Icon & Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className={`p-2.5 rounded-xl border ${colorStyle.iconBox} transition-all duration-300 group-hover:scale-105`}>
                          <IconRenderer name={tool.iconName} className="w-5 h-5" />
                        </div>
                        {tool.badge && (
                          <span className="text-[10px] font-fira font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                            {tool.badge}
                          </span>
                        )}
                      </div>

                      {/* Tool Title & Description */}
                      <h3 className={`font-semibold text-white text-sm ${colorStyle.titleHover} transition-colors mb-1 flex items-center justify-between`}>
                        <span>{tool.title}</span>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1" />
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {tool.description}
                      </p>
                    </div>

                    {/* Card Footer: Category Tag & Shortcut */}
                    <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-fira text-slate-400">
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