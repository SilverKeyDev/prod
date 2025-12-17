import type { SavedHome } from "../../../../../packages/schemas";
import { PropertyCard } from "../../cards";
import { CardHeartSave, CardViewDetailsButton } from "../../cards/base";
import { Title } from "../../ui";

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
  // Filter out homes that are already selected
  const selectedHomeIds = new Set(selectedHomes.map((home) => home.home_id));
  const remainingHomes = allLikedHomes.filter(
    (home) => !selectedHomeIds.has(home.home_id)
  );

  // Don't render if there are no remaining homes
  if (remainingHomes.length === 0) {
    return null;
  }

  return (
    <div>
      <Title size="sm" className="mb-responsive-sm font-medium">
        More Properties
      </Title>
      <p className="mb-responsive-sm text-responsive-sm text-gray-600">
        Add more properties to compare
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {remainingHomes.map((home: SavedHome) => (
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
              onClick={() => onAdd(home.home_id)}
              topContent={
                <div className="flex items-center gap-1">
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
                </div>
              }
              bottomContent={
                <CardViewDetailsButton
                  onClick={() => onUnlock(home)}
                  size="xs"
                  variant="primary"
                  fullWidth
                  text="Unlock"
                />
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
