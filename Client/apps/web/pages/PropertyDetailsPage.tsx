import { useCallback, useEffect, useMemo } from "react";

import { useNavigation, useRouteParams } from "packages/navigation";
import {
  buildPropertyUrl,
  generatePropertySlug,
} from "packages/utils/property";

import { BodyText, Button, Title } from "@/components/ui";
import { Box } from "@/components/ui";
import { PropertyDetailsModal } from "@/features/propertyDetails";
import type { Property } from "@/features/search";
import { usePropertyDetails } from "@/features/search";

export default function PropertyDetailsPage() {
  const { zpid, slug } = useRouteParams<{
    zpid: string;
    slug?: string;
  }>();
  const { navigateToPath, navigate } = useNavigation();
  const {
    selectedProperty,
    isLoading,
    error,
    fetchPropertyDetails,
    clearSelectedProperty,
  } = usePropertyDetails();

  // Create a minimal property object from URL params
  const propertyFromUrl: Property | null = useMemo(() => {
    if (!zpid) return null;

    // Reconstruct address from slug (rough approximation)
    const addressFromSlug = slug
      ? slug
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : "Property Details";

    return {
      id: zpid,
      zpid: zpid,
      address: addressFromSlug,
      price: "",
      bedrooms: 0,
      bathrooms: 0,
      sqft: 0,
      lat: 0,
      lng: 0,
      latitude: 0,
      longitude: 0,
    };
  }, [zpid, slug]);

  // Fetch property details when zpid changes
  useEffect(() => {
    if (propertyFromUrl) {
      void fetchPropertyDetails(propertyFromUrl);
    }

    return () => {
      clearSelectedProperty();
    };
  }, [propertyFromUrl, fetchPropertyDetails, clearSelectedProperty]);

  // Redirect to canonical URL if slug doesn't match the property address
  useEffect(() => {
    if (selectedProperty && !isLoading && zpid && selectedProperty.address) {
      const canonicalSlug = generatePropertySlug(selectedProperty.address);

      // Only redirect if we have a slug and it differs from canonical
      if (slug && slug !== canonicalSlug) {
        const canonicalUrl = buildPropertyUrl(zpid, selectedProperty.address);
        navigateToPath(canonicalUrl, { replace: true });
      }
    }
  }, [selectedProperty, isLoading, zpid, slug, navigateToPath]);

  const handleClose = useCallback(() => {
    navigate("SEARCH");
  }, [navigate]);

  // Handle invalid zpid
  if (!zpid) {
    return (
      <Box className="flex h-full items-center justify-center p-6">
        <Box className="text-center">
          <Title size="lg" className="mb-4">
            Property Not Found
          </Title>
          <BodyText size="md" muted className="mb-6">
            The property URL is invalid or missing.
          </BodyText>
          <Button variant="primary" onClick={() => navigate("SEARCH")}>
            Back to Search
          </Button>
        </Box>
      </Box>
    );
  }

  // Handle error state
  if (error && !isLoading) {
    return (
      <Box className="flex h-full items-center justify-center p-6">
        <Box className="text-center">
          <Title size="lg" className="mb-4">
            Unable to Load Property
          </Title>
          <BodyText size="md" muted className="mb-6">
            {error}
          </BodyText>
          <Button variant="primary" onClick={() => navigate("SEARCH")}>
            Back to Search
          </Button>
        </Box>
      </Box>
    );
  }

  // Render the property details modal
  // The modal handles its own loading state and will show the property when available
  return (
    <PropertyDetailsModal
      property={selectedProperty}
      onClose={handleClose}
      isLoading={isLoading}
      toolbarButtonSize="medium"
    />
  );
}
