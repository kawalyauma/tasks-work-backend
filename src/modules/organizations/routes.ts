import type { Router } from '../../core/http/router';
import { jsonBody, requiredString } from '../../core/http/request';
import { ok } from '../../core/http/response';
import { requireRole } from '../../core/permissions/roles';
import { id } from '../../core/database/id';

export function registerOrganizationRoutes(router: Router) {
  router.on('GET','/v1/organization',async ({env,user})=>ok(await env.DB.prepare('SELECT id,name,slug,timezone,status,settings_json,created_at FROM organizations WHERE id=?').bind(user!.organizationId).first()));
  router.on('GET','/v1/members',async ({env,user})=>{ const rows=await env.DB.prepare(`SELECT u.id,u.full_name,u.email,u.phone,u.status,om.role,om.job_title,om.joined_at FROM organization_members om JOIN users u ON u.id=om.user_id WHERE om.organization_id=? ORDER BY u.full_name`).bind(user!.organizationId).all(); return ok(rows.results); });
  router.on('POST','/v1/teams',async ({request,env,user})=>{ requireRole(user,'manager'); const body=await jsonBody<Record<string,unknown>>(request); const teamId=id('tem'); await env.DB.prepare('INSERT INTO teams (id,organization_id,name,description,lead_user_id) VALUES (?,?,?,?,?)').bind(teamId,user!.organizationId,requiredString(body.name,'name'),typeof body.description==='string'?body.description:null,typeof body.leadUserId==='string'?body.leadUserId:null).run(); return ok({id:teamId,name:body.name},201); });
  router.on('GET','/v1/teams',async ({env,user})=>{ const rows=await env.DB.prepare(`SELECT t.*,u.full_name lead_name,(SELECT COUNT(*) FROM team_members tm WHERE tm.team_id=t.id) member_count FROM teams t LEFT JOIN users u ON u.id=t.lead_user_id WHERE t.organization_id=? AND t.status='active' ORDER BY t.name`).bind(user!.organizationId).all(); return ok(rows.results); });
}
