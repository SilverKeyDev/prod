import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiRequest } from '../lib/api';

// Types
interface Report {
  id: string;
  address: string;
  generatedAt: Date;
  status: "completed" | "generating" | "error";
  pdfUrl?: string | null;
  s3Key?: string | null;
}

interface CompareReport {
  id: string;
  address: string;
  status: "generating" | "completed" | "error";
  pdfUrl?: string | null;
  s3Key?: string | null;
  // Optional fields for compatibility (unused but may be in API response)
  price?: number;
  squareFootage?: number;
  yearBuilt?: number;
  propertyType?: string;
  estimatedValue?: number;
  neighborhoodScore?: number;
  schoolScore?: number;
}

interface BillingInfo {
  subscription: {
    status: string;
    plan_id: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    reports_limit: number;
    stripe_subscription_id: string | null;
    plan: {
      name: string;
      price: number;
      interval: string;
    };
  } | null;
  usage: {
    reports_available: number;
    reports_used: number;
    reports_limit: number;
    reports_generated: number;
  };
  has_active_subscription: boolean;
}

interface DataContextType {
  // Past Reports data
  reports: Report[];
  reportsLoading: boolean;
  reportsError: string | null;
  refreshReports: () => Promise<void>;
  
  // Compare Reports data
  compareReports: CompareReport[];
  compareReportsLoading: boolean;
  compareReportsError: string | null;
  refreshCompareReports: () => Promise<void>;
  
  // Billing Info data
  billingInfo: BillingInfo | null;
  billingLoading: boolean;
  billingError: string | null;
  refreshBillingInfo: () => Promise<void>;
  
  // Global refresh
  refreshAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  // Past Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  
  // Compare Reports state
  const [compareReports, setCompareReports] = useState<CompareReport[]>([]);
  const [compareReportsLoading, setCompareReportsLoading] = useState(false);
  const [compareReportsError, setCompareReportsError] = useState<string | null>(null);
  
  // Billing Info state
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  // Fetch Past Reports - using exact same pattern as PastReports.tsx
  const fetchReports = async () => {
    const idToken = localStorage.getItem("id_token");
    if (!idToken) return; // Don't fetch if not authenticated
    
    try {
      setReportsLoading(true);
      setReportsError(null);
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      
      const res = await fetch(`${baseUrl}/api/v1/report/all`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        credentials: "include",
      });
      
      const json = await res.json();
      
      if (json.success) {
        const parsed: Report[] = json.reports.map((r: any) => ({
          id: r.id,
          address: r.address,
          status: r.status,
          pdfUrl: r.pdfUrl ?? null,
          s3Key: r.s3Key ?? null,
          generatedAt: new Date(r.generatedAt * 1000),
        }));
        setReports(parsed);
      } else {
        throw new Error(json.error || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error("Failed to fetch reports", err);
      setReportsError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setReportsLoading(false);
    }
  };

  // Fetch Compare Reports - using exact same pattern as CompareReportsPage.tsx
  const fetchCompareReports = async () => {
    const idToken = localStorage.getItem("id_token");
    if (!idToken) return; // Don't fetch if not authenticated
    
    try {
      setCompareReportsLoading(true);
      setCompareReportsError(null);
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      
      const res = await fetch(`${baseUrl}/api/v1/report/almostall`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        credentials: "include",
      });
      
      const json = await res.json();

      if (json.success) {
        const parsed = json.reports.map((r: any) => ({
          id: r.id,
          address: r.address,
          status: r.status,
          pdfUrl: r.pdfUrl ?? null,
          s3Key: r.s3Key ?? null,
        }));
        setCompareReports(parsed);
      } else {
        throw new Error(json.error || 'Failed to fetch compare reports');
      }
    } catch (err) {
      console.error("Failed to fetch compare reports", err);
      setCompareReportsError(err instanceof Error ? err.message : 'Failed to fetch compare reports');
    } finally {
      setCompareReportsLoading(false);
    }
  };

  // Fetch Billing Info - using exact same pattern as Subscription.tsx
  const fetchBillingInfo = async () => {
    const idToken = localStorage.getItem("id_token");
    if (!idToken) return; // Don't fetch if not authenticated
    
    try {
      setBillingLoading(true);
      setBillingError(null);
      
      const response = await apiRequest<BillingInfo>(
        "/api/v1/user/billing-info"
      );
      
      if (response.success && response.data) {
        setBillingInfo(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch billing information');
      }
    } catch (error) {
      console.error("Failed to fetch billing info:", error);
      setBillingError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setBillingLoading(false);
    }
  };

  // Refresh functions - wrapped with useCallback to prevent unnecessary re-renders
  const refreshReports = useCallback(async () => {
    await fetchReports();
  }, []);

  const refreshCompareReports = useCallback(async () => {
    await fetchCompareReports();
  }, []);

  const refreshBillingInfo = useCallback(async () => {
    await fetchBillingInfo();
  }, []);

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchReports(),
      fetchCompareReports(),
      fetchBillingInfo()
    ]);
  }, []);

  // Initial data loading when provider mounts
  useEffect(() => {
    const idToken = localStorage.getItem("id_token");
    if (idToken) {
      // Only preload if user is authenticated
      refreshAllData();
    }
  }, []);

  // Listen for authentication changes to refresh data
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'id_token') {
        if (e.newValue) {
          // User logged in, fetch data
          refreshAllData();
        } else {
          // User logged out, clear data
          setReports([]);
          setCompareReports([]);
          setBillingInfo(null);
          setReportsError(null);
          setCompareReportsError(null);
          setBillingError(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for report generation events to refresh reports data
  useEffect(() => {
    const handleReportGenerated = () => {
      console.log("reportGenerated event received, refreshing reports data.");
      refreshReports();
      refreshCompareReports(); // Also refresh compare reports as they might be affected
    };

    window.addEventListener("reportGenerated", handleReportGenerated);
    return () => window.removeEventListener("reportGenerated", handleReportGenerated);
  }, []);

  const value: DataContextType = {
    reports,
    reportsLoading,
    reportsError,
    refreshReports,
    compareReports,
    compareReportsLoading,
    compareReportsError,
    refreshCompareReports,
    billingInfo,
    billingLoading,
    billingError,
    refreshBillingInfo,
    refreshAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
