import React, { useCallback, useMemo } from "react";

import { Image, Share, StyleSheet } from "react-native";

import { useLocalization } from "packages/contexts";
import { ConnectedCardHeartSave } from "packages/features/search";
import { useNavigation } from "packages/navigation";
import { BaseModal } from "packages/ui/components/modals";
import { Box, Button, ScrollView, Text } from "packages/ui/components/primitives";
import { Loading } from "packages/ui/components/primitives";

import type { Property } from "@/features/search/hooks/data/property/usePropertyDetails";
import { useSavedHomesStoreIntegration } from "@/features/search/hooks/store/useSavedHomesStoreIntegration";
import type { SearchResult } from "@/features/search/types";

import type { PropertyDetailsModalProps } from "./types";

type PropertyLike = Property | SearchResult;

function getAddress(property: PropertyLike): string | null {
  const maybeAddress = (property as { address?: unknown }).address;
  if (typeof maybeAddress === "string" && maybeAddress.trim().length > 0) {
    return maybeAddress;
  }
  return null;
}

function getId(property: PropertyLike): string | null {
  const p = property as { id?: string; home_id?: string };
  if (typeof p.id === "string" && p.id.length > 0) return p.id;
  if (typeof p.home_id === "string" && p.home_id.length > 0) return p.home_id;
  return null;
}

function getImageUrl(property: PropertyLike): string | null {
  const p = property as {
    imageUrl?: string;
    image_url?: string;
    primary_image_url?: string;
  };
  if (typeof p.imageUrl === "string" && p.imageUrl.length > 0) return p.imageUrl;
  if (typeof p.image_url === "string" && p.image_url.length > 0) return p.image_url;
  if (typeof p.primary_image_url === "string" && p.primary_image_url.length > 0) {
    return p.primary_image_url;
  }
  return null;
}

function getNumericField(
  property: PropertyLike,
  key: keyof {
    bedrooms: number | undefined;
    bathrooms: number | undefined;
    sqft: number | undefined;
  }
): number | null {
  const p = property as {
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    livingArea?: number | string;
  };

  if (key === "sqft") {
    if (typeof p.sqft === "number") return p.sqft;
    if (typeof p.livingArea === "number") return p.livingArea;
    if (typeof p.livingArea === "string") {
      const parsed = Number.parseInt(p.livingArea.replace(/,/g, ""), 10);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }

  const value = p[key];
  if (typeof value === "number") return value;
  return null;
}

function getPrice(property: PropertyLike): string | null {
  const maybePrice = (property as { price?: unknown }).price;
  if (typeof maybePrice === "number") {
    return `$${maybePrice.toLocaleString()}`;
  }
  if (typeof maybePrice === "string" && maybePrice.trim().length > 0) {
    // Assume already formatted (e.g. "1,200,000")
    return maybePrice.startsWith("$") ? maybePrice : `$${maybePrice}`;
  }
  return null;
}

export const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  onClose,
  isLoading = false,
}) => {
  const { t } = useLocalization();
  const navigation = useNavigation();
  useSavedHomesStoreIntegration();

  const derived = useMemo(() => {
    if (!property) {
      return {
        id: null as string | null,
        address: null as string | null,
        imageUrl: null as string | null,
        price: null as string | null,
        bedrooms: null as number | null,
        bathrooms: null as number | null,
        sqft: null as number | null,
      };
    }

    const p = property as PropertyLike;
    const id = getId(p);
    const address = getAddress(p);
    const imageUrl = getImageUrl(p);
    const price = getPrice(p);
    const bedrooms = getNumericField(p, "bedrooms");
    const bathrooms = getNumericField(p, "bathrooms");
    const sqft = getNumericField(p, "sqft");

    return { id, address, imageUrl, price, bedrooms, bathrooms, sqft };
  }, [property]);

  const handleShare = useCallback(async () => {
    if (!derived.address) return;
    const parts = [
      derived.address,
      derived.price ? `Price: ${derived.price}` : null,
      derived.bedrooms != null || derived.bathrooms != null
        ? [
            derived.bedrooms != null ? `${derived.bedrooms} bed` : null,
            derived.bathrooms != null ? `${derived.bathrooms} bath` : null,
          ]
            .filter(Boolean)
            .join(" · ")
        : null,
    ].filter(Boolean) as string[];

    const message = parts.join("\n");
    try {
      await Share.share({ message });
    } catch {
      // Swallow share errors; nothing else to do on native.
    }
  }, [derived.address, derived.bathrooms, derived.bedrooms, derived.price]);

  const handleMessageAgent = useCallback(() => {
    navigation.navigate("MESSAGING");
    onClose();
  }, [navigation, onClose]);

  if (!property) return null;

  const title =
    derived.address ??
    t("property_details.title_fallback", {
      defaultValue: "Property details",
    });

  return (
    <BaseModal isOpen={true} onClose={onClose} title={title}>
      <ScrollView className="max-h-[80vh]" contentContainerStyle={styles.scrollContent}>
        {derived.imageUrl ? (
          <Image source={{ uri: derived.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <Box className="mb-4 h-48 w-full items-center justify-center rounded-lg bg-gray-100">
            <Text className="text-xs text-gray-500">
              {t("property_details.no_image", { defaultValue: "No image available" })}
            </Text>
          </Box>
        )}

        <Box className="mb-3">
          {derived.price && (
            <Text className="text-xl font-semibold text-gray-900">{derived.price}</Text>
          )}
          <Box className="mt-1 flex-row flex-wrap gap-2">
            {derived.bedrooms != null && (
              <Text className="text-sm text-gray-700">
                {t("property_details.bedrooms", {
                  defaultValue: "{{count}} bed",
                  count: derived.bedrooms,
                })}
              </Text>
            )}
            {derived.bathrooms != null && (
              <Text className="text-sm text-gray-700">
                {t("property_details.bathrooms", {
                  defaultValue: "{{count}} bath",
                  count: derived.bathrooms,
                })}
              </Text>
            )}
            {derived.sqft != null && (
              <Text className="text-sm text-gray-700">
                {t("property_details.sqft", {
                  defaultValue: "{{value}} sqft",
                  value: derived.sqft.toLocaleString(),
                })}
              </Text>
            )}
          </Box>
        </Box>

        {derived.address && (
          <Box className="mb-4">
            <Text className="text-sm font-medium text-gray-900">
              {t("property_details.address_label", { defaultValue: "Address" })}
            </Text>
            <Text className="mt-0.5 text-sm text-gray-700">{derived.address}</Text>
          </Box>
        )}

        <Box className="mt-2 flex-row flex-wrap items-center gap-2">
          {property ? <ConnectedCardHeartSave property={property} size="sm" /> : null}
          <Button variant="secondary" size="sm" onPress={handleShare} className="flex-1">
            <Text className="text-sm font-medium">
              {t("property_details.share", { defaultValue: "Share" })}
            </Text>
          </Button>
          <Button variant="secondary" size="sm" onPress={handleMessageAgent} className="flex-1">
            <Text className="text-sm font-medium">
              {t("property_details.message_agent", { defaultValue: "Message agent" })}
            </Text>
          </Button>
        </Box>

        {isLoading && (
          <Box className="mt-4 items-center">
            <Loading />
            <Text className="mt-2 text-xs text-gray-600">
              {t("property_details.loading", {
                defaultValue: "Fetching additional details…",
              })}
            </Text>
          </Box>
        )}
      </ScrollView>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 16,
  },
  image: {
    width: "100%",
    height: 192,
    borderRadius: 12,
    marginBottom: 16,
  },
});

export default PropertyDetailsModal;
