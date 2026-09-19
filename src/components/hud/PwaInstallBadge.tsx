import React, { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';
import { sfx } from '@/core/audio/sfx';

export const PwaInstallBadge: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    sfx.playClick();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        sfx.playSuccess();
      }
      setDeferredPrompt(null);
    } else {
      alert('ZEROPDF is ready for offline browser bookmarking or standalone desktop installation!');
    }
  };

  if (isInstalled) return null;

  return (
    <button
      onClick={handleInstallClick}
      title="Install Native Desktop App (100% Offline)"
      className="h-9 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 text-xs font-fira transition-all cursor-pointer whitespace-nowrap shrink-0 hidden lg:flex items-center gap-1.5"
    >
      <Monitor className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
      <span>Install App</span>
    </button>
  );
};