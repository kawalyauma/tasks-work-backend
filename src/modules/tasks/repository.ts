import type { Env } from '../../types';

export async function nextTaskNumber(env: Env, organizationId: string): Promise<number> {
  await env.DB.prepare(`INSERT INTO organization_sequences (organization_id,sequence_name,current_value) VALUES (?,'task',1) ON CONFLICT(organization_id,sequence_name) DO UPDATE SET current_value=current_value+1`).bind(organizationId).run();
  const row = await env.DB.prepare(`SELECT current_value FROM organization_sequences WHERE organization_id=? AND sequence_name='task'`).bind(organizationId).first<{ current_value: number }>();
  return row!.current_value;
}

export async function findTask(env: Env, organizationId: string, taskId: string) {
  return env.DB.prepare(`SELECT t.*,p.name project_name,u.full_name created_by_name FROM tasks t LEFT JOIN projects p ON p.id=t.project_id LEFT JOIN users u ON u.id=t.created_by WHERE t.id=? AND t.organization_id=? AND t.archived_at IS NULL`).bind(taskId, organizationId).first();
}
