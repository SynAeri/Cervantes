// Type-safe API client with Firebase Auth integration
// Handles authentication, error handling, and request formatting

import { auth } from '../../lib/firebase';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public detail: string
  ) {
    super(detail);
    this.name = 'APIError';
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const user = auth.currentUser;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: response.statusText
    }));
    throw new APIError(response.status, response.statusText, error.detail || 'Unknown error');
  }

  return response.json();
}

export const api = {
  class: {
    getAll: () => apiFetch<any[]>('/api/class'),
    getById: (classId: string) => apiFetch<any>(`/api/class/${classId}`),
    getProgress: (classId: string) => apiFetch<any>(`/api/class/${classId}/progress`),
  },
  arc: {
    getByClass: (classId: string) => apiFetch<any[]>(`/api/arc/class/${classId}`),
    getById: (arcId: string) => apiFetch<any>(`/api/arc/${arcId}`),
    uploadRubric: (classId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiFetch<any>(`/api/arc/upload-rubric?class_id=${classId}`, {
        method: 'POST',
        headers: {},
        body: formData,
      });
    },
    generate: (data: any) => apiFetch<any>('/api/arc/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    approve: (arcId: string) => apiFetch<any>(`/api/arc/${arcId}/approve`, {
      method: 'POST',
    }),
    publish: (arcId: string) => apiFetch<any>(`/api/arc/${arcId}/publish`, {
      method: 'POST',
    }),
  },
  students: {
    getAll: () => apiFetch<any[]>('/api/students'),
    getById: (studentId: string) => apiFetch<any>(`/api/students/${studentId}`),
    getByClass: (classId: string) => apiFetch<any[]>(`/api/students/class/${classId}`),
  },
  student: {
    getReasoningTraces: (studentId: string) => apiFetch<any[]>(`/api/student/${studentId}/reasoning-traces`),
  },
  signals: {
    extract: (traceId: string) => apiFetch<any>(`/api/signals/extract/${traceId}`, {
      method: 'POST',
    }),
  },
};
