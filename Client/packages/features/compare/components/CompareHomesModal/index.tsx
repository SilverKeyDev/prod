import React, { useCallback, useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { usePropertyComparison } from "packages/features/compare/hooks/data/usePropertyComparison";
import type { CompareHomesPropertyDetails } from "packages/features/compare/types/compareHomes";
import {
  exportToCSV,
  generateCSVContent,
  getAllComparisonFields,
  shareCSV,
} from "packages/features/compare/utils";
import { useUIStore } from "packages/store";
import type { SavedHome } from "packages/types";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Cover, IconButton, Subtitle } from "@/components/ui";
import { DEFAULT_REPORT_SECTIONS } from "@/features/profile/utils";
import {
  type Property as PropertyDetailsProperty,
  usePropertyDetails,
} from "@/features/search/hooks/data/property/usePropertyDetails";

import { fallbackComparisonDetails } from "./compareHomesModalHelpers";
import { PropertyCardsGrid, RemainingLikedHomes } from "./grid";
import { ManageRowsModal } from "./manage-rows";
import { ComparisonTable } from "./table";
export type CompareHomesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedHomes: SavedHome[];
  onRemove: (homeId: string) => void;
  onAdd?: (homeId: string) => void;
  allLikedHomes?: SavedHome[];
};
type SavedHomeWithDetails = SavedHome & {
  home_id?: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number | string;
  beds?: number | string;
  baths?: number | string;
  lat?: number | string;
  lng?: number | string;
  image_url?: string;
};
function buildPropertyDataFromHome(home: SavedHomeWithDetails): PropertyDetailsProperty {
  const id = (home.home_id ?? home.address ?? "").toString();
  const address = String(home.address ?? home.description ?? "");
  const rawPrice = home.price as unknown as string | number | undefined;
  const price =
    typeof rawPrice === "string"
      ? rawPrice.startsWith("$")
        ? rawPrice
        : `$${rawPrice}`
      : typeof rawPrice === "number"
        ? `$${rawPrice.toLocaleString()}`
        : "Price not available";
  const rawBedrooms = home.bedrooms ?? home.beds;
  const bedrooms =
    typeof rawBedrooms === "number"
      ? rawBedrooms
      : Number.parseInt((rawBedrooms ?? "0").toString(), 10) || 0;
  const rawBathrooms = home.bathrooms ?? home.baths;
  const bathrooms =
    typeof rawBathrooms === "number"
      ? rawBathrooms
      : Number.parseInt((rawBathrooms ?? "0").toString(), 10) || 0;
  const rawSqft = home.sqft;
  let sqft = 0;
  if (typeof rawSqft === "number") {
    sqft = rawSqft;
  } else if (typeof rawSqft === "string") {
    const cleaned = rawSqft.replace(/,/g, "").trim();
    if (cleaned !== "") {
      const parsed = Number.parseInt(cleaned, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        sqft = parsed;
      }
    }
  }
  const rawLat = home.lat;
  const rawLng = home.lng;
  const lat =
    typeof rawLat === "number"
      ? rawLat
      : typeof rawLat === "string"
        ? Number.parseFloat(rawLat) || 0
        : 0;
  const lng =
    typeof rawLng === "number"
      ? rawLng
      : typeof rawLng === "string"
        ? Number.parseFloat(rawLng) || 0
        : 0;
  return {
    id,
    address,
    price,
    bedrooms,
    bathrooms,
    sqft,
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    images: home.image_url ? [home.image_url] : undefined,
  };
}
function useCompareHomesData(
  selectedHomes: SavedHome[],
  propertyDetails: Record<string, CompareHomesPropertyDetails>,
  loadingStates: Record<string, boolean>,
  omittedRows: Set<string>,
  manuallyEnabledRows: Set<string>,
  _t: (key: string, opts?: Record<string, unknown>) => string
) {
  const orderedSections = DEFAULT_REPORT_SECTIONS;
  const comparisonData = useMemo(() => {
    return selectedHomes.map((home) => {
      const typedHome = home as SavedHomeWithDetails;
      const homeId = (typedHome.home_id ?? typedHome.address ?? "").toString();
      const details = propertyDetails[homeId];
      if (details) return details;
      return fallbackComparisonDetails(home);
    });
  }, [selectedHomes, propertyDetails]);
  const allComparisonFields = useMemo(
    () => getAllComparisonFields(comparisonData, loadingStates, orderedSections),
    [comparisonData, loadingStates, orderedSections]
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
    [comparisonData, allComparisonFields]
  );
  const visibleComparisonFields = useMemo(() => {
    return allComparisonFields.filter((field) => {
      if (field.isSectionHeader) return !omittedRows.has(field.key);
      const isManuallyOmitted = omittedRows.has(field.key);
      const isAutoOmitted =
        !hasDataForAnyProperty(field.key) && !manuallyEnabledRows.has(field.key);
      return !isManuallyOmitted && !isAutoOmitted;
    });
  }, [allComparisonFields, omittedRows, manuallyEnabledRows, hasDataForAnyProperty]);
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
  t: (key: string, opts?: Record<string, unknown>) => string
) {
  const handleExportToCSV = useCallback(() => {
    if (selectedCount === 0) {
      enqueueToast({ type: "error", message: t("compare.no_homes_export") });
      return;
    }
    const csvContent = generateCSVContent(comparisonData, visibleComparisonFields);
    void exportToCSV(
      csvContent,
      () =>
        enqueueToast({
          type: "success",
          message: t("compare.export_success"),
        }),
      (error) => enqueueToast({ type: "error", message: error })
    );
  }, [selectedCount, comparisonData, visibleComparisonFields, enqueueToast, t]);
  const handleShareCSV = useCallback(async () => {
    if (selectedCount === 0) {
      enqueueToast({ type: "error", message: t("compare.no_homes_share") });
      return;
    }
    const csvContent = generateCSVContent(comparisonData, visibleComparisonFields);
    await shareCSV(
      csvContent,
      selectedCount,
      (message) => enqueueToast({ type: "success", message }),
      (error) => enqueueToast({ type: "error", message: error })
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
    <Box className="flex w-full items-center justify-between gap-2 sm:gap-4">
      <Box className="flex min-w-0 flex-1 items-center gap-2">
        <Icon name="git-compare" className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
        <BodyText as="span" className="text-text-primary truncate text-base font-medium sm:text-lg">
          {t("compare.compare_properties")}
        </BodyText>
      </Box>
      <Box className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
        <IconButton
          onClick={onOpenRowModal}
          variant="ghost"
          size="sm"
          icon={<Icon name="settings-2" className="h-4 w-4 sm:h-4 sm:w-4" />}
          disabled={selectedCount === 0}
          className="text-text-secondary hover:text-text-primary touch-manipulation"
          label={t("compare.manage_aria")}
        />
        <IconButton
          onClick={onExportCSV}
          variant="ghost"
          size="sm"
          icon={<Icon name="download" className="h-4 w-4 sm:h-4 sm:w-4" />}
          disabled={selectedCount === 0}
          className="text-text-secondary hover:text-text-primary touch-manipulation"
          label={t("compare.export_aria")}
        />
        <IconButton
          onClick={onShareCSV}
          variant="ghost"
          size="sm"
          icon={<Icon name="share" className="h-4 w-4 sm:h-4 sm:w-4" />}
          disabled={selectedCount === 0}
          className="text-accent hover:text-accent touch-manipulation"
          label={t("compare.share_aria")}
        />
        <IconButton
          variant="ghost"
          size="sm"
          icon={<Icon name="x" className="h-4 w-4 sm:h-5 sm:w-5" />}
          onClick={onClose}
          className="text-text-disabled hover:text-text-secondary flex-shrink-0 touch-manipulation"
          label={t("compare.close_modal_aria")}
        />
      </Box>
    </Box>
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
  const { propertyDetails, loadingStates } = usePropertyComparison(isOpen, selectedHomes);
  const [showRowModal, setShowRowModal] = useState(false);
  const [omittedRows, setOmittedRows] = useState<Set<string>>(new Set());
  const [manuallyEnabledRows, setManuallyEnabledRows] = useState<Set<string>>(new Set());
  const { comparisonData, allComparisonFields, hasDataForAnyProperty, visibleComparisonFields } =
    useCompareHomesData(
      selectedHomes,
      propertyDetails,
      loadingStates,
      omittedRows,
      manuallyEnabledRows,
      t
    );
  const { handleExportToCSV, handleShareCSV } = useCompareHomesCSVActions(
    comparisonData,
    visibleComparisonFields,
    selectedHomes.length,
    enqueueToast,
    t
  );
  const handleUnlockHome = useCallback(
    async (home: SavedHome) => {
      await fetchPropertyDetails(buildPropertyDataFromHome(home));
    },
    [fetchPropertyDetails]
  );
  return (
    <Cover
      isOpen={isOpen}
      onClose={onClose}
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
    >
      <Box className="space-y-responsive-md">
        <Box>
          <Subtitle size="sm" muted>
            {selectedHomes.length === 1
              ? t("compare.selected_singular", { count: selectedHomes.length })
              : t("compare.selected_plural", { count: selectedHomes.length })}
          </Subtitle>
        </Box>
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
          <Box className="py-responsive-lg text-center">
            <BodyText as="p" size="sm" className="text-responsive-sm text-text-secondary">
              {t("compare.no_homes_selected")}
            </BodyText>
          </Box>
        )}
      </Box>
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
    </Cover>
  );
};
export default CompareHomesModal;
