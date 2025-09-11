import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Report, CompareReport } from "../types";
import { deserializeReport, deserializeCompareReport } from "./utils";
import {
  createAbortManager,
  isAbortError,
  routeStartsWith,
  isAuthenticationError,
  handleAuthenticationError,
} from "../api/utils/index";
import { reportApi } from "../api";
import { useAuth } from "../app/providers";

/* =========================
   Types
   ========================= */

interface ReportsContextType {
  reports: Report[];
  reportsLoading: boolean;
  reportsError: string | null;
  refreshReports: () => Promise<void>;

  compareReports: CompareReport[];
  compareReportsLoading: boolean;
  compareReportsError: string | null;
  refreshCompareReports: () => Promise<void>;
}

/* =========================
   Context
   ========================= */

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

interface ReportsProviderProps {
  children: ReactNode;
}

export function ReportsProvider({ children }: ReportsProviderProps) {
  const { abortAll, withAbort } = useMemo(() => createAbortManager(), []);
  const { user, authReady } = useAuth();

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  // Compare Reports state
  const [compareReports, setCompareReports] = useState<CompareReport[]>([]);
  const [compareReportsLoading, setCompareReportsLoading] = useState(false);
  const [compareReportsError, setCompareReportsError] = useState<string | null>(
    null,
  );

  /* =========================
     Fetchers
     ========================= */

  const fetchReports = useCallback(async (_signal?: AbortSignal) => {
    setReportsLoading(true);
    setReportsError(null);

    try {
      const response = await reportApi.getAll();
      if (response.success && response.reports) {
        setReports(response.reports.map(deserializeReport));
      } else {
        setReports([]);
      }
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        if (isAuthenticationError(e)) {
          handleAuthenticationError(e);
          return;
        }
        console.error("Failed to fetch reports", e);
        setReportsError(e?.message ?? "Failed to fetch reports");
        setReports([]);
      }
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const fetchCompareReports = useCallback(async (_signal?: AbortSignal) => {
    setCompareReportsLoading(true);
    setCompareReportsError(null);

    try {
      // Using getAll for compare reports as well since almostall endpoint may not exist
      const response = await reportApi.getAll();
      if (response.success && response.reports) {
        setCompareReports(response.reports.map(deserializeCompareReport));
      } else {
        setCompareReports([]);
      }
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        if (isAuthenticationError(e)) {
          handleAuthenticationError(e);
          return; // Don't set error state, user will be redirected
        }
        console.error("Failed to fetch compare reports", e);
        setCompareReportsError(e?.message ?? "Failed to fetch compare reports");
        setCompareReports([]); // Safe fallback
      }
    } finally {
      setCompareReportsLoading(false);
    }
  }, []);

  /* =========================
     Public refresh functions
     ========================= */

  const refreshReports = useCallback(
    () => withAbort((s) => fetchReports(s)),
    [withAbort, fetchReports],
  );
  const refreshCompareReports = useCallback(
    () => withAbort((s) => fetchCompareReports(s)),
    [withAbort, fetchCompareReports],
  );

  /* =========================
     Effects
     ========================= */

  // Gate initial load based on auth readiness and relevant routes
  useEffect(() => {
    const reportsEnabled =
      authReady &&
      !!user?.id &&
      (routeStartsWith("/reports") || routeStartsWith("/")); // Dashboard may show reports summary

    const compareEnabled =
      authReady && !!user?.id && routeStartsWith("/compare");

    if (reportsEnabled) {
      refreshReports();
    }

    if (compareEnabled) {
      refreshCompareReports();
    }
  }, [authReady, user?.id, refreshReports, refreshCompareReports]);

  // Cross-tab auth changes - only refresh if on relevant routes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "id_token") {
        if (e.newValue) {
          // Only refresh if on relevant routes
          const reportsEnabled =
            routeStartsWith("/reports") || routeStartsWith("/");
          const compareEnabled = routeStartsWith("/compare");

          if (reportsEnabled) refreshReports();
          if (compareEnabled) refreshCompareReports();
        } else {
          // Clear everything
          setReports([]);
          setCompareReports([]);
          setReportsError(null);
          setCompareReportsError(null);
          abortAll();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshReports, refreshCompareReports, abortAll]);

  // Listen for report generation events - only refresh if on relevant routes
  useEffect(() => {
    const handler = () => {
      const reportsEnabled =
        routeStartsWith("/reports") || routeStartsWith("/");
      const compareEnabled = routeStartsWith("/compare");

      if (reportsEnabled) refreshReports();
      if (compareEnabled) refreshCompareReports();
    };

    window.addEventListener("reportGenerated", handler);
    return () => window.removeEventListener("reportGenerated", handler);
  }, [refreshReports, refreshCompareReports]);

  // Cleanup on unmount
  useEffect(() => () => abortAll(), [abortAll]);

  /* =========================
     Memoized value
     ========================= */

  const value = useMemo<ReportsContextType>(
    () => ({
      reports,
      reportsLoading,
      reportsError,
      refreshReports,

      compareReports,
      compareReportsLoading,
      compareReportsError,
      refreshCompareReports,
    }),
    [
      reports,
      reportsLoading,
      reportsError,
      refreshReports,
      compareReports,
      compareReportsLoading,
      compareReportsError,
      refreshCompareReports,
    ],
  );

  return (
    <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
  );
}

/* =========================
   Hooks
   ========================= */

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error("useReports must be used within a ReportsProvider");
  return {
    reports: ctx.reports,
    loading: ctx.reportsLoading,
    error: ctx.reportsError,
    refreshReports: ctx.refreshReports,
  };
}

export function useCompareReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx)
    throw new Error("useCompareReports must be used within a ReportsProvider");
  return {
    compareReports: ctx.compareReports,
    loading: ctx.compareReportsLoading,
    error: ctx.compareReportsError,
    refreshCompareReports: ctx.refreshCompareReports,
  };
}
