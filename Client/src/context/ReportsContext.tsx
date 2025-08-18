import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  Report,
  CompareReport,
  BASE_URL,
  deserializeReport,
  deserializeCompareReport,
} from "./utils";
import {
  fetchJson,
  logHttp,
  createAuthHeaders,
  createAbortManager,
  isAbortError,
  getAuthToken,
  routeStartsWith,
} from "../lib/fetchUtils";
import { useAuthState } from "../lib/authUtils";

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
  const { user, authReady } = useAuthState();
  
  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  // Compare Reports state
  const [compareReports, setCompareReports] = useState<CompareReport[]>([]);
  const [compareReportsLoading, setCompareReportsLoading] = useState(false);
  const [compareReportsError, setCompareReportsError] = useState<string | null>(null);

  /* =========================
     Fetchers
     ========================= */

  const fetchReports = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;
    
    setReportsLoading(true);
    setReportsError(null);
    
    try {
      const json = await fetchJson<{ success: boolean; reports?: any[]; error?: string }>(
        `${BASE_URL}/api/v1/report/all`,
        { 
          method: "POST", 
          mode: "cors", 
          headers: createAuthHeaders(token), 
          credentials: "include",
          signal,
          acceptStatuses: [404]
        }
      );
      
      if (json?.success && json.reports) {
        setReports(json.reports.map(deserializeReport));
      } else if (json === undefined) {
        // 404 response, treat as empty
        setReports([]);
      } else {
        throw new Error(json?.error || "Failed to fetch reports");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        logHttp('reports', e);
        setReportsError(e?.message ?? "Failed to fetch reports");
        setReports([]); // Safe fallback
      }
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const fetchCompareReports = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;
    
    setCompareReportsLoading(true);
    setCompareReportsError(null);
    
    try {
      const json = await fetchJson<{ success: boolean; reports?: any[]; error?: string }>(
        `${BASE_URL}/api/v1/report/almostall`,
        { 
          method: "GET", 
          mode: "cors", 
          headers: createAuthHeaders(token), 
          credentials: "include",
          signal,
          acceptStatuses: [404] // Treat 404 as empty reports
        }
      );
      
      if (json?.success && json.reports) {
        setCompareReports(json.reports.map(deserializeCompareReport));
      } else if (json === undefined) {
        // 404 response, treat as empty
        setCompareReports([]);
      } else {
        throw new Error(json?.error || "Failed to fetch compare reports");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        logHttp('compare-reports', e);
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

  const refreshReports = useCallback(() => withAbort((s) => fetchReports(s)), [withAbort, fetchReports]);
  const refreshCompareReports = useCallback(() => withAbort((s) => fetchCompareReports(s)), [withAbort, fetchCompareReports]);

  /* =========================
     Effects
     ========================= */

  // Gate initial load based on auth readiness and relevant routes
  useEffect(() => {
    const reportsEnabled = authReady && !!user?.id && (
      routeStartsWith('/dashboard/reports') || 
      routeStartsWith('/reports') ||
      routeStartsWith('/dashboard') // Dashboard may show reports summary
    );
    
    const compareEnabled = authReady && !!user?.id && (
      routeStartsWith('/dashboard/compare') ||
      routeStartsWith('/compare')
    );
    
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
          const reportsEnabled = routeStartsWith('/dashboard/reports') || 
                                 routeStartsWith('/reports') ||
                                 routeStartsWith('/dashboard');
          const compareEnabled = routeStartsWith('/dashboard/compare') ||
                                routeStartsWith('/compare');
          
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
      const reportsEnabled = routeStartsWith('/dashboard/reports') || 
                             routeStartsWith('/reports') ||
                             routeStartsWith('/dashboard');
      const compareEnabled = routeStartsWith('/dashboard/compare') ||
                            routeStartsWith('/compare');
      
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

  const value = useMemo<ReportsContextType>(() => ({
    reports,
    reportsLoading,
    reportsError,
    refreshReports,
    
    compareReports,
    compareReportsLoading,
    compareReportsError,
    refreshCompareReports,
  }), [
    reports, reportsLoading, reportsError, refreshReports,
    compareReports, compareReportsLoading, compareReportsError, refreshCompareReports,
  ]);

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
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
  if (!ctx) throw new Error("useCompareReports must be used within a ReportsProvider");
  return {
    compareReports: ctx.compareReports,
    loading: ctx.compareReportsLoading,
    error: ctx.compareReportsError,
    refreshCompareReports: ctx.refreshCompareReports,
  };
}
