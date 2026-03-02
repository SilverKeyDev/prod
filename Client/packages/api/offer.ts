import { apiPost } from "packages/services/http/compatibility";

import type { PropertyAnalysis } from "@/features/search/types/property";

// Types for offer/negotiation API
export type NegotiationStrategyRequest = {
  address: string;
  user_id?: string; // For agent client selection
};

export type PropertyData = {
  streetAddress?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  price?: number;
  listPrice?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  baths?: number;
  livingArea?: number;
  sqft?: number;
  propertyType?: string;
  homeType?: string;
  lotAreaValue?: number;
  lotAreaUnit?: string;
  listingStatus?: string;
};

export type CommuteData = {
  travel_times: Array<{
    name: string;
    address: string;
    travel_time: string;
    commute_tolerance: number;
  }>;
  property_address: string;
};

export type NegotiationStrategyResponse = {
  success: boolean;
  strategy: unknown;
  property_address: string;
  strategy_id: string;
  filename: string;
  generated_at: string;
  generated_for_user: string;
  property_data?: PropertyData;
  commute_data?: CommuteData;
  property_analysis?: PropertyAnalysis;
  error?: string;
  traceback?: string;
};

export type PurchaseAgreementRequest = {
  property_address: string;
  offer_price: number;
  earnest_money: number;
  closing_date: string;
  contingencies: string[];
  exclusions?: string[];
  buyer_info: {
    name: string;
    email: string;
    phone: string;
  };
};

export type PreApprovalLetterRequest = {
  buyer_name: string;
  loan_amount: number;
  property_address: string;
  loan_type: string;
};

export type EarnestMoneyRequest = {
  property_address: string;
  earnest_amount: number;
  escrow_company: string;
};

export type CoverLetterRequest = {
  property_address: string;
  buyer_story: string;
  offer_highlights: string[];
};

export type DocumentResponse = {
  success: boolean;
  document_url?: string;
  document_id?: string;
  filename?: string;
  error?: string;
};

/**
 * Offer/Negotiation API client using centralized utilities
 */
export const offerApi = {
  /**
   * Generate a negotiation strategy for a specific property
   */
  generateStrategy: (
    data: NegotiationStrategyRequest,
    options?: { signal?: AbortSignal }
  ): Promise<NegotiationStrategyResponse> =>
    apiPost<NegotiationStrategyResponse>("/api/v1/offer/generate-strategy", data, {
      timeout: 300000,
      ...options,
    }),

  /**
   * Generate a purchase agreement document
   */
  generatePurchaseAgreement: (data: PurchaseAgreementRequest): Promise<DocumentResponse> =>
    apiPost<DocumentResponse>("/api/v1/offer/purchase-agreement", data),

  /**
   * Generate a pre-approval letter
   */
  generatePreApprovalLetter: (data: PreApprovalLetterRequest): Promise<DocumentResponse> =>
    apiPost<DocumentResponse>("/api/v1/offer/pre-approval-letter", data),

  /**
   * Generate earnest money instructions
   */
  generateEarnestMoneyInstructions: (data: EarnestMoneyRequest): Promise<DocumentResponse> =>
    apiPost<DocumentResponse>("/api/v1/offer/earnest-money-instructions", data),

  /**
   * Generate a cover letter for the offer
   */
  generateCoverLetter: (data: CoverLetterRequest): Promise<DocumentResponse> =>
    apiPost<DocumentResponse>("/api/v1/offer/cover-letter", data),
};
