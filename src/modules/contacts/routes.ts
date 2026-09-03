import type { Router } from '../../core/http/router';
import { id, now } from '../../core/database/id';
import { jsonBody, optionalString, requiredString } from '../../core/http/request';
import { ok } from '../../core/http/response';
import { notFound } from '../../core/errors/app-error';
import { listContacts } from './repository';

export function registerContactRoutes(router: Router) {
  router.on('GET', '/v1/contacts', async ({ env, user, url }) => {
    const result = await listContacts(env, user!.organizationId, url);
    return ok(result.rows, 200, result.meta);
  });
  router.on('POST', '/v1/contacts', async ({ request, env, user }) => {
    const body = await jsonBody<Record<string, unknown>>(request);
    const contact = { id: id('con'), organizationId: user!.organizationId, kind: body.kind === 'company' ? 'company' : 'person', name: requiredString(body.name, 'name'), email: optionalString(body.email), phone: optionalString(body.phone), companyName: optionalString(body.companyName), notes: optionalString(body.notes), createdAt: now() };
    await env.DB.prepare(`INSERT INTO contacts (id,organization_id,kind,name,email,phone,company_name,notes,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(contact.id, contact.organizationId, contact.kind, contact.name, contact.email, contact.phone, contact.companyName, contact.notes, user!.id, contact.createdAt, contact.createdAt).run();
    return ok(contact, 201);
  });
  router.on('GET', '/v1/contacts/:id', async ({ env, user, params }) => {
    const row = await env.DB.prepare('SELECT * FROM contacts WHERE id=? AND organization_id=? AND archived_at IS NULL').bind(params.id, user!.organizationId).first();
    if (!row) throw notFound('Contact not found');
    return ok(row);
  });
  router.on('DELETE', '/v1/contacts/:id', async ({ env, user, params }) => {
    const result = await env.DB.prepare('UPDATE contacts SET archived_at=?,updated_at=? WHERE id=? AND organization_id=? AND archived_at IS NULL').bind(now(), now(), params.id, user!.organizationId).run();
    if (!result.meta.changes) throw notFound('Contact not found');
    return ok({ archived: true });
  });
}
