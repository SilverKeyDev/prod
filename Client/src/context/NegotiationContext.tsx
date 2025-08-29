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
  Strategy,
  OfferDraft,
  OfferHistory,
  BASE_URL,
} from "./utils";
import {
  fetchJson,
  createAuthHeaders,
  createAbortManager,
  isAbortError,
  getAuthToken,
  routeStartsWith,
} from "../lib/fetchUtils";
import { useAuth } from "./AuthContext";

/* =========================
   Types
   ========================= */

interface NegotiationContextType {
  offerDrafts: OfferDraft[];
  negotiationStrategies: Strategy[];
  offerHistory: OfferHistory[];
  currentOffer: OfferDraft | null;
  draftsLoading: boolean;
  strategiesLoading: boolean;
  historyLoading: boolean;
  draftsError: string | null;
  strategiesError: string | null;
  historyError: string | null;
  saveOfferDraft: (draft: Partial<OfferDraft>) => Promise<OfferDraft>;
  updateOfferDraft: (id: string, updates: Partial<OfferDraft>) => Promise<OfferDraft>;
  deleteOfferDraft: (id: string) => Promise<void>;
  submitOffer: (offerId: string) => Promise<void>;
  generateStrategy: (propertyAddress: string, strategyType: Strategy['strategy_type']) => Promise<Strategy>;
  refreshOfferDrafts: () => Promise<void>;
  refreshStrategies: () => Promise<void>;
  refreshOfferHistory: () => Promise<void>;
  setCurrentOffer: (offer: OfferDraft | null) => void;
}

/* =========================
   Context
   ========================= */

const NegotiationContext = createContext<NegotiationContextType | undefined>(undefined);

interface NegotiationProviderProps {
  children: ReactNode;
}

export function NegotiationProvider({ children }: NegotiationProviderProps) {
  const { abortAll, withAbort } = useMemo(() => createAbortManager(), []);
  const { user, authReady } = useAuth();

  // Offer drafts state
  const [offerDrafts, setOfferDrafts] = useState<OfferDraft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftsError, setDraftsError] = useState<string | null>(null);

  // Strategies state
  const [negotiationStrategies, setNegotiationStrategies] = useState<Strategy[]>([]);
  const [strategiesLoading, setStrategiesLoading] = useState(false);
  const [strategiesError, setStrategiesError] = useState<string | null>(null);

  // Offer history state
  const [offerHistory, setOfferHistory] = useState<OfferHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Current offer state
  const [currentOffer, setCurrentOffer] = useState<OfferDraft | null>(null);

  /* =========================
     Fetchers
     ========================= */

  const fetchOfferDrafts = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    setDraftsLoading(true);
    setDraftsError(null);

    try {
      const json = await fetchJson<{ success: boolean; drafts?: OfferDraft[]; error?: string }>(
        `${BASE_URL}/api/v1/negotiation/drafts`,
        { 
          method: "GET", 
          mode: "cors", 
          headers: createAuthHeaders(token), 
          credentials: "include",
          signal,
          acceptStatuses: [404]
        }
      );

      if (json.success && json.drafts) {
        setOfferDrafts(json.drafts.map(draft => ({
          ...draft,
          created_at: new Date(draft.created_at),
          updated_at: new Date(draft.updated_at),
        })));
      } else if (json === undefined) {
        // 404 response, treat as empty
        setOfferDrafts([]);
      } else {
        throw new Error(json.error || "Failed to fetch offer drafts");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to fetch offer drafts", e);
        setDraftsError(e?.message ?? "Failed to fetch offer drafts");
        setOfferDrafts([]); // Safe fallback
      }
    } finally {
      setDraftsLoading(false);
    }
  }, []);

  const fetchStrategies = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    setStrategiesLoading(true);
    setStrategiesError(null);

    try {
      const json = await fetchJson<{ success: boolean; strategies?: Strategy[]; error?: string }>(
        `${BASE_URL}/api/v1/negotiation/strategies`,
        { 
          method: "GET", 
          mode: "cors", 
          headers: createAuthHeaders(token), 
          credentials: "include",
          signal,
          acceptStatuses: [404]
        }
      );

      if (json.success && json.strategies) {
        setNegotiationStrategies(json.strategies.map(strategy => ({
          ...strategy,
          created_at: new Date(strategy.created_at),
        })));
      } else if (json === undefined) {
        // 404 response, treat as empty
        setNegotiationStrategies([]);
      } else {
        throw new Error(json.error || "Failed to fetch strategies");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to fetch strategies", e);
        setStrategiesError(e?.message ?? "Failed to fetch strategies");
        setNegotiationStrategies([]); // Safe fallback
      }
    } finally {
      setStrategiesLoading(false);
    }
  }, []);

  const fetchOfferHistory = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const json = await fetchJson<{ success: boolean; history?: OfferHistory[]; error?: string }>(
        `${BASE_URL}/api/v1/negotiation/history`,
        { 
          method: "GET", 
          mode: "cors", 
          headers: createAuthHeaders(token), 
          credentials: "include",
          signal,
          acceptStatuses: [404]
        }
      );

      if (json.success && json.history) {
        setOfferHistory(json.history.map(item => ({
          ...item,
          submitted_at: new Date(item.submitted_at),
          response_date: item.response_date ? new Date(item.response_date) : undefined,
        })));
      } else if (json === undefined) {
        // 404 response, treat as empty
        setOfferHistory([]);
      } else {
        throw new Error(json.error || "Failed to fetch offer history");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to fetch offer history", e);
        setHistoryError(e?.message ?? "Failed to fetch offer history");
        setOfferHistory([]); // Safe fallback
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const performSaveOfferDraft = useCallback(async (draft: Partial<OfferDraft>, signal?: AbortSignal): Promise<OfferDraft> => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token");

    try {
      const json = await fetchJson<{ success: boolean; draft?: OfferDraft; error?: string }>(
        `${BASE_URL}/api/v1/negotiation/drafts`,
        {
          method: "POST",
          mode: "cors",
          headers: createAuthHeaders(token),
          credentials: "include",
          body: JSON.stringify(draft),
          signal
        }
      );

      if (json.success && json.draft) {
        const newDraft = {
          ...json.draft,
          created_at: new Date(json.draft.created_at),
          updated_at: new Date(json.draft.updated_at),
        };
        setOfferDrafts(prev => [...prev, newDraft]);
        return newDraft;
      } else {
        throw new Error(json.error || "Failed to save offer draft");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to save offer draft", e);
        throw e;
      }
      throw e;
    }
  }, []);

  const performUpdateOfferDraft = useCallback(async (id: string, updates: Partial<OfferDraft>, signal?: AbortSignal): Promise<OfferDraft> => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token");

    try {
      const json = await fetchJson<{ success: boolean; draft?: OfferDraft; error?: string }>(
        `${BASE_URL}/api/v1/negotiation/drafts/${id}`,
        {
          method: "PUT",
          mode: "cors",
          headers: createAuthHeaders(token),
          credentials: "include",
          body: JSON.stringify(updates),
          signal
        }
      );

      if (json.success && json.draft) {
        const updatedDraft = {
          ...json.draft,
          created_at: new Date(json.draft.created_at),
          updated_at: new Date(json.draft.updated_at),
        };
        setOfferDrafts(prev => prev.map(draft => 
          draft.id === id ? updatedDraft : draft
        ));
        if (currentOffer?.id === id) {
          setCurrentOffer(updatedDraft);
        }
        return updatedDraft;
      } else {
        throw new Error(json.error || "Failed to update offer draft");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to update offer draft", e);
        throw e;
      }
      throw e;
    }
  }, [currentOffer]);

  const performDeleteOfferDraft = useCallback(async (id: string, signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const json = await fetchJson<{ success: boolean; error?: string }>(
        `${BASE_URL}/api/v1/negotiation/drafts/${id}`,
        {
          method: "DELETE",
          mode: "cors",
          headers: createAuthHeaders(token),
          credentials: "include",
          signal
        }
      );

      if (json.success) {
        setOfferDrafts(prev => prev.filter(draft => draft.id !== id));
        if (currentOffer?.id === id) {
          setCurrentOffer(null);
        }
      } else {
        throw new Error(json.error || "Failed to delete offer draft");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to delete offer draft", e);
        throw e;
      }
    }
  }, [currentOffer]);

  const performSubmitOffer = useCallback(async (offerId: string, signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const json = await fetchJson<{ success: boolean; error?: string }>(
        `${BASE_URL}/api/v1/negotiation/submit/${offerId}`,
        {
          method: "POST",
          mode: "cors",
          headers: createAuthHeaders(token),
          credentials: "include",
          signal
        }
      );

      if (json.success) {
        // Update the draft status to submitted
        setOfferDrafts(prev => prev.map(draft => 
          draft.id === offerId 
            ? { ...draft, status: 'submitted' as const, updated_at: new Date() }
            : draft
        ));
        if (currentOffer?.id === offerId) {
          setCurrentOffer(prev => prev ? { ...prev, status: 'submitted', updated_at: new Date() } : null);
        }
        // Refresh offer history to get the new submission
        refreshOfferHistory();
      } else {
        throw new Error(json.error || "Failed to submit offer");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to submit offer", e);
        throw e;
      }
    }
  }, [currentOffer]);

  const performGenerateStrategy = useCallback(async (propertyAddress: string, strategyType: Strategy['strategy_type'], signal?: AbortSignal): Promise<Strategy> => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token");

    setStrategiesLoading(true);
    setStrategiesError(null);

    try {
      const json = await fetchJson<{ success: boolean; strategy?: Strategy; error?: string }>(
        `${BASE_URL}/api/v1/negotiation/generate-strategy`,
        {
          method: "POST",
          mode: "cors",
          headers: createAuthHeaders(token),
          credentials: "include",
          body: JSON.stringify({ property_address: propertyAddress, strategy_type: strategyType }),
          signal
        }
      );

      if (json.success && json.strategy) {
        const newStrategy = {
          ...json.strategy,
          created_at: new Date(json.strategy.created_at),
        };
        setNegotiationStrategies(prev => [...prev, newStrategy]);
        return newStrategy;
      } else {
        throw new Error(json.error || "Failed to generate strategy");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to generate strategy", e);
        setStrategiesError(e?.message ?? "Failed to generate strategy");
        throw e;
      }
      throw e;
    } finally {
      setStrategiesLoading(false);
    }
  }, []);

  /* =========================
     Public functions
     ========================= */

  const saveOfferDraft = useCallback((draft: Partial<OfferDraft>) => 
    withAbort((s) => performSaveOfferDraft(draft, s)), 
    [withAbort, performSaveOfferDraft]
  );

  const updateOfferDraft = useCallback((id: string, updates: Partial<OfferDraft>) => 
    withAbort((s) => performUpdateOfferDraft(id, updates, s)), 
    [withAbort, performUpdateOfferDraft]
  );

  const deleteOfferDraft = useCallback((id: string) => 
    withAbort((s) => performDeleteOfferDraft(id, s)), 
    [withAbort, performDeleteOfferDraft]
  );

  const submitOffer = useCallback((offerId: string) => 
    withAbort((s) => performSubmitOffer(offerId, s)), 
    [withAbort, performSubmitOffer]
  );

  const generateStrategy = useCallback((propertyAddress: string, strategyType: Strategy['strategy_type']) => 
    withAbort((s) => performGenerateStrategy(propertyAddress, strategyType, s)), 
    [withAbort, performGenerateStrategy]
  );

  const refreshOfferDrafts = useCallback(() => 
    withAbort((s) => fetchOfferDrafts(s)), 
    [withAbort, fetchOfferDrafts]
  );

  const refreshStrategies = useCallback(() => 
    withAbort((s) => fetchStrategies(s)), 
    [withAbort, fetchStrategies]
  );

  const refreshOfferHistory = useCallback(() => 
    withAbort((s) => fetchOfferHistory(s)), 
    [withAbort, fetchOfferHistory]
  );

  /* =========================
     Effects
     ========================= */

  // Gate initial load based on auth readiness and relevant routes
  useEffect(() => {
    const enabled = authReady && !!user?.id && (
      routeStartsWith('/negotiation') ||
      routeStartsWith('/offers')
    );
    
    if (enabled) {
      refreshStrategies();
      refreshOfferDrafts();
      refreshOfferHistory();
    }
  }, [authReady, user?.id, refreshStrategies, refreshOfferDrafts, refreshOfferHistory]);

  // Cross-tab auth changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "id_token") {
        if (e.newValue) {
          refreshOfferDrafts();
          refreshStrategies();
          refreshOfferHistory();
        } else {
          // Clear everything
          setOfferDrafts([]);
          setNegotiationStrategies([]);
          setOfferHistory([]);
          setCurrentOffer(null);
          setDraftsError(null);
          setStrategiesError(null);
          setHistoryError(null);
          abortAll();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshOfferDrafts, refreshStrategies, refreshOfferHistory, abortAll]);

  // Cleanup on unmount
  useEffect(() => () => abortAll(), [abortAll]);

  /* =========================
     Memoized value
     ========================= */

  const value = useMemo<NegotiationContextType>(() => ({
    offerDrafts,
    negotiationStrategies,
    offerHistory,
    currentOffer,
    draftsLoading,
    strategiesLoading,
    historyLoading,
    draftsError,
    strategiesError,
    historyError,
    saveOfferDraft,
    updateOfferDraft,
    deleteOfferDraft,
    submitOffer,
    generateStrategy,
    refreshOfferDrafts,
    refreshStrategies,
    refreshOfferHistory,
    setCurrentOffer,
  }), [
    offerDrafts, negotiationStrategies, offerHistory, currentOffer,
    draftsLoading, strategiesLoading, historyLoading,
    draftsError, strategiesError, historyError,
    saveOfferDraft, updateOfferDraft, deleteOfferDraft,
    submitOffer, generateStrategy, refreshOfferDrafts,
    refreshStrategies, refreshOfferHistory,
  ]);

  return <NegotiationContext.Provider value={value}>{children}</NegotiationContext.Provider>;
}

/* =========================
   Hook
   ========================= */

export function useNegotiation() {
  const ctx = useContext(NegotiationContext);
  if (!ctx) throw new Error("useNegotiation must be used within a NegotiationProvider");
  return ctx;
}
