import React, { useEffect, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { formatAgentPhoneNumber } from "packages/features/propertyDetails/components/PropertyDetailsModal/sections/info/helpers/propertyDetailsDisplayHelpers";
import { Box } from "packages/ui/components/structure/primitives";
import { Image } from "packages/ui/components/structure/primitives/media";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

type ListingAgentCardProps = {
  imageUrl?: string;
  displayName?: string;
  businessName?: string;
  phone?: Record<string, unknown> | string;
  email?: string;
  /** MLS or feed listing identifier when shown for compliance. */
  mlsListingId?: string;
  title?: string;
  /** Narrow layout for modal gallery sidebar. */
  variant?: "default" | "compact";
  className?: string;
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
  className = "",
}: ListingAgentCardProps) {
  const { t } = useLocalization();
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);
  const phoneDisplay = formatAgentPhoneNumber(phone);
  const resolvedTitle =
    title ??
    t("property_details.listing_agent", {
      defaultValue: "Agent",
    });
  const isCompact = variant === "compact";
  const outerClass = `w-full ${className}`.trim();
  const headerMb = isCompact ? "mb-2" : "mb-4";
  const titleSize = isCompact ? "md" : "lg";
  const avatarClass = isCompact
    ? "border-border bg-primary-muted h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2"
    : "border-border bg-primary-muted h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2";
  const iconFallbackClass = isCompact ? "h-6 w-6" : "h-8 w-8";
  const nameTitleSize = isCompact ? "md" : "lg";

  return (
    <Box className={outerClass}>
      <Box className={`${headerMb} flex min-w-0 flex-row items-center gap-2`}>
        <Icon name="user" className="text-foreground h-5 w-5 shrink-0" aria-hidden />
        <Title
          as="h3"
          size={titleSize}
          className="text-foreground min-w-0 flex-1 font-semibold leading-snug"
        >
          {resolvedTitle}
        </Title>
      </Box>
      <Box className={`flex flex-row items-start ${isCompact ? "gap-3" : "gap-4"}`}>
        <Box className={avatarClass}>
          {imageUrl && !imageFailed ? (
            <Image
              src={imageUrl}
              alt={displayName ?? resolvedTitle}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              loading="eager"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Box className="flex h-full w-full flex-row items-center justify-center">
              <Icon name="user" className={`text-text-secondary ${iconFallbackClass}`} />
            </Box>
          )}
        </Box>
        <Box className="flex-1">
          {displayName && (
            <Title as="h4" size={nameTitleSize} className="text-accent-underline font-medium">
              {displayName}
            </Title>
          )}
          {businessName && (
            <BodyText as="p" size={isCompact ? "xs" : "sm"} className="text-text-secondary">
              {businessName}
            </BodyText>
          )}
        </Box>
      </Box>
      {phoneDisplay ? (
        <Box className="text-foreground mt-2 flex min-w-0 flex-row items-center gap-1">
          <Icon name="phone" className="h-4 w-4 shrink-0" aria-hidden />
          <BodyText as="span" size={isCompact ? "xs" : "sm"}>
            {phoneDisplay}
          </BodyText>
        </Box>
      ) : null}
      {email ? (
        <Box className="text-foreground mt-2 flex min-w-0 flex-row items-center gap-1">
          <Icon name="mail" className="h-4 w-4 shrink-0" aria-hidden />
          <BodyText as="span" size={isCompact ? "xs" : "sm"} className="min-w-0 break-all">
            {email}
          </BodyText>
        </Box>
      ) : null}
      {mlsListingId ? (
        <BodyText as="p" size="xs" className="text-text-secondary mt-3 leading-snug">
          {t("property_details.listing_number_line", {
            id: mlsListingId,
            defaultValue: `Listing #${mlsListingId}`,
          })}
        </BodyText>
      ) : null}
    </Box>
  );
}
