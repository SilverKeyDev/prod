import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/structure/primitives";
import Title from "packages/ui/components/structure/text/Title";

type ListingAgentCardSkeletonProps = {
  title?: string;
  /** Narrow layout for modal gallery sidebar. */
  variant?: "default" | "compact";
  className?: string;
};

export function ListingAgentCardSkeleton({
  title,
  variant = "default",
  className = "",
}: ListingAgentCardSkeletonProps) {
  const { t } = useLocalization();
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
    ? "border-border bg-background-surface h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 animate-pulse"
    : "border-border bg-background-surface h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 animate-pulse";
  const nameHeight = isCompact ? "h-5" : "h-6";
  const businessHeight = isCompact ? "h-3" : "h-4";
  const phoneHeight = "h-4";

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
        <Box className={avatarClass} />
        <Box className="flex-1 space-y-2">
          <Box className={`bg-background-surface ${nameHeight} w-32 animate-pulse rounded`} />
          <Box className={`bg-background-surface ${businessHeight} w-40 animate-pulse rounded`} />
          <Box className="mt-2 flex flex-row items-center">
            <Icon name="phone" className="text-text-secondary mr-1 h-4 w-4" aria-hidden />
            <Box className={`bg-background-surface ${phoneHeight} w-28 animate-pulse rounded`} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
