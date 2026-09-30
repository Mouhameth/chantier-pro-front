import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/types/api';

export interface Session {
  id: number;
  blueprintId: number;
  pageId: number;
  pageName?: string;
  createdAt: string;
  expiresAt: string;
}

interface UseAutoSessionOptions {
  pageId: number;
  blueprintId: number; // ← Maintenant obligatoire (v2.1.0)
  pageName?: string;
  enabled?: boolean;
}

/**
 * Hook to automatically retrieve or create a session for a blueprint
 * GET /api/v1/metrage/pages/:pageId/session?blueprintId=X
 *
 * Note: La session est maintenant par blueprint (v2.1.0), pas par page
 */
export const useAutoSession = (options: UseAutoSessionOptions) => {
  const { pageId, blueprintId, pageName, enabled = true } = options;

  const query = useQuery({
    queryKey: ['collaboration-session', blueprintId], // ← Par blueprint maintenant
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('blueprintId', blueprintId.toString()); // ← Obligatoire
      if (pageName) params.append('pageName', pageName);

      const queryString = params.toString();
      const url = `/metrage/pages/${pageId}/session${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<ApiResponse<Session>>(url);
      return response.data;
    },
    enabled: enabled && !!pageId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  useEffect(() => {
    if (query.data) {
      console.log('[useAutoSession] Session loaded:', query.data.id);
    }
  }, [query.data]);

  return {
    session: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
