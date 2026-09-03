export interface User { id: string; email: string; phone?: string; full_name?: string; name?: string; role: string; organization_id?: string; organization_name?: string; }
export interface Project { id: string; code: string; name: string; description?: string; status: string; priority: string; progress: number; owner_name?: string; team_name?: string; task_count?: number; due_date?: string; }
export interface Task { id: string; task_number: number; title: string; description?: string; status: string; priority: string; project_id?: string; project_name?: string; due_at?: string; progress: number; assignees?: User[]; }
export interface Contact { id: string; name: string; kind: string; company_name?: string; email?: string; phone?: string; }
export interface Team { id: string; name: string; description?: string; lead_name?: string; member_count: number; }
export interface Notification { id: string; title: string; body: string; event_type: string; read_at?: string; created_at: string; }
