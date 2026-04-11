/**
 * DocumentsViewWithSubtabs - Documents view with subtabs for "My Documents" and "Forms Library".
 * Renders within SavedHomesContent when viewType === "documents".
 */

import { useState } from "react";

import { useLocalization } from "packages/contexts";
import type { DocumentData } from "packages/features/documents";
import { FormsLibraryTab } from "packages/features/documents";
import { AgreementCard } from "packages/ui/components/cards/agreement";
import DocumentCard from "packages/ui/components/cards/document/DocumentCard";
import type { DocumentCardExternalActionHandlers } from "packages/ui/components/cards/document/types";
import { Box } from "packages/ui/components/primitives";

import { BodyText, KeyTurnLoader } from "@/components/ui";
import { UnderlineTabs } from "@/components/ui";

type DocumentsViewSubtab = "my-documents" | "forms-library";

type DocumentsViewWithSubtabsProps = {
  documents: DocumentData[];
  documentsLoading: boolean;
  onDocumentDelete: (document: DocumentData) => void;
  documentActionHandlers?: DocumentCardExternalActionHandlers;
  onFormSendForSignature?: (
    form: import("packages/features/documents").ChecklistForm,
  ) => void;
  isAgent: boolean;
  containerClass: string;
};

export default function DocumentsViewWithSubtabs({
  documents,
  documentsLoading,
  onDocumentDelete,
  documentActionHandlers,
  onFormSendForSignature,
  isAgent,
  containerClass,
}: DocumentsViewWithSubtabsProps) {
  const { t } = useLocalization();
  const [documentSubtab, setDocumentSubtab] =
    useState<DocumentsViewSubtab>("my-documents");

  // Only show Forms Library tab to agents
  const subtabItems = isAgent
    ? [
        {
          id: "my-documents" as const,
          label: t("documents.my_documents_tab", {
            defaultValue: "My Documents",
          }),
        },
        {
          id: "forms-library" as const,
          label: t("documents.forms_library_tab", {
            defaultValue: "Forms Library",
          }),
        },
      ]
    : [
        {
          id: "my-documents" as const,
          label: t("documents.my_documents_tab", {
            defaultValue: "My Documents",
          }),
        },
      ];

  return (
    <Box className="w-full">
      {isAgent && (
        <Box className={`${containerClass} mb-4`}>
          <UnderlineTabs
            items={subtabItems}
            activeId={documentSubtab}
            onChange={(id) => setDocumentSubtab(id as DocumentsViewSubtab)}
            size="sm"
          />
        </Box>
      )}

      {documentSubtab === "my-documents" && (
        <>
          {documentsLoading && (
            <Box
              className={`${containerClass} py-responsive-lg flex justify-center`}
            >
              <KeyTurnLoader message={t("saved.loading_documents")} />
            </Box>
          )}

          {!documentsLoading && documents.length === 0 && (
            <Box className={`${containerClass} py-responsive-lg text-center`}>
              <BodyText
                as="p"
                size="sm"
                className="text-responsive-sm text-text-secondary"
              >
                {t("saved.no_documents_yet")}
              </BodyText>
            </Box>
          )}

          {!documentsLoading && documents.length > 0 && (
            <Box
              className={`${containerClass} gap-responsive-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
            >
              {documents.map((doc) => (
                <Box key={`doc-${doc.id}`} className="group relative w-full">
                  {doc.library_kind === "agreement" ? (
                    <AgreementCard
                      doc={doc}
                      onDelete={onDocumentDelete}
                      isAgent={isAgent}
                      externalActionHandlers={
                        documentActionHandlers
                          ? {
                              handleViewDocument:
                                documentActionHandlers.handleViewDocument,
                              handleDownloadDocument:
                                documentActionHandlers.handleDownloadDocument,
                              handleShareDocument:
                                documentActionHandlers.handleShareDocument,
                              handleSignNow:
                                documentActionHandlers.handleSignNow,
                            }
                          : undefined
                      }
                    />
                  ) : (
                    <DocumentCard
                      doc={doc}
                      onDelete={onDocumentDelete}
                      externalActionHandlers={documentActionHandlers}
                    />
                  )}
                </Box>
              ))}
            </Box>
          )}
        </>
      )}

      {documentSubtab === "forms-library" && isAgent && (
        <Box className={containerClass}>
          <FormsLibraryTab onSendForSignature={onFormSendForSignature} />
        </Box>
      )}
    </Box>
  );
}
