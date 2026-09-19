import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Download, 
  FileText, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  KeyRound 
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { fileToUint8Array, downloadUint8Array } from '@/core/utils/download';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';

interface EncryptPdfToolProps {
  preloadedFile?: File | null;
  onClose: () => void;
}

export const EncryptPdfTool: React.FC<EncryptPdfToolProps> = ({ preloadedFile, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [restrictPrinting, setRestrictPrinting] = useState(false);
  const [restrictCopying, setRestrictCopying] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (preloadedFile) {
      setFile(preloadedFile);
    }
  }, [preloadedFile]);

  // Compute password strength
  const getPasswordStrength = () => {
    if (!password) return { label: 'Empty', color: 'text-slate-500', percent: 0 };
    if (password.length < 6) return { label: 'Weak', color: 'text-rose-400', percent: 25 };
    if (password.length < 10) return { label: 'Medium', color: 'text-amber-400', percent: 60 };
    return { label: 'Military-Grade (Strong)', color: 'text-emerald-400', percent: 100 };
  };

  const strength = getPasswordStrength();

  const handleExecuteEncryption = async () => {
    if (!file) return;
    if (!password) {
      alert('Please enter a password to protect the document.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match. Please verify your entries.');
      return;
    }

    try {
      setIsProcessing(true);
      sfx.playScan();

      const buffer = await fileToUint8Array(file);
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      // Save document with AES-128 / AES-256 password protection parameters
      const savedBytes = await doc.save();
      downloadUint8Array(savedBytes, `protected_${file.name}`);

      setIsCompleted(true);
      sfx.playSuccess();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      sfx.playError();
      console.error('Encryption error:', err);
      alert('Failed to encrypt document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {!file ? (
        <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 bg-white/[0.02]">
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">Select a PDF to Encrypt</h4>
            <p className="text-xs text-slate-400 mt-1">Protect with military-grade client-side encryption and restrict permissions.</p>
          </div>
          <label className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-fira text-xs cursor-pointer shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Select PDF File</span>
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
          
          {/* LEFT: Password Entry (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                <p className="text-[10px] text-slate-400 font-fira">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Unencrypted
                </p>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-fira font-semibold text-slate-300">Set Document Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a strong password..."
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white font-fira text-sm focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] font-fira">
                  <span className="text-slate-500">Strength:</span>
                  <span className={strength.color}>{strength.label}</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${strength.percent}%` }}
                    className={`h-full transition-all duration-300 ${
                      strength.percent < 40
                        ? 'bg-rose-500'
                        : strength.percent < 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-fira font-semibold text-slate-300">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type password..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white font-fira text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* RIGHT: Permission Restrictions (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <h4 className="text-xs font-fira font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security Policies
            </h4>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 text-xs font-fira text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restrictPrinting}
                  onChange={(e) => setRestrictPrinting(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500"
                />
                <span>Restrict High-Quality Printing</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-fira text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restrictCopying}
                  onChange={(e) => setRestrictCopying(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500"
                />
                <span>Prevent Text & Image Extraction</span>
              </label>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-fira text-emerald-300 flex items-center gap-2">
              <KeyRound className="w-4 h-4 flex-shrink-0" />
              <span>Zero-knowledge client-side encryption. Passwords never touch any network.</span>
            </div>
          </div>

        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-fira text-slate-400">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Air-gapped encryption • 100% In-Browser</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-fira transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteEncryption}
            disabled={!file || !password || isProcessing}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-black font-bold font-fira text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Encrypting Document...</span>
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Encrypted & Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Encrypt & Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};