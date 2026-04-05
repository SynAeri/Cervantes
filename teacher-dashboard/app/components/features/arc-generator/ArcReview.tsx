// Arc review component - displays generated arc with scene previews
// Allows professor to review arc structure before approval

'use client';

import type { Arc } from '../../../lib/types';

interface ArcReviewProps {
  arc: Arc;
  onApprove: () => void;
  onRegenerate: () => void;
  onGenerateScenes?: () => void;
}

export function ArcReview({ arc, onApprove, onRegenerate, onGenerateScenes }: ArcReviewProps) {
  const curriculumData = arc.curriculum_data;
  const narrativeArc = arc.narrative_arc;

  return (
    <div className="space-y-8">
      {/* CurricuLLM Analysis Results */}
      {curriculumData && (
        <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
          <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em] mb-6">
            CurricuLLM Analysis
          </h3>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Subject</p>
              <p className="text-[13px] font-bold text-primary">{curriculumData.subject}</p>
            </div>
            <div>
              <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Module</p>
              <p className="text-[13px] font-bold text-primary">{curriculumData.module}</p>
            </div>
            <div>
              <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Year Level</p>
              <p className="text-[13px] font-bold text-primary">{curriculumData.year_level}</p>
            </div>
          </div>

          {curriculumData.learning_outcomes && curriculumData.learning_outcomes.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] text-tertiary font-bold uppercase mb-2">Learning Outcomes</p>
              <ul className="space-y-1">
                {curriculumData.learning_outcomes.map((outcome: string, i: number) => (
                  <li key={i} className="text-[12px] text-secondary flex items-start gap-2">
                    <span className="text-wheat">•</span>
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {curriculumData.common_misconceptions && curriculumData.common_misconceptions.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] text-tertiary font-bold uppercase mb-2">Common Misconceptions (Identified)</p>
              <div className="space-y-3">
                {curriculumData.common_misconceptions.map((misc: any, i: number) => (
                  <div key={i} className="p-4 bg-[#D4A347]/10 rounded border border-[#D4A347]/30">
                    <p className="text-[12px] font-bold text-[#D4A347] mb-1">{misc.misconception}</p>
                    <p className="text-[11px] text-secondary">{misc.why_students_think_this}</p>
                    {misc.exposing_scenario && (
                      <p className="text-[11px] text-tertiary mt-2 italic">Scenario: {misc.exposing_scenario}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {curriculumData.key_concepts && curriculumData.key_concepts.length > 0 && (
            <div>
              <p className="text-[10px] text-tertiary font-bold uppercase mb-2">Key Concepts</p>
              <div className="flex flex-wrap gap-2">
                {curriculumData.key_concepts.map((concept: string, i: number) => (
                  <span key={i} className="text-[11px] px-3 py-1 bg-wheat/20 text-secondary rounded">
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Narrative Arc Structure */}
      <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em]">
            Generated Narrative Arc
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
          {narrativeArc && (
            <div>
              <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Arc Name</p>
              <p className="text-[13px] font-bold text-primary">{narrativeArc.arc_name}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Total Scenes</p>
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
                  {scene.character ? (
                    <div>
                      <p className="text-[13px] font-bold text-primary">{scene.character?.name || 'Character'}</p>
                      <p className="text-[11px] text-tertiary">{scene.character?.role || 'Role pending'}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[13px] font-bold text-primary">Scene {index + 1}</p>
                      <p className="text-[11px] text-tertiary">Character will be assigned on publish</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {scene.character?.archetype && (
                    <span className="text-[8px] font-extrabold text-wheat bg-wheat/20 px-2 py-0.5 rounded-full tracking-widest">
                      {scene.character?.archetype?.toUpperCase() || 'ARCHETYPE'}
                    </span>
                  )}
                  {scene.scene_type && (
                    <span className="text-[8px] font-extrabold text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full tracking-widest">
                      {scene.scene_type?.toUpperCase() || 'SCENE'}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {scene.concept_target && (
                    <div>
                      <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Concept Target</p>
                      <p className="text-[12px] text-primary">{scene.concept_target}</p>
                    </div>
                  )}
                  {scene.misconception_target && (
                    <div>
                      <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Misconception Target</p>
                      <p className="text-[12px] text-[#D4A347]">{scene.misconception_target}</p>
                    </div>
                  )}
                </div>

                {scene.learning_outcome && (
                  <div>
                    <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Learning Outcome</p>
                    <p className="text-[12px] text-secondary">{scene.learning_outcome}</p>
                  </div>
                )}

                {scene.setting && (
                  <div>
                    <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Setting</p>
                    <p className="text-[12px] text-secondary italic">{scene.setting}</p>
                  </div>
                )}

                {scene.exposing_scenario && (
                  <div>
                    <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Exposing Scenario</p>
                    <p className="text-[11px] text-secondary">{scene.exposing_scenario}</p>
                  </div>
                )}

                {scene.socratic_angles && scene.socratic_angles.length > 0 && (
                  <div>
                    <p className="text-[10px] text-tertiary font-bold uppercase mb-2">Socratic Angles</p>
                    <ul className="space-y-1">
                      {scene.socratic_angles.map((angle: string, i: number) => (
                        <li key={i} className="text-[11px] text-secondary flex items-start gap-2">
                          <span className="text-wheat">→</span>
                          <span>{angle}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {scene.character?.personality_prompt && (
                  <div>
                    <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Character Voice</p>
                    <p className="text-[11px] text-secondary italic">{scene.character?.personality_prompt}</p>
                  </div>
                )}
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
        {onGenerateScenes && (
          <button
            onClick={onGenerateScenes}
            className="px-6 py-3 bg-wheat text-parchment rounded-lg text-[11px] font-extrabold uppercase tracking-widest hover:bg-wheat/90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Generate Scenes
          </button>
        )}
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
