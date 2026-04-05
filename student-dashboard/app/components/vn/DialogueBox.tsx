// DialogueBox component with typewriter effect
// Displays character dialogue with emotion and name

'use client';

import { useState, useEffect } from 'react';

interface DialogueBoxProps {
  character: string;
  text: string;
  emotion?: string;
  onNext: () => void;
}

export function DialogueBox({ character, text, emotion, onNext }: DialogueBoxProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 30); // 30ms per character for smooth typewriter effect

    return () => clearInterval(interval);
  }, [text]);

  const handleClick = () => {
    if (!isComplete) {
      // Skip to end
      setDisplayedText(text);
      setIsComplete(true);
    } else {
      onNext();
    }
  };

  return (
    <div
      className="bg-near-black/95 p-8 rounded-t-xl cursor-pointer transition-all hover:bg-near-black"
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="text-terracotta font-bold text-lg tracking-tight">{character}</div>
        {emotion && (
          <span className="text-xs text-wheat-gold/70 italic">*{emotion}*</span>
        )}
      </div>
      <p className="text-parchment leading-relaxed text-base min-h-[60px]">
        {displayedText}
        {!isComplete && <span className="animate-pulse">|</span>}
      </p>
      {isComplete && (
        <div className="flex justify-end mt-4">
          <div className="text-xs text-tertiary/50 flex items-center gap-2">
            Click to continue
            <span className="material-symbols-outlined text-sm animate-pulse">arrow_forward</span>
          </div>
        </div>
      )}
    </div>
  );
}
