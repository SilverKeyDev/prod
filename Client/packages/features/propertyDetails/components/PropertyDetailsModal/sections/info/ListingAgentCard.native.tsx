import React from "react";

import { color, spacing } from "packages/design-tokens";
import { Icon } from "packages/ui/components/primitives";
import { Box, Image, Text } from "packages/ui/components/primitives";

function spacingToNumber(token: string): number {
  const remMatch = token.match(/^([\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const pxMatch = token.match(/^(\d+)px$/);
  if (pxMatch) return parseInt(pxMatch[1], 10);
  return 0;
}

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
    <Box>
      <Box className="mb-4 flex-row items-center gap-2">
        <Icon name="user" size={20} color={color("brown.DEFAULT")} />
        <Text className="text-text-secondary text-lg font-semibold">
          {title}
        </Text>
      </Box>
      <Box className="flex-row items-start gap-4">
        <Box className="border-brown/20 bg-primary-muted h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: spacingToNumber(spacing(16)),
                height: spacingToNumber(spacing(16)),
              }}
              resizeMode="cover"
            />
          ) : (
            <Box className="h-full w-full items-center justify-center">
              <Icon name="user" size={32} color="rgba(140, 111, 90, 0.6)" />
            </Box>
          )}
        </Box>
        <Box className="min-w-0 flex-1">
          {displayName && (
            <Text className="text-accent text-lg font-medium" numberOfLines={2}>
              {displayName}
            </Text>
          )}
          {businessName && (
            <Text className="text-text-secondary" numberOfLines={2}>
              {businessName}
            </Text>
          )}
          {phone && (
            <Box className="mt-2 flex-row items-center">
              <Icon name="phone" size={16} color={color("brown.DEFAULT")} />
              <Text className="text-text-secondary ml-1">
                {formatAgentPhoneNumber(phone)}
              </Text>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
