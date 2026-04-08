// Type-safe API client for student dashboard

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public detail: string
  ) {
    super(typeof detail === 'string' ? detail : JSON.stringify(detail));
    this.name = 'APIError';
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: response.statusText
    }));

    // Extract detail as string
    let detail = 'Unknown error';
    if (typeof error.detail === 'string') {
      detail = error.detail;
    } else if (error.message) {
      detail = error.message;
    } else if (typeof error === 'string') {
      detail = error;
    } else {
      detail = response.statusText || 'Request failed';
    }

    throw new APIError(response.status, response.statusText, detail);
  }

  return response.json();
}

export const api = {
  arc: {
    validateArcId: (arcId: string) =>
      apiFetch<{ exists: boolean; status?: string }>(`/api/arc/${arcId}`),
    checkStudentAccess: (arcId: string, studentId: string) =>
      apiFetch<any>(`/api/arc/${arcId}/check-student-access`, {
        method: 'POST',
        body: JSON.stringify({ student_id: studentId }),
      }),
  },
  scene: {
    getByOrder: (arcId: string, sceneOrder: number, studentId?: string) => {
      const params = new URLSearchParams();
      if (studentId) params.set('student_id', studentId);
      const query = params.toString() ? `?${params.toString()}` : '';
      return apiFetch<any>(`/api/scene/${arcId}/${sceneOrder}${query}`);
    },
    markStarted: (arcId: string, sceneOrder: number, studentId: string) => {
      // Normalize student_id (remove student_ prefix if present, backend will add it)
      const normalizedId = studentId.replace('student_', '');
      return apiFetch<any>(`/api/scene/progress/student/${normalizedId}/arc/${arcId}/scene/${sceneOrder}/start`, {
        method: 'POST',
      });
    },
    markCompleted: (arcId: string, sceneOrder: number, studentId: string) => {
      const normalizedId = studentId.replace('student_', '');
      return apiFetch<any>(`/api/scene/progress/student/${normalizedId}/arc/${arcId}/scene/${sceneOrder}/complete`, {
        method: 'POST',
      });
    },
  },
  dialogue: {
    submitTurn: (data: any) => apiFetch<any>('/api/dialogue/turn', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  reasoningTrace: {
    save: (data: any) => apiFetch<any>('/api/reasoning-trace', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  arcJournal: {
    get: (studentId: string, arcId: string) =>
      apiFetch<any>(`/api/arc-journal/${studentId}/${arcId}`),
    append: (data: {
      student_id: string;
      arc_id: string;
      scene_id: string;
      scene_order: number;
      new_entries: any[];
    }) => apiFetch<any>('/api/arc-journal/append', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    markComplete: (studentId: string, arcId: string) =>
      apiFetch<any>(`/api/arc-journal/${studentId}/${arcId}/complete`, {
        method: 'POST',
      }),
  },
  journal: {
    getByStudent: (studentId: string) => apiFetch<any[]>(`/api/student/${studentId}/journal`),
  },
  characterMappings: {
    get: (studentId: string, arcId: string) =>
      apiFetch<any>(`/api/character-mappings/${studentId}/${arcId}`),
  },
};
