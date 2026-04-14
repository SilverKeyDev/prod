import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { docusignApi } from "packages/features/documents/api/docusign";
import type {
  Agreement,
  AgreementRevision,
  CreateAgreementRequest,
  DocusignRevisionUploadBody,
  SendAgreementResponse,
  SyncTemplatesResponse,
  VoidAgreementResponse,
} from "packages/features/documents/types/docusign";
import { useUIStore } from "packages/store";

import {
  getDocusignMutationHandlers,
  getDocusignMutationHandlersWithVars,
  runDocusignApi,
} from "./docusignMutationHelpers";

export type UseDocusignActionsReturn = {
  createAgreement: (
    data: CreateAgreementRequest,
  ) => Promise<Agreement | undefined>;
  createRevision: (params: {
    agreementId: string;
    file: DocusignRevisionUploadBody;
    notes?: string;
    uploadFileName?: string;
  }) => Promise<AgreementRevision | undefined>;
  sendAgreement: (params: {
    agreementId: string;
    signing_method?: "embedded" | "email";
    participant_user_id?: string;
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
  isAnyOperationPending: boolean;
};

/**
 * Hook for DocuSign mutation operations with automatic cache invalidation.
 *
 * Provides all create, update, and delete operations for agreements, revisions, and templates.
 * All mutations automatically invalidate relevant React Query caches to keep UI in sync.
 *
 * Each mutation returns a Promise that resolves with the result or rejects with an error.
 * Loading states are tracked individually for each operation, plus an aggregated state.
 *
 * @returns Object containing mutation functions and loading states
 *
 * @example
 * ```typescript
 * function AgreementForm() {
 *   const { createAgreement, isCreatingAgreement } = useDocusignActions();
 *
 *   const handleSubmit = async (data) => {
 *     try {
 *       const agreement = await createAgreement(data);
 *       console.log('Created:', agreement.id);
 *     } catch (error) {
 *       console.error('Failed:', error);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <button disabled={isCreatingAgreement}>Create</button>
 *     </form>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Use aggregated loading state for global UI
 * const { createAgreement, sendAgreement, isAnyOperationPending } = useDocusignActions();
 *
 * if (isAnyOperationPending) {
 *   return <LoadingSpinner />;
 * }
 *
 * // Or disable all actions during any operation
 * <Button disabled={isAnyOperationPending}>Send Agreement</Button>
 * ```
 */
export function useDocusignActions(): UseDocusignActionsReturn {
  const queryClient = useQueryClient();
  const enqueueToast = useUIStore((s) => s.enqueueToast);

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

  const createAgreementMutation = useMutation<
    Agreement | undefined,
    Error,
    CreateAgreementRequest
  >({
    mutationFn: (data: CreateAgreementRequest) =>
      runDocusignApi(
        { data },
        "Failed to create agreement",
        () => docusignApi.createAgreement(data),
        (r) => r.agreement,
      ),
    ...getDocusignMutationHandlers(
      "Agreement created successfully",
      "Create agreement mutation failed",
      invalidateAgreements,
      enqueueToast,
    ),
  });

  const createRevisionMutation = useMutation<
    AgreementRevision | undefined,
    Error,
    {
      agreementId: string;
      file: DocusignRevisionUploadBody;
      notes?: string;
      uploadFileName?: string;
    }
  >({
    mutationFn: ({
      agreementId,
      file,
      notes,
      uploadFileName,
    }: {
      agreementId: string;
      file: DocusignRevisionUploadBody;
      notes?: string;
      uploadFileName?: string;
    }) =>
      runDocusignApi(
        {
          agreementId,
          fileName: uploadFileName ?? "upload",
        },
        "Failed to create revision",
        () =>
          docusignApi.createRevision(agreementId, file, notes, uploadFileName),
        (r) => r.revision,
      ),
    ...getDocusignMutationHandlersWithVars<{ agreementId: string }>(
      "Revision created successfully",
      "Create revision mutation failed",
      (vars) => {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.docusign.agreement(vars.agreementId),
        });
      },
      enqueueToast,
    ),
  });

  const sendAgreementMutation = useMutation<
    SendAgreementResponse,
    Error,
    {
      agreementId: string;
      signing_method?: "embedded" | "email";
      participant_user_id?: string;
    }
  >({
    mutationFn: ({
      agreementId,
      signing_method,
      participant_user_id,
    }: {
      agreementId: string;
      signing_method?: "embedded" | "email";
      participant_user_id?: string;
    }) =>
      runDocusignApi(
        { agreementId, signing_method, participant_user_id },
        "Failed to send agreement",
        () =>
          docusignApi.sendAgreement(agreementId, {
            signing_method,
            participant_user_id,
          }),
        (r) => r,
      ),
    ...getDocusignMutationHandlersWithVars<{ agreementId: string }>(
      "Agreement sent successfully",
      "Send agreement mutation failed",
      (vars) => invalidateAgreementAndList(vars.agreementId),
      enqueueToast,
    ),
  });

  const voidAgreementMutation = useMutation<
    VoidAgreementResponse,
    Error,
    { agreementId: string; reason?: string }
  >({
    mutationFn: ({
      agreementId,
      reason,
    }: {
      agreementId: string;
      reason?: string;
    }) =>
      runDocusignApi(
        { agreementId, reason },
        "Failed to void agreement",
        () => docusignApi.voidAgreement(agreementId, { reason }),
        (r) => r,
      ),
    ...getDocusignMutationHandlersWithVars<{ agreementId: string }>(
      "Agreement voided successfully",
      "Void agreement mutation failed",
      (vars) => invalidateAgreementAndList(vars.agreementId),
      enqueueToast,
    ),
  });

  const getSigningUrlMutation = useMutation<
    string | undefined,
    Error,
    { agreementId: string; participantId: string }
  >({
    mutationFn: ({
      agreementId,
      participantId,
    }: {
      agreementId: string;
      participantId: string;
    }) =>
      runDocusignApi(
        { agreementId, participantId },
        "Failed to get signing URL",
        () =>
          docusignApi.getSigningUrl(agreementId, {
            participant_id: participantId,
          }),
        (r) => r.signing_url,
      ),
    ...getDocusignMutationHandlersWithVars<{
      agreementId: string;
      participantId: string;
    }>(
      "Signing URL retrieved successfully",
      "Get signing URL mutation failed",
      () => {},
      enqueueToast,
    ),
  });

  const syncTemplatesMutation = useMutation<SyncTemplatesResponse, Error, void>(
    {
      mutationFn: () =>
        runDocusignApi(
          {},
          "Failed to sync templates",
          () => docusignApi.syncTemplates(),
          (r) => r,
        ),
      ...getDocusignMutationHandlers(
        "Templates synced successfully",
        "Sync templates mutation failed",
        invalidateTemplates,
        enqueueToast,
      ),
    },
  );

  // Calculate aggregated loading state
  const isAnyOperationPending =
    createAgreementMutation.isPending ||
    createRevisionMutation.isPending ||
    sendAgreementMutation.isPending ||
    voidAgreementMutation.isPending ||
    getSigningUrlMutation.isPending ||
    syncTemplatesMutation.isPending;

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
    isAnyOperationPending,
  };
}
