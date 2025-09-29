import { PropertyCard } from "../../../../components/cards";
import { CardCarousel } from "../../../../components/cards/base";
import type { SearchResult } from "../../../../../../packages/schemas/search";

export function PropertyCarousel(props: {
  items: SearchResult[];
  perPage: number;
  currentPage: number;
  isHomeSaved: (id: string) => boolean;
  onSave: (p: SearchResult) => void;
  onViewDetails: (p: SearchResult) => void;
}): JSX.Element {
  const { items, perPage, currentPage, isHomeSaved, onSave, onViewDetails } =
    props;

  if (items.length === 0) {
    return (
      <div className="py-responsive-md sm:py-responsive-lg px-responsive-sm text-center text-gray-500">
        <p className="text-responsive-sm sm:text-responsive-md">
          No properties yet.
        </p>
        <p className="text-responsive-xs sm:text-responsive-sm mt-1">
          Tap "Search Properties" to find homes.
        </p>
      </div>
    );
  }

  return (
    <CardCarousel
      items={items.slice(currentPage * perPage, (currentPage + 1) * perPage)}
      renderItem={(property: SearchResult, _index: number) => (
        <PropertyCard
          id={property.id}
          imageUrl={property.imageUrl}
          address={
            typeof property.address === "string" ||
            typeof property.address === "number"
              ? property.address.toString()
              : "[Invalid address]"
          }
          price={
            typeof property.price === "string" ||
            typeof property.price === "number"
              ? property.price.toString()
              : "[Invalid price]"
          }
          bedrooms={property.bedrooms}
          bathrooms={property.bathrooms}
          sqft={property.sqft}
          isSaved={isHomeSaved(property.id)}
          onSave={() => onSave(property)}
          onViewDetails={() => onViewDetails(property)}
          cardType="searchpage"
        />
      )}
      getItemKey={(property: SearchResult, _index: number) => property.id}
    />
  );
}
