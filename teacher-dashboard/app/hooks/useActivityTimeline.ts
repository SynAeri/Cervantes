// Hook for fetching and formatting activity timeline data
// Aggregates reasoning traces, scene completions, and system events

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { TimelineActivity } from '../components/ActivityTimeline';
import type { ReasoningTrace } from '../lib/types';

interface UseActivityTimelineOptions {
  studentId?: string;
  classId?: string;
  limit?: number;
}

function formatReasoningTraceToActivity(trace: ReasoningTrace): TimelineActivity {
  const statusMap: Record<string, TimelineActivity['status']> = {
    'mastery': 'mastery',
    'revised_with_scaffolding': 'revised_with_scaffolding',
    'critical_gap': 'critical_gap'
  };

  const status = statusMap[trace.status] || 'info';

  let description = '';
  if (trace.status === 'mastery') {
    description = 'Student demonstrated deep understanding and transfer of concepts without scaffolding.';
  } else if (trace.status === 'revised_with_scaffolding') {
    description = 'Student revised their reasoning with AI guidance and reached understanding.';
  } else if (trace.status === 'critical_gap') {
    description = 'Student struggled to grasp core concepts. Requires teacher intervention.';
  }

  return {
    id: trace.trace_id,
    type: 'trace_evaluated',
    timestamp: trace.created_at,
    title: `Scene ${trace.scene_id} Evaluation`,
    description,
    status,
    metadata: {
      sceneNumber: parseInt(trace.scene_id.replace(/\D/g, '')) || undefined,
    }
  };
}

export function useActivityTimeline({ studentId, classId, limit = 50 }: UseActivityTimelineOptions = {}) {
  return useQuery({
    queryKey: ['activity-timeline', studentId, classId, limit],
    queryFn: async () => {
      const activities: TimelineActivity[] = [];

      // Fetch reasoning traces for student
      if (studentId) {
        try {
          const traces = await api.reasoningTraces.getByStudent(studentId);

          // Convert traces to timeline activities
          const traceActivities = traces
            .filter((trace: ReasoningTrace) => trace.status) // Only include evaluated traces
            .map(formatReasoningTraceToActivity);

          activities.push(...traceActivities);
        } catch (error) {
          console.error('Failed to fetch reasoning traces:', error);
        }
      }

      // Sort by timestamp descending (most recent first)
      activities.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Limit results
      return activities.slice(0, limit);
    },
    enabled: !!studentId || !!classId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for real-time updates
  });
}

// Hook for class-wide timeline (aggregates all students)
export function useClassActivityTimeline(classId: string, limit: number = 50) {
  return useQuery({
    queryKey: ['class-activity-timeline', classId, limit],
    queryFn: async () => {
      const activities: TimelineActivity[] = [];

      // TODO: Implement class-wide activity aggregation
      // This would require a backend endpoint that fetches all student traces for a class
      // For now, return empty array

      return activities;
    },
    enabled: !!classId,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}
