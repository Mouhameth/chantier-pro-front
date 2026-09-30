import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type {
  OuvrageCategory,
  OuvrageItem,
  OuvrageCategoriesListResponse,
  CreateOuvrageCategoryData,
  UpdateOuvrageCategoryData,
  CreateOuvrageItemData,
  UpdateOuvrageItemData,
} from '@/types/ouvrage';

const OUVRAGE_ENDPOINTS = {
  // Categories
  CATEGORIES: '/ouvrage/categories',
  CATEGORY: (id: number) => `/ouvrage/categories/${id}`,

  // Items
  ITEMS: '/ouvrage/items',
  ITEM: (id: number) => `/ouvrage/items/${id}`,

  // Seed default categories
  SEED: '/ouvrage/seed',
} as const;

export const ouvrageApi = {
  // ===== CATEGORIES =====

  async listCategories(includeItems = true): Promise<OuvrageCategoriesListResponse> {
    const params = new URLSearchParams();
    if (includeItems) params.append('includeItems', 'true');

    const url = `${OUVRAGE_ENDPOINTS.CATEGORIES}?${params.toString()}`;
    const response = await apiClient.get<OuvrageCategoriesListResponse>(url);
    return response;
  },

  async createCategory(data: CreateOuvrageCategoryData): Promise<OuvrageCategory> {
    const response = await apiClient.post<ApiResponse<OuvrageCategory>>(
      OUVRAGE_ENDPOINTS.CATEGORIES,
      data
    );
    return response.data!;
  },

  async updateCategory(id: number, data: UpdateOuvrageCategoryData): Promise<OuvrageCategory> {
    const response = await apiClient.patch<ApiResponse<OuvrageCategory>>(
      OUVRAGE_ENDPOINTS.CATEGORY(id),
      data
    );
    return response.data!;
  },

  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(OUVRAGE_ENDPOINTS.CATEGORY(id));
  },

  // ===== ITEMS =====

  async createItem(data: CreateOuvrageItemData): Promise<OuvrageItem> {
    const response = await apiClient.post<ApiResponse<OuvrageItem>>(
      OUVRAGE_ENDPOINTS.ITEMS,
      data
    );
    return response.data!;
  },

  async updateItem(id: number, data: UpdateOuvrageItemData): Promise<OuvrageItem> {
    const response = await apiClient.patch<ApiResponse<OuvrageItem>>(
      OUVRAGE_ENDPOINTS.ITEM(id),
      data
    );
    return response.data!;
  },

  async deleteItem(id: number): Promise<void> {
    await apiClient.delete(OUVRAGE_ENDPOINTS.ITEM(id));
  },

  // ===== SEED DEFAULT CATEGORIES =====

  async seedDefaultCategories(): Promise<{ categoryCount: number; itemCount: number }> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { categoryCount: number; itemCount: number };
    }>(OUVRAGE_ENDPOINTS.SEED);
    return response.data;
  },
};
