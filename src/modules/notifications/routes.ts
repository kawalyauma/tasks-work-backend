import type { Router } from '../../core/http/router';
import { ok } from '../../core/http/response';
import { pageParams } from '../../core/http/request';
import { notFound } from '../../core/errors/app-error';

export function registerNotificationRoutes(router: Router) {
  router.on('GET','/v1/notifications',async ({env,user,url})=>{ const {page,limit,offset}=pageParams(url); const unread=url.searchParams.get('unread')==='true'; const rows=await env.DB.prepare(`SELECT * FROM notifications WHERE organization_id=? AND user_id=? AND (?=0 OR read_at IS NULL) ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(user!.organizationId,user!.id,unread?1:0,limit,offset).all(); const count=await env.DB.prepare(`SELECT COUNT(*) total FROM notifications WHERE organization_id=? AND user_id=? AND (?=0 OR read_at IS NULL)`).bind(user!.organizationId,user!.id,unread?1:0).first<{total:number}>(); return ok(rows.results,200,{page,limit,total:count?.total||0}); });
  router.on('POST','/v1/notifications/:id/read',async ({env,user,params})=>{ const result=await env.DB.prepare(`UPDATE notifications SET read_at=COALESCE(read_at,datetime('now')) WHERE id=? AND organization_id=? AND user_id=?`).bind(params.id,user!.organizationId,user!.id).run(); if(!result.meta.changes)throw notFound('Notification not found'); return ok({read:true}); });
  router.on('POST','/v1/notifications/read-all',async ({env,user})=>{ const result=await env.DB.prepare(`UPDATE notifications SET read_at=datetime('now') WHERE organization_id=? AND user_id=? AND read_at IS NULL`).bind(user!.organizationId,user!.id).run(); return ok({updated:result.meta.changes}); });
}
