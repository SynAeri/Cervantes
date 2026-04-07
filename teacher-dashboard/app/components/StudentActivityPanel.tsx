// Student Activity Panel - wrapper component for integrating ActivityTimeline
// Shows student-specific activity timeline with reasoning traces and events

'use client';

import { ActivityTimeline, TimelineActivity } from './ActivityTimeline';
import { useActivityTimeline } from '../hooks/useActivityTimeline';

interface StudentActivityPanelProps {
  studentId: string;
  studentName?: string;
  className?: string;
  maxHeight?: string;
}

export function StudentActivityPanel({
  studentId,
  studentName,
  className = '',
  maxHeight = '600px'
}: StudentActivityPanelProps) {
  const { data: activities, isLoading, error } = useActivityTimeline({ studentId, limit: 50 });

  if (isLoading) {
    return (
      <div className={`bg-parchment rounded-xl border border-warm-grey p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-terracotta text-xl">
            timeline
          </span>
          <h3 className="text-[14px] font-extrabold uppercase tracking-widest text-primary">
            Activity Timeline
          </h3>
        </div>
        <div className="space-y-4">
          <div className="h-20 bg-warm-grey/30 rounded-lg animate-pulse"></div>
          <div className="h-20 bg-warm-grey/30 rounded-lg animate-pulse"></div>
          <div className="h-20 bg-warm-grey/30 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-parchment rounded-xl border border-warm-grey p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center py-8">
          <span className="material-symbols-outlined text-5xl text-critical/30 mb-3">
            error
          </span>
          <p className="text-[13px] font-semibold text-critical/80">
            Failed to load activity timeline
          </p>
          <p className="text-[11px] text-tertiary/60 mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ActivityTimeline
      activities={activities || []}
      maxHeight={maxHeight}
      className={className}
    />
  );
}
