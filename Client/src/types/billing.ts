// Billing and subscription-related type definitions

export interface BillingInfo {
  subscription: {
    status: string;
    plan_id: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    reports_limit: number;
    stripe_subscription_id: string | null;
    plan: {
      name: string;
      price: number;
      interval: string;
    };
  } | null;
  usage: {
    reports_generated: number;
  };
  has_active_subscription: boolean;
}
