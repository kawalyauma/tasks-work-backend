import type { Env } from '../../types';
import { pageParams } from '../../core/http/request';

export async function listContacts(env: Env, organizationId: string, url: URL) {
  const { page, limit, offset } = pageParams(url);
  const search = `%${url.searchParams.get('search') || ''}%`;
  const [rows, count] = await Promise.all([
    env.DB.prepare(`SELECT * FROM contacts WHERE organization_id=? AND archived_at IS NULL AND (name LIKE ? OR email LIKE ? OR phone LIKE ?) ORDER BY name LIMIT ? OFFSET ?`).bind(organizationId, search, search, search, limit, offset).all(),
    env.DB.prepare(`SELECT COUNT(*) total FROM contacts WHERE organization_id=? AND archived_at IS NULL AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`).bind(organizationId, search, search, search).first<{ total: number }>(),
  ]);
  return { rows: rows.results, meta: { page, limit, total: count?.total || 0 } };
}
