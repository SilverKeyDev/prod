import { apiPost } from './utils/index';
import { log } from '../lib/security/secureLogger';
import { reportSecurityEvent } from '../lib/security/errorReporting';

// Types for authentication API
export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  agency_name?: string;
}

export interface VerifyData {
  email: string;
  code: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

interface CodeDeliveryDetails {
  destination?: string;
  delivery_medium?: string;
}

export interface AuthResponse {
  success: boolean;
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  user?: {
    email: string;
    user_sub: string;
  };
  message?: string;
  error?: string;
  user_sub?: string;
  verification_complete?: boolean;
  login_failed?: boolean;
  auto_login_failed?: boolean;
  code_delivery?: CodeDeliveryDetails;
}

/**
 * Authentication API client using centralized utilities
 */
export const authApi = {
  /**
   * Register a new user
   */
  signup: async (data: SignupData): Promise<AuthResponse> => {
    log.security('AUTH_API', 'User signup attempt', { email: data.email });
    const response = await apiPost<AuthResponse>('/api/v1/auth/signup', data);
    
    if (response.success) {
      log.security('AUTH_API', 'User signup successful', { email: data.email });
    } else {
      reportSecurityEvent({
        type: 'authentication_failure',
        severity: 'medium',
        description: 'User signup failed',
        metadata: { email: data.email, error: response.error }
      });
    }
    
    return response;
  },

  /**
   * Verify user's email with code and automatically log them in
   */
  verify: async (data: VerifyData): Promise<AuthResponse> => {
    log.security('AUTH_API', 'Email verification attempt', { email: data.email });
    const response = await apiPost<AuthResponse>('/api/v1/auth/verify', data);
    
    if (response.success && response.verification_complete) {
      log.security('AUTH_API', 'Email verification successful', { email: data.email });
    } else {
      reportSecurityEvent({
        type: 'authentication_failure',
        severity: 'medium',
        description: 'Email verification failed',
        metadata: { email: data.email, error: response.error }
      });
    }
    
    return response;
  },

  /**
   * Resend verification code to user's email
   */
  resendCode: (email: string): Promise<AuthResponse> =>
    apiPost<AuthResponse>('/api/v1/auth/resend-code', { email }),

  /**
   * Authenticate user and return Cognito JWT tokens
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    log.security('AUTH_API', 'User login attempt', { email: data.email });
    const response = await apiPost<AuthResponse>('/api/v1/auth/login', data);
    
    if (response.success && response.access_token) {
      log.security('AUTH_API', 'User login successful', { email: data.email });
    } else {
      reportSecurityEvent({
        type: 'authentication_failure',
        severity: response.login_failed ? 'high' : 'medium',
        description: 'User login failed',
        metadata: { email: data.email, error: response.error, loginFailed: response.login_failed }
      });
    }
    
    return response;
  },

  /**
   * Initiate forgot password flow
   */
  forgotPassword: async (email: string): Promise<AuthResponse> => {
    log.security('AUTH_API', 'Password reset request', { email });
    const response = await apiPost<AuthResponse>('/api/v1/auth/forgot-password', { email });
    
    if (response.success) {
      log.security('AUTH_API', 'Password reset code sent', { email });
    } else {
      reportSecurityEvent({
        type: 'authentication_failure',
        severity: 'low',
        description: 'Password reset request failed',
        metadata: { email, error: response.error }
      });
    }
    
    return response;
  },

  /**
   * Confirm forgot password with code and set new password
   */
  resetPassword: async (email: string, code: string, new_password: string): Promise<AuthResponse> => {
    log.security('AUTH_API', 'Password reset confirmation attempt', { email });
    const response = await apiPost<AuthResponse>('/api/v1/auth/reset-password', {
      email,
      code,
      new_password,
    });
    
    if (response.success) {
      log.security('AUTH_API', 'Password reset successful', { email });
    } else {
      reportSecurityEvent({
        type: 'authentication_failure',
        severity: 'medium',
        description: 'Password reset confirmation failed',
        metadata: { email, error: response.error }
      });
    }
    
    return response;
  },
};