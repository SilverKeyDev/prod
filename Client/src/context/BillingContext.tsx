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
  BillingInfo,
  getIdToken,
  apiRequest,
} from "./utils";

/* =========================
   Types
   ========================= */

interface BillingContextType {
  billingInfo: BillingInfo | null;
  billingLoading: boolean;
  billingError: string | null;
  refreshBillingInfo: () => Promise<void>;
}

/* =========================
   Context
   ========================= */

const BillingContext = createContext<BillingContextType | undefined>(undefined);

interface BillingProviderProps {
  children: ReactNode;
}

export function BillingProvider({ children }: BillingProviderProps) {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  /* =========================
     Fetcher
     ========================= */

  const fetchBillingInfo = useCallback(async () => {
    const token = getIdToken();
    if (!token) return;

    setBillingLoading(true);
    setBillingError(null);

    try {
      const billingData = await apiRequest<BillingInfo>(
        "/api/v1/user/billing-info"
      );
      setBillingInfo(billingData);
    } catch (e: any) {
      console.error("Failed to fetch billing info:", e);
      setBillingError(e?.message ?? "Failed to fetch billing information");
    } finally {
      setBillingLoading(false);
    }
  }, []);

  /* =========================
     Public refresh function
     ========================= */

  const refreshBillingInfo = useCallback(
    () => fetchBillingInfo(),
    [fetchBillingInfo]
  );

  /* =========================
     Effects
     ========================= */

  // Initial load when authenticated
  useEffect(() => {
    const token = getIdToken();
    if (token) {
      refreshBillingInfo();
    }
  }, [refreshBillingInfo]);

  // Cross-tab auth changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "id_token") {
        if (e.newValue) {
          refreshBillingInfo();
        } else {
          // Clear everything
          setBillingInfo(null);
          setBillingError(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshBillingInfo]);

  /* =========================
     Memoized value
     ========================= */

  const value = useMemo<BillingContextType>(
    () => ({
      billingInfo,
      billingLoading,
      billingError,
      refreshBillingInfo,
    }),
    [billingInfo, billingLoading, billingError, refreshBillingInfo]
  );

  return (
    <BillingContext.Provider value={value}>{children}</BillingContext.Provider>
  );
}

/* =========================
   Hook
   ========================= */

export function useBilling() {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling must be used within a BillingProvider");
  return {
    billingInfo: ctx.billingInfo,
    loading: ctx.billingLoading,
    error: ctx.billingError,
    refreshBillingInfo: ctx.refreshBillingInfo,
  };
}
