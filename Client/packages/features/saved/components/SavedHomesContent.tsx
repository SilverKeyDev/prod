import { useMemo } from "react";

import { useLocalization } from "packages/contexts";
import type { DocumentData, SavedPageViewType } from "packages/features/documents";
import type { SavedHome } from "packages/types";
import { AgreementCard } from "packages/ui/components/cards/agreement";
import type { DocumentCardExternalActionHandlers } from "packages/ui/components/cards/document/types";
import { Box } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";
import { filterDocumentLibraryExcludingAgreements } from "packages/utils/documents";

import { BodyText, KeyTurnLoader } from "@/components/ui";

import DocumentsViewWithSubtabs from "./DocumentsViewWithSubtabs";
import { SavedHomeCard } from "./SavedHomeCard";

type SavedHomesContentProps = {
  viewType: SavedPageViewType;
  filteredHomes: SavedHome[];
  homesLoading: boolean;
  documents: DocumentData[];
  documentsLoading: boolean;
  selectedHomesForComparison: Set<string>;
  onToggleHomeSelection: (homeId: string) => void;
  onUnlockHome: (home: SavedHome) => void;
  onDocumentDelete: (document: DocumentData) => void;
  /** When set, document cards use this modal owner instead of a PdfModal per card. */
  documentActionHandlers?: DocumentCardExternalActionHandlers;
  /** Handler for sending forms for signature */
  onFormSendForSignature?: (form: import("packages/features/documents").ChecklistForm) => void;
  selectedHomesDataLength: number;
  /** When true, container has no padding (parent provides it for alignment) */
  noPadding?: boolean;
  /** Override default empty copy when the homes list is empty (not loading). */
  noHomesYetKey?: string;
  /** Whether current user is an agent (for forms library access) */
  isAgent?: boolean;
};
const CONTENT_PADDING = "px-4 sm:px-6 md:px-8 lg:px-12";
export default function SavedHomesContent({
  viewType,
  filteredHomes,
  homesLoading,
  documents,
  documentsLoading,
  selectedHomesForComparison,
  onToggleHomeSelection,
  onUnlockHome,
  onDocumentDelete,
  documentActionHandlers,
  onFormSendForSignature,
  selectedHomesDataLength,
  noPadding = false,
  noHomesYetKey,
  isAgent = false,
}: SavedHomesContentProps) {
  const { t } = useLocalization();
  const containerClass = noPadding ? "w-full" : `w-full ${CONTENT_PADDING}`;
  const sortedDocuments = useMemo(() => {
    const toMs = (v: number | string) => (typeof v === "number" ? v : dateParseISO(v).valueOf());
    return [...documents].sort((a, b) => {
      const dateA = toMs(a.created_at ?? a.updated_at ?? 0);
      const dateB = toMs(b.created_at ?? b.updated_at ?? 0);
      return dateB - dateA;
    });
  }, [documents]);
  const sortedDocumentsExcludingAgreements = useMemo(
    () => filterDocumentLibraryExcludingAgreements(sortedDocuments),
    [sortedDocuments]
  );
  if (viewType === "documents") {
    return (
      <DocumentsViewWithSubtabs
        documents={sortedDocumentsExcludingAgreements}
        documentsLoading={documentsLoading}
        onDocumentDelete={onDocumentDelete}
        documentActionHandlers={documentActionHandlers}
        onFormSendForSignature={onFormSendForSignature}
        isAgent={isAgent}
        containerClass={containerClass}
      />
    );
  }
  if (viewType === "agreements") {
    const agreementDocs = sortedDocuments.filter((d) => d.library_kind === "agreement");
    if (documentsLoading) {
      return (
        <Box className={`${containerClass} py-responsive-lg flex justify-center`}>
          <KeyTurnLoader message={t("saved.loading_agreements")} />
        </Box>
      );
    }
    if (agreementDocs.length === 0) {
      return (
        <Box className={`${containerClass} py-responsive-lg text-center`}>
          <BodyText as="p" size="sm" className="text-responsive-sm text-text-secondary">
            {t("saved.no_agreements_yet")}
          </BodyText>
        </Box>
      );
    }
    return (
      <Box
        className={`${containerClass} gap-responsive-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
      >
        {agreementDocs.map((doc) => (
          <Box key={`agreement-${doc.id}`} className="group relative w-full">
            <AgreementCard
              doc={doc}
              onDelete={onDocumentDelete}
              isAgent={isAgent}
              externalActionHandlers={
                documentActionHandlers
                  ? {
                      handleViewDocument: documentActionHandlers.handleViewDocument,
                      handleDownloadDocument: documentActionHandlers.handleDownloadDocument,
                      handleShareDocument: documentActionHandlers.handleShareDocument,
                      handleSignNow: documentActionHandlers.handleSignNow,
                      handleViewSignedAgreement: documentActionHandlers.handleViewSignedAgreement,
                    }
                  : undefined
              }
            />
          </Box>
        ))}
      </Box>
    );
  }
  if (viewType === "homes") {
    if (filteredHomes.length === 0) {
      if (homesLoading) {
        return (
          <Box className={`${containerClass} py-responsive-lg flex justify-center`}>
            <KeyTurnLoader message={t("saved.loading_homes")} />
          </Box>
        );
      }
      return (
        <Box className={`${containerClass} py-responsive-lg text-center`}>
          <BodyText as="p" size="sm" className="text-responsive-sm text-text-secondary">
            {t(noHomesYetKey ?? "saved.no_homes_yet")}
          </BodyText>
        </Box>
      );
    }
    return (
      <Box
        className={`${containerClass} gap-responsive-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
          selectedHomesDataLength >= 1 ? "mb-36 sm:mb-40" : ""
        }`}
      >
        {filteredHomes.map((home: SavedHome) => (
          <Box key={home.home_id} className="w-full">
            <SavedHomeCard
              home={home}
              isSelected={selectedHomesForComparison.has(home.home_id)}
              onToggleCompare={onToggleHomeSelection}
              onUnlock={onUnlockHome}
            />
          </Box>
        ))}
      </Box>
    );
  }
  return null;
}
