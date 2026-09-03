import type { Env } from '../../types';

export async function sendEmail(env: Env, to: string, subject: string, text: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.RESEND_FROM_EMAIL, to: [to], subject, text }),
  });
  const payload: Record<string, unknown> = await response.json<Record<string, unknown>>().catch(() => ({} as Record<string, unknown>));
  if (!response.ok) throw new Error(String(payload.message || `Resend failed with HTTP ${response.status}`));
  return String(payload.id || '');
}
