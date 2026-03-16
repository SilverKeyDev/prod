import React from "react";

import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/primitives";
import { Image } from "packages/ui/components/primitives/media";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

import { formatAgentPhoneNumber } from "./propertyDetailsDisplayHelpers";
type ListingAgentCardProps = {
  imageUrl?: string;
  displayName?: string;
  businessName?: string;
  phone?: Record<string, unknown>;
  title?: string;
};
export function ListingAgentCard({
  imageUrl,
  displayName,
  businessName,
  phone,
  title = "Listing Agent",
}: ListingAgentCardProps) {
  return (
    <Box className="w-full lg:w-1/3">
      <Box className="mb-4 flex flex-row items-center gap-2">
        <Icon name="user" className="text-foreground h-5 w-5" />
        <Title as="h3" size="lg" className="text-foreground font-semibold">
          {title}
        </Title>
      </Box>
      <Box className="flex flex-row items-start gap-4">
        <Box className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-neutral-200 bg-neutral-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayName ?? title}
              className="h-full w-full object-cover"
            />
          ) : (
            <Box className="flex h-full w-full flex-row items-center justify-center">
              <Icon name="user" className="h-8 w-8 text-neutral-600" />
            </Box>
          )}
        </Box>
        <Box className="flex-1">
          {displayName && (
            <Title as="h4" size="lg" className="text-accent-underline font-medium">
              {displayName}
            </Title>
          )}
          {businessName && (
            <BodyText as="p" className="text-neutral-600">
              {businessName}
            </BodyText>
          )}
          {phone && (
            <Box className="text-foreground mt-2 flex flex-row items-center">
              <Icon name="phone" className="mr-1 h-4 w-4" />
              {formatAgentPhoneNumber(phone)}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
