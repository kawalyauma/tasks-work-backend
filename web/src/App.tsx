import { useEffect,useState } from 'react';
import { api } from './core/api/client';
import type { Notification } from './core/api/types';
import { AuthProvider,useAuth } from './core/auth/AuthContext';
import { AuthPage } from './core/auth/AuthPage';
import { AppShell,type Section } from './core/components/AppShell';
import { Spinner } from './core/components/ui';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { TasksPage } from './modules/tasks/TasksPage';
import { ProjectsPage } from './modules/projects/ProjectsPage';
import { ContactsPage } from './modules/contacts/ContactsPage';
import { TeamsPage } from './modules/teams/TeamsPage';
import { NotificationsPage } from './modules/notifications/NotificationsPage';

function Workspace(){const {user,loading}=useAuth();const [section,setSection]=useState<Section>('dashboard');const [createSignal,setCreateSignal]=useState(0);const [unread,setUnread]=useState(0);const refreshUnread=()=>api<Notification[]>('/v1/notifications?limit=1&unread=true').then(r=>setUnread(r.meta?.total||r.data.length)).catch(()=>{});useEffect(()=>{if(user)refreshUnread()},[user]);if(loading)return <div className="boot"><Spinner/></div>;if(!user)return <AuthPage/>;const newTask=()=>{setSection('tasks');setCreateSignal(v=>v+1)};return <AppShell section={section} onSection={setSection} unread={unread}>{section==='dashboard'&&<DashboardPage onNewTask={newTask} onViewTasks={()=>setSection('tasks')}/>} {section==='tasks'&&<TasksPage forceCreate={createSignal}/>} {section==='projects'&&<ProjectsPage/>} {section==='contacts'&&<ContactsPage/>} {section==='teams'&&<TeamsPage/>} {section==='notifications'&&<NotificationsPage onRead={refreshUnread}/>}</AppShell>}
export default function App(){return <AuthProvider><Workspace/></AuthProvider>}
