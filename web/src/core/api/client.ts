export interface ApiResponse<T> { success: boolean; data: T; meta?: { page: number; limit: number; total: number }; error?: { message: string }; }

const TOKEN_KEY = 'workdeck_session';
export const session = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

export async function api<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  const token = session.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(path, { ...init, headers });
  const payload = await response.json() as ApiResponse<T>;
  if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Request failed');
  return payload;
}

export const post = <T>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
export const patch = <T>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
