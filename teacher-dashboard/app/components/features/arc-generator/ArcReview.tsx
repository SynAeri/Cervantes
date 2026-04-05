// Arc review component - displays generated arc with scene previews
// Allows professor to review arc structure before approval

'use client';

import type { Arc } from '../../../lib/types';

interface ArcReviewProps {
  arc: Arc;
  onApprove: () => void;
  onRegenerate: () => void;
}

export function ArcReview({ arc, onApprove, onRegenerate }: ArcReviewProps) {
  return (
    <div className="space-y-8">
      <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em]">
            Generated Arc Summary
          </h3>
          <span className="text-[8px] font-extrabold text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full tracking-widest">
            {arc.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div>
            <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Arc ID</p>
            <p className="text-[13px] font-bold text-primary">{arc.arc_id}</p>
          </div>
          <div>
            <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Subject</p>
            <p className="text-[13px] font-bold text-primary">{arc.subject}</p>
          </div>
          <div>
            <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Scenes</p>
            <p className="text-[13px] font-bold text-primary">{arc.scenes?.length || 0} scenes</p>
          </div>
        </div>

        <div className="space-y-6">
          {arc.scenes?.map((scene, index) => (
            <div
              key={scene.scene_id}
              className="p-6 bg-parchment/50 rounded-lg border border-warm-grey hover:border-terracotta/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-terracotta/10 rounded-lg flex items-center justify-center text-terracotta font-bold text-[12px]">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-primary">{scene.character.name}</p>
                    <p className="text-[11px] text-tertiary">{scene.character.role}</p>
                  </div>
                </div>
                <span className="text-[8px] font-extrabold text-wheat-gold bg-wheat-gold/10 px-2 py-0.5 rounded-full tracking-widest">
                  {scene.scene_type.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Concept Target</p>
                  <p className="text-[12px] text-primary">{scene.concept_target}</p>
                </div>
                {scene.misconception_target && (
                  <div>
                    <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Misconception Target</p>
                    <p className="text-[12px] text-misconception">{scene.misconception_target}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Character Archetype</p>
                  <p className="text-[12px] text-primary">{scene.character.archetype}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onRegenerate}
          className="px-6 py-3 text-[11px] font-extrabold text-tertiary uppercase tracking-widest hover:text-terracotta transition-colors"
        >
          Regenerate Arc
        </button>
        <button
          onClick={onApprove}
          className="px-8 py-3 bg-terracotta text-parchment rounded-lg text-[11px] font-extrabold uppercase tracking-widest hover:bg-terracotta/90 transition-colors"
        >
          Approve Arc
        </button>
      </div>
    </div>
  );
}
