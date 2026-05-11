/// <reference types="nativewind/types" />
import React from "react";

import { Icon } from "@ui/icons";
import { Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { ConnectedCardHeartSave } from "packages/ui/components/primitives";
import { Image } from "packages/ui/components/primitives";
import { Box, Text } from "packages/ui/components/primitives";
import { addressStreetLineForCard } from "packages/utils/format/property/addressFormatting";
import { displayListingPriceForCard } from "packages/utils/search/pricing/formatPropertySearchListingPrice";

import type { SavedHomeCardProps } from "./SavedHomeCard";

/**
 * Native saved home card: image with overlay (compare + heart),
 * address, price, beds/baths. Pressing the card navigates to property details.
 */
export function SavedHomeCard({
  home,
  isSelected,
  onToggleCompare,
  onUnlock,
  layout: _layout = "grid",
}: SavedHomeCardProps) {
  const addressRaw =
    typeof home.address === "string" || typeof home.address === "number"
      ? home.address.toString()
      : (home.description ?? "[Invalid address]");
  const address = addressStreetLineForCard(addressRaw);
  const priceStr = displayListingPriceForCard(home.price, { unavailableLabel: "Price N/A" });
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
    <Pressable onPress={() => onUnlock(home)} accessibilityRole="button">
      <Box className="mb-3 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        {/* Image section with overlay */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: home.image_url ?? undefined }}
            style={styles.image}
            resizeMode="cover"
          />
          {/* Top-left: compare checkbox */}
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
          {/* Top-right: heart save */}
          <View style={styles.overlayRight}>
            <ConnectedCardHeartSave property={propertyForHeart} position="top-right" size="sm" />
          </View>
        </View>

        {/* Body: address, price, details */}
        <Box className="px-3 pb-3 pt-2">
          <Text className="text-text-primary text-sm font-medium" numberOfLines={2}>
            {address}
          </Text>
          <Text className="text-primary mt-0.5 text-lg font-bold">{priceStr}</Text>
          {details ? <Text className="text-text-secondary mt-0.5 text-xs">{details}</Text> : null}
        </Box>
      </Box>
    </Pressable>
  );
}

const IMAGE_HEIGHT = 160;

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
