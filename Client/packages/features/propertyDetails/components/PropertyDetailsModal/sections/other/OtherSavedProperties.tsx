import React from "react";

import { Icon } from "@ui/icons";

import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { Box } from "packages/ui/components/primitives";

import { StyledImage } from "@/components/cards/base/index.web";
import { BodyText, Button, Title } from "@/components/ui";
import { usePropertyDetails } from "@/features/search/hooks/data/property/usePropertyDetails";
import { useSavedHomesData } from "@/features/search/hooks/data/saved/useSavedHomesData";

export const OtherSavedProperties: React.FC<PropertyComponentProps> = ({ property }) => {
  const { savedHomes, savedHomesLoading } = useSavedHomesData();
  const { fetchPropertyDetails } = usePropertyDetails();
  const currentPropertyId = property?.id;
  const otherSavedHomes = React.useMemo(() => {
    return savedHomes
      .filter(
        (home) =>
          home.home_id !== currentPropertyId &&
          (home.image_url || (Array.isArray(home.image_urls) && home.image_urls.length > 0))
      )
      .slice(0, 6);
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
    <Box className="border-border bg-background-surface border-t px-4 py-6 sm:px-6 lg:px-8">
      <Box className="mb-4">
        <Title as="h3" size="lg" className="text-text-primary font-semibold">
          Other Saved Properties
        </Title>
        <BodyText as="p" size="sm" className="text-text-secondary mt-1">
          View images from your other saved properties
        </BodyText>
      </Box>

      <Box className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {otherSavedHomes.map((home) => {
          const imageUrl =
            home.image_url ||
            (Array.isArray(home.image_urls) && home.image_urls.length > 0
              ? home.image_urls[0]
              : null);
          if (!imageUrl) return null;
          return (
            <Button
              key={home.home_id}
              type="button"
              variant="ghost"
              onClick={() => handleViewProperty(home)}
              className="hover:border-accent border-border group relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 hover:shadow-lg"
              label={`View ${home.address || "property"}`}
            >
              <StyledImage
                src={imageUrl}
                alt={home.address || "Saved property"}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <Box className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
              <Box className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <BodyText as="p" size="xs" className="truncate font-medium text-white">
                  {home.address || home.description || "Property"}
                </BodyText>
              </Box>
              <Box className="absolute right-2 top-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <Box className="bg-accent rounded-full p-1.5 shadow-lg">
                  <Icon name="plus" className="h-3 w-3 text-white" />
                </Box>
              </Box>
            </Button>
          );
        })}
      </Box>
    </Box>
  );
};
