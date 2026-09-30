import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type {
  Project,
  ProjectsListResponse,
  CreateProjectData,
  ProjectFilters,
  ProjectManager
} from '@/types/project';

const PROJECTS_ENDPOINTS = {
  LIST: '/projects',
  CREATE: '/projects',
  GET: (id: number) => `/projects/${id}`,
  UPDATE: '/projects',
  DELETE: (id: number) => `/projects/${id}`,
  CHANGE_STATUS: (id: number) => `/projects/${id}/status`,
  UPDATE_PROGRESS: (id: number) => `/projects/${id}/progress`,
  PROJECT_MANAGERS: '/auth/users/project-managers',
} as const;

export const projectsApi = {
  async list(filters?: ProjectFilters): Promise<ProjectsListResponse> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.projectType) params.append('projectType', filters.projectType);
    if (filters?.country) params.append('country', filters.country);
    if (filters?.projectManagerId) params.append('projectManagerId', filters.projectManagerId.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

    const query = params.toString();
    const url = query ? `${PROJECTS_ENDPOINTS.LIST}?${query}` : PROJECTS_ENDPOINTS.LIST;

    const response = await apiClient.get<ApiResponse<Project[]>>(url);

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

  async getById(id: number): Promise<Project> {
    const response = await apiClient.get<ApiResponse<Project>>(
      PROJECTS_ENDPOINTS.GET(id)
    );
    return response.data!;
  },

  async create(data: CreateProjectData): Promise<Project> {
    const response = await apiClient.post<ApiResponse<Project>>(
      PROJECTS_ENDPOINTS.CREATE,
      data
    );
    return response.data!;
  },

  async update( data: Partial<CreateProjectData>): Promise<Project> {
    const response = await apiClient.put<ApiResponse<Project>>(
      PROJECTS_ENDPOINTS.UPDATE,
      data
    );
    console.log(data);
    
    return response.data!;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(PROJECTS_ENDPOINTS.DELETE(id));
  },

  async changeStatus(id: number, status: string): Promise<Project> {
    const response = await apiClient.patch<ApiResponse<Project>>(
      PROJECTS_ENDPOINTS.CHANGE_STATUS(id),
      { id, status }
    );
    return response.data!;
  },

  async updateProgress(id: number, progress: number): Promise<Project> {
    const response = await apiClient.patch<ApiResponse<Project>>(
      PROJECTS_ENDPOINTS.UPDATE_PROGRESS(id),
      { progress }
    );
    return response.data!;
  },

  async getProjectManagers(): Promise<ProjectManager[]> {
    const response = await apiClient.get<ApiResponse<ProjectManager[]>>(
      PROJECTS_ENDPOINTS.PROJECT_MANAGERS
    );
    return response.data || [];
  },
};
