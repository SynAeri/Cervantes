// React Query hooks for journal and reasoning traces

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useJournal(studentId: string) {
  return useQuery({
    queryKey: ['journal', studentId],
    queryFn: () => api.journal.getByStudent(studentId),
    enabled: !!studentId,
  });
}

export function useSaveReasoningTrace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.reasoningTrace.save(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journal', variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ['reasoning-traces'] });
    },
  });
}
