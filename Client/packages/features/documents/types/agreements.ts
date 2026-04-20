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

import type { components } from "packages/types/api.generated";

// Re-export all agreement types from generated schema
export type AgreementStatus = components["schemas"]["AgreementStatus"];
export type AgreementType = components["schemas"]["AgreementType"];
export type ParticipantRole = components["schemas"]["ParticipantRole"];
export type SigningMethod = components["schemas"]["SigningMethod"];
export type ParticipantStatus = components["schemas"]["ParticipantStatus"];

export type Agreement = components["schemas"]["Agreement"];
export type AgreementRevision = components["schemas"]["AgreementRevision"];
export type AgreementParticipant = components["schemas"]["AgreementParticipant"];
export type AgreementEvent = components["schemas"]["AgreementEvent"];
export type DocusignTemplate = components["schemas"]["DocusignTemplate"];

export type CreateAgreementRequest = components["schemas"]["CreateAgreementRequest"];
export type SendAgreementRequest = components["schemas"]["SendAgreementRequest"];
export type DocusignResendRecipientRequest =
  components["schemas"]["DocusignResendRecipientRequest"];
export type DocusignResendRecipientResponse =
  components["schemas"]["DocusignResendRecipientResponse"];
export type DocusignUpdateEnvelopeNotificationRequest =
  components["schemas"]["DocusignUpdateEnvelopeNotificationRequest"];
export type DocusignUpdateEnvelopeNotificationResponse =
  components["schemas"]["DocusignUpdateEnvelopeNotificationResponse"];
export type VoidAgreementRequest = components["schemas"]["VoidAgreementRequest"];
export type GetSigningUrlRequest = components["schemas"]["GetSigningUrlRequest"];

export type CreateAgreementResponse = components["schemas"]["CreateAgreementResponse"];
export type GetAgreementResponse = components["schemas"]["GetAgreementResponse"];
export type ListAgreementsResponse = components["schemas"]["ListAgreementsResponse"];
export type CreateRevisionResponse = components["schemas"]["CreateRevisionResponse"];
export type SendAgreementResponse = components["schemas"]["SendAgreementResponse"];
export type VoidAgreementResponse = components["schemas"]["VoidAgreementResponse"];
export type GetSigningUrlResponse = components["schemas"]["GetSigningUrlResponse"];
export type GetSenderViewUrlResponse = components["schemas"]["GetSenderViewUrlResponse"];
export type ListTemplatesResponse = components["schemas"]["ListTemplatesResponse"];
export type SyncTemplatesResponse = components["schemas"]["SyncTemplatesResponse"];
export type OAuthStartResponse = components["schemas"]["OAuthStartResponse"];
