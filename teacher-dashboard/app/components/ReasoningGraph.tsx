// Interactive SVG reasoning trace node graph
// Visualizes a student's reasoning journey through VN assessment scenes
// Pure SVG + React + CSS — zero external dependencies

'use client';

import { useState, useMemo, useCallback } from 'react';
import type { ReasoningTrace, Scene } from '../lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReasoningGraphProps {
  traces: ReasoningTrace[];
  scenes?: Scene[];
  className?: string;
  onSelectTrace?: (trace: ReasoningTrace | null) => void;
}

interface GraphNode {
  id: string;
  type: 'scene' | 'concept';
  label: string;
  status?: 'mastery' | 'revised_with_scaffolding' | 'critical_gap';
  x: number;
  y: number;
  vx: number;
  vy: number;
  trace?: ReasoningTrace;
  sceneNumber?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'progression' | 'concept';
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  mastery: '#3B827E',           // Muted teal (good)
  revised_with_scaffolding: '#D4A347',  // Goldenrod (warning)
  critical_gap: '#9E3B3B',      // Crimson (critical)
  none: '#8A7F72',              // Warm grey (neutral)
};

const STATUS_LABELS: Record<string, string> = {
  mastery: 'Mastery',
  revised_with_scaffolding: 'Revised with scaffolding',
  critical_gap: 'Critical gap',
};

function statusColor(status?: string): string {
  return STATUS_COLORS[status ?? 'none'] ?? STATUS_COLORS.none;
}

// ---------------------------------------------------------------------------
// Force-directed layout (simple spring simulation)
// ---------------------------------------------------------------------------

function buildGraph(traces: ReasoningTrace[], scenes?: Scene[]) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seenConcepts = new Map<string, string>(); // concept_target -> nodeId

  // Sort traces chronologically
  const sorted = [...traces].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Build a scene_id -> scene lookup
  const sceneMap = new Map<string, Scene>();
  scenes?.forEach((s) => sceneMap.set(s.scene_id, s));

  // Deduplicate by scene_id — keep latest trace per scene
  const seenScenes = new Set<string>();
  const dedupedTraces: typeof sorted = [];
  for (const trace of sorted) {
    if (!seenScenes.has(trace.scene_id)) {
      seenScenes.add(trace.scene_id);
      dedupedTraces.push(trace);
    }
  }

  dedupedTraces.forEach((trace, idx) => {
    const sceneNodeId = `scene-${trace.trace_id}`;
    const scene = sceneMap.get(trace.scene_id);
    const sceneNumber = scene?.scene_number ?? idx + 1;

    // Scene node — scatter in circular/organic pattern (Obsidian-style)
    const angle = (idx / dedupedTraces.length) * Math.PI * 2;
    const radius = 100 + idx * 20; // Smaller radius for tighter layout
    const jitter = ((idx * 37) % 30) - 15; // Reduced jitter
    nodes.push({
      id: sceneNodeId,
      type: 'scene',
      label: `Scene ${sceneNumber}`,
      status: trace.status,
      x: 300 + Math.cos(angle) * radius + jitter,
      y: 250 + Math.sin(angle) * radius + jitter * 0.7,
      vx: 0,
      vy: 0,
      trace,
      sceneNumber,
    });

    // Scene-to-scene progression edges
    if (idx > 0) {
      const prevId = nodes.filter(n => n.type === 'scene')[idx - 1]?.id;
      if (prevId) edges.push({ source: prevId, target: sceneNodeId, type: 'progression' });
    }

    // Concept node — scatter around the scene organically
    const concept = scene?.concept_target;
    if (concept) {
      let conceptNodeId = seenConcepts.get(concept);
      if (!conceptNodeId) {
        conceptNodeId = `concept-${concept}`;
        seenConcepts.set(concept, conceptNodeId);
        // Position concept in orbit around scene with random offset
        const conceptAngle = angle + ((seenConcepts.size * 47) % 360) * (Math.PI / 180);
        const conceptDist = 50 + ((idx * 23) % 30); // Smaller orbit
        nodes.push({
          id: conceptNodeId,
          type: 'concept',
          label: concept,
          x: 300 + Math.cos(angle) * radius + Math.cos(conceptAngle) * conceptDist,
          y: 250 + Math.sin(angle) * radius + Math.sin(conceptAngle) * conceptDist,
          vx: 0,
          vy: 0,
        });
      }
      edges.push({ source: sceneNodeId, target: conceptNodeId, type: 'concept' });
    }
  });

  return { nodes, edges };
}

function runForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  iterations: number = 60
): GraphNode[] {
  const out = nodes.map((n) => ({ ...n }));
  const nodeMap = new Map<string, GraphNode>();
  out.forEach((n) => nodeMap.set(n.id, n));

  const REPULSION = 8000;
  const SPRING_LENGTH = 160;
  const SPRING_K = 0.04;
  const DAMPING = 0.85;
  const CENTER_X = 400;
  const CENTER_Y = 250;
  const CENTER_GRAVITY = 0.002;

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all pairs
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i];
        const b = out[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = REPULSION / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // Spring forces along edges
    for (const edge of edges) {
      const a = nodeMap.get(edge.source);
      const b = nodeMap.get(edge.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const displacement = dist - SPRING_LENGTH;
      const force = SPRING_K * displacement;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // Center gravity
    for (const n of out) {
      n.vx += (CENTER_X - n.x) * CENTER_GRAVITY;
      n.vy += (CENTER_Y - n.y) * CENTER_GRAVITY;
    }

    // Scene nodes: constrain to horizontal band
    for (const n of out) {
      if (n.type === 'scene') {
        n.vy *= 0.3; // dampen vertical movement for scenes
      }
    }

    // Apply velocities
    for (const n of out) {
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// SVG Filters & Patterns (defined once)
// ---------------------------------------------------------------------------

function SvgDefs() {
  return (
    <defs>
      {/* Subtle drop shadow for nodes */}
      <filter id="node-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#1E1C18" floodOpacity="0.08" />
      </filter>

      {/* Warm glow on hover */}
      <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
        <feColorMatrix in="blur" type="matrix"
          values="1 0 0 0 0.2  0 1 0 0 0.1  0 0 1 0 0  0 0 0 0.4 0" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Grid pattern for background */}
      <pattern id="grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#E8E2D6" strokeWidth="0.5" opacity="0.5" />
      </pattern>

      {/* Animated dash for progression edges */}
      <style>{`
        @keyframes dash-flow {
          to { stroke-dashoffset: -20; }
        }
        @keyframes edge-draw {
          from { stroke-dashoffset: 200; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes node-appear {
          from { opacity: 0; transform: scale(0.6); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-dash, .animate-edge-draw, .animate-pulse, .animate-node-in {
            animation: none !important;
          }
        }
        .scene-node-g:focus { outline: none; }
        .scene-node-g:focus-visible .scene-focus-ring {
          stroke: #C85A32;
          stroke-width: 3;
          stroke-dasharray: 4 2;
          opacity: 1;
        }
        .animate-dash {
          animation: dash-flow 1.5s linear infinite;
        }
        .animate-edge-draw {
          animation: edge-draw 0.6s ease-out forwards;
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
        }
        .animate-pulse {
          animation: pulse-dot 2s ease-in-out infinite;
        }
        .animate-node-in {
          animation: node-appear 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// Edge component
// ---------------------------------------------------------------------------

function Edge({
  x1, y1, x2, y2, type, index,
}: {
  x1: number; y1: number; x2: number; y2: number;
  type: 'progression' | 'concept';
  index: number;
}) {
  const delay = index * 40;

  if (type === 'progression') {
    return (
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#C4A24530"
        strokeWidth="2"
        strokeDasharray="6 4"
        className="animate-dash animate-edge-draw"
        style={{ animationDelay: `${delay}ms, 0ms` }}
      />
    );
  }

  // Concept edge: curved line
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2 - 30;
  return (
    <path
      d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
      fill="none"
      stroke="#C4A24540"
      strokeWidth="1.5"
      className="animate-edge-draw"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

// ---------------------------------------------------------------------------
// Scene node component
// ---------------------------------------------------------------------------

function SceneNode({
  node,
  isSelected,
  isHovered,
  onHover,
  onClick,
  onMouseDown,
  index,
}: {
  node: GraphNode;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (node: GraphNode) => void;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  index: number;
}) {
  const r = 18; // Bigger radius
  const sColor = statusColor(node.status); // Use status color for the node
  const active = isSelected || isHovered;
  const statusLabel = STATUS_LABELS[node.status ?? ''] ?? 'Not evaluated';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(node);
    }
  };

  return (
    <g
      className="animate-node-in cursor-move scene-node-g"
      style={{
        animationDelay: `${index * 60}ms`,
        transformOrigin: `${node.x}px ${node.y}px`,
      }}
      tabIndex={0}
      role="button"
      aria-label={`Scene ${node.sceneNumber}, status: ${statusLabel}`}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(node)}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onKeyDown={handleKeyDown}
    >
      {/* Hit area */}
      <circle cx={node.x} cy={node.y} r={r + 8} fill="transparent" />

      {/* Focus ring (visible only on keyboard focus via CSS) */}
      <circle
        className="scene-focus-ring"
        cx={node.x} cy={node.y} r={r + 4}
        fill="none"
        stroke="transparent"
        strokeWidth={0}
        opacity={0}
        style={{ transition: 'all 0.15s ease' }}
      />

      {/* Main circle */}
      <circle
        cx={node.x} cy={node.y} r={active ? r * 1.1 : r}
        fill={active ? `${sColor}30` : `${sColor}20`}
        stroke={sColor}
        strokeWidth={active ? 2 : 1.5}
        filter={active ? 'url(#node-glow)' : 'url(#node-shadow)'}
        style={{
          transition: 'r 0.15s ease, stroke-width 0.15s ease',
        }}
      />

      {/* Scene number */}
      <text
        x={node.x} y={node.y + 1}
        textAnchor="middle" dominantBaseline="central"
        fill={sColor}
        fontSize="11" fontWeight="700"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        style={{ pointerEvents: 'none' }}
      >
        {node.sceneNumber}
      </text>

      {/* Status indicator dot */}
      <circle
        cx={node.x + r * 0.7} cy={node.y - r * 0.7}
        r={3}
        fill={sColor}
        stroke="#F4F1EA"
        strokeWidth={1}
        className="animate-pulse"
      >
        <title>{STATUS_LABELS[node.status ?? ''] ?? 'Not evaluated'}</title>
      </circle>

      {/* Label below */}
      <text
        x={node.x} y={node.y + r + 14}
        textAnchor="middle"
        fill="#4A4439"
        fontSize="10" fontWeight="600"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        style={{ pointerEvents: 'none' }}
      >
        {node.label}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Concept node component
// ---------------------------------------------------------------------------

function ConceptNode({
  node,
  isHovered,
  onHover,
  onMouseDown,
  index,
}: {
  node: GraphNode;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  index: number;
}) {
  const color = '#C4A245';
  const active = isHovered;
  const labelLen = node.label.length;
  const padX = 14;
  const rectW = Math.min(Math.max(labelLen * 6.5 + padX * 2, 80), 180);
  const rectH = 30;

  return (
    <g
      className="animate-node-in cursor-move"
      style={{
        animationDelay: `${index * 60 + 200}ms`,
        transformOrigin: `${node.x}px ${node.y}px`,
      }}
      role="img"
      aria-label={node.label}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onMouseDown={(e) => onMouseDown(e, node.id)}
    >
      {/* Rounded rect */}
      <rect
        x={node.x - rectW / 2} y={node.y - rectH / 2}
        width={rectW} height={rectH}
        rx={8} ry={8}
        fill={active ? `${color}20` : `${color}10`}
        stroke={color}
        strokeWidth={active ? 2 : 1}
        filter={active ? 'url(#node-glow)' : 'url(#node-shadow)'}
        style={{
          transition: 'stroke-width 0.25s ease',
        }}
      />

      {/* Text label */}
      <text
        x={node.x} y={node.y + 1}
        textAnchor="middle" dominantBaseline="central"
        fill={color}
        fontSize="10" fontWeight="700"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        style={{
          pointerEvents: 'none',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {node.label.length > 24 ? node.label.slice(0, 22) + '...' : node.label}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Tooltip component
// ---------------------------------------------------------------------------

function SvgTooltip({ node }: { node: GraphNode }) {
  const isScene = node.type === 'scene';
  const excerpt = node.trace?.conversation_history?.[0]?.content?.slice(0, 80);
  const tooltipW = 160; // Smaller width
  const tooltipH = isScene ? 65 : 30; // Smaller height
  const tx = node.x - tooltipW / 2;
  const ty = node.y - (isScene ? tooltipH + 20 : tooltipH + 18);

  return (
    <foreignObject
      x={tx} y={ty} width={tooltipW} height={tooltipH + 20}
      style={{ pointerEvents: 'none', overflow: 'visible' }}
    >
      <div className="bg-warm-white border border-warm-grey rounded-lg shadow-lg px-2 py-1.5">
        {isScene ? (
          <>
            <p className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-tertiary mb-0.5">
              {node.label}
            </p>
            {node.status && (
              <span
                className="inline-block text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 rounded mb-1"
                style={{
                  color: statusColor(node.status),
                  backgroundColor: `${statusColor(node.status)}15`,
                }}
              >
                {STATUS_LABELS[node.status] ?? node.status}
              </span>
            )}
            {excerpt && (
              <p className="text-[9px] text-body leading-snug line-clamp-2">
                &ldquo;{excerpt}...&rdquo;
              </p>
            )}
            <p className="text-[7px] text-tertiary mt-0.5">Click to view</p>
          </>
        ) : (
          <p className="text-[9px] font-semibold text-wheat-gold">{node.label}</p>
        )}
      </div>
    </foreignObject>
  );
}

// ---------------------------------------------------------------------------
// Main ReasoningGraph component
// ---------------------------------------------------------------------------

export function ReasoningGraph({ traces, scenes, className, onSelectTrace }: ReasoningGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const svgRef = useState<SVGSVGElement | null>(null)[0];

  // Build and layout graph (keep initial positions)
  const initialLayout = useMemo(() => {
    if (traces.length === 0) return { nodes: [], edges: [] };
    const raw = buildGraph(traces, scenes);
    const laidOut = runForceLayout(raw.nodes, raw.edges, 60);
    return { nodes: laidOut, edges: raw.edges };
  }, [traces, scenes]);

  // Track node positions (mutable for drag performance)
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Initialize positions when layout changes
  useState(() => {
    const positions = new Map<string, { x: number; y: number }>();
    initialLayout.nodes.forEach(n => positions.set(n.id, { x: n.x, y: n.y }));
    setNodePositions(positions);
  });

  // Merge positions with node data
  const nodes = useMemo(() => {
    return initialLayout.nodes.map(n => {
      const pos = nodePositions.get(n.id) || { x: n.x, y: n.y };
      return { ...n, x: pos.x, y: pos.y };
    });
  }, [initialLayout.nodes, nodePositions]);

  const edges = initialLayout.edges;

  // Compute SVG viewBox to fit all nodes with padding
  const viewBox = useMemo(() => {
    if (nodes.length === 0) return '0 0 800 500';
    const pad = 80;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      const extra = n.type === 'concept' ? 100 : 40;
      if (n.x - extra < minX) minX = n.x - extra;
      if (n.x + extra > maxX) maxX = n.x + extra;
      if (n.y - 40 < minY) minY = n.y - 40;
      if (n.y + 40 > maxY) maxY = n.y + 40;
    }
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [nodes]);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      // Only trigger click if we didn't drag
      if (hasDragged) return;
      if (node.type !== 'scene') return;
      const newId = selectedNode === node.id ? null : node.id;
      setSelectedNode(newId);
      onSelectTrace?.(newId ? node.trace ?? null : null);
    },
    [selectedNode, onSelectTrace, hasDragged]
  );

  // Drag handlers
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Get SVG coordinate space
    const svg = (e.target as SVGElement).ownerSVGElement;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    setDraggedNode(nodeId);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setHasDragged(false);
    setDragOffset({
      x: svgP.x - node.x,
      y: svgP.y - node.y
    });
  }, [nodes]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedNode) {
      // Check if mouse has moved enough to be considered a drag (5px threshold)
      const dragDistance = Math.sqrt(
        Math.pow(e.clientX - dragStartPos.x, 2) +
        Math.pow(e.clientY - dragStartPos.y, 2)
      );

      if (dragDistance > 5) {
        setHasDragged(true);
      }

      const svg = e.currentTarget;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

      const newX = svgP.x - dragOffset.x;
      const newY = svgP.y - dragOffset.y;

      setNodePositions(prev => {
        const newMap = new Map(prev);
        const oldPos = prev.get(draggedNode);
        if (!oldPos) return prev;

        // Calculate movement delta from last frame
        const dx = newX - oldPos.x;
        const dy = newY - oldPos.y;

        // Update dragged node
        newMap.set(draggedNode, { x: newX, y: newY });

        // Build adjacency map for quick lookup
        const adjacencyMap = new Map<string, string[]>();
        edges.forEach(edge => {
          if (!adjacencyMap.has(edge.source)) adjacencyMap.set(edge.source, []);
          if (!adjacencyMap.has(edge.target)) adjacencyMap.set(edge.target, []);
          adjacencyMap.get(edge.source)!.push(edge.target);
          adjacencyMap.get(edge.target)!.push(edge.source);
        });

        // Visited set to prevent infinite loops
        const visited = new Set<string>();
        visited.add(draggedNode);

        // Queue for BFS traversal - pass along the actual movement delta
        const queue: Array<{ nodeId: string; depth: number; pullDx: number; pullDy: number; strength: number }> = [];

        // Add direct connections to queue with higher initial strength
        const directConnections = adjacencyMap.get(draggedNode) || [];
        directConnections.forEach(connectedId => {
          queue.push({ nodeId: connectedId, depth: 1, pullDx: dx, pullDy: dy, strength: 0.5 });
        });

        // Process queue with diminishing force
        while (queue.length > 0) {
          const { nodeId, depth, pullDx, pullDy, strength } = queue.shift()!;

          if (visited.has(nodeId)) continue;
          visited.add(nodeId);

          // Get current position from prev map
          const currentNodePos = prev.get(nodeId);
          if (!currentNodePos) continue;

          // Calculate movement for this node (inherit movement from parent with strength)
          const nodeDx = pullDx * strength;
          const nodeDy = pullDy * strength;

          // Update this node's position
          const newNodePos = {
            x: currentNodePos.x + nodeDx,
            y: currentNodePos.y + nodeDy
          };
          newMap.set(nodeId, newNodePos);

          // Calculate actual movement distance
          const movementDistance = Math.sqrt(nodeDx * nodeDx + nodeDy * nodeDy);

          // If node moved more than threshold (5px), pull its connections too
          // Maximum depth of 4 levels for better propagation
          if (movementDistance > 5 && depth < 4) {
            const nextStrength = strength * 0.7; // Higher retention (70% of previous level)
            const nextConnections = adjacencyMap.get(nodeId) || [];

            nextConnections.forEach(nextNodeId => {
              if (!visited.has(nextNodeId)) {
                queue.push({
                  nodeId: nextNodeId,
                  depth: depth + 1,
                  pullDx: nodeDx, // Pass this node's actual movement
                  pullDy: nodeDy,
                  strength: nextStrength
                });
              }
            });
          }
        }

        return newMap;
      });
    } else if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setViewTransform(prev => ({
        ...prev,
        x: prev.x + dx / prev.scale,
        y: prev.y + dy / prev.scale
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [draggedNode, dragOffset, isPanning, panStart, edges, dragStartPos]);

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
    setIsPanning(false);
    // Reset hasDragged after a short delay to allow click handler to check it
    setTimeout(() => setHasDragged(false), 0);
  }, []);

  const handleSvgMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Left click only
    if ((e.target as SVGElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const nodeMap = useMemo(() => {
    const m = new Map<string, GraphNode>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  // ---- Empty state ----
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
    <div className={`relative select-none ${className ?? ''}`}>
      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-4 bg-warm-white/80 backdrop-blur-sm border border-warm-grey rounded-lg px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full border-2" style={{ borderColor: '#C85A32', backgroundColor: '#C85A3218' }} />
          <span className="text-[9px] font-bold uppercase tracking-wider text-tertiary">Scene</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm border" style={{ borderColor: '#C4A245', backgroundColor: '#C4A24518' }} />
          <span className="text-[9px] font-bold uppercase tracking-wider text-tertiary">Concept</span>
        </div>
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

      {/* SVG Graph */}
      <svg
        viewBox={viewBox}
        className="w-full cursor-grab active:cursor-grabbing"
        style={{ height: 400, maxHeight: 400 }}
        role="img"
        aria-label="Reasoning trace graph showing student progression through assessment scenes"
        onMouseDown={handleSvgMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <SvgDefs />

        {/* Background grid */}
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />

        {/* Edges layer */}
        <g>
          {edges.map((edge, i) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;
            return (
              <Edge
                key={`${edge.source}-${edge.target}`}
                x1={src.x} y1={src.y}
                x2={tgt.x} y2={tgt.y}
                type={edge.type}
                index={i}
              />
            );
          })}
        </g>

        {/* Concept nodes layer */}
        <g>
          {nodes.filter((n) => n.type === 'concept').map((node, i) => (
            <ConceptNode
              key={node.id}
              node={node}
              isHovered={hoveredNode === node.id}
              onHover={setHoveredNode}
              onMouseDown={handleNodeMouseDown}
              index={i}
            />
          ))}
        </g>

        {/* Scene nodes layer (on top) */}
        <g>
          {nodes.filter((n) => n.type === 'scene').map((node, i) => (
            <SceneNode
              key={node.id}
              node={node}
              isSelected={selectedNode === node.id}
              isHovered={hoveredNode === node.id}
              onHover={setHoveredNode}
              onClick={handleNodeClick}
              onMouseDown={handleNodeMouseDown}
              index={i}
            />
          ))}
        </g>
        {/* Tooltip (SVG-native, coords match) */}
        {hoveredNode && nodeMap.get(hoveredNode) && (
          <SvgTooltip node={nodeMap.get(hoveredNode)!} />
        )}
      </svg>
    </div>
  );
}
