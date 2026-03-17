import { useLocalization } from "packages/contexts";
import type { SavedHome } from "packages/types";
import { ConnectedCardHeartSave } from "packages/ui/components/button/ConnectedCardHeartSave";
import { Box } from "packages/ui/components/primitives";

import { PropertyCard } from "@/components/cards";
import { CardViewDetailsButton } from "@/components/cards/base/index.web";
import { Title } from "@/components/ui";

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

function RemainingCompareCard({
  home,
  onAdd,
  onUnlock,
}: {
  home: SavedHome;
  onAdd: (homeId: string) => void;
  onUnlock: (home: SavedHome) => Promise<void>;
}) {
  const { t } = useLocalization();
  return (
    <Box className="scale-75 sm:scale-90 md:scale-100">
      <PropertyCard
        id={home.home_id}
        imageUrl={home.image_url}
        address={
          typeof home.address === "string" || typeof home.address === "number"
            ? home.address.toString()
            : (home.description ?? t("house.invalid_address"))
        }
        price={
          typeof home.price === "string" || typeof home.price === "number"
            ? home.price.toString()
            : t("house.invalid_price")
        }
        bedrooms={home.bedrooms}
        bathrooms={home.bathrooms}
        sqft={home.sqft && home.sqft > 0 ? home.sqft : undefined}
        lotSize={typeof home.lot_size === "string" ? home.lot_size : undefined}
        pricePosition="below-address"
        cardType="searchpage"
        showScore={false}
        onClick={() => onAdd(home.home_id)}
        topContent={
          <Box className="flex flex-row items-center gap-1">
            <ConnectedCardHeartSave property={toCardProperty(home)} size="sm" />
          </Box>
        }
        bottomContent={
          <CardViewDetailsButton
            onClick={() => onUnlock(home)}
            size="xs"
            variant="unlock"
            fullWidth
            text={t("common.unlock")}
          />
        }
      />
    </Box>
  );
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
  const remainingHomes = allLikedHomes.filter((home) => !selectedHomeIds.has(home.home_id));
  if (remainingHomes.length === 0) return null;
  return (
    <Box>
      <Title size="sm" className="mb-responsive-md text-text-primary font-medium">
        {t("compare.add_more_properties")}
      </Title>
      <Box className="grid-responsive-2-gap-2">
        {remainingHomes.map((home) => (
          <RemainingCompareCard key={home.home_id} home={home} onAdd={onAdd} onUnlock={onUnlock} />
        ))}
      </Box>
    </Box>
  );
}
