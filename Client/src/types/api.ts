// API-related type definitions

export interface ApiSuccess<T> {
  success: true;
  [k: string]: any;
  data?: T;
}

export interface ApiError {
  success: false;
  error?: string;
  [k: string]: any;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// API Configuration
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
