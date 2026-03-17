import { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { ConnectedCardHeartSave } from "packages/features/search/components/ConnectedCardHeartSave";
import { formatPropertyType } from "packages/features/search/types/search/propertyFormatters";
import { log, LOG_CATEGORIES } from "packages/logger";
import CardNotInterested from "packages/ui/components/button/NotInterested";
import { Box } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";

import {
  CardHeartSaveWithProps,
  CardImageContainer,
  CardMatchScore,
  CardPropertyDetails,
} from "@/components/cards/base/index.web";
import WhyNotInterestedCard from "@/components/cards/WhyNotInterestedCard.web";
import { BodyText, KeyTurnLoader, Title } from "@/components/ui";
import { useNotInterestedHomesData } from "@/features/search/hooks/data/saved/useNotInterestedHomesData";
import { getMatchScore, type SearchResult } from "@/features/search/types";

export function SidebarList(props: {
  items: SearchResult[];
  selectedId?: string;
  isLoading: boolean;
  onNavigateToProperty: (p: SearchResult) => void;
  activeTab: "results" | "saved";
  // Optional saved-home controls from parent to keep UI in sync
  isHomeSaved?: (id: string, address?: string) => boolean;
  saveHome?: (p: SearchResult) => Promise<void>;
  removeSavedHome?: (id: string, address?: string) => Promise<void>;
}): JSX.Element {
  const {
    items,
    selectedId,
    isLoading,
    onNavigateToProperty,
    activeTab,
    isHomeSaved,
    saveHome,
    removeSavedHome,
  } = props;
  const SIDEBAR_INITIAL = 10;
  const SIDEBAR_PAGE_SIZE = 10;
  // Track which property is showing the reason card
  const [reasonCardPropertyId, setReasonCardPropertyId] = useState<string | null>(null);
  const { t } = useLocalization();
  const { markNotInterested, removeNotInterested, isNotInterested } = useNotInterestedHomesData();
  // Filter out not-interested homes from results tab so they disappear after marking
  const filteredByTab =
    activeTab === "results"
      ? items.filter(
          (p) => !isNotInterested(p.id, typeof p.address === "string" ? p.address : undefined)
        )
      : items;
  // Deduplicate by id so React keys are unique (API may return same listing twice)
  const seenIds = new Set<string>();
  const displayItems = filteredByTab.filter((p) => {
    if (seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  });
  // Results tab with many items: show 10 initially, then +10 on scroll to bottom
  const useIncrementalLoad = activeTab === "results" && displayItems.length > SIDEBAR_INITIAL;
  const [visibleCount, setVisibleCount] = useState(() =>
    useIncrementalLoad ? SIDEBAR_INITIAL : displayItems.length
  );
  // Reset visible count when items or tab change
  useEffect(() => {
    if (activeTab === "results" && displayItems.length > SIDEBAR_INITIAL) {
      setVisibleCount(SIDEBAR_INITIAL);
    } else {
      setVisibleCount(displayItems.length);
    }
  }, [activeTab, displayItems.length]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + SIDEBAR_PAGE_SIZE, displayItems.length));
  }, [displayItems.length]);
  useEffect(() => {
    if (!useIncrementalLoad || visibleCount >= displayItems.length) return;
    const el = sentinelRef.current;
    if (!el) return;
    const win = getWindow();
    const IO = win
      ? (
          win as unknown as {
            IntersectionObserver?: typeof globalThis.IntersectionObserver;
          }
        ).IntersectionObserver
      : undefined;
    if (!IO || typeof IO !== "function") return;
    const observer = new IO(
      (entries: IntersectionObserverEntry[]) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      {
        root: el.closest(".overflow-y-auto") ?? null,
        rootMargin: "100px",
        threshold: 0,
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [useIncrementalLoad, visibleCount, displayItems.length, loadMore]);
  // Use centralized score calculation
  const calculatePropertyScore = (property: SearchResult) => {
    return getMatchScore(property);
  };
  if (items.length === 0) {
    return (
      <Box className="py-8 text-center text-neutral-600">
        {activeTab === "results" ? (
          <>
            <Icon name="map-pin" className="mobile-icon-lg mx-auto mb-2 text-neutral-400" />
            <BodyText as="p" size="sm">
              {t("search.click_map_to_search")}
            </BodyText>
          </>
        ) : (
          <>
            <Icon
              name="bookmark"
              className="mx-auto mb-2 h-6 w-6 text-neutral-400 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12"
            />
            <BodyText as="p" size="sm">
              {t("search.no_saved_homes_yet")}
            </BodyText>
            <BodyText as="p" size="xs" className="mt-1">
              {t("search.click_heart_to_save")}
            </BodyText>
          </>
        )}
      </Box>
    );
  }
  // Handle reason selection - use markNotInterested (add) since we show the reason card
  // before any API call; the home is not in the not-interested list yet
  const handleSelectReason = async (property: SearchResult, why: string) => {
    try {
      await markNotInterested(property, why);
      setReasonCardPropertyId(null);
    } catch (error) {
      log.error(LOG_CATEGORIES.SEARCH, "Failed to mark not interested", error);
      throw error;
    }
  };
  // Handle undo
  const handleUndo = async (property: SearchResult) => {
    const propertyAddress = typeof property.address === "string" ? property.address : "";
    try {
      await removeNotInterested(property.id, propertyAddress);
      setReasonCardPropertyId(null);
    } catch (error) {
      log.error(LOG_CATEGORIES.SEARCH, "Failed to undo", error);
      throw error;
    }
  };
  const itemsToRender = useIncrementalLoad ? displayItems.slice(0, visibleCount) : displayItems;
  return (
    <Box className="scrollbar-hide max-md:pb-mobile-nav h-full space-y-3 overflow-y-auto pr-2">
      {itemsToRender.map((property: SearchResult) => {
        const showReasonCard = reasonCardPropertyId === property.id && activeTab === "results";
        return (
          <Box
            key={property.id}
            role={showReasonCard ? undefined : "button"}
            tabIndex={showReasonCard ? undefined : 0}
            className={`relative overflow-hidden rounded-lg border transition-all ${showReasonCard ? "" : "cursor-pointer"} ${
              selectedId === property.id
                ? "border-olive bg-olive/5"
                : "border-border hover:border-olive/50 hover:bg-neutral-50"
            }`}
            onClick={showReasonCard ? undefined : () => onNavigateToProperty(property)}
            onKeyDown={
              showReasonCard
                ? undefined
                : (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onNavigateToProperty(property);
                    }
                  }
            }
          >
            {/* Loading overlay */}
            {isLoading && (
              <Box className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm">
                <KeyTurnLoader message="Loading details..." />
              </Box>
            )}

            {showReasonCard ? (
              <Box
                role="button"
                tabIndex={0}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                <WhyNotInterestedCard
                  property={property}
                  onSelectReason={(why) => handleSelectReason(property, why)}
                  onUndo={() => handleUndo(property)}
                  cardType="searchpage"
                />
              </Box>
            ) : (
              <>
                {/* Property Image */}
                <Box className="relative">
                  <CardImageContainer
                    imageUrl={property.imageUrl}
                    alt={property.address ?? "Property image"}
                    height={activeTab === "results" ? "sm" : "responsive"}
                    imageVariant="professional"
                    className={activeTab === "saved" ? "rounded-t-lg" : ""}
                  />

                  {/* Top Content (buttons) - positioned on image overlay like PropertyCard */}
                  {activeTab === "results" && (
                    <Box className="pointer-events-none absolute inset-0">
                      <Box className="pointer-events-auto relative h-full w-full">
                        <CardNotInterested
                          property={property}
                          size="sm"
                          position="top-left"
                          onMarkNotInterested={() => setReasonCardPropertyId(property.id)}
                        />
                        {isHomeSaved && saveHome && removeSavedHome ? (
                          <CardHeartSaveWithProps
                            property={{
                              id: property.id,
                              address:
                                typeof property.address === "string" ? property.address : undefined,
                            }}
                            isSaved={isHomeSaved(
                              property.id,
                              typeof property.address === "string" ? property.address : undefined
                            )}
                            saveHome={async () => saveHome(property)}
                            removeSavedHome={removeSavedHome}
                            size="sm"
                            position="top-right"
                          />
                        ) : (
                          <ConnectedCardHeartSave
                            property={property}
                            size="sm"
                            position="top-right"
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                  {activeTab === "saved" && (
                    <Box className="pointer-events-none absolute inset-0">
                      <Box className="pointer-events-auto relative h-full w-full">
                        {isHomeSaved && saveHome && removeSavedHome ? (
                          <CardHeartSaveWithProps
                            property={{
                              id: property.id,
                              address:
                                typeof property.address === "string" ? property.address : undefined,
                            }}
                            isSaved={isHomeSaved(
                              property.id,
                              typeof property.address === "string" ? property.address : undefined
                            )}
                            saveHome={async () => saveHome(property)}
                            removeSavedHome={removeSavedHome}
                            size="sm"
                            position="top-right"
                          />
                        ) : (
                          <ConnectedCardHeartSave
                            property={property}
                            size="sm"
                            position="top-right"
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>

                <Box className={activeTab === "results" ? "p-3" : "space-responsive-xs"}>
                  <Box className="min-w-0 flex-1">
                    {activeTab === "saved" && (
                      <Box className="mb-1 flex items-center gap-2">
                        {typeof property.propertyType === "string" &&
                          property.propertyType.toLowerCase() !== "single_family" && (
                            <BodyText as="span" size="xs" className="text-neutral-600">
                              {formatPropertyType(property.propertyType)}
                            </BodyText>
                          )}
                      </Box>
                    )}

                    {/* Address */}
                    <Title
                      as="h3"
                      size="sm"
                      className="mb-1 line-clamp-2 font-medium text-neutral-800"
                    >
                      {typeof property.address === "string" || typeof property.address === "number"
                        ? property.address
                        : "[Invalid address]"}
                    </Title>

                    {/* Price and Match Score */}
                    <Box className="justify-left flex">
                      <BodyText
                        as="p"
                        size="sm"
                        className={`flex-1 font-semibold text-neutral-800 ${activeTab === "saved" ? "text-responsive-lg mb-2" : ""}`}
                      >
                        {typeof property.price === "string"
                          ? property.price.startsWith("$")
                            ? property.price
                            : `$${property.price}`
                          : typeof property.price === "number"
                            ? `$${property.price}`
                            : "[Invalid price]"}
                      </BodyText>
                      {activeTab === "results" && (
                        <CardMatchScore
                          score={calculatePropertyScore(property)}
                          size="xs"
                          useColorStyling={true}
                          className="ml-2"
                        />
                      )}
                    </Box>

                    {/* Property Details */}
                    <CardPropertyDetails
                      bedrooms={property.bedrooms}
                      bathrooms={property.bathrooms}
                      sqft={property.sqft}
                      lotSize={property.lotSize}
                      variant="horizontal"
                      className="mb-2 sm:mb-3 [&_*]:!text-neutral-600"
                    />
                  </Box>
                </Box>
              </>
            )}
          </Box>
        );
      })}
      {useIncrementalLoad && visibleCount < displayItems.length && (
        <Box ref={sentinelRef} className="h-1 w-full" aria-hidden />
      )}
    </Box>
  );
}
