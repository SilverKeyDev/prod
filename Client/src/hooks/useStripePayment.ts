import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "../api/utils/index";

// Initialize Stripe with your publishable key
// Conditionally load Stripe only on HTTPS to avoid errors in local HTTP dev
const getStripeKey = () => {
  const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!key) {
    console.warn(
      "VITE_STRIPE_PUBLIC_KEY not configured - Stripe payments disabled",
    );
    return null;
  }
  return key;
};

const stripePromise =
  window.location.protocol === "https:"
    ? (() => {
        const key = getStripeKey();
        return key ? loadStripe(key) : Promise.resolve(null);
      })()
    : Promise.resolve(null);

export const useStripePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscription = async (priceId: string) => {
    setLoading(true);
    setError("");

    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to initialize");
      }

      // 1. Create a checkout session using our API client
      const response = await apiRequest<{ sessionId: string; url: string }>(
        "/api/v1/payment/create-checkout-session",
        {
          method: "POST",
          body: JSON.stringify({ priceId }),
        },
      );

      if (!response.sessionId) {
        throw new Error("Failed to create checkout session");
      }

      // 2. Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: response.sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      const errorMessage = err.message || "An error occurred during checkout";
      setError(errorMessage);
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  };

  return { handleSubscription, loading, error };
};

export const useStripePortal = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePortal = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Create a portal session using our API client
      const response = await apiRequest<{ url: string }>(
        "/api/v1/payment/create-portal-session",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );

      if (!response.url) {
        throw new Error("Failed to create portal session");
      }

      // 2. Redirect to Stripe Portal
      window.location.href = response.url;
    } catch (err: any) {
      console.error("Portal error:", err);
      const errorMessage =
        err.message || "An error occurred while accessing the customer portal";
      setError(errorMessage);
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  };

  return { handlePortal, loading, error };
};
