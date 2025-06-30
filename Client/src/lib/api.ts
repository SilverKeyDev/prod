export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

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
  generateReport: async (address: string, notes?: string, files?: File[]): Promise<ApiResponse<{ report: any }>> => {
    const formData = new FormData();
    formData.append('address', address);
    if (notes) formData.append('notes', notes);
    if (files) {
      files.forEach(file => formData.append('files', file));
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
};
