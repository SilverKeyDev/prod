import React, { useCallback, useMemo, useState } from "react";

import { FlatList, RefreshControl, StyleSheet, View } from "react-native";

import { useLocalization } from "packages/contexts";
import type { SavedHome } from "packages/types";
import { BaseModal } from "packages/ui/components/modals";
import { Box, Button, Loading, Pressable, Text } from "packages/ui/components/primitives";

import PropertyDetailsModal from "@/features/propertyDetails/components/PropertyDetailsModal/PropertyDetailsModal.native";
import { convertSavedHomeToProperty } from "@/features/saved/types/savedHomeUtils";
import { usePropertyDetails } from "@/features/search/hooks/data/property/usePropertyDetails";
import { useSavedHomesStoreIntegration } from "@/features/search/hooks/store/useSavedHomesStoreIntegration";

type ClientSavedHomesNativeProps = {
  clientId: string;
};

export function ClientSavedHomesNative({ clientId }: ClientSavedHomesNativeProps) {
  const { t } = useLocalization();
  const [refreshing, setRefreshing] = useState(false);
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);
  const [selectedHomeForNegotiation, setSelectedHomeForNegotiation] = useState<SavedHome | null>(
    null
  );

  const { savedHomes, savedHomesLoading, savedHomesError, refreshSavedHomes } =
    useSavedHomesStoreIntegration(clientId);

  const {
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
    isLoading: isLoadingPropertyDetails,
  } = usePropertyDetails();

  const homes: SavedHome[] = useMemo(() => savedHomes ?? [], [savedHomes]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshSavedHomes();
    setRefreshing(false);
  }, [refreshSavedHomes]);

  const handleOpenDetails = useCallback(
    async (home: SavedHome) => {
      await fetchPropertyDetails(convertSavedHomeToProperty(home));
    },
    [fetchPropertyDetails]
  );

  const handleOpenNegotiation = useCallback((home: SavedHome) => {
    setSelectedHomeForNegotiation(home);
    setIsNegotiationModalOpen(true);
  }, []);

  const handleCloseNegotiation = useCallback(() => {
    setIsNegotiationModalOpen(false);
    setSelectedHomeForNegotiation(null);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: SavedHome }) => {
      const address =
        typeof item.address === "string" || typeof item.address === "number"
          ? String(item.address)
          : (item.description ?? t("saved.address_fallback", { defaultValue: "Unknown address" }));

      const price =
        typeof item.price === "string" || typeof item.price === "number"
          ? String(item.price)
          : t("saved.price_fallback", { defaultValue: "Price not available" });

      return (
        <Box className="mb-3 rounded-lg border border-gray-200 bg-white p-3">
          <Pressable
            onPress={() => {
              void handleOpenDetails(item);
            }}
          >
            <Box className="gap-1">
              <Text className="text-sm font-medium text-gray-900" numberOfLines={2}>
                {address}
              </Text>
              <Text className="text-sm font-semibold text-gray-800">{price}</Text>
              <Box className="mt-1 flex-row flex-wrap gap-2">
                {item.bedrooms != null && (
                  <Text className="text-xs text-gray-600">
                    {t("saved.bedrooms_label", {
                      defaultValue: "{{count}} bed",
                      count: item.bedrooms,
                    })}
                  </Text>
                )}
                {item.bathrooms != null && (
                  <Text className="text-xs text-gray-600">
                    {t("saved.bathrooms_label", {
                      defaultValue: "{{count}} bath",
                      count: item.bathrooms,
                    })}
                  </Text>
                )}
                {item.sqft != null && item.sqft > 0 && (
                  <Text className="text-xs text-gray-600">
                    {t("saved.sqft_label", {
                      defaultValue: "{{value}} sqft",
                      value: item.sqft.toLocaleString(),
                    })}
                  </Text>
                )}
              </Box>
            </Box>
          </Pressable>

          <Box className="mt-3 flex-row gap-2">
            <Button
              variant="secondary"
              size="sm"
              onPress={() => {
                void handleOpenDetails(item);
              }}
              className="flex-1"
            >
              <Text className="text-sm font-medium">
                {t("saved.view_details_button", { defaultValue: "View details" })}
              </Text>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onPress={() => handleOpenNegotiation(item)}
              className="flex-1"
            >
              <Text className="text-sm font-medium">
                {t("saved.negotiate", { defaultValue: "Negotiate" })}
              </Text>
            </Button>
          </Box>
        </Box>
      );
    },
    [handleOpenDetails, handleOpenNegotiation, t]
  );

  if (savedHomesLoading && !refreshing && !homes.length) {
    return (
      <View style={styles.centered}>
        <Loading />
      </View>
    );
  }

  if (savedHomesError && !homes.length) {
    return (
      <View style={styles.centered}>
        <Text className="text-sm text-gray-600">
          {savedHomesError ??
            t("saved.error_generic", {
              defaultValue: "We couldn't load saved homes. Pull to refresh to try again.",
            })}
        </Text>
      </View>
    );
  }

  if (!homes.length) {
    return (
      <View style={styles.centered}>
        <Text className="text-sm text-gray-600">
          {t("saved.client_empty", {
            defaultValue: "No liked homes for this client yet.",
          })}
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={homes}
        keyExtractor={(item) => item.home_id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="rgba(163, 177, 138, 1)"
          />
        }
      />

      {selectedProperty ? (
        <PropertyDetailsModal
          property={selectedProperty}
          onClose={clearSelectedProperty}
          isLoading={isLoadingPropertyDetails}
        />
      ) : null}

      <BaseModal
        isOpen={isNegotiationModalOpen}
        onClose={handleCloseNegotiation}
        title={t("saved.negotiate_modal_title", { defaultValue: "Negotiate" })}
      >
        {selectedHomeForNegotiation ? (
          <>
            <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
              {selectedHomeForNegotiation.address ?? selectedHomeForNegotiation.description ?? ""}
            </Text>
            <Text className="mt-1 text-xs text-gray-600">
              {t("saved.price_label_with_value", {
                defaultValue: "Price: {{price}}",
                price:
                  typeof selectedHomeForNegotiation.price === "string" ||
                  typeof selectedHomeForNegotiation.price === "number"
                    ? String(selectedHomeForNegotiation.price)
                    : t("saved.price_fallback", { defaultValue: "Price not available" }),
              })}
            </Text>
            <Text className="mt-3 text-sm text-gray-700">
              {t("saved.negotiate_modal_body", {
                defaultValue:
                  "Start the conversation with your agent from Messaging to discuss this home.",
              })}
            </Text>
          </>
        ) : (
          <Text className="text-sm text-gray-600">
            {t("saved.negotiate_modal_empty", {
              defaultValue: "Select a home to start negotiation.",
            })}
          </Text>
        )}
      </BaseModal>
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 4,
  },
  centered: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ClientSavedHomesNative;
