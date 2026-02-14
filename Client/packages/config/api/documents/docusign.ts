import {
  apiGet,
  apiPost,
  apiUpload,
} from "../../../services/http/compatibility";
import { log, LOG_CATEGORIES } from "../../../../logger";

// Import types from schemas
import type {
  CreateAgreementRequest,
  CreateAgreementResponse,
  GetAgreementResponse,
  ListAgreementsResponse,
  SendAgreementRequest,
  SendAgreementResponse,
  VoidAgreementRequest,
  VoidAgreementResponse,
  GetSigningUrlRequest,
  GetSigningUrlResponse,
  CreateRevisionResponse,
  ListTemplatesResponse,
  SyncTemplatesResponse,
  OAuthStartResponse,
} from "../../../schemas/documents/docusign";

/**
 * DocuSign API client using centralized utilities
 */
export const docusignApi = {
  /**
   * Create a new agreement
   */
  createAgreement: (
    data: CreateAgreementRequest,
  ): Promise<CreateAgreementResponse> => {
    log.debug(LOG_CATEGORIES.API, "Creating DocuSign agreement", { data });
    return apiPost<CreateAgreementResponse>(
      "/api/v1/docusign/agreements",
      data,
    );
  },

  /**
   * Get a specific agreement by ID
   */
  getAgreement: (agreementId: string): Promise<GetAgreementResponse> => {
    log.debug(LOG_CATEGORIES.API, "Fetching DocuSign agreement", {
      agreementId,
    });
    return apiGet<GetAgreementResponse>(
      `/api/v1/docusign/agreements/${agreementId}`,
    );
  },

  /**
   * List all agreements for current user
   */
  listAgreements: (): Promise<ListAgreementsResponse> => {
    log.debug(LOG_CATEGORIES.API, "Fetching DocuSign agreements list");
    return apiGet<ListAgreementsResponse>("/api/v1/docusign/agreements");
  },

  /**
   * Create a new revision for an agreement
   */
  createRevision: (
    agreementId: string,
    file: File,
    notes?: string,
  ): Promise<CreateRevisionResponse> => {
    log.debug(LOG_CATEGORIES.API, "Creating DocuSign revision", {
      agreementId,
      fileName: file.name,
      fileSize: file.size,
    });

    const formData = new FormData();
    formData.append("file", file);
    if (notes) {
      formData.append("notes", notes);
    }

    return apiUpload<CreateRevisionResponse>(
      `/api/v1/docusign/agreements/${agreementId}/revisions`,
      formData,
    );
  },

  /**
   * Send agreement for signature
   */
  sendAgreement: (
    agreementId: string,
    data?: SendAgreementRequest,
  ): Promise<SendAgreementResponse> => {
    log.debug(LOG_CATEGORIES.API, "Sending DocuSign agreement", {
      agreementId,
      signingMethod: data?.signing_method,
    });
    return apiPost<SendAgreementResponse>(
      `/api/v1/docusign/agreements/${agreementId}/send`,
      data ?? {},
    );
  },

  /**
   * Void an agreement
   */
  voidAgreement: (
    agreementId: string,
    data?: VoidAgreementRequest,
  ): Promise<VoidAgreementResponse> => {
    log.debug(LOG_CATEGORIES.API, "Voiding DocuSign agreement", {
      agreementId,
      reason: data?.reason,
    });
    return apiPost<VoidAgreementResponse>(
      `/api/v1/docusign/agreements/${agreementId}/void`,
      data ?? {},
    );
  },

  /**
   * Get embedded signing URL for a participant
   */
  getSigningUrl: (
    agreementId: string,
    data: GetSigningUrlRequest,
  ): Promise<GetSigningUrlResponse> => {
    log.debug(LOG_CATEGORIES.API, "Getting DocuSign signing URL", {
      agreementId,
      participantId: data.participant_id,
    });
    return apiPost<GetSigningUrlResponse>(
      `/api/v1/docusign/agreements/${agreementId}/signing-url`,
      data,
    );
  },

  /**
   * List available DocuSign templates
   */
  listTemplates: (): Promise<ListTemplatesResponse> => {
    log.debug(LOG_CATEGORIES.API, "Fetching DocuSign templates");
    return apiGet<ListTemplatesResponse>("/api/v1/docusign/templates");
  },

  /**
   * Sync templates from DocuSign
   */
  syncTemplates: (): Promise<SyncTemplatesResponse> => {
    log.debug(LOG_CATEGORIES.API, "Syncing DocuSign templates");
    return apiPost<SyncTemplatesResponse>(
      "/api/v1/docusign/templates/sync",
      {},
    );
  },

  /**
   * Start DocuSign OAuth flow
   */
  startOAuth: (): Promise<OAuthStartResponse> => {
    log.debug(LOG_CATEGORIES.API, "Starting DocuSign OAuth flow");
    return apiGet<OAuthStartResponse>("/api/v1/docusign/oauth/start");
  },
};

// Re-export types for convenience
export type {
  CreateAgreementRequest,
  CreateAgreementResponse,
  GetAgreementResponse,
  ListAgreementsResponse,
  SendAgreementRequest,
  SendAgreementResponse,
  VoidAgreementRequest,
  VoidAgreementResponse,
  GetSigningUrlRequest,
  GetSigningUrlResponse,
  CreateRevisionResponse,
  ListTemplatesResponse,
  SyncTemplatesResponse,
  OAuthStartResponse,
} from "../../../schemas/documents/docusign";
