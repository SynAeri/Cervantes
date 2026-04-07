// React Query hooks for student data
// Connects to: /api/students backend endpoints

'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from '../lib/api';

interface StudentEnrollment {
  class_id: string;
  class_name: string;
  enrolled_at: string;
}

interface Student {
  student_id: string;
  uid: string;
  full_name: string;
  email: string;
  enrollments: StudentEnrollment[];
}

interface StudentDetailEnrollment extends StudentEnrollment {
  extracurriculars: string[];
  subjects: string[];
}

interface StudentDetail {
  student_id: string;
  uid: string;
  full_name: string;
  email: string;
  enrollments: StudentDetailEnrollment[];
}

interface StudentProgress {
  student_id: string;
  student_name: string;
  email: string;
  progress: number;
  dimensions: Record<string, number>;
  arc_status: 'complete' | 'in_progress' | 'flagged' | 'not_started';
  scenes_completed: number;
  total_scenes: number;
  last_active: string;
  enrollment: {
    enrolled_at: string;
    extracurriculars: string[];
    subjects: string[];
  };
}

export function useStudents(): UseQueryResult<Student[], Error> {
  return useQuery({
    queryKey: ['students'],
    queryFn: () => api.students.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useStudent(studentId: string | null): UseQueryResult<StudentDetail, Error> {
  return useQuery({
    queryKey: ['students', studentId],
    queryFn: () => api.students.getById(studentId!),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClassStudents(classId: string | null): UseQueryResult<StudentProgress[], Error> {
  return useQuery({
    queryKey: ['students', 'class', classId],
    queryFn: () => api.students.getByClass(classId!),
    enabled: !!classId,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for progress data)
  });
}

interface SceneAssignment {
  scene_order: number;
  status: 'not_started' | 'started' | 'completed';
  started_at?: string;
  completed_at?: string;
  assigned_variant?: string;
}

interface ClassProgressData {
  class_id: string;
  arc_id: string;
  total_students: number;
  students: Array<{
    student_id: string;
    assignments: SceneAssignment[];
  }>;
}

export function useClassArcProgress(classId: string | null, arcId: string | null): UseQueryResult<ClassProgressData, Error> {
  return useQuery({
    queryKey: ['scene-progress', 'class', classId, 'arc', arcId],
    queryFn: () => api.scenes.getClassProgress(classId!, arcId!),
    enabled: !!classId && !!arcId,
    refetchInterval: 10000, // Poll every 10 seconds for real-time updates
    staleTime: 0, // Always consider data stale to enable refetching
  });
}
