import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { paymentApi } from "../../config/api";
import { queryKeys } from "../../config/query/keys";
import { useAuth } from "../../contexts";

// Mock Stripe implementation - Stripe integration has been removed
const mockStripePromise = Promise.resolve(null);

export const useStripePayment = () => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, authReady } = useAuth();

  // Billing info query
  const {
    data: billingInfo,
    isLoading: billingLoading,
    error: billingError,
  } = useQuery({
    queryKey: queryKeys.billing.subscription(),
    queryFn: async () => {
      const billingData = await paymentApi.getBillingInfo();
      return billingData;
    },
    enabled: authReady && isAuthenticated,
    select: (data) => data,
  });

  // Create checkout session mutation
  const createCheckoutSessionMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await paymentApi.createCheckoutSession({ priceId });

      if (!response.sessionId) {
        throw new Error("Failed to create checkout session");
      }

      return response;
    },
    onSuccess: () => {
      // Invalidate billing info after successful checkout
      void queryClient.invalidateQueries({
        queryKey: queryKeys.billing.subscription(),
      });
    },
  });

  const handleSubscription = async (priceId: string) => {
    setLoading(true);
    setError("");

    try {
      // Stripe integration removed - show error message
      throw new Error("Payment processing is currently unavailable. Stripe integration has been removed.");
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred during checkout";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cross-tab auth changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "id_token") {
        if (e.newValue) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.billing.subscription(),
          });
        } else {
          // Clear everything
          void queryClient.removeQueries({
            queryKey: queryKeys.billing.subscription(),
          });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [queryClient]);

  return {
    handleSubscription,
    loading,
    error,
    billingInfo: billingInfo ?? null,
    billingLoading,
    billingError: billingError?.message ?? null,
    refreshBillingInfo: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.billing.subscription(),
      });
    },
  };
};

export const useStripePortal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePortal = async () => {
    setLoading(true);
    setError("");

    try {
      // Stripe integration removed - show error message
      throw new Error("Customer portal is currently unavailable. Stripe integration has been removed.");
    } catch (err: unknown) {
      console.error("Portal error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while accessing the customer portal";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { handlePortal, loading, error };
};
