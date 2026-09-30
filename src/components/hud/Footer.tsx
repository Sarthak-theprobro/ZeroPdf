import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  GitBranch, 
  MessageSquare, 
  ExternalLink, 
  Heart, 
  Lock, 
  Cpu, 
  Zap, 
  Layers, 
  FileText, 
  CheckCircle2 
} from 'lucide-react';
import { sfx } from '@/core/audio/sfx';
import { ToolDefinition } from '@/core/types/tool';
import { getToolById } from '@/core/registry/tools';

interface FooterProps {
  onSelectTool: (tool: ToolDefinition) => void;
  onOpenFeedback: () => void;
  onOpenPricing: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onSelectTool, 
  onOpenFeedback,
  onOpenPricing 
}) => {
  const handleToolClick = (toolId: string) => {
    sfx.playClick();
    const tool = getToolById(toolId);
    if (tool) {
      onSelectTool(tool);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-white/10 bg-[#05070e]/95 backdrop-blur-2xl text-slate-400 font-fira relative z-10 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Brand & Mission Column (Spans 2 cols on LG) */}
          <div className="lg:col-span-2 space-y-4 text-left">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-emerald-400 shadow-md shadow-amber-500/20">
                <ShieldCheck className="w-4.5 h-4.5 text-black stroke-[2.5]" />
              </div>
              <span className="font-orbitron font-extrabold text-base tracking-wider text-white">
                ZERO<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400">PDF</span>
              </span>
              <span className="text-[10px] font-fira font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                AIR-GAP SOVEREIGN
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The 100% client-side, air-gapped PDF mega-workstation. Convert, edit, compress, and automate 73+ document tasks directly in your browser's private memory with zero server uploads.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>0 Bytes Uploaded</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>WebAssembly RAM</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>No Sign-Up Needed</span>
              </span>
            </div>

            {/* Direct Connect Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://github.com/Sarthak-theprobro/ZeroPdf"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs"
                title="Star on GitHub"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>

              <a
                href="https://www.linkedin.com/in/sarthak-suman-76226a17b/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:text-blue-200 transition-all flex items-center gap-2 text-xs"
                title="Connect on LinkedIn"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>LinkedIn</span>
                <ExternalLink className="w-3 h-3 text-blue-400/60" />
              </a>
            </div>
          </div>

          {/* Column 2: Popular Tools */}
          <div className="space-y-3 text-left">
            <h4 className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
              Popular Tools
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { id: 'word-to-pdf', label: 'Word to PDF (.docx)' },
                { id: 'excel-to-pdf', label: 'Excel to PDF (.xlsx)' },
                { id: 'merge-pdf', label: 'Merge PDF' },
                { id: 'split-pdf', label: 'Split PDF' },
                { id: 'compress-pdf', label: 'Compress PDF' },
                { id: 'pdf-to-word', label: 'PDF to Word' },
                { id: 'edit-pdf-text', label: 'Edit & Annotate PDF' },
                { id: 'ocr-searchable-pdf', label: 'Client-Side OCR' },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleToolClick(item.id)}
                    className="text-slate-400 hover:text-amber-300 transition-colors cursor-pointer text-left"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Security & Super-Modules */}
          <div className="space-y-3 text-left">
            <h4 className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
              Super-Modules & Privacy
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { id: 'protect-pdf', label: 'AES-256 Encrypt' },
                { id: 'auto-redact-pii', label: 'Auto-Redact PII' },
                { id: 'sign-pdf', label: 'Digital Signatures' },
                { id: '3d-flipbook-presenter', label: '3D Flipbook Presenter' },
                { id: 'node-workflow-builder', label: 'Node Automation' },
                { id: 'gst-invoice-generator', label: 'GST Invoicing Engine' },
                { id: 'pos-thermal-billing', label: 'POS Thermal Receipts' },
                { id: 'p2p-file-share', label: 'P2P WebRTC Transfer' },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleToolClick(item.id)}
                    className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer text-left"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Community & Transparency */}
          <div className="space-y-3 text-left">
            <h4 className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
              Community & Trust
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => {
                    sfx.playClick();
                    onOpenFeedback();
                  }}
                  className="text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Suggest a Feature</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    sfx.playClick();
                    onOpenFeedback();
                  }}
                  className="text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  Report a Bug
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    sfx.playClick();
                    onOpenPricing();
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Plans & Pricing (Free Forever)
                </button>
              </li>
              <li>
                <a
                  href="https://github.com/Sarthak-theprobro/ZeroPdf/blob/main/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Technical Architecture</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Sarthak-theprobro/ZeroPdf/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Open Issues</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Sub-Footer Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© 2026 ZeroPDF. Built with ❤️ by</span>
            <a
              href="https://www.linkedin.com/in/sarthak-suman-76226a17b/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-amber-400 font-semibold underline underline-offset-2 transition-colors"
            >
              Sarthak Suman
            </a>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>100% In-RAM • Zero Server Logs</span>
            </span>
            <span>•</span>
            <span>MIT Open Source</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
