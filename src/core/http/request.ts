import { badRequest } from '../errors/app-error';

export async function jsonBody<T>(request: Request): Promise<T> {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw badRequest('Content-Type must be application/json');
  try { return await request.json<T>(); } catch { throw badRequest('Invalid JSON body'); }
}

export function pageParams(url: URL) {
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

export function requiredString(value: unknown, field: string, max = 255): string {
  if (typeof value !== 'string' || !value.trim()) throw badRequest(`${field} is required`);
  if (value.trim().length > max) throw badRequest(`${field} must not exceed ${max} characters`);
  return value.trim();
}

export const optionalString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;
