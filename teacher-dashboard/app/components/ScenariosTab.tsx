// Scenarios tab panel — displays all narrative arcs for a class
// Each arc is rendered as a "chapter card" with status, scenes, and concept tags

'use client';

import Link from 'next/link';
import { useArcs } from '../hooks/useArcs';
import type { Arc, Scene } from '../lib/types';

interface ScenariosTabProps {
  classId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(dateString).toLocaleDateString();
}

function sceneTypeCounts(scenes: Scene[]) {
  const counts = { bridge: 0, deep: 0, side_event: 0 };
  for (const s of scenes) {
    if (s.scene_type in counts) {
      counts[s.scene_type]++;
    }
  }
  return counts;
}

function uniqueConcepts(scenes: Scene[]): string[] {
  const set = new Set<string>();
  for (const s of scenes) {
    if (s.concept_target) set.add(s.concept_target);
  }
  return Array.from(set);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: Arc['status'] }) {
  const styles: Record<Arc['status'], string> = {
    draft: 'bg-warm-grey/30 text-tertiary',
    generating: 'bg-wheat-gold/10 text-wheat-gold animate-pulse',
    published: 'bg-mastery/10 text-mastery',
  };

  const labels: Record<Arc['status'], string> = {
    draft: 'Draft',
    generating: 'Generating',
    published: 'Published',
  };

  return (
    <span
      className={`text-[10px] font-extrabold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

const sceneTypePillStyles: Record<Scene['scene_type'], string> = {
  bridge: 'bg-mastery/10 text-mastery',
  deep: 'bg-terracotta/10 text-terracotta',
  side_event: 'bg-wheat-gold/10 text-wheat-gold',
};

const sceneTypeLabels: Record<Scene['scene_type'], string> = {
  bridge: 'Bridge',
  deep: 'Deep',
  side_event: 'Side Event',
};

function SceneTypePill({ type, count }: { type: Scene['scene_type']; count: number }) {
  if (count === 0) return null;
  return (
    <span
      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${sceneTypePillStyles[type]}`}
    >
      {count} {sceneTypeLabels[type]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Arc Card
// ---------------------------------------------------------------------------

function ArcCard({ arc }: { arc: Arc }) {
  const counts = sceneTypeCounts(arc.scenes);
  const concepts = uniqueConcepts(arc.scenes);
  const sceneCount = arc.scenes.length;

  return (
    <div className="bg-warm-white rounded-xl border border-warm-grey border-l-4 border-l-terracotta p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4">
      {/* Top row: title + status badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-bold text-primary tracking-tight leading-snug">
          {arc.subject} &mdash; {arc.module}
        </h3>
        <StatusBadge status={arc.status} />
      </div>

      {/* Scene count */}
      <div className="flex items-center gap-1.5 text-tertiary">
        <span className="material-symbols-outlined text-[16px]">movie</span>
        <span className="text-[12px] font-bold">
          {sceneCount} Scene{sceneCount === 1 ? '' : 's'}
        </span>
      </div>

      {/* Scene type breakdown pills */}
      {sceneCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <SceneTypePill type="bridge" count={counts.bridge} />
          <SceneTypePill type="deep" count={counts.deep} />
          <SceneTypePill type="side_event" count={counts.side_event} />
        </div>
      )}

      {/* Concept target tags */}
      {concepts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {concepts.map((concept) => (
            <span
              key={concept}
              className="text-[10px] bg-parchment text-tertiary px-2 py-0.5 rounded-full"
            >
              {concept}
            </span>
          ))}
        </div>
      )}

      {/* Footer: date + action */}
      <div className="flex items-center justify-between pt-2 mt-auto border-t border-warm-grey">
        <span className="text-[11px] text-tertiary/70 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          {relativeTime(arc.created_at)}
        </span>
        <Link
          href={`/arc/${arc.arc_id}`}
          className="text-[10px] font-extrabold text-terracotta uppercase tracking-[0.2em] hover:text-terracotta/80 transition-colors flex items-center gap-1"
        >
          View Details
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="bg-warm-white rounded-xl border border-warm-grey border-l-4 border-l-warm-grey p-6 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-5 bg-warm-grey rounded w-3/5" />
        <div className="h-5 w-16 bg-warm-grey rounded-full" />
      </div>
      <div className="h-4 bg-warm-grey rounded w-1/4" />
      <div className="flex gap-1.5">
        <div className="h-4 w-14 bg-warm-grey rounded-full" />
        <div className="h-4 w-14 bg-warm-grey rounded-full" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-4 w-20 bg-warm-grey rounded-full" />
        <div className="h-4 w-24 bg-warm-grey rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2 mt-auto border-t border-warm-grey">
        <div className="h-3 w-20 bg-warm-grey rounded" />
        <div className="h-3 w-16 bg-warm-grey rounded" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <span className="material-symbols-outlined text-7xl text-tertiary/20 mb-4">
        auto_stories
      </span>
      <p className="text-[15px] font-bold text-primary mb-2">
        No scenarios generated yet
      </p>
      <p className="text-[12px] text-tertiary max-w-xs">
        Create your first narrative arc to begin assessing students
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ScenariosTab({ classId }: ScenariosTabProps) {
  const { data: arcs, isLoading, error } = useArcs(classId);

  const arcCount = arcs?.length ?? 0;

  return (
    <section>
      {/* Arc count indicator */}
      {!isLoading && arcCount > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[10px] font-extrabold text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full">
            {arcCount} Arc{arcCount === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-warm-white rounded-xl border border-warm-grey p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-critical/40 mb-2 block">
            error
          </span>
          <p className="text-[13px] text-critical font-bold">
            Failed to load scenarios
          </p>
          <p className="text-[11px] text-tertiary mt-1">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Loaded state */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {arcCount === 0 ? (
            <EmptyState />
          ) : (
            arcs!.map((arc: Arc) => <ArcCard key={arc.arc_id} arc={arc} />)
          )}
        </div>
      )}
    </section>
  );
}
