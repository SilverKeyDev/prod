import { useEffect, useRef } from "react";

import { useReportsData } from "packages/features/documents/hooks/data/useReportsData";
import { useReportsStore } from "packages/features/documents/store";

/**
 * Hook that integrates useReportsData with useReportsStore
 * This replaces the ReportsContext functionality
 */
export function useReportsStoreIntegration() {
  const {
    reports,
    reportsLoading,
    reportsError,
    compareReports,
    compareReportsLoading,
    compareReportsError,
    refreshReports,
    refreshCompareReports,
  } = useReportsData();

  const {
    setReports,
    setReportsLoading,
    setReportsError,
    setCompareReports,
    setCompareReportsLoading,
    setCompareReportsError,
    setRefreshReportsImpl,
    setRefreshCompareReportsImpl,
  } = useReportsStore();

  // Prevent redundant updates by tracking last applied values
  const lastReportsRef = useRef<typeof reports>();
  const lastReportsLoadingRef = useRef<typeof reportsLoading>();
  const lastReportsErrorRef = useRef<typeof reportsError>();
  const lastCompareReportsRef = useRef<typeof compareReports>();
  const lastCompareReportsLoadingRef = useRef<typeof compareReportsLoading>();
  const lastCompareReportsErrorRef = useRef<typeof compareReportsError>();

  // Sync hook data with store
  useEffect(() => {
    if (lastReportsRef.current !== reports) {
      lastReportsRef.current = reports;
      setReports(reports);
    }
  }, [reports, setReports]);

  useEffect(() => {
    if (lastReportsLoadingRef.current !== reportsLoading) {
      lastReportsLoadingRef.current = reportsLoading;
      setReportsLoading(reportsLoading);
    }
  }, [reportsLoading, setReportsLoading]);

  useEffect(() => {
    if (lastReportsErrorRef.current !== reportsError) {
      lastReportsErrorRef.current = reportsError;
      setReportsError(reportsError);
    }
  }, [reportsError, setReportsError]);

  useEffect(() => {
    if (lastCompareReportsRef.current !== compareReports) {
      lastCompareReportsRef.current = compareReports;
      setCompareReports(compareReports);
    }
  }, [compareReports, setCompareReports]);

  useEffect(() => {
    if (lastCompareReportsLoadingRef.current !== compareReportsLoading) {
      lastCompareReportsLoadingRef.current = compareReportsLoading;
      setCompareReportsLoading(compareReportsLoading);
    }
  }, [compareReportsLoading, setCompareReportsLoading]);

  useEffect(() => {
    if (lastCompareReportsErrorRef.current !== compareReportsError) {
      lastCompareReportsErrorRef.current = compareReportsError;
      setCompareReportsError(compareReportsError);
    }
  }, [compareReportsError, setCompareReportsError]);

  // Override the store's placeholder methods with real implementations
  useEffect(() => {
    setRefreshReportsImpl(async () => {
      await refreshReports();
    });
    setRefreshCompareReportsImpl(async () => {
      await refreshCompareReports();
    });
  }, [refreshReports, refreshCompareReports, setRefreshReportsImpl, setRefreshCompareReportsImpl]);

  return {
    reports,
    reportsLoading,
    reportsError,
    compareReports,
    compareReportsLoading,
    compareReportsError,
    refreshReports,
    refreshCompareReports,
  };
}
