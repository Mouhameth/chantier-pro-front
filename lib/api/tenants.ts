import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type { Tenant, TenantWithDetails, CreateTenantData, UpdateTenantData } from '@/types/tenant';

export interface TenantsListResponse {
  data: TenantWithDetails[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface GetTenantsParams {
  page?: number;
  limit?: number;
}

export const tenantsApi = {
  // Get all tenants with pagination
  getTenants: async (params?: GetTenantsParams): Promise<TenantsListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `/tenants${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get<any>(url);

    // La réponse a la structure: { success, message, data: [...], pagination: {...} }
    if (!response.data) {
      throw new Error('Failed to fetch tenants');
    }

    return {
      data: response.data,
      pagination: response.pagination,
    };
  },

  // Get tenant by ID
  getTenantById: async (id: string): Promise<TenantWithDetails> => {
    const response = await apiClient.get<ApiResponse<TenantWithDetails>>(`/tenants/${id}`);
    if (!response.data) {
      throw new Error('Failed to fetch tenant');
    }
    return response.data;
  },

  // Create tenant
  createTenant: async (data: CreateTenantData): Promise<Tenant> => {
    const response = await apiClient.post<ApiResponse<Tenant>>('/tenants', data);
    if (!response.data) {
      throw new Error('Failed to create tenant');
    }
    return response.data;
  },

  // Update tenant
  updateTenant: async (id: string, data: UpdateTenantData): Promise<Tenant> => {
    const response = await apiClient.put<ApiResponse<Tenant>>(`/tenants/${id}`, data);
    if (!response.data) {
      throw new Error('Failed to update tenant');
    }
    return response.data;
  },

  // Cancel subscription
  cancelSubscription: async (id: string): Promise<void> => {
    await apiClient.post(`/tenants/${id}/cancel-subscription`);
  },

  // Renew subscription
  renewSubscription: async (id: string, data: { planId: number; billingCycle: 'monthly' | 'yearly' }): Promise<void> => {
    await apiClient.post(`/tenants/${id}/renew-subscription`, data);
  },

  // Suspend tenant
  suspendTenant: async (id: string): Promise<Tenant> => {
    const response = await apiClient.post<ApiResponse<Tenant>>(`/tenants/${id}/suspend`);
    if (!response.data) {
      throw new Error('Failed to suspend tenant');
    }
    return response.data;
  },

  // Activate tenant
  activateTenant: async (id: string): Promise<Tenant> => {
    const response = await apiClient.post<ApiResponse<Tenant>>(`/tenants/${id}/activate`);
    if (!response.data) {
      throw new Error('Failed to activate tenant');
    }
    return response.data;
  },
};
