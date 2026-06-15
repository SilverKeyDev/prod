import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { docusignApi } from "packages/features/documents/api/docusign";
import type { DocumentData } from "packages/features/documents/hooks/data/useDocumentsData";
import type { DocusignRevisionUploadBody } from "packages/features/documents/types/docusign";
import { log } from "packages/logger";

import type { SendForSignatureParams } from "@/features/documents/hooks/store/integration/documentsDataIntegrationTypes";

import { getDefaultAgreementTitle } from "./documentSignature";

export type SendForSignatureDeps = {
  queryClient: QueryClient;
  resolveAgreementId: (document: DocumentData) => string | null;
  getSigningFileFromDocument: (
    document: DocumentData
  ) => Promise<{ body: DocusignRevisionUploadBody; fileName: string }>;
};

export async function sendDocumentForSignatureFlow(
  {
    document,
    title,
    signingMethod = "email",
    agreementType = "other",
    buyerId,
    recipientUserId,
  }: SendForSignatureParams,
  deps: SendForSignatureDeps
): Promise<string> {
  const { queryClient, resolveAgreementId, getSigningFileFromDocument } = deps;
  const normalizedTitle = title.trim();
  if (!normalizedTitle) {
    throw new Error("Agreement title is required");
  }

  log.info("DOCUSIGN", "Send for signature started", {
    documentId: document.id,
    libraryKind: document.library_kind,
    signingMethod,
    agreementType,
    buyerId: buyerId ?? document.user_id ?? null,
    recipientUserId: recipientUserId ?? null,
  });

  try {
    if (document.library_kind === "agreement") {
      const agreementId = resolveAgreementId(document);
      if (!agreementId) {
        throw new Error("Unable to resolve agreement id");
      }
      log.info("DOCUSIGN", "Send for signature: existing agreement path", {
        agreementId,
        signingMethod,
        participantUserId: recipientUserId ?? buyerId ?? null,
      });
      const sendResponse = await docusignApi.sendAgreement(agreementId, {
        signing_method: signingMethod,
        participant_user_id: recipientUserId ?? buyerId,
      });
      if (!sendResponse.success) {
        throw new Error(sendResponse.error ?? "Failed to send agreement");
      }
      void queryClient.invalidateQueries({
        queryKey: queryKeys.documents.all,
      });
      log.info("DOCUSIGN", "Send for signature completed (existing agreement)", {
        agreementId,
      });
      return agreementId;
    }

    const resolvedBuyerId = buyerId ?? document.user_id;
    if (!resolvedBuyerId) {
      throw new Error("Unable to determine buyer for this document");
    }

    const createAgreementResponse = await docusignApi.createAgreement({
      title: normalizedTitle,
      agreement_type: agreementType,
      buyer_id: resolvedBuyerId,
      property_address: document.address ?? undefined,
      description: `Generated from uploaded document: ${getDefaultAgreementTitle(document)}`,
    });

    if (!createAgreementResponse.success || !createAgreementResponse.agreement) {
      throw new Error(createAgreementResponse.error ?? "Failed to create agreement");
    }

    const agreementId = createAgreementResponse.agreement.id;
    log.info("DOCUSIGN", "Send for signature: agreement created from upload", {
      agreementId,
      buyerId: resolvedBuyerId,
    });

    const { body, fileName } = await getSigningFileFromDocument(document);
    const revisionResponse = await docusignApi.createRevision(
      agreementId,
      body,
      "Initial revision",
      fileName
    );
    if (!revisionResponse.success || !revisionResponse.revision) {
      throw new Error(revisionResponse.error ?? "Failed to attach revision");
    }
    log.info("DOCUSIGN", "Send for signature: revision attached", {
      agreementId,
      revisionId: revisionResponse.revision.id,
    });

    const sendResponse = await docusignApi.sendAgreement(agreementId, {
      signing_method: signingMethod,
      participant_user_id: recipientUserId ?? resolvedBuyerId,
    });
    if (!sendResponse.success) {
      throw new Error(sendResponse.error ?? "Failed to send agreement");
    }

    void queryClient.invalidateQueries({
      queryKey: queryKeys.documents.all,
    });
    log.info("DOCUSIGN", "Send for signature completed (upload → agreement)", {
      agreementId,
    });
    return agreementId;
  } catch (error: unknown) {
    log.error("ERRORS", "Send for signature failed", {
      error,
      documentId: document.id,
      libraryKind: document.library_kind,
    });
    throw error;
  }
}
