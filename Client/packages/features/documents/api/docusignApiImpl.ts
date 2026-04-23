/**
 * DocuSign HTTP client implementation (see `docusign.ts` for public entry + type re-exports).
 */
import type {
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
  DocusignUpdateEnvelopeNotificationRequest,
  DocusignUpdateEnvelopeNotificationResponse,
  GetAgreementResponse,
  GetSenderViewUrlResponse,
  GetSigningUrlRequest,
  GetSigningUrlResponse,
  ListAgreementsResponse,
  ListTemplatesResponse,
  OAuthStartResponse,
  SendAgreementRequest,
  SendAgreementResponse,
  SyncTemplatesResponse,
  VoidAgreementRequest,
  VoidAgreementResponse,
} from "packages/features/documents/types/docusign";
import { log, LOG_CATEGORIES } from "packages/logger";
import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  apiUpload,
} from "packages/services/http/compatibility";

function resolveRevisionUploadFileName(fileName?: string): string {
  const name = fileName?.trim();
  if (name && name.toLowerCase() !== "blob") {
    return name;
  }
  return "agreement.pdf";
}

export const docusignApi = {
  createAgreement: (data: CreateAgreementRequest): Promise<CreateAgreementResponse> => {
    log.debug(LOG_CATEGORIES.DOCUSIGN, "Creating DocuSign agreement", {
      title: data.title,
      agreement_type: data.agreement_type,
      buyer_id: data.buyer_id,
      has_property_address: !!data.property_address,
    });
    return apiPost<CreateAgreementResponse>("/api/v1/docusign/agreements", data);
  },

  getAgreement: (agreementId: string): Promise<GetAgreementResponse> => {
    log.debug(LOG_CATEGORIES.DOCUSIGN, "Fetching DocuSign agreement", {
      agreementId,
    });
    return apiGet<GetAgreementResponse>(`/api/v1/docusign/agreements/${agreementId}`);
  },

  listAgreements: (): Promise<ListAgreementsResponse> => {
    log.debug(LOG_CATEGORIES.DOCUSIGN, "Fetching DocuSign agreements list");
    return apiGet<ListAgreementsResponse>("/api/v1/docusign/agreements");
  },

  createRevision: (
    agreementId: string,
    file: DocusignRevisionUploadBody,
    notes?: string,
    uploadFileName?: string
  ): Promise<CreateRevisionResponse> => {
    const uploadName = resolveRevisionUploadFileName(uploadFileName);
    log.debug(LOG_CATEGORIES.DOCUSIGN, "Creating DocuSign revision", {
      agreementId,
      fileName: uploadName,
      fileSize: file.size,
      fileType: file.type,
      hasNotes: !!notes,
    });

    const formData = new FormData();
    formData.append("file", file, uploadName);
    if (notes) {
      formData.append("notes", notes);
    }

    return apiUpload<CreateRevisionResponse>(
      `/api/v1/docusign/agreements/${agreementId}/revisions`,
      formData
    );
  },

  sendAgreement: (
    agreementId: string,
    data?: SendAgreementRequest
  ): Promise<SendAgreementResponse> => {
    const requestData: SendAgreementRequest = {
      signing_method: data?.signing_method ?? "embedded",
      participant_user_id: data?.participant_user_id,
      ...(data?.envelope_notification != null
        ? { envelope_notification: data.envelope_notification }
        : {}),
      ...(data?.tab_prefill != null ? { tab_prefill: data.tab_prefill } : {}),
      ...(data?.envelope_prefill_tabs != null
        ? { envelope_prefill_tabs: data.envelope_prefill_tabs }
        : {}),
    };

    log.info(LOG_CATEGORIES.DOCUSIGN, "Sending DocuSign agreement for signature", {
      agreementId,
      signingMethod: requestData.signing_method,
      participantUserId: requestData.participant_user_id,
      hasEnvelopeNotification: requestData.envelope_notification != null,
      hasTabPrefill: requestData.tab_prefill != null,
      hasEnvelopePrefillTabs: requestData.envelope_prefill_tabs != null,
    });

    return apiPost<SendAgreementResponse>(
      `/api/v1/docusign/agreements/${agreementId}/send`,
      requestData
    );
  },

  resendAgreementRecipient: (
    agreementId: string,
    body: DocusignResendRecipientRequest
  ): Promise<DocusignResendRecipientResponse> => {
    log.info(LOG_CATEGORIES.DOCUSIGN, "Resending DocuSign recipient email", {
      agreementId,
      participantId: body.participant_id,
      hasNote: Boolean(body.note?.trim()),
    });
    return apiPost<DocusignResendRecipientResponse>(
      `/api/v1/docusign/agreements/${agreementId}/resend`,
      body
    );
  },

  updateAgreementEnvelopeNotification: (
    agreementId: string,
    body: DocusignUpdateEnvelopeNotificationRequest
  ): Promise<DocusignUpdateEnvelopeNotificationResponse> => {
    log.info(LOG_CATEGORIES.DOCUSIGN, "Updating DocuSign envelope notification settings", {
      agreementId,
    });
    return apiPut<DocusignUpdateEnvelopeNotificationResponse>(
      `/api/v1/docusign/agreements/${agreementId}/notification`,
      body
    );
  },

  voidAgreement: (
    agreementId: string,
    data?: VoidAgreementRequest
  ): Promise<VoidAgreementResponse> => {
    log.warn(LOG_CATEGORIES.DOCUSIGN, "Voiding DocuSign agreement", {
      agreementId,
      reason: data?.reason ?? "No reason provided",
    });
    return apiPost<VoidAgreementResponse>(
      `/api/v1/docusign/agreements/${agreementId}/void`,
      data ?? {}
    );
  },

  discardAgreement: (
    agreementId: string,
    data?: VoidAgreementRequest
  ): Promise<VoidAgreementResponse> => {
    log.info(LOG_CATEGORIES.DOCUSIGN, "Discarding DocuSign agreement from Saved", {
      agreementId,
      reason: data?.reason ?? "No reason provided",
    });
    return apiPost<VoidAgreementResponse>(
      `/api/v1/docusign/agreements/${agreementId}/discard`,
      data ?? {}
    );
  },

  getSigningUrl: (
    agreementId: string,
    data: GetSigningUrlRequest
  ): Promise<GetSigningUrlResponse> => {
    log.debug(LOG_CATEGORIES.DOCUSIGN, "Getting DocuSign signing URL", {
      agreementId,
      participantId: data.participant_id,
    });
    return apiPost<GetSigningUrlResponse>(
      `/api/v1/docusign/agreements/${agreementId}/signing-url`,
      data
    );
  },

  getSenderViewUrl: (agreementId: string): Promise<GetSenderViewUrlResponse> => {
    log.debug(LOG_CATEGORIES.DOCUSIGN, "Getting DocuSign sender view URL", {
      agreementId,
    });
    return apiGet<GetSenderViewUrlResponse>(
      `/api/v1/docusign/agreements/${agreementId}/sender-view`
    );
  },

  listTemplates: (): Promise<ListTemplatesResponse> => {
    log.debug(LOG_CATEGORIES.DOCUSIGN, "Fetching DocuSign templates");
    return apiGet<ListTemplatesResponse>("/api/v1/docusign/templates");
  },

  createTemplate: (params: {
    metadata: DocusignCreateTemplateMetadataInput;
    files: File[];
  }): Promise<DocusignCreateTemplateResponse> => {
    const formData = new FormData();
    formData.append("metadata", JSON.stringify(params.metadata));
    for (const file of params.files) {
      formData.append("files", file);
    }
    return apiUpload<DocusignCreateTemplateResponse>("/api/v1/docusign/templates", formData);
  },

  getTemplateDetail: (templateId: string): Promise<DocusignGetTemplateDetailResponse> => {
    const id = encodeURIComponent(templateId);
    return apiGet<DocusignGetTemplateDetailResponse>(`/api/v1/docusign/templates/${id}`);
  },

  deleteTemplate: (templateId: string): Promise<DocusignDeleteTemplateResponse> => {
    const id = encodeURIComponent(templateId);
    return apiDelete<DocusignDeleteTemplateResponse>(`/api/v1/docusign/templates/${id}`);
  },

  getTemplateEditUrl: (templateId: string): Promise<DocusignGetTemplateEditUrlResponse> => {
    const id = encodeURIComponent(templateId);
    return apiGet<DocusignGetTemplateEditUrlResponse>(`/api/v1/docusign/templates/${id}/edit-url`);
  },

  addAgreementParticipant: (
    agreementId: string,
    body: CreateParticipantRequest
  ): Promise<CreateParticipantResponse> => {
    return apiPost<CreateParticipantResponse>(
      `/api/v1/docusign/agreements/${agreementId}/participants`,
      body
    );
  },

  syncTemplates: (): Promise<SyncTemplatesResponse> => {
    log.info(LOG_CATEGORIES.DOCUSIGN, "Syncing DocuSign templates from DocuSign account");
    return apiPost<SyncTemplatesResponse>("/api/v1/docusign/templates/sync", {});
  },

  startOAuth: (): Promise<OAuthStartResponse> => {
    log.info(LOG_CATEGORIES.DOCUSIGN, "Starting DocuSign OAuth connection flow");
    return apiGet<OAuthStartResponse>("/api/v1/docusign/oauth/start");
  },

  getDownloadUrl: (agreementId: string): Promise<{ download_url: string }> => {
    log.debug(LOG_CATEGORIES.DOCUSIGN, "Getting signed document download URL", {
      agreementId,
    });
    return apiGet<{ download_url: string }>(`/api/v1/docusign/agreements/${agreementId}/download`);
  },
};
