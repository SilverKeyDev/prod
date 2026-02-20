import React, { useCallback, useMemo, useState } from "react";

import { Download, GitCompare, Settings2, Share, X } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { usePropertyComparison } from "packages/hooks/data/search/compare/usePropertyComparison";
import { usePropertyDetails } from "packages/hooks/data/search/property/usePropertyDetails";
import type { SavedHome } from "packages/schemas";
import { useUIStore } from "packages/store";
import { getAllComparisonFields } from "packages/utils/domain/compareHomes/comparisonFields";
import {
  exportToCSV,
  generateCSVContent,
  shareCSV,
} from "packages/utils/domain/compareHomes/csvUtils";
import type { CompareHomesPropertyDetails } from "packages/utils/domain/compareHomes/types";
import { DEFAULT_REPORT_SECTIONS } from "packages/utils/domain/profile";

import BaseModal from "@/components/modals/BaseModal";
import { BodyText, IconButton, Subtitle } from "@/components/ui/index.web";

import { fallbackComparisonDetails } from "./compareHomesModalHelpers";
import { ComparisonTable } from "./ComparisonTable";
import { ManageRowsModal } from "./ManageRowsModal";
import { PropertyCardsGrid } from "./PropertyCardsGrid";
import { RemainingLikedHomes } from "./RemainingLikedHomes";

export type CompareHomesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedHomes: SavedHome[];
  onRemove: (homeId: string) => void;
  onAdd?: (homeId: string) => void;
  allLikedHomes?: SavedHome[];
};

function buildPropertyDataFromHome(home: SavedHome) {
  return {
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
}

function useCompareHomesData(
  selectedHomes: SavedHome[],
  propertyDetails: Record<string, CompareHomesPropertyDetails>,
  loadingStates: Record<string, boolean>,
  omittedRows: Set<string>,
  manuallyEnabledRows: Set<string>,
  _t: (key: string, opts?: Record<string, unknown>) => string,
) {
  const orderedSections = DEFAULT_REPORT_SECTIONS;
  const comparisonData = useMemo(() => {
    return selectedHomes.map((home) => {
      const details = propertyDetails[home.home_id];
      if (details) return details;
      return fallbackComparisonDetails(home);
    });
  }, [selectedHomes, propertyDetails]);

  const allComparisonFields = useMemo(
    () =>
      getAllComparisonFields(comparisonData, loadingStates, orderedSections),
    [comparisonData, loadingStates, orderedSections],
  );

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

  const visibleComparisonFields = useMemo(() => {
    return allComparisonFields.filter((field) => {
      if (field.isSectionHeader) return !omittedRows.has(field.key);
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

  return {
    comparisonData,
    allComparisonFields,
    hasDataForAnyProperty,
    visibleComparisonFields,
  };
}

function useCompareHomesCSVActions(
  comparisonData: CompareHomesPropertyDetails[],
  visibleComparisonFields: ReturnType<typeof getAllComparisonFields>,
  selectedCount: number,
  enqueueToast: (t: { type: string; message: string }) => void,
  t: (key: string, opts?: Record<string, unknown>) => string,
) {
  const handleExportToCSV = useCallback(() => {
    if (selectedCount === 0) {
      enqueueToast({ type: "error", message: t("compare.no_homes_export") });
      return;
    }
    const csvContent = generateCSVContent(
      comparisonData,
      visibleComparisonFields,
    );
    void exportToCSV(
      csvContent,
      () =>
        enqueueToast({
          type: "success",
          message: t("compare.export_success"),
        }),
      (error) => enqueueToast({ type: "error", message: error }),
    );
  }, [selectedCount, comparisonData, visibleComparisonFields, enqueueToast, t]);

  const handleShareCSV = useCallback(async () => {
    if (selectedCount === 0) {
      enqueueToast({ type: "error", message: t("compare.no_homes_share") });
      return;
    }
    const csvContent = generateCSVContent(
      comparisonData,
      visibleComparisonFields,
    );
    await shareCSV(
      csvContent,
      selectedCount,
      (message) => enqueueToast({ type: "success", message }),
      (error) => enqueueToast({ type: "error", message: error }),
    );
  }, [selectedCount, comparisonData, visibleComparisonFields, enqueueToast, t]);

  return { handleExportToCSV, handleShareCSV };
}

type CompareHomesModalHeaderProps = {
  selectedCount: number;
  onOpenRowModal: () => void;
  onExportCSV: () => void;
  onShareCSV: () => void;
  onClose: () => void;
};

function CompareHomesModalHeader({
  selectedCount,
  onOpenRowModal,
  onExportCSV,
  onShareCSV,
  onClose,
}: CompareHomesModalHeaderProps) {
  const { t } = useLocalization();
  return (
    <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <GitCompare className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
        <BodyText
          as="span"
          className="truncate text-base font-medium text-gray-900 sm:text-lg"
        >
          {t("compare.compare_properties")}
        </BodyText>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
        <IconButton
          onClick={onOpenRowModal}
          variant="ghost"
          size="sm"
          icon={<Settings2 className="h-4 w-4 sm:h-4 sm:w-4" />}
          disabled={selectedCount === 0}
          className="touch-manipulation text-gray-600 hover:text-gray-900"
          aria-label={t("compare.manage_aria")}
        />
        <IconButton
          onClick={onExportCSV}
          variant="ghost"
          size="sm"
          icon={<Download className="h-4 w-4 sm:h-4 sm:w-4" />}
          disabled={selectedCount === 0}
          className="touch-manipulation text-gray-600 hover:text-gray-900"
          aria-label={t("compare.export_aria")}
        />
        <IconButton
          onClick={onShareCSV}
          variant="ghost"
          size="sm"
          icon={<Share className="h-4 w-4 sm:h-4 sm:w-4" />}
          disabled={selectedCount === 0}
          className="touch-manipulation text-gold hover:text-gold/80"
          aria-label={t("compare.share_aria")}
        />
        <IconButton
          variant="ghost"
          size="sm"
          icon={<X className="h-4 w-4 sm:h-5 sm:w-5" />}
          onClick={onClose}
          className="flex-shrink-0 touch-manipulation text-gray-400 hover:text-gray-500"
          aria-label={t("compare.close_modal_aria")}
        />
      </div>
    </div>
  );
}

const CompareHomesModal: React.FC<CompareHomesModalProps> = ({
  isOpen,
  onClose,
  selectedHomes,
  onRemove,
  onAdd,
  allLikedHomes,
}) => {
  const { t } = useLocalization();
  const { fetchPropertyDetails } = usePropertyDetails();
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { propertyDetails, loadingStates } = usePropertyComparison(
    isOpen,
    selectedHomes,
  );

  const [showRowModal, setShowRowModal] = useState(false);
  const [omittedRows, setOmittedRows] = useState<Set<string>>(new Set());
  const [manuallyEnabledRows, setManuallyEnabledRows] = useState<Set<string>>(
    new Set(),
  );

  const {
    comparisonData,
    allComparisonFields,
    hasDataForAnyProperty,
    visibleComparisonFields,
  } = useCompareHomesData(
    selectedHomes,
    propertyDetails,
    loadingStates,
    omittedRows,
    manuallyEnabledRows,
    t,
  );

  const { handleExportToCSV, handleShareCSV } = useCompareHomesCSVActions(
    comparisonData,
    visibleComparisonFields,
    selectedHomes.length,
    enqueueToast,
    t,
  );

  const handleUnlockHome = useCallback(
    async (home: SavedHome) => {
      await fetchPropertyDetails(buildPropertyDataFromHome(home));
    },
    [fetchPropertyDetails],
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      showCloseButton={false}
      headerContent={
        <CompareHomesModalHeader
          selectedCount={selectedHomes.length}
          onOpenRowModal={() => setShowRowModal(true)}
          onExportCSV={handleExportToCSV}
          onShareCSV={handleShareCSV}
          onClose={onClose}
        />
      }
      className="max-w-7xl"
    >
      <div className="space-y-responsive-md">
        <div>
          <Subtitle size="sm" muted>
            {selectedHomes.length === 1
              ? t("compare.selected_singular", { count: selectedHomes.length })
              : t("compare.selected_plural", { count: selectedHomes.length })}
          </Subtitle>
        </div>
        <ComparisonTable
          comparisonData={comparisonData}
          comparisonFields={visibleComparisonFields}
          loadingStates={loadingStates}
          selectedHomesCount={selectedHomes.length}
        />
        <PropertyCardsGrid
          selectedHomes={selectedHomes}
          onRemove={onRemove}
          onUnlock={handleUnlockHome}
        />
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
            <BodyText
              as="p"
              size="sm"
              className="text-gray-600 text-responsive-sm"
            >
              {t("compare.no_homes_selected")}
            </BodyText>
          </div>
        )}
      </div>
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
