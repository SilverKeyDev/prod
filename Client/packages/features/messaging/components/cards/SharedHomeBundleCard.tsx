import React, { useCallback, useEffect, useState } from "react";

import { type SearchResult, SearchResultListingCard } from "packages/features/search";
import { useEmblaCarousel } from "packages/ui/components/adapters/carousel";
import IconButton from "packages/ui/components/button/IconButton";
import type { HomeDescription } from "packages/ui/components/cards/HomeCard";
import { Box } from "packages/ui/components/primitives";
import { homeDescriptionToSearchResult } from "packages/utils/search/scoring/homeDescriptionToSearchResult";

export type SharedHomeBundleCardProps = {
  homes: HomeDescription[];
  openSharedHomeDetails: (property: SearchResult) => void;
  isHomeSaved: (propertyId: string, propertyAddress?: string) => boolean;
  saveHome: (property: unknown) => Promise<unknown>;
  removeSavedHome: (propertyId: string, propertyAddress?: string) => Promise<unknown>;
};

export function SharedHomeBundleCard({
  homes,
  openSharedHomeDetails,
  isHomeSaved,
  saveHome,
  removeSavedHome,
}: SharedHomeBundleCardProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: "x",
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const syncIndex = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    syncIndex();
    emblaApi.on("select", syncIndex);
    return () => emblaApi.off("select", syncIndex);
  }, [emblaApi, syncIndex]);

  const showNav = homes.length > 1;
  const canGoPrev = showNav && selectedIndex > 0;
  const canGoNext = showNav && selectedIndex < homes.length - 1;

  return (
    <Box className="border-border bg-background-base relative mb-2 w-full min-w-0 max-w-full overflow-hidden rounded-xl border">
      <Box ref={emblaRef} className="embla__viewport min-w-0 overflow-hidden">
        <Box className="embla__container flex">
          {homes.map((home, index) => {
            const searchProperty = homeDescriptionToSearchResult(home);
            return (
              <Box
                key={home.home_id || `bundle-${index}`}
                className="embla__slide min-w-0 flex-[0_0_100%]"
              >
                <Box
                  role="button"
                  tabIndex={0}
                  className="w-full min-w-0 max-w-full cursor-pointer overflow-hidden p-2"
                  onClick={() => void openSharedHomeDetails(searchProperty)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      void openSharedHomeDetails(searchProperty);
                    }
                  }}
                >
                  <SearchResultListingCard
                    property={searchProperty}
                    activeTab="results"
                    isHomeSaved={isHomeSaved}
                    saveHome={saveHome}
                    removeSavedHome={removeSavedHome}
                    showNotInterested={false}
                    showMatchScore={false}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
      {showNav ? (
        <>
          <IconButton
            iconName="chevron-left"
            variant="secondary"
            size="sm"
            rounded="full"
            label="Previous property"
            disabled={!canGoPrev}
            onPress={() => emblaApi?.scrollPrev()}
            className="border-border bg-background-base/95 absolute left-1 top-1/2 z-10 -translate-y-1/2 shadow-sm"
          />
          <IconButton
            iconName="chevron-right"
            variant="secondary"
            size="sm"
            rounded="full"
            label="Next property"
            disabled={!canGoNext}
            onPress={() => emblaApi?.scrollNext()}
            className="border-border bg-background-base/95 absolute right-1 top-1/2 z-10 -translate-y-1/2 shadow-sm"
          />
        </>
      ) : null}
    </Box>
  );
}
