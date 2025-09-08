import { apiGet, apiPost } from './utils/index';
import { log } from '../lib/security/secureLogger';
import { reportSecurityEvent } from '../lib/security/errorReporting';

// Types for payment API
export interface SubscriptionStatus {
  has_subscription: boolean;
  status: string;
  reports_used: number;
  reports_limit: number;
  plan_id?: string;
  current_period_end?: string;
}

export interface CheckoutSessionRequest {
  priceId: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
}

export interface PortalSessionResponse {
  url: string;
}

export interface SubscriptionStatusResponse {
  subscription_id: string;
  status: string;
}

/**
 * Payment API client using centralized utilities
 */
export const paymentApi = {
  /**
   * Get subscription status for current user
   */
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    log.security('PAYMENT_API', 'Subscription status request');
    const response = await apiGet<SubscriptionStatus>('/api/v1/payment/subscription-status');
    log.info('PAYMENT_API', 'Subscription status retrieved', { hasSubscription: response.has_subscription });
    return response;
  },

  /**
   * Create Stripe checkout session
   */
  createCheckoutSession: async (data: CheckoutSessionRequest): Promise<CheckoutSessionResponse> => {
    log.security('PAYMENT_API', 'Checkout session creation attempt', { priceId: data.priceId });
    const response = await apiPost<CheckoutSessionResponse>('/api/v1/payment/create-checkout-session', data);
    
    if (response.sessionId) {
      log.security('PAYMENT_API', 'Checkout session created successfully', { sessionId: response.sessionId });
    } else {
      reportSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        description: 'Checkout session creation failed',
        metadata: { priceId: data.priceId }
      });
    }
    
    return response;
  },

  /**
   * Create Stripe customer portal session
   */
  createPortalSession: async (): Promise<PortalSessionResponse> => {
    log.security('PAYMENT_API', 'Customer portal session creation attempt');
    const response = await apiPost<PortalSessionResponse>('/api/v1/payment/create-portal-session', {});
    
    if (response.url) {
      log.security('PAYMENT_API', 'Customer portal session created successfully');
    } else {
      reportSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        description: 'Customer portal session creation failed'
      });
    }
    
    return response;
  },

  /**
   * Get subscription status by ID
   */
  getSubscriptionStatusById: async (subscriptionId: string): Promise<SubscriptionStatusResponse> => {
    log.security('PAYMENT_API', 'Subscription status by ID request', { subscriptionId });
    const response = await apiGet<SubscriptionStatusResponse>(`/api/v1/payment/subscription/status?subscription_id=${subscriptionId}`);
    log.info('PAYMENT_API', 'Subscription status by ID retrieved', { subscriptionId, status: response.status });
    return response;
  },
};