import React, { useState } from 'react';
import { X, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthContext';
import { sfx } from '@/core/audio/sfx';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, signInWithGoogle, signInWithEmail, isLoading, pendingTier } = useAuth();
  const [email, setEmail] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) signInWithEmail(email);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c101c] shadow-2xl p-6 sm:p-8 relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={() => {
            sfx.playClick();
            setIsAuthModalOpen(false);
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center mx-auto text-black shadow-lg shadow-cyan-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-orbitron font-bold text-white tracking-wide">
            {pendingTier && pendingTier !== 'free' ? 'SIGN IN TO COMPLETE UPGRADE' : 'ENTER ZEROPDF STUDIO'}
          </h3>
          <p className="text-xs text-slate-400 font-fira">
            {pendingTier && pendingTier !== 'free'
              ? `Sign in to activate your ${pendingTier === 'pro' ? 'Pro Workstation ($4.99)' : 'Lifetime Founder ($49)'} license.`
              : 'Save node blueprints, sync custom presets, and unlock Pro capabilities.'}
          </p>
        </div>

        {/* Google OAuth Button */}
        <div className="space-y-3">
          <button
            onClick={() => signInWithGoogle()}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 text-white font-fira text-xs font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-slate-600">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] font-fira uppercase">or email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email Magic Link Form */}
        <form onSubmit={handleSubmitEmail} className="space-y-3">
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-fira text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Send Magic Sign-In Link</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Air-Gap Notice */}
        <p className="text-[10px] font-fira text-slate-500 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Your document files never touch your user account. 100% In-RAM.</span>
        </p>

      </div>
    </div>
  );
};