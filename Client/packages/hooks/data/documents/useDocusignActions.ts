import { useMutation, useQueryClient } from "@tanstack/react-query";

import { docusignApi } from "../../../config/api/documents/docusign";
import { queryKeys } from "../../../config/query/keys";
import type {
  CreateAgreementRequest,
  Agreement,
  AgreementRevision,
  SendAgreementResponse,
  VoidAgreementResponse,
  SyncTemplatesResponse,
} from "../../../schemas/documents/docusign";

export type UseDocusignActionsReturn = {
  createAgreement: (data: CreateAgreementRequest) => Promise<Agreement | undefined>;
  createRevision: (params: {
    agreementId: string;
    file: File;
    notes?: string;
  }) => Promise<AgreementRevision | undefined>;
  sendAgreement: (params: {
    agreementId: string;
    signingMethod?: "embedded" | "email";
  }) => Promise<SendAgreementResponse>;
  voidAgreement: (params: {
    agreementId: string;
    reason?: string;
  }) => Promise<VoidAgreementResponse>;
  getSigningUrl: (params: {
    agreementId: string;
    participantId: string;
  }) => Promise<string | undefined>;
  syncTemplates: () => Promise<SyncTemplatesResponse>;
  isCreatingAgreement: boolean;
  isCreatingRevision: boolean;
  isSendingAgreement: boolean;
  isVoidingAgreement: boolean;
  isGettingSigningUrl: boolean;
  isSyncingTemplates: boolean;
};

/**
 * Hook for DocuSign actions (mutations) with cache invalidation
 * Provides all mutation operations for agreements, revisions, and templates
 */
export function useDocusignActions(): UseDocusignActionsReturn {
  const queryClient = useQueryClient();

  // Create agreement mutation
  const createAgreementMutation = useMutation({
    mutationFn: async (data: CreateAgreementRequest) => {
      // Import log here to avoid circular dependencies
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      
      log.debug(LOG_CATEGORIES.API, "Creating agreement", { data });
      const response = await docusignApi.createAgreement(data);
      if (!response.success) {
        const errorMessage = response.error ?? "Failed to create agreement";
        log.error(LOG_CATEGORIES.ERRORS, "Failed to create agreement", {
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
      return response.agreement;
    },
    onSuccess: async () => {
      // Import log here to avoid circular dependencies
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      
      // Invalidate agreements list to show new agreement
      void queryClient.invalidateQueries({
        queryKey: queryKeys.docusign.agreements(),
      });
      log.debug(LOG_CATEGORIES.API, "Agreement created successfully");
    },
    onError: async (error) => {
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      log.error(LOG_CATEGORIES.ERRORS, "Create agreement mutation failed", error);
    },
  });

  // Create revision mutation
  const createRevisionMutation = useMutation({
    mutationFn: async ({
      agreementId,
      file,
      notes,
    }: {
      agreementId: string;
      file: File;
      notes?: string;
    }) => {
      // Import log here to avoid circular dependencies
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      
      log.debug(LOG_CATEGORIES.API, "Creating revision", {
        agreementId,
        fileName: file.name,
      });
      const response = await docusignApi.createRevision(agreementId, file, notes);
      if (!response.success) {
        const errorMessage = response.error ?? "Failed to create revision";
        log.error(LOG_CATEGORIES.ERRORS, "Failed to create revision", {
          agreementId,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
      return response.revision;
    },
    onSuccess: async (_, variables) => {
      // Import log here to avoid circular dependencies
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      
      // Invalidate specific agreement to show new revision
      void queryClient.invalidateQueries({
        queryKey: queryKeys.docusign.agreement(variables.agreementId),
      });
      log.debug(LOG_CATEGORIES.API, "Revision created successfully", {
        agreementId: variables.agreementId,
      });
    },
    onError: async (error) => {
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      log.error(LOG_CATEGORIES.ERRORS, "Create revision mutation failed", error);
    },
  });

  // Send agreement mutation
  const sendAgreementMutation = useMutation({
    mutationFn: async ({
      agreementId,
      signingMethod,
    }: {
      agreementId: string;
      signingMethod?: "embedded" | "email";
    }) => {
      // Import log here to avoid circular dependencies
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      
      log.debug(LOG_CATEGORIES.API, "Sending agreement", {
        agreementId,
        signingMethod,
      });
      const response = await docusignApi.sendAgreement(agreementId, {
        signing_method: signingMethod,
      });
      if (!response.success) {
        const errorMessage = response.error ?? "Failed to send agreement";
        log.error(LOG_CATEGORIES.ERRORS, "Failed to send agreement", {
          agreementId,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: async (_, variables) => {
      // Import log here to avoid circular dependencies
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      
      // Invalidate specific agreement and list (status changed)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.docusign.agreement(variables.agreementId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.docusign.agreements(),
      });
      log.debug(LOG_CATEGORIES.API, "Agreement sent successfully", {
        agreementId: variables.agreementId,
      });
    },
    onError: async (error) => {
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      log.error(LOG_CATEGORIES.ERRORS, "Send agreement mutation failed", error);
    },
  });

  // Void agreement mutation
  const voidAgreementMutation = useMutation({
    mutationFn: async ({
      agreementId,
      reason,
    }: {
      agreementId: string;
      reason?: string;
    }) => {
      // Import log here to avoid circular dependencies
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      
      log.debug(LOG_CATEGORIES.API, "Voiding agreement", {
        agreementId,
        reason,
      });
      const response = await docusignApi.voidAgreement(agreementId, { reason });
      if (!response.success) {
        const errorMessage = response.error ?? "Failed to void agreement";
        log.error(LOG_CATEGORIES.ERRORS, "Failed to void agreement", {
          agreementId,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: async (_, variables) => {
      // Import log here to avoid circular dependencies
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      
      // Invalidate specific agreement and list (status changed)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.docusign.agreement(variables.agreementId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.docusign.agreements(),
      });
      log.debug(LOG_CATEGORIES.API, "Agreement voided successfully", {
        agreementId: variables.agreementId,
      });
    },
    onError: async (error) => {
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      log.error(LOG_CATEGORIES.ERRORS, "Void agreement mutation failed", error);
    },
  });

  // Get signing URL mutation
  const getSigningUrlMutation = useMutation({
    mutationFn: async ({
      agreementId,
      participantId,
    }: {
      agreementId: string;
      participantId: string;
    }) => {
      // Import log here to avoid circular dependencies
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      
      log.debug(LOG_CATEGORIES.API, "Getting signing URL", {
        agreementId,
        participantId,
      });
      const response = await docusignApi.getSigningUrl(agreementId, {
        participant_id: participantId,
      });
      if (!response.success) {
        const errorMessage = response.error ?? "Failed to get signing URL";
        log.error(LOG_CATEGORIES.ERRORS, "Failed to get signing URL", {
          agreementId,
          participantId,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
      return response.signing_url;
    },
    onSuccess: async (_, variables) => {
      // Import log here to avoid circular dependencies
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      
      log.debug(LOG_CATEGORIES.API, "Signing URL retrieved successfully", {
        agreementId: variables.agreementId,
        participantId: variables.participantId,
      });
    },
    onError: async (error) => {
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      log.error(LOG_CATEGORIES.ERRORS, "Get signing URL mutation failed", error);
    },
  });

  // Sync templates mutation
  const syncTemplatesMutation = useMutation({
    mutationFn: async () => {
      // Import log here to avoid circular dependencies
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      
      log.debug(LOG_CATEGORIES.API, "Syncing templates");
      const response = await docusignApi.syncTemplates();
      if (!response.success) {
        const errorMessage = response.error ?? "Failed to sync templates";
        log.error(LOG_CATEGORIES.ERRORS, "Failed to sync templates", {
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }
      return response;
    },
    onSuccess: async () => {
      // Import log here to avoid circular dependencies
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      
      // Invalidate templates list to show updated templates
      void queryClient.invalidateQueries({
        queryKey: queryKeys.docusign.templates(),
      });
      log.debug(LOG_CATEGORIES.API, "Templates synced successfully");
    },
    onError: async (error) => {
      const { log, LOG_CATEGORIES } = await import("../../../../logger");
      log.error(LOG_CATEGORIES.ERRORS, "Sync templates mutation failed", error);
    },
  });

  return {
    createAgreement: createAgreementMutation.mutateAsync,
    createRevision: createRevisionMutation.mutateAsync,
    sendAgreement: sendAgreementMutation.mutateAsync,
    voidAgreement: voidAgreementMutation.mutateAsync,
    getSigningUrl: getSigningUrlMutation.mutateAsync,
    syncTemplates: syncTemplatesMutation.mutateAsync,
    isCreatingAgreement: createAgreementMutation.isPending,
    isCreatingRevision: createRevisionMutation.isPending,
    isSendingAgreement: sendAgreementMutation.isPending,
    isVoidingAgreement: voidAgreementMutation.isPending,
    isGettingSigningUrl: getSigningUrlMutation.isPending,
    isSyncingTemplates: syncTemplatesMutation.isPending,
  };
}
