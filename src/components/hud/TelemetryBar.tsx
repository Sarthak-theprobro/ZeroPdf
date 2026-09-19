import React from 'react';
import { Cpu, HardDrive, ShieldCheck, Zap, Activity } from 'lucide-react';

export const TelemetryBar: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#02040a]/90 backdrop-blur-md py-2 px-4 text-[11px] font-fira text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Engine Metrics */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>WASM-CORE: <strong className="text-white">ACTIVE</strong></span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-purple-400">
            <Zap className="w-3.5 h-3.5" />
            <span>WORKERS: <strong className="text-white">MULTI-THREADED</strong></span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>BUFFER: <strong className="text-white">AIR-GAPPED</strong></span>
          </div>
        </div>

        {/* Right: Security & Telemetry Heartbeat */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-400">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            <span>STORAGE: <strong>LOCAL ONLY</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span className="text-[10px] tracking-wider font-semibold">ALL 80+ TOOLS LOADED</span>
          </div>
        </div>

      </div>
    </footer>
  );
};