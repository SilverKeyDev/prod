import React from "react";

import { CardCompareCheckbox } from "packages/features/compare";
import type { SavedHome } from "packages/types";
import { ConnectedCardHeartSave } from "packages/ui/components/primitives";

import { PropertyCard } from "@/components/cards";
import { CardViewDetailsButton } from "@/components/cards/base/index.web";

export type SavedHomeCardProps = {
  home: SavedHome;
  isSelected: boolean;
  onToggleCompare: (homeId: string) => void;
  onUnlock: (home: SavedHome) => void;
  onNegotiate: (home: SavedHome) => void;
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
 * Saved home card for web: matches the exact implementation used on the Saved page —
 * PropertyCard with image, compare checkbox (top-left), heart save (top-right),
 * Unlock and Negotiate buttons below.
 */
export function SavedHomeCard({
  home,
  isSelected,
  onToggleCompare,
  onUnlock,
  onNegotiate,
}: SavedHomeCardProps) {
  const address =
    typeof home.address === "string" || typeof home.address === "number"
      ? home.address.toString()
      : (home.description ?? "[Invalid address]");
  const price =
    typeof home.price === "string" || typeof home.price === "number"
      ? home.price.toString()
      : "[Invalid price]";
  const property = toCardProperty(home);

  return (
    <div className="group relative w-full">
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
        bottomContent={
          <div className="flex flex-col gap-2">
            <CardViewDetailsButton
              onClick={() => onUnlock(home)}
              size="sm"
              variant="unlock"
              fullWidth
              text="Unlock"
            />
            <CardViewDetailsButton
              onClick={() => onNegotiate(home)}
              size="sm"
              variant="negotiate"
              fullWidth
              text="Negotiate"
              iconName="handshake"
            />
          </div>
        }
      />
    </div>
  );
}
