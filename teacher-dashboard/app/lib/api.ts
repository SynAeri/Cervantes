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
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  const { timeout, ...fetchOptions } = options;
  const user = auth.currentUser;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: response.statusText
      }));
      throw new APIError(response.status, response.statusText, error.detail || 'Unknown error');
    }

    return response.json();
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - operation is still processing in the background');
    }
    throw error;
  }
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
    uploadRubric: async (classId: string, file: File) => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BASE_URL}/api/arc/upload-rubric?class_id=${classId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          detail: response.statusText
        }));
        throw new APIError(response.status, response.statusText, error.detail || 'Unknown error');
      }

      return response.json();
    },
    generate: (data: any) => apiFetch<any>('/api/arc/generate', {
      method: 'POST',
      body: JSON.stringify(data),
      timeout: 60000, // 60 second timeout for arc generation (multiple LLM calls)
    }),
    approve: (arcId: string) => apiFetch<any>(`/api/arc/${arcId}/approve`, {
      method: 'POST',
    }),
    publish: (arcId: string) => apiFetch<any>(`/api/arc/${arcId}/publish`, {
      method: 'POST',
      timeout: 120000, // 120 second timeout for publish (generates all scenes)
    }),
    delete: (arcId: string) => apiFetch<any>(`/api/arc/${arcId}`, {
      method: 'DELETE',
    }),
    update: (arcId: string, data: any) => apiFetch<any>(`/api/arc/${arcId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    generateScenes: (arcId: string) => apiFetch<any>(`/api/arc/${arcId}/generate-scenes`, {
      method: 'POST',
    }),
  },
  students: {
    getAll: () => apiFetch<any[]>('/api/students'),
    getById: (studentId: string) => apiFetch<any>(`/api/students/${studentId}`),
    getByClass: (classId: string) => apiFetch<any[]>(`/api/students/class/${classId}`),
    getRecentActivity: (limit: number = 10) => apiFetch<any[]>(`/api/students/recent-activity?limit=${limit}`),
  },
  student: {
    getReasoningTraces: (studentId: string) => apiFetch<any[]>(`/api/students/${studentId}/reasoning-traces`),
    getArcJournals: (studentId: string) => apiFetch<any[]>(`/api/students/${studentId}/arc-journals`),
  },
  signals: {
    extract: (traceId: string) => apiFetch<any>(`/api/signals/extract/${traceId}`, {
      method: 'POST',
    }),
  },
  characterPools: {
    generate: (arcId: string, numVariants: number = 2) => apiFetch<any>('/api/character-pools/generate', {
      method: 'POST',
      body: JSON.stringify({ arc_id: arcId, num_variants: numVariants }),
    }),
    assignStudent: (arcId: string, studentId: string) => apiFetch<any>(`/api/character-pools/assign/${arcId}/student/${studentId}`, {
      method: 'POST',
    }),
    getForArc: (arcId: string) => apiFetch<any>(`/api/character-pools/arc/${arcId}`),
  },
  scenes: {
    start: (studentId: string, arcId: string, sceneOrder: number) => apiFetch<any>(
      `/api/scene/progress/student/${studentId}/arc/${arcId}/scene/${sceneOrder}/start`,
      { method: 'POST' }
    ),
    complete: (studentId: string, arcId: string, sceneOrder: number) => apiFetch<any>(
      `/api/scene/progress/student/${studentId}/arc/${arcId}/scene/${sceneOrder}/complete`,
      { method: 'POST' }
    ),
    getStudentProgress: (studentId: string, arcId: string) => apiFetch<any>(
      `/api/scene/progress/student/${studentId}/arc/${arcId}`
    ),
    getClassProgress: (classId: string, arcId: string) => apiFetch<any>(
      `/api/scene/progress/class/${classId}/arc/${arcId}`
    ),
  },
  reasoningTraces: {
    getByStudent: (studentId: string) => apiFetch<any[]>(`/api/reasoning-trace/student/${studentId}`),
    getByStudentScene: (studentId: string, sceneId: string) => apiFetch<any[]>(`/api/reasoning-trace/student/${studentId}/scene/${sceneId}`),
    getById: (traceId: string) => apiFetch<any>(`/api/reasoning-trace/${traceId}`),
  },
  arcEndings: {
    getByStudent: (studentId: string, arcId: string) => apiFetch<any>(`/api/arc-endings/student/${studentId}/arc/${arcId}`),
    getById: (endingId: string) => apiFetch<any>(`/api/arc-endings/${endingId}`),
  },
};
