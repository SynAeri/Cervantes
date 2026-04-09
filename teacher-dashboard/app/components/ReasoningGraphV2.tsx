// Interactive reasoning trace node graph using react-flow
// Visualizes student's reasoning journey with orbiting ending node
// Uses @xyflow/react for reliable drag-and-drop and edge rendering

'use client';

import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  MarkerType,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ReasoningTrace, Scene, RubricDimension } from '../lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReasoningGraphProps {
  traces: ReasoningTrace[];
  scenes?: Scene[];
  arcEnding?: ArcEnding | null;
  className?: string;
  onSelectTrace?: (trace: ReasoningTrace | null) => void;
}

interface ArcEnding {
  ending_id: string;
  ending_type: 'good_end' | 'bad_end' | 'iffy_end';
  narrative_text: string;
  ending_title: string;
  performance_level: string;
  created_at: string;
}

interface SceneNodeData extends Record<string, unknown> {
  label: string;
  status?: 'mastery' | 'revised_with_scaffolding' | 'critical_gap';
  trace?: ReasoningTrace;
  sceneNumber?: number;
  rubricAlignment?: Record<string, RubricDimension>;
  type: 'scene';
}

interface ConceptNodeData extends Record<string, unknown> {
  label: string;
  type: 'concept';
}

interface EndingNodeData extends Record<string, unknown> {
  label: string;
  endingType: 'good_end' | 'bad_end' | 'iffy_end';
  performanceLevel: string;
  createdAt: string;
  type: 'ending';
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  mastery: '#3B827E',
  revised_with_scaffolding: '#D4A347',
  critical_gap: '#9E3B3B',
  none: '#8A7F72',
};

const STATUS_LABELS: Record<string, string> = {
  mastery: 'Mastery',
  revised_with_scaffolding: 'Revised with scaffolding',
  critical_gap: 'Critical gap',
};

const ENDING_COLORS: Record<string, string> = {
  good_end: '#3B827E',    // Muted teal
  iffy_end: '#D4A347',    // Goldenrod
  bad_end: '#9E3B3B',     // Crimson
};

const ENDING_LABELS: Record<string, string> = {
  good_end: 'Understanding Secured',
  iffy_end: 'Partial Understanding',
  bad_end: 'Further Study Needed',
};

function statusColor(status?: string): string {
  return STATUS_COLORS[status ?? 'none'] ?? STATUS_COLORS.none;
}

// ---------------------------------------------------------------------------
// Custom Node Components
// ---------------------------------------------------------------------------

function SceneNode({ data, selected }: { data: SceneNodeData; selected?: boolean }) {
  const sColor = statusColor(data.status);
  const statusLabel = STATUS_LABELS[data.status ?? ''] ?? 'Not evaluated';

  // Count rubric dimensions by performance
  const rubricStats = data.rubricAlignment ? Object.values(data.rubricAlignment).reduce(
    (acc, dim) => {
      acc[dim.performance] = (acc[dim.performance] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) : null;

  const hasRubric = rubricStats && Object.keys(rubricStats).length > 0;

  return (
    <div className="relative group">
      {/* Main circle */}
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-200 cursor-pointer ${
          selected ? 'ring-4 ring-terracotta/30' : ''
        }`}
        style={{
          backgroundColor: `${sColor}20`,
          borderColor: sColor,
          boxShadow: selected ? `0 0 20px ${sColor}40` : '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <span
          className="text-xl font-bold"
          style={{ color: sColor }}
        >
          {data.sceneNumber}
        </span>
      </div>

      {/* Status indicator dot */}
      <div
        className="absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-parchment"
        style={{ backgroundColor: sColor }}
        title={statusLabel}
      />

      {/* Rubric indicator dots */}
      {hasRubric && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {rubricStats.strong > 0 && (
            <div className="w-1.5 h-1.5 rounded-full bg-mastery" title={`${rubricStats.strong} strong dimensions`} />
          )}
          {rubricStats.adequate > 0 && (
            <div className="w-1.5 h-1.5 rounded-full bg-misconception" title={`${rubricStats.adequate} adequate dimensions`} />
          )}
          {rubricStats.weak > 0 && (
            <div className="w-1.5 h-1.5 rounded-full bg-critical" title={`${rubricStats.weak} weak dimensions`} />
          )}
        </div>
      )}

      {/* Label below */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap">
        <span className="text-xs font-semibold text-body">{data.label}</span>
      </div>

      {/* Tooltip on hover - CurricuLLM Rubric Analysis */}
      {hasRubric && data.rubricAlignment && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
          <div className="bg-near-black/95 backdrop-blur-sm border border-parchment/30 rounded-lg p-3 shadow-2xl min-w-[280px] max-w-[320px]">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-parchment/20">
              <span className="material-symbols-outlined text-wheat-gold text-sm">analytics</span>
              <span className="text-xs font-bold text-parchment uppercase tracking-wider">CurricuLLM Analysis</span>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {Object.entries(data.rubricAlignment).map(([dimension, data]) => (
                <div key={dimension} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-parchment/90">{dimension}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        data.performance === 'strong'
                          ? 'bg-mastery/20 text-mastery'
                          : data.performance === 'weak'
                          ? 'bg-critical/20 text-critical'
                          : 'bg-misconception/20 text-misconception'
                      }`}
                    >
                      {data.performance}
                    </span>
                  </div>
                  <p className="text-parchment/70 text-[10px] leading-relaxed">{data.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-parchment/30"></div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConceptNode({ data }: { data: ConceptNodeData }) {
  const color = '#C4A245';
  const maxLength = 24;
  const displayLabel = data.label.length > maxLength
    ? data.label.slice(0, maxLength - 3) + '...'
    : data.label;

  return (
    <div
      className="px-4 py-2 rounded-lg border transition-all duration-200 hover:scale-105 cursor-pointer"
      style={{
        backgroundColor: `${color}10`,
        borderColor: color,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <span
        className="text-xs font-bold uppercase tracking-wider"
        style={{ color }}
      >
        {displayLabel}
      </span>
    </div>
  );
}

function EndingNode({ data, selected }: { data: EndingNodeData; selected?: boolean }) {
  const color = ENDING_COLORS[data.endingType];
  const label = ENDING_LABELS[data.endingType];

  return (
    <div className="relative">
      {/* Large central circle with glow */}
      <div
        className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-300 ${
          selected ? 'scale-110' : ''
        }`}
        style={{
          backgroundColor: `${color}30`,
          borderColor: color,
          boxShadow: `0 0 40px ${color}60, 0 0 80px ${color}30`,
        }}
      >
        <span className="material-symbols-outlined text-4xl" style={{ color }}>
          {data.endingType === 'good_end' ? 'check_circle' : data.endingType === 'bad_end' ? 'cancel' : 'help'}
        </span>
        <span className="text-xs font-bold mt-1" style={{ color }}>
          ENDING
        </span>
      </div>

      {/* Label below */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap text-center">
        <div
          className="text-sm font-bold px-3 py-1 rounded-full"
          style={{
            backgroundColor: `${color}20`,
            color: color,
          }}
        >
          {label}
        </div>
        <div className="text-xs text-tertiary/60 mt-1">
          {data.performanceLevel.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  scene: SceneNode,
  concept: ConceptNode,
  ending: EndingNode,
};

// ---------------------------------------------------------------------------
// Layout algorithm: Ending node at center, scenes orbit around it
// ---------------------------------------------------------------------------

function buildGraphLayout(
  traces: ReasoningTrace[],
  scenes?: Scene[],
  arcEnding?: ArcEnding | null
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Build scene lookup
  const sceneMap = new Map<string, Scene>();
  scenes?.forEach((s) => sceneMap.set(s.scene_id, s));

  // Deduplicate by scene_id — keep latest trace per scene, then sort by scene_number
  const tracesByScene = new Map<string, ReasoningTrace>();
  for (const trace of traces) {
    const existing = tracesByScene.get(trace.scene_id);
    if (!existing || new Date(trace.created_at).getTime() > new Date(existing.created_at).getTime()) {
      tracesByScene.set(trace.scene_id, trace);
    }
  }

  // Sort traces by scene_number for proper progression edges
  const dedupedTraces = Array.from(tracesByScene.values()).sort((a, b) => {
    const sceneA = sceneMap.get(a.scene_id);
    const sceneB = sceneMap.get(b.scene_id);
    const numA = sceneA?.scene_number ?? 999;
    const numB = sceneB?.scene_number ?? 999;
    return numA - numB;
  });

  const sceneNodeIds: string[] = dedupedTraces.map(t => `scene-${t.scene_id}`);

  // Center position
  const centerX = 400;
  const centerY = 300;

  // Add ending node at center if available
  if (arcEnding) {
    nodes.push({
      id: 'ending-node',
      type: 'ending',
      position: { x: centerX - 48, y: centerY - 48 }, // Center the 96px node
      data: {
        label: arcEnding.ending_title,
        endingType: arcEnding.ending_type,
        performanceLevel: arcEnding.performance_level,
        createdAt: arcEnding.created_at,
        type: 'ending',
      } as EndingNodeData,
      draggable: true,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
  }

  // Orbit radius based on number of scenes
  const orbitRadius = arcEnding ? 200 : 150;

  // Add scene nodes in orbit around ending
  dedupedTraces.forEach((trace, idx) => {
    const sceneNodeId = sceneNodeIds[idx]; // Use consistent scene_id-based ID
    const scene = sceneMap.get(trace.scene_id);
    const sceneNumber = scene?.scene_number ?? idx + 1;

    // Calculate position in circular orbit
    const angle = (idx / dedupedTraces.length) * Math.PI * 2 - Math.PI / 2; // Start at top
    const x = centerX + Math.cos(angle) * orbitRadius - 32; // Center the 64px node
    const y = centerY + Math.sin(angle) * orbitRadius - 32;

    nodes.push({
      id: sceneNodeId,
      type: 'scene',
      position: { x, y },
      data: {
        label: `Scene ${sceneNumber}`,
        status: trace.status,
        trace,
        sceneNumber,
        rubricAlignment: trace.rubric_alignment,
        type: 'scene',
      } as SceneNodeData,
      draggable: true,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });

    // Connect to ending node if it exists
    if (arcEnding) {
      const endingColor = ENDING_COLORS[arcEnding.ending_type];
      edges.push({
        id: `ending-to-${sceneNodeId}`,
        source: 'ending-node',
        target: sceneNodeId,
        type: 'straight',
        style: {
          stroke: endingColor,
          strokeWidth: 2,
          opacity: 0.4,
        },
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: endingColor,
          width: 20,
          height: 20,
        },
      });
    }

    // Scene-to-scene progression edges (only if scenes are consecutive in scene_number)
    if (idx > 0) {
      const prevTrace = dedupedTraces[idx - 1];
      const prevScene = sceneMap.get(prevTrace.scene_id);
      const currentScene = scene;
      const prevId = sceneNodeIds[idx - 1];

      // Only create edge if both nodes exist and scenes are consecutive
      if (prevId && sceneNodeId && prevScene && currentScene) {
        const prevNum = prevScene.scene_number;
        const currNum = currentScene.scene_number;

        // Create edge only if they're consecutive (diff of 1)
        if (currNum - prevNum === 1) {
          edges.push({
            id: `progression-${prevId}-${sceneNodeId}`,
            source: prevId,
            target: sceneNodeId,
            type: 'smoothstep',
            style: {
              stroke: '#C4A245',
              strokeWidth: 2,
              strokeDasharray: '6 4',
              opacity: 0.6,
            },
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#C4A245',
              width: 15,
              height: 15,
            },
          });
        }
      }
    }

    // Concept nodes — position near their scene
    const concept = scene?.concept_target;
    if (concept) {
      const conceptNodeId = `concept-${sceneNodeId}`;
      // Position concept slightly outside the orbit
      const conceptAngle = angle + 0.3; // Slight offset
      const conceptRadius = orbitRadius + 80;
      const conceptX = centerX + Math.cos(conceptAngle) * conceptRadius - 40;
      const conceptY = centerY + Math.sin(conceptAngle) * conceptRadius - 15;

      // Check if this concept already exists
      const existingConcept = nodes.find(
        (n) => n.type === 'concept' && n.data.label === concept
      );

      if (!existingConcept) {
        nodes.push({
          id: conceptNodeId,
          type: 'concept',
          position: { x: conceptX, y: conceptY },
          data: {
            label: concept,
            type: 'concept',
          } as ConceptNodeData,
          draggable: true,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });

        edges.push({
          id: `concept-${sceneNodeId}-${conceptNodeId}`,
          source: sceneNodeId,
          target: conceptNodeId,
          type: 'smoothstep',
          style: {
            stroke: '#C4A245',
            strokeWidth: 1.5,
            opacity: 0.5,
          },
          animated: false,
        });
      }
    }
  });

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Main ReasoningGraph component
// ---------------------------------------------------------------------------

export function ReasoningGraphV2({
  traces,
  scenes,
  arcEnding,
  className,
  onSelectTrace,
}: ReasoningGraphProps) {
  const layout = useMemo(
    () => buildGraphLayout(traces, scenes, arcEnding),
    [traces, scenes, arcEnding]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges);

  // Update nodes/edges when layout changes
  useEffect(() => {
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [layout, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === 'scene') {
        const sceneData = node.data as SceneNodeData;
        onSelectTrace?.(sceneData.trace ?? null);
      }
    },
    [onSelectTrace]
  );

  // Empty state
  if (traces.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${className ?? ''}`}>
        <span className="material-symbols-outlined text-6xl text-tertiary/20 mb-4">
          psychology
        </span>
        <p className="text-[14px] font-semibold text-tertiary/60">
          No reasoning traces yet
        </p>
        <p className="text-[12px] text-tertiary/40 mt-1">
          This student hasn&apos;t started any scenes
        </p>
      </div>
    );
  }

  return (
    <div className={`relative select-none bg-parchment rounded-lg ${className ?? ''}`} style={{ height: 500 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        defaultEdgeOptions={{
          style: { strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#E8E2D6" gap={24} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'ending') {
              const data = node.data as EndingNodeData;
              return ENDING_COLORS[data.endingType];
            }
            if (node.type === 'scene') {
              const data = node.data as SceneNodeData;
              return statusColor(data.status);
            }
            return '#C4A245';
          }}
          maskColor="rgb(244, 241, 234, 0.6)"
          style={{ backgroundColor: '#F4F1EA' }}
        />
        <Panel position="top-left" className="bg-warm-white/90 backdrop-blur-sm border border-warm-grey rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-terracotta" style={{ backgroundColor: '#C85A3218' }} />
              <span className="text-[9px] font-bold uppercase tracking-wider text-tertiary">Scene</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-2 rounded-sm border border-wheat-gold" style={{ backgroundColor: '#C4A24518' }} />
              <span className="text-[9px] font-bold uppercase tracking-wider text-tertiary">Concept</span>
            </div>
            {arcEnding && (
              <>
                <div className="w-px h-3 bg-warm-grey" />
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full border-2" style={{ borderColor: ENDING_COLORS[arcEnding.ending_type], backgroundColor: `${ENDING_COLORS[arcEnding.ending_type]}30` }} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-tertiary">Ending</span>
                </div>
              </>
            )}
            <div className="w-px h-3 bg-warm-grey" />
            {(['mastery', 'revised_with_scaffolding', 'critical_gap'] as const).map((s) => (
              <div key={s} className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} />
                <span className="text-[8px] font-semibold text-tertiary/70">
                  {s === 'revised_with_scaffolding' ? 'Revised' : s === 'critical_gap' ? 'Critical' : 'Mastery'}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
