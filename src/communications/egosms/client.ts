import type { Env } from '../../types';

export async function sendSms(env: Env, number: string, message: string) {
  const url = new URL(env.EGOSMS_API_URL || 'https://www.egosms.co/api/v1/plain/');
  url.searchParams.set('username', env.EGOSMS_USERNAME);
  url.searchParams.set('password', env.EGOSMS_PASSWORD);
  url.searchParams.set('number', number.replace(/^\+/, ''));
  url.searchParams.set('message', message);
  url.searchParams.set('sender', env.EGOSMS_SENDER_ID);
  const response = await fetch(url, { method: 'GET' });
  const result = await response.text();
  if (!response.ok || /error|failed|invalid/i.test(result)) throw new Error(`EgoSMS failed: ${result.slice(0, 300)}`);
  return result.trim();
}
