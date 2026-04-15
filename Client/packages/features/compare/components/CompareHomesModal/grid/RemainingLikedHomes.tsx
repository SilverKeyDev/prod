import React from "react";

import { useLocalization } from "packages/contexts";
import CardCompareCheckbox from "packages/features/compare/components/CardCompareCheckbox";
import type { SavedHome } from "packages/types";
import { ConnectedCardHeartSave } from "packages/ui/components/button/ConnectedCardHeartSave";
import { Box } from "packages/ui/components/primitives";
import { addressStreetLineForCard } from "packages/utils/format/property/addressFormatting";

import { PropertyCard } from "@/components/cards";
import { Title } from "@/components/ui";

function toCardProperty(home: SavedHome) {
  return {
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
  };
}

type RemainingLikedHomesProps = {
  allLikedHomes: SavedHome[];
  selectedHomes: SavedHome[];
  onAdd: (homeId: string) => void;
  onUnlock: (home: SavedHome) => Promise<void>;
};

export function RemainingLikedHomes({
  allLikedHomes,
  selectedHomes,
  onAdd,
  onUnlock,
}: RemainingLikedHomesProps) {
  const { t } = useLocalization();
  const selectedHomeIds = new Set(selectedHomes.map((h) => h.home_id));
  const remainingHomes = allLikedHomes.filter(
    (home) => !selectedHomeIds.has(home.home_id),
  );
  if (remainingHomes.length === 0) return null;
  return (
    <Box>
      <Title
        size="sm"
        className="mb-responsive-md text-text-primary font-medium"
      >
        {t("compare.add_more_properties")}
      </Title>
      <Box className="gap-responsive-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {remainingHomes.map((home) => {
          const address = addressStreetLineForCard(
            typeof home.address === "string" || typeof home.address === "number"
              ? home.address.toString()
              : home.description ?? t("house.invalid_address"),
          );
          const price =
            typeof home.price === "string" || typeof home.price === "number"
              ? home.price.toString()
              : t("house.invalid_price");
          const property = toCardProperty(home);
          return (
            <Box key={home.home_id} className="w-full">
              <Box
                role="button"
                tabIndex={0}
                className="group relative w-full cursor-pointer"
                onClick={() => {
                  void onUnlock(home);
                }}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void onUnlock(home);
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
                  lotSize={
                    typeof home.lot_size === "string"
                      ? home.lot_size
                      : undefined
                  }
                  pricePosition="below-address"
                  cardType="searchpage"
                  showScore={false}
                  width="full"
                  topContent={
                    <>
                      <CardCompareCheckbox
                        isSelected={false}
                        onToggle={() => onAdd(home.home_id)}
                        position="top-left"
                        size="sm"
                      />
                      <ConnectedCardHeartSave
                        property={property}
                        position="top-right"
                        size="sm"
                      />
                    </>
                  }
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
