import { X, Download, Share, GitCompare, Settings2 } from "lucide-react";
import React, { useMemo, useState, useCallback } from "react";

import BaseModal from "../BaseModal";
import IconButton from "../../ui/button/IconButton";
import { Subtitle } from "../../ui";
import type { SavedHome } from "../../../../../packages/schemas";
import { usePropertyDetails } from "../../../../../packages/hooks/data/search/usePropertyDetails";
import { useUIStore } from "../../../../../packages/store";
import { usePropertyComparison } from "./usePropertyComparison";
import { getAllComparisonFields } from "./comparisonFields";
import { generateCSVContent, exportToCSV, shareCSV } from "./csvUtils";
import { ComparisonTable } from "./ComparisonTable";
import { PropertyCardsGrid } from "./PropertyCardsGrid";
import { RemainingLikedHomes } from "./RemainingLikedHomes";
import { ManageRowsModal } from "./ManageRowsModal";
import { DEFAULT_REPORT_SECTIONS } from "../../../features/onboardpersonalize/lib/constants";
import type { CompareHomesModalProps, PropertyDetails } from "./types";

const CompareHomesModal: React.FC<CompareHomesModalProps> = ({
  isOpen,
  onClose,
  selectedHomes,
  onRemove,
  onAdd,
  allLikedHomes,
}) => {
  const { fetchPropertyDetails } = usePropertyDetails();
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { propertyDetails, loadingStates } = usePropertyComparison(
    isOpen,
    selectedHomes,
  );

  // Use fixed section order (DEFAULT_REPORT_SECTIONS already in priority order)
  const orderedSections = DEFAULT_REPORT_SECTIONS;

  // Field visibility management state
  const [showRowModal, setShowRowModal] = useState(false);
  const [omittedRows, setOmittedRows] = useState<Set<string>>(new Set());
  const [manuallyEnabledRows, setManuallyEnabledRows] = useState<Set<string>>(
    new Set(),
  );

  const handleUnlockHome = async (home: SavedHome) => {
    const propertyData = {
      id: home.home_id,
      address: String(home.address || home.description || ""),
      price:
        typeof home.price === "string"
          ? home.price.startsWith("$")
            ? home.price
            : `$${home.price}`
          : typeof home.price === "number"
            ? `$${home.price.toLocaleString()}`
            : "Price not available",
      bedrooms: home.bedrooms ?? 0,
      bathrooms: home.bathrooms ?? 0,
      sqft: home.sqft ?? 0,
      lat: home.lat ?? 0,
      lng: home.lng ?? 0,
      latitude: home.lat ?? 0,
      longitude: home.lng ?? 0,
      images: home.image_url ? [home.image_url] : undefined,
    };

    await fetchPropertyDetails(propertyData);
  };

  // Prepare comparison data for table view with all available fields
  const comparisonData = useMemo(() => {
    return selectedHomes.map((home) => {
      const details = propertyDetails[home.home_id];
      if (details) {
        return details;
      }

      // Fallback to basic home data
      const homeWithExtras = home as {
        lot_size?: string;
        property_type?: string;
        propertyType?: string;
        listing_status?: string;
        listingStatus?: string;
      };
      return {
        id: home.home_id,
        address:
          typeof home.address === "string" || typeof home.address === "number"
            ? home.address.toString()
            : (home.description ?? "Unknown"),
        price:
          typeof home.price === "string"
            ? home.price
            : typeof home.price === "number"
              ? `$${home.price.toLocaleString()}`
              : "N/A",
        bedrooms: home.bedrooms ?? "—",
        bathrooms: home.bathrooms ?? "—",
        sqft: home.sqft && home.sqft > 0 ? home.sqft.toLocaleString() : "—",
        lotSize:
          typeof homeWithExtras.lot_size === "string"
            ? homeWithExtras.lot_size
            : "—",
        propertyType:
          typeof homeWithExtras.property_type === "string"
            ? homeWithExtras.property_type
            : typeof homeWithExtras.propertyType === "string"
              ? homeWithExtras.propertyType
              : "—",
        listingStatus:
          typeof homeWithExtras.listing_status === "string"
            ? homeWithExtras.listing_status
            : typeof homeWithExtras.listingStatus === "string"
              ? homeWithExtras.listingStatus
              : "—",
        imageUrl: home.image_url,
        isLoading: true,
      } as PropertyDetails;
    });
  }, [selectedHomes, propertyDetails]);

  const allComparisonFields = useMemo(
    () =>
      getAllComparisonFields(comparisonData, loadingStates, orderedSections),
    [comparisonData, loadingStates, orderedSections],
  );

  // Helper function to check if any property has data for a field
  const hasDataForAnyProperty = useCallback(
    (fieldKey: string): boolean => {
      return comparisonData.some((home) => {
        const field = allComparisonFields.find((f) => f.key === fieldKey);
        if (!field) return false;
        const value = field.getValue(home);
        return value !== "—" && value !== "" && value !== "N/A";
      });
    },
    [comparisonData, allComparisonFields],
  );

  // Filter comparison fields based on visibility state
  const visibleComparisonFields = useMemo(() => {
    return allComparisonFields.filter((field) => {
      // Always show section headers
      if (field.isSectionHeader) {
        return !omittedRows.has(field.key);
      }

      const isManuallyOmitted = omittedRows.has(field.key);
      const isAutoOmitted =
        !hasDataForAnyProperty(field.key) &&
        !manuallyEnabledRows.has(field.key);
      return !isManuallyOmitted && !isAutoOmitted;
    });
  }, [
    allComparisonFields,
    omittedRows,
    manuallyEnabledRows,
    hasDataForAnyProperty,
  ]);

  const handleExportToCSV = () => {
    if (selectedHomes.length === 0) {
      enqueueToast({ type: "error", message: "No homes to export" });
      return;
    }

    const csvContent = generateCSVContent(
      comparisonData,
      visibleComparisonFields,
    );
    exportToCSV(
      csvContent,
      () => {
        enqueueToast({
          type: "success",
          message: "Comparison exported successfully",
        });
      },
      (error) => {
        enqueueToast({ type: "error", message: error });
      },
    );
  };

  const handleShareCSV = async () => {
    if (selectedHomes.length === 0) {
      enqueueToast({ type: "error", message: "No homes to share" });
      return;
    }

    const csvContent = generateCSVContent(
      comparisonData,
      visibleComparisonFields,
    );
    await shareCSV(
      csvContent,
      selectedHomes.length,
      (message) => {
        enqueueToast({ type: "success", message });
      },
      (error) => {
        enqueueToast({ type: "error", message: error });
      },
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      showCloseButton={false}
      headerContent={
        <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <GitCompare className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
            <span className="truncate text-base font-medium text-gray-900 sm:text-lg">
              Compare Properties
            </span>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
            <IconButton
              onClick={() => setShowRowModal(true)}
              variant="ghost"
              size="sm"
              icon={<Settings2 className="h-4 w-4 sm:h-4 sm:w-4" />}
              disabled={selectedHomes.length === 0}
              className="touch-manipulation text-gray-600 hover:text-gray-900"
              aria-label="Manage comparison fields"
            />
            <IconButton
              onClick={handleExportToCSV}
              variant="ghost"
              size="sm"
              icon={<Download className="h-4 w-4 sm:h-4 sm:w-4" />}
              disabled={selectedHomes.length === 0}
              className="touch-manipulation text-gray-600 hover:text-gray-900"
              aria-label="Export comparison"
            />
            <IconButton
              onClick={handleShareCSV}
              variant="ghost"
              size="sm"
              icon={<Share className="h-4 w-4 sm:h-4 sm:w-4" />}
              disabled={selectedHomes.length === 0}
              className="touch-manipulation text-gold hover:text-gold/80"
              aria-label="Share comparison"
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon={<X className="h-4 w-4 sm:h-5 sm:w-5" />}
              onClick={onClose}
              className="flex-shrink-0 touch-manipulation text-gray-400 hover:text-gray-500"
              aria-label="Close modal"
            />
          </div>
        </div>
      }
      className="max-w-7xl"
    >
      <div className="space-y-responsive-md">
        {/* Subtitle */}
        <div>
          <Subtitle size="sm" muted>
            {selectedHomes.length} propert
            {selectedHomes.length === 1 ? "y" : "ies"} selected
          </Subtitle>
        </div>

        {/* Comparison Table */}
        <ComparisonTable
          comparisonData={comparisonData}
          comparisonFields={visibleComparisonFields}
          loadingStates={loadingStates}
          selectedHomesCount={selectedHomes.length}
        />

        {/* Property Cards Grid */}
        <PropertyCardsGrid
          selectedHomes={selectedHomes}
          onRemove={onRemove}
          onUnlock={handleUnlockHome}
        />

        {/* Remaining Liked Homes - Show homes not currently in comparison */}
        {onAdd && allLikedHomes && allLikedHomes.length > 0 && (
          <RemainingLikedHomes
            allLikedHomes={allLikedHomes}
            selectedHomes={selectedHomes}
            onAdd={onAdd}
            onUnlock={handleUnlockHome}
          />
        )}

        {selectedHomes.length === 0 && (
          <div className="py-responsive-lg text-center">
            <p className="text-responsive-sm text-gray-600">
              No homes selected for comparison.
            </p>
          </div>
        )}
      </div>

      {/* Manage Rows Modal */}
      <ManageRowsModal
        showRowModal={showRowModal}
        setShowRowModal={setShowRowModal}
        omittedRows={omittedRows}
        setOmittedRows={setOmittedRows}
        manuallyEnabledRows={manuallyEnabledRows}
        setManuallyEnabledRows={setManuallyEnabledRows}
        hasDataForAnyProperty={hasDataForAnyProperty}
        visibleFields={visibleComparisonFields}
        allFields={allComparisonFields}
      />
    </BaseModal>
  );
};

export default CompareHomesModal;
export type { CompareHomesModalProps } from "./types";
