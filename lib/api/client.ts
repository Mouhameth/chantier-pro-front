import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL, TOKEN_KEYS, AUTH_ENDPOINTS } from '@/lib/constants';
import type { ApiErrorResponse } from '@/types/api';
import { translateError } from '@/lib/utils/errorMessages';

// Function to handle logout (will be called from client-side only)
const handleLogout = async () => {
  if (typeof window !== 'undefined') {
    // Dynamic import to avoid SSR issues
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl: '/auth/login', redirect: true });
  }
};

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add token to requests
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle token refresh and errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle network errors
        if (!error.response) {
          const networkError = new Error('Erreur de connexion. Vérifiez votre connexion internet.');
          return Promise.reject(networkError);
        }

        // Don't try to refresh token for login/register endpoints
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                               originalRequest.url?.includes('/auth/register');

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          if (this.isRefreshing) {
            // Queue the request while refreshing
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken = this.getRefreshToken();

          if (!refreshToken) {
            this.clearTokens();
            this.isRefreshing = false;
            // Logout from NextAuth and redirect to login
            handleLogout();
            const authError = new Error('Session expirée. Veuillez vous reconnecter.');
            return Promise.reject(authError);
          }

          try {
            const response = await axios.post(`${API_BASE_URL}${AUTH_ENDPOINTS.REFRESH}`, {
              refreshToken,
            });

            const { data } = response.data;
            const { accessToken, refreshToken: newRefreshToken } = data;

            this.setAccessToken(accessToken);
            this.setRefreshToken(newRefreshToken);

            // Retry all queued requests
            this.failedQueue.forEach((prom) => {
              prom.resolve();
            });

            this.failedQueue = [];
            this.isRefreshing = false;

            return this.client(originalRequest);
          } catch (refreshError) {
            this.failedQueue.forEach((prom) => {
              prom.reject(refreshError);
            });

            this.failedQueue = [];
            this.isRefreshing = false;
            this.clearTokens();

            // Both tokens expired - logout from NextAuth and redirect to login
            handleLogout();

            const authError = new Error('Session expirée. Veuillez vous reconnecter.');
            return Promise.reject(authError);
          }
        }

        // Format and translate error message
        const rawMessage = error.response?.data?.message || error.response?.data?.error || '';
        const errorMessage = translateError(rawMessage);

        const formattedError = new Error(errorMessage);
        (formattedError as any).response = error.response;
        (formattedError as any).errors = error.response?.data?.errors;
        (formattedError as any).statusCode = error.response?.status;

        return Promise.reject(formattedError);
      }
    );
  }

  // Token management
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
  }

  public getRefreshTokenPublic(): string | null {
    return this.getRefreshToken();
  }

  private setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, token);
  }

  private setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, token);
  }

  public setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  public clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  }

  // HTTP Methods
  public async get<T>(url: string, config = {}) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: unknown, config = {}) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: unknown, config = {}) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: unknown, config = {}) {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config = {}) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
