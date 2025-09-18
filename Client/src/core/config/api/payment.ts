import { apiGet, apiPost } from '../../services/http/compatibility';
import { reportSecurityEvent } from '../../services/security/errorReporting';

// Types for payment API
export type SubscriptionStatus = {
  has_subscription: boolean;
  status: string;
  reports_used: number;
  reports_limit: number;
  plan_id?: string;
  current_period_end?: string;
};

export type CheckoutSessionRequest = {
  priceId: string;
};

export type CheckoutSessionResponse = {
  sessionId: string;
};

export type PortalSessionResponse = {
  url: string;
};

export type SubscriptionStatusResponse = {
  subscription_id: string;
  status: string;
};

export type BillingInfo = {
  has_subscription: boolean;
  status: string;
  reports_used: number;
  reports_limit: number;
  plan_id?: string;
  current_period_end?: string;
};

/**
 * Payment API client using centralized utilities
 */
export const paymentApi = {
  /**
   * Get subscription status for current user
   */
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    const response = await apiGet<SubscriptionStatus>('/api/v1/payment/subscription-status');
    return response;
  },

  /**
   * Create Stripe checkout session
   */
  createCheckoutSession: async (data: CheckoutSessionRequest): Promise<CheckoutSessionResponse> => {
    const response = await apiPost<CheckoutSessionResponse>(
      '/api/v1/payment/create-checkout-session',
      data
    );

    if (response.sessionId) {
      // Checkout session created successfully
    } else {
      reportSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        description: 'Checkout session creation failed',
        metadata: { priceId: data.priceId },
      });
    }

    return response;
  },

  /**
   * Create Stripe customer portal session
   */
  createPortalSession: async (): Promise<PortalSessionResponse> => {
    const response = await apiPost<PortalSessionResponse>(
      '/api/v1/payment/create-portal-session',
      {}
    );

    if (response.url) {
      // Portal session created successfully
    } else {
      reportSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        description: 'Customer portal session creation failed',
      });
    }

    return response;
  },

  /**
   * Get subscription status by ID
   */
  getSubscriptionStatusById: async (
    subscriptionId: string
  ): Promise<SubscriptionStatusResponse> => {
    const response = await apiGet<SubscriptionStatusResponse>(
      `/api/v1/payment/subscription/status?subscription_id=${subscriptionId}`
    );
    return response;
  },

  /**
   * Get billing information for current user
   */
  getBillingInfo: async (): Promise<BillingInfo> => {
    const response = await apiGet<BillingInfo>('/api/v1/user/billing-info');
    return response;
  },
};
