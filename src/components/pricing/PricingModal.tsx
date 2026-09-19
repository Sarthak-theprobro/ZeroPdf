import React, { useEffect } from 'react';
import { X, Check, Sparkles, Crown } from 'lucide-react';
import { useAuth, UserTier } from '@/core/auth/AuthContext';
import { sfx } from '@/core/audio/sfx';

export const PricingModal: React.FC = () => {
  const { isPricingModalOpen, setIsPricingModalOpen, user, upgradeTier } = useAuth();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPricingModalOpen) {
        sfx.playClick();
        setIsPricingModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPricingModalOpen, setIsPricingModalOpen]);

  if (!isPricingModalOpen) return null;

  const handleClose = () => {
    sfx.playClick();
    setIsPricingModalOpen(false);
  };

  const TIERS = [
    {
      id: 'free' as UserTier,
      name: 'Air-Gap Free',
      price: '$0',
      period: 'forever',
      description: '100% sovereign local processing with zero watermarks.',
      features: [
        'All 73 Sovereign PDF & Conversion Tools',
        '100% Air-Gapped In-Memory Execution',
        'Single Document Transformations',
        '3D Holographic Flipbook Presenter',
        'Standard Lossless Compression',
      ],
      badge: 'FREE FOREVER',
      cta: 'Current Plan',
      isCurrent: user?.tier === 'free' || !user,
      highlight: false,
    },
    {
      id: 'pro' as UserTier,
      name: 'Pro Workstation',
      price: '$4.99',
      period: 'per month ($39/year)',
      description: 'Cheaper than a coffee. High-speed multi-file batch & AI.',
      features: [
        'Unlimited 50-File Parallel Batch Engine',
        'Visual Node Workflow Automator',
        'Steganographic Canary Leak Tracker',
        'On-Device AI RAG Chat & Legal Risk Analyzer',
        'Tesseract WASM 100+ Language OCR',
        '600 DPI High-Res Vector & PDF/A Export',
      ],
      badge: 'MOST POPULAR',
      cta: 'Upgrade for $4.99',
      isCurrent: user?.tier === 'pro',
      highlight: true,
    },
    {
      id: 'enterprise' as UserTier,
      name: 'Lifetime Founder',
      price: '$49',
      period: 'one-time payment',
      description: 'Pay once, own forever. Zero recurring subscription fees.',
      features: [
        'Lifetime Unlimited Pro Workstation Access',
        'All Future Tool Updates & AI Models Included',
        'Team P2P Collaborative Review Canvas',
        'Commercial Enterprise Usage License',
        'Priority Web Worker GPU Allocation',
        'Exclusive Founder Badge & Direct Support',
      ],
      badge: 'LIMITED LIFETIME DEAL',
      cta: 'Get Lifetime Access ($49)',
      isCurrent: user?.tier === 'enterprise',
      highlight: false,
    },
  ];

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl p-3 sm:p-6 md:p-8 flex justify-center items-start animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0c101c] shadow-2xl p-5 sm:p-8 space-y-6 my-4 sm:my-8"
      >
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer z-30"
          title="Close Pricing (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-fira font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fair & Transparent Sovereign Pricing</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-orbitron font-extrabold text-white">
            UNLEASH FULL POWER
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-fira">
            No cloud surveillance. Upgrade to unlock 50-file parallel batch processing, AI RAG intelligence, and blueprint automation.
          </p>
        </div>

        {/* Tier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between relative ${
                tier.highlight
                  ? 'bg-gradient-to-b from-cyan-950/40 to-[#0c101c] border-cyan-400/60 shadow-2xl shadow-cyan-500/15 ring-1 ring-cyan-400/40'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20'
              }`}
            >
              {tier.badge && (
                <span
                  className={`absolute -top-3 left-6 text-[10px] font-fira font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    tier.highlight
                      ? 'bg-cyan-400 text-black shadow-md'
                      : tier.id === 'enterprise'
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  {tier.badge}
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-orbitron font-bold text-white flex items-center gap-2">
                    {tier.name}
                    {tier.id === 'enterprise' && <Crown className="w-4 h-4 text-amber-400" />}
                  </h3>
                  <p className="text-xs text-slate-400 font-fira mt-1 min-h-[32px]">{tier.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white font-orbitron">{tier.price}</span>
                  <span className="text-xs text-slate-500 font-fira">/{tier.period}</span>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 text-xs font-fira border-t border-white/5 pt-4">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => upgradeTier(tier.id)}
                  disabled={tier.isCurrent}
                  className={`w-full py-2.5 rounded-xl font-fira text-xs font-bold transition-all cursor-pointer ${
                    tier.isCurrent
                      ? 'bg-white/5 text-slate-500 border border-white/10 cursor-default'
                      : tier.highlight
                      ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black shadow-lg shadow-cyan-500/20'
                      : tier.id === 'enterprise'
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black shadow-lg shadow-amber-500/20'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {tier.isCurrent ? 'Current Plan' : tier.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Side-by-Side Comparison Table */}
        <div className="border border-white/10 rounded-2xl bg-white/[0.02] p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-orbitron font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Full Capability Matrix: Free vs. Pro</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-fira border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Capability</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-300">🟢 Air-Gap Free ($0)</th>
                  <th className="py-2.5 px-3 font-semibold text-cyan-300">👑 Pro Workstation ($4.99)</th>
                  <th className="py-2.5 px-3 font-semibold text-amber-300">⚡ Lifetime Founder ($49)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="py-2.5 px-3 font-medium text-white">Tool Access</td>
                  <td className="py-2.5 px-3 text-slate-400">All 73+ Standard Tools</td>
                  <td className="py-2.5 px-3 text-cyan-300 font-semibold">All 73+ Tools + Super Modules</td>
                  <td className="py-2.5 px-3 text-amber-300 font-semibold">All Tools + Future Updates</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-white">Parallel Batch Engine</td>
                  <td className="py-2.5 px-3 text-slate-400">1 File at a time (Sequential)</td>
                  <td className="py-2.5 px-3 text-cyan-300 font-semibold">50 Files Simultaneously</td>
                  <td className="py-2.5 px-3 text-amber-300 font-semibold">50 Files (Priority GPU/Workers)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-white">Automation Pipelines</td>
                  <td className="py-2.5 px-3 text-slate-400">Single action per run</td>
                  <td className="py-2.5 px-3 text-cyan-300 font-semibold">Visual Node Workflow Builder</td>
                  <td className="py-2.5 px-3 text-amber-300 font-semibold">Unlimited Custom Blueprints</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-white">OCR Text Recognition</td>
                  <td className="py-2.5 px-3 text-slate-400">Standard Text Extraction</td>
                  <td className="py-2.5 px-3 text-cyan-300 font-semibold">Tesseract WASM 100+ Lang OCR</td>
                  <td className="py-2.5 px-3 text-amber-300 font-semibold">Tesseract WASM 100+ Lang OCR</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-white">Export Quality</td>
                  <td className="py-2.5 px-3 text-slate-400">Standard 150/300 DPI</td>
                  <td className="py-2.5 px-3 text-cyan-300 font-semibold">600 DPI Vector & PDF/A Archival</td>
                  <td className="py-2.5 px-3 text-amber-300 font-semibold">600 DPI Vector & PDF/A Archival</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-white">On-Device AI Studio</td>
                  <td className="py-2.5 px-3 text-slate-400">Basic Summary</td>
                  <td className="py-2.5 px-3 text-cyan-300 font-semibold">AI RAG Chat & Legal Risk Analyzer</td>
                  <td className="py-2.5 px-3 text-amber-300 font-semibold">AI RAG Chat & Legal Risk Analyzer</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-white">Desktop Experience</td>
                  <td className="py-2.5 px-3 text-slate-400">Browser Web App</td>
                  <td className="py-2.5 px-3 text-cyan-300 font-semibold">Offline Standalone Desktop PWA</td>
                  <td className="py-2.5 px-3 text-amber-300 font-semibold">Offline Standalone Desktop PWA</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium text-white">Commercial License</td>
                  <td className="py-2.5 px-3 text-slate-400">Personal Use</td>
                  <td className="py-2.5 px-3 text-cyan-300 font-semibold">Commercial License Included</td>
                  <td className="py-2.5 px-3 text-amber-300 font-semibold">Commercial & Enterprise License</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};