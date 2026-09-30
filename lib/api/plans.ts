import { apiClient } from './client';
import { PLAN_ENDPOINTS } from '@/lib/constants';
import type { Plan, PlanWithStats, CreatePlanData, UpdatePlanData } from '@/types/plan';
import type { ApiResponse } from '@/types/api';

export const plansApi = {
  async getPlansWithStats(): Promise<PlanWithStats[]> {
    const response = await apiClient.get<ApiResponse<PlanWithStats[]>>(
      PLAN_ENDPOINTS.LIST_WITH_STATS
    );
    return response.data!;
  },

  async getPlans(): Promise<Plan[]> {
    const response = await apiClient.get<ApiResponse<Plan[]>>(
      PLAN_ENDPOINTS.LIST
    );
    return response.data!;
  },

  async getPlanById(id: number): Promise<Plan> {
    const response = await apiClient.get<ApiResponse<Plan>>(
      PLAN_ENDPOINTS.GET_BY_ID(id)
    );
    return response.data!;
  },

  async createPlan(data: CreatePlanData): Promise<Plan> {
    const response = await apiClient.post<ApiResponse<Plan>>(
      PLAN_ENDPOINTS.CREATE,
      data
    );
    return response.data!;
  },

  async updatePlan(id: number, data: UpdatePlanData): Promise<Plan> {
    const response = await apiClient.put<ApiResponse<Plan>>(
      PLAN_ENDPOINTS.UPDATE(id),
      data
    );
    return response.data!;
  },

  async deletePlan(id: number): Promise<void> {
    await apiClient.delete(PLAN_ENDPOINTS.DELETE(id));
  },
};
