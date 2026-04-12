// Student-side progress graph for demo mode
// Shows reasoning trace nodes in a circular orbit layout - no external graph library needed
// Polls every 30s for real-time updates as scenes are completed

'use client';

import { useEffect, useState, useCallback } from 'react';
import { BASE_URL } from '../lib/api';

interface ReasoningTrace {
  trace_id: string;
  scene_id: string;
  scene_order: number;
  status: 'mastery' | 'revised_with_scaffolding' | 'critical_gap' | null;
  arc_id: string;
}

interface ArcEnding {
  ending_id: string;
  ending_type: 'good_end' | 'bad_end' | 'iffy_end';
  performance_level: string;
}

interface DemoProgressGraphProps {
  studentId: string;
  arcId: string;
}

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
  none: 'Not evaluated yet',
};

const ENDING_COLORS: Record<string, string> = {
  good_end: '#3B827E',
  iffy_end: '#D4A347',
  bad_end: '#9E3B3B',
};

const ENDING_LABELS: Record<string, string> = {
  good_end: 'Understanding Secured',
  iffy_end: 'Partial Understanding',
  bad_end: 'Further Study Needed',
};

export function DemoProgressGraph({ studentId, arcId }: DemoProgressGraphProps) {
  const [traces, setTraces] = useState<ReasoningTrace[]>([]);
  const [arcEnding, setArcEnding] = useState<ArcEnding | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [tracesRes, endingRes] = await Promise.allSettled([
        fetch(`${BASE_URL}/api/reasoning-trace/student/${studentId}`),
        fetch(`${BASE_URL}/api/arc-endings/student/${studentId}/arc/${arcId}`),
      ]);

      if (tracesRes.status === 'fulfilled' && tracesRes.value.ok) {
        const data = await tracesRes.value.json();
        // Deduplicate by scene_id, keep latest
        const deduped = new Map<string, ReasoningTrace>();
        for (const t of data) {
          if (t.arc_id === arcId) {
            const existing = deduped.get(t.scene_id);
            if (!existing || t.created_at > existing.created_at) {
              deduped.set(t.scene_id, t);
            }
          }
        }
        const sorted = Array.from(deduped.values()).sort(
          (a, b) => (a.scene_order || 0) - (b.scene_order || 0)
        );
        setTraces(sorted);
      }

      if (endingRes.status === 'fulfilled' && endingRes.value.ok) {
        const data = await endingRes.value.json();
        if (data && data.ending_id) setArcEnding(data);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.warn('Progress graph fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, arcId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (traces.length === 0 && !arcEnding) {
    return (
      <div className="text-center py-12 text-parchment/40 text-sm">
        Complete scenes to see your progress graph here.
      </div>
    );
  }

  // Layout: ending node at center, scene nodes orbit around it
  const centerX = 200;
  const centerY = 200;
  const orbitRadius = 130;
  const nodeCount = traces.length;

  const scenePositions = traces.map((_, i) => {
    const angle = (i / Math.max(nodeCount, 1)) * 2 * Math.PI - Math.PI / 2;
    return {
      x: centerX + orbitRadius * Math.cos(angle),
      y: centerY + orbitRadius * Math.sin(angle),
    };
  });

  return (
    <div className="bg-near-black/50 border border-parchment/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-parchment uppercase tracking-widest">Your Arc Progress</h3>
        {lastUpdated && (
          <span className="text-[9px] text-parchment/30 uppercase tracking-wider">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* SVG graph */}
        <svg width="400" height="400" viewBox="0 0 400 400" className="max-w-full">
          {/* Orbit ring */}
          <circle
            cx={centerX}
            cy={centerY}
            r={orbitRadius}
            fill="none"
            stroke="rgba(244,241,234,0.06)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Edges: scene to ending */}
          {arcEnding && traces.map((trace, i) => {
            const pos = scenePositions[i];
            const endColor = ENDING_COLORS[arcEnding.ending_type] || '#8A7F72';
            return (
              <line
                key={`edge-ending-${trace.scene_id}`}
                x1={pos.x}
                y1={pos.y}
                x2={centerX}
                y2={centerY}
                stroke={endColor}
                strokeWidth="1.5"
                strokeOpacity="0.3"
                strokeDasharray="5 3"
              />
            );
          })}

          {/* Edges: scene to scene (consecutive) */}
          {traces.map((trace, i) => {
            if (i === 0) return null;
            const from = scenePositions[i - 1];
            const to = scenePositions[i];
            return (
              <line
                key={`edge-scene-${i}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#C4A245"
                strokeWidth="1"
                strokeOpacity="0.25"
              />
            );
          })}

          {/* Ending node (center) */}
          {arcEnding ? (
            <>
              <circle
                cx={centerX}
                cy={centerY}
                r={36}
                fill={`${ENDING_COLORS[arcEnding.ending_type]}30`}
                stroke={ENDING_COLORS[arcEnding.ending_type]}
                strokeWidth="3"
                style={{ filter: `drop-shadow(0 0 12px ${ENDING_COLORS[arcEnding.ending_type]}60)` }}
              />
              <text
                x={centerX}
                y={centerY - 4}
                textAnchor="middle"
                className="fill-current"
                fontSize="22"
                style={{ fill: ENDING_COLORS[arcEnding.ending_type] }}
              >
                {arcEnding.ending_type === 'good_end' ? '✓' : arcEnding.ending_type === 'bad_end' ? '✕' : '~'}
              </text>
              <text
                x={centerX}
                y={centerY + 14}
                textAnchor="middle"
                fontSize="8"
                fontWeight="bold"
                style={{ fill: ENDING_COLORS[arcEnding.ending_type], letterSpacing: '0.1em' }}
              >
                ENDING
              </text>
              <text
                x={centerX}
                y={centerY + 52}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                style={{ fill: ENDING_COLORS[arcEnding.ending_type] }}
              >
                {ENDING_LABELS[arcEnding.ending_type]}
              </text>
            </>
          ) : (
            <>
              <circle
                cx={centerX}
                cy={centerY}
                r={32}
                fill="rgba(138,127,114,0.1)"
                stroke="#8A7F72"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <text
                x={centerX}
                y={centerY + 5}
                textAnchor="middle"
                fontSize="10"
                style={{ fill: '#8A7F72', letterSpacing: '0.05em' }}
              >
                IN PROGRESS
              </text>
            </>
          )}

          {/* Scene nodes */}
          {traces.map((trace, i) => {
            const pos = scenePositions[i];
            const color = STATUS_COLORS[trace.status ?? 'none'];
            return (
              <g key={trace.scene_id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={22}
                  fill={`${color}20`}
                  stroke={color}
                  strokeWidth="2"
                />
                <text
                  x={pos.x}
                  y={pos.y + 6}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="bold"
                  style={{ fill: color }}
                >
                  {trace.scene_order || i + 1}
                </text>
                {/* Status dot */}
                <circle
                  cx={pos.x + 16}
                  cy={pos.y - 16}
                  r={4}
                  fill={color}
                  stroke="rgba(30,28,24,1)"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 text-[10px] font-bold uppercase tracking-widest">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: STATUS_COLORS[key] }}
              />
              <span style={{ color: STATUS_COLORS[key] }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Scene breakdown list */}
        {traces.length > 0 && (
          <div className="w-full space-y-2 mt-2">
            {traces.map((trace, i) => {
              const color = STATUS_COLORS[trace.status ?? 'none'];
              const label = STATUS_LABELS[trace.status ?? 'none'];
              return (
                <div
                  key={trace.scene_id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: `${color}10`, borderLeft: `3px solid ${color}` }}
                >
                  <span className="text-xs font-bold min-w-[20px]" style={{ color }}>
                    {trace.scene_order || i + 1}
                  </span>
                  <span className="text-xs text-parchment/70 flex-1">Scene {trace.scene_order || i + 1}</span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
