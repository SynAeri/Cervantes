// React Query hooks for arc data fetching

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Arc } from '../lib/types';

export function useArcs(classId: string) {
  return useQuery<Arc[]>({
    queryKey: ['arcs', classId],
    queryFn: () => api.arc.getByClass(classId),
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useArc(arcId: string) {
  return useQuery<Arc>({
    queryKey: ['arc', arcId],
    queryFn: () => api.arc.getById(arcId),
    enabled: !!arcId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
