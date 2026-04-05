// Scenarios page - library of all assessment arcs and scenes
// Shows arc list with scene detail view

'use client';

import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';

interface Scene {
  scene_id: string;
  scene_order: number;
  scene_type: 'bridge' | 'deep' | 'side_event';
  character_name: string;
  character_archetype: string;
  concept_target: string;
  misconception_target: string | null;
}

interface Arc {
  arc_id: string;
  arc_name: string;
  class_name: string;
  class_id: string;
  status: 'draft' | 'published' | 'archived';
  scene_count: number;
  created_date: string;
  scenes: Scene[];
}

export default function ScenariosPage() {
  const [selectedArc, setSelectedArc] = useState<Arc | null>(null);
  const [expandedScene, setExpandedScene] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock arc data
  const arcs: Arc[] = [
    {
      arc_id: 'arc_001',
      arc_name: 'Market Equilibrium Assessment',
      class_name: 'Economics',
      class_id: 'ECON101',
      status: 'published',
      scene_count: 5,
      created_date: '2026-01-15',
      scenes: [
        {
          scene_id: 'scene_001',
          scene_order: 1,
          scene_type: 'bridge',
          character_name: 'Elena Martinez',
          character_archetype: 'frustrated_peer',
          concept_target: 'Supply and Demand Basics',
          misconception_target: null
        },
        {
          scene_id: 'scene_002',
          scene_order: 2,
          scene_type: 'deep',
          character_name: 'Dr. James Wu',
          character_archetype: 'sharp_mentor',
          concept_target: 'Equilibrium Price',
          misconception_target: 'Supply equals demand in equilibrium'
        },
        {
          scene_id: 'scene_003',
          scene_order: 3,
          scene_type: 'deep',
          character_name: 'Sarah Kim',
          character_archetype: 'quiet_analyst',
          concept_target: 'Market Shifts',
          misconception_target: 'Price changes cause demand shifts'
        }
      ]
    },
    {
      arc_id: 'arc_002',
      arc_name: 'Literary Analysis Framework',
      class_name: 'English Standard',
      class_id: 'ENG101',
      status: 'draft',
      scene_count: 4,
      created_date: '2026-01-20',
      scenes: []
    }
  ];

  const filteredArcs = arcs.filter(arc =>
    statusFilter === 'all' || arc.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-mastery bg-mastery/10';
      case 'draft':
        return 'text-misconception bg-misconception/10';
      case 'archived':
        return 'text-tertiary bg-warm-grey/20';
      default:
        return 'text-tertiary bg-warm-grey/20';
    }
  };

  const getSceneTypeColor = (type: string) => {
    switch (type) {
      case 'bridge':
        return 'text-wheat-gold bg-wheat-gold/10';
      case 'deep':
        return 'text-terracotta bg-terracotta/10';
      case 'side_event':
        return 'text-mastery bg-mastery/10';
      default:
        return 'text-tertiary bg-warm-grey/20';
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <main className="ml-64 min-h-screen bg-parchment p-10 flex-1">
        <TopBar />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">Scenarios</h1>
          <p className="text-[14px] text-tertiary">
            Library of assessment arcs and generated scenes
          </p>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Arc List */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em]">
                Arc Library
              </h3>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-warm-white border border-warm-grey rounded-lg text-[11px] text-primary focus:outline-none focus:border-terracotta transition-colors"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredArcs.map((arc) => (
                <div
                  key={arc.arc_id}
                  onClick={() => setSelectedArc(arc)}
                  className={`bg-warm-white p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
                    selectedArc?.arc_id === arc.arc_id
                      ? 'border-terracotta bg-terracotta/5'
                      : 'border-warm-grey hover:border-terracotta/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-[13px] font-bold text-primary mb-1">{arc.arc_name}</h4>
                      <p className="text-[11px] text-wheat-gold font-semibold">{arc.class_name}</p>
                    </div>
                    <span className={`text-[8px] font-extrabold px-2 py-1 rounded-full uppercase tracking-widest ${getStatusColor(arc.status)}`}>
                      {arc.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-tertiary/70 text-[10px]">
                    <span>{arc.scene_count} scenes</span>
                    <span>{new Date(arc.created_date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scene Detail */}
          <div className="col-span-12 lg:col-span-8">
            {selectedArc ? (
              <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-primary mb-2">{selectedArc.arc_name}</h2>
                  <p className="text-[13px] text-tertiary">
                    {selectedArc.class_name} • {selectedArc.scene_count} scenes • Created {new Date(selectedArc.created_date).toLocaleDateString()}
                  </p>
                </div>

                {selectedArc.scenes.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em] mb-4">
                      Scene Timeline
                    </h3>
                    {selectedArc.scenes.map((scene) => (
                      <div
                        key={scene.scene_id}
                        className="border border-warm-grey rounded-lg overflow-hidden"
                      >
                        <div
                          onClick={() => setExpandedScene(expandedScene === scene.scene_id ? null : scene.scene_id)}
                          className="p-5 hover:bg-parchment/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] font-extrabold text-tertiary/50">
                                  Scene {scene.scene_order}
                                </span>
                                <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase ${getSceneTypeColor(scene.scene_type)}`}>
                                  {scene.scene_type.replace('_', ' ')}
                                </span>
                              </div>
                              <h4 className="text-[14px] font-bold text-primary mb-1">{scene.character_name}</h4>
                              <p className="text-[12px] text-tertiary/70 italic">{scene.character_archetype.replace('_', ' ')}</p>
                            </div>
                            <span className="material-symbols-outlined text-tertiary/50">
                              {expandedScene === scene.scene_id ? 'expand_less' : 'expand_more'}
                            </span>
                          </div>
                        </div>

                        {expandedScene === scene.scene_id && (
                          <div className="p-5 bg-parchment/30 border-t border-warm-grey space-y-4">
                            <div>
                              <p className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest mb-1">
                                Concept Target
                              </p>
                              <p className="text-[12px] text-primary">{scene.concept_target}</p>
                            </div>
                            {scene.misconception_target && (
                              <div>
                                <p className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest mb-1">
                                  Misconception Target
                                </p>
                                <p className="text-[12px] text-critical">{scene.misconception_target}</p>
                              </div>
                            )}
                            <div className="flex gap-2 pt-2">
                              <button className="text-[10px] font-extrabold text-terracotta hover:text-terracotta/80 transition-all uppercase tracking-widest">
                                Preview Scene
                              </button>
                              <button className="text-[10px] font-extrabold text-wheat-gold hover:text-wheat-gold/80 transition-all uppercase tracking-widest">
                                Edit
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-6xl text-tertiary/30 mb-4 block">
                      auto_stories
                    </span>
                    <p className="text-[13px] text-tertiary">No scenes generated for this arc yet</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-warm-white rounded-xl border border-warm-grey p-12 text-center">
                <span className="material-symbols-outlined text-8xl text-tertiary/20 mb-4 block">
                  account_tree
                </span>
                <p className="text-[14px] text-tertiary mb-2">Select an arc to view scenes</p>
                <p className="text-[12px] text-tertiary/70">Choose from the arc library on the left</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
