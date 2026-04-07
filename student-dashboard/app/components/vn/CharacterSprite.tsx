// CharacterSprite component - displays character visual from spritesheet
// Shows character name, role, and emotion state with animations
//
// ADJUSTABLE PARAMETERS (see lines 60-75):
// - scale: Overall size multiplier (1.5 = 150% size)
// - cropTopPercent: Crop from top (0-50, default 15 to remove annotations)
// - cropBottomPercent: Crop from bottom (0-50, default 0)
// - contrast: CRT effect contrast (1.0 = normal, 1.05 = slightly sharper)
// - brightness: CRT effect brightness (1.0 = normal, 0.95 = slightly dimmer)
// - imageRendering: 'pixelated' for retro look, 'auto' for smooth

'use client';

import { useEffect, useState } from 'react';

interface CharacterSpriteProps {
  name: string;
  role: string;
  emotion?: string;
  isActive?: boolean;
  position?: 'left' | 'right' | 'center';
  gender?: string;
  spriteIndex?: number;
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

export function CharacterSprite({ name, role, emotion, isActive = true, position = 'center', gender, spriteIndex }: CharacterSpriteProps) {
  const [animationKey, setAnimationKey] = useState(0);

  // Trigger animation only when character becomes active and emotion changes
  useEffect(() => {
    if (isActive) {
      setAnimationKey(prev => prev + 1);
    }
  }, [emotion, isActive]);

  const frameIndex = getEmotionFrameIndex(emotion);
  const animationClass = getSpriteEmotionAnimation(emotion);

  // Construct sprite path based on gender and sprite index
  // Falls back to sprite_test.png if no mapping provided
  // Note: "neutral" gender uses female sprite pool (more variety)
  const spriteFolder = gender === 'neutral' ? 'female' : gender;
  const spritePath = spriteFolder && spriteIndex
    ? `/${spriteFolder}/sprite_sheet${spriteIndex}.png`
    : '/sprite_test.png';

  // Spritesheet configuration - scaled up 1.5x
  const totalFrames = 5;
  const spriteWidth = 980; // Total width of sprite_test.png
  const spriteHeight = 500; // Height of sprite_test.png
  const frameWidth = spriteWidth / totalFrames; // 200px per frame
  const scale = 1.65; // Scale factor

  // Crop settings - adjust these to crop out annotations at top
  const cropTopPercent = 17; // Crop 15% from top (adjust 0-50)
  const cropBottomPercent = 0; // Crop from bottom if needed (adjust 0-50)
  const visibleHeight = spriteHeight * (1 - (cropTopPercent + cropBottomPercent) / 100);

  return (
    <div className="flex flex-col items-center justify-center p-8 -mb-28 transition-all duration-700 ease-out">
      {/* Sprite container with viewing window - cropped to remove annotations */}
      <div
        key={animationKey}
        className={`
          relative overflow-hidden
          shadow-2xl shadow-terracotta/20
          transition-opacity duration-500 ease-in-out
          ${!isActive ? 'opacity-40' : 'opacity-100'}
          ${isActive ? animationClass : ''}
        `}
        style={{
          width: `${(frameWidth-15) * scale}px`,
          height: `${visibleHeight * scale}px`,
          imageRendering: 'pixelated',
          filter: 'contrast(1.2) brightness(0.85)',
        }}
      >
        {/* Spritesheet background positioned to show correct frame */}
        <div
          className="w-full h-full transition-all duration-300 ease-in-out"
          style={{
            backgroundImage: `url(${spritePath})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: `-${frameIndex * frameWidth * scale}px -${(spriteHeight * cropTopPercent / 100) * scale}px`,
            backgroundSize: `${spriteWidth * scale}px ${spriteHeight * scale}px`,
            imageRendering: 'pixelated',
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
