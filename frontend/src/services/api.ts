// API service — centralized HTTP client with auth
import { ApiResponse, AuthTokens } from '../types';

const BASE_URL = '/api';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

function getAuthToken(): string | null {
  return localStorage.getItem('accessToken');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

function setTokens(tokens: AuthTokens): void {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

async function apiRequest<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { skipAuth, headers: customHeaders, ...restOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string> || {}),
  };

  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...restOptions,
    headers,
  });

  // Check response validity before parsing JSON
  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.error) errorMessage = errorData.error;
    } catch {
      // Non-JSON error response
    }
    return { success: false, error: errorMessage } as ApiResponse<T>;
  }

  const data = await response.json();

  // Handle token expiration — try refresh
  if (response.status === 401 && !skipAuth && getRefreshToken()) {
    try {
      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: getRefreshToken() }),
      });
      const refreshData = await refreshResponse.json();

      if (refreshData.success && refreshData.data) {
        setTokens(refreshData.data);
        // Retry original request
        headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
        const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
          ...restOptions,
          headers,
        });
        return retryResponse.json();
      } else {
        // Refresh failed — clear tokens and redirect
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  return data;
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body: unknown, options?: FetchOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown, options?: FetchOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

// Convenience exports
export { getAuthToken, setTokens };
