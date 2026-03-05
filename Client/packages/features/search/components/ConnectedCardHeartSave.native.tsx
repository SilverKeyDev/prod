import React from "react";

import type { CardHeartSavePropertyLike } from "@ui/button/HeartSave.native";
import { CardHeartSaveWithProps } from "@ui/button/HeartSave.native";

import { useSavedHomesData } from "packages/features/search/hooks/data/saved/useSavedHomesData";
import type { Property, SearchResult } from "packages/features/search/types";

export type ConnectedCardHeartSaveProps = {
  property: SearchResult | Property | CardHeartSavePropertyLike;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: "xs" | "sm" | "md" | "lg" | "small" | "medium" | "large";
  className?: string;
  ariaLabel?: string;
};

/**
 * Native-connected heart save button that uses useSavedHomesData.
 * Uses the React Native implementation of CardHeartSaveWithProps to avoid DOM primitives.
 */
export function ConnectedCardHeartSave({
  property,
  position = "top-right",
  size = "md",
  className = "",
  ariaLabel,
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
      size={size}
      className={className}
      ariaLabel={ariaLabel}
    />
  );
}

