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

export { docusignApi } from "./docusignApiImpl";
export type {
  Agreement,
  AgreementEvent,
  AgreementParticipant,
  AgreementRevision,
  AgreementStatus,
  AgreementType,
  CreateAgreementRequest,
  CreateAgreementResponse,
  CreateParticipantRequest,
  CreateParticipantResponse,
  CreateRevisionResponse,
  DocusignCreateTemplateMetadataInput,
  DocusignCreateTemplateResponse,
  DocusignDeleteTemplateResponse,
  DocusignGetTemplateDetailResponse,
  DocusignGetTemplateEditUrlResponse,
  DocusignResendRecipientRequest,
  DocusignResendRecipientResponse,
  DocusignRevisionUploadBody,
  DocusignTemplate,
  DocusignTemplateRoleInfo,
  DocusignTemplateRoleMapEntry,
  DocusignUpdateEnvelopeNotificationRequest,
  DocusignUpdateEnvelopeNotificationResponse,
  GetAgreementResponse,
  GetSenderViewUrlResponse,
  GetSigningUrlRequest,
  GetSigningUrlResponse,
  ListAgreementsResponse,
  ListTemplatesResponse,
  OAuthStartResponse,
  ParticipantRole,
  ParticipantStatus,
  SendAgreementRequest,
  SendAgreementResponse,
  SigningMethod,
  SyncTemplatesResponse,
  VoidAgreementRequest,
  VoidAgreementResponse,
} from "packages/features/documents/types/docusign";
