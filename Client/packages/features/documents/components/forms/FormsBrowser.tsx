/**
 * FormsBrowser - Browse and select forms from the forms library.
 * Shows categories (folders) and forms within each category.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import { useDocumentActions } from "packages/features/documents/hooks/data/useDocumentActions";
import { useFormsLibrary } from "packages/features/documents/hooks/data/useFormsLibrary";
import type { ChecklistForm } from "packages/features/documents/types/forms";
import {
  checklistFormToDocumentData,
  formatFormLibraryCardDate,
} from "packages/features/documents/utils/forms/checklistFormToDocumentData";
import { log, LOG_CATEGORIES } from "packages/logger";
import { secureClipboardCopy } from "packages/services/security/clipboardSecurity";
import { Button } from "packages/ui";
import BaseCard from "packages/ui/components/cards/BaseCard";
import DocumentCard from "packages/ui/components/cards/document/DocumentCard";
import DocumentCardHeader from "packages/ui/components/cards/document/DocumentCardHeader";
import DocumentListRow from "packages/ui/components/cards/document/DocumentListRow";
import type { DocumentCardExternalActionHandlers } from "packages/ui/components/cards/document/types";
import { PdfModal } from "packages/ui/components/modals";
import { Portal } from "packages/ui/components/portal";
import { Box } from "packages/ui/components/primitives";
import {
  formatFormsLibraryCategoryLabel,
  sortFormCategoriesForLibrary,
} from "packages/utils/documents";
import { tryWebShareUrl } from "packages/utils/share";

import { BodyText, Subtitle, Title } from "@/components/ui";

type FormsBrowserProps = {
  /** When provided with `showActions={false}` (e.g. upload modal), tapping a form card selects it. */
  onSelectForm?: (form: ChecklistForm) => void;
  onClose?: () => void;
  showActions?: boolean; // Show download / send-for-signature controls (default: true)
  onSendForSignature?: (form: ChecklistForm) => void;
  /** Grid layout for form cards (e.g. Saved page documents grid). */
  formsGridClassName?: string;
  /** Library toolbar search (Saved forms tab); filters categories and forms. */
  searchTerm?: string;
  /** Persisted sort from Library toolbar (same IDs as documents: date_desc, date_asc, name_asc). */
  librarySortKey?: string;
  /** Grid vs list from Library view toggle. */
  libraryViewMode?: "grid" | "list";
};

function formMatchesSearch(form: ChecklistForm, q: string): boolean {
  const hay =
    `${form.title} ${form.description ?? ""} ${form.form_key} ${form.category ?? ""}`.toLowerCase();
  return hay.includes(q);
}

export default function FormsBrowser({
  onSelectForm,
  onClose,
  showActions = true,
  onSendForSignature,
  formsGridClassName = "gap-responsive-md grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  searchTerm = "",
  librarySortKey = "date_desc",
  libraryViewMode = "grid",
}: FormsBrowserProps) {
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

  const processedCategories = useMemo(() => {
    const sorted = sortFormCategoriesForLibrary(categories, librarySortKey);
    const q = searchTerm.trim().toLowerCase();
    if (!q) return sorted;
    return sorted
      .map((cat) => {
        const label = formatFormsLibraryCategoryLabel(cat.name).toLowerCase();
        const categoryMatches = label.includes(q);
        const nextForms = categoryMatches
          ? cat.forms
          : cat.forms.filter((f) => formMatchesSearch(f, q));
        return { ...cat, forms: nextForms };
      })
      .filter((cat) => cat.forms.length > 0);
  }, [categories, librarySortKey, searchTerm]);

  const formById = useMemo(() => {
    const map = new Map<string, ChecklistForm>();
    for (const cat of processedCategories) {
      for (const form of cat.forms) {
        map.set(form.id, form);
      }
    }
    return map;
  }, [processedCategories]);

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
        // Presigned S3 URL — do not pass a library id as `reportId` or the viewer hits `/report/:id/view`.
        openPdfModal(form.download_url, documentName, undefined);
        return;
      }
      log.error(LOG_CATEGORIES.ERRORS, "Form has no view URL", { documentId });
    },
    [openPdfModal, resolveForm]
  );

  const handleDownloadDocument = useCallback(
    async (documentId: string, documentName: string) => {
      const form = resolveForm(documentId);
      if (!form?.download_url) {
        log.error(LOG_CATEGORIES.ERRORS, "Form has no download URL", { documentId });
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

  if (isLoading) {
    return (
      <Box className="w-full py-4">
        <BodyText size="sm" muted>
          {t("forms.loading_library", { defaultValue: "Loading forms..." })}
        </BodyText>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="w-full py-4">
        <BodyText size="sm" className="text-destructive">
          {t("forms.error_loading_library", {
            defaultValue: "Error loading forms. Please try again.",
          })}
        </BodyText>
      </Box>
    );
  }

  if (processedCategories.length === 0 && categories.length > 0 && searchTerm.trim()) {
    return (
      <Box className="w-full py-4">
        <BodyText size="sm" muted>
          {t("forms.no_forms_match_search", {
            defaultValue: "No forms match your search.",
          })}
        </BodyText>
      </Box>
    );
  }

  if (categories.length === 0) {
    return (
      <Box className="w-full py-4">
        <BodyText size="sm" muted>
          {t("forms.no_forms_available", {
            defaultValue: "No forms available. Forms will be added by your administrator.",
          })}
        </BodyText>
      </Box>
    );
  }

  // Category list view
  if (!selectedCategory) {
    const categoryLayoutClass =
      libraryViewMode === "list"
        ? "gap-responsive-md flex w-full flex-col"
        : "gap-responsive-md grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
    return (
      <Box className={categoryLayoutClass}>
        {processedCategories.map((category) => (
          <BaseCard
            key={category.name}
            variant="default"
            padding="md"
            rounded="lg"
            shadow="sm"
            hover
            cardType="searchpage"
            scale="md"
            width="full"
            background="white"
            className="cursor-pointer"
            onClick={() => setSelectedCategory(category.name)}
          >
            <Box className="flex flex-row items-center justify-between gap-3">
              <Box className="min-w-0 flex-1">
                <Subtitle size="sm" className="text-text-primary line-clamp-2">
                  {formatFormsLibraryCategoryLabel(category.name)}
                </Subtitle>
                <BodyText as="p" size="xs" muted className="mt-1">
                  {category.forms.length}{" "}
                  {category.forms.length === 1
                    ? t("forms.form", { defaultValue: "form" })
                    : t("forms.forms", { defaultValue: "forms" })}
                </BodyText>
              </Box>
              <BodyText as="span" size="sm" muted className="flex-shrink-0">
                →
              </BodyText>
            </Box>
          </BaseCard>
        ))}

        {onClose ? (
          <Box className="mt-2">
            <Button variant="secondary" size="sm" onPress={onClose} label="Close" iconName="x">
              {t("common.close", { defaultValue: "Close" })}
            </Button>
          </Box>
        ) : null}
      </Box>
    );
  }

  // Forms list view (selected category)
  const category = processedCategories.find((c) => c.name === selectedCategory);
  if (!category) {
    return null;
  }

  return (
    <Box className="w-full">
      <Box className="mb-4 flex flex-row items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setSelectedCategory(null)}
          label="Back"
          iconName="home"
        >
          ← {t("common.back", { defaultValue: "Back" })}
        </Button>
      </Box>

      <Box className="mb-4">
        <Title as="h3" size="sm" className="mb-1">
          {formatFormsLibraryCategoryLabel(category.name)}
        </Title>
        <Subtitle size="xs" className="text-text-secondary">
          {category.forms.length}{" "}
          {category.forms.length === 1
            ? t("forms.form_available", { defaultValue: "form available" })
            : t("forms.forms_available", { defaultValue: "forms available" })}
        </Subtitle>
      </Box>

      <Box
        className={
          libraryViewMode === "list" ? "gap-responsive-md flex w-full flex-col" : formsGridClassName
        }
      >
        {category.forms.map((form) => {
          const cardSelectable = Boolean(onSelectForm) && !showActions;
          const doc = checklistFormToDocumentData(form);

          if (showActions) {
            return (
              <Box key={form.id} className="group relative w-full">
                {libraryViewMode === "list" ? (
                  <DocumentListRow doc={doc} externalActionHandlers={libraryActionHandlers} />
                ) : (
                  <DocumentCard doc={doc} externalActionHandlers={libraryActionHandlers} />
                )}
              </Box>
            );
          }

          return (
            <BaseCard
              key={form.id}
              variant="default"
              padding="md"
              rounded="lg"
              shadow="sm"
              hover={cardSelectable}
              cardType="searchpage"
              scale="md"
              width="full"
              background="white"
              className={cardSelectable ? "cursor-pointer" : ""}
              role={cardSelectable ? "button" : undefined}
              tabIndex={cardSelectable ? 0 : undefined}
              onClick={
                cardSelectable
                  ? () => {
                      log.info(LOG_CATEGORIES.API, "Form selected from library", {
                        formId: form.id,
                        formKey: form.form_key,
                      });
                      onSelectForm?.(form);
                    }
                  : undefined
              }
              onKeyDown={
                cardSelectable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        log.info(LOG_CATEGORIES.API, "Form selected from library", {
                          formId: form.id,
                          formKey: form.form_key,
                        });
                        onSelectForm?.(form);
                      }
                    }
                  : undefined
              }
            >
              <DocumentCardHeader
                title={form.title}
                documentType="report"
                uploadedDate={formatFormLibraryCardDate(form)}
              />
              {form.description ? (
                <BodyText as="p" size="xs" muted className="line-clamp-3">
                  {form.description}
                </BodyText>
              ) : null}
            </BaseCard>
          );
        })}
      </Box>

      {showActions && currentPdf ? (
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
  );
}
