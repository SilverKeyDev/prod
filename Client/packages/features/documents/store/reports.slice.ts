import { create } from "zustand";

import type { CompareReport, Report } from "packages/features/documents/types/reports";

export type ReportsState = {
  reports: Report[];
  reportsLoading: boolean;
  reportsError: string | null;
  compareReports: CompareReport[];
  compareReportsLoading: boolean;
  compareReportsError: string | null;
  setReports: (reports: Report[]) => void;
  setReportsLoading: (loading: boolean) => void;
  setReportsError: (error: string | null) => void;
  setCompareReports: (reports: CompareReport[]) => void;
  setCompareReportsLoading: (loading: boolean) => void;
  setCompareReportsError: (error: string | null) => void;
  refreshReports: () => Promise<void>;
  refreshCompareReports: () => Promise<void>;

  // Setters for integration hook to inject implementations (no getState)
  setRefreshReportsImpl: (fn: ReportsState["refreshReports"]) => void;
  setRefreshCompareReportsImpl: (fn: ReportsState["refreshCompareReports"]) => void;
};

export const useReportsStore = create<ReportsState>((set) => ({
  reports: [],
  reportsLoading: false,
  reportsError: null,
  compareReports: [],
  compareReportsLoading: false,
  compareReportsError: null,
  setReports: (reports) => set({ reports }),
  setReportsLoading: (reportsLoading) => set({ reportsLoading }),
  setReportsError: (reportsError) => set({ reportsError }),
  setCompareReports: (compareReports) => set({ compareReports }),
  setCompareReportsLoading: (compareReportsLoading) => set({ compareReportsLoading }),
  setCompareReportsError: (compareReportsError) => set({ compareReportsError }),
  refreshReports: () => Promise.resolve(),
  refreshCompareReports: () => Promise.resolve(),
  setRefreshReportsImpl: (fn) => set({ refreshReports: fn }),
  setRefreshCompareReportsImpl: (fn) => set({ refreshCompareReports: fn }),
}));
