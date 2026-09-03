import type { Router } from '../http/router';
import { jsonBody, requiredString } from '../http/request';
import { ok } from '../http/response';
import { badRequest, conflict, unauthorized } from '../errors/app-error';
import { hashPassword, sessionToken, sha256, verifyPassword } from './crypto';
import { id, now } from '../database/id';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function registerAuthRoutes(router: Router) {
  router.on('POST', '/v1/auth/register', async ({ request, env }) => {
    const body = await jsonBody<Record<string, unknown>>(request);
    const name = requiredString(body.name, 'name', 120);
    const organizationName = requiredString(body.organizationName, 'organizationName', 120);
    const email = requiredString(body.email, 'email', 190).toLowerCase();
    const password = requiredString(body.password, 'password', 200);
    if (!emailPattern.test(email)) throw badRequest('A valid email is required');
    if (password.length < 8) throw badRequest('Password must be at least 8 characters');
    if (await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()) throw conflict('An account with this email already exists');

    const userId = id('usr');
    const organizationId = id('org');
    const memberId = id('mem');
    const sessionId = id('ses');
    const token = sessionToken();
    const createdAt = now();
    const baseSlug = slugify(organizationName) || 'organization';
    const slug = `${baseSlug}-${organizationId.slice(-6)}`;
    await env.DB.batch([
      env.DB.prepare('INSERT INTO organizations (id,name,slug,created_at,updated_at) VALUES (?,?,?,?,?)').bind(organizationId, organizationName, slug, createdAt, createdAt),
      env.DB.prepare('INSERT INTO users (id,email,full_name,password_hash,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').bind(userId, email, name, await hashPassword(password), 'active', createdAt, createdAt),
      env.DB.prepare('INSERT INTO organization_members (id,organization_id,user_id,role,joined_at) VALUES (?,?,?,?,?)').bind(memberId, organizationId, userId, 'owner', createdAt),
      env.DB.prepare('INSERT INTO sessions (id,user_id,organization_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?,?)').bind(sessionId, userId, organizationId, await sha256(token), new Date(Date.now() + 30 * 86400000).toISOString(), createdAt),
    ]);
    return ok({ token, user: { id: userId, email, name }, organization: { id: organizationId, name: organizationName, slug } }, 201);
  }, false);

  router.on('POST', '/v1/auth/login', async ({ request, env }) => {
    const body = await jsonBody<Record<string, unknown>>(request);
    const email = requiredString(body.email, 'email').toLowerCase();
    const password = requiredString(body.password, 'password');
    const user = await env.DB.prepare('SELECT id,email,full_name,password_hash FROM users WHERE email = ? AND status = ?').bind(email, 'active').first<{ id: string; email: string; full_name: string; password_hash: string }>();
    if (!user || !(await verifyPassword(password, user.password_hash))) throw unauthorized('Invalid email or password');
    const membership = await env.DB.prepare(`SELECT om.organization_id,om.role,o.name FROM organization_members om JOIN organizations o ON o.id=om.organization_id WHERE om.user_id=? AND o.status='active' ORDER BY om.joined_at LIMIT 1`).bind(user.id).first<{ organization_id: string; role: string; name: string }>();
    if (!membership) throw unauthorized('No active organization membership');
    const token = sessionToken();
    await env.DB.prepare('INSERT INTO sessions (id,user_id,organization_id,token_hash,expires_at) VALUES (?,?,?,?,?)').bind(id('ses'), user.id, membership.organization_id, await sha256(token), new Date(Date.now() + 30 * 86400000).toISOString()).run();
    return ok({ token, user: { id: user.id, email: user.email, name: user.full_name, role: membership.role }, organization: { id: membership.organization_id, name: membership.name } });
  }, false);

  router.on('POST', '/v1/auth/logout', async ({ request, env }) => {
    const token = request.headers.get('authorization')?.slice(7);
    if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(token)).run();
    return ok({ loggedOut: true });
  });

  router.on('GET', '/v1/auth/me', async ({ user, env }) => {
    const profile = await env.DB.prepare(`SELECT u.id,u.email,u.phone,u.full_name,om.role,o.id organization_id,o.name organization_name,o.slug FROM users u JOIN organization_members om ON om.user_id=u.id JOIN organizations o ON o.id=om.organization_id WHERE u.id=? AND o.id=?`).bind(user!.id, user!.organizationId).first();
    return ok(profile);
  });
}
