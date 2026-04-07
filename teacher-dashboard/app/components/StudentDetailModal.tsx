// Full-screen student detail modal with reasoning trace graph
// Shows stats, dimension scores, interactive node graph, and conversation detail

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useReasoningTraces } from '../hooks/useReasoningTraces';
import { ReasoningGraph } from './ReasoningGraph';
import type { ReasoningTrace, ConversationTurn } from '../lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StudentDetailModalProps {
  student: {
    student_id: string;
    student_name: string;
    email?: string;
    progress: number;
    dimensions: Record<string, number>;
    arc_status: string;
    scenes_completed: number;
    total_scenes: number;
    last_active?: string;
  };
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    complete: { label: 'Complete', cls: 'text-mastery bg-mastery/10' },
    in_progress: { label: 'In Progress', cls: 'text-misconception bg-misconception/10' },
    flagged: { label: 'Flagged', cls: 'text-critical bg-critical/10' },
    not_started: { label: 'Not Started', cls: 'text-tertiary bg-warm-grey/20' },
  };
  return map[status] ?? map.not_started;
}

function getDimensionColor(score: number): string {
  if (score >= 80) return '#3B827E';
  if (score >= 50) return '#D4A347';
  return '#9E3B3B';
}

function getDimensionLabel(score: number): string {
  if (score >= 80) return 'Mastery';
  if (score >= 50) return 'Developing';
  return 'Critical';
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-parchment/50 rounded-xl border border-warm-grey px-4 py-3.5 flex items-start gap-3">
      <span className="material-symbols-outlined text-lg text-terracotta/60 mt-0.5">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-tertiary mb-1">
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dimension bar chart
// ---------------------------------------------------------------------------

function DimensionBar({
  name,
  score,
  delay,
}: {
  name: string;
  score: number;
  delay: number;
}) {
  const [width, setWidth] = useState(0);
  const color = getDimensionColor(score);

  useEffect(() => {
    const t = setTimeout(() => setWidth(score), delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div className="flex items-center gap-3">
      <p className="text-[11px] font-semibold text-primary w-32 shrink-0 truncate" title={name}>
        {name}
      </p>
      <div className="flex-1 h-2.5 bg-warm-grey/20 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            backgroundColor: color,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
      <div className="flex items-center gap-1.5 w-20 shrink-0 justify-end">
        <span className="text-[12px] font-bold" style={{ color }}>
          {score}%
        </span>
        <span
          className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ color, backgroundColor: `${color}15` }}
        >
          {getDimensionLabel(score)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conversation panel
// ---------------------------------------------------------------------------

function ConversationPanel({
  trace,
  onClose,
}: {
  trace: ReasoningTrace;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [trace.trace_id]);

  const statusColor =
    trace.status === 'mastery'
      ? '#3B827E'
      : trace.status === 'revised_with_scaffolding'
        ? '#D4A347'
        : '#9E3B3B';

  const statusLabel =
    trace.status === 'mastery'
      ? 'Mastery'
      : trace.status === 'revised_with_scaffolding'
        ? 'Revised with Scaffolding'
        : 'Critical Gap';

  return (
    <div
      ref={panelRef}
      className="bg-parchment/30 rounded-xl border border-warm-grey overflow-hidden"
      style={{ animation: 'slideUp 0.25s ease-out' }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-warm-grey bg-warm-white">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-terracotta text-lg">
            forum
          </span>
          <div>
            <p className="text-[12px] font-bold text-primary">Conversation Detail</p>
            <p className="text-[10px] text-tertiary">Scene {trace.scene_id.slice(-6)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
            style={{ color: statusColor, backgroundColor: `${statusColor}15` }}
          >
            {statusLabel}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-parchment transition-colors"
            aria-label="Close conversation panel"
          >
            <span className="material-symbols-outlined text-tertiary text-base">close</span>
          </button>
        </div>
      </div>

      {/* Answers summary */}
      <div className="grid grid-cols-2 gap-px bg-warm-grey">
        <div className="bg-warm-white px-5 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-tertiary mb-1">
            Initial Answer
          </p>
          <p className="text-[12px] text-body leading-relaxed">
            {trace.initial_answer || 'No initial answer recorded'}
          </p>
        </div>
        <div className="bg-warm-white px-5 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-tertiary mb-1">
            Revised Answer
          </p>
          <p className="text-[12px] text-body leading-relaxed">
            {trace.revised_answer || 'No revision recorded'}
          </p>
        </div>
      </div>

      {/* Conversation turns */}
      <div className="px-5 py-4 space-y-3 max-h-[320px] overflow-y-auto">
        {trace.conversation_history.map((turn: ConversationTurn, i: number) => (
          <div
            key={i}
            className={`flex ${turn.role === 'student' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                turn.role === 'student'
                  ? 'bg-terracotta/10 border border-terracotta/20'
                  : 'bg-warm-white border border-warm-grey'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-xs text-tertiary">
                  {turn.role === 'student' ? 'school' : 'smart_toy'}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-tertiary">
                  {turn.role === 'student' ? 'Student' : 'Character'}
                </span>
                {turn.emotion && (
                  <span className="text-[9px] text-tertiary/60 italic ml-1">
                    ({turn.emotion})
                  </span>
                )}
              </div>
              <p className="text-[12px] text-body leading-relaxed">{turn.content}</p>
            </div>
          </div>
        ))}

        {trace.conversation_history.length === 0 && (
          <p className="text-[12px] text-tertiary/50 text-center py-4">
            No conversation history recorded for this trace
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function GraphSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="flex items-center gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div
              className="w-11 h-11 rounded-full bg-warm-grey/30"
              style={{
                animation: `pulse 1.5s ease-in-out infinite`,
                animationDelay: `${i * 150}ms`,
              }}
            />
            <div className="w-10 h-2 rounded bg-warm-grey/20" />
          </div>
        ))}
      </div>
      <p className="text-[11px] text-tertiary/40 mt-2">Loading reasoning traces...</p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main modal component
// ---------------------------------------------------------------------------

export function StudentDetailModal({ student, onClose }: StudentDetailModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedTrace, setSelectedTrace] = useState<ReasoningTrace | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { data: traces, isLoading, isError } = useReasoningTraces(student.student_id);

  // Mount animation
  useEffect(() => {
    // Small delay to trigger CSS transition
    const t = requestAnimationFrame(() => setIsOpen(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Focus trap — keep Tab cycling within the modal
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const previouslyFocused = document.activeElement as HTMLElement;

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = modal.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleKeyDown);

    // Focus the close button on mount
    const closeBtn = modal.querySelector<HTMLElement>('button[aria-label="Close modal"]');
    closeBtn?.focus();

    return () => {
      modal.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  // Close with animation (guarded against double-fire)
  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setIsOpen(false);
    setTimeout(onClose, 180);
  }, [onClose, isClosing]);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) handleClose();
    },
    [handleClose]
  );

  const badge = getStatusBadge(student.arc_status);
  const dimensionEntries = Object.entries(student.dimensions);

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-label={`Student detail: ${student.student_name}`}
      >
        {/* Backdrop overlay */}
        <div
          className="absolute inset-0 bg-near-black pointer-events-none"
          style={{
            opacity: isOpen && !isClosing ? 0.6 : 0,
            transition: 'opacity 200ms ease-out',
          }}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className="relative z-10 bg-warm-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          style={{
            opacity: isOpen && !isClosing ? 1 : 0,
            transform: isOpen && !isClosing ? 'translateY(0)' : 'translateY(24px)',
            transition: isClosing
              ? 'opacity 150ms ease-in, transform 150ms ease-in'
              : 'opacity 200ms ease-out, transform 200ms ease-out',
          }}
        >
          {/* ──────── Header ──────── */}
          <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-warm-white border-b border-warm-grey">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-terracotta/10 rounded-full flex items-center justify-center text-terracotta font-bold text-sm">
                {student.student_name.charAt(0)}
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-primary leading-tight truncate max-w-[400px]">
                  {student.student_name}
                </h2>
                {student.email && (
                  <p className="text-[11px] text-tertiary mt-0.5">{student.email}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-parchment transition-colors group"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-xl text-tertiary group-hover:text-primary transition-colors">
                close
              </span>
            </button>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* ──────── Stats row ──────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon="speed" label="Overall Progress">
                <div className="flex items-end gap-1.5">
                  <span className="text-[22px] font-extrabold text-primary leading-none">
                    {student.progress}
                  </span>
                  <span className="text-[12px] font-bold text-tertiary mb-0.5">%</span>
                </div>
              </StatCard>

              <StatCard icon="movie" label="Scenes Completed">
                <div className="flex items-end gap-1">
                  <span className="text-[22px] font-extrabold text-primary leading-none">
                    {student.scenes_completed}
                  </span>
                  <span className="text-[12px] font-bold text-tertiary mb-0.5">
                    / {student.total_scenes}
                  </span>
                </div>
              </StatCard>

              <StatCard icon="flag" label="Arc Status">
                <span
                  className={`inline-block text-[10px] font-extrabold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full ${badge.cls}`}
                >
                  {badge.label}
                </span>
              </StatCard>

              <StatCard icon="schedule" label="Last Active">
                <p className="text-[13px] font-semibold text-primary">
                  {formatRelativeTime(student.last_active)}
                </p>
              </StatCard>
            </div>

            {/* ──────── Dimension scores ──────── */}
            {dimensionEntries.length > 0 && (
              <div className="bg-warm-white rounded-xl border border-warm-grey p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-lg text-wheat-gold">
                    equalizer
                  </span>
                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-tertiary">
                    Dimension Scores
                  </h3>
                </div>
                <div className="space-y-3">
                  {dimensionEntries.map(([name, score], i) => (
                    <DimensionBar key={name} name={name} score={score} delay={100 + i * 80} />
                  ))}
                </div>

                {/* Threshold legend */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-warm-grey/50">
                  {[
                    { color: '#3B827E', label: 'Mastery (80+)' },
                    { color: '#D4A347', label: 'Developing (50-79)' },
                    { color: '#9E3B3B', label: 'Critical (<50)' },
                  ].map((t) => (
                    <div key={t.label} className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-[9px] font-semibold text-tertiary/60">
                        {t.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ──────── Reasoning Graph ──────── */}
            <div className="bg-warm-white rounded-xl border border-warm-grey overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                <span className="material-symbols-outlined text-lg text-terracotta">
                  psychology
                </span>
                <h3 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-tertiary">
                  Reasoning Trace Graph
                </h3>
              </div>

              {isLoading ? (
                <GraphSkeleton />
              ) : isError ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-critical/40 mb-2">error</span>
                  <p className="text-[12px] text-critical font-bold">Failed to load reasoning traces</p>
                </div>
              ) : (
                <ReasoningGraph
                  traces={traces ?? []}
                  className="px-2 pb-2"
                  onSelectTrace={setSelectedTrace}
                />
              )}
            </div>

            {/* ──────── Conversation Detail ──────── */}
            {selectedTrace && (
              <ConversationPanel
                trace={selectedTrace}
                onClose={() => setSelectedTrace(null)}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
