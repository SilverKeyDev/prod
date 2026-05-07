import { useCallback, useEffect, useMemo } from "react";

import {
  getDocumentTitle,
  getRouteSeoMeta,
  useNavigation,
  useRouteParams,
} from "packages/navigation";
import { DEFAULT_APP_TITLE } from "packages/navigation/router/pageTitles";
import {
  buildPropertyUrl,
  generatePropertySlug,
  researchListingZpid,
} from "packages/utils/property";

import { applySocialMetaTags } from "@/app/seo/documentMeta";
import { setJsonLdScript } from "@/app/seo/jsonLd";
import { getSiteOrigin } from "@/app/seo/siteOrigin";
import { BodyText, Button, Title } from "@/components/ui";
import { Box } from "@/components/ui";
import { PropertyDetailsModal } from "@/features/propertyDetails";
import type { Property } from "@/features/search";
import { usePropertyDetails } from "@/features/search";

function parseListingPriceUsd(price: string): number | undefined {
  const n = Number(String(price).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default function PropertyDetailsPage() {
  const { navigateToPath, navigate, getCurrentRoute } = useNavigation();
  const { pathname, search } = getCurrentRoute();
  const { zpid, slug } = useRouteParams<{
    zpid: string;
    slug?: string;
  }>();
  const { selectedProperty, isLoading, error, fetchPropertyDetails, clearSelectedProperty } =
    usePropertyDetails();

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

  useEffect(() => {
    if (!selectedProperty?.address || !zpid) {
      setJsonLdScript("seo-property-listing", null);
      document.title = getDocumentTitle(pathname);
      return;
    }
    const origin = getSiteOrigin() || (typeof window !== "undefined" ? window.location.origin : "");
    const listingZpid = researchListingZpid(selectedProperty) ?? zpid;
    const path = buildPropertyUrl(listingZpid, selectedProperty.address);
    const pageUrl = origin ? `${origin}${path}` : "";
    const images = selectedProperty.images;
    const primaryImage = Array.isArray(images) && typeof images[0] === "string" ? images[0] : "";
    const imageUrl =
      primaryImage && /^https?:\/\//i.test(primaryImage)
        ? primaryImage
        : origin
          ? `${origin}/og-default.png`
          : "/og-default.png";
    const priceAmount = parseListingPriceUsd(selectedProperty.price ?? "");
    const offer =
      priceAmount !== undefined
        ? { "@type": "Offer" as const, price: priceAmount, priceCurrency: "USD" }
        : undefined;
    setJsonLdScript("seo-property-listing", {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: selectedProperty.address,
      url: pageUrl || undefined,
      image: imageUrl,
      address: {
        "@type": "PostalAddress",
        streetAddress: selectedProperty.address,
      },
      ...(offer ? { offers: offer } : {}),
    });
    const title = `${selectedProperty.address} – ${DEFAULT_APP_TITLE}`;
    document.title = title;
    const desc = getRouteSeoMeta(pathname).description;
    const shareUrl = origin ? `${origin}${pathname}${search}` : "";
    if (shareUrl) {
      applySocialMetaTags({
        title,
        description: desc,
        imageUrl,
        pageUrl: shareUrl,
      });
    }
    return () => {
      setJsonLdScript("seo-property-listing", null);
      document.title = getDocumentTitle(pathname);
    };
  }, [selectedProperty, zpid, pathname, search]);

  const handleClose = useCallback(() => {
    navigate("SEARCH");
  }, [navigate]);

  const propertyToShow = selectedProperty ?? propertyFromUrl;
  const detailsLoading = isLoading || (propertyFromUrl != null && selectedProperty == null);

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
          <Button variant="primary" onClick={() => navigate("SEARCH")} iconName="arrow-left">
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
          <Button variant="primary" onClick={() => navigate("SEARCH")} iconName="arrow-left">
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
      property={propertyToShow}
      onClose={handleClose}
      isLoading={detailsLoading}
      toolbarButtonSize="medium"
    />
  );
}
