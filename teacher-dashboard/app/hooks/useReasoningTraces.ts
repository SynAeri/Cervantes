// React Query hooks for reasoning trace data

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ReasoningTrace } from '../lib/types';

export function useReasoningTraces(studentId: string) {
  return useQuery<ReasoningTrace[]>({
    queryKey: ['reasoning-traces', studentId],
    queryFn: () => api.student.getReasoningTraces(studentId),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
