// Type-safe API client for student dashboard

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
    throw new APIError(response.status, response.statusText, error.detail || 'Unknown error');
  }

  return response.json();
}

export const api = {
  scene: {
    getById: (sceneId: string) => apiFetch<any>(`/api/scene/${sceneId}`),
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
  journal: {
    getByStudent: (studentId: string) => apiFetch<any[]>(`/api/student/${studentId}/journal`),
  },
};
