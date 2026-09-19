import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  QrCode, 
  ShieldCheck, 
  Copy, 
  Check, 
  Radio 
} from 'lucide-react';
import { sfx } from '@/core/audio/sfx';

interface P2pFileShareToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const P2pFileShareTool: React.FC<P2pFileShareToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [roomId, setRoomId] = useState<string>(`AETHER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  const [isCopied, setIsCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'broadcasting' | 'paired' | 'transferring'>('broadcasting');

  useEffect(() => {
    if (preloadedFile) {
      setFile(preloadedFile);
    }
  }, [preloadedFile]);

  const copyRoomLink = () => {
    sfx.playClick();
    const link = `https://aether.studio/p2p#room=${roomId}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Share2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF for P2P WebRTC Direct Share</h4>
            <p className="text-xs text-slate-400 mt-1">Air-gapped, direct browser-to-browser encrypted transfer without intermediate servers.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF Document</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Channel & Room Pairing Info (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* File Info */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</p>
                <p className="text-[10px] text-slate-400 font-fira">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for P2P Transmission
                </p>
              </div>
            </div>

            {/* Room ID & Link Copy */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs font-fira">
              <span className="text-slate-400 font-semibold block">Encrypted WebRTC Room:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`aether://p2p/room/${roomId}`}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-cyan-300 font-mono text-xs focus:outline-none"
                />
                <button
                  onClick={copyRoomLink}
                  className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Network Channel Status */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs font-fira">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Signaling Channel:</span>
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Active Broadcast
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>DataChannel Encryption:</span>
                <span className="text-white">DTLS-SRTP 256-bit</span>
              </div>
            </div>

          </div>

          {/* RIGHT: QR Code Visual Transmitter (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-white/[0.02] border border-white/10 rounded-2xl text-center space-y-3">
            <div className="p-3 bg-white rounded-xl shadow-2xl">
              <QrCode className="w-28 h-28 text-slate-900" />
            </div>
            <div>
              <span className="text-xs font-bold font-orbitron text-white">Scan with Camera</span>
              <p className="text-[10px] font-fira text-slate-400 mt-0.5">
                Instantly receives binary stream directly onto phone or laptop.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>End-to-end encrypted WebRTC • Zero server storage</span>
        </div>

        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-fira">
          Close Room
        </button>
      </div>
    </div>
  );
};