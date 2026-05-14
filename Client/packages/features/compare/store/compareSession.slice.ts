import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";

import { clearedRowsAfterCompareModalClose } from "./compareSessionModel";

export type CompareSessionState = {
  isCompareModalOpen: boolean;
  isManageRowsModalOpen: boolean;
  omittedRowKeys: string[];
  manuallyEnabledRowKeys: string[];
  setCompareModalOpen: (open: boolean) => void;
  setManageRowsModalOpen: (open: boolean) => void;
  setOmittedRowsFromSet: (rows: Set<string>) => void;
  setManuallyEnabledRowsFromSet: (rows: Set<string>) => void;
  resetCompareSession: () => void;
};

const initialSession = (): Pick<
  CompareSessionState,
  "isCompareModalOpen" | "isManageRowsModalOpen" | "omittedRowKeys" | "manuallyEnabledRowKeys"
> => ({
  isCompareModalOpen: false,
  isManageRowsModalOpen: false,
  omittedRowKeys: [],
  manuallyEnabledRowKeys: [],
});

const baseCreator: import("zustand").StateCreator<CompareSessionState> = (set) => ({
  ...initialSession(),

  setCompareModalOpen: (open) =>
    set((state) => {
      if (open) {
        if (state.isCompareModalOpen) return state;
        return { ...state, isCompareModalOpen: true };
      }
      if (
        !state.isCompareModalOpen &&
        !state.isManageRowsModalOpen &&
        state.omittedRowKeys.length === 0 &&
        state.manuallyEnabledRowKeys.length === 0
      ) {
        return state;
      }
      return {
        ...state,
        isCompareModalOpen: false,
        ...clearedRowsAfterCompareModalClose(),
      };
    }),

  setManageRowsModalOpen: (open) =>
    set((state) =>
      state.isManageRowsModalOpen === open ? state : { ...state, isManageRowsModalOpen: open }
    ),

  setOmittedRowsFromSet: (rows) =>
    set((state) => {
      const next = [...rows].sort();
      const prev = [...state.omittedRowKeys].sort();
      if (next.length === prev.length && next.every((k, i) => k === prev[i])) return state;
      return { ...state, omittedRowKeys: [...rows] };
    }),

  setManuallyEnabledRowsFromSet: (rows) =>
    set((state) => {
      const next = [...rows].sort();
      const prev = [...state.manuallyEnabledRowKeys].sort();
      if (next.length === prev.length && next.every((k, i) => k === prev[i])) return state;
      return { ...state, manuallyEnabledRowKeys: [...rows] };
    }),

  resetCompareSession: () => set(initialSession()),
});

const withDev = withDevtools<CompareSessionState>("compareSession")(
  baseCreator
) as unknown as import("zustand").StateCreator<CompareSessionState>;

export const useCompareSessionStore = create<CompareSessionState>()(withDev);
