import { create } from 'zustand';

import type { BillingInfo } from '../schemas/billing';

// import { withDevtools } from './middleware/devtools'; // Temporarily disabled due to TypeScript issues

export type BillingState = {
  // Billing data
  billingInfo: BillingInfo | null;
  billingLoading: boolean;
  billingError: string | null;

  // Payment state
  paymentLoading: boolean;
  paymentError: string | null;

  // Actions
  setBillingInfo: (info: BillingInfo | null) => void;
  setBillingLoading: (loading: boolean) => void;
  setBillingError: (error: string | null) => void;
  setPaymentLoading: (loading: boolean) => void;
  setPaymentError: (error: string | null) => void;

  // Async actions (will be implemented with hooks)
  refreshBillingInfo: () => Promise<void>;
  handleSubscription: (priceId: string) => Promise<void>;

  reset: () => void; // Added by withResettable
};

const initialState = () => ({
  billingInfo: null,
  billingLoading: false,
  billingError: null,
  paymentLoading: false,
  paymentError: null,
});

export const useBillingStore = create<BillingState>()((set) => ({
  ...initialState(),

  setBillingInfo: (info: BillingInfo | null) =>
    set((state) => (state.billingInfo === info ? state : { billingInfo: info })),
  setBillingLoading: (loading: boolean) =>
    set((state) => (state.billingLoading === loading ? state : { billingLoading: loading })),
  setBillingError: (error: string | null) =>
    set((state) => (state.billingError === error ? state : { billingError: error })),
  setPaymentLoading: (loading: boolean) =>
    set((state) => (state.paymentLoading === loading ? state : { paymentLoading: loading })),
  setPaymentError: (error: string | null) =>
    set((state) => (state.paymentError === error ? state : { paymentError: error })),

  // Async actions will be implemented by hooks that use this store
  refreshBillingInfo: async () => {
    // This will be implemented by useStripePayment hook
    console.warn('refreshBillingInfo should be implemented by useStripePayment hook');
    return Promise.resolve();
  },
  handleSubscription: async () => {
    // This will be implemented by useStripePayment hook
    console.warn('handleSubscription should be implemented by useStripePayment hook');
    return Promise.resolve();
  },

  // reset method
  reset: () => set(initialState()),
}));
