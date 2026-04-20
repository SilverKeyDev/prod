import React, { useCallback, useMemo, useState } from "react";

import { useDocumentActions, useHomeComparison } from "packages/features/documents";
import {
  convertSavedHomeToProperty,
  SavedHomesContent,
  SavedPageModals,
} from "packages/features/saved";
import { usePropertyDetails } from "packages/features/search";
import { useSavedHomesData } from "packages/hooks/data/saved/useSavedHomesData";
import { useSavedPageModals } from "packages/hooks/ui";
import type { SavedHome } from "packages/types";
import { PdfModal } from "packages/ui/components/modals";
import { Box, Pressable, ScrollView, Text } from "packages/ui/components/primitives";

type ClientSavedHomesProps = {
  userId?: string;
  clientId?: string;
};

export default function ClientSavedHomes({ userId, clientId }: ClientSavedHomesProps) {
  const [refreshing, setRefreshing] = useState(false);

  const targetRaw = userId || clientId || "";
  const targetScopedId = targetRaw.trim() !== "" ? targetRaw : undefined;

  const { savedHomes, savedHomesLoading, savedHomesError, refreshSavedHomes } =
    useSavedHomesData(targetScopedId);

  const { currentPdf, currentDocumentId, currentDocumentName, closePdfModal } =
    useDocumentActions();

  const {
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
    isLoading: isLoadingPropertyDetails,
  } = usePropertyDetails();

  const homes: SavedHome[] = useMemo(() => savedHomes ?? [], [savedHomes]);

  const {
    selectedHomesForComparison,
    selectedHomesData,
    handleToggleHomeSelection,
    handleRemoveFromComparison,
    handleClearComparison,
  } = useHomeComparison(homes);

  const {
    isCompareModalOpen,
    setIsCompareModalOpen,
    isNegotiationModalOpen,
    selectedHomeForNegotiation,
    handleCloseNegotiation,
  } = useSavedPageModals();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshSavedHomes();
    setRefreshing(false);
  }, [refreshSavedHomes]);

  const handleUnlockHome = useCallback(
    async (home: SavedHome) => {
      await fetchPropertyDetails(convertSavedHomeToProperty(home));
    },
    [fetchPropertyDetails]
  );

  const handleCompare = useCallback(() => {
    if (selectedHomesData.length >= 2) setIsCompareModalOpen(true);
  }, [selectedHomesData.length, setIsCompareModalOpen]);

  if (savedHomesError) {
    return (
      <Box className="items-center justify-center px-4 py-12">
        <Text className="text-sm text-red-600">{savedHomesError}</Text>
        <Pressable onPress={handleRefresh} className="bg-primary mt-4 rounded-lg px-4 py-2">
          <Text className="text-sm font-medium text-white">Retry</Text>
        </Pressable>
      </Box>
    );
  }

  return (
    <Box
      className={`flex flex-1 flex-col gap-4 ${
        selectedHomesData.length >= 1 ? "mb-36 sm:mb-40" : "mb-responsive-lg"
      }`}
    >
      <PdfModal
        currentPdf={currentPdf}
        currentReportAddress={currentDocumentName}
        reportId={currentDocumentId}
        onClose={closePdfModal}
      />

      <ScrollView
        className="flex-1"
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <SavedHomesContent
          viewType="homes"
          filteredHomes={homes}
          homesLoading={savedHomesLoading}
          documents={[]}
          documentsLoading={false}
          selectedHomesForComparison={selectedHomesForComparison}
          onToggleHomeSelection={handleToggleHomeSelection}
          onUnlockHome={(home) => {
            void handleUnlockHome(home);
          }}
          onDocumentDelete={() => {}}
          selectedHomesDataLength={selectedHomesData.length}
          noHomesYetKey="dashboard.liked_homes_empty"
        />
      </ScrollView>

      <SavedPageModals
        viewType="homes"
        selectedProperty={selectedProperty}
        clearSelectedProperty={clearSelectedProperty}
        isLoadingPropertyDetails={isLoadingPropertyDetails}
        isCompareModalOpen={isCompareModalOpen}
        setIsCompareModalOpen={setIsCompareModalOpen}
        selectedHomesData={selectedHomesData}
        handleRemoveFromComparison={handleRemoveFromComparison}
        handleToggleHomeSelection={handleToggleHomeSelection}
        homes={homes}
        isNegotiationModalOpen={isNegotiationModalOpen}
        selectedHomeForNegotiation={selectedHomeForNegotiation}
        handleCloseNegotiation={handleCloseNegotiation}
        handleCompare={handleCompare}
        handleClearComparison={handleClearComparison}
      />
    </Box>
  );
}
