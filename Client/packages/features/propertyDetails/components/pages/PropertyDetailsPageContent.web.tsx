import { useCallback, useEffect, useMemo } from "react";

import PropertyDetailsModal from "packages/features/propertyDetails/components/PropertyDetailsModal";
import type { Property } from "packages/features/search";
import { usePropertyDetails } from "packages/features/search";
import {
  getDocumentTitle,
  getRouteSeoMeta,
  useNavigation,
  useRouteParams,
} from "packages/navigation";
import { DEFAULT_APP_TITLE } from "packages/navigation/router/pageTitles";
import { BodyText, Box, Button, Title } from "packages/ui";
import { applySocialMetaTags, setDocumentTitle } from "packages/utils/seo/documentMeta";
import { setJsonLdScript } from "packages/utils/seo/jsonLd";
import { getSiteOrigin } from "packages/utils/seo/siteOrigin";
import {
  buildPropertyUrl,
  generatePropertySlug,
  researchListingZpid,
} from "packages/utils/transaction/property";

function parseListingPriceUsd(price: string): number | undefined {
  const n = Number(String(price).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function PropertyDetailsPageContent() {
  const { navigateToPath, navigate, getCurrentRoute } = useNavigation();
  const { pathname, search } = getCurrentRoute();
  const { zpid, slug } = useRouteParams<{
    zpid: string;
    slug?: string;
  }>();
  const { selectedProperty, isLoading, error, fetchPropertyDetails, clearSelectedProperty } =
    usePropertyDetails();

  const propertyFromUrl: Property | null = useMemo(() => {
    if (!zpid) return null;

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

  useEffect(() => {
    if (propertyFromUrl) {
      void fetchPropertyDetails(propertyFromUrl);
    }

    return () => {
      clearSelectedProperty();
    };
  }, [propertyFromUrl, fetchPropertyDetails, clearSelectedProperty]);

  useEffect(() => {
    if (selectedProperty && !isLoading && zpid && selectedProperty.address) {
      const canonicalSlug = generatePropertySlug(selectedProperty.address);

      if (slug && slug !== canonicalSlug) {
        const canonicalUrl = buildPropertyUrl(zpid, selectedProperty.address);
        navigateToPath(canonicalUrl, { replace: true });
      }
    }
  }, [selectedProperty, isLoading, zpid, slug, navigateToPath]);

  useEffect(() => {
    if (!selectedProperty?.address || !zpid) {
      setJsonLdScript("seo-property-listing", null);
      setDocumentTitle(getDocumentTitle(pathname));
      return;
    }
    const origin = getSiteOrigin();
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
    setDocumentTitle(title);
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
      setDocumentTitle(getDocumentTitle(pathname));
    };
  }, [selectedProperty, zpid, pathname, search]);

  const handleClose = useCallback(() => {
    navigate("SEARCH");
  }, [navigate]);

  const propertyToShow = selectedProperty ?? propertyFromUrl;
  const detailsLoading = isLoading || (propertyFromUrl != null && selectedProperty == null);

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

  return (
    <PropertyDetailsModal
      property={propertyToShow}
      onClose={handleClose}
      isLoading={detailsLoading}
      toolbarButtonSize="medium"
    />
  );
}
