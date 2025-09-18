import React from "react";

import { CardCarousel } from "../../../../components/cards/base";
import HomeCard, {
  type HomeDescription,
} from "../../../../components/cards/HomeCard";
import type { PropertyDetails } from "../../../../core/schemas/search";

export function PropertyCarousel(props: {
  items: PropertyDetails[];
  perPage: number;
  currentPage: number;
  isHomeSaved: (id: string) => boolean;
  savedAddresses?: Set<string>;
  onSave: (p: PropertyDetails) => void;
  onViewDetails: (p: PropertyDetails) => void;
  onRemoveSavedHome: (id: string) => void;
  activeTab?: "results" | "saved";
}): JSX.Element {
  const { items, isHomeSaved, onSave, onRemoveSavedHome, activeTab } = props;

  // Single log for search results being rendered
  React.useEffect(() => {
    console.log("🔎 [SEARCH_RENDER] Carousel items:", {
      count: items.length,
      tab: activeTab,
    });
  }, [items, activeTab]);

  if (items.length === 0) {
    return (
      <div className="text-center py-responsive-md sm:py-responsive-lg text-gray-500 px-responsive-sm">
        {activeTab === "results" ? (
          <>
            <p className="text-responsive-sm sm:text-responsive-md">
              No search results yet.
            </p>
            <p className="text-responsive-xs sm:text-responsive-sm mt-1">
              Tap "Search Properties" to find homes.
            </p>
          </>
        ) : (
          <>
            <p className="text-responsive-sm sm:text-responsive-md">
              No saved homes yet.
            </p>
            <p className="text-responsive-xs sm:text-responsive-sm mt-1">
              Save homes from search results.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <CardCarousel
      items={items}
      loading={false}
      error={null}
      emptyMessage={
        activeTab === "results"
          ? "No search results yet. Tap 'Search Properties' to find homes."
          : "No saved homes yet. Save homes from search results."
      }
      renderItem={(property: PropertyDetails, _index: number) => {
        // Convert PropertyDetails to HomeDescription format for HomeCard
        const homeDescription: HomeDescription = {
          home_id: property.id,
          address:
            typeof property.address === "string" ||
            typeof property.address === "number"
              ? property.address.toString()
              : "[Invalid address]",
          price:
            typeof property.price === "string"
              ? property.price.startsWith("$")
                ? property.price
                : `$${property.price}`
              : typeof property.price === "number"
                ? `$${property.price.toLocaleString()}`
                : "[Invalid price]",
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          sqft: property.sqft,
          lot_size: property.lotSize,
          image_url: undefined, // Intentionally no images
          lat: property.lat,
          lng: property.lng,
          calculatedScore: property._score || property.calculatedScore || 0,
        };

        return (
          <HomeCard
            home={homeDescription}
            isHomeSaved={isHomeSaved}
            onSave={
              activeTab === "results"
                ? (home: HomeDescription) => {
                    // Convert HomeDescription back to PropertyDetails for the callback
                    const propertyDetails: PropertyDetails = {
                      id: home.home_id,
                      address: home.address || "",
                      price: home.price || "",
                      bedrooms: home.bedrooms || 0,
                      bathrooms: home.bathrooms || 0,
                      sqft: home.sqft || 0,
                      lotSize:
                        typeof home.lot_size === "string"
                          ? home.lot_size
                          : undefined,
                      imageUrl: home.image_url,
                      lat: home.lat || 0,
                      lng: home.lng || 0,
                      propertyType: "SINGLE_FAMILY", // Default value
                      listingStatus: "FOR_SALE", // Default value
                      _score: home.calculatedScore,
                    };
                    onSave(propertyDetails);
                  }
                : undefined
            }
            onRemove={activeTab === "saved" ? onRemoveSavedHome : undefined}
            showScore={activeTab === "results"}
          />
        );
      }}
      getItemKey={(property: PropertyDetails, _index: number) => property.id}
      cardMinWidth={280}
      cardGap={16}
      infiniteLoop={false}
      ariaLabel={`${activeTab === "results" ? "Search results" : "Saved homes"} carousel`}
    />
  );
}
