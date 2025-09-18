import { create } from 'zustand';

import type { Report, CompareReport } from '../schemas';

import { withDevtools } from './middleware/devtools';
import { persistSafe } from './middleware/persistSafe';
import { withResettable } from './middleware/resettable';

export type ReportsState = {
  // Reports data
  reports: Report[];
  reportsLoading: boolean;
  reportsError: string | null;

  // Compare reports data
  compareReports: CompareReport[];
  compareReportsLoading: boolean;
  compareReportsError: string | null;

  // Actions
  setReports: (reports: Report[]) => void;
  setReportsLoading: (loading: boolean) => void;
  setReportsError: (error: string | null) => void;

  setCompareReports: (reports: CompareReport[]) => void;
  setCompareReportsLoading: (loading: boolean) => void;
  setCompareReportsError: (error: string | null) => void;

  // Async actions (will be implemented with hooks)
  refreshReports: () => Promise<void>;
  refreshCompareReports: () => Promise<void>;

  reset: () => void; // Added by withResettable
};

const initialState = () => ({
  reports: [],
  reportsLoading: false,
  reportsError: null,
  compareReports: [],
  compareReportsLoading: false,
  compareReportsError: null,
});

const arraysShallowEqual = <T,>(a: T[], b: T[]) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
};

const baseCreator: import('zustand').StateCreator<ReportsState> = (set) => ({
  ...initialState(),

  setReports: (reports) =>
    set((state) => (arraysShallowEqual(state.reports, reports) ? state : { reports })),
  setReportsLoading: (loading) =>
    set((state) => (state.reportsLoading === loading ? state : { reportsLoading: loading })),
  setReportsError: (error) =>
    set((state) => (state.reportsError === error ? state : { reportsError: error })),

  setCompareReports: (reports) =>
    set((state) => (arraysShallowEqual(state.compareReports, reports) ? state : { compareReports: reports })),
  setCompareReportsLoading: (loading) =>
    set((state) => (state.compareReportsLoading === loading ? state : { compareReportsLoading: loading })),
  setCompareReportsError: (error) =>
    set((state) => (state.compareReportsError === error ? state : { compareReportsError: error })),

  // Async actions will be implemented by hooks that use this store
  refreshReports: async () => {
    console.warn('refreshReports should be implemented by useReportsData hook');
    return Promise.resolve();
  },
  refreshCompareReports: async () => {
    console.warn('refreshCompareReports should be implemented by useReportsData hook');
    return Promise.resolve();
  },

  // placeholder; will be replaced by withResettable
  reset: () => {},
});

const withReset = withResettable<ReportsState>(
  baseCreator,
  (set, _get, _store) => ({
    ...initialState(),
    setReports: (reports) =>
      set((state) => (arraysShallowEqual(state.reports, reports) ? state : { reports })),
    setReportsLoading: (loading) =>
      set((state) => (state.reportsLoading === loading ? state : { reportsLoading: loading })),
    setReportsError: (error) =>
      set((state) => (state.reportsError === error ? state : { reportsError: error })),
    setCompareReports: (reports) =>
      set((state) => (arraysShallowEqual(state.compareReports, reports) ? state : { compareReports: reports })),
    setCompareReportsLoading: (loading) =>
      set((state) => (state.compareReportsLoading === loading ? state : { compareReportsLoading: loading })),
    setCompareReportsError: (error) =>
      set((state) => (state.compareReportsError === error ? state : { compareReportsError: error })),
    refreshReports: async () => Promise.resolve(),
    refreshCompareReports: async () => Promise.resolve(),
    reset: () => {},
  })
) as unknown as import('zustand').StateCreator<ReportsState>;

const withPersist = persistSafe<ReportsState>(withReset, {
  name: 'reports-store',
  version: 1,
  storage: localStorage,
  partialize: (state: ReportsState) => ({
    // Only persist reports data (not loading states)
    reports: state.reports,
    compareReports: state.compareReports,
  }),
}) as unknown as import('zustand').StateCreator<ReportsState>;

const withDev = withDevtools<ReportsState>('reports')(withPersist) as unknown as import('zustand').StateCreator<ReportsState>;

export const useReportsStore = create<ReportsState>()(withDev);
