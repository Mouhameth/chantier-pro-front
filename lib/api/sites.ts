import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type {
  Site,
  SitesListResponse,
  CreateSiteData,
  UpdateSiteData,
  SiteFilters,
  SiteStatus
} from '@/types/site';

const SITES_ENDPOINTS = {
  LIST: '/sites',
  CREATE: '/sites',
  GET: (id: number) => `/sites/${id}`,
  UPDATE: (id: number) => `/sites/${id}`,
  DELETE: (id: number) => `/sites/${id}`,
  CHANGE_STATUS: (id: number) => `/sites/${id}/status`,
  UPDATE_PROGRESS: (id: number) => `/sites/${id}/progress`,
} as const;

export const sitesApi = {
  async list(filters?: SiteFilters): Promise<SitesListResponse> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.projectId) params.append('projectId', filters.projectId.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

    const query = params.toString();
    const url = query ? `${SITES_ENDPOINTS.LIST}?${query}` : SITES_ENDPOINTS.LIST;

    const response = await apiClient.get<ApiResponse<Site[]>>(url);

    return {
      data: response.data || [],
      pagination: (response as any).pagination || {
        total: response.data?.length || 0,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  },

  async getById(id: number): Promise<Site> {
    const response = await apiClient.get<ApiResponse<Site>>(
      SITES_ENDPOINTS.GET(id)
    );
    return response.data!;
  },

  async create(data: CreateSiteData): Promise<Site> {
    const response = await apiClient.post<ApiResponse<Site>>(
      SITES_ENDPOINTS.CREATE,
      data
    );
    return response.data!;
  },

  async update(data: UpdateSiteData): Promise<Site> {
    const response = await apiClient.patch<ApiResponse<Site>>(
      SITES_ENDPOINTS.UPDATE(data.id),
      data
    );
    return response.data!;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(SITES_ENDPOINTS.DELETE(id));
  },

  async changeStatus(id: number, status: SiteStatus): Promise<Site> {
    const response = await apiClient.patch<ApiResponse<Site>>(
      SITES_ENDPOINTS.CHANGE_STATUS(id),
      { id, status }
    );
    return response.data!;
  },

  async updateProgress(id: number, progress: number): Promise<Site> {
    const response = await apiClient.patch<ApiResponse<Site>>(
      SITES_ENDPOINTS.UPDATE_PROGRESS(id),
      { progress }
    );
    return response.data!;
  },
};
