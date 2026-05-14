/**
 * Pure helpers for compare session transitions (unit-tested without Zustand).
 */

export type CompareSessionRowSnapshot = {
  omittedRowKeys: string[];
  manuallyEnabledRowKeys: string[];
  isManageRowsModalOpen: boolean;
};

/** When the compare modal closes, row customization and manage-rows UI reset. */
export function clearedRowsAfterCompareModalClose(): CompareSessionRowSnapshot {
  return {
    omittedRowKeys: [],
    manuallyEnabledRowKeys: [],
    isManageRowsModalOpen: false,
  };
}
