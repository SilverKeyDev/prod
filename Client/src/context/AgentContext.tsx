import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import ClientIntelPage from "../pages/Onboard/ClientIntelPage.tsx";
import AgentConnection from "../pages/Onboard/AgentConnection.tsx";
import {
  Agent,
  UserProfile,
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

interface AgentContextType {
  assignedAgent: Agent | null;
  clientList: UserProfile[];
  agentSearchResults: Agent[];
  agentLoading: boolean;
  clientsLoading: boolean;
  searchLoading: boolean;
  agentError: string | null;
  clientsError: string | null;
  searchError: string | null;
  searchAgents: (query: string) => Promise<void>;
  assignAgent: (agentId: string) => Promise<void>;
  removeAgent: () => Promise<void>;
  refreshAgentData: () => Promise<void>;
  refreshClientList: () => Promise<void>;
  clearSearchResults: () => void;
  isAgent: () => boolean;
  getAgentConnectionComponent: () => JSX.Element | null;
}

/* =========================
   Context
   ========================= */

const AgentContext = createContext<AgentContextType | undefined>(undefined);

interface AgentProviderProps {
  children: ReactNode;
}

export function AgentProvider({ children }: AgentProviderProps) {
  const { abortAll, withAbort } = useMemo(() => createAbortManager(), []);
  const { user, authReady } = useAuth();

  // Agent state
  const [assignedAgent, setAssignedAgent] = useState<Agent | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);

  // Client list state (for agents)
  const [clientList, setClientList] = useState<UserProfile[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);

  // Search state
  const [agentSearchResults, setAgentSearchResults] = useState<Agent[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  /* =========================
     Fetchers
     ========================= */

  const fetchAssignedAgent = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    setAgentLoading(true);
    setAgentError(null);

    try {
      const json = await fetchJson<{ success: boolean; agent?: Agent; error?: string }>(
        `${BASE_URL}/api/v1/user/assigned-agent`,
        { 
          method: "GET", 
          mode: "cors", 
          headers: createAuthHeaders(token), 
          credentials: "include",
          signal,
          acceptStatuses: [404]
        }
      );

      if (json.success && json.agent) {
        setAssignedAgent(json.agent);
      } else if (json.success && !json.agent) {
        setAssignedAgent(null);
      } else if (json === undefined) {
        // 404 response, treat as no agent assigned
        setAssignedAgent(null);
      } else {
        throw new Error(json.error || "Failed to fetch assigned agent");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to fetch assigned agent", e);
        setAgentError(e?.message ?? "Failed to fetch assigned agent");
        setAssignedAgent(null); // Safe fallback
      }
    } finally {
      setAgentLoading(false);
    }
  }, []);

  const fetchClientList = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    setClientsLoading(true);
    setClientsError(null);

    try {
      const json = await fetchJson<{ success: boolean; clients?: UserProfile[]; error?: string }>(
        `${BASE_URL}/api/v1/agent/clients`,
        { 
          method: "GET", 
          mode: "cors", 
          headers: createAuthHeaders(token), 
          credentials: "include",
          signal,
          acceptStatuses: [404]
        }
      );

      if (json.success && json.clients) {
        setClientList(json.clients);
      } else if (json === undefined) {
        // 404 response, treat as empty
        setClientList([]);
      } else {
        throw new Error(json.error || "Failed to fetch client list");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to fetch client list", e);
        setClientsError(e?.message ?? "Failed to fetch client list");
        setClientList([]); // Safe fallback
      }
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const performAgentSearch = useCallback(async (query: string, signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    setSearchLoading(true);
    setSearchError(null);

    try {
      const json = await fetchJson<{ success: boolean; agents?: Agent[]; error?: string }>(
        `${BASE_URL}/api/v1/user/search-agents?q=${encodeURIComponent(query)}`,
        { 
          method: "GET", 
          mode: "cors", 
          headers: createAuthHeaders(token), 
          credentials: "include",
          signal
        }
      );

      if (json.success && json.agents) {
        setAgentSearchResults(json.agents);
      } else {
        throw new Error(json.error || "Failed to search agents");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to search agents", e);
        setSearchError(e?.message ?? "Failed to search agents");
      }
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const performAssignAgent = useCallback(async (agentId: string, signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    setAgentLoading(true);
    setAgentError(null);

    try {
      const json = await fetchJson<{ success: boolean; agent?: Agent; error?: string }>(
        `${BASE_URL}/api/v1/user/assign-agent`,
        {
          method: "POST",
          mode: "cors",
          headers: createAuthHeaders(token),
          credentials: "include",
          body: JSON.stringify({ agent_id: agentId }),
          signal
        }
      );

      if (json.success && json.agent) {
        setAssignedAgent(json.agent);
        // Clear search results after successful assignment
        setAgentSearchResults([]);
      } else {
        throw new Error(json.error || "Failed to assign agent");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to assign agent", e);
        setAgentError(e?.message ?? "Failed to assign agent");
      }
    } finally {
      setAgentLoading(false);
    }
  }, []);

  const performRemoveAgent = useCallback(async (signal?: AbortSignal) => {
    const token = getAuthToken();
    if (!token) return;

    setAgentLoading(true);
    setAgentError(null);

    try {
      const json = await fetchJson<{ success: boolean; error?: string }>(
        `${BASE_URL}/api/v1/user/remove-agent`,
        {
          method: "POST",
          mode: "cors",
          headers: createAuthHeaders(token),
          credentials: "include",
          signal
        }
      );

      if (json.success) {
        setAssignedAgent(null);
      } else {
        throw new Error(json.error || "Failed to remove agent");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to remove agent", e);
        setAgentError(e?.message ?? "Failed to remove agent");
      }
    } finally {
      setAgentLoading(false);
    }
  }, []);

  /* =========================
     Public functions
     ========================= */

  const searchAgents = useCallback((query: string) => 
    withAbort((s) => performAgentSearch(query, s)), 
    [withAbort, performAgentSearch]
  );

  const assignAgent = useCallback((agentId: string) => 
    withAbort((s) => performAssignAgent(agentId, s)), 
    [withAbort, performAssignAgent]
  );

  const removeAgent = useCallback(() => 
    withAbort((s) => performRemoveAgent(s)), 
    [withAbort, performRemoveAgent]
  );

  const refreshAgentData = useCallback(() => 
    withAbort((s) => fetchAssignedAgent(s)), 
    [withAbort, fetchAssignedAgent]
  );

  const refreshClientList = useCallback(() => 
    withAbort((s) => fetchClientList(s)), 
    [withAbort, fetchClientList]
  );

  const clearSearchResults = useCallback(() => {
    setAgentSearchResults([]);
    setSearchError(null);
  }, []);

  // Helper function to determine if user is an agent
  const isAgent = useCallback(() => {
    return clientList.length > 0 || user?.user_type === 'agent';
  }, [clientList.length, user?.user_type]);

  // Function to get the appropriate component based on user type
  const getAgentConnectionComponent = useCallback(() => {
    if (isAgent()) {
      // Agent sees Client Information
      return <ClientIntelPage />;
    } else {
      // Client sees Agent Connection
      return <AgentConnection />;
    }
  }, [isAgent]);

  /* =========================
     Effects
     ========================= */

  // Gate initial load based on auth readiness and relevant routes
  useEffect(() => {
    const enabled = authReady && !!user?.id && (
      routeStartsWith('/agent') ||
      routeStartsWith('/profile')
    );
    
    if (enabled) {
      refreshAgentData();
      refreshClientList();
    }
  }, [authReady, user?.id, refreshAgentData, refreshClientList]);

  // Cross-tab auth changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "id_token") {
        if (e.newValue) {
          refreshAgentData();
          refreshClientList();
        } else {
          // Clear everything
          setAssignedAgent(null);
          setClientList([]);
          setAgentSearchResults([]);
          setAgentError(null);
          setClientsError(null);
          setSearchError(null);
          abortAll();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshAgentData, refreshClientList, abortAll]);

  // Cleanup on unmount
  useEffect(() => () => abortAll(), [abortAll]);

  /* =========================
     Memoized value
     ========================= */

  const value = useMemo<AgentContextType>(() => ({
    assignedAgent,
    clientList,
    agentSearchResults,
    agentLoading,
    clientsLoading,
    searchLoading,
    agentError,
    clientsError,
    searchError,
    searchAgents,
    assignAgent,
    removeAgent,
    refreshAgentData,
    refreshClientList,
    clearSearchResults,
    isAgent,
    getAgentConnectionComponent,
  }), [
    assignedAgent, clientList, agentSearchResults,
    agentLoading, clientsLoading, searchLoading,
    agentError, clientsError, searchError,
    searchAgents, assignAgent, removeAgent,
    refreshAgentData, refreshClientList, clearSearchResults,
    isAgent, getAgentConnectionComponent,
  ]);

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

/* =========================
   Hook
   ========================= */

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used within an AgentProvider");
  return ctx;
}
