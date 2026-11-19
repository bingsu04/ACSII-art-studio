import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/95 border border-white/15 text-slate-100 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
      {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
      {toast.type === 'error' && <AlertCircle size={18} className="text-rose-400 shrink-0" />}
      {toast.type === 'info' && <Info size={18} className="text-indigo-400 shrink-0" />}

      <div>
        <div className="text-xs font-semibold">{toast.title}</div>
        {toast.description && (
          <div className="text-[11px] text-slate-400">{toast.description}</div>
        )}
      </div>
    </div>
  );
};
