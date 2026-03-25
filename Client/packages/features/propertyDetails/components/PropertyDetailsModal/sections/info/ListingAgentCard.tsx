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
      <Box className="mb-4 flex min-w-0 flex-row items-center gap-2">
        <Icon name="user" className="text-foreground h-5 w-5 shrink-0" aria-hidden />
        <Title
          as="h3"
          size="lg"
          className="text-foreground min-w-0 flex-1 font-semibold leading-snug"
        >
          {title}
        </Title>
      </Box>
      <Box className="flex flex-row items-start gap-4">
        <Box className="border-border bg-primary-muted h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayName ?? title}
              className="h-full w-full object-cover"
            />
          ) : (
            <Box className="flex h-full w-full flex-row items-center justify-center">
              <Icon name="user" className="text-text-secondary h-8 w-8" />
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
            <BodyText as="p" className="text-text-secondary">
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
