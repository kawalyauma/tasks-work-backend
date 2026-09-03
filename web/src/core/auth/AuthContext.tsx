import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, post, session } from '../api/client';
import type { User } from '../api/types';

interface AuthValue { user: User | null; loading: boolean; login(email:string,password:string):Promise<void>; register(input:{name:string;organizationName:string;email:string;password:string}):Promise<void>; logout():Promise<void>; }
const AuthContext=createContext<AuthValue|null>(null);

export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<User|null>(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{ if(!session.get()){setLoading(false);return;} api<User>('/v1/auth/me').then(r=>setUser(r.data)).catch(()=>session.clear()).finally(()=>setLoading(false)); },[]);
  async function login(email:string,password:string){ const r=await post<{token:string;user:User}>('/v1/auth/login',{email,password}); session.set(r.data.token); setUser(r.data.user); }
  async function register(input:{name:string;organizationName:string;email:string;password:string}){ const r=await post<{token:string;user:User}>('/v1/auth/register',input); session.set(r.data.token); setUser({...r.data.user,role:'owner'}); }
  async function logout(){ try{await post('/v1/auth/logout');}finally{session.clear();setUser(null);} }
  return <AuthContext.Provider value={{user,loading,login,register,logout}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('AuthProvider missing');return value;}
