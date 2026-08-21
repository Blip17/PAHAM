// Centralized Toast Notification System for PAHAM
// Calm academic toasts with auto-dismiss, icon indicators, and ToastProvider context

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'info' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  success: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastItem = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    const duration = toast.durationMs ?? 4000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const warning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message });
  }, [showToast]);

  const info = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  const error = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, warning, info, error }}>
      {children}
      
      {/* Toast Container Stack */}
      <div 
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const icon = {
            success: <CheckCircle2 className="w-4 h-4 text-moss-800 shrink-0" />,
            warning: <AlertCircle className="w-4 h-4 text-amber-800 shrink-0" />,
            info: <Info className="w-4 h-4 text-ink-700 shrink-0" />,
            error: <AlertCircle className="w-4 h-4 text-terracotta-800 shrink-0" />,
          }[t.type];

          const borderColors = {
            success: 'border-moss-300 bg-paper-50',
            warning: 'border-amber-300 bg-paper-50',
            info: 'border-paper-300 bg-paper-50',
            error: 'border-terracotta-300 bg-paper-50',
          }[t.type];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-md border shadow-elevated flex items-start justify-between gap-3 text-xs animate-slideUp ${borderColors}`}
              role="alert"
            >
              <div className="flex items-start gap-2.5">
                {icon}
                <div className="space-y-0.5">
                  <span className="font-semibold text-ink-950 block">{t.title}</span>
                  {t.message && (
                    <p className="text-ink-600 font-serif leading-relaxed">{t.message}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="text-ink-400 hover:text-ink-900 transition p-0.5 shrink-0"
                aria-label="Tutup notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
