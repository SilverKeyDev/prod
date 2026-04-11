import React from "react";

import { useLocalization } from "packages/contexts";
import { color, spacing } from "packages/design-tokens";
import { formatAgentPhoneNumber } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/helpers/propertyDetailsDisplayHelpers";
import { Icon } from "packages/ui/components/primitives";
import { Box, Image, Text } from "packages/ui/components/primitives";

function spacingToNumber(token: string): number {
  const remMatch = token.match(/^([\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const pxMatch = token.match(/^(\d+)px$/);
  if (pxMatch) return parseInt(pxMatch[1], 10);
  return 0;
}

type ListingAgentCardProps = {
  imageUrl?: string;
  displayName?: string;
  businessName?: string;
  phone?: Record<string, unknown> | string;
  email?: string;
  mlsListingId?: string;
  title?: string;
  variant?: "default" | "compact";
};

export function ListingAgentCard({
  imageUrl,
  displayName,
  businessName,
  phone,
  email,
  mlsListingId,
  title,
  variant = "default",
}: ListingAgentCardProps) {
  const { t } = useLocalization();
  const phoneDisplay = formatAgentPhoneNumber(phone);
  const resolvedTitle =
    title ??
    t("property_details.listing_agent", {
      defaultValue: "Agent",
    });
  const isCompact = variant === "compact";
  const avatarSize = isCompact ? spacing(12) : spacing(16);
  const avatarPx = spacingToNumber(avatarSize);
  const headerMb = isCompact ? "mb-2" : "mb-4";
  const titleClass = isCompact
    ? "text-text-secondary text-base font-semibold"
    : "text-text-secondary text-lg font-semibold";

  return (
    <Box>
      <Box className={`${headerMb} flex-row items-center gap-2`}>
        <Icon
          name="user"
          size={isCompact ? 18 : 20}
          color={color("brown.DEFAULT")}
        />
        <Text className={titleClass}>{resolvedTitle}</Text>
      </Box>
      <Box className={`flex-row items-start ${isCompact ? "gap-3" : "gap-4"}`}>
        <Box
          className={`border-brown/20 bg-primary-muted flex-shrink-0 overflow-hidden rounded-full border-2 ${
            isCompact ? "h-12 w-12" : "h-16 w-16"
          }`}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: avatarPx,
                height: avatarPx,
              }}
              resizeMode="cover"
            />
          ) : (
            <Box className="h-full w-full items-center justify-center">
              <Icon
                name="user"
                size={isCompact ? 24 : 32}
                color="rgba(140, 111, 90, 0.6)"
              />
            </Box>
          )}
        </Box>
        <Box className="min-w-0 flex-1">
          {displayName && (
            <Text
              className={`text-accent font-medium ${
                isCompact ? "text-base" : "text-lg"
              }`}
              numberOfLines={2}
            >
              {displayName}
            </Text>
          )}
          {businessName && (
            <Text className="text-text-secondary" numberOfLines={2}>
              {businessName}
            </Text>
          )}
        </Box>
      </Box>
      {phoneDisplay ? (
        <Box className="mt-2 min-w-0 flex-row items-center gap-1">
          <Icon name="phone" size={16} color={color("brown.DEFAULT")} />
          <Text className="text-text-secondary shrink">{phoneDisplay}</Text>
        </Box>
      ) : null}
      {email ? (
        <Box className="mt-2 min-w-0 flex-row items-center gap-1">
          <Icon name="mail" size={16} color={color("brown.DEFAULT")} />
          <Text className="text-text-secondary shrink" numberOfLines={2}>
            {email}
          </Text>
        </Box>
      ) : null}
      {mlsListingId ? (
        <Text className="text-text-secondary mt-3 text-xs leading-snug">
          {t("property_details.listing_number_line", {
            id: mlsListingId,
            defaultValue: `Listing #${mlsListingId}`,
          })}
        </Text>
      ) : null}
    </Box>
  );
}
