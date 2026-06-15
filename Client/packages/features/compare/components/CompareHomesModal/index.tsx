import React, { useCallback, useMemo } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { usePropertyComparison } from "packages/features/compare/hooks/data/usePropertyComparison";
import { useCompareSessionStore } from "packages/features/compare/store";
import type { CompareHomesPropertyDetails } from "packages/features/compare/types/compareHomes";
import {
  exportToCSV,
  generateCSVContent,
  getAllComparisonFields,
  shareCSV,
} from "packages/features/compare/utils";
import { useNavigation } from "packages/navigation";
import { useUIStore } from "packages/store";
import type { SavedHome } from "packages/types";
import { Box } from "packages/ui/components/structure/primitives";
import { DEFAULT_REPORT_SECTIONS } from "packages/utils/product/domain/defaultReportSections";
import { buildPropertyUrl } from "packages/utils/transaction/property/slug";

import { BodyText, Cover, IconButton, Subtitle } from "@/components/ui";

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
        return value !== "-" && value !== "" && value !== "N/A";
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
  const { navigateToPath } = useNavigation();
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { propertyDetails, loadingStates } = usePropertyComparison(isOpen, selectedHomes);

  const omittedRowKeys = useCompareSessionStore((s) => s.omittedRowKeys);
  const manuallyEnabledRowKeys = useCompareSessionStore((s) => s.manuallyEnabledRowKeys);
  const showRowModal = useCompareSessionStore((s) => s.isManageRowsModalOpen);
  const setManageRowsModalOpen = useCompareSessionStore((s) => s.setManageRowsModalOpen);
  const setOmittedRowsFromSet = useCompareSessionStore((s) => s.setOmittedRowsFromSet);
  const setManuallyEnabledRowsFromSet = useCompareSessionStore(
    (s) => s.setManuallyEnabledRowsFromSet
  );

  const omittedRows = useMemo(() => new Set(omittedRowKeys), [omittedRowKeys]);
  const manuallyEnabledRows = useMemo(
    () => new Set(manuallyEnabledRowKeys),
    [manuallyEnabledRowKeys]
  );

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
      const zpid = (home as SavedHomeWithDetails).home_id ?? String(home.address ?? "");
      const address = String(home.address ?? home.description ?? "");
      navigateToPath(buildPropertyUrl(zpid, address));
    },
    [navigateToPath]
  );
  return (
    <Cover
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      headerContent={
        <CompareHomesModalHeader
          selectedCount={selectedHomes.length}
          onOpenRowModal={() => setManageRowsModalOpen(true)}
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
        setShowRowModal={setManageRowsModalOpen}
        omittedRows={omittedRows}
        setOmittedRows={setOmittedRowsFromSet}
        manuallyEnabledRows={manuallyEnabledRows}
        setManuallyEnabledRows={setManuallyEnabledRowsFromSet}
        hasDataForAnyProperty={hasDataForAnyProperty}
        visibleFields={visibleComparisonFields}
        allFields={allComparisonFields}
      />
    </Cover>
  );
};
export default CompareHomesModal;
