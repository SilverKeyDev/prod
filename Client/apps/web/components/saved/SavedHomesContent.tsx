import { useMemo } from "react";
import type { SavedHome } from "../../../../packages/schemas";
import { PropertyCard } from "../cards";
import {
  CardHeartSave,
  CardViewDetailsButton,
  CardCompareCheckbox,
} from "../cards/base";
import DocumentCard from "../cards/documents/DocumentCard";
import AgreementListItem from "../../features/documents/docusign/components/AgreementListItem";
import { KeyTurnLoader } from "../ui";
import type { SavedPageViewType } from "../../../../packages/hooks/store/documents/useSavedPageView";
import type { DocumentData } from "../../../../packages/hooks/data/documents/useDocumentsData";
import type { Agreement } from "../../../../packages/schemas/documents/docusign";

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
};

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
}: SavedHomesContentProps) {
  // Merge and sort documents and agreements by date
  const sortedItems = useMemo(() => {
    const items: Array<
      | { type: "document"; data: DocumentData }
      | { type: "agreement"; data: Agreement }
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
    items.sort((a, b) => {
      const dateA =
        a.type === "document"
          ? new Date(a.data.created_at ?? a.data.updated_at ?? 0).getTime()
          : new Date(a.data.created_at).getTime();
      const dateB =
        b.type === "document"
          ? new Date(b.data.created_at ?? b.data.updated_at ?? 0).getTime()
          : new Date(b.data.created_at).getTime();
      return dateB - dateA;
    });

    return items;
  }, [documents, agreements]);

  if (viewType === "documents") {
    const isLoading = documentsLoading || agreementsLoading;

    if (isLoading) {
      return (
        <div className="w-full px-4 sm:px-6 py-responsive-lg flex justify-center">
          <KeyTurnLoader message="Loading documents..." />
        </div>
      );
    }

    if (sortedItems.length === 0) {
      return (
        <div className="w-full px-4 sm:px-6 py-responsive-lg text-center">
          <p className="text-responsive-sm text-gray-600">
            You have no documents or agreements yet.
          </p>
        </div>
      );
    }

    return (
      <div className="w-full px-4 sm:px-6 grid grid-cols-1 gap-responsive-md sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedItems.map((item) =>
          item.type === "document" ? (
            <div
              key={`doc-${item.data.id}`}
              className="relative group w-full"
            >
              <DocumentCard doc={item.data} onDelete={onDocumentDelete} />
            </div>
          ) : (
            <div
              key={`agreement-${item.data.id}`}
              className="relative group w-full"
            >
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
          <div className="w-full px-4 sm:px-6 py-responsive-lg flex justify-center">
            <KeyTurnLoader message="Loading saved homes..." />
          </div>
        );
      }

      return (
        <div className="w-full px-4 sm:px-6 py-responsive-lg text-center">
          <p className="text-responsive-sm text-gray-600">
            You have no saved homes yet.
          </p>
        </div>
      );
    }

    return (
      <div
        className={`w-full px-4 sm:px-6 grid grid-cols-1 gap-responsive-md sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
          selectedHomesDataLength >= 1 ? "mb-[140px] sm:mb-[160px]" : ""
        }`}
      >
        {filteredHomes.map((home: SavedHome) => {
          const isSelected = selectedHomesForComparison.has(home.home_id);
          return (
            <div key={home.home_id} className="relative group w-full">
              <PropertyCard
                id={home.home_id}
                imageUrl={home.image_url}
                address={
                  typeof home.address === "string" ||
                  typeof home.address === "number"
                    ? home.address.toString()
                    : (home.description ?? "[Invalid address]")
                }
                price={
                  typeof home.price === "string" ||
                  typeof home.price === "number"
                    ? home.price.toString()
                    : "[Invalid price]"
                }
                bedrooms={home.bedrooms}
                bathrooms={home.bathrooms}
                sqft={home.sqft && home.sqft > 0 ? home.sqft : undefined}
                lotSize={
                  typeof home.lot_size === "string" ? home.lot_size : undefined
                }
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
                    <CardHeartSave
                      property={{
                        id: home.home_id,
                        address: home.address ?? home.description ?? "",
                        price:
                          typeof home.price === "string" ||
                          typeof home.price === "number"
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
                      variant="primary"
                      fullWidth
                      text="Unlock"
                    />
                    <CardViewDetailsButton
                      onClick={() => onOpenNegotiation(home)}
                      size="sm"
                      variant="secondary"
                      fullWidth
                      text="Negotiate"
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
