import { useCallback, useMemo, useState } from "react";

import { useBrokerageInventoryMap } from "packages/features/brokerage/hooks/useBrokerageInventoryMap.web";
import { BROKERAGE_INVENTORY_FIXTURE } from "packages/features/brokerage/utils/inventory/brokerageInventoryFixtures";
import { brokerageInventoryToSearchResults } from "packages/features/brokerage/utils/inventory/inventoryListingToSearchResult";
import { SearchResultListingCard } from "packages/features/search/components/list/SearchResultListingCard.web";
import type { SearchResult } from "packages/features/search/types/domain/result";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

function InventoryListingRow({
  listing,
  isSelected,
  onSelect,
}: {
  listing: SearchResult;
  isSelected: boolean;
  onSelect: (listing: SearchResult) => void;
}) {
  return (
    <Box
      role="button"
      tabIndex={0}
      className={`border-border overflow-hidden rounded-lg border bg-white transition-all ${
        isSelected
          ? "border-neutral-400 bg-olive/5"
          : "hover:border-neutral-400 hover:bg-neutral-50"
      }`}
      onClick={() => onSelect(listing)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(listing);
        }
      }}
    >
      <SearchResultListingCard property={listing} activeTab="saved" />
    </Box>
  );
}

export function BrokerageInventoryPanel() {
  const listings = useMemo(
    () => brokerageInventoryToSearchResults(BROKERAGE_INVENTORY_FIXTURE),
    []
  );
  const [selectedId, setSelectedId] = useState<string | null>(listings[0]?.id ?? null);

  const handleSelectListing = useCallback((listingId: string) => {
    setSelectedId(listingId);
  }, []);

  const { mapRef, isLoaded, error } = useBrokerageInventoryMap(
    listings,
    selectedId,
    handleSelectListing
  );

  const selectedListing = listings.find((listing) => listing.id === selectedId) ?? null;

  return (
    <Box className="border-border bg-background-surface rounded-xl border p-5">
      <Title size="sm" as="h3" className="mb-1">
        Office Inventory
      </Title>
      <BodyText size="xs" muted className="mb-4">
        Active brokerage listings — card prices use the same formatting as search and saved homes.
      </BodyText>

      <Box className="grid min-h-[520px] gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <Box className="scrollbar-hide max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {listings.map((listing) => (
            <InventoryListingRow
              key={listing.id}
              listing={listing}
              isSelected={listing.id === selectedId}
              onSelect={(row) => handleSelectListing(row.id)}
            />
          ))}
        </Box>

        <Box className="border-border relative min-h-[480px] overflow-hidden rounded-lg border">
          <Box ref={mapRef} className="h-full min-h-[480px] w-full" />

          {!isLoaded && !error ? (
            <Box className="bg-background-surface/80 absolute inset-0 flex items-center justify-center">
              <BodyText size="sm" muted>
                Loading map…
              </BodyText>
            </Box>
          ) : null}

          {error ? (
            <Box className="bg-background-surface/90 absolute inset-0 flex items-center justify-center p-6 text-center">
              <BodyText size="sm" muted>
                Map unavailable. Select a listing in the sidebar to preview card formatting.
              </BodyText>
            </Box>
          ) : null}

          {selectedListing ? (
            <Box className="pointer-events-none absolute bottom-4 left-1/2 z-10 w-[min(100%,280px)] -translate-x-1/2">
              <Box className="pointer-events-auto scale-90">
                <SearchResultListingCard
                  property={selectedListing}
                  activeTab="saved"
                  isOnMap
                  showMatchScore={false}
                />
              </Box>
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
