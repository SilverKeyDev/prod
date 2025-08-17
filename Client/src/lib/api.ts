import { fetchJson, logHttp, createAuthHeaders, HttpError } from './fetchUtils';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

// Helper to get the auth token from storage
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('id_token'); // Use id_token to match other API calls
  return token;
};

/**
 * Makes an API request with proper authentication and error handling
 * Uses the robust fetchJson utility with HTML/404 tolerance
 * @param endpoint The API endpoint (e.g., '/payment/create-checkout-session')
 * @param options Fetch options (method, body, headers, etc.)
 * @returns Promise with the API response
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;
  const token = getAuthToken();

  // Merge auth headers with custom headers
  const authHeaders = createAuthHeaders(token) as Record<string, string>;
  const mergedHeaders: Record<string, string> = { ...authHeaders };
  
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        mergedHeaders[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      (options.headers as [string, string][]).forEach(([key, value]) => {
        mergedHeaders[key] = value;
      });
    } else {
      Object.entries(options.headers as Record<string, string>).forEach(([key, value]) => {
        if (value !== undefined) {
          mergedHeaders[key] = String(value);
        }
      });
    }
  }

  try {
    const data = await fetchJson<any>(url, {
      ...options,
      headers: mergedHeaders,
      credentials: 'include',
      acceptStatuses: [401, 404], // Handle auth and not found gracefully
    });

    // Handle 401 responses (token expired/unauthorized)
    if (data === undefined) {
      // This could be a 404 or 401 that was accepted
      return {
        success: false,
        error: 'Resource not found or unauthorized',
      } as ApiResponse<T>;
    }

    // Handle explicit error responses
    if (data?.error === 'TOKEN_EXPIRED' || data?.status === 401) {
      try {
        localStorage.removeItem('id_token');
        localStorage.removeItem('access_token');
      } catch (_) {
        /* ignore */
      }
      window.location.href = '/login';
      return {
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Session expired. Redirecting to login.'
      } as ApiResponse<T>;
    }

    // Handle success responses
    if (data?.success !== false) {
      return {
        success: true,
        data,
        ...data,
      };
    }

    // Handle error responses
    return {
      success: false,
      error: data.message || data.error || 'An error occurred',
      ...data,
    };
  } catch (error) {
    if (error instanceof HttpError) {
      // Handle HTTP errors gracefully
      if (error.status === 401) {
        try {
          localStorage.removeItem('id_token');
          localStorage.removeItem('access_token');
        } catch (_) {
          /* ignore */
        }
        window.location.href = '/login';
        return {
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'Session expired. Redirecting to login.'
        } as ApiResponse<T>;
      }
      
      return {
        success: false,
        error: `HTTP ${error.status}: ${error.message}`,
      };
    }
    
    logHttp('api-request', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
}

// Auth API
export const authApi = {
  signup: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    agency_name?: string;
  }) =>
    apiRequest('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verify: (data: { email: string; code: string; password: string }) =>
    apiRequest('/api/v1/auth/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resendCode: (email: string) =>
    apiRequest('/api/v1/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  login: (email: string, password: string) =>
    apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  forgotPassword: (email: string) =>
    apiRequest('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, code: string, new_password: string) =>
    apiRequest('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, new_password }),
    }),
};

// Favorite Homes API
export const favoriteHomesApi = {
  addFavorite(home: any): Promise<ApiResponse<{ favorites: string[] }>> {
    return apiRequest('/api/v1/user/favorite-homes/add', {
      method: 'POST',
      body: JSON.stringify({ home }),
    });
  },

  removeFavorite(address: string): Promise<ApiResponse<{ favorites: string[] }>> {
    return apiRequest('/api/v1/user/favorite-homes/remove', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  },

  getFavorites(): Promise<ApiResponse<{ favorites: string[] }>> {
    return apiRequest('/api/v1/user/favorite-homes', {
      method: 'GET',
    });
  },
};

// Report API
export const reportApi = {
  generateReport: async (
    address: string,
    notes?: string,
    files?: File[]
  ): Promise<ApiResponse<{ report: any }>> => {
    const formData = new FormData();
    formData.append('address', address);
    if (notes) formData.append('notes', notes);
    if (files) {
      files.forEach((file) => formData.append('files', file));
    }

    const response = await fetch(`${API_BASE_URL}/generate-report`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    return response.json();
  },

  getReports: (): Promise<ApiResponse<{ reports: any[] }>> =>
    apiRequest('/reports'),

  getReport: (reportId: number): Promise<ApiResponse<{ report: any }>> =>
    apiRequest(`/reports/${reportId}`),

  downloadReport: async (reportId: number): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/download`, {
      credentials: 'include',
    });
    return response.blob();
  },

  getDownloadUrl: async (
    reportId: string
  ): Promise<ApiResponse<{ downloadUrl: string }>> => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/report/${reportId}/download-url`,
      {
        credentials: 'include',
      }
    );
    return response.json();
  },
};
