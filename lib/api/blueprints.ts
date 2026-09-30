import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type {
  Blueprint,
  BlueprintsListResponse,
  CreateBlueprintData,
  BlueprintFilters,
} from '@/types/blueprint';

const BLUEPRINTS_ENDPOINTS = {
  LIST: '/blueprints',
  CREATE: '/blueprints/upload',
  GET: (id: number) => `/blueprints/${id}`,
  UPDATE: (id: number) => `/blueprints/${id}`,
  DELETE: (id: number) => `/blueprints/${id}`,
  BY_SITE: (siteId: number) => `/blueprints/site/${siteId}`,
  UPDATE_PAGE_TITLE: (blueprintId: number, pageId: number) => `/blueprints/${blueprintId}/pages/${pageId}/title`,
  DELETE_PAGE: (blueprintId: number, pageId: number) => `/blueprints/${blueprintId}/pages/${pageId}`,
} as const;

export const blueprintsApi = {
  async list(filters?: BlueprintFilters): Promise<BlueprintsListResponse> {
    const params = new URLSearchParams();

    if (filters?.siteId) params.append('siteId', filters.siteId.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

    const query = params.toString();
    const url = query ? `${BLUEPRINTS_ENDPOINTS.LIST}?${query}` : BLUEPRINTS_ENDPOINTS.LIST;

    const response = await apiClient.get<ApiResponse<Blueprint[]>>(url);

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

  async getBySiteId(siteId: number): Promise<Blueprint[]> {
    const response = await apiClient.get<ApiResponse<Blueprint[]>>(
      BLUEPRINTS_ENDPOINTS.BY_SITE(siteId)
    );
    return response.data || [];
  },

  async getById(id: number): Promise<Blueprint> {
    const response = await apiClient.get<ApiResponse<Blueprint>>(
      BLUEPRINTS_ENDPOINTS.GET(id)
    );
    return response.data!;
  },

  async create(data: CreateBlueprintData): Promise<Blueprint> {
    const response = await apiClient.post<ApiResponse<Blueprint>>(
      BLUEPRINTS_ENDPOINTS.CREATE,
      data
    );
    return response.data!;
  },

  async upload(file: File, siteId: number, title?: string, description?: string): Promise<Blueprint> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('siteId', siteId.toString());
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    // Get access token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${BLUEPRINTS_ENDPOINTS.CREATE}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Failed to upload blueprint');
    }

    const result = await response.json();
    return result.data;
  },

  async update(id: number, data: Partial<CreateBlueprintData>): Promise<Blueprint> {
    const response = await apiClient.patch<ApiResponse<Blueprint>>(
      BLUEPRINTS_ENDPOINTS.UPDATE(id),
      data
    );
    return response.data!;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(BLUEPRINTS_ENDPOINTS.DELETE(id));
  },

  async updatePageTitle(blueprintId: number, pageId: number, title: string): Promise<void> {
    await apiClient.patch(
      BLUEPRINTS_ENDPOINTS.UPDATE_PAGE_TITLE(blueprintId, pageId),
      { title }
    );
  },

  async deletePage(blueprintId: number, pageId: number): Promise<void> {
    await apiClient.delete(BLUEPRINTS_ENDPOINTS.DELETE_PAGE(blueprintId, pageId));
  },
};
