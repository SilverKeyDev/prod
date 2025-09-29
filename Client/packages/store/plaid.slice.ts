/**
 * Plaid Store
 * Manages Plaid Link integration state for proof of funds and bank statements
 */

import { create } from "zustand";
import type {
  PlaidItem,
  PlaidAssetReport,
  PlaidStatement,
  PlaidLinkToken,
} from "../schemas/plaid";

export interface PlaidState {
  // Data
  plaidItems: PlaidItem[];
  assetReports: PlaidAssetReport[];
  statements: PlaidStatement[];
  linkToken: PlaidLinkToken | null;

  // Loading states
  plaidItemsLoading: boolean;
  assetReportsLoading: boolean;
  statementsLoading: boolean;
  linkTokenLoading: boolean;

  // Error states
  plaidItemsError: string | null;
  assetReportsError: string | null;
  statementsError: string | null;
  linkTokenError: string | null;

  // UI state
  isLinkOpen: boolean;
  selectedItemId: string | null;
  selectedReportToken: string | null;

  // Actions - Data setters
  setPlaidItems: (items: PlaidItem[]) => void;
  setAssetReports: (reports: PlaidAssetReport[]) => void;
  setStatements: (statements: PlaidStatement[]) => void;
  setLinkToken: (token: PlaidLinkToken | null) => void;

  // Actions - Loading setters
  setPlaidItemsLoading: (loading: boolean) => void;
  setAssetReportsLoading: (loading: boolean) => void;
  setStatementsLoading: (loading: boolean) => void;
  setLinkTokenLoading: (loading: boolean) => void;

  // Actions - Error setters
  setPlaidItemsError: (error: string | null) => void;
  setAssetReportsError: (error: string | null) => void;
  setStatementsError: (error: string | null) => void;
  setLinkTokenError: (error: string | null) => void;

  // Actions - UI state
  setIsLinkOpen: (open: boolean) => void;
  setSelectedItemId: (itemId: string | null) => void;
  setSelectedReportToken: (token: string | null) => void;

  // Actions - Data management
  addPlaidItem: (item: PlaidItem) => void;
  updatePlaidItem: (itemId: string, updates: Partial<PlaidItem>) => void;
  removePlaidItem: (itemId: string) => void;

  addAssetReport: (report: PlaidAssetReport) => void;
  updateAssetReport: (
    token: string,
    updates: Partial<PlaidAssetReport>,
  ) => void;

  // Actions - Reset
  reset: () => void;
}

// Initial state
const initialState = (): PlaidState => ({
  // Data
  plaidItems: [],
  assetReports: [],
  statements: [],
  linkToken: null,

  // Loading states
  plaidItemsLoading: false,
  assetReportsLoading: false,
  statementsLoading: false,
  linkTokenLoading: false,

  // Error states
  plaidItemsError: null,
  assetReportsError: null,
  statementsError: null,
  linkTokenError: null,

  // UI state
  isLinkOpen: false,
  selectedItemId: null,
  selectedReportToken: null,

  // Actions - Data setters
  setPlaidItems: () => {},
  setAssetReports: () => {},
  setStatements: () => {},
  setLinkToken: () => {},

  // Actions - Loading setters
  setPlaidItemsLoading: () => {},
  setAssetReportsLoading: () => {},
  setStatementsLoading: () => {},
  setLinkTokenLoading: () => {},

  // Actions - Error setters
  setPlaidItemsError: () => {},
  setAssetReportsError: () => {},
  setStatementsError: () => {},
  setLinkTokenError: () => {},

  // Actions - UI state
  setIsLinkOpen: () => {},
  setSelectedItemId: () => {},
  setSelectedReportToken: () => {},

  // Actions - Data management
  addPlaidItem: () => {},
  updatePlaidItem: () => {},
  removePlaidItem: () => {},

  addAssetReport: () => {},
  updateAssetReport: () => {},

  // Reset method
  reset: () => {},
});

// Create the store with simplified configuration
export const usePlaidStore = create<PlaidState>((set, get) => ({
  ...initialState(),

  // Data setters
  setPlaidItems: (plaidItems: PlaidItem[]) => set({ plaidItems }),
  setAssetReports: (assetReports: PlaidAssetReport[]) => set({ assetReports }),
  setStatements: (statements: PlaidStatement[]) => set({ statements }),
  setLinkToken: (linkToken: PlaidLinkToken | null) => set({ linkToken }),

  // Loading setters
  setPlaidItemsLoading: (plaidItemsLoading: boolean) =>
    set({ plaidItemsLoading }),
  setAssetReportsLoading: (assetReportsLoading: boolean) =>
    set({ assetReportsLoading }),
  setStatementsLoading: (statementsLoading: boolean) =>
    set({ statementsLoading }),
  setLinkTokenLoading: (linkTokenLoading: boolean) => set({ linkTokenLoading }),

  // Error setters
  setPlaidItemsError: (plaidItemsError: string | null) =>
    set({ plaidItemsError }),
  setAssetReportsError: (assetReportsError: string | null) =>
    set({ assetReportsError }),
  setStatementsError: (statementsError: string | null) =>
    set({ statementsError }),
  setLinkTokenError: (linkTokenError: string | null) => set({ linkTokenError }),

  // UI state
  setIsLinkOpen: (isLinkOpen: boolean) => set({ isLinkOpen }),
  setSelectedItemId: (selectedItemId: string | null) => set({ selectedItemId }),
  setSelectedReportToken: (selectedReportToken: string | null) =>
    set({ selectedReportToken }),

  // Data management
  addPlaidItem: (item: PlaidItem) => {
    const { plaidItems } = get();
    set({ plaidItems: [...plaidItems, item] });
  },

  updatePlaidItem: (itemId: string, updates: Partial<PlaidItem>) => {
    const { plaidItems } = get();
    set({
      plaidItems: plaidItems.map((item: PlaidItem) =>
        item.item_id === itemId ? { ...item, ...updates } : item,
      ),
    });
  },

  removePlaidItem: (itemId: string) => {
    const { plaidItems } = get();
    set({
      plaidItems: plaidItems.filter(
        (item: PlaidItem) => item.item_id !== itemId,
      ),
    });
  },

  addAssetReport: (report: PlaidAssetReport) => {
    const { assetReports } = get();
    set({ assetReports: [...assetReports, report] });
  },

  updateAssetReport: (token: string, updates: Partial<PlaidAssetReport>) => {
    const { assetReports } = get();
    set({
      assetReports: assetReports.map((report: PlaidAssetReport) =>
        report.asset_report_token === token
          ? { ...report, ...updates }
          : report,
      ),
    });
  },

  // Reset method
  reset: () => {
    set(initialState());
  },
}));
