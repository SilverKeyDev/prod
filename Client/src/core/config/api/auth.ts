import { apiPost } from '../../services/http/compatibility';
import { reportSecurityEvent } from '../../services/security/errorReporting';
import { log } from '../../services/security/secureLogger';

// Types for authentication API
export type SignupData = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  agency_name?: string;
};

export type VerifyData = {
  email: string;
  code: string;
  password: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export type AuthResponse = {
  success: boolean;
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  user?: {
    email: string;
    user_sub: string;
    name: string;
    id: string;
  };
  message?: string;
  error?: string;
  user_sub?: string;
  verification_complete?: boolean;
  login_failed?: boolean;
  auto_login_failed?: boolean;
  code_delivery?: unknown;
};

/**
 * Authentication API client using centralized utilities
 */
export const authApi = {
  /**
   * Register a new user
   */
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>('/api/v1/auth/signup', data);

    if (response.success) {
      // Signup successful
    } else {
      reportSecurityEvent({
        type: 'authentication_failure',
        severity: 'medium',
        description: 'User signup failed',
        metadata: { email: data.email, error: response.error },
      });
    }

    return response;
  },

  /**
   * Verify user's email with code and automatically log them in
   */
  verify: async (data: VerifyData): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>('/api/v1/auth/verify', data);

    if (response.success && response.verification_complete) {
      // Verification successful
    } else {
      reportSecurityEvent({
        type: 'authentication_failure',
        severity: 'medium',
        description: 'Email verification failed',
        metadata: { email: data.email, error: response.error },
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
    const response = await apiPost<AuthResponse>('/api/v1/auth/login', data);

    if (response.success && response.access_token) {
      // Login successful
    } else {
      reportSecurityEvent({
        type: 'authentication_failure',
        severity: response.login_failed ? 'high' : 'medium',
        description: 'User login failed',
        metadata: { email: data.email, error: response.error, loginFailed: response.login_failed },
      });
    }

    return response;
  },

  /**
   * Initiate forgot password flow
   */
  forgotPassword: async (email: string): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>('/api/v1/auth/forgot-password', { email });

    if (response.success) {
      // Password reset request successful
    } else {
      reportSecurityEvent({
        type: 'authentication_failure',
        severity: 'low',
        description: 'Password reset request failed',
        metadata: { email, error: response.error },
      });
    }

    return response;
  },

  /**
   * Confirm forgot password with code and set new password
   */
  resetPassword: async (
    email: string,
    code: string,
    new_password: string
  ): Promise<AuthResponse> => {
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
        metadata: { email, error: response.error },
      });
    }

    return response;
  },
};
