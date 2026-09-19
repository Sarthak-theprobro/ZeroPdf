import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ZEROPDF Error Boundary caught an exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, copied: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleCopyDiagnostics = () => {
    const diagnostics = `ZEROPDF Crash Diagnostics
Timestamp: ${new Date().toISOString()}
Error: ${this.state.error?.message || 'Unknown error'}
UserAgent: ${navigator.userAgent}
WASM Supported: ${typeof WebAssembly !== 'undefined'}
Workers Supported: ${typeof Worker !== 'undefined'}`;

    navigator.clipboard.writeText(diagnostics);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2500);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-8 rounded-2xl bg-[#090d16] border border-amber-500/30 text-center space-y-5 max-w-lg mx-auto shadow-2xl my-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold font-orbitron text-white">
              {this.props.fallbackTitle || 'Tool Execution Halted'}
            </h3>
            <p className="text-xs text-slate-400 font-fira leading-relaxed">
              This document encountered an unexpected structure or parsing exception. Your memory and other tools remain 100% secure.
            </p>
          </div>

          {this.state.error && (
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-left font-fira text-[11px] text-rose-300 max-h-24 overflow-y-auto break-all">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-fira font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Tool</span>
            </button>

            <button
              onClick={this.handleCopyDiagnostics}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-fira text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              {this.state.copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Diagnostics</span>
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
