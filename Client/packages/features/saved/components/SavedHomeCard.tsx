import React from "react";

import { CardCompareCheckbox } from "packages/features/compare";
import type { SavedHome } from "packages/types";
import { ConnectedCardHeartSave } from "packages/ui/components/button/ConnectedCardHeartSave";
import { Box, Image, Text } from "packages/ui/components/primitives";
import { addressStreetLineForCard } from "packages/utils/format/property/addressFormatting";

import { PropertyCard } from "@/components/cards";

export type SavedHomeCardProps = {
  home: SavedHome;
  isSelected: boolean;
  onToggleCompare: (homeId: string) => void;
  onUnlock: (home: SavedHome) => void;
  /** `list`: horizontal row with image flush left (Library list view). Default grid uses PropertyCard. */
  layout?: "grid" | "list";
};

function toCardProperty(home: SavedHome) {
  return {
    id: home.home_id,
    address: home.address ?? home.description ?? "",
    price:
      typeof home.price === "string" || typeof home.price === "number" ? String(home.price) : "",
    bedrooms: home.bedrooms ?? 0,
    bathrooms: home.bathrooms ?? 0,
    sqft: home.sqft ?? 0,
    lat: home.lat ?? 0,
    lng: home.lng ?? 0,
    images: home.image_url ? [home.image_url] : [],
  };
}

/**
 * Saved home card for web: PropertyCard with image, compare checkbox (top-left),
 * heart save (top-right). Clicking the card navigates to property details.
 * List layout matches Library list mode: image left, details inline to the right.
 */
export function SavedHomeCard({
  home,
  isSelected,
  onToggleCompare,
  onUnlock,
  layout = "grid",
}: SavedHomeCardProps) {
  const address = addressStreetLineForCard(
    typeof home.address === "string" || typeof home.address === "number"
      ? home.address.toString()
      : (home.description ?? "[Invalid address]")
  );
  const price =
    typeof home.price === "string" || typeof home.price === "number"
      ? home.price.toString()
      : "[Invalid price]";
  const property = toCardProperty(home);

  const detailsLine = [
    home.bedrooms != null ? `${home.bedrooms} bed` : null,
    home.bathrooms != null ? `${home.bathrooms} bath` : null,
    home.sqft != null && home.sqft > 0 ? `${home.sqft.toLocaleString()} sqft` : null,
    typeof home.lot_size === "string" && home.lot_size.trim() !== "" ? home.lot_size : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const cardClass =
    "group relative w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

  if (layout === "list") {
    return (
      <Box
        role="button"
        tabIndex={0}
        className={cardClass}
        onClick={() => onUnlock(home)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onUnlock(home);
          }
        }}
      >
        <Box className="border-border bg-background-surface hover:border-border-card-strong flex w-full max-w-full flex-row overflow-hidden rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
          <Box className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
            {home.image_url ? (
              <Image
                src={home.image_url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <Box className="bg-background-muted h-full w-full" />
            )}
            <CardCompareCheckbox
              isSelected={isSelected}
              onToggle={() => onToggleCompare(home.home_id)}
              position="top-left"
              size="sm"
            />
            <ConnectedCardHeartSave property={property} position="top-right" size="sm" />
          </Box>
          <Box className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-3 sm:px-4 sm:py-4">
            <Text className="text-text-primary line-clamp-2 text-left text-sm font-semibold leading-snug">
              {address}
            </Text>
            <Text className="text-primary text-left text-base font-bold sm:text-lg">{price}</Text>
            {detailsLine ? (
              <Text className="text-text-secondary line-clamp-2 text-left text-xs">
                {detailsLine}
              </Text>
            ) : null}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      role="button"
      tabIndex={0}
      className={cardClass}
      onClick={() => onUnlock(home)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onUnlock(home);
        }
      }}
    >
      <PropertyCard
        id={home.home_id}
        imageUrl={home.image_url}
        address={address}
        price={price}
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
            <CardCompareCheckbox
              isSelected={isSelected}
              onToggle={() => onToggleCompare(home.home_id)}
              position="top-left"
              size="sm"
            />
            <ConnectedCardHeartSave property={property} position="top-right" size="sm" />
          </>
        }
      />
    </Box>
  );
}
