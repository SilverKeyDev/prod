import { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { CardCompareCheckbox } from "packages/features/compare";
import { log } from "packages/logger";
import { Box } from "packages/ui/components/structure/primitives";
import { getWindow } from "packages/utils/core/platform";

import { PERFECT_CRITERIA_MATCH_CARD_CLASSNAME } from "@/components/cards/property/perfectMatchCardGlowClasses";
import WhyNotInterestedCard from "@/components/cards/property/WhyNotInterestedCard.web";
import { BodyText, KeyTurnLoader } from "@/components/ui";
import { SearchResultListingCard } from "@/features/search/components/list/SearchResultListingCard.web";
import { useNotInterestedHomesData } from "@/features/search/hooks/data/saved/useNotInterestedHomesData";
import { isListingFullCriteriaMatch, type SearchResult } from "@/features/search/types";

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
  /** Agent: multi-select homes to share in messaging (results tab only). */
  agentShareBundle?: {
    isSelected: (propertyId: string) => boolean;
    onToggle: (propertyId: string) => void;
  };
  /** Agent: bottom share dock is visible (≥1 home selected); drives top-left icon (share vs +). */
  agentShareDockVisible?: boolean;
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
    agentShareBundle,
    agentShareDockVisible = false,
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
  if (items.length === 0) {
    return (
      <Box className="py-8 text-center text-neutral-600">
        {activeTab === "results" ? (
          <>
            <Icon name="map-pin" className="mobile-icon-lg mx-auto mb-2 text-neutral-400" />
            <BodyText as="p" size="sm" muted>
              {t("search.click_map_to_search")}
            </BodyText>
          </>
        ) : (
          <>
            <Icon
              name="bookmark"
              className="mx-auto mb-2 h-6 w-6 text-neutral-400 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12"
            />
            <BodyText as="p" size="sm" className="text-text-secondary">
              {t("search.no_saved_homes_yet")}
            </BodyText>
            <BodyText as="p" size="xs" className="text-text-secondary mt-1">
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
      log.error("SEARCH", "Failed to mark not interested", error);
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
      log.error("SEARCH", "Failed to undo", error);
      throw error;
    }
  };
  const itemsToRender = useIncrementalLoad ? displayItems.slice(0, visibleCount) : displayItems;
  return (
    <Box className="scrollbar-hide h-full space-y-3 overflow-y-auto pr-2">
      {itemsToRender.map((property: SearchResult, index: number) => {
        const showReasonCard = reasonCardPropertyId === property.id && activeTab === "results";
        const fullCriteriaMatch = isListingFullCriteriaMatch(property);
        return (
          <Box
            key={property.id}
            role={showReasonCard ? undefined : "button"}
            tabIndex={showReasonCard ? undefined : 0}
            className={`border-border relative overflow-hidden rounded-lg border bg-white transition-all ${
              showReasonCard ? "" : "cursor-pointer"
            } ${
              selectedId === property.id
                ? "bg-olive/5 border-neutral-400"
                : "hover:border-neutral-400 hover:bg-neutral-50"
            }${fullCriteriaMatch ? ` ${PERFECT_CRITERIA_MATCH_CARD_CLASSNAME}` : ""}`}
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
              <Box className="z-header absolute inset-0 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm">
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
              <SearchResultListingCard
                property={property}
                activeTab={activeTab}
                isHomeSaved={isHomeSaved}
                saveHome={saveHome}
                removeSavedHome={removeSavedHome}
                isLcpImage={index === 0}
                showNotInterested={activeTab === "results"}
                onMarkNotInterested={() => setReasonCardPropertyId(property.id)}
                topLeftOverlay={
                  activeTab === "results" && agentShareBundle ? (
                    <CardCompareCheckbox
                      isSelected={agentShareBundle.isSelected(property.id)}
                      onToggle={() => {
                        agentShareBundle.onToggle(property.id);
                      }}
                      position="top-left"
                      size="sm"
                      unselectedIcon={agentShareDockVisible ? "plus" : "share"}
                      ariaLabel={
                        agentShareBundle.isSelected(property.id)
                          ? t("search.agent_share_select_remove_aria")
                          : t("search.agent_share_select_add_aria")
                      }
                    />
                  ) : undefined
                }
              />
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
