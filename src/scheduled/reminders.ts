import type { Env } from '../types';
import { id } from '../core/database/id';
import { notify } from '../modules/notifications/service';

export async function runReminders(env: Env) {
  const rows = await env.DB.prepare(`SELECT t.id,t.organization_id,t.task_number,t.title,t.due_at,ta.user_id FROM tasks t JOIN task_assignees ta ON ta.task_id=t.id WHERE t.archived_at IS NULL AND t.status NOT IN ('completed','cancelled') AND t.due_at IS NOT NULL AND datetime(t.due_at) <= datetime('now','+24 hours') AND datetime(t.due_at) > datetime('now','-7 days')`).all<{id:string;organization_id:string;task_number:number;title:string;due_at:string;user_id:string}>();
  for (const task of rows.results) {
    const type = new Date(task.due_at).getTime() < Date.now() ? 'overdue' : 'due_soon';
    const key = `${task.id}:${task.user_id}:${type}:${new Date().toISOString().slice(0,10)}`;
    const inserted = await env.DB.prepare(`INSERT OR IGNORE INTO task_reminders (id,organization_id,task_id,user_id,reminder_type,reminder_key) VALUES (?,?,?,?,?,?)`).bind(id('rem'),task.organization_id,task.id,task.user_id,type,key).run();
    if (inserted.meta.changes) await notify(env,{organizationId:task.organization_id,userId:task.user_id,eventType:`task.${type}`,title:type==='overdue'?'Task overdue':'Task due soon',body:`Task #${task.task_number}: ${task.title}`,entityType:'task',entityId:task.id});
  }
}
