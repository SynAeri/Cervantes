// React Query hooks for class data fetching

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Class, ClassProgress } from '../lib/types';

export function useClasses() {
  return useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.class.getAll(),
  });
}

export function useClass(classId: string) {
  return useQuery<Class>({
    queryKey: ['class', classId],
    queryFn: () => api.class.getById(classId),
    enabled: !!classId,
  });
}

export function useClassProgress(classId: string) {
  return useQuery<ClassProgress>({
    queryKey: ['class-progress', classId],
    queryFn: () => api.class.getProgress(classId),
    enabled: !!classId,
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    staleTime: 5000,
  });
}
