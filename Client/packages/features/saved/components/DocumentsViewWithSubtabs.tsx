/**
 * Documents library grid/list within Saved when viewType === "documents".
 */

import { useLocalization } from "packages/contexts";
import type { DocumentData } from "packages/features/documents";
import type { LibraryViewMode } from "packages/features/saved/hooks/ui/useLibraryViewMode";
import DocumentCard from "packages/ui/components/cards/document/DocumentCard";
import DocumentListRow from "packages/ui/components/cards/document/DocumentListRow";
import type { DocumentCardExternalActionHandlers } from "packages/ui/components/cards/document/types";
import { Box } from "packages/ui/components/primitives";

import { BodyText, KeyTurnLoader } from "@/components/ui";

type DocumentsViewWithSubtabsProps = {
  documents: DocumentData[];
  documentsLoading: boolean;
  onDocumentDelete: (document: DocumentData) => void;
  documentActionHandlers?: DocumentCardExternalActionHandlers;
  containerClass: string;
  libraryViewMode: LibraryViewMode;
};

export default function DocumentsViewWithSubtabs({
  documents,
  documentsLoading,
  onDocumentDelete,
  documentActionHandlers,
  containerClass,
  libraryViewMode,
}: DocumentsViewWithSubtabsProps) {
  const { t } = useLocalization();

  const myDocumentsGridClass =
    `${containerClass} gap-responsive-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.trim();
  const myDocumentsListClass = `${containerClass} flex flex-col gap-responsive-md`.trim();

  return (
    <Box className="w-full">
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
        <Box className={libraryViewMode === "list" ? myDocumentsListClass : myDocumentsGridClass}>
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
    </Box>
  );
}
