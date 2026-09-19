import React, { useEffect } from 'react';
import { X, Crown, ShieldCheck, HardDrive, FileText, Sparkles, LogOut, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthContext';
import { sfx } from '@/core/audio/sfx';

export const ProfileModal: React.FC = () => {
  const { 
    user, 
    isProfileModalOpen, 
    setIsProfileModalOpen, 
    setIsPricingModalOpen, 
    signOut 
  } = useAuth();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isProfileModalOpen) {
        sfx.playClick();
        setIsProfileModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileModalOpen, setIsProfileModalOpen]);

  if (!isProfileModalOpen || !user) return null;

  const handleClose = () => {
    sfx.playClick();
    setIsProfileModalOpen(false);
  };

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0c101c] shadow-2xl p-6 sm:p-8 relative space-y-6 my-auto"
      >
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer z-20"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Profile Header */}
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white font-orbitron">{user.name}</h3>
              <span className={`text-[10px] font-fira font-bold uppercase px-2 py-0.5 rounded-full border ${
                user.tier === 'pro'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : user.tier === 'enterprise'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/10 text-slate-300 border-white/10'
              }`}>
                {user.tier === 'pro' ? 'PRO WORKSTATION' : user.tier === 'enterprise' ? 'LIFETIME FOUNDER' : 'AIR-GAP FREE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-fira mt-0.5">{user.email}</p>
            <p className="text-[10px] text-slate-500 font-fira mt-1">Active Member since {user.joinedDate}</p>
          </div>
        </div>

        {/* Real-time Sovereign Workspace Telemetry */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center space-y-1">
            <span className="text-slate-500 text-[10px] font-fira block">Cloud Uploads</span>
            <span className="text-sm font-bold font-orbitron text-emerald-400">0 Bytes</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center space-y-1">
            <span className="text-slate-500 text-[10px] font-fira block">Local In-RAM Safe</span>
            <span className="text-sm font-bold font-orbitron text-cyan-400">100%</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center space-y-1">
            <span className="text-slate-500 text-[10px] font-fira block">Saved Blueprints</span>
            <span className="text-sm font-bold font-orbitron text-purple-400">{user.savedWorkflowsCount} Graphs</span>
          </div>
        </div>

        {/* Current Plan Feature Highlights */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-fira font-semibold text-white flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> Plan Capabilities
            </span>
            {user.tier === 'free' && (
              <button
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setIsPricingModalOpen(true);
                }}
                className="text-[11px] font-fira text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-2 cursor-pointer"
              >
                Upgrade ($4.99) &rarr;
              </button>
            )}
          </div>
          <ul className="text-xs font-fira text-slate-400 space-y-1.5">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-cyan-400" />
              <span>All 73 Sovereign Client-Side PDF Tools</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-cyan-400" />
              <span>{user.tier !== 'free' ? 'Unlimited 50-File Parallel Batch Engine' : 'Standard 1-File at a time'}</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-cyan-400" />
              <span>MemoryGuard Cryptographic RAM Shredder Active</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {user.tier === 'free' ? (
            <button
              onClick={() => {
                sfx.playClick();
                setIsProfileModalOpen(false);
                setIsPricingModalOpen(true);
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crown className="w-4 h-4" />
              <span>Upgrade to Pro Workstation ($4.99)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                sfx.playClick();
                setIsProfileModalOpen(false);
                setIsPricingModalOpen(true);
              }}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-fira text-xs font-semibold transition-all cursor-pointer"
            >
              Manage Subscription Plan
            </button>
          )}

          <button
            onClick={() => {
              setIsProfileModalOpen(false);
              signOut();
            }}
            className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};