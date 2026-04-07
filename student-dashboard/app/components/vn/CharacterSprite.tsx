// CharacterSprite component - displays character visual from spritesheet
// Shows character name, role, and emotion state with animations

'use client';

import { useEffect, useState } from 'react';

interface CharacterSpriteProps {
  name: string;
  role: string;
  emotion?: string;
}

// Map emotion to frame index (left to right in spritesheet)
function getEmotionFrameIndex(emotion?: string): number {
  switch (emotion?.toLowerCase()) {
    case 'neutral':
      return 0;
    case 'encouraging':
      return 1;
    case 'concerned':
      return 2;
    case 'challenging':
      return 3;
    case 'surprised':
      return 4;
    default:
      return 0; // Default to neutral
  }
}

// Get animation class based on emotion (shorter duration for sprite)
function getSpriteEmotionAnimation(emotion?: string): string {
  switch (emotion?.toLowerCase()) {
    case 'neutral':
      return 'animate-sprite-neutral';
    case 'concerned':
      return 'animate-sprite-concerned';
    case 'encouraging':
      return 'animate-sprite-encouraging';
    case 'surprised':
      return 'animate-sprite-surprised';
    case 'challenging':
      return 'animate-sprite-neutral';
    default:
      return '';
  }
}

export function CharacterSprite({ name, role, emotion }: CharacterSpriteProps) {
  const [animationKey, setAnimationKey] = useState(0);

  // Trigger animation on emotion change
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [emotion]);

  const frameIndex = getEmotionFrameIndex(emotion);
  const animationClass = getSpriteEmotionAnimation(emotion);

  // Spritesheet configuration - scaled up 1.5x
  const totalFrames = 5;
  const spriteWidth = 1000; // Total width of sprite_test.png
  const spriteHeight = 500; // Height of sprite_test.png
  const frameWidth = spriteWidth / totalFrames; // 200px per frame
  const scale = 1.5; // Scale factor

  return (
    <div className="flex flex-col items-center justify-center p-8 -mb-28">
      {/* Sprite container with viewing window */}
      <div
        key={animationKey}
        className={`
          relative overflow-hidden
          shadow-2xl shadow-terracotta/20
          ${animationClass}
        `}
        style={{
          width: `${frameWidth * scale}px`,
          height: `${spriteHeight * scale}px`,
        }}
      >
        {/* Spritesheet background positioned to show correct frame */}
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 'url(/sprite_test.png)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: `-${frameIndex * frameWidth * scale}px 0px`,
            backgroundSize: `${spriteWidth * scale}px ${spriteHeight * scale}px`,
          }}
        />
      </div>

      <style jsx>{`
        @keyframes sprite-neutral {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes sprite-concerned {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-6px) rotate(-2deg); }
          75% { transform: translateX(6px) rotate(2deg); }
        }

        @keyframes sprite-encouraging {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        @keyframes sprite-surprised {
          0%, 100% { transform: translateY(0) scale(1); }
          40% { transform: translateY(-15px) scale(1.05); }
        }

        :global(.animate-sprite-neutral) {
          animation: sprite-neutral 1s ease-in-out;
        }

        :global(.animate-sprite-concerned) {
          animation: sprite-concerned 1.2s ease-in-out;
        }

        :global(.animate-sprite-encouraging) {
          animation: sprite-encouraging 0.4s ease-in-out;
        }

        :global(.animate-sprite-surprised) {
          animation: sprite-surprised 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
