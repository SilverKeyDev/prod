import React from "react";

import { useLocalization } from "packages/contexts";
import type { CompareHomesComparisonField } from "packages/features/compare/types/compareHomes";
import { Box } from "packages/ui/components/primitives";

import { Button, CloseButton, Subtitle, Title } from "@/components/ui";

import { ManageRowsModalFieldRow } from "./ManageRowsModalFieldRow";

interface ManageRowsModalProps {
  showRowModal: boolean;
  setShowRowModal: (show: boolean) => void;
  omittedRows: Set<string>;
  setOmittedRows: (rows: Set<string>) => void;
  manuallyEnabledRows: Set<string>;
  setManuallyEnabledRows: (rows: Set<string>) => void;
  hasDataForAnyProperty: (fieldKey: string) => boolean;
  visibleFields: CompareHomesComparisonField[];
  allFields: CompareHomesComparisonField[];
}

function ManageRowsModalHeader({ onClose }: { onClose: () => void }) {
  const { t } = useLocalization();
  return (
    <Box className="border-border flex flex-row items-center justify-between border-b p-6">
      <Box>
        <Title size="md" className="font-semibold">
          {t("compare.manage_fields_title")}
        </Title>
        <Subtitle size="xs" muted className="mt-1">
          {t("compare.manage_fields_subtitle")}
        </Subtitle>
      </Box>
      <CloseButton onClick={onClose} size="sm" className="rounded-lg p-2" />
    </Box>
  );
}

type ManageRowsModalActionsProps = {
  allFieldKeys: string[];
  visibleCount: number;
  setOmittedRows: (rows: Set<string>) => void;
  setManuallyEnabledRows: (rows: Set<string>) => void;
};

function ManageRowsModalActions({
  allFieldKeys,
  visibleCount,
  setOmittedRows,
  setManuallyEnabledRows,
}: ManageRowsModalActionsProps) {
  const { t } = useLocalization();
  return (
    <Box className="mb-6 flex flex-row flex-wrap gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={() => {
          setOmittedRows(new Set());
          setManuallyEnabledRows(new Set(allFieldKeys));
        }}
      >
        {t("compare.show_all", { count: allFieldKeys.length })}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setOmittedRows(new Set(allFieldKeys));
          setManuallyEnabledRows(new Set());
        }}
      >
        {t("compare.hide_all")}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setOmittedRows(new Set());
          setManuallyEnabledRows(new Set());
        }}
      >
        {t("compare.auto_hide_empty")}
      </Button>
      <Box className="bg-primary-muted text-text-secondary rounded-lg px-4 py-2 text-sm">
        {t("compare.showing_fields", {
          visible: visibleCount,
          total: allFieldKeys.length,
        })}
      </Box>
    </Box>
  );
}

export function ManageRowsModal({
  showRowModal,
  setShowRowModal,
  omittedRows,
  setOmittedRows,
  manuallyEnabledRows,
  setManuallyEnabledRows,
  hasDataForAnyProperty,
  visibleFields,
  allFields,
}: ManageRowsModalProps) {
  if (!showRowModal) return null;

  const allFieldKeys = allFields.map((f) => f.key);

  const handleFieldToggle = (fieldKey: string, hasData: boolean) => (checked: boolean) => {
    if (checked) {
      const newOmittedRows = new Set(omittedRows);
      newOmittedRows.delete(fieldKey);
      setOmittedRows(newOmittedRows);
      if (!hasData) {
        const newManuallyEnabled = new Set(manuallyEnabledRows);
        newManuallyEnabled.add(fieldKey);
        setManuallyEnabledRows(newManuallyEnabled);
      }
    } else {
      const newOmittedRows = new Set(omittedRows);
      newOmittedRows.add(fieldKey);
      setOmittedRows(newOmittedRows);
      const newManuallyEnabled = new Set(manuallyEnabledRows);
      newManuallyEnabled.delete(fieldKey);
      setManuallyEnabledRows(newManuallyEnabled);
    }
  };

  return (
    <Box className="bg-overlay-backdrop fixed inset-0 z-50 flex flex-row items-center justify-center p-4">
      <Box className="bg-background-surface flex min-h-0 w-full max-w-2xl flex-1 flex-row flex-col rounded-lg shadow-xl">
        <ManageRowsModalHeader onClose={() => setShowRowModal(false)} />
        <Box className="flex-1 overflow-hidden p-6">
          <ManageRowsModalActions
            allFieldKeys={allFieldKeys}
            visibleCount={visibleFields.length}
            setOmittedRows={setOmittedRows}
            setManuallyEnabledRows={setManuallyEnabledRows}
          />
          <Box className="border-border overflow-hidden rounded-lg border">
            <Box className="custom-scrollbar max-h-96 overflow-y-auto">
              {allFields.map((field, index) => (
                <ManageRowsModalFieldRow
                  key={field.key}
                  field={field}
                  index={index}
                  totalCount={allFields.length}
                  isOmitted={
                    omittedRows.has(field.key) ||
                    (!hasDataForAnyProperty(field.key) && !manuallyEnabledRows.has(field.key))
                  }
                  hasData={hasDataForAnyProperty(field.key)}
                  isManuallyEnabled={manuallyEnabledRows.has(field.key)}
                  onToggle={handleFieldToggle(field.key, hasDataForAnyProperty(field.key))}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
