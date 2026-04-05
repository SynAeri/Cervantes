// CharacterSprite component - displays character visual
// Shows character name, role, and emotion state

'use client';

interface CharacterSpriteProps {
  name: string;
  role: string;
  emotion?: string;
}

export function CharacterSprite({ name, role, emotion }: CharacterSpriteProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="
        w-48 h-48 rounded-full bg-gradient-to-br from-terracotta/20 to-wheat-gold/20
        border-4 border-terracotta/30 flex items-center justify-center
        shadow-2xl shadow-terracotta/20
      ">
        <div className="text-center">
          <div className="text-6xl font-bold text-terracotta mb-2">
            {name.charAt(0)}
          </div>
          {emotion && (
            <div className="text-sm text-wheat-gold italic">*{emotion}*</div>
          )}
        </div>
      </div>
      <div className="mt-6 text-center">
        <p className="text-xl font-bold text-parchment tracking-tight">{name}</p>
        <p className="text-sm text-tertiary/70 mt-1">{role}</p>
      </div>
    </div>
  );
}
