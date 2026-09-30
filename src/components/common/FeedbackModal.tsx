import React, { useState, useEffect } from 'react';
import { 
  MessageSquarePlus, 
  X, 
  Send, 
  Sparkles, 
  Bug, 
  Lightbulb, 
  Heart, 
  CheckCircle2, 
  GitBranch, 
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { sfx } from '@/core/audio/sfx';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/common/NotificationToast';
import { LeadNotifier } from '@/core/auth/LeadNotifier';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [feedbackType, setFeedbackType] = useState<'feature' | 'bug' | 'praise'>('feature');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        sfx.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sfx.playSuccess();
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });

    // Dispatch email alert to owner
    LeadNotifier.notifyFeedback(email, feedbackType, message);

    // Store in localStorage for persistence
    try {
      const existing = JSON.parse(localStorage.getItem('zeropdf_user_feedbacks') || '[]');
      existing.push({
        id: `fb_${Date.now()}`,
        type: feedbackType,
        message,
        email: email || 'anonymous',
        date: new Date().toISOString(),
      });
      localStorage.setItem('zeropdf_user_feedbacks', JSON.stringify(existing));
    } catch (err) {
      console.warn('Could not save feedback to local storage:', err);
    }

    setIsSubmitted(true);
    showToast('Feedback Received!', 'Thank you for helping make ZeroPDF better.', 'success');
  };

  const handleReset = () => {
    setMessage('');
    setEmail('');
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl p-3 sm:p-6 flex justify-center items-center animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0c101c] shadow-2xl p-6 sm:p-8 space-y-6 my-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-fira font-semibold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Community Feedback & Feature Requests</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-orbitron font-extrabold text-white">
            Help Shape ZeroPDF
          </h2>
          <p className="text-xs text-slate-400 font-fira leading-relaxed">
            ZeroPDF is an independent, sovereign project built for privacy. Tell us what tools or improvements you want next!
          </p>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Type selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-fira text-slate-300 font-semibold">Feedback Type:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-300 border-amber-500/40 bg-amber-500/10' },
                  { id: 'bug', label: 'Report a Bug', icon: Bug, color: 'text-rose-300 border-rose-500/40 bg-rose-500/10' },
                  { id: 'praise', label: 'General / Praise', icon: Heart, color: 'text-pink-300 border-pink-500/40 bg-pink-500/10' },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = feedbackType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        sfx.playClick();
                        setFeedbackType(t.id as any);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-fira flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? t.color + ' ring-1 ring-white/20 font-bold'
                          : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-[11px] text-center leading-tight">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-fira text-slate-300 font-semibold">Your Message / Idea:</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  feedbackType === 'feature'
                    ? "E.g., It would be amazing to have batch OCR for handwritten notes or a specific compression mode..."
                    : feedbackType === 'bug'
                    ? "E.g., I tried converting a file with specific tables and saw an issue..."
                    : "Tell us what you like or how ZeroPDF helped your workflow!"
                }
                rows={4}
                required
                className="w-full p-3.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-amber-400 focus:outline-none text-xs font-fira text-white placeholder:text-slate-500 resize-none transition-colors"
              />
            </div>

            {/* Optional Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-fira text-slate-400">
                Email / Contact <span className="text-slate-500 font-normal">(Optional, if you'd like a response)</span>:
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com or @twitter/linkedin"
                className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-amber-400 focus:outline-none text-xs font-fira text-white placeholder:text-slate-500 transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-fira transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold font-fira text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Feedback</span>
              </button>
            </div>
          </form>
        ) : (
          /* Success State */
          <div className="py-4 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-orbitron font-bold text-white">Thank You for Your Feedback!</h3>
              <p className="text-xs text-slate-300 font-fira max-w-sm mx-auto">
                Every bit of feedback helps make ZeroPDF faster, more private, and better for everyone.
              </p>
            </div>

            {/* Connect directly links */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left space-y-3">
              <p className="text-[11px] font-fira text-slate-400 font-semibold uppercase tracking-wider">
                Want to connect directly or open a GitHub issue?
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://github.com/Sarthak-theprobro/ZeroPdf/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-fira text-white flex items-center gap-1.5 transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5 text-slate-300" />
                  <span>GitHub Issues</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>

                <a
                  href="https://www.linkedin.com/in/sarthak-suman-76226a17b/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-xs font-fira text-blue-300 flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>Message on LinkedIn</span>
                  <ExternalLink className="w-3 h-3 text-blue-400/60" />
                </a>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-fira text-xs font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
