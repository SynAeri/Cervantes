// Student-side progress graph for demo mode
// Shows scene assignment nodes orbiting a central ending node
// Polls every 30s for real-time updates - responsive for mobile and desktop

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { BASE_URL } from '../lib/api';

interface SceneAssignment {
  scene_id?: string;
  scene_order: number;
  status: 'not_started' | 'started' | 'completed';
  started_at?: string | null;
  completed_at?: string | null;
}

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

const TRACE_COLORS: Record<string, string> = {
  mastery: '#3B827E',
  revised_with_scaffolding: '#D4A347',
  critical_gap: '#9E3B3B',
};

const ASSIGNMENT_COLORS: Record<string, string> = {
  completed: '#3B827E',
  started: '#D4A347',
  not_started: '#8A7F72',
};

const TRACE_LABELS: Record<string, string> = {
  mastery: 'Mastery',
  revised_with_scaffolding: 'Revised',
  critical_gap: 'Critical gap',
};

const ASSIGNMENT_LABELS: Record<string, string> = {
  completed: 'Completed',
  started: 'In progress',
  not_started: 'Not started',
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
  const [assignments, setAssignments] = useState<SceneAssignment[]>([]);
  const [traceMap, setTraceMap] = useState<Record<number, ReasoningTrace>>({});
  const [arcEnding, setArcEnding] = useState<ArcEnding | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgSize, setSvgSize] = useState(320);

  // Responsive SVG size
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setSvgSize(Math.min(Math.max(w - 16, 240), 400));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [assignmentsRes, tracesRes, endingRes] = await Promise.allSettled([
        fetch(`${BASE_URL}/api/scene/progress/student/${studentId}/arc/${arcId}`),
        fetch(`${BASE_URL}/api/reasoning-trace/student/${studentId}`),
        fetch(`${BASE_URL}/api/arc-endings/student/${studentId}/arc/${arcId}`),
      ]);

      if (assignmentsRes.status === 'fulfilled' && assignmentsRes.value.ok) {
        const data = await assignmentsRes.value.json();
        const sorted = (data.assignments || []).sort(
          (a: SceneAssignment, b: SceneAssignment) => a.scene_order - b.scene_order
        );
        setAssignments(sorted);
      }

      if (tracesRes.status === 'fulfilled' && tracesRes.value.ok) {
        const data = await tracesRes.value.json();
        const map: Record<number, ReasoningTrace> = {};
        for (const t of data) {
          if (t.arc_id === arcId) {
            const existing = map[t.scene_order];
            if (!existing || t.created_at > existing.created_at) {
              map[t.scene_order] = t;
            }
          }
        }
        setTraceMap(map);
      }

      if (endingRes.status === 'fulfilled' && endingRes.value.ok) {
        const data = await endingRes.value.json();
        if (data?.ending_id) setArcEnding(data);
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
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-10 text-parchment/40 text-sm">
        No scenes assigned yet.
      </div>
    );
  }

  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const orbitR = svgSize * 0.38;
  const nodeR = Math.max(svgSize * 0.065, 18);
  const endingR = Math.max(svgSize * 0.1, 28);

  const positions = assignments.map((_, i) => {
    const angle = (i / assignments.length) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + orbitR * Math.cos(angle), y: cy + orbitR * Math.sin(angle) };
  });

  const endingColor = arcEnding ? ENDING_COLORS[arcEnding.ending_type] : '#8A7F72';

  return (
    <div ref={containerRef} className="bg-near-black/50 border border-parchment/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-parchment uppercase tracking-widest">Your Arc Progress</h3>
        {lastUpdated && (
          <span className="text-[9px] text-parchment/30 uppercase tracking-wider">
            {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="w-full"
          style={{ maxWidth: svgSize }}
        >
          {/* Orbit ring */}
          <circle cx={cx} cy={cy} r={orbitR} fill="none" stroke="rgba(244,241,234,0.06)" strokeWidth="1" strokeDasharray="4 4" />

          {/* Edges: scene to ending */}
          {positions.map((pos, i) => (
            <line
              key={`e-end-${i}`}
              x1={pos.x} y1={pos.y} x2={cx} y2={cy}
              stroke={endingColor}
              strokeWidth="1"
              strokeOpacity="0.2"
              strokeDasharray="4 3"
            />
          ))}

          {/* Edges: scene to scene */}
          {positions.map((pos, i) => {
            if (i === 0) return null;
            const prev = positions[i - 1];
            return (
              <line key={`e-scene-${i}`} x1={prev.x} y1={prev.y} x2={pos.x} y2={pos.y}
                stroke="#C4A245" strokeWidth="1" strokeOpacity="0.2" />
            );
          })}

          {/* Ending / progress node (center) */}
          {arcEnding ? (
            <>
              <circle cx={cx} cy={cy} r={endingR}
                fill={`${endingColor}25`} stroke={endingColor} strokeWidth="2.5"
                style={{ filter: `drop-shadow(0 0 10px ${endingColor}50)` }}
              />
              <text x={cx} y={cy - 3} textAnchor="middle" fontSize={endingR * 0.7} fontWeight="bold"
                style={{ fill: endingColor }}>
                {arcEnding.ending_type === 'good_end' ? '✓' : arcEnding.ending_type === 'bad_end' ? '✕' : '~'}
              </text>
              <text x={cx} y={cy + endingR * 0.45} textAnchor="middle" fontSize={Math.max(endingR * 0.28, 7)} fontWeight="bold"
                style={{ fill: endingColor, letterSpacing: '0.08em' }}>
                END
              </text>
            </>
          ) : (
            <>
              <circle cx={cx} cy={cy} r={endingR}
                fill="rgba(138,127,114,0.08)" stroke="#8A7F72" strokeWidth="1.5" strokeDasharray="4 3" />
              <text x={cx} y={cy + 4} textAnchor="middle" fontSize={Math.max(endingR * 0.28, 7)}
                style={{ fill: '#8A7F72', letterSpacing: '0.06em' }}>
                {assignments.some(a => a.status !== 'not_started') ? 'IN PROG' : 'START'}
              </text>
            </>
          )}

          {/* Scene nodes */}
          {assignments.map((a, i) => {
            const pos = positions[i];
            const trace = traceMap[a.scene_order];
            // Prefer trace status color if available, otherwise use assignment status
            const color = trace?.status
              ? TRACE_COLORS[trace.status]
              : ASSIGNMENT_COLORS[a.status] ?? '#8A7F72';

            return (
              <g key={Number(a.scene_order)}>
                <circle cx={pos.x} cy={pos.y} r={nodeR}
                  fill={`${color}20`} stroke={color} strokeWidth="2" />
                <text x={pos.x} y={pos.y + nodeR * 0.35} textAnchor="middle"
                  fontSize={nodeR * 0.75} fontWeight="bold" style={{ fill: color }}>
                  {Number(a.scene_order)}
                </text>
                {/* Status dot */}
                <circle cx={pos.x + nodeR * 0.7} cy={pos.y - nodeR * 0.7} r={nodeR * 0.22}
                  fill={color} stroke="rgba(30,28,24,1)" strokeWidth="1.5" />
              </g>
            );
          })}
        </svg>

        {/* Scene breakdown list */}
        <div className="w-full space-y-2">
          {assignments.map((a, i) => {
            const trace = traceMap[a.scene_order];
            const color = trace?.status
              ? TRACE_COLORS[trace.status]
              : ASSIGNMENT_COLORS[a.status] ?? '#8A7F72';
            const label = trace?.status
              ? TRACE_LABELS[trace.status]
              : ASSIGNMENT_LABELS[a.status] ?? 'Unknown';

            return (
              <div key={Number(a.scene_order)} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{ backgroundColor: `${color}10`, borderLeft: `3px solid ${color}` }}>
                <span className="text-xs font-bold w-5 text-center flex-shrink-0" style={{ color }}>
                  {Number(a.scene_order)}
                </span>
                <span className="text-xs text-parchment/70 flex-1">Scene {Number(a.scene_order)}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex-shrink-0"
                  style={{ backgroundColor: `${color}20`, color }}>
                  {label}
                </span>
              </div>
            );
          })}
          {arcEnding && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg mt-1"
              style={{ backgroundColor: `${endingColor}10`, borderLeft: `3px solid ${endingColor}` }}>
              <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: endingColor }}>
                auto_awesome
              </span>
              <span className="text-xs text-parchment/70 flex-1">Arc Ending</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex-shrink-0"
                style={{ backgroundColor: `${endingColor}20`, color: endingColor }}>
                {ENDING_LABELS[arcEnding.ending_type]}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
