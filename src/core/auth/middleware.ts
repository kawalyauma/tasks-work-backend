import type { AuthUser, Env } from '../../types';
import { unauthorized } from '../errors/app-error';
import { sha256 } from './crypto';

export async function authenticate(request: Request, env: Env): Promise<AuthUser> {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw unauthorized();
  const hash = await sha256(header.slice(7));
  const row = await env.DB.prepare(`
    SELECT u.id, u.email, om.organization_id, om.role
    FROM sessions s
    JOIN users u ON u.id = s.user_id AND u.status = 'active'
    JOIN organization_members om ON om.user_id = u.id AND om.organization_id = s.organization_id
    JOIN organizations o ON o.id = s.organization_id AND o.status = 'active'
    WHERE s.token_hash = ? AND s.expires_at > datetime('now')
  `).bind(hash).first<{ id: string; email: string; organization_id: string; role: string }>();
  if (!row) throw unauthorized('Session is invalid or expired');
  return { id: row.id, email: row.email, organizationId: row.organization_id, role: row.role };
}
