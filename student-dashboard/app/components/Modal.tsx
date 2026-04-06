// Reusable modal component for student dashboard
// Dark theme aesthetic with backdrop blur

'use client';

import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showCloseButton?: boolean;
}

export function Modal({ isOpen, onClose, children, title, subtitle, showCloseButton = true }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-near-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-near-black border border-parchment/20 rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header (if title provided) */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-parchment/20">
            <div>
              <h2 className="text-lg font-bold text-parchment">{title}</h2>
              {subtitle && (
                <p className="text-xs text-parchment/60 mt-1">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-parchment/60 hover:text-parchment transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
