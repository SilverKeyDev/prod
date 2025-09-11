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
import { Agent, UserProfile } from "../types";
import {
  createAbortManager,
  isAbortError,
  routeStartsWith,
} from "../api/utils/index";
import { userApi } from "../api";
import { useAuth } from "../app/providers";

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

  const fetchAssignedAgent = useCallback(async () => {
    setAgentLoading(true);
    setAgentError(null);

    try {
      const response = await userApi.getAssignedAgent();
      if (response.success && response.data) {
        setAssignedAgent(response.data);
      } else {
        setAssignedAgent(null);
      }
    } catch (e: unknown) {
      if (!isAbortError(e)) {
        console.error("Failed to fetch assigned agent", e);
        const errorMessage = e instanceof Error ? e.message : "Failed to fetch assigned agent";
        setAgentError(errorMessage);
        setAssignedAgent(null); // Safe fallback
      }
    } finally {
      setAgentLoading(false);
    }
  }, []);

  const fetchClientList = useCallback(async () => {
    setClientsLoading(true);
    setClientsError(null);

    try {
      const response = await userApi.getClientList();
      if (response.success && response.clients) {
        setClientList(response.clients);
      } else {
        setClientList([]);
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

  const performAgentSearch = useCallback(
    async (query: string, _signal?: AbortSignal) => {
      setSearchLoading(true);
      setSearchError(null);

      try {
        const response = await userApi.searchAgents(query);
        if (response.success && response.agents) {
          setAgentSearchResults(response.agents);
        } else {
          setAgentSearchResults([]);
        }
      } catch (e: any) {
        if (!isAbortError(e)) {
          console.error("Failed to search agents", e);
          setSearchError(e?.message ?? "Failed to search agents");
        }
      } finally {
        setSearchLoading(false);
      }
    },
    []
  );

  const performAssignAgent = useCallback(
    async (agentId: string) => {
      setAgentLoading(true);
      setAgentError(null);

      try {
        const response = await userApi.assignAgent(agentId);
        if (response.success && response.agent) {
          setAssignedAgent(response.agent);
          // Clear search results after successful assignment
          setAgentSearchResults([]);
        } else {
          throw new Error(response.message || "Failed to assign agent");
        }
      } catch (e: any) {
        if (!isAbortError(e)) {
          console.error("Failed to assign agent", e);
          setAgentError(e?.message ?? "Failed to assign agent");
        }
      } finally {
        setAgentLoading(false);
      }
    },
    []
  );

  const performRemoveAgent = useCallback(async (_signal?: AbortSignal) => {
    setAgentLoading(true);
    setAgentError(null);

    try {
      const response = await userApi.removeAgent();
      if (response.success) {
        setAssignedAgent(null);
      } else {
        throw new Error(response.message || "Failed to remove agent");
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

  const searchAgents = useCallback(
    (query: string) => withAbort((s) => performAgentSearch(query, s)),
    [withAbort, performAgentSearch]
  );

  const assignAgent = useCallback(
    (agentId: string) => withAbort((s) => performAssignAgent(agentId, s)),
    [withAbort, performAssignAgent]
  );

  const removeAgent = useCallback(
    () => withAbort((s) => performRemoveAgent(s)),
    [withAbort, performRemoveAgent]
  );

  const refreshAgentData = useCallback(
    () => withAbort((s) => fetchAssignedAgent(s)),
    [withAbort, fetchAssignedAgent]
  );

  const refreshClientList = useCallback(
    () => withAbort((s) => fetchClientList(s)),
    [withAbort, fetchClientList]
  );

  const clearSearchResults = useCallback(() => {
    setAgentSearchResults([]);
    setSearchError(null);
  }, []);

  // Helper function to determine if user is an agent
  const isAgent = useCallback(() => {
    return clientList.length > 0 || user?.user_type === "agent";
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
    const enabled =
      authReady &&
      !!user?.id &&
      (routeStartsWith("/agent") || routeStartsWith("/profile"));

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

  const value = useMemo<AgentContextType>(
    () => ({
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
    }),
    [
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
    ]
  );

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}

/* =========================
   Hook
   ========================= */

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used within an AgentProvider");
  return ctx;
}
