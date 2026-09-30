import { apiClient } from './client';
import { AUTH_ENDPOINTS } from '@/lib/constants';
import type { LoginCredentials, RegisterData, AuthResponse, User } from '@/types/auth';
import type { ApiResponse } from '@/types/api';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      AUTH_ENDPOINTS.LOGIN,
      credentials
    );

    if (response.data) {
      // Store tokens
      apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response.data!;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      AUTH_ENDPOINTS.REGISTER,
      data
    );

    if (response.data) {
      // Store tokens
      apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response.data!;
  },

  async logout(): Promise<void> {
    try {
      // Get refresh token before clearing
      const refreshToken = apiClient.getRefreshTokenPublic();

      if (refreshToken) {
        // Send refresh token to backend for logout
        await apiClient.post(AUTH_ENDPOINTS.LOGOUT, { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if backend call fails
    } finally {
      // Always clear tokens locally
      apiClient.clearTokens();
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(AUTH_ENDPOINTS.ME);
    return response.data!;
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      AUTH_ENDPOINTS.REFRESH,
      { refreshToken }
    );
    return response.data!;
  },
};
