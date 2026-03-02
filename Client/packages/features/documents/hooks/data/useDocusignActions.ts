import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";

import { docusignApi } from "@/features/documents/api/docusign";
import type {
  Agreement,
  AgreementRevision,
  CreateAgreementRequest,
  SendAgreementResponse,
  SyncTemplatesResponse,
  VoidAgreementResponse,
} from "@/features/documents/types/docusign";

import {
  getDocusignMutationHandlers,
  getDocusignMutationHandlersWithVars,
  runDocusignApi,
} from "./docusignMutationHelpers";

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
 * Hook for DocuSign actions (mutations) with cache invalidation.
 * Provides all mutation operations for agreements, revisions, and templates.
 */
export function useDocusignActions(): UseDocusignActionsReturn {
  const queryClient = useQueryClient();

  const invalidateAgreements = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.docusign.agreements(),
    });
  };

  const invalidateAgreementAndList = (agreementId: string) => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.docusign.agreement(agreementId),
    });
    invalidateAgreements();
  };

  const invalidateTemplates = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.docusign.templates(),
    });
  };

  const createAgreementMutation = useMutation({
    mutationFn: (data: CreateAgreementRequest) =>
      runDocusignApi(
        { data },
        "Failed to create agreement",
        () => docusignApi.createAgreement(data),
        (r) => r.agreement
      ),
    ...getDocusignMutationHandlers(
      "Agreement created successfully",
      "Create agreement mutation failed",
      invalidateAgreements
    ),
  });

  const createRevisionMutation = useMutation({
    mutationFn: ({
      agreementId,
      file,
      notes,
    }: {
      agreementId: string;
      file: File;
      notes?: string;
    }) =>
      runDocusignApi(
        { agreementId, fileName: file.name },
        "Failed to create revision",
        () => docusignApi.createRevision(agreementId, file, notes),
        (r) => r.revision
      ),
    ...getDocusignMutationHandlersWithVars<{ agreementId: string }>(
      "Revision created successfully",
      "Create revision mutation failed",
      (vars) => {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.docusign.agreement(vars.agreementId),
        });
      }
    ),
  });

  const sendAgreementMutation = useMutation({
    mutationFn: ({
      agreementId,
      signingMethod,
    }: {
      agreementId: string;
      signingMethod?: "embedded" | "email";
    }) =>
      runDocusignApi(
        { agreementId, signingMethod },
        "Failed to send agreement",
        () =>
          docusignApi.sendAgreement(agreementId, {
            signing_method: signingMethod,
          }),
        (r) => r
      ),
    ...getDocusignMutationHandlersWithVars<{ agreementId: string }>(
      "Agreement sent successfully",
      "Send agreement mutation failed",
      invalidateAgreementAndList
    ),
  });

  const voidAgreementMutation = useMutation({
    mutationFn: ({ agreementId, reason }: { agreementId: string; reason?: string }) =>
      runDocusignApi(
        { agreementId, reason },
        "Failed to void agreement",
        () => docusignApi.voidAgreement(agreementId, { reason }),
        (r) => r
      ),
    ...getDocusignMutationHandlersWithVars<{ agreementId: string }>(
      "Agreement voided successfully",
      "Void agreement mutation failed",
      invalidateAgreementAndList
    ),
  });

  const getSigningUrlMutation = useMutation({
    mutationFn: ({ agreementId, participantId }: { agreementId: string; participantId: string }) =>
      runDocusignApi(
        { agreementId, participantId },
        "Failed to get signing URL",
        () =>
          docusignApi.getSigningUrl(agreementId, {
            participant_id: participantId,
          }),
        (r) => r.signing_url
      ),
    ...getDocusignMutationHandlersWithVars<{
      agreementId: string;
      participantId: string;
    }>("Signing URL retrieved successfully", "Get signing URL mutation failed", () => {}),
  });

  const syncTemplatesMutation = useMutation({
    mutationFn: () =>
      runDocusignApi(
        {},
        "Failed to sync templates",
        () => docusignApi.syncTemplates(),
        (r) => r
      ),
    ...getDocusignMutationHandlers(
      "Templates synced successfully",
      "Sync templates mutation failed",
      invalidateTemplates
    ),
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
