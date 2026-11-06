import type { User } from '@/types/apiTypes';

export type AppRole = 'STUDENT' | 'ADMIN';

const ROLE_DASHBOARD_PATHS: Record<AppRole, string> = {
  ADMIN: '/admin/users',
  STUDENT: '/',
};

const normalizeRoleName = (roleName: string): AppRole | null => {
  const normalized = roleName.trim().toUpperCase();

  if (normalized === 'STUDENT' || normalized === 'ADMIN') {
    return normalized;
  }

  return null;
};

export const getUserRoles = (user: User | null): AppRole[] => {
  if (!user?.roles?.length) {
    return [];
  }

  return user.roles
    .map((role) => normalizeRoleName(role.name))
    .filter((role): role is AppRole => Boolean(role));
};

export const hasRole = (user: User | null, allowedRoles: AppRole[]) => {
  const userRoles = getUserRoles(user);
  return userRoles.some((role) => allowedRoles.includes(role));
};

export const getDefaultDashboardPath = (user: User | null) => {
  const roles = getUserRoles(user);

  if (roles.includes('ADMIN')) {
    return ROLE_DASHBOARD_PATHS.ADMIN;
  }

  return ROLE_DASHBOARD_PATHS.STUDENT;
};
