import { useCallback, useEffect, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import {
  buildFormIdMap,
  buildProcessedFormCategories,
} from "packages/features/documents/components/forms/formsBrowser/formsBrowserModel";
import { useDocumentActions } from "packages/features/documents/hooks/data/useDocumentActions";
import { useFormsLibrary } from "packages/features/documents/hooks/data/useFormsLibrary";
import type { ChecklistForm } from "packages/features/documents/types/forms";
import { log } from "packages/logger";
import { secureClipboardCopy } from "packages/services/security/clipboardSecurity";
import type { DocumentCardExternalActionHandlers } from "packages/ui/components/surfaces/cards/document/types";
import { tryWebShareUrl } from "packages/utils/comms/share";

export type UseFormsBrowserControllerArgs = {
  searchTerm?: string;
  librarySortKey?: string;
  onSendForSignature?: (form: ChecklistForm) => void;
};

export function useFormsBrowserController({
  searchTerm = "",
  librarySortKey = "date_desc",
  onSendForSignature,
}: UseFormsBrowserControllerArgs) {
  const { t } = useLocalization();
  const { categories, isLoading, error } = useFormsLibrary();
  const {
    openPdfModal,
    closePdfModal,
    currentPdf,
    currentDocumentName,
    currentDocumentId,
    downloadFile,
  } = useDocumentActions();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const processedCategories = useMemo(
    () => buildProcessedFormCategories(categories, librarySortKey, searchTerm),
    [categories, librarySortKey, searchTerm]
  );

  const formById = useMemo(() => buildFormIdMap(processedCategories), [processedCategories]);

  useEffect(() => {
    if (selectedCategory == null) return;
    const cat = processedCategories.find((c) => c.name === selectedCategory);
    if (!cat || cat.forms.length === 0) {
      setSelectedCategory(null);
    }
  }, [processedCategories, selectedCategory]);

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
      const safeName = `${documentName
        .replace(/\.pdf$/i, "")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.pdf`;
      downloadFile(form.download_url, safeName);
    },
    [downloadFile, resolveForm]
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

  const libraryActionHandlers: DocumentCardExternalActionHandlers = useMemo(
    () => ({
      handleViewDocument,
      handleDownloadDocument,
      handleShareDocument,
      handleSendForSignature: onSendForSignature
        ? (doc) => {
            const form = resolveForm(doc.id);
            if (form) onSendForSignature(form);
          }
        : undefined,
      isAgent: true,
    }),
    [
      handleDownloadDocument,
      handleShareDocument,
      handleViewDocument,
      onSendForSignature,
      resolveForm,
    ]
  );

  const logFormSelected = useCallback((form: ChecklistForm) => {
    log.info("API", "Form selected from library", {
      formId: form.id,
      formKey: form.form_key,
    });
  }, []);

  return {
    t,
    categories,
    isLoading,
    error,
    processedCategories,
    selectedCategory,
    setSelectedCategory,
    libraryActionHandlers,
    closePdfModal,
    currentPdf,
    currentDocumentName,
    currentDocumentId,
    logFormSelected,
  };
}
