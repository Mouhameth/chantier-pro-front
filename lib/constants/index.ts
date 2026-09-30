export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
} as const;

export const PLAN_ENDPOINTS = {
  LIST_WITH_STATS: '/plans/stats',
  LIST: '/plans',
  CREATE: '/plans',
  UPDATE: (id: number) => `/plans/${id}`,
  DELETE: (id: number) => `/plans/${id}`,
  GET_BY_ID: (id: number) => `/plans/${id}`,
} as const;

export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  PLANS: '/plans',
  PROFILE: '/profile',
} as const;

export const QUERY_KEYS = {
  USER: 'user',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  PLANS: 'plans',
  TENANTS: 'tenants',
} as const;
