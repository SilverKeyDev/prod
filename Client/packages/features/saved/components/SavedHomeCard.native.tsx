/// <reference types="nativewind/types" />
import React from "react";

import Button from "@ui/button/Button";
import { Icon } from "@ui/icons";
import { Pressable, StyleSheet, View } from "react-native";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import { ConnectedCardHeartSave } from "packages/ui/components/primitives";
import { Image } from "packages/ui/components/primitives";
import { Box, Text } from "packages/ui/components/primitives";

import type { SavedHomeCardProps } from "./SavedHomeCard";

function formatPrice(value: string | number | null | undefined): string {
  if (value == null) return "Price N/A";
  const asNumber =
    typeof value === "string"
      ? Number(value.replace(/[^0-9.-]/g, ""))
      : typeof value === "number"
        ? value
        : Number.NaN;
  if (!Number.isFinite(asNumber)) return String(value);
  return `$${asNumber.toLocaleString()}`;
}

/**
 * Native saved home card — same layout as web: image with overlay (compare + heart),
 * address, price, beds/baths, then Unlock button.
 */
export function SavedHomeCard({ home, isSelected, onToggleCompare, onUnlock }: SavedHomeCardProps) {
  const { t } = useLocalization();

  const address =
    typeof home.address === "string" || typeof home.address === "number"
      ? home.address.toString()
      : (home.description ?? "[Invalid address]");
  const priceStr = formatPrice(home.price as string | number | null | undefined);
  const details = [
    home.bedrooms != null ? `${home.bedrooms} bed` : null,
    home.bathrooms != null ? `${home.bathrooms} bath` : null,
    home.sqft != null && home.sqft > 0 ? `${home.sqft.toLocaleString()} sqft` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const propertyForHeart = {
    id: home.home_id,
    address: home.address ?? home.description ?? "",
  };

  return (
    <Box className="border-border bg-background-surface mb-3 overflow-hidden rounded-lg border shadow-sm">
      {/* Image section with overlay — same as web PropertyCard */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: home.image_url ?? undefined }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Top-left: compare checkbox (same as web CardCompareCheckbox) */}
        <View style={styles.overlayLeft}>
          <Pressable
            onPress={() => onToggleCompare(home.home_id)}
            style={[styles.bubble, isSelected && styles.bubbleSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Icon
              name={isSelected ? "check" : "plus"}
              size={16}
              color={isSelected ? color("olive.DEFAULT") : color("neutral.600")}
            />
          </Pressable>
        </View>
        {/* Top-right: heart save (same as web ConnectedCardHeartSave) */}
        <View style={styles.overlayRight}>
          <ConnectedCardHeartSave property={propertyForHeart} position="top-right" size="sm" />
        </View>
      </View>

      {/* Body: address, price, details — same order as web PropertyCard below-address */}
      <Box className="px-3 pb-2 pt-2">
        <Text className="text-text-primary text-sm font-medium" numberOfLines={2}>
          {address}
        </Text>
        <Text className="text-primary mt-0.5 text-lg font-bold">{priceStr}</Text>
        {details ? <Text className="text-text-secondary mt-0.5 text-xs">{details}</Text> : null}
      </Box>

      {/* Bottom: Unlock button */}
      <Box className="px-3 pb-3">
        <Button variant="secondary" size="sm" onPress={() => onUnlock(home)} className="w-full">
          <Text className="text-sm font-medium">
            {t("saved.unlock_home", { defaultValue: "View" })}
          </Text>
        </Button>
      </Box>
    </Box>
  );
}

const IMAGE_HEIGHT = 112;

const styles = StyleSheet.create({
  imageWrap: {
    width: "100%",
    height: IMAGE_HEIGHT,
    backgroundColor: color("neutral.100"),
    position: "relative",
  },
  image: {
    width: "100%",
    height: IMAGE_HEIGHT,
  },
  overlayLeft: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 1,
  },
  overlayRight: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
  },
  bubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
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
  bubbleSelected: {
    borderColor: color("olive.DEFAULT"),
  },
});
