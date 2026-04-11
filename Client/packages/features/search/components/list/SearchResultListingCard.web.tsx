import type { ReactNode } from "react";

import { ConnectedCardHeartSave } from "packages/features/search/components/ConnectedCardHeartSave";
import { formatPropertyType } from "packages/features/search/types/search/propertyFormatters";
import { displayListingPriceForCard } from "packages/features/search/utils/formatPropertySearchListingPrice";
import CardNotInterested from "packages/ui/components/button/NotInterested";
import { Box } from "packages/ui/components/primitives";

import {
  CardHeartSaveWithProps,
  CardImageContainer,
  CardMatchScore,
  CardPropertyDetails,
  TrianglePointer,
} from "@/components/cards/base/index.web";
import { BodyText, Title } from "@/components/ui";
import { getMatchScore, type SearchResult } from "@/features/search/types";

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
  /** Results tab: show match score chip (map may hide when no valid score). */
  showMatchScore?: boolean;
  /** Optional footer (e.g. map View button). */
  bottomContent?: ReactNode;
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
  showMatchScore = true,
  bottomContent,
}: SearchResultListingCardProps): JSX.Element {
  const showScoreRow = activeTab === "results" && showMatchScore;

  const imageAndBody = (
    <>
      <Box className="relative">
        <CardImageContainer
          imageUrl={property.imageUrl}
          alt={property.address ?? "Property image"}
          height={activeTab === "results" ? "sm" : "responsive"}
          imageVariant="professional"
          className={activeTab === "saved" ? "rounded-t-lg" : ""}
        />

        {activeTab === "results" && (
          <Box className="pointer-events-none absolute inset-0">
            <Box className="pointer-events-auto relative h-full w-full">
              {showNotInterested && onMarkNotInterested ? (
                <CardNotInterested
                  property={property}
                  size="sm"
                  position="top-left"
                  onMarkNotInterested={onMarkNotInterested}
                />
              ) : null}
              {isHomeSaved && saveHome && removeSavedHome ? (
                <CardHeartSaveWithProps
                  property={{
                    id: property.id,
                    address:
                      typeof property.address === "string"
                        ? property.address
                        : undefined,
                  }}
                  isSaved={isHomeSaved(
                    property.id,
                    typeof property.address === "string"
                      ? property.address
                      : undefined,
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
                      typeof property.address === "string"
                        ? property.address
                        : undefined,
                  }}
                  isSaved={isHomeSaved(
                    property.id,
                    typeof property.address === "string"
                      ? property.address
                      : undefined,
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

          <Title
            as="h3"
            size="sm"
            className="mb-1 line-clamp-2 font-medium text-neutral-800"
          >
            {typeof property.address === "string" ||
            typeof property.address === "number"
              ? property.address
              : "[Invalid address]"}
          </Title>

          {activeTab === "results" ? (
            <Box className="flex w-full min-w-0 flex-row flex-nowrap items-center justify-center gap-2">
              <BodyText
                as="p"
                size="sm"
                className="min-w-0 shrink truncate font-semibold leading-none text-neutral-800"
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

  return (
    <>
      {isOnMap ? <TrianglePointer show size={3} /> : null}
      <Box className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        {imageAndBody}
      </Box>
    </>
  );
}
