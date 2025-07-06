import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

export const useStripePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscription = async (priceId: string) => {
    setLoading(true);
    setError('');
    
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      // 1. Create a checkout session
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/payment/create-checkout-session`,
        { priceId },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!data || !data.sessionId) {
        throw new Error('Invalid response from server');
      }

      // 2. Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred during checkout';
      setError(errorMessage);
      // You can add a toast here if needed: toast.error(errorMessage);
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
    setError('');
    
    try {
      // 1. Create a portal session
      const { data } = await axios.post('/api/create-portal-session');

      // 2. Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Portal error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      // You can add a toast here if needed: toast.error(errorMessage);
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  };

  return { handlePortal, loading, error };
};
