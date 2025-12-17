import { X } from "lucide-react";
import type { SavedHome } from "../../../../../packages/schemas";
import { PropertyCard } from "../../cards";
import { CardHeartSave } from "../../cards/base";
import IconButton from "../../ui/button/IconButton";
import { Title } from "../../ui";

type PropertyCardsGridProps = {
  selectedHomes: SavedHome[];
  onRemove: (homeId: string) => void;
  onUnlock: (home: SavedHome) => Promise<void>;
};

export function PropertyCardsGrid({
  selectedHomes,
  onRemove,
  onUnlock,
}: PropertyCardsGridProps) {
  if (selectedHomes.length === 0) {
    return null;
  }

  return (
    <div className="mb-responsive-md">
      <Title size="sm" className="mb-responsive-md font-medium">
        Property Details
      </Title>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {selectedHomes.map((home: SavedHome) => (
          <div key={home.home_id} className="scale-75 sm:scale-90 md:scale-100">
            <PropertyCard
              id={home.home_id}
              imageUrl={home.image_url}
              address={
                typeof home.address === "string" ||
                typeof home.address === "number"
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
              lotSize={
                typeof home.lot_size === "string" ? home.lot_size : undefined
              }
              pricePosition="below-address"
              cardType="searchpage"
              showScore={false}
              topContent={
                <div className="flex items-center justify-between">
                  <CardHeartSave
                    property={{
                      id: home.home_id,
                      address: home.address ?? home.description ?? "",
                      price:
                        typeof home.price === "string" ||
                        typeof home.price === "number"
                          ? String(home.price)
                          : "",
                      bedrooms: home.bedrooms ?? 0,
                      bathrooms: home.bathrooms ?? 0,
                      sqft: home.sqft ?? 0,
                      lat: home.lat ?? 0,
                      lng: home.lng ?? 0,
                      images: home.image_url ? [home.image_url] : [],
                    }}
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(home.home_id);
                    }}
                    className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 text-gray-400 hover:text-gray-600"
                    aria-label="Remove from comparison"
                  >
                    <X className="h-4 w-4 transition-transform duration-200" />
                  </button>
                </div>
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
