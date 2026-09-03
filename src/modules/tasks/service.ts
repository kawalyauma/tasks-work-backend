import type { Env } from '../../types';
import { id, now } from '../../core/database/id';
import { notFound } from '../../core/errors/app-error';
import { notify } from '../notifications/service';
import { findTask, nextTaskNumber } from './repository';

export async function createTask(env: Env, organizationId: string, actorId: string, input: Record<string, unknown>) {
  const taskId = id('tsk'); const createdAt = now(); const number = await nextTaskNumber(env, organizationId);
  const title = String(input.title || '').trim();
  await env.DB.prepare(`INSERT INTO tasks (id,organization_id,project_id,parent_task_id,task_number,title,description,status,priority,start_at,due_at,estimated_minutes,created_by,updated_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(taskId,organizationId,input.projectId || null,input.parentTaskId || null,number,title,input.description || null,input.status || 'todo',input.priority || 'medium',input.startAt || null,input.dueAt || null,input.estimatedMinutes || null,actorId,actorId,createdAt,createdAt).run();
  const assignees = Array.isArray(input.assigneeIds) ? [...new Set(input.assigneeIds.filter(x => typeof x === 'string'))] as string[] : [];
  for (const userId of assignees) {
    const member = await env.DB.prepare('SELECT 1 FROM organization_members WHERE organization_id=? AND user_id=?').bind(organizationId,userId).first();
    if (!member) continue;
    await env.DB.prepare('INSERT OR IGNORE INTO task_assignees (task_id,user_id,assigned_by) VALUES (?,?,?)').bind(taskId,userId,actorId).run();
    if (userId !== actorId) await notify(env,{ organizationId,userId,eventType:'task.assigned',title:'New task assigned',body:`You were assigned task #${number}: ${title}`,entityType:'task',entityId:taskId });
  }
  return findTask(env, organizationId, taskId);
}

export async function updateTaskStatus(env: Env, organizationId: string, actorId: string, taskId: string, status: string) {
  const progress = status === 'completed' ? 100 : undefined;
  const result = await env.DB.prepare(`UPDATE tasks SET status=?, progress=COALESCE(?,progress), completed_at=?, updated_by=?,updated_at=? WHERE id=? AND organization_id=? AND archived_at IS NULL`).bind(status,progress ?? null,status === 'completed' ? now() : null,actorId,now(),taskId,organizationId).run();
  if (!result.meta.changes) throw notFound('Task not found');
  return findTask(env,organizationId,taskId);
}
