import { useMemo } from "react";

import { useLocalization } from "packages/contexts";
import type { DocumentData, SavedHomesSurfaceViewType } from "packages/features/documents";
import { FormsLibraryTab } from "packages/features/documents";
import type { LibraryViewMode } from "packages/features/saved/hooks/ui/useLibraryViewMode";
import {
  sortAndFilterAgreementsForLibrary,
  sortDocumentsForLibrary,
  sortSavedHomesForLibrary,
} from "packages/features/saved/utils/librarySort";
import type { SavedHome } from "packages/types";
import { Box } from "packages/ui/components/structure/primitives";
import { AgreementCard, AgreementListRow } from "packages/ui/components/surfaces/cards/agreement";
import type { DocumentCardExternalActionHandlers } from "packages/ui/components/surfaces/cards/document/types";
import { filterDocumentLibraryExcludingAgreements } from "packages/utils/transaction/documents";

import { BodyText, KeyTurnLoader } from "@/components/ui";

import DocumentsViewWithSubtabs from "./DocumentsViewWithSubtabs";
import { SavedHomeCard } from "./SavedHomeCard";

type SavedHomesContentProps = {
  viewType: SavedHomesSurfaceViewType;
  /** Layout for the active Library tab (or embedded homes list via `viewType="homes"`). */
  libraryViewMode: LibraryViewMode;
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
  /** Sort / filter for the active Library tab (homes, documents, or agreements). */
  librarySortKey: string;
  /** Library toolbar search (forms tab filters the forms browser). */
  searchTerm?: string;
};
const CONTENT_PADDING = "px-4 sm:px-6 md:px-8 lg:px-12";
export default function SavedHomesContent({
  viewType,
  libraryViewMode,
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
  librarySortKey,
  searchTerm = "",
}: SavedHomesContentProps) {
  const { t } = useLocalization();
  const containerClass = noPadding ? "w-full" : `w-full ${CONTENT_PADDING}`;
  const sortedDocumentsExcludingAgreements = useMemo(() => {
    const base = filterDocumentLibraryExcludingAgreements(documents);
    return sortDocumentsForLibrary(base, librarySortKey);
  }, [documents, librarySortKey]);
  const sortedHomes = useMemo(
    () => sortSavedHomesForLibrary(filteredHomes, librarySortKey),
    [filteredHomes, librarySortKey]
  );

  const formsLibraryGridClass =
    "gap-responsive-md grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  if (viewType === "forms-library") {
    if (!isAgent) return null;
    return (
      <FormsLibraryTab
        containerClass={containerClass}
        formsGridClassName={formsLibraryGridClass}
        onSendForSignature={onFormSendForSignature}
        searchTerm={searchTerm}
        librarySortKey={librarySortKey}
        libraryViewMode={libraryViewMode}
      />
    );
  }

  if (viewType === "documents") {
    return (
      <DocumentsViewWithSubtabs
        documents={sortedDocumentsExcludingAgreements}
        documentsLoading={documentsLoading}
        onDocumentDelete={onDocumentDelete}
        documentActionHandlers={documentActionHandlers}
        containerClass={containerClass}
        libraryViewMode={libraryViewMode}
      />
    );
  }
  if (viewType === "agreements") {
    const agreementDocs = sortAndFilterAgreementsForLibrary(
      documents.filter((d) => d.library_kind === "agreement"),
      librarySortKey
    );
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
    const agreementsLayoutClass =
      libraryViewMode === "list"
        ? `${containerClass} flex flex-col gap-responsive-md`
        : `${containerClass} gap-responsive-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;

    return (
      <Box className={agreementsLayoutClass}>
        {agreementDocs.map((doc) => (
          <Box key={`agreement-${doc.id}`} className="group relative w-full">
            {libraryViewMode === "list" ? (
              <AgreementListRow
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
            ) : (
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
            )}
          </Box>
        ))}
      </Box>
    );
  }
  if (viewType === "homes") {
    if (sortedHomes.length === 0) {
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
    const homesLayoutClass =
      libraryViewMode === "list"
        ? `${containerClass} flex flex-col gap-responsive-md ${selectedHomesDataLength >= 1 ? "mb-36 sm:mb-40" : ""}`
        : `${containerClass} gap-responsive-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
            selectedHomesDataLength >= 1 ? "mb-36 sm:mb-40" : ""
          }`;

    return (
      <Box className={homesLayoutClass}>
        {sortedHomes.map((home: SavedHome) => (
          <Box key={home.home_id} className="w-full">
            <SavedHomeCard
              home={home}
              isSelected={selectedHomesForComparison.has(home.home_id)}
              onToggleCompare={onToggleHomeSelection}
              onUnlock={onUnlockHome}
              layout={libraryViewMode === "list" ? "list" : "grid"}
            />
          </Box>
        ))}
      </Box>
    );
  }
  return null;
}
