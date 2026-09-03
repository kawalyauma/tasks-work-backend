import type { Router } from '../../core/http/router';
import { badRequest, notFound } from '../../core/errors/app-error';
import { jsonBody, pageParams, requiredString } from '../../core/http/request';
import { ok } from '../../core/http/response';
import { createTask, updateTaskStatus } from './service';
import { findTask } from './repository';

const statuses = ['backlog','todo','in_progress','blocked','in_review','completed','cancelled'];
export function registerTaskRoutes(router: Router) {
  router.on('GET','/v1/tasks',async ({env,user,url})=>{
    const {page,limit,offset}=pageParams(url); const status=url.searchParams.get('status'); const projectId=url.searchParams.get('projectId'); const assigneeId=url.searchParams.get('assigneeId'); const search=`%${url.searchParams.get('search')||''}%`;
    const rows=await env.DB.prepare(`SELECT DISTINCT t.*,p.name project_name FROM tasks t LEFT JOIN projects p ON p.id=t.project_id LEFT JOIN task_assignees ta ON ta.task_id=t.id WHERE t.organization_id=? AND t.archived_at IS NULL AND (? IS NULL OR t.status=?) AND (? IS NULL OR t.project_id=?) AND (? IS NULL OR ta.user_id=?) AND (t.title LIKE ? OR t.description LIKE ?) ORDER BY CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,t.due_at IS NULL,t.due_at LIMIT ? OFFSET ?`).bind(user!.organizationId,status,status,projectId,projectId,assigneeId,assigneeId,search,search,limit,offset).all();
    const count=await env.DB.prepare(`SELECT COUNT(DISTINCT t.id) total FROM tasks t LEFT JOIN task_assignees ta ON ta.task_id=t.id WHERE t.organization_id=? AND t.archived_at IS NULL AND (? IS NULL OR t.status=?) AND (? IS NULL OR t.project_id=?) AND (? IS NULL OR ta.user_id=?) AND (t.title LIKE ? OR t.description LIKE ?)`).bind(user!.organizationId,status,status,projectId,projectId,assigneeId,assigneeId,search,search).first<{total:number}>();
    return ok(rows.results,200,{page,limit,total:count?.total||0});
  });
  router.on('POST','/v1/tasks',async ({request,env,user})=>{ const body=await jsonBody<Record<string,unknown>>(request); requiredString(body.title,'title'); return ok(await createTask(env,user!.organizationId,user!.id,body),201); });
  router.on('GET','/v1/tasks/:id',async ({env,user,params})=>{ const task=await findTask(env,user!.organizationId,params.id!); if(!task)throw notFound('Task not found'); const assignees=await env.DB.prepare(`SELECT u.id,u.full_name,u.email FROM task_assignees ta JOIN users u ON u.id=ta.user_id WHERE ta.task_id=?`).bind(params.id).all(); return ok({...task,assignees:assignees.results}); });
  router.on('PATCH','/v1/tasks/:id/status',async ({request,env,user,params})=>{ const body=await jsonBody<{status?:string}>(request); if(!body.status||!statuses.includes(body.status))throw badRequest('Invalid task status'); return ok(await updateTaskStatus(env,user!.organizationId,user!.id,params.id!,body.status)); });
}
