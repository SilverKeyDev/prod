/// <reference types="nativewind/types" />
import React from "react";

import { Icon } from "@ui/icons";
import { Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useUIStore } from "packages/store";
import { dateNow } from "packages/utils/date";

/** Minimal property shape for presentational heart (no feature dependency). Must match HeartSave.tsx. */
export type CardHeartSavePropertyLike = {
  id: string;
  address?: string;
};

/** Props for presentational heart when parent provides save state. Matches web CardHeartSaveWithProps. */
export type CardHeartSaveWithPropsProps = {
  property: CardHeartSavePropertyLike;
  isSaved: boolean;
  saveHome: (property: CardHeartSavePropertyLike) => Promise<void>;
  removeSavedHome: (propertyId: string, propertyAddress?: string) => Promise<void>;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: "xs" | "sm" | "md" | "lg" | "small" | "medium" | "large";
  className?: string;
  ariaLabel?: string;
};

const CIRCLE_SIZE = 36;
const ICON_SIZE = 16;

/**
 * Native heart save overlay — visually identical to web CardHeartSave overlay
 * (circular white button, shadow, heart icon, red when saved).
 */
export const CardHeartSaveWithProps: React.FC<CardHeartSaveWithPropsProps> = ({
  property,
  isSaved,
  saveHome,
  removeSavedHome,
  size: _size = "md",
  ariaLabel,
}) => {
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const propertyAddress = typeof property.address === "string" ? property.address : undefined;

  const handlePress = async () => {
    try {
      if (isSaved) {
        await removeSavedHome(property.id, propertyAddress);
      } else {
        await saveHome(property);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      log.error(LOG_CATEGORIES.SEARCH, "Error updating favorites", {
        propertyId: property.id,
        address: propertyAddress,
        action: isSaved ? "remove" : "add",
        error: errorMessage,
        timestamp: dateNow().toISOString(),
      });
      enqueueToast({
        type: "error",
        message: `Failed to ${isSaved ? "remove" : "save"} home`,
      });
    }
  };

  const label = ariaLabel ?? (isSaved ? "Remove from saved homes" : "Save to favorites");

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.circle]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSaved }}
      accessibilityLabel={label}
    >
      <View style={styles.iconWrap}>
        <Icon
          name="heart"
          size={ICON_SIZE}
          color={isSaved ? color("rose.DEFAULT") : color("neutral.400")}
          strokeWidth={isSaved ? 0 : 2}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    minWidth: CIRCLE_SIZE,
    minHeight: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: color("neutral.50"),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: color("neutral.900"),
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CardHeartSaveWithProps;
