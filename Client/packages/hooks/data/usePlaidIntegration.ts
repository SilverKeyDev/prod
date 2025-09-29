/**
 * Plaid Integration Hook
 * Provides easy access to Plaid functionality throughout the app
 * Consolidates store integration with data hooks for easy access
 */

import { useEffect, useCallback } from "react";
import { usePlaidStore } from "../../store/plaid.slice";
import {
  usePlaidItems,
  usePlaidAssetReports,
  usePlaidStatements,
} from "./usePlaid";

/**
 * Main hook for Plaid integration
 * Combines store integration with data hooks for easy access
 */
export function usePlaidIntegration() {
  // Get data from TanStack Query hooks
  const { plaidItems, plaidItemsLoading, plaidItemsError } = usePlaidItems();
  const { assetReports, assetReportsLoading, assetReportsError } =
    usePlaidAssetReports();
  const { statements, statementsLoading, statementsError } =
    usePlaidStatements();

  // Get store setters using individual selectors to avoid object recreation
  const setPlaidItems = usePlaidStore((state) => state.setPlaidItems);
  const setAssetReports = usePlaidStore((state) => state.setAssetReports);
  const setStatements = usePlaidStore((state) => state.setStatements);
  const setPlaidItemsLoading = usePlaidStore(
    (state) => state.setPlaidItemsLoading,
  );
  const setAssetReportsLoading = usePlaidStore(
    (state) => state.setAssetReportsLoading,
  );
  const setStatementsLoading = usePlaidStore(
    (state) => state.setStatementsLoading,
  );
  const setPlaidItemsError = usePlaidStore((state) => state.setPlaidItemsError);
  const setAssetReportsError = usePlaidStore(
    (state) => state.setAssetReportsError,
  );
  const setStatementsError = usePlaidStore((state) => state.setStatementsError);

  // Memoize the setters to prevent infinite loops
  const memoizedSetPlaidItems = useCallback(setPlaidItems, [setPlaidItems]);
  const memoizedSetAssetReports = useCallback(setAssetReports, [
    setAssetReports,
  ]);
  const memoizedSetStatements = useCallback(setStatements, [setStatements]);
  const memoizedSetPlaidItemsLoading = useCallback(setPlaidItemsLoading, [
    setPlaidItemsLoading,
  ]);
  const memoizedSetAssetReportsLoading = useCallback(setAssetReportsLoading, [
    setAssetReportsLoading,
  ]);
  const memoizedSetStatementsLoading = useCallback(setStatementsLoading, [
    setStatementsLoading,
  ]);
  const memoizedSetPlaidItemsError = useCallback(setPlaidItemsError, [
    setPlaidItemsError,
  ]);
  const memoizedSetAssetReportsError = useCallback(setAssetReportsError, [
    setAssetReportsError,
  ]);
  const memoizedSetStatementsError = useCallback(setStatementsError, [
    setStatementsError,
  ]);

  // Sync TanStack Query state to Zustand store
  useEffect(() => {
    memoizedSetPlaidItems(plaidItems);
  }, [plaidItems, memoizedSetPlaidItems]);

  useEffect(() => {
    memoizedSetAssetReports(assetReports);
  }, [assetReports, memoizedSetAssetReports]);

  useEffect(() => {
    memoizedSetStatements(statements);
  }, [statements, memoizedSetStatements]);

  // Sync loading states
  useEffect(() => {
    memoizedSetPlaidItemsLoading(plaidItemsLoading);
  }, [plaidItemsLoading, memoizedSetPlaidItemsLoading]);

  useEffect(() => {
    memoizedSetAssetReportsLoading(assetReportsLoading);
  }, [assetReportsLoading, memoizedSetAssetReportsLoading]);

  useEffect(() => {
    memoizedSetStatementsLoading(statementsLoading);
  }, [statementsLoading, memoizedSetStatementsLoading]);

  // Sync error states
  useEffect(() => {
    memoizedSetPlaidItemsError(plaidItemsError);
  }, [plaidItemsError, memoizedSetPlaidItemsError]);

  useEffect(() => {
    memoizedSetAssetReportsError(assetReportsError);
  }, [assetReportsError, memoizedSetAssetReportsError]);

  useEffect(() => {
    memoizedSetStatementsError(statementsError);
  }, [statementsError, memoizedSetStatementsError]);

  // Return both state and actions for consolidated access
  // Note: We don't return the actions object to avoid infinite re-renders
  // Components should use usePlaidStoreActions() directly if they need actions
  return {
    state: usePlaidStoreState(),
  };
}

/**
 * Hook for checking if user has connected bank accounts
 */
export function useHasConnectedAccounts() {
  const { plaidItems } = usePlaidItems();
  return plaidItems.length > 0;
}

/**
 * Hook for getting the latest asset report
 */
export function useLatestAssetReport() {
  const { assetReports } = usePlaidAssetReports();
  return assetReports.length > 0 ? assetReports[assetReports.length - 1] : null;
}

/**
 * Hook for getting Plaid store state
 * Provides access to Zustand store state
 */
export function usePlaidStoreState() {
  // Selective subscriptions to avoid unnecessary re-renders
  const plaidItems = usePlaidStore((s) => s.plaidItems);
  const assetReports = usePlaidStore((s) => s.assetReports);
  const statements = usePlaidStore((s) => s.statements);
  const linkToken = usePlaidStore((s) => s.linkToken);

  const plaidItemsLoading = usePlaidStore((s) => s.plaidItemsLoading);
  const assetReportsLoading = usePlaidStore((s) => s.assetReportsLoading);
  const statementsLoading = usePlaidStore((s) => s.statementsLoading);
  const linkTokenLoading = usePlaidStore((s) => s.linkTokenLoading);

  const plaidItemsError = usePlaidStore((s) => s.plaidItemsError);
  const assetReportsError = usePlaidStore((s) => s.assetReportsError);
  const statementsError = usePlaidStore((s) => s.statementsError);
  const linkTokenError = usePlaidStore((s) => s.linkTokenError);

  const isLinkOpen = usePlaidStore((s) => s.isLinkOpen);
  const selectedItemId = usePlaidStore((s) => s.selectedItemId);
  const selectedReportToken = usePlaidStore((s) => s.selectedReportToken);

  return {
    // Data
    plaidItems,
    assetReports,
    statements,
    linkToken,

    // Loading states
    plaidItemsLoading,
    assetReportsLoading,
    statementsLoading,
    linkTokenLoading,

    // Error states
    plaidItemsError,
    assetReportsError,
    statementsError,
    linkTokenError,

    // UI state
    isLinkOpen,
    selectedItemId,
    selectedReportToken,
  };
}

/**
 * Hook for getting Plaid store actions
 * Provides access to Zustand store actions
 */
export function usePlaidStoreActions() {
  // Use individual selectors to avoid creating new objects on every render
  const setPlaidItems = usePlaidStore((state) => state.setPlaidItems);
  const setAssetReports = usePlaidStore((state) => state.setAssetReports);
  const setStatements = usePlaidStore((state) => state.setStatements);
  const setLinkToken = usePlaidStore((state) => state.setLinkToken);

  const setPlaidItemsLoading = usePlaidStore(
    (state) => state.setPlaidItemsLoading,
  );
  const setAssetReportsLoading = usePlaidStore(
    (state) => state.setAssetReportsLoading,
  );
  const setStatementsLoading = usePlaidStore(
    (state) => state.setStatementsLoading,
  );
  const setLinkTokenLoading = usePlaidStore(
    (state) => state.setLinkTokenLoading,
  );

  const setPlaidItemsError = usePlaidStore((state) => state.setPlaidItemsError);
  const setAssetReportsError = usePlaidStore(
    (state) => state.setAssetReportsError,
  );
  const setStatementsError = usePlaidStore((state) => state.setStatementsError);
  const setLinkTokenError = usePlaidStore((state) => state.setLinkTokenError);

  const setIsLinkOpen = usePlaidStore((state) => state.setIsLinkOpen);
  const setSelectedItemId = usePlaidStore((state) => state.setSelectedItemId);
  const setSelectedReportToken = usePlaidStore(
    (state) => state.setSelectedReportToken,
  );

  const addPlaidItem = usePlaidStore((state) => state.addPlaidItem);
  const updatePlaidItem = usePlaidStore((state) => state.updatePlaidItem);
  const removePlaidItem = usePlaidStore((state) => state.removePlaidItem);
  const addAssetReport = usePlaidStore((state) => state.addAssetReport);
  const updateAssetReport = usePlaidStore((state) => state.updateAssetReport);

  const reset = usePlaidStore((state) => state.reset);

  return {
    // Data setters
    setPlaidItems,
    setAssetReports,
    setStatements,
    setLinkToken,

    // Loading setters
    setPlaidItemsLoading,
    setAssetReportsLoading,
    setStatementsLoading,
    setLinkTokenLoading,

    // Error setters
    setPlaidItemsError,
    setAssetReportsError,
    setStatementsError,
    setLinkTokenError,

    // UI state
    setIsLinkOpen,
    setSelectedItemId,
    setSelectedReportToken,

    // Data management
    addPlaidItem,
    updatePlaidItem,
    removePlaidItem,
    addAssetReport,
    updateAssetReport,

    // Reset
    reset,
  };
}
