import React, { createContext, useContext, useState } from 'react';
import { Mail, CheckCircle2, X, Sparkles, ShieldCheck } from 'lucide-react';
import { sfx } from '@/core/audio/sfx';

interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: 'email' | 'success' | 'info';
}

interface ToastContextType {
  showToast: (title: string, description: string, type?: 'email' | 'success' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, description: string, type: 'email' | 'success' | 'info' = 'success') => {
    sfx.playSuccess();
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Top-Right Alert Container */}
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto p-4 rounded-2xl bg-[#0c101c]/95 border border-cyan-500/30 shadow-2xl backdrop-blur-xl flex items-start gap-3 animate-fade-in text-xs font-fira text-white"
          >
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0">
              {toast.type === 'email' ? (
                <Mail className="w-4 h-4 text-cyan-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white truncate text-xs">{toast.title}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{toast.description}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-white p-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};