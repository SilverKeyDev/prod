import { useMemo } from "react";

import { useLocalization } from "packages/contexts";
import type { Agreement, DocumentData, SavedPageViewType } from "packages/features/documents";
import { AgreementListItem } from "packages/features/documents";
import type { SavedHome } from "packages/types";
import DocumentCard from "packages/ui/components/cards/document/DocumentCard";
import { Box } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import { BodyText, KeyTurnLoader } from "@/components/ui";

import { SavedHomeCard } from "./SavedHomeCard";

type SavedHomesContentProps = {
  viewType: SavedPageViewType;
  filteredHomes: SavedHome[];
  homesLoading: boolean;
  documents: DocumentData[];
  documentsLoading: boolean;
  agreements?: Agreement[];
  agreementsLoading?: boolean;
  selectedHomesForComparison: Set<string>;
  onToggleHomeSelection: (homeId: string) => void;
  onUnlockHome: (home: SavedHome) => void;
  onDocumentDelete: (document: DocumentData) => void;
  onAgreementClick?: (agreementId: string) => void;
  onAgreementSend?: (agreementId: string) => void;
  onAgreementVoid?: (agreementId: string) => void;
  selectedHomesDataLength: number;
  /** When true, container has no padding (parent provides it for alignment) */
  noPadding?: boolean;
};
const CONTENT_PADDING = "px-4 sm:px-6 md:px-8 lg:px-12";
export default function SavedHomesContent({
  viewType,
  filteredHomes,
  homesLoading,
  documents,
  documentsLoading,
  agreements = [],
  agreementsLoading = false,
  selectedHomesForComparison,
  onToggleHomeSelection,
  onUnlockHome,
  onDocumentDelete,
  onAgreementClick,
  onAgreementSend,
  onAgreementVoid,
  selectedHomesDataLength,
  noPadding = false,
}: SavedHomesContentProps) {
  const { t } = useLocalization();
  const containerClass = noPadding ? "w-full" : `w-full ${CONTENT_PADDING}`;
  // Merge and sort documents and agreements by date
  const sortedItems = useMemo(() => {
    const items: Array<
      | {
          type: "document";
          data: DocumentData;
        }
      | {
          type: "agreement";
          data: Agreement;
        }
    > = [];
    // Add documents
    documents.forEach((doc) => {
      items.push({ type: "document", data: doc });
    });
    // Add agreements
    agreements.forEach((agreement) => {
      items.push({ type: "agreement", data: agreement });
    });
    // Sort by created_at/updated_at (most recent first)
    const toMs = (v: number | string) => (typeof v === "number" ? v : dateParseISO(v).valueOf());
    items.sort((a, b) => {
      const dateA =
        a.type === "document"
          ? toMs(a.data.created_at ?? a.data.updated_at ?? 0)
          : toMs(a.data.created_at);
      const dateB =
        b.type === "document"
          ? toMs(b.data.created_at ?? b.data.updated_at ?? 0)
          : toMs(b.data.created_at);
      return dateB - dateA;
    });
    return items;
  }, [documents, agreements]);
  if (viewType === "documents") {
    const isLoading = documentsLoading || agreementsLoading;
    if (isLoading) {
      return (
        <Box className={`${containerClass} py-responsive-lg flex justify-center`}>
          <KeyTurnLoader message={t("saved.loading_documents")} />
        </Box>
      );
    }
    if (sortedItems.length === 0) {
      return (
        <Box className={`${containerClass} py-responsive-lg text-center`}>
          <BodyText as="p" size="sm" className="text-responsive-sm text-text-secondary">
            {t("saved.no_documents_yet")}
          </BodyText>
        </Box>
      );
    }
    return (
      <Box
        className={`${containerClass} gap-responsive-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
      >
        {sortedItems.map((item) =>
          item.type === "document" ? (
            <Box key={`doc-${item.data.id}`} className="group relative w-full">
              <DocumentCard doc={item.data} onDelete={onDocumentDelete} />
            </Box>
          ) : (
            <Box key={`agreement-${item.data.id}`} className="group relative w-full">
              <AgreementListItem
                agreement={item.data}
                onClick={() => onAgreementClick?.(item.data.id)}
                onSend={onAgreementSend}
                onVoid={onAgreementVoid}
              />
            </Box>
          )
        )}
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
            {t("saved.no_homes_yet")}
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
