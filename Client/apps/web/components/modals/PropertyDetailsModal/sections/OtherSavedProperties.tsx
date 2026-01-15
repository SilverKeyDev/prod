import { Plus } from "lucide-react";
import React from "react";

import { StyledImage } from "../../../cards/base";
import { useSavedHomesData } from "../../../../../../packages/hooks/data/search/useSavedHomesData";
import { usePropertyDetails } from "../../../../../../packages/hooks/data/search/usePropertyDetails";
import type { PropertyComponentProps } from "../../types";

export const OtherSavedProperties: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const { savedHomes, savedHomesLoading } = useSavedHomesData();
  const { fetchPropertyDetails } = usePropertyDetails();

  // Get current property ID for filtering
  const currentPropertyId = property?.id;

  // Filter out current property and get homes with images
  const otherSavedHomes = React.useMemo(() => {
    return savedHomes
      .filter(
        (home) =>
          home.home_id !== currentPropertyId &&
          (home.image_url ||
            (Array.isArray(home.image_urls) && home.image_urls.length > 0))
      )
      .slice(0, 6); // Limit to 6 properties
  }, [savedHomes, currentPropertyId]);

  const handleViewProperty = async (home: (typeof savedHomes)[0]) => {
    const propertyData = {
      id: home.home_id,
      address: String(home.address || home.description || ""),
      price:
        typeof home.price === "string"
          ? home.price.startsWith("$")
            ? home.price
            : `$${home.price}`
          : typeof home.price === "number"
            ? `$${home.price.toLocaleString()}`
            : "Price not available",
      bedrooms: home.bedrooms ?? 0,
      bathrooms: home.bathrooms ?? 0,
      sqft: home.sqft ?? 0,
      lat: home.lat ?? 0,
      lng: home.lng ?? 0,
      latitude: home.lat ?? 0,
      longitude: home.lng ?? 0,
      images: home.image_url ? [home.image_url] : undefined,
    };

    await fetchPropertyDetails(propertyData);
  };

  if (savedHomesLoading || otherSavedHomes.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Other Saved Properties
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          View images from your other saved properties
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {otherSavedHomes.map((home) => {
          const imageUrl =
            home.image_url ||
            (Array.isArray(home.image_urls) && home.image_urls.length > 0
              ? home.image_urls[0]
              : null);

          if (!imageUrl) return null;

          return (
            <button
              key={home.home_id}
              onClick={() => handleViewProperty(home)}
              className="group relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200 hover:border-gold transition-all duration-200 hover:shadow-lg"
              aria-label={`View ${home.address || "property"}`}
            >
              <StyledImage
                src={imageUrl}
                alt={home.address || "Saved property"}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="truncate text-xs text-white font-medium">
                  {home.address || home.description || "Property"}
                </p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="rounded-full bg-gold p-1.5 shadow-lg">
                  <Plus className="h-3 w-3 text-white" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
