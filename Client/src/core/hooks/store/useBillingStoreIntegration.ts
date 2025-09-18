import { useEffect, useRef } from 'react';

import type { BillingInfo as ApiBillingInfo } from '../../config/api/payment';
import type { BillingInfo as SchemaBillingInfo } from '../../schemas/billing';
import { useBillingStore } from '../../store/billing.slice';
import { useStripePayment } from '../data/useStripePayment';

/**
 * Transform API billing info to schema billing info format
 */
function transformApiBillingToSchema(apiBilling: ApiBillingInfo | null): SchemaBillingInfo | null {
  if (!apiBilling) {
    return null;
  }

  return {
    subscription: apiBilling.has_subscription
      ? {
          status: apiBilling.status,
          plan_id: apiBilling.plan_id || '',
          current_period_end: apiBilling.current_period_end || null,
          cancel_at_period_end: false, // Not available in API response
          reports_limit: apiBilling.reports_limit,
          stripe_subscription_id: null, // Not available in API response
          plan: {
            name: 'Unknown Plan', // Not available in API response
            price: 0, // Not available in API response
            interval: 'month', // Not available in API response
          },
        }
      : null,
    usage: {
      reports_generated: apiBilling.reports_used,
    },
    has_active_subscription: apiBilling.has_subscription,
  };
}

/**
 * Hook that integrates useStripePayment with useBillingStore
 * This replaces the BillingContext functionality
 */
export function useBillingStoreIntegration() {
  const {
    billingInfo,
    billingLoading,
    billingError,
    refreshBillingInfo,
    handleSubscription,
    loading: paymentLoading,
    error: paymentError,
  } = useStripePayment();

  const { setBillingInfo, setBillingLoading, setBillingError, setPaymentLoading, setPaymentError } =
    useBillingStore();

  // Transform API billing info to schema format
  const transformedBillingInfo = transformApiBillingToSchema(billingInfo);

  // Sync hook data with store (guard against redundant updates)
  const lastBillingInfoRef = useRef<typeof transformedBillingInfo>();
  const lastBillingLoadingRef = useRef<typeof billingLoading>();
  const lastBillingErrorRef = useRef<typeof billingError>();
  const lastPaymentLoadingRef = useRef<typeof paymentLoading>();
  const lastPaymentErrorRef = useRef<typeof paymentError>();

  // Sync hook data with store
  useEffect(() => {
    if (lastBillingInfoRef.current !== transformedBillingInfo) {
      lastBillingInfoRef.current = transformedBillingInfo;
      setBillingInfo(transformedBillingInfo);
    }
  }, [transformedBillingInfo, setBillingInfo]);

  useEffect(() => {
    if (lastBillingLoadingRef.current !== billingLoading) {
      lastBillingLoadingRef.current = billingLoading;
      setBillingLoading(billingLoading);
    }
  }, [billingLoading, setBillingLoading]);

  useEffect(() => {
    if (lastBillingErrorRef.current !== billingError) {
      lastBillingErrorRef.current = billingError;
      setBillingError(billingError);
    }
  }, [billingError, setBillingError]);

  useEffect(() => {
    if (lastPaymentLoadingRef.current !== paymentLoading) {
      lastPaymentLoadingRef.current = paymentLoading;
      setPaymentLoading(paymentLoading);
    }
  }, [paymentLoading, setPaymentLoading]);

  useEffect(() => {
    if (lastPaymentErrorRef.current !== paymentError) {
      lastPaymentErrorRef.current = paymentError;
      setPaymentError(paymentError);
    }
  }, [paymentError, setPaymentError]);

  return {
    billingInfo: transformedBillingInfo,
    billingLoading,
    billingError,
    refreshBillingInfo,
    handleSubscription,
    paymentLoading,
    paymentError,
  };
}
