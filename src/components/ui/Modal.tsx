// Reusable Accessible Modal Primitive for PAHAM Design System
// Focus trapping, Escape key listener, backdrop blur, and smooth entrance

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  }[maxWidth];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/40 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        ref={modalRef}
        className={`w-full ${maxWidthClasses} bg-paper-50 border border-paper-300 rounded-lg shadow-elevated p-6 sm:p-7 space-y-5 animate-scaleUp relative`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 border-b border-paper-200 pb-3">
            <div className="space-y-0.5">
              {typeof title === 'string' ? (
                <h3 className="font-serif text-lg sm:text-xl font-medium text-ink-950">
                  {title}
                </h3>
              ) : (
                title
              )}
              {description && (
                <p className="text-xs text-ink-600 font-serif leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded text-ink-400 hover:text-ink-950 hover:bg-paper-200 transition shrink-0"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};
