'use client';

import { useAuth } from './useAuth';
import { UserRole } from '@/types/auth';

export type Permission =
  // Super Admin permissions
  | 'view:tenants'
  | 'create:tenants'
  | 'edit:tenants'
  | 'delete:tenants'
  | 'view:plans'
  | 'create:plans'
  | 'edit:plans'
  | 'delete:plans'
  // Admin permissions
  | 'view:users'
  | 'create:users'
  | 'edit:users'
  | 'delete:users'
  | 'view:projects'
  | 'create:projects'
  | 'edit:projects'
  | 'delete:projects'
  | 'view:sites'
  | 'create:sites'
  | 'edit:sites'
  | 'delete:sites'
  | 'view:meters'
  | 'create:meters'
  | 'edit:meters'
  | 'delete:meters'
  | 'view:quotes'
  | 'create:quotes'
  | 'edit:quotes'
  | 'delete:quotes'
  | 'view:invoices'
  | 'create:invoices'
  | 'edit:invoices'
  | 'delete:invoices'
  | 'view:planning'
  | 'edit:planning'
  | 'view:accounting'
  | 'edit:accounting';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    'view:tenants',
    'create:tenants',
    'edit:tenants',
    'delete:tenants',
    'view:plans',
    'create:plans',
    'edit:plans',
    'delete:plans',
  ],
  [UserRole.ADMIN]: [
    'view:users',
    'create:users',
    'edit:users',
    'delete:users',
    'view:projects',
    'create:projects',
    'edit:projects',
    'delete:projects',
    'view:sites',
    'create:sites',
    'edit:sites',
    'delete:sites',
    'view:meters',
    'create:meters',
    'edit:meters',
    'delete:meters',
    'view:quotes',
    'create:quotes',
    'edit:quotes',
    'delete:quotes',
    'view:invoices',
    'create:invoices',
    'edit:invoices',
    'delete:invoices',
    'view:planning',
    'edit:planning',
    'view:accounting',
    'edit:accounting',
  ],
  [UserRole.PROJECT_MANAGER]: [
    'view:users',
    'view:projects',
    'create:projects',
    'edit:projects',
    'delete:projects',
    'view:sites',
    'create:sites',
    'edit:sites',
    'view:meters',
    'create:meters',
    'edit:meters',
    'view:quotes',
    'create:quotes',
    'edit:quotes',
    'view:invoices',
    'view:planning',
    'edit:planning',
  ],
  [UserRole.ACCOUNTANT]: [
    'view:projects',
    'view:sites',
    'view:meters',
    'view:quotes',
    'create:quotes',
    'edit:quotes',
    'view:invoices',
    'create:invoices',
    'edit:invoices',
    'view:accounting',
    'edit:accounting',
  ],
  [UserRole.SUPERVISOR]: [
    'view:users',
    'view:projects',
    'view:sites',
    'edit:sites',
    'view:meters',
    'view:quotes',
    'view:invoices',
    'view:planning',
    'edit:planning',
  ],
  [UserRole.ARCHITECT]: [
    'view:projects',
    'edit:projects',
    'view:sites',
    'create:sites',
    'edit:sites',
    'view:meters',
    'create:meters',
    'edit:meters',
    'view:quotes',
    'view:planning',
  ],
  [UserRole.TECHNICIAN]: [
    'view:projects',
    'view:sites',
    'view:meters',
    'edit:meters',
    'view:planning',
  ],
  [UserRole.MANAGER]: [
    'view:users',
    'view:projects',
    'create:projects',
    'edit:projects',
    'view:sites',
    'view:meters',
    'view:quotes',
    'create:quotes',
    'view:invoices',
    'view:planning',
  ],
  [UserRole.WORKER]: [
    'view:projects',
    'view:sites',
    'view:planning',
  ],
  [UserRole.CLIENT]: [
    'view:projects',
    'view:quotes',
    'view:invoices',
  ],
};

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user?.role) return false;

    const userRole = user.role as UserRole;
    const permissions = ROLE_PERMISSIONS[userRole] || [];

    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const isSuperAdmin = (): boolean => {
    return user?.role === UserRole.SUPER_ADMIN;
  };

  const isAdmin = (): boolean => {
    return user?.role === UserRole.ADMIN;
  };

  const isManager = (): boolean => {
    return user?.role === UserRole.MANAGER;
  };

  const isWorker = (): boolean => {
    return user?.role === UserRole.WORKER;
  };

  const isClient = (): boolean => {
    return user?.role === UserRole.CLIENT;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isAdmin,
    isManager,
    isWorker,
    isClient,
    userRole: user?.role as UserRole | undefined,
  };
}
