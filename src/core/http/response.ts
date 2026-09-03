import { AppError } from '../errors/app-error';

const headers = { 'content-type': 'application/json; charset=utf-8' };

export function ok(data: unknown, status = 200, meta?: unknown): Response {
  return new Response(JSON.stringify({ success: true, data, ...(meta ? { meta } : {}) }), { status, headers });
}

export function fail(error: unknown): Response {
  if (error instanceof AppError) {
    return new Response(JSON.stringify({ success: false, error: { code: error.code, message: error.message, details: error.details } }), { status: error.status, headers });
  }
  console.error(error);
  return new Response(JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }), { status: 500, headers });
}

export function cors(response: Response, origin: string | null): Response {
  const next = new Response(response.body, response);
  next.headers.set('Access-Control-Allow-Origin', origin || '*');
  next.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key');
  next.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  next.headers.set('Vary', 'Origin');
  return next;
}
