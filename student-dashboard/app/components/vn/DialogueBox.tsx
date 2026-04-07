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

// Get animation class based on emotion
function getEmotionAnimation(emotion?: string): string {
  switch (emotion?.toLowerCase()) {
    case 'neutral':
      return 'animate-vn-neutral';
    case 'concerned':
      return 'animate-vn-concerned';
    case 'encouraging':
      return 'animate-vn-encouraging';
    case 'surprised':
      return 'animate-vn-surprised';
    case 'challenging':
      return 'animate-vn-neutral'; // Same as neutral
    default:
      return 'animate-vn-neutral';
  }
}

// Get emotion icon/text
function getEmotionIcon(emotion?: string): string | null {
  switch (emotion?.toLowerCase()) {
    case 'encouraging':
      return '>_<';
    case 'surprised':
      return '!';
    default:
      return null;
  }
}

// Format text with markdown-style emphasis and color coding
function formatText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Match **bold** and *italic* patterns
  const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add formatted text
    if (match[1]) {
      // **bold** - Color: terracotta (primary accent)
      parts.push(
        <strong key={match.index} className="text-terracotta font-bold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // *italic/emphasis* - Color: wheat-gold (secondary accent)
      parts.push(
        <em key={match.index} className="text-wheat-gold font-medium not-italic">
          {match[4]}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function DialogueBox({ character, text, emotion, onNext }: DialogueBoxProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showEmotionIcon, setShowEmotionIcon] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    setShowEmotionIcon(false);

    // Show emotion icon briefly at start
    const emotionIcon = getEmotionIcon(emotion);
    if (emotionIcon) {
      setShowEmotionIcon(true);
      setTimeout(() => setShowEmotionIcon(false), 1500);
    }

    // Trigger fade-in after a brief delay
    const fadeInTimer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(fadeInTimer);
  }, [text, emotion]);

  const handleClick = () => {
    onNext();
  };

  const animationClass = getEmotionAnimation(emotion);
  const emotionIconText = getEmotionIcon(emotion);

  return (
    <div
      className="relative mb-4 px-6 md:px-8 pt-14 cursor-pointer"
      onClick={handleClick}
    >
      {/* Character name and emotion indicator in top left */}
      <div className={`absolute top-4 left-6 md:left-8 flex items-center gap-3 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        {/* Animated emotion circle */}
        <div className={`w-8 h-8 rounded-full bg-wheat-gold/20 border border-wheat-gold/40 flex items-center justify-center ${animationClass}`}>
          <div className="w-4 h-4 rounded-full bg-wheat-gold/60"></div>
        </div>

        <span className="text-wheat-gold text-sm font-medium tracking-wide">
          {character}
        </span>

        {/* Floating emotion icon */}
        {showEmotionIcon && emotionIconText && (
          <div className="absolute -top-6 left-0 text-wheat-gold text-xl font-bold animate-vn-emotion-float">
            {emotionIconText}
          </div>
        )}
      </div>

      <p className={`text-parchment/95 leading-relaxed font-light text-xs md:text-sm transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        {formatText(text)}
      </p>
      <div className={`absolute right-6 md:right-8 bottom-0 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <span className="material-symbols-outlined text-[10px] text-parchment/40 animate-pulse">keyboard_double_arrow_right</span>
      </div>

      <style jsx>{`
        @keyframes vn-neutral {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes vn-concerned {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-4px) rotate(-3deg); }
          75% { transform: translateX(4px) rotate(3deg); }
        }

        @keyframes vn-encouraging {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        @keyframes vn-surprised {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-8px) scale(1.1); }
          50% { transform: translateY(-10px) scale(1.15); }
        }

        @keyframes vn-emotion-float {
          0% { opacity: 0; transform: translateY(10px); }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-20px); }
        }

        :global(.animate-vn-neutral) {
          animation: vn-neutral 2s ease-in-out;
        }

        :global(.animate-vn-concerned) {
          animation: vn-concerned 2s ease-in-out infinite;
        }

        :global(.animate-vn-encouraging) {
          animation: vn-encouraging 0.6s ease-in-out;
        }

        :global(.animate-vn-surprised) {
          animation: vn-surprised 0.8s ease-out;
        }

        :global(.animate-vn-emotion-float) {
          animation: vn-emotion-float 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
