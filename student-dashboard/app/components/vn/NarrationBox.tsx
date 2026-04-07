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
        relative px-6 md:px-8 pt-14 mb-4 cursor-pointer
        transition-all duration-500
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={onNext}
    >
      <p className="text-parchment/70 italic leading-relaxed text-xs md:text-sm font-light">
        {content}
      </p>
      <div className="absolute right-6 md:right-8 bottom-0">
        <span className="material-symbols-outlined text-[10px] text-parchment/30 animate-pulse">keyboard_double_arrow_right</span>
      </div>
    </div>
  );
}
