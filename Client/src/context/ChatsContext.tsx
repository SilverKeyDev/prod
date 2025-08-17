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
  Chat,
  BASE_URL,
  getIdToken,
  authHeaders,
  fetchJson,
  createAbortManager,
  isAbortError,
  formatFilenameToAddress,
} from "./utils";

/* =========================
   Types
   ========================= */

interface ChatsContextType {
  chats: Chat[];
  chatsLoading: boolean;
  chatsError: string | null;
  refreshChats: () => Promise<void>;
}

/* =========================
   Context
   ========================= */

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);

interface ChatsProviderProps {
  children: ReactNode;
}

export function ChatsProvider({ children }: ChatsProviderProps) {
  const { abortAll, withAbort } = useMemo(() => createAbortManager(), []);
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);

  /* =========================
     Fetcher
     ========================= */

  const fetchChats = useCallback(async (signal?: AbortSignal) => {
    const token = getIdToken();
    if (!token) return;
    
    setChatsLoading(true);
    setChatsError(null);
    
    try {
      const json = await fetchJson<{ success: boolean; reports?: any[]; error?: string }>(
        `${BASE_URL}/api/v1/report/almostall`,
        { method: "GET", mode: "cors", headers: authHeaders(token) },
        signal
      );
      
      if (json.success && json.reports) {
        const newChats: Chat[] = json.reports.map((report: any) => ({
          id: report.id,
          title: report.address ? formatFilenameToAddress(report.address) : `Report ${report.id}`,
          propertyAddress: report.address,
          messages: [],
          createdAt: new Date(report.generatedAt ? report.generatedAt * 1000 : Date.now()),
        }));
        setChats(newChats);
      } else {
        throw new Error(json.error || "Failed to fetch chat data");
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("Failed to fetch chat data:", e);
        setChatsError(e?.message ?? "Failed to fetch chat data");
      }
    } finally {
      setChatsLoading(false);
    }
  }, []);

  /* =========================
     Public refresh function
     ========================= */

  const refreshChats = useCallback(() => withAbort((s) => fetchChats(s)), [withAbort, fetchChats]);

  /* =========================
     Effects
     ========================= */

  // Initial load when authenticated
  useEffect(() => {
    const token = getIdToken();
    if (token) {
      refreshChats();
    }
  }, [refreshChats]);

  // Cross-tab auth changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "id_token") {
        if (e.newValue) {
          refreshChats();
        } else {
          // Clear everything
          setChats([]);
          setChatsError(null);
          abortAll();
        }
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshChats, abortAll]);

  // Cleanup on unmount
  useEffect(() => () => abortAll(), [abortAll]);

  /* =========================
     Memoized value
     ========================= */

  const value = useMemo<ChatsContextType>(() => ({
    chats,
    chatsLoading,
    chatsError,
    refreshChats,
  }), [chats, chatsLoading, chatsError, refreshChats]);

  return <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>;
}

/* =========================
   Hook
   ========================= */

export function useChats() {
  const ctx = useContext(ChatsContext);
  if (!ctx) throw new Error("useChats must be used within a ChatsProvider");
  return {
    chats: ctx.chats,
    loading: ctx.chatsLoading,
    error: ctx.chatsError,
    refreshChats: ctx.refreshChats,
  };
}
