import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { ConnectedCardHeartSave } from "packages/features/search";
import type { SavedHome } from "packages/types";
import { Button, Title } from "packages/ui/components/index.web";

import { PropertyCard } from "@/components/cards";
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
function SelectedCompareCard({
  home,
  onRemove,
}: {
  home: SavedHome;
  onRemove: (homeId: string) => void;
}) {
  const { t } = useLocalization();
  return (
    <div className="scale-75 sm:scale-90 md:scale-100">
      <PropertyCard
        id={home.home_id}
        imageUrl={home.image_url}
        address={
          typeof home.address === "string" || typeof home.address === "number"
            ? home.address.toString()
            : (home.description ?? "[Invalid address]")
        }
        price={
          typeof home.price === "string" || typeof home.price === "number"
            ? home.price.toString()
            : "[Invalid price]"
        }
        bedrooms={home.bedrooms}
        bathrooms={home.bathrooms}
        sqft={home.sqft && home.sqft > 0 ? home.sqft : undefined}
        lotSize={typeof home.lot_size === "string" ? home.lot_size : undefined}
        pricePosition="below-address"
        cardType="searchpage"
        showScore={false}
        topContent={
          <div className="flex items-center justify-between">
            <ConnectedCardHeartSave property={toCardProperty(home)} size="sm" />
            <Button
              type="button"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(home.home_id);
              }}
              className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-400 shadow-md ring-1 ring-black/5 transition-all duration-300 hover:scale-110 hover:text-gray-600 active:scale-95"
              label={t("compare.remove_aria")}
            >
              <Icon name="x" className="h-4 w-4 transition-transform duration-200" />
            </Button>
          </div>
        }
      />
    </div>
  );
}
type PropertyCardsGridProps = {
  selectedHomes: SavedHome[];
  onRemove: (homeId: string) => void;
  onUnlock: (home: SavedHome) => Promise<void>;
};
export function PropertyCardsGrid({ selectedHomes, onRemove }: PropertyCardsGridProps) {
  const { t } = useLocalization();
  if (selectedHomes.length === 0) return null;
  return (
    <div className="mb-responsive-md">
      <Title size="sm" className="mb-responsive-md font-medium">
        {t("compare.property_details")}
      </Title>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {selectedHomes.map((home) => (
          <SelectedCompareCard key={home.home_id} home={home} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
