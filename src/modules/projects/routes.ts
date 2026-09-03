import type { Router } from '../../core/http/router';
import { id, now } from '../../core/database/id';
import { jsonBody, optionalString, pageParams, requiredString } from '../../core/http/request';
import { ok } from '../../core/http/response';
import { notFound } from '../../core/errors/app-error';

export function registerProjectRoutes(router: Router) {
  router.on('GET', '/v1/projects', async ({ env, user, url }) => {
    const { page, limit, offset } = pageParams(url);
    const status = url.searchParams.get('status');
    const search = `%${url.searchParams.get('search') || ''}%`;
    const rows = await env.DB.prepare(`SELECT p.*,u.full_name owner_name,t.name team_name,(SELECT COUNT(*) FROM tasks x WHERE x.project_id=p.id AND x.archived_at IS NULL) task_count FROM projects p LEFT JOIN users u ON u.id=p.owner_user_id LEFT JOIN teams t ON t.id=p.team_id WHERE p.organization_id=? AND p.archived_at IS NULL AND (? IS NULL OR p.status=?) AND (p.name LIKE ? OR p.code LIKE ?) ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`).bind(user!.organizationId, status, status, search, search, limit, offset).all();
    const count = await env.DB.prepare(`SELECT COUNT(*) total FROM projects WHERE organization_id=? AND archived_at IS NULL AND (? IS NULL OR status=?) AND (name LIKE ? OR code LIKE ?)`).bind(user!.organizationId, status, status, search, search).first<{ total: number }>();
    return ok(rows.results, 200, { page, limit, total: count?.total || 0 });
  });
  router.on('POST', '/v1/projects', async ({ request, env, user }) => {
    const body = await jsonBody<Record<string, unknown>>(request);
    const projectId = id('prj'); const createdAt = now();
    const project = { id: projectId, code: requiredString(body.code, 'code', 30).toUpperCase(), name: requiredString(body.name, 'name'), description: optionalString(body.description), teamId: optionalString(body.teamId), contactId: optionalString(body.contactId), ownerUserId: optionalString(body.ownerUserId) || user!.id, priority: ['low','medium','high','urgent'].includes(String(body.priority)) ? String(body.priority) : 'medium', startDate: optionalString(body.startDate), dueDate: optionalString(body.dueDate) };
    await env.DB.prepare(`INSERT INTO projects (id,organization_id,team_id,contact_id,code,name,description,priority,owner_user_id,start_date,due_date,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(project.id,user!.organizationId,project.teamId,project.contactId,project.code,project.name,project.description,project.priority,project.ownerUserId,project.startDate,project.dueDate,user!.id,createdAt,createdAt).run();
    return ok(project, 201);
  });
  router.on('GET', '/v1/projects/:id', async ({ env, user, params }) => {
    const row = await env.DB.prepare('SELECT * FROM projects WHERE id=? AND organization_id=? AND archived_at IS NULL').bind(params.id,user!.organizationId).first();
    if (!row) throw notFound('Project not found');
    return ok(row);
  });
}
