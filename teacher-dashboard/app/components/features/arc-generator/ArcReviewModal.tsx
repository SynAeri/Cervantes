// Arc review modal - popup overlay for reviewing generated arc
// Replaces full-page review step

'use client';

import type { Arc } from '../../../lib/types';
import { ArcReview } from './ArcReview';

interface ArcReviewModalProps {
  arc: Arc;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onRegenerate: () => void;
}

export function ArcReviewModal({ arc, isOpen, onClose, onApprove, onRegenerate }: ArcReviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-parchment rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-warm-grey bg-warm-white">
          <div>
            <h2 className="text-xl font-bold text-primary">Review Generated Arc</h2>
            <p className="text-[11px] text-tertiary mt-1">Review the narrative structure before approval</p>
          </div>
          <button
            onClick={onClose}
            className="text-tertiary hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <ArcReview
            arc={arc}
            onApprove={onApprove}
            onRegenerate={onRegenerate}
          />
        </div>
      </div>
    </div>
  );
}
