export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  isActive: boolean;
  tenantId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
  SUPERVISOR = 'SUPERVISOR',
  ARCHITECT = 'ARCHITECT',
  TECHNICIAN = 'TECHNICIAN',
  MANAGER = 'MANAGER', // Keep for backward compatibility
  WORKER = 'WORKER', // Keep for backward compatibility
  CLIENT = 'CLIENT', // Keep for backward compatibility
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    email: string;
    phone: string | null;
    address: string | null;
    status: string;
    createdBy: number | null;
    updatedBy: number | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
}

export interface TokenPayload {
  userId: number;
  tenantId: string | null;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UsersListResponse {
  data: User[];
  pagination: Pagination;
}

export interface CreateUserData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}
