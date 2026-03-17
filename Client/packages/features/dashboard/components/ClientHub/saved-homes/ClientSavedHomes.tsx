import React, { useCallback, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import { useDocumentActions } from "packages/features/documents";
import { NegotiationModal } from "packages/features/negotiate";
import { PropertyDetailsModal } from "packages/features/propertyDetails";
import type { SavedHome } from "packages/types";
import { PdfModal } from "packages/ui/components/modals";
import {
  Box,
  Pressable,
  PrimitiveInput,
  ScrollView,
  Text,
} from "packages/ui/components/primitives";

import {
  convertSavedHomeToProperty,
  convertToFavoriteHome,
} from "@/features/saved/types/savedHomeUtils";
import { usePropertyDetails } from "@/features/search/hooks/data/property/usePropertyDetails";
import { useSavedHomesStoreIntegration } from "@/features/search/hooks/store/useSavedHomesStoreIntegration";
type ClientSavedHomesProps = {
  userId?: string;
  clientId?: string;
};

export default function ClientSavedHomes({ userId, clientId }: ClientSavedHomesProps) {
  const { t } = useLocalization();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState(false);
  const [selectedHomeForNegotiation, setSelectedHomeForNegotiation] = useState<SavedHome | null>(
    null
  );

  // Use either userId or clientId for the hook
  const targetId = userId || clientId || "";

  const { savedHomes, savedHomesLoading, savedHomesError, refreshSavedHomes } =
    useSavedHomesStoreIntegration(targetId);

  const { currentPdf, currentDocumentId, currentDocumentName, closePdfModal } =
    useDocumentActions();

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

  // Filter homes based on search term
  const filteredHomes = useMemo(() => {
    if (!searchTerm) return homes;
    return homes.filter((home) => {
      const address =
        typeof home.address === "string" || typeof home.address === "number"
          ? String(home.address)
          : (home.description ?? "");
      return (
        address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        home.home_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [homes, searchTerm]);

  // Loading state
  if (savedHomesLoading && !homes.length) {
    return (
      <Box className="items-center justify-center py-12">
        <Text className="text-text-secondary text-sm">Loading saved homes...</Text>
      </Box>
    );
  }

  // Error state
  if (savedHomesError) {
    return (
      <Box className="items-center justify-center py-12">
        <Text className="text-sm text-red-600">{savedHomesError}</Text>
        <Pressable onPress={handleRefresh} className="bg-primary mt-4 rounded-lg px-4 py-2">
          <Text className="text-sm font-medium text-white">Retry</Text>
        </Pressable>
      </Box>
    );
  }

  // Empty state
  if (!homes.length) {
    return (
      <Box className="items-center justify-center py-12">
        <Text className="text-text-secondary text-sm">No saved homes yet.</Text>
      </Box>
    );
  }

  return (
    <Box className="flex-1">
      {/* Search */}
      <Box className="mb-4 px-4">
        <PrimitiveInput
          placeholder="Search saved homes..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          className="border-border bg-background-surface text-text-primary rounded-lg border px-3 py-2 text-base"
        />
      </Box>

      {/* Properties List */}
      <ScrollView
        className="flex-1"
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
      >
        {filteredHomes.length === 0 ? (
          <Box className="items-center py-8">
            <Text className="text-text-secondary text-sm">
              {searchTerm ? "No homes match your search." : "No saved homes yet."}
            </Text>
          </Box>
        ) : (
          <Box className="gap-3">
            {filteredHomes.map((home) => {
              const address =
                typeof home.address === "string" || typeof home.address === "number"
                  ? String(home.address)
                  : (home.description ??
                    t("saved.address_fallback", { defaultValue: "Unknown address" }));

              const price =
                typeof home.price === "string" || typeof home.price === "number"
                  ? String(home.price)
                  : t("saved.price_fallback", { defaultValue: "Price not available" });

              return (
                <Box
                  key={home.home_id}
                  className="border-border bg-background-surface rounded-lg border p-3"
                >
                  <Pressable
                    onPress={() => {
                      void handleOpenDetails(home);
                    }}
                    className="active:opacity-90"
                  >
                    <Box className="flex flex-col gap-2">
                      <Text className="text-text-primary text-sm font-semibold">{address}</Text>
                      <Text className="text-text-secondary text-sm">{price}</Text>

                      {/* Property details */}
                      <Box className="flex flex-row items-center gap-4">
                        {home.bedrooms != null && (
                          <Text className="text-text-secondary text-xs">
                            {home.bedrooms} {home.bedrooms === 1 ? "bed" : "beds"}
                          </Text>
                        )}
                        {home.bathrooms != null && (
                          <Text className="text-text-secondary text-xs">
                            {home.bathrooms} {home.bathrooms === 1 ? "bath" : "baths"}
                          </Text>
                        )}
                        {home.sqft && (
                          <Text className="text-text-secondary text-xs">{home.sqft} sqft</Text>
                        )}
                      </Box>
                    </Box>
                  </Pressable>

                  {/* Action buttons */}
                  <Box className="mt-3 flex flex-row gap-2">
                    <Pressable
                      onPress={() => handleOpenDetails(home)}
                      className="bg-primary flex-1 rounded-lg px-3 py-2"
                    >
                      <Text className="text-center text-sm font-medium text-white">
                        View Details
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleOpenNegotiation(home)}
                      className="border-border bg-background-surface flex-1 rounded-lg border px-3 py-2"
                    >
                      <Text className="text-text-primary text-center text-sm font-medium">
                        Negotiate
                      </Text>
                    </Pressable>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </ScrollView>

      {/* Modals */}
      <PropertyDetailsModal
        property={selectedProperty}
        onClose={clearSelectedProperty}
        isLoading={isLoadingPropertyDetails}
      />

      <NegotiationModal
        isOpen={isNegotiationModalOpen}
        onClose={handleCloseNegotiation}
        initialHome={
          selectedHomeForNegotiation ? convertToFavoriteHome(selectedHomeForNegotiation) : null
        }
      />

      <PdfModal
        currentPdf={currentPdf}
        currentReportAddress={currentDocumentName}
        reportId={currentDocumentId}
        onClose={closePdfModal}
      />
    </Box>
  );
}
