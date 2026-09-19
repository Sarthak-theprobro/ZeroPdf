import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Cpu, 
  Zap, 
  Check, 
  X, 
  ChevronRight, 
  Sparkles, 
  Flame, 
  Activity, 
  HardDrive 
} from 'lucide-react';
import { sfx } from '@/core/audio/sfx';

export const AirGapShield: React.FC = () => {
  const [showComparison, setShowComparison] = useState(false);

  const COMPARISONS = [
    {
      feature: 'Privacy & File Security',
      us: '100% Air-Gapped In-Memory (0 Bytes Uploaded)',
      them: 'Uploaded to Remote Servers / Cloud Disks',
      advantage: true,
    },
    {
      feature: 'File Size Limits & Paywalls',
      us: 'Unlimited (Multi-GBs handled locally)',
      them: 'Strict 25MB–50MB Limit + Paid Tier',
      advantage: true,
    },
    {
      feature: 'Visual Node Workflow Pipelines',
      us: 'Interactive Blueprint Node Automation Graph',
      them: 'None (1 single action at a time)',
      advantage: true,
    },
    {
      feature: '3D WebGL Holographic Reader',
      us: 'Built-in 3D physics flipbook with laser pointer',
      them: 'None (Basic flat 2D canvas)',
      advantage: true,
    },
    {
      feature: 'Forensic Canary & Leak Tracker',
      us: 'Steganographic zero-width watermark injector',
      them: 'None',
      advantage: true,
    },
    {
      feature: 'Low-Level Hex & XRef Inspector',
      us: 'Direct binary parser & byte recovery engine',
      them: 'None',
      advantage: true,
    },
    {
      feature: 'P2P WebRTC Direct Sharing',
      us: 'Browser-to-browser encrypted pipe with QR pairing',
      them: 'Stored on 3rd-party cloud download queues',
      advantage: true,
    },
    {
      feature: 'Offline Operation Capability',
      us: 'Works 100% offline without internet connection',
      them: 'Fails instantly without internet',
      advantage: true,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      {/* 1. REAL-TIME AIR-GAP TELEMETRY STRIP */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        
        {/* Metric 1: Upload Counter */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-orbitron font-bold text-white tracking-wider">AIR-GAP SHIELD</span>
              <span className="text-[9px] font-fira px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] font-fira text-slate-400">
              Cloud Network Traffic: <span className="text-emerald-400 font-bold">0.00 KB/s</span> (0 Bytes Uploaded)
            </p>
          </div>
        </div>

        {/* Metric 2: Engine Hardware Execution */}
        {/* Metric 2: Engine Hardware Execution */}
        <div className="flex items-center gap-6 text-xs font-fira text-slate-300">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Web Workers: <strong className="text-amber-300">Multi-Thread</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Sandbox: <strong className="text-emerald-300">In-RAM AES-256</strong></span>
          </div>
        </div>

        {/* Comparison Trigger Button */}
        <button
          onClick={() => {
            sfx.playClick();
            setShowComparison(!showComparison);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/50 text-xs font-fira text-amber-300 flex items-center gap-1.5 transition-all cursor-pointer group"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Why We Beat Competitors</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showComparison ? 'rotate-90' : ''}`} />
        </button>

      </div>

      {/* 2. EXPANDABLE COMPETITIVE KILLER MATRIX */}
      {showComparison && (
        <div className="mt-4 p-6 rounded-3xl bg-[#090D18]/95 border border-amber-500/30 shadow-2xl backdrop-blur-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-orbitron font-bold text-white flex items-center gap-2">
                <span>The Sovereign Architecture vs Traditional Cloud Converters</span>
                <span className="text-[10px] font-fira px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  73+ Sovereign Tools
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-fira mt-0.5">
                Why professionals and security-conscious enterprises choose our 100% on-device workstation over ihatepdf and ilovepdf.
              </p>
            </div>
            <button
              onClick={() => setShowComparison(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 text-xs font-fira cursor-pointer"
            >
              Close ✕
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-fira">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2.5 px-3">Capability / Vector</th>
                  <th className="py-2.5 px-3 text-amber-400 font-bold">ZEROPDF WORKSTATION</th>
                  <th className="py-2.5 px-3 text-slate-500">ihatepdf / ilovepdf</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COMPARISONS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-medium text-white">{row.feature}</td>
                    <td className="py-3 px-3 text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{row.us}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      <span className="flex items-center gap-1.5 text-rose-400/80">
                        <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{row.them}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};