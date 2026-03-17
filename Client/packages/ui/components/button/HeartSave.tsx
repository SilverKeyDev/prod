import React from "react";

import { getCardBubbleSizeClasses } from "@ui/cards/base/styles";
import { Icon } from "@ui/icons";

import { color } from "packages/design-tokens";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useUIStore } from "packages/store";
import { Box, Pressable } from "packages/ui/components/primitives";
import { ICON_TRANSFORM_CLASSES } from "packages/ui/styles/transitions/transitionClasses";
import { dateNow } from "packages/utils/date";
import { isWeb } from "packages/utils/platform";

import IconButton from "./IconButton";
import {
  OVERLAY_MARKER_CIRCLE_CLASSES,
  OVERLAY_MARKER_ICON_CLASSES,
} from "./overlayMarkerButtonTypes";

/** Minimal property shape for presentational heart (no feature dependency). */
export type CardHeartSavePropertyLike = {
  id: string;
  address?: string;
};

/** Props for presentational heart when parent provides save state. Use ConnectedCardHeartSave from features/search for connected behavior. */
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

/** Maps small/medium/large to legacy sizes for card overlay */
const TOOLBAR_TO_LEGACY: Record<"small" | "medium" | "large", "xs" | "sm" | "md" | "lg"> = {
  small: "sm",
  medium: "md",
  large: "lg",
};

const ICON_SIZE_FALLBACK: Record<"xs" | "sm" | "md" | "lg", string> = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const POSITION_MAP: Record<NonNullable<CardHeartSaveWithPropsProps["position"]>, string> = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};

const ICON_SIZE = 16;

/**
 * Presentational heart that does not use useSavedHomesData. Use when the parent
 * provides isSaved and save/remove callbacks (e.g. map card) to avoid rerenders
 * when any other home is liked.
 */
export const CardHeartSaveWithProps: React.FC<CardHeartSaveWithPropsProps> = ({
  property,
  isSaved,
  saveHome,
  removeSavedHome,
  position = "top-right",
  size = "md",
  className = "",
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    void handlePress();
  };

  const label = ariaLabel ?? (isSaved ? "Remove from saved homes" : "Save to favorites");

  // Native: simplified overlay only (Pressable with shadow style)
  if (!isWeb) {
    return (
      <Pressable
        onPress={handlePress}
        className="h-9 min-h-9 w-9 min-w-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 shadow-sm"
        style={{
          shadowColor: color("neutral.900"),
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
          elevation: 2,
        }}
        accessibilityRole="button"
        accessibilityState={{ selected: isSaved }}
        accessibilityLabel={label}
      >
        <Box className="items-center justify-center">
          <Icon
            name="heart"
            size={ICON_SIZE}
            color={isSaved ? color("destructive") : color("neutral.400")}
            strokeWidth={isSaved ? 0 : 2}
          />
        </Box>
      </Pressable>
    );
  }

  // Web: inline and overlay variants
  const isToolbarSize = (s: string): s is "small" | "medium" | "large" =>
    s === "small" || s === "medium" || s === "large";
  const effectiveSize = isToolbarSize(size) ? TOOLBAR_TO_LEGACY[size] : size;
  const sizeConfig = getCardBubbleSizeClasses(effectiveSize);
  const iconSizeClass = sizeConfig?.iconClass ?? ICON_SIZE_FALLBACK[effectiveSize];
  const isInlineButton =
    !position || className.includes("border") || className.includes("rounded-md");

  if (isInlineButton && isToolbarSize(size)) {
    return (
      <IconButton
        variant="toolbar"
        size={size}
        rounded="md"
        // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
        icon={<Icon name="heart" className={`h-full w-full ${isSaved ? "fill-current" : ""}`} />}
        onClick={handleClick}
        label={label}
        // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
        className={`bg-gray-50 ${isSaved ? "text-red-500 hover:bg-gray-50 hover:text-red-600 active:bg-gray-100 active:text-red-700 active:opacity-90" : "text-gray-600 hover:bg-gray-100 active:bg-gray-200 active:opacity-90"} ${className}`}
      />
    );
  }

  if (isInlineButton) {
    return (
      <IconButton
        variant="ghost"
        icon={
          <Icon
            name="heart"
            // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
            className={`${iconSizeClass} ${isSaved ? "fill-current" : ""} ${ICON_TRANSFORM_CLASSES}`}
          />
        }
        label={label}
        onClick={handleClick}
        // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
        className={`group relative inline-flex flex-row items-center justify-center bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 active:bg-gray-100 active:opacity-90 ${isSaved ? "text-red-500 hover:text-red-600 active:text-red-600 active:text-red-700" : "text-gray-400 hover:text-red-500 active:text-red-500 active:text-red-600"} ${className}`}
      />
    );
  }

  return (
    // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
    <Box className={`absolute ${POSITION_MAP[position]} z-10`}>
      <IconButton
        variant="ghost"
        size="sm"
        icon={
          <>
            <Icon
              name="heart"
              // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
              className={`${OVERLAY_MARKER_ICON_CLASSES} ${isSaved ? "fill-current" : ""} group-hover:opacity-90 group-active:opacity-80`}
            />
            <Icon
              name="sparkles"
              className="absolute left-1 top-1 h-2 w-2 scale-50 text-white opacity-0 group-hover:scale-75 group-hover:opacity-30 group-active:opacity-50"
            />
          </>
        }
        label={label}
        onClick={handleClick}
        // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
        className={`group relative inline-flex flex-row items-center justify-center rounded-full bg-white shadow-md ring-1 ring-neutral-200 hover:bg-white hover:shadow-lg hover:ring-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 active:bg-white active:opacity-90 active:shadow-lg active:ring-neutral-200 ${isSaved ? "text-red-500 hover:text-red-600 active:text-red-600 active:text-red-700" : "text-gray-400 hover:text-red-500 active:text-red-500 active:text-red-600"} ${OVERLAY_MARKER_CIRCLE_CLASSES} ${className}`}
      />
    </Box>
  );
};

export default CardHeartSaveWithProps;
