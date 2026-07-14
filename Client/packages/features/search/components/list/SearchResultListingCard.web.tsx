import { type MouseEvent, type PointerEvent, type ReactNode, useCallback } from "react";

import { Icon } from "@ui/icons";

import { ConnectedCardHeartSave } from "packages/features/search/components/ConnectedCardHeartSave";
import { formatPropertyType } from "packages/features/search/types/search/formatters/propertyFormatters";
import { OVERLAY_MARKER_CIRCLE_CLASSES } from "packages/ui/components";
import CardNotInterested from "packages/ui/components/actions/button/propertyActions/NotInterested";
import { Box } from "packages/ui/components/structure/primitives";
import { getCardBubbleSizeClasses } from "packages/ui/components/surfaces/cards/base/styles";
import { addressStreetLineForCard } from "packages/utils/core/format/property/addressFormatting";
import { displayListingPriceForCard } from "packages/utils/product/search/pricing/formatPropertySearchListingPrice";

import {
  CardHeartSaveWithProps,
  CardImageContainer,
  CardMatchScore,
  CardPropertyDetails,
  TrianglePointer,
} from "@/components/cards/base/index.web";
import { BodyText, Title } from "@/components/ui";
import { getMatchScore, type SearchResult } from "@/features/search/types";
import { SEARCH_TRANSLATIONS } from "@/features/search/types/domain/translations";

/** Matches `CardNotInterested` sidebar overlay (size sm) — icon only; map markers cannot use `<button>`. */
const MAP_PREVIEW_DISMISS_ICON_CLASSNAME = `${
  getCardBubbleSizeClasses("sm").iconClass
} transition-transform duration-200 group-hover:scale-110`;

export type SearchResultListingCardProps = {
  property: SearchResult;
  activeTab: "results" | "saved";
  isHomeSaved?: (id: string, address?: string) => boolean;
  saveHome?: (p: SearchResult) => Promise<void>;
  removeSavedHome?: (id: string, address?: string) => Promise<void>;
  /** Results tab only: show not-interested control (sidebar). */
  showNotInterested?: boolean;
  onMarkNotInterested?: () => void;
  /** Map pin card: triangle below card. */
  isOnMap?: boolean;
  /** Map preview: clicking the card opens full property details (not the pin). */
  onMapNavigate?: () => void;
  /** Map preview: hide floating card (same overlay chrome as heart). */
  onDismissMapPreview?: () => void;
  /** Results tab: show match score chip (map may hide when no valid score). */
  showMatchScore?: boolean;
  /** Optional footer (e.g. map View button). */
  bottomContent?: ReactNode;
  /**
   * Results tab: top-left overlay (e.g. agent share multi-select). When set, takes
   * precedence over `showNotInterested` / `CardNotInterested` in that corner.
   */
  topLeftOverlay?: ReactNode;
  /** First card in the sidebar list: prioritize image for LCP. */
  isLcpImage?: boolean;
  /** Override default image height (results=sm, saved=responsive). */
  imageHeight?: "sm" | "md" | "lg" | "responsive" | "tall";
};

export function SearchResultListingCard({
  property,
  activeTab,
  isHomeSaved,
  saveHome,
  removeSavedHome,
  showNotInterested = false,
  onMarkNotInterested,
  isOnMap = false,
  onMapNavigate,
  onDismissMapPreview,
  showMatchScore = true,
  bottomContent,
  topLeftOverlay,
  isLcpImage = false,
  imageHeight,
}: SearchResultListingCardProps): JSX.Element {
  const handleDismissMapPreviewPointerDown = useCallback((e: PointerEvent) => {
    e.stopPropagation();
  }, []);

  const handleDismissMapPreviewClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      onDismissMapPreview?.();
    },
    [onDismissMapPreview]
  );

  /** AdvancedMarkerElement content must not contain focusable nodes (button, tabindex≥0). */
  const mapDismissOverlay =
    isOnMap && onDismissMapPreview ? (
      <Box className="z-header absolute left-2 top-2">
        <Box
          className={`group relative inline-flex cursor-pointer flex-row items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/30 active:scale-95 ${OVERLAY_MARKER_CIRCLE_CLASSES} text-white hover:text-white`}
          aria-hidden
          title={
            SEARCH_TRANSLATIONS["search.dismiss_map_listing_preview"] ??
            "Hide this listing preview on the map"
          }
          onPointerDown={handleDismissMapPreviewPointerDown}
          onClick={handleDismissMapPreviewClick}
        >
          <Icon name="x" className={MAP_PREVIEW_DISMISS_ICON_CLASSNAME} />
        </Box>
      </Box>
    ) : null;

  const showScoreRow = activeTab === "results" && showMatchScore;
  const addressTitle =
    typeof property.address === "string" || typeof property.address === "number"
      ? addressStreetLineForCard(property.address)
      : "[Invalid address]";

  const imageAndBody = (
    <>
      <Box className="relative">
        <CardImageContainer
          imageUrl={property.imageUrl}
          alt={property.address ?? "Property image"}
          height={imageHeight ?? (activeTab === "results" ? "sm" : "responsive")}
          imageVariant="professional"
          className={activeTab === "saved" ? "rounded-t-lg" : ""}
          isLcpImage={isLcpImage}
        />

        {activeTab === "results" && (
          <Box className="pointer-events-none absolute inset-0">
            <Box className="pointer-events-auto relative h-full w-full">
              {mapDismissOverlay}
              {topLeftOverlay ? (
                <Box
                  className="contents"
                  onClick={
                    isOnMap && onMapNavigate
                      ? (e) => {
                          e.stopPropagation();
                        }
                      : undefined
                  }
                  onPointerDown={
                    isOnMap && onMapNavigate
                      ? (e) => {
                          e.stopPropagation();
                        }
                      : undefined
                  }
                >
                  {topLeftOverlay}
                </Box>
              ) : showNotInterested && onMarkNotInterested ? (
                <Box
                  className="contents"
                  onClick={
                    isOnMap && onMapNavigate
                      ? (e) => {
                          e.stopPropagation();
                        }
                      : undefined
                  }
                  onPointerDown={
                    isOnMap && onMapNavigate
                      ? (e) => {
                          e.stopPropagation();
                        }
                      : undefined
                  }
                >
                  <CardNotInterested
                    property={property}
                    size="sm"
                    position="top-left"
                    onMarkNotInterested={onMarkNotInterested}
                  />
                </Box>
              ) : null}
              <Box
                className="contents"
                onClick={
                  isOnMap && onMapNavigate
                    ? (e) => {
                        e.stopPropagation();
                      }
                    : undefined
                }
                onPointerDown={
                  isOnMap && onMapNavigate
                    ? (e) => {
                        e.stopPropagation();
                      }
                    : undefined
                }
              >
                {isHomeSaved && saveHome && removeSavedHome ? (
                  <CardHeartSaveWithProps
                    property={{
                      id: property.id,
                      address: typeof property.address === "string" ? property.address : undefined,
                    }}
                    isSaved={isHomeSaved(
                      property.id,
                      typeof property.address === "string" ? property.address : undefined
                    )}
                    saveHome={async () => saveHome(property)}
                    removeSavedHome={removeSavedHome}
                    size="sm"
                    position="top-right"
                    nonFocusableMapMarkerSurface={isOnMap}
                  />
                ) : (
                  <ConnectedCardHeartSave
                    property={property}
                    size="sm"
                    position="top-right"
                    nonFocusableMapMarkerSurface={isOnMap}
                  />
                )}
              </Box>
            </Box>
          </Box>
        )}
        {activeTab === "saved" && (
          <Box className="pointer-events-none absolute inset-0">
            <Box className="pointer-events-auto relative h-full w-full">
              {mapDismissOverlay}
              <Box
                className="contents"
                onClick={
                  isOnMap && onMapNavigate
                    ? (e) => {
                        e.stopPropagation();
                      }
                    : undefined
                }
                onPointerDown={
                  isOnMap && onMapNavigate
                    ? (e) => {
                        e.stopPropagation();
                      }
                    : undefined
                }
              >
                {isHomeSaved && saveHome && removeSavedHome ? (
                  <CardHeartSaveWithProps
                    property={{
                      id: property.id,
                      address: typeof property.address === "string" ? property.address : undefined,
                    }}
                    isSaved={isHomeSaved(
                      property.id,
                      typeof property.address === "string" ? property.address : undefined
                    )}
                    saveHome={async () => saveHome(property)}
                    removeSavedHome={removeSavedHome}
                    size="sm"
                    position="top-right"
                    nonFocusableMapMarkerSurface={isOnMap}
                  />
                ) : (
                  <ConnectedCardHeartSave
                    property={property}
                    size="sm"
                    position="top-right"
                    nonFocusableMapMarkerSurface={isOnMap}
                  />
                )}
              </Box>
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

          <Title as="h3" size="sm" className="mb-1 line-clamp-2 font-medium text-neutral-800">
            {addressTitle}
          </Title>

          {activeTab === "results" ? (
            <Box className="flex w-full min-w-0 flex-row flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <BodyText
                as="p"
                size="sm"
                className="whitespace-nowrap font-semibold tabular-nums leading-none text-neutral-800"
              >
                {displayListingPriceForCard(property.price)}
              </BodyText>
              {showScoreRow ? (
                <CardMatchScore
                  score={getMatchScore(property)}
                  size="xs"
                  useColorStyling={true}
                  className="shrink-0"
                />
              ) : null}
            </Box>
          ) : (
            <BodyText
              as="p"
              size="sm"
              className="text-responsive-lg mb-2 font-semibold text-neutral-800"
            >
              {displayListingPriceForCard(property.price)}
            </BodyText>
          )}

          <CardPropertyDetails
            bedrooms={property.bedrooms}
            bathrooms={property.bathrooms}
            sqft={property.sqft}
            lotSize={property.lotSize}
            variant="horizontal"
            className="mb-2 sm:mb-3 [&_*]:!text-neutral-600"
          />
          {bottomContent}
        </Box>
      </Box>
    </>
  );

  /** No role/tabIndex: AdvancedMarkerElement forbids focusable marker content. */
  const mapNavigateHandlers =
    isOnMap && onMapNavigate
      ? {
          className:
            "cursor-pointer overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm",
          onClick: () => onMapNavigate(),
        }
      : {
          className: "overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm",
        };

  return (
    <>
      {isOnMap ? <TrianglePointer show size={3} /> : null}
      <Box {...mapNavigateHandlers}>{imageAndBody}</Box>
    </>
  );
}
