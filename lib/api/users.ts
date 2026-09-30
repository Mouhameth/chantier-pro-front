import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type { User, UsersListResponse, CreateUserData, UserFilters } from '@/types/auth';

const USERS_ENDPOINTS = {
  LIST: '/auth/users',
  CREATE: '/auth/register',
  UPDATE: '/auth/users/update',
  DELETE: (id: number) => `/auth/users/${id}`,
  ACTIVATE: (id: number) => `/auth/users/${id}/activate`,
  DEACTIVATE: (id: number) => `/auth/users/${id}/deactivate`,
} as const;

export const usersApi = {
  async list(filters?: UserFilters): Promise<UsersListResponse> {
    const params = new URLSearchParams();

    if (filters?.role) params.append('role', filters.role);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

    const query = params.toString();
    const url = query ? `${USERS_ENDPOINTS.LIST}?${query}` : USERS_ENDPOINTS.LIST;

    const response = await apiClient.get<ApiResponse<User[]>>(url);

    return {
      data: response.data || [],
      pagination: (response as any).pagination || {
        total: response.data?.length || 0,
        page: 1,
        limit: 20,
        pages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  },

  async create(data: CreateUserData): Promise<User> {
    const response = await apiClient.post<ApiResponse<{ user: User }>>(
      USERS_ENDPOINTS.CREATE,
      data
    );
    return response.data!.user;
  },

  async update(id: number, data: Partial<CreateUserData> & { tenantId?: string | null }): Promise<User> {
    // Clean up data: only send defined fields, remove password
    const { password, ...updateData } = data as any;

    console.log('Received data:', data);
    console.log('Update data after destructuring:', updateData);
    console.log('tenantId value:', updateData.tenantId);

    const cleanedData: Record<string, any> = { id };

    // Only include fields that are actually defined
    if (updateData.email !== undefined && updateData.email !== null) {
      cleanedData.email = updateData.email;
    }
    if (updateData.firstName !== undefined && updateData.firstName !== null) {
      cleanedData.firstName = updateData.firstName;
    }
    if (updateData.lastName !== undefined && updateData.lastName !== null) {
      cleanedData.lastName = updateData.lastName;
    }
    if (updateData.phone !== undefined && updateData.phone !== null) {
      // Send empty string for empty phone, or the actual value
      cleanedData.phone = updateData.phone;
    }
    if (updateData.role !== undefined && updateData.role !== null) {
      cleanedData.role = updateData.role;
    }

    console.log('Sending update request:', cleanedData);

    const response = await apiClient.put<ApiResponse<User>>(
      USERS_ENDPOINTS.UPDATE,
      cleanedData
    );
    return response.data!;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(USERS_ENDPOINTS.DELETE(id));
  },

  async activate(id: number): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
      USERS_ENDPOINTS.ACTIVATE(id)
    );
    return response.data!;
  },

  async deactivate(id: number): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
      USERS_ENDPOINTS.DEACTIVATE(id)
    );
    return response.data!;
  },
};
