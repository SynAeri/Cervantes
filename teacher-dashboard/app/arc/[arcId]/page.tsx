// Arc details and review page - view and edit generated narrative arc before publishing

'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';

interface Scene {
  scene_id: string;
  title: string;
  concept_target: string;
  misconception_target?: string;
  learning_objective: string;
  description?: string;
  setup_narration?: string;
  socratic_angles?: string[];
  scene_type?: string;
  character?: {
    id: string;
    name: string;
    role: string;
    personality_traits?: string[];
  };
}

interface Arc {
  arc_id: string;
  class_id: string;
  subject?: string;
  status: string;
  title?: string;
  description?: string;
  scenes?: Scene[];
  assessed_understandings?: string[];
  created_at?: string;
  updated_at?: string;
}

export default function ArcDetailsPage({ params }: { params: Promise<{ arcId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [arc, setArc] = useState<Arc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [editingUnderstandings, setEditingUnderstandings] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingScenes, setIsGeneratingScenes] = useState(false);
  const [sceneGenStage, setSceneGenStage] = useState<string>('Preparing...');
  const [sceneGenProgress, setSceneGenProgress] = useState(0);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchArc = async () => {
      try {
        setLoading(true);
        const data = await api.arc.getById(resolvedParams.arcId);
        setArc(data);

        // Check if we should start in edit mode
        if (searchParams.get('mode') === 'edit') {
          setEditMode(true);
          setEditingUnderstandings(true);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load arc');
      } finally {
        setLoading(false);
      }
    };

    fetchArc();
  }, [resolvedParams.arcId, searchParams]);

  const handlePublish = async () => {
    if (!confirm('Publish this arc to students?')) {
      return;
    }

    try {
      await api.arc.publish(resolvedParams.arcId);
      setArc(prev => prev ? { ...prev, status: 'published' } : null);
      alert('Arc published successfully!');
    } catch (err: any) {
      alert('Failed to publish arc: ' + err.message);
    }
  };

  const handleSaveChanges = async () => {
    if (!arc) return;

    setIsSaving(true);
    try {
      await api.arc.update(resolvedParams.arcId, {
        title: arc.title,
        description: arc.description,
        assessed_understandings: arc.assessed_understandings,
        scenes: arc.scenes,
      });
      setHasUnsavedChanges(false);
      alert('Changes saved successfully!');
    } catch (err: any) {
      alert('Failed to save changes: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateScenes = async () => {
    if (!arc) return;

    if (!confirm('Generate interactive scenes for all learning objectives? This may take 1-2 minutes.')) {
      return;
    }

    setIsGeneratingScenes(true);
    setSceneGenProgress(0);

    // Simulate progressive stages
    const stages = [
      'Fetching scene plans...',
      'Loading narrative context...',
      'Generating scene 1 content...',
      'Generating scene 2 content...',
      'Generating scene 3 content...',
      'Finalizing dialogue...',
      'Saving scenes...'
    ];

    let currentStageIndex = 0;
    const stageInterval = setInterval(() => {
      if (currentStageIndex < stages.length) {
        setSceneGenStage(stages[currentStageIndex]);
        setSceneGenProgress(Math.min(95, (currentStageIndex / stages.length) * 100));
        currentStageIndex++;
      }
    }, 2500);

    try {
      const result = await api.arc.generateScenes(resolvedParams.arcId);
      clearInterval(stageInterval);
      setSceneGenStage('Complete!');
      setSceneGenProgress(100);

      setTimeout(async () => {
        // Refresh arc data to show the new scenes
        const updatedArc = await api.arc.getById(resolvedParams.arcId);
        setArc(updatedArc);
        setIsGeneratingScenes(false);
        alert(`Successfully generated ${result.generated_count} scenes!`);
      }, 500);
    } catch (err: any) {
      clearInterval(stageInterval);
      alert('Failed to generate scenes: ' + err.message);
      setIsGeneratingScenes(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-terracotta animate-spin">refresh</span>
          <p className="mt-4 text-tertiary text-sm">Loading arc details...</p>
        </div>
      </div>
    );
  }

  if (error || !arc) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-tertiary/40">error</span>
          <p className="mt-4 text-primary font-bold">Error loading arc</p>
          <p className="text-tertiary text-sm">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-terracotta text-parchment text-xs font-bold rounded hover:bg-terracotta/80"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-slate text-parchment p-6 flex items-center justify-between border-b border-warm-grey">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-parchment/10 rounded transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold">Arc Details</h1>
            <p className="text-xs text-parchment/70 mt-1">
              {arc.class_id} • {arc.status.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2"></div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-8">
        {/* Arc Metadata */}
        <div className="bg-card-surface border border-warm-grey rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-primary mb-2">
                {arc.title || 'Untitled Arc'}
              </h2>
              {arc.description && (
                <p className="text-sm text-secondary">{arc.description}</p>
              )}
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${
                arc.status === 'published' ? 'bg-teal text-parchment' :
                arc.status === 'approved' ? 'bg-wheat text-slate' :
                'bg-warm-grey text-secondary'
              }`}>
                {arc.status.toUpperCase()}
              </span>
            </div>
          </div>

          {arc.assessed_understandings && arc.assessed_understandings.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-tertiary uppercase">Assessed Understandings</h3>
                <button
                  onClick={() => setEditingUnderstandings(!editingUnderstandings)}
                  className="text-xs text-wheat hover:text-wheat/80 font-bold"
                >
                  {editingUnderstandings ? 'Done' : 'Edit'}
                </button>
              </div>
              {editingUnderstandings ? (
                <div className="space-y-2">
                  {arc.assessed_understandings.map((understanding, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={understanding}
                        onChange={(e) => {
                          const newUnderstandings = [...arc.assessed_understandings!];
                          newUnderstandings[idx] = e.target.value;
                          setArc({ ...arc, assessed_understandings: newUnderstandings });
                          setHasUnsavedChanges(true);
                        }}
                        className="flex-1 px-3 py-2 border border-warm-grey rounded text-sm focus:outline-none focus:border-wheat"
                      />
                      <button
                        onClick={() => {
                          const newUnderstandings = arc.assessed_understandings!.filter((_, i) => i !== idx);
                          setArc({ ...arc, assessed_understandings: newUnderstandings });
                        }}
                        className="p-1 hover:bg-[#9E3B3B]/10 rounded"
                      >
                        <span className="material-symbols-outlined text-sm text-[#9E3B3B]">delete</span>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setArc({ ...arc, assessed_understandings: [...(arc.assessed_understandings || []), ''] });
                    }}
                    className="text-xs text-wheat hover:text-wheat/80 font-bold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Understanding
                  </button>
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {arc.assessed_understandings.map((understanding, idx) => (
                    <li key={idx} className="text-sm text-secondary">{understanding}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Scenes */}
        <div className="bg-card-surface border border-warm-grey rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-bold text-primary">Scenes</h3>
            <span className="text-xs text-tertiary">
              {arc.scenes?.length || 0} scenes
            </span>
          </div>

          {!arc.scenes || arc.scenes.length === 0 ? (
            isGeneratingScenes ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin mb-6">
                  <span className="material-symbols-outlined text-6xl text-terracotta">autorenew</span>
                </div>
                <h3 className="text-lg font-bold text-primary mb-2">Generating Interactive Scenes</h3>
                <p className="text-[13px] text-wheat font-bold mb-4 animate-pulse">
                  {sceneGenStage}
                </p>
                <div className="max-w-md mx-auto bg-parchment rounded-full h-3 overflow-hidden mb-2">
                  <div
                    className="bg-terracotta h-full transition-all duration-500"
                    style={{ width: `${sceneGenProgress}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-tertiary">
                  {Math.round(sceneGenProgress)}% complete
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-tertiary/20">auto_stories</span>
                <p className="text-sm text-tertiary mt-4">No scenes generated yet</p>
                <button
                  onClick={handleGenerateScenes}
                  className="mt-4 px-4 py-2 bg-terracotta text-parchment text-xs font-bold rounded hover:bg-terracotta/80 flex items-center gap-2 mx-auto"
                >
                  Generate Scenes
                </button>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {arc.scenes.map((scene, idx) => (
                <div
                  key={scene.scene_id}
                  className="border border-warm-grey rounded p-4 hover:border-wheat transition-colors"
                >
                  {editingScene === scene.scene_id ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-tertiary">Scene {idx + 1} • {scene.scene_type || 'Scene'}</span>
                        <button
                          onClick={() => setEditingScene(null)}
                          className="text-xs text-wheat hover:text-wheat/80 font-bold"
                        >
                          Done
                        </button>
                      </div>

                      {/* Character Info */}
                      {scene.character && (
                        <div className="bg-parchment p-3 rounded border border-warm-grey">
                          <p className="text-xs font-bold text-tertiary uppercase mb-1">Character</p>
                          <p className="text-sm font-bold text-primary">{scene.character.name}</p>
                          <p className="text-xs text-secondary">{scene.character.role}</p>
                          {scene.character.personality_traits && scene.character.personality_traits.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {scene.character.personality_traits.map((trait, i) => (
                                <span key={i} className="text-[10px] px-2 py-1 bg-wheat/20 text-secondary rounded">
                                  {trait}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="text-xs text-tertiary font-bold block mb-1">Title</label>
                        <input
                          type="text"
                          value={scene.title}
                          onChange={(e) => {
                            const newScenes = arc.scenes!.map(s =>
                              s.scene_id === scene.scene_id ? { ...s, title: e.target.value } : s
                            );
                            setArc({ ...arc, scenes: newScenes });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-2 border border-warm-grey rounded text-sm focus:outline-none focus:border-wheat"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-tertiary font-bold block mb-1">Concept Target</label>
                          <input
                            type="text"
                            value={scene.concept_target}
                            onChange={(e) => {
                              const newScenes = arc.scenes!.map(s =>
                                s.scene_id === scene.scene_id ? { ...s, concept_target: e.target.value } : s
                              );
                              setArc({ ...arc, scenes: newScenes });
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full px-3 py-2 border border-warm-grey rounded text-sm focus:outline-none focus:border-wheat"
                          />
                        </div>
                        {scene.misconception_target && (
                          <div>
                            <label className="text-xs text-tertiary font-bold block mb-1">Misconception Target</label>
                            <input
                              type="text"
                              value={scene.misconception_target}
                              onChange={(e) => {
                                const newScenes = arc.scenes!.map(s =>
                                  s.scene_id === scene.scene_id ? { ...s, misconception_target: e.target.value } : s
                                );
                                setArc({ ...arc, scenes: newScenes });
                                setHasUnsavedChanges(true);
                              }}
                              className="w-full px-3 py-2 border border-warm-grey rounded text-sm focus:outline-none focus:border-wheat"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-tertiary font-bold block mb-1">Learning Objective</label>
                        <textarea
                          value={scene.learning_objective || ''}
                          onChange={(e) => {
                            const newScenes = arc.scenes!.map(s =>
                              s.scene_id === scene.scene_id ? { ...s, learning_objective: e.target.value } : s
                            );
                            setArc({ ...arc, scenes: newScenes });
                            setHasUnsavedChanges(true);
                          }}
                          rows={2}
                          className="w-full px-3 py-2 border border-warm-grey rounded text-sm focus:outline-none focus:border-wheat"
                        />
                      </div>

                      {scene.setup_narration && (
                        <div>
                          <label className="text-xs text-tertiary font-bold block mb-1">Setup Narration</label>
                          <textarea
                            value={scene.setup_narration || ''}
                            onChange={(e) => {
                              const newScenes = arc.scenes!.map(s =>
                                s.scene_id === scene.scene_id ? { ...s, setup_narration: e.target.value } : s
                              );
                              setArc({ ...arc, scenes: newScenes });
                              setHasUnsavedChanges(true);
                            }}
                            rows={3}
                            className="w-full px-3 py-2 border border-warm-grey rounded text-sm focus:outline-none focus:border-wheat"
                          />
                        </div>
                      )}

                      {scene.socratic_angles && scene.socratic_angles.length > 0 && (
                        <div>
                          <label className="text-xs text-tertiary font-bold block mb-2">Socratic Angles (CurricuLLM)</label>
                          <ul className="space-y-1 bg-parchment p-3 rounded border border-warm-grey">
                            {scene.socratic_angles.map((angle, i) => (
                              <li key={i} className="text-xs text-secondary flex items-start gap-2">
                                <span className="text-wheat">•</span>
                                <span>{angle}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {scene.description && (
                        <div>
                          <label className="text-xs text-tertiary font-bold block mb-1">Description</label>
                          <textarea
                            value={scene.description || ''}
                            onChange={(e) => {
                              const newScenes = arc.scenes!.map(s =>
                                s.scene_id === scene.scene_id ? { ...s, description: e.target.value } : s
                              );
                              setArc({ ...arc, scenes: newScenes });
                              setHasUnsavedChanges(true);
                            }}
                            rows={3}
                            className="w-full px-3 py-2 border border-warm-grey rounded text-sm focus:outline-none focus:border-wheat"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-tertiary">Scene {idx + 1}</span>
                          <span className="text-xs text-secondary">•</span>
                          <span className="text-xs text-wheat">{scene.concept_target}</span>
                          {scene.scene_type && (
                            <>
                              <span className="text-xs text-secondary">•</span>
                              <span className="text-[10px] px-2 py-0.5 bg-wheat/20 text-secondary rounded uppercase">
                                {scene.scene_type}
                              </span>
                            </>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-primary mb-1">
                          {scene.title || 'Untitled Scene'}
                        </h4>
                        {scene.character && (
                          <p className="text-xs text-secondary mb-1">
                            <span className="font-bold">Character:</span> {scene.character.name} ({scene.character.role})
                          </p>
                        )}
                        <p className="text-xs text-tertiary mb-2">
                          {scene.learning_objective}
                        </p>
                        {scene.misconception_target && (
                          <p className="text-xs text-[#D4A347] mb-2">
                            <span className="font-bold">Misconception:</span> {scene.misconception_target}
                          </p>
                        )}
                        {scene.description && (
                          <p className="text-xs text-secondary">{scene.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingScene(scene.scene_id)}
                        className="p-1 hover:bg-parchment rounded transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm text-wheat">edit</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-goldenrod text-xs">
              <span className="material-symbols-outlined text-sm">info</span>
              <span>You have unsaved changes</span>
            </div>
          )}
          <div className={`flex items-center gap-4 ${hasUnsavedChanges ? '' : 'ml-auto'}`}>
            <Link href={`/class/${arc.class_id}`}>
              <button className="px-6 py-2 border border-warm-grey text-secondary text-sm font-bold rounded hover:bg-parchment transition-colors">
                Back to Class
              </button>
            </Link>
            {hasUnsavedChanges && (
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="px-6 py-2 bg-wheat text-slate text-sm font-bold rounded hover:bg-wheat/80 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            {arc.status !== 'published' && (
              <button
                onClick={handlePublish}
                className="px-6 py-2 bg-terracotta text-parchment text-sm font-bold rounded hover:bg-terracotta/80 transition-colors"
              >
                Publish Arc
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
