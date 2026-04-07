// Activity Timeline component
// Displays a vertical timeline of student activities, LLM judgements, and alerts

'use client';

import { useState } from 'react';

export interface TimelineActivity {
  id: string;
  type: 'scene_completed' | 'trace_evaluated' | 'arc_started' | 'arc_completed' | 'flag' | 'curricullm_note';
  timestamp: string;
  studentName?: string;
  studentId?: string;
  title: string;
  description: string;
  status?: 'mastery' | 'revised_with_scaffolding' | 'critical_gap' | 'info' | 'warning';
  metadata?: {
    sceneNumber?: number;
    sceneName?: string;
    concept?: string;
    misconception?: string;
    progress?: number;
  };
}

interface ActivityTimelineProps {
  activities: TimelineActivity[];
  maxHeight?: string;
  className?: string;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  mastery: {
    bg: 'bg-mastery/10',
    border: 'border-mastery',
    text: 'text-mastery',
    icon: 'check_circle'
  },
  revised_with_scaffolding: {
    bg: 'bg-misconception/10',
    border: 'border-misconception',
    text: 'text-misconception',
    icon: 'cached'
  },
  critical_gap: {
    bg: 'bg-critical/10',
    border: 'border-critical',
    text: 'text-critical',
    icon: 'error'
  },
  warning: {
    bg: 'bg-wheat-gold/10',
    border: 'border-wheat-gold',
    text: 'text-wheat-gold',
    icon: 'warning'
  },
  info: {
    bg: 'bg-terracotta/10',
    border: 'border-terracotta',
    text: 'text-terracotta',
    icon: 'info'
  }
};

const ACTIVITY_TYPE_INFO: Record<TimelineActivity['type'], { label: string; defaultIcon: string }> = {
  scene_completed: { label: 'Scene Completed', defaultIcon: 'task_alt' },
  trace_evaluated: { label: 'LLM Evaluation', defaultIcon: 'psychology' },
  arc_started: { label: 'Arc Started', defaultIcon: 'play_circle' },
  arc_completed: { label: 'Arc Completed', defaultIcon: 'celebration' },
  flag: { label: 'Flagged for Review', defaultIcon: 'flag' },
  curricullm_note: { label: 'CurricuLLM Note', defaultIcon: 'school' }
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TimelineNode({ activity, isLast }: { activity: TimelineActivity; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusColor = STATUS_COLORS[activity.status || 'info'];
  const activityInfo = ACTIVITY_TYPE_INFO[activity.type];
  const icon = statusColor.icon || activityInfo.defaultIcon;

  return (
    <div className="relative">
      {/* Vertical line connector */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 w-0.5 h-[calc(100%-2.5rem)] bg-warm-grey/30" />
      )}

      {/* Timeline entry */}
      <div className="flex gap-4 pb-6">
        {/* Node circle with icon */}
        <div className={`relative flex-shrink-0 w-10 h-10 rounded-full border-2 ${statusColor.border} ${statusColor.bg} flex items-center justify-center z-10`}>
          <span className={`material-symbols-outlined text-lg ${statusColor.text}`}>
            {icon}
          </span>
        </div>

        {/* Content card */}
        <div className="flex-1 min-w-0">
          <div
            className="bg-warm-white border border-warm-grey rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-tertiary/70">
                  {activityInfo.label}
                </p>
                <h4 className="text-[13px] font-bold text-primary truncate">
                  {activity.title}
                </h4>
              </div>
              <span className="text-[10px] text-tertiary/60 whitespace-nowrap">
                {formatTimestamp(activity.timestamp)}
              </span>
            </div>

            {/* Student info */}
            {activity.studentName && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 bg-terracotta/10 rounded-full flex items-center justify-center text-terracotta font-bold text-[8px]">
                  {activity.studentName.charAt(0)}
                </div>
                <span className="text-[11px] text-body">
                  {activity.studentName}
                </span>
              </div>
            )}

            {/* Description */}
            <p className={`text-[12px] text-body leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
              {activity.description}
            </p>

            {/* Metadata (expanded) */}
            {isExpanded && activity.metadata && (
              <div className="mt-3 pt-3 border-t border-warm-grey/50 space-y-1">
                {activity.metadata.sceneNumber !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary/70">Scene:</span>
                    <span className="text-[11px] text-body">{activity.metadata.sceneNumber}</span>
                  </div>
                )}
                {activity.metadata.concept && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary/70">Concept:</span>
                    <span className="text-[11px] text-body">{activity.metadata.concept}</span>
                  </div>
                )}
                {activity.metadata.misconception && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary/70">Misconception:</span>
                    <span className="text-[11px] text-body">{activity.metadata.misconception}</span>
                  </div>
                )}
                {activity.metadata.progress !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary/70">Progress:</span>
                    <div className="flex-1 h-1.5 bg-warm-grey/30 rounded-full overflow-hidden max-w-[80px]">
                      <div
                        className="h-full bg-terracotta transition-all"
                        style={{ width: `${activity.metadata.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-body">{activity.metadata.progress}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Expand indicator */}
            <div className="mt-2 flex justify-center">
              <span className={`material-symbols-outlined text-tertiary/40 text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActivityTimeline({ activities, maxHeight = '500px', className = '' }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <span className="material-symbols-outlined text-5xl text-tertiary/20 mb-3">
          timeline
        </span>
        <p className="text-[13px] font-semibold text-tertiary/60">
          No activity yet
        </p>
        <p className="text-[11px] text-tertiary/40 mt-1">
          Student activities will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-parchment rounded-xl border border-warm-grey ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-warm-grey">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-terracotta text-xl">
            timeline
          </span>
          <h3 className="text-[14px] font-extrabold uppercase tracking-widest text-primary">
            Activity Timeline
          </h3>
          <span className="ml-auto text-[11px] font-bold text-tertiary/60">
            {activities.length} {activities.length === 1 ? 'event' : 'events'}
          </span>
        </div>
      </div>

      {/* Scrollable timeline */}
      <div
        className="px-6 py-4 overflow-y-auto"
        style={{ maxHeight }}
      >
        {activities.map((activity, index) => (
          <TimelineNode
            key={activity.id}
            activity={activity}
            isLast={index === activities.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
