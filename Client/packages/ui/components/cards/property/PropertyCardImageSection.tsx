import React from "react";

import CardNotInterested from "packages/ui/components/button/NotInterested";
import { StyledImage } from "packages/ui/components/cards/base/index.web";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

import type { Property, SearchResult } from "@/features/search/types";

import { formatPropertyCardPrice } from "./propertyCardHelpers";

type PropertyCardImageSectionProps = {
  imageUrl: string;
  address: string;
  cardType: "searchpage" | "regular";
  status?: { text: string; className: string };
  pricePosition: "top-left" | "top-right" | "below-address";
  price: string;
  topContent?: React.ReactNode;
  showNotInterested: boolean;
  property?: SearchResult | Property;
  onMarkNotInterested: () => void;
};

export function PropertyCardImageSection({
  imageUrl,
  address,
  cardType,
  status,
  pricePosition,
  price,
  topContent,
  showNotInterested,
  property,
  onMarkNotInterested,
}: PropertyCardImageSectionProps) {
  const placeholder = "/placeholders/dummy-photo.svg";
  const heightClass = cardType === "searchpage" ? "h-32 sm:h-36 md:h-40" : "h-32 sm:h-40 md:h-48";
  return (
    <Box className={`relative overflow-hidden ${heightClass}`}>
      <StyledImage
        src={imageUrl}
        alt={address}
        variant="professional"
        placeholder={placeholder}
        className="h-full w-full"
      />
      {status && (
        <Box className="absolute left-3 top-3 sm:left-4 sm:top-4">
          <BodyText
            as="span"
            className={`rounded-full px-2 py-1 text-xs font-medium sm:px-3 sm:py-1.5 sm:text-sm ${status.className}`}
          >
            {status.text}
          </BodyText>
        </Box>
      )}
      {pricePosition !== "below-address" && (
        <Box
          className={`absolute top-3 sm:top-4 ${
            pricePosition === "top-left" ? "left-3 sm:left-4" : "right-3 sm:right-4"
          } border-border bg-primary-muted rounded-full border px-2 py-1 backdrop-blur-sm sm:px-3 sm:py-1.5`}
        >
          <BodyText as="span" className="text-primary text-xs font-medium sm:text-sm">
            {formatPropertyCardPrice(price)}
          </BodyText>
        </Box>
      )}
      {(topContent || (showNotInterested && property)) && (
        <Box className="pointer-events-none absolute inset-0">
          <Box className="pointer-events-auto relative h-full w-full">
            {showNotInterested && property && (
              <CardNotInterested
                property={property}
                size="sm"
                position="top-left"
                onMarkNotInterested={onMarkNotInterested}
              />
            )}
            {topContent}
          </Box>
        </Box>
      )}
    </Box>
  );
}
