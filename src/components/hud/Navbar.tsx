import React, { useState } from "react";
import {
  Search,
  Volume2,
  VolumeX,
  ShieldCheck,
  User,
  Crown,
  Sparkles,
  ChevronDown,
  Menu,
  Hexagon
} from "lucide-react";
import { sfx } from "@/core/audio/sfx";
import { PwaInstallBadge } from "@/components/hud/PwaInstallBadge";
import { useAuth } from "@/core/auth/AuthContext";

interface NavbarProps {
  onOpenCommandPalette: () => void;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenToolsDrawer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenCommandPalette, 
  onSelectCategory,
  onOpenToolsDrawer
}) => {
  const [isMuted, setIsMuted] = useState(sfx.getMuted());
  const { user, setIsAuthModalOpen, setIsPricingModalOpen, setIsProfileModalOpen } = useAuth();

  const handleToggleSound = () => {
    const muted = sfx.toggleMute();
    setIsMuted(muted);
  };

  const handleLogoClick = () => {
    sfx.playClick();
    onSelectCategory('all');
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#05070d]/95 backdrop-blur-2xl shadow-xl shadow-black/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* 1. LEFT: TOOLS DRAWER TOGGLE & BRAND LOGO */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Tools Mega-Drawer Trigger Button */}
          {onOpenToolsDrawer && (
            <button
              onClick={() => {
                sfx.playClick();
                onOpenToolsDrawer();
              }}
              onMouseEnter={() => sfx.playHover()}
              className="h-9 px-2.5 sm:px-3 rounded-xl bg-white/[0.04] hover:bg-amber-500/10 border border-white/[0.08] hover:border-amber-500/40 text-slate-200 hover:text-amber-300 font-fira text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm group shrink-0"
              title="Open All 73+ Tools Directory"
            >
              <Menu className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Tools</span>
              <span className="text-[9px] font-fira font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 hidden md:inline">
                73+
              </span>
            </button>
          )}

          <div 
            onClick={handleLogoClick} 
            className="flex items-center gap-2.5 cursor-pointer group select-none"
            title="ZEROPDF - Sovereign Air-Gapped PDF Mega-Workstation"
          >
            {/* Geometric Laser Monolith Prism */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-emerald-400 shadow-md shadow-amber-500/20 group-hover:shadow-amber-400/40 group-hover:scale-105 transition-all duration-300">
              <ShieldCheck className="w-4.5 h-4.5 text-black stroke-[2.5]" />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-orbitron font-extrabold text-sm sm:text-base tracking-wider text-white">
                ZERO<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400">PDF</span>
              </span>
              <span className="hidden lg:flex items-center gap-1 text-[9px] font-fira font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>AIR-GAP</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2. CENTER: SLEEK COMMAND BAR */}
        <button
          onClick={() => {
            sfx.playClick();
            onOpenCommandPalette();
          }}
          onMouseEnter={() => sfx.playHover()}
          className="h-9 w-36 sm:w-60 md:w-72 lg:w-80 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-amber-500/40 text-slate-400 hover:text-white transition-all duration-200 group cursor-pointer flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors shrink-0" />
            <span className="text-xs font-fira text-slate-300 group-hover:text-white truncate">
              Search 73+ tools...
            </span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-fira bg-white/[0.06] border border-white/10 rounded text-slate-400 group-hover:text-amber-300 group-hover:border-amber-500/30 transition-all shrink-0">
            ⌘K
          </kbd>
        </button>

        {/* 3. RIGHT: ACTION PILLS & PROFILE CHIP */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Pro Upgrade / Active Badge */}
          {(!user || user.tier === 'free') ? (
            <button
              onClick={() => {
                sfx.playClick();
                setIsPricingModalOpen(true);
              }}
              className="h-9 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-fira text-xs font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shimmer-effect"
            >
              <Crown className="w-3.5 h-3.5 fill-slate-950 stroke-none shrink-0" />
              <span className="hidden xs:inline">Pro $4.99</span>
              <span className="xs:hidden">$4.99</span>
            </button>
          ) : (
            <button
              onClick={() => {
                sfx.playClick();
                setIsProfileModalOpen(true);
              }}
              className="h-9 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-fira text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">{user.tier === 'enterprise' ? 'Lifetime Founder' : 'Pro Active'}</span>
              <span className="sm:hidden">PRO</span>
            </button>
          )}

          {/* Desktop App Install Badge */}
          <PwaInstallBadge />

          {/* User Profile or Sign In */}
          {!user ? (
            <button
              onClick={() => {
                sfx.playClick();
                setIsAuthModalOpen(true);
              }}
              className="h-9 px-3 sm:px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-500/30 text-slate-200 hover:text-white font-fira text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Sign In</span>
            </button>
          ) : (
            <button
              onClick={() => {
                sfx.playClick();
                setIsProfileModalOpen(true);
              }}
              className="h-9 pl-1.5 pr-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-500/30 transition-all duration-200 flex items-center gap-2 cursor-pointer group whitespace-nowrap"
            >
              <div className="relative shrink-0">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover ring-1.5 ring-amber-500/40 group-hover:ring-amber-400 transition-all"
                />
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black ${
                    user.tier !== 'free' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
              </div>
              <span className="text-xs font-fira font-medium text-slate-200 group-hover:text-amber-300 max-w-[80px] truncate hidden sm:inline">
                {user.name.split(' ')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? "Unmute Sound FX" : "Mute Sound FX"}
            className="h-9 w-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-500/30 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
};