import React from "react";

import type { CardHeartSavePropertyLike } from "@ui/button/HeartSave";
import { CardHeartSaveWithProps } from "@ui/button/HeartSave";

import { useSavedHomesData } from "packages/hooks/data/saved/useSavedHomesData";

export type ConnectedCardHeartSaveProps = {
  property: CardHeartSavePropertyLike & {
    id: string;
    address?: string;
  };
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Toolbar / header: keep heart in row with share actions (web: not absolutely positioned). */
  inline?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "small" | "medium" | "large";
  className?: string;
  ariaLabel?: string;
  nonFocusableMapMarkerSurface?: boolean;
};

/**
 * Connected heart save button that uses useSavedHomesData.
 * Cross-platform component - uses platform-resolved HeartSave.
 * Use this instead of CardHeartSave when you need save/favorite behavior.
 */
export function ConnectedCardHeartSave({
  property,
  position = "top-right",
  inline = false,
  size = "md",
  className = "",
  ariaLabel,
  nonFocusableMapMarkerSurface = false,
}: ConnectedCardHeartSaveProps) {
  const data = useSavedHomesData();
  const propertyLike: CardHeartSavePropertyLike = {
    id: property.id,
    address: typeof property.address === "string" ? property.address : undefined,
  };
  const isSaved = data?.isHomeSaved ? data.isHomeSaved(property.id, propertyLike.address) : false;
  const saveHome = data?.saveHome ?? (async () => {});
  const removeSavedHome = data?.removeSavedHome ?? (async () => {});

  return (
    <CardHeartSaveWithProps
      property={propertyLike}
      isSaved={isSaved}
      saveHome={saveHome}
      removeSavedHome={removeSavedHome}
      position={position}
      inline={inline}
      size={size}
      className={className}
      ariaLabel={ariaLabel}
      nonFocusableMapMarkerSurface={nonFocusableMapMarkerSurface}
    />
  );
}
