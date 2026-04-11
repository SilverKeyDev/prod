/**
 * MIGRATION SHIM (DO NOT ADD NEW TYPES HERE)
 *
 * This file re-exports types from the generated API contract (api.generated.ts).
 * All type definitions have been moved to openapi.yaml.
 *
 * To add/modify API types:
 * 1. Edit openapi.yaml
 * 2. Run `pnpm generate:api-types`
 * 3. Types will be auto-generated in packages/types/api.generated.ts
 *
 * This shim maintains backward compatibility for existing imports.
 */

import { apiPost } from "packages/services/http/compatibility";
import type { components } from "packages/types/api.generated";

// Re-export types from generated schema
export type NegotiationStrategyRequest =
  components["schemas"]["NegotiationStrategyRequest"];
export type PropertyData = components["schemas"]["PropertyData"];
export type CommuteData = components["schemas"]["CommuteData"];
export type NegotiationStrategyResponse =
  components["schemas"]["NegotiationStrategyResponse"];
export type PreApprovalLetterRequest =
  components["schemas"]["PreApprovalLetterRequest"];
export type EarnestMoneyRequest = components["schemas"]["EarnestMoneyRequest"];
export type CoverLetterRequest = components["schemas"]["CoverLetterRequest"];
export type OfferDocumentGenerationResponse =
  components["schemas"]["OfferDocumentGenerationResponse"];

/**
 * Offer/Negotiation API client using centralized utilities
 */
export const offerApi = {
  /**
   * Generate a negotiation strategy for a specific property
   */
  generateStrategy: (
    data: NegotiationStrategyRequest,
    options?: { signal?: AbortSignal },
  ): Promise<NegotiationStrategyResponse> =>
    apiPost<NegotiationStrategyResponse>(
      "/api/v1/offer/generate-strategy",
      data,
      {
        timeout: 300000,
        ...options,
      },
    ),

  /**
   * Generate a pre-approval letter
   */
  generatePreApprovalLetter: (
    data: PreApprovalLetterRequest,
  ): Promise<OfferDocumentGenerationResponse> =>
    apiPost<OfferDocumentGenerationResponse>(
      "/api/v1/offer/pre-approval-letter",
      data,
    ),

  /**
   * Generate earnest money instructions
   */
  generateEarnestMoneyInstructions: (
    data: EarnestMoneyRequest,
  ): Promise<OfferDocumentGenerationResponse> =>
    apiPost<OfferDocumentGenerationResponse>(
      "/api/v1/offer/earnest-money-instructions",
      data,
    ),

  /**
   * Generate a cover letter for the offer
   */
  generateCoverLetter: (
    data: CoverLetterRequest,
  ): Promise<OfferDocumentGenerationResponse> =>
    apiPost<OfferDocumentGenerationResponse>(
      "/api/v1/offer/cover-letter",
      data,
    ),
};
