import type { AuthUser } from '../../types';
import { forbidden } from '../errors/app-error';

const rank: Record<string, number> = { viewer: 1, member: 2, manager: 3, admin: 4, owner: 5 };
export function requireRole(user: AuthUser | undefined, minimum: keyof typeof rank): AuthUser {
  if (!user || (rank[user.role] || 0) < rank[minimum]!) throw forbidden();
  return user;
}
