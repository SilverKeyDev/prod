import React from "react";

import { Button, CloseButton, Subtitle, Title } from "@ui/index.web";

import { useLocalization } from "packages/contexts";
import type { CompareHomesComparisonField } from "packages/utils/domain/compareHomes/types";

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
    <div className="flex items-center justify-between border-b border-gray-200 p-6">
      <div>
        <Title size="md" className="font-semibold">
          {t("compare.manage_fields_title")}
        </Title>
        <Subtitle size="xs" muted className="mt-1">
          {t("compare.manage_fields_subtitle")}
        </Subtitle>
      </div>
      <CloseButton onClick={onClose} size="sm" className="rounded-lg p-2" />
    </div>
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
    <div className="mb-6 flex flex-wrap gap-2">
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
      <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-black/60">
        {t("compare.showing_fields", {
          visible: visibleCount,
          total: allFieldKeys.length,
        })}
      </div>
    </div>
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

  const handleFieldToggle =
    (fieldKey: string, hasData: boolean) => (checked: boolean) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        <ManageRowsModalHeader onClose={() => setShowRowModal(false)} />
        <div className="flex-1 overflow-hidden p-6">
          <ManageRowsModalActions
            allFieldKeys={allFieldKeys}
            visibleCount={visibleFields.length}
            setOmittedRows={setOmittedRows}
            setManuallyEnabledRows={setManuallyEnabledRows}
          />
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="custom-scrollbar max-h-96 overflow-y-auto">
              {allFields.map((field, index) => (
                <ManageRowsModalFieldRow
                  key={field.key}
                  field={field}
                  index={index}
                  totalCount={allFields.length}
                  isOmitted={
                    omittedRows.has(field.key) ||
                    (!hasDataForAnyProperty(field.key) &&
                      !manuallyEnabledRows.has(field.key))
                  }
                  hasData={hasDataForAnyProperty(field.key)}
                  isManuallyEnabled={manuallyEnabledRows.has(field.key)}
                  onToggle={handleFieldToggle(
                    field.key,
                    hasDataForAnyProperty(field.key),
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
