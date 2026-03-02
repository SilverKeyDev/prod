import { useMemo } from "react";

import { Handshake } from "lucide-react";

import { useLocalization } from "packages/contexts";
import type { Agreement, DocumentData, SavedPageViewType } from "packages/features/documents";
import { AgreementListItem } from "packages/features/documents";
import { ConnectedCardHeartSave } from "packages/features/search";
import type { SavedHome } from "packages/types";
import DocumentCard from "packages/ui/components/cards/document/DocumentCard";
import { BodyText, KeyTurnLoader } from "packages/ui/components/index.web";
import { dateParseISO } from "packages/utils/date";

import { PropertyCard } from "@/components/cards";
import { CardCompareCheckbox, CardViewDetailsButton } from "@/components/cards/base/index.web";

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
  onOpenNegotiation: (home: SavedHome) => void;
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
  onOpenNegotiation,
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
      { type: "document"; data: DocumentData } | { type: "agreement"; data: Agreement }
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
        <div className={`${containerClass} py-responsive-lg flex justify-center`}>
          <KeyTurnLoader message={t("saved.loading_documents")} />
        </div>
      );
    }

    if (sortedItems.length === 0) {
      return (
        <div className={`${containerClass} py-responsive-lg text-center`}>
          <BodyText as="p" size="sm" className="text-responsive-sm text-gray-600">
            {t("saved.no_documents_yet")}
          </BodyText>
        </div>
      );
    }

    return (
      <div
        className={`${containerClass} gap-responsive-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
      >
        {sortedItems.map((item) =>
          item.type === "document" ? (
            <div key={`doc-${item.data.id}`} className="group relative w-full">
              <DocumentCard doc={item.data} onDelete={onDocumentDelete} />
            </div>
          ) : (
            <div key={`agreement-${item.data.id}`} className="group relative w-full">
              <AgreementListItem
                agreement={item.data}
                onClick={() => onAgreementClick?.(item.data.id)}
                onSend={onAgreementSend}
                onVoid={onAgreementVoid}
              />
            </div>
          )
        )}
      </div>
    );
  }

  if (viewType === "homes") {
    if (filteredHomes.length === 0) {
      if (homesLoading) {
        return (
          <div className={`${containerClass} py-responsive-lg flex justify-center`}>
            <KeyTurnLoader message={t("saved.loading_homes")} />
          </div>
        );
      }

      return (
        <div className={`${containerClass} py-responsive-lg text-center`}>
          <BodyText as="p" size="sm" className="text-responsive-sm text-gray-600">
            {t("saved.no_homes_yet")}
          </BodyText>
        </div>
      );
    }

    return (
      <div
        className={`${containerClass} gap-responsive-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
          selectedHomesDataLength >= 1 ? "mb-[140px] sm:mb-[160px]" : ""
        }`}
      >
        {filteredHomes.map((home: SavedHome) => {
          const isSelected = selectedHomesForComparison.has(home.home_id);
          return (
            <div key={home.home_id} className="group relative w-full">
              <PropertyCard
                id={home.home_id}
                imageUrl={home.image_url}
                address={
                  typeof home.address === "string" || typeof home.address === "number"
                    ? home.address.toString()
                    : (home.description ?? "[Invalid address]")
                }
                price={
                  typeof home.price === "string" || typeof home.price === "number"
                    ? home.price.toString()
                    : "[Invalid price]"
                }
                bedrooms={home.bedrooms}
                bathrooms={home.bathrooms}
                sqft={home.sqft && home.sqft > 0 ? home.sqft : undefined}
                lotSize={typeof home.lot_size === "string" ? home.lot_size : undefined}
                pricePosition="below-address"
                cardType="searchpage"
                showScore={false}
                width="full"
                topContent={
                  <>
                    {/* Compare checkbox - top-left on image */}
                    <CardCompareCheckbox
                      isSelected={isSelected}
                      onToggle={() => onToggleHomeSelection(home.home_id)}
                      position="top-left"
                      size="sm"
                    />
                    {/* Heart save - top-right on image */}
                    <ConnectedCardHeartSave
                      property={{
                        id: home.home_id,
                        address: home.address ?? home.description ?? "",
                        price:
                          typeof home.price === "string" || typeof home.price === "number"
                            ? String(home.price)
                            : "",
                        bedrooms: home.bedrooms ?? 0,
                        bathrooms: home.bathrooms ?? 0,
                        sqft: home.sqft ?? 0,
                        lat: home.lat ?? 0,
                        lng: home.lng ?? 0,
                        images: home.image_url ? [home.image_url] : [],
                      }}
                      position="top-right"
                      size="sm"
                    />
                  </>
                }
                bottomContent={
                  <div className="flex flex-col gap-2">
                    <CardViewDetailsButton
                      onClick={() => onUnlockHome(home)}
                      size="sm"
                      variant="unlock"
                      fullWidth
                      text="Unlock"
                    />
                    <CardViewDetailsButton
                      onClick={() => onOpenNegotiation(home)}
                      size="sm"
                      variant="negotiate"
                      fullWidth
                      text="Negotiate"
                      icon={Handshake}
                    />
                  </div>
                }
              />
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}
