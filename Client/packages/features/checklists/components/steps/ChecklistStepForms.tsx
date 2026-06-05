/**
 * ChecklistStepForms – agent-only forms for a checklist step (suggested_form_ids).
 * Uses the same document row actions as the forms library (view, DocuSign, download, share).
 */

import { useCallback, useMemo } from "react";

import { useLocalization } from "packages/contexts";
import {
  type ChecklistForm,
  checklistFormsApi,
  checklistFormToDocumentData,
  useChecklistForms,
} from "packages/features/documents";
import { PdfModal } from "packages/features/documents/components/pdf/PdfModalBridge";
import { useDocumentActions } from "packages/features/documents/hooks/data/useDocumentActions";
import { showErrorToast, showSuccessToast } from "packages/hooks/ui";
import { log } from "packages/logger";
import { secureClipboardCopy } from "packages/services/security/clipboardSecurity";
import { Portal } from "packages/ui/components/structure/portal";
import { Box, Text } from "packages/ui/components/structure/primitives";
import DocumentListRow from "packages/ui/components/surfaces/cards/document/DocumentListRow";
import type {
  DocumentCardExternalActionHandlers,
  DocumentData,
} from "packages/ui/components/surfaces/cards/document/types";
import { tryWebShareUrl } from "packages/utils/comms/share";

type ChecklistStepFormsProps = {
  transactionId: string;
  section: string;
  itemId: number;
  isAgent: boolean;
};

export default function ChecklistStepForms({
  transactionId,
  section,
  itemId,
  isAgent,
}: ChecklistStepFormsProps) {
  const { t } = useLocalization();

  const { forms, isLoading, error } = useChecklistForms(transactionId, section, itemId, isAgent);

  const {
    openPdfModal,
    closePdfModal,
    currentPdf,
    currentDocumentName,
    currentDocumentId,
    downloadFile,
  } = useDocumentActions();

  const formById = useMemo(() => {
    const map = new Map<string, ChecklistForm>();
    for (const form of forms) {
      map.set(form.id, form);
    }
    return map;
  }, [forms]);

  const resolveForm = useCallback(
    (documentId: string): ChecklistForm | undefined => formById.get(documentId),
    [formById]
  );

  const handleViewDocument = useCallback(
    (documentId: string, documentName: string) => {
      const form = resolveForm(documentId);
      if (form?.download_url) {
        openPdfModal(form.download_url, documentName, undefined);
        return;
      }
      log.error("ERRORS", "Form has no view URL", { documentId });
    },
    [openPdfModal, resolveForm]
  );

  const handleDownloadDocument = useCallback(
    async (documentId: string, documentName: string) => {
      const form = resolveForm(documentId);
      if (!form?.download_url) {
        log.error("ERRORS", "Form has no download URL", { documentId });
        return;
      }
      try {
        const response = await checklistFormsApi.downloadForm(
          transactionId,
          section,
          itemId,
          form.id
        );
        const safeName = `${documentName
          .replace(/\.pdf$/i, "")
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}.pdf`;
        downloadFile(response.download_url, safeName);
      } catch (err) {
        log.error("ERRORS", "Failed to download form", err);
        showErrorToast(
          t("checklists.download_form_error", {
            defaultValue: "Could not download the form. Please try again.",
          })
        );
      }
    },
    [downloadFile, itemId, resolveForm, section, t, transactionId]
  );

  const handleShareDocument = useCallback(
    async (documentId: string, documentName: string) => {
      const form = resolveForm(documentId);
      if (!form?.download_url) {
        return { success: false, message: "No shareable link for this form." };
      }
      const shareTitle =
        documentName
          .replace(/\.pdf$/i, "")
          .replace(/_/g, " ")
          .trim() || form.title;
      const shareResult = await tryWebShareUrl({
        title: shareTitle,
        text: form.title,
        url: form.download_url,
      });
      if (shareResult === "shared") {
        return { success: true, message: "Shared successfully" };
      }
      if (shareResult === "aborted") {
        return { success: false, message: "Share cancelled" };
      }
      const copied = await secureClipboardCopy(form.download_url);
      if (copied) {
        return { success: true, message: "Link copied to clipboard" };
      }
      return { success: false, message: "Failed to copy link" };
    },
    [resolveForm]
  );

  const handleSendDocusign = useCallback(
    async (form: ChecklistForm) => {
      try {
        const res = await checklistFormsApi.sendForm(transactionId, section, itemId, form.id, {
          method: "docusign",
        });
        if (!res.success) {
          showErrorToast(
            res.error ??
              t("checklists.send_form_docusign_error", {
                defaultValue: "Could not send for signature. Try again.",
              })
          );
          return;
        }
        showSuccessToast(
          t("checklists.send_form_docusign_success", {
            defaultValue: "Sent for signature.",
          })
        );
        log.info("API", "Checklist form sent via DocuSign", {
          formId: form.id,
          agreementId: res.agreement_id,
        });
      } catch (err) {
        log.error("ERRORS", "Failed to send checklist form via DocuSign", err);
        showErrorToast(
          t("checklists.send_form_docusign_error", {
            defaultValue: "Could not send for signature. Try again.",
          })
        );
      }
    },
    [itemId, section, t, transactionId]
  );

  const handleSendForSignatureDoc = useCallback(
    (doc: DocumentData) => {
      const form = resolveForm(doc.id);
      if (form) void handleSendDocusign(form);
    },
    [handleSendDocusign, resolveForm]
  );

  const listActionHandlers: DocumentCardExternalActionHandlers = useMemo(
    () => ({
      handleViewDocument,
      handleDownloadDocument,
      handleShareDocument,
      handleSendForSignature: handleSendForSignatureDoc,
      isAgent: true,
    }),
    [handleDownloadDocument, handleSendForSignatureDoc, handleShareDocument, handleViewDocument]
  );

  if (!isAgent) {
    return null;
  }

  if (isLoading) {
    return (
      <Box className="mt-3 px-4 pb-3">
        <Box className="border-border bg-background-base rounded-lg border p-3">
          <Text className="text-text-secondary text-sm">
            {t("checklists.loading_forms", { defaultValue: "Loading forms..." })}
          </Text>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="mt-3 px-4 pb-3">
        <Box className="border-border bg-background-base rounded-lg border p-3">
          <Text className="text-text-error text-sm">
            {t("checklists.error_loading_forms", {
              defaultValue: "Error loading forms. Please try again.",
            })}
          </Text>
        </Box>
      </Box>
    );
  }

  if (forms.length === 0) {
    return null;
  }

  return (
    <Box className="mt-3 px-4 pb-3">
      <Box className="border-border bg-background-base rounded-lg border p-3">
        <Box className="mb-3">
          <Text className="text-text-primary text-sm font-semibold">
            {t("checklists.forms_for_step", {
              defaultValue: "Forms for this step",
            })}
          </Text>
          <Text className="text-text-secondary mt-1 text-xs">
            {t("checklists.forms_description_agent", {
              defaultValue: "Download forms or send them to your client in Messaging.",
            })}
          </Text>
        </Box>

        <Box className="flex flex-col gap-3">
          {forms.map((form) => (
            <DocumentListRow
              key={form.id}
              doc={checklistFormToDocumentData(form)}
              showDelete={false}
              externalActionHandlers={listActionHandlers}
            />
          ))}
        </Box>

        {currentPdf ? (
          <Portal>
            <PdfModal
              currentPdf={currentPdf}
              currentReportAddress={currentDocumentName}
              reportId={currentDocumentId}
              onClose={closePdfModal}
            />
          </Portal>
        ) : null}
      </Box>
    </Box>
  );
}
