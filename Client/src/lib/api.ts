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

  const token = localStorage.getItem('access_token'); // Ensure this matches how you store it after login
  return token;
};

/**
 * Makes an API request with proper authentication and error handling
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

  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  });

  // Merge any custom headers
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => headers.set(key, value));
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => headers.set(key, value));
    } else {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (value !== undefined) {
          headers.set(key, String(value));
        }
      });
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'An error occurred',
        ...data,
      };
    }

    return {
      success: true,
      data,
      ...data,
    };
  } catch (error) {
    console.error('API request failed:', error);
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

  verify: (data: { email: string; code: string }) =>
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
