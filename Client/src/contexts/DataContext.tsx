import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { apiRequest } from "../lib/api";

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

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  reports_available: number;
  created_at: string | null;
  is_active: boolean;
  has_subscription: boolean;
  subscription: any;
  has_preferences: boolean;
  is_agent: boolean;
  agent_id?: string;
  client_ids?: string;
}

interface UserPreferences {
  demographics?: any;
  financial_profile?: any;
  housing_preferences?: any;
  location_preferences?: any;
  lifestyle_preferences?: any;
  behavioral_patterns?: any;
  real_estate?: any;
  agent_preferences?: any;
  values?: any;
  emotional_signals?: any;
  report_customization?: any;
  [key: string]: any;
}

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  propertyAddress?: string;
  messages: ChatMessage[];
  createdAt: Date;
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

  // User Profile data
  userProfile: UserProfile | null;
  userProfileLoading: boolean;
  userProfileError: string | null;
  refreshUserProfile: () => Promise<void>;

  // User Preferences data
  userPreferences: UserPreferences | null;
  preferencesLoading: boolean;
  preferencesError: string | null;
  refreshUserPreferences: () => Promise<void>;

  // Chat data
  chats: Chat[];
  chatsLoading: boolean;
  chatsError: string | null;
  refreshChats: () => Promise<void>;

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
  const [compareReportsError, setCompareReportsError] = useState<string | null>(
    null
  );

  // Billing Info state
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  // User Profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  const [userProfileError, setUserProfileError] = useState<string | null>(null);

  // User Preferences state
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  // Chat data state
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);

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
        throw new Error(json.error || "Failed to fetch reports");
      }
    } catch (err) {
      console.error("Failed to fetch reports", err);
      setReportsError(
        err instanceof Error ? err.message : "Failed to fetch reports"
      );
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
        throw new Error(json.error || "Failed to fetch compare reports");
      }
    } catch (err) {
      console.error("Failed to fetch compare reports", err);
      setCompareReportsError(
        err instanceof Error ? err.message : "Failed to fetch compare reports"
      );
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
        throw new Error(
          response.error || "Failed to fetch billing information"
        );
      }
    } catch (error) {
      console.error("Failed to fetch billing info:", error);
      setBillingError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setBillingLoading(false);
    }
  };

  // Fetch User Profile - using exact same pattern as UserProfilePage.tsx
  const fetchUserProfile = async () => {
    const idToken = localStorage.getItem("id_token");
    if (!idToken) return; // Don't fetch if not authenticated

    try {
      setUserProfileLoading(true);
      setUserProfileError(null);

      const response = await apiRequest<UserProfile>("/api/v1/user/profile");

      if (response.success && response.data) {
        setUserProfile(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUserProfileError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setUserProfileLoading(false);
    }
  };

  // Fetch User Preferences - using exact same pattern as PersonalizationPage.tsx
  const fetchUserPreferences = async () => {
    const idToken = localStorage.getItem("id_token");
    if (!idToken) return; // Don't fetch if not authenticated

    try {
      setPreferencesLoading(true);
      setPreferencesError(null);

      const response = await apiRequest("/api/v1/preferences/preferences", {
        method: "GET",
      });

      if (response.preferences) {
        setUserPreferences(response.preferences);
      } else {
        throw new Error("Failed to fetch user preferences");
      }
    } catch (error) {
      console.error("Failed to fetch user preferences:", error);
      setPreferencesError(
        error instanceof Error
          ? error.message
          : "Failed to fetch user preferences"
      );
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Fetch Chat Data - using exact same pattern as AIAssistant.tsx
  const fetchChats = async () => {
    const idToken = localStorage.getItem("id_token");
    if (!idToken) return; // Don't fetch if not authenticated

    try {
      setChatsLoading(true);
      setChatsError(null);

      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

      const response = await fetch(`${baseUrl}/api/v1/report/almostall`, {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      const json = await response.json();

      if (json.success && json.reports) {
        // Format address the same way as AIAssistant
        const formatAddress = (address: string) => {
          const formattedAddress = address.replace(/_/g, " ");
          return formattedAddress
            .substring(0, formattedAddress.length - 18)
            .trim();
        };

        const newChats: Chat[] = json.reports.map((report: any) => ({
          id: report.id,
          title: report.address
            ? formatAddress(report.address)
            : `Report ${report.id}`,
          propertyAddress: report.address,
          messages: [], // Start with empty messages - will be loaded when chat is selected
          createdAt: new Date(
            report.generatedAt ? report.generatedAt * 1000 : Date.now()
          ),
        }));

        setChats(newChats);
      } else {
        throw new Error(json.error || "Failed to fetch chat data");
      }
    } catch (error) {
      console.error("Failed to fetch chat data:", error);
      setChatsError(
        error instanceof Error ? error.message : "Failed to fetch chat data"
      );
    } finally {
      setChatsLoading(false);
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

  const refreshUserProfile = useCallback(async () => {
    await fetchUserProfile();
  }, []);

  const refreshUserPreferences = useCallback(async () => {
    await fetchUserPreferences();
  }, []);

  const refreshChats = useCallback(async () => {
    await fetchChats();
  }, []);

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchReports(),
      fetchCompareReports(),
      fetchBillingInfo(),
      fetchUserProfile(),
      fetchUserPreferences(),
      fetchChats(),
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
      if (e.key === "id_token") {
        if (e.newValue) {
          // User logged in, fetch data
          refreshAllData();
        } else {
          // User logged out, clear data
          setReports([]);
          setCompareReports([]);
          setBillingInfo(null);
          setUserProfile(null);
          setUserPreferences(null);
          setChats([]);
          setReportsError(null);
          setCompareReportsError(null);
          setBillingError(null);
          setUserProfileError(null);
          setPreferencesError(null);
          setChatsError(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Listen for report generation events to refresh reports data
  useEffect(() => {
    const handleReportGenerated = () => {
      console.log("reportGenerated event received, refreshing reports data.");
      refreshReports();
      refreshCompareReports(); // Also refresh compare reports as they might be affected
    };

    window.addEventListener("reportGenerated", handleReportGenerated);
    return () =>
      window.removeEventListener("reportGenerated", handleReportGenerated);
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
    userProfile,
    userProfileLoading,
    userProfileError,
    refreshUserProfile,
    userPreferences,
    preferencesLoading,
    preferencesError,
    refreshUserPreferences,
    chats,
    chatsLoading,
    chatsError,
    refreshChats,
    refreshAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
