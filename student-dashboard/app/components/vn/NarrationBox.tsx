// NarrationBox component for [narration] tags
// Displays scene-setting text with subtle styling

'use client';

import { useState, useEffect } from 'react';

interface NarrationBoxProps {
  content: string;
  onNext: () => void;
}

export function NarrationBox({ content, onNext }: NarrationBoxProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div
      className={`
        bg-near-black/80 p-6 rounded-xl border border-wheat-gold/20 cursor-pointer
        transition-all duration-500 hover:border-wheat-gold/40
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={onNext}
    >
      <p className="text-parchment/90 italic leading-relaxed text-center text-sm">
        {content}
      </p>
      <div className="flex justify-center mt-4">
        <div className="text-xs text-tertiary/30 flex items-center gap-2">
          Click to continue
        </div>
      </div>
    </div>
  );
}
