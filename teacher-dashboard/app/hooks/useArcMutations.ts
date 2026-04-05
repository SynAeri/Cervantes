// React Query mutations for arc operations

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useUploadRubric() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, file }: { classId: string; file: File }) =>
      api.arc.uploadRubric(classId, file),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['arcs', variables.classId] });
    },
  });
}

export function useGenerateArc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.arc.generate(data),
    onSuccess: (newArc) => {
      queryClient.invalidateQueries({ queryKey: ['arcs'] });
      if (newArc.arc_id) {
        queryClient.setQueryData(['arc', newArc.arc_id], newArc);
      }
    },
  });
}

export function useApproveArc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (arcId: string) => api.arc.approve(arcId),
    onSuccess: (data, arcId) => {
      queryClient.invalidateQueries({ queryKey: ['arc', arcId] });
      queryClient.invalidateQueries({ queryKey: ['arcs'] });
    },
  });
}

export function usePublishArc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (arcId: string) => api.arc.publish(arcId),
    onSuccess: (data, arcId) => {
      queryClient.invalidateQueries({ queryKey: ['arc', arcId] });
      queryClient.invalidateQueries({ queryKey: ['arcs'] });
      queryClient.invalidateQueries({ queryKey: ['student-arcs'] });
    },
  });
}
