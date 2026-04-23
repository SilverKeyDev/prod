/**
 * DocumentsViewWithSubtabs - Documents view with subtabs for "My Documents" and "Forms Library".
 * Renders within SavedHomesContent when viewType === "documents".
 */

import type { Dispatch, SetStateAction } from "react";

import { useLocalization } from "packages/contexts";
import type { DocumentData } from "packages/features/documents";
import { FormsLibraryTab } from "packages/features/documents";
import type { LibraryViewMode } from "packages/features/saved/hooks/ui/useLibraryViewMode";
import DocumentCard from "packages/ui/components/cards/document/DocumentCard";
import DocumentListRow from "packages/ui/components/cards/document/DocumentListRow";
import type { DocumentCardExternalActionHandlers } from "packages/ui/components/cards/document/types";
import { Box } from "packages/ui/components/primitives";
import { UnderlineTabs } from "packages/ui/components/tabs/UnderlineTabs";

import { BodyText, KeyTurnLoader } from "@/components/ui";

type DocumentsViewSubtab = "my-documents" | "forms-library";

type DocumentsViewWithSubtabsProps = {
  documents: DocumentData[];
  documentsLoading: boolean;
  onDocumentDelete: (document: DocumentData) => void;
  documentActionHandlers?: DocumentCardExternalActionHandlers;
  onFormSendForSignature?: (form: import("packages/features/documents").ChecklistForm) => void;
  isAgent: boolean;
  containerClass: string;
  documentSubtab: DocumentsViewSubtab;
  onDocumentSubtabChange: Dispatch<SetStateAction<DocumentsViewSubtab>>;
  libraryViewMode: LibraryViewMode;
};

export default function DocumentsViewWithSubtabs({
  documents,
  documentsLoading,
  onDocumentDelete,
  documentActionHandlers,
  onFormSendForSignature,
  isAgent,
  containerClass,
  documentSubtab,
  onDocumentSubtabChange,
  libraryViewMode,
}: DocumentsViewWithSubtabsProps) {
  const { t } = useLocalization();

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

  const myDocumentsGridClass =
    `${containerClass} gap-responsive-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.trim();
  const myDocumentsListClass = `${containerClass} flex flex-col gap-responsive-md`.trim();
  const formsLibraryGridClass =
    "gap-responsive-md grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <Box className="w-full">
      {isAgent && (
        <Box className={`${containerClass} mb-4`}>
          <UnderlineTabs
            items={subtabItems}
            activeId={documentSubtab}
            onChange={(id) => onDocumentSubtabChange(id as DocumentsViewSubtab)}
            size="sm"
          />
        </Box>
      )}

      {documentSubtab === "my-documents" && (
        <>
          {documentsLoading && (
            <Box className={`${containerClass} py-responsive-lg flex justify-center`}>
              <KeyTurnLoader message={t("saved.loading_documents")} />
            </Box>
          )}

          {!documentsLoading && documents.length === 0 && (
            <Box className={`${containerClass} py-responsive-lg text-center`}>
              <BodyText as="p" size="sm" className="text-responsive-sm text-text-secondary">
                {t("saved.no_documents_yet")}
              </BodyText>
            </Box>
          )}

          {!documentsLoading && documents.length > 0 && (
            <Box
              className={libraryViewMode === "list" ? myDocumentsListClass : myDocumentsGridClass}
            >
              {documents.map((doc) => (
                <Box key={`doc-${doc.id}`} className="group relative w-full">
                  {libraryViewMode === "list" ? (
                    <DocumentListRow
                      doc={doc}
                      onDelete={onDocumentDelete}
                      externalActionHandlers={documentActionHandlers}
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
        <FormsLibraryTab
          containerClass={containerClass}
          formsGridClassName={formsLibraryGridClass}
          onSendForSignature={onFormSendForSignature}
        />
      )}
    </Box>
  );
}
