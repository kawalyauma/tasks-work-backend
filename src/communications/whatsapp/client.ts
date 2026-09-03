import type { Env } from '../../types';

async function hubRequest(env: Env, path: string, body: unknown, idempotencyKey?: string) {
  const headers: Record<string,string> = { 'X-API-Key': env.WHATSAPP_SUPPORT_APP_KEY, 'Content-Type': 'application/json' };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const response = await fetch(`${env.WHATSAPP_SUPPORT_HUB_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const payload: { success?: boolean; data?: Record<string,unknown>; error?: { message?: string } } = await response.json<{ success?: boolean; data?: Record<string,unknown>; error?: { message?: string } }>().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.error?.message || `WhatsApp Hub failed with HTTP ${response.status}`);
  return payload.data || {};
}

export async function sendWhatsApp(env: Env, phoneNumber: string, message: string, idempotencyKey: string, template?: { name: string; language?: string; variables?: Record<string,string> }) {
  if (template) return hubRequest(env, '/v1/integrations/templates/send', { phoneNumber, templateName: template.name, language: template.language || 'en', variables: template.variables || {} }, idempotencyKey);
  return hubRequest(env, '/v1/integrations/messages/send', { phoneNumber, type: 'text', message }, idempotencyKey);
}

export async function verifyWhatsAppSignature(rawBody: string, header: string | null, secret: string) {
  if (!header?.startsWith('sha256=') || !secret) return false;
  const received = header.slice(7);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('');
  if (received.length !== expected.length) return false;
  let mismatch = 0; for (let i=0;i<received.length;i++) mismatch |= received.charCodeAt(i)^expected.charCodeAt(i);
  return mismatch === 0;
}
