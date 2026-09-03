import type { Router } from '../../core/http/router';
import { id } from '../../core/database/id';
import { jsonBody, requiredString } from '../../core/http/request';
import { ok } from '../../core/http/response';
import { notFound } from '../../core/errors/app-error';
import { findTask } from '../tasks/repository';
import { notify } from '../notifications/service';

export function registerCommentRoutes(router: Router) {
  router.on('GET','/v1/tasks/:id/comments',async ({env,user,params})=>{ if(!await findTask(env,user!.organizationId,params.id!))throw notFound('Task not found'); const rows=await env.DB.prepare(`SELECT c.*,u.full_name author_name FROM comments c JOIN users u ON u.id=c.author_user_id WHERE c.task_id=? AND c.organization_id=? AND c.deleted_at IS NULL ORDER BY c.created_at`).bind(params.id,user!.organizationId).all(); return ok(rows.results); });
  router.on('POST','/v1/tasks/:id/comments',async ({request,env,user,params})=>{ const task=await findTask(env,user!.organizationId,params.id!) as Record<string,unknown>|null; if(!task)throw notFound('Task not found'); const body=await jsonBody<Record<string,unknown>>(request); const text=requiredString(body.body,'body',10000); const mentions=Array.isArray(body.mentionUserIds)?body.mentionUserIds.filter(x=>typeof x==='string') as string[]:[]; const commentId=id('cmt'); await env.DB.prepare(`INSERT INTO comments (id,organization_id,task_id,author_user_id,body,mentions_json) VALUES (?,?,?,?,?,?)`).bind(commentId,user!.organizationId,params.id,user!.id,text,JSON.stringify(mentions)).run(); for(const mentionedId of new Set(mentions)){ if(mentionedId!==user!.id)await notify(env,{organizationId:user!.organizationId,userId:mentionedId,eventType:'comment.mentioned',title:'You were mentioned',body:`You were mentioned on task #${task.task_number}: ${task.title}`,entityType:'task',entityId:params.id}); } return ok({id:commentId,body:text},201); });
}
