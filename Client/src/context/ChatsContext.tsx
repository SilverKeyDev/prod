import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Chat } from "../types";
import {
  createAbortManager,
  isAbortError,
  formatFilenameToAddress,
} from "./utils";
import { reportApi } from "../api/report";
import { chatbotApi } from "../api/chatbot";

/* =========================
   Types
   ========================= */

interface ChatsContextType {
  chats: Chat[];
  chatsLoading: boolean;
  chatsError: string | null;
  refreshChats: () => Promise<void>;
  sendMessage: (reportId: string, message: string) => Promise<any>;
  getChatHistory: (reportId: string) => Promise<any>;
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

  const fetchChats = useCallback(async () => {
    console.log("[CHATS_CONTEXT] 🚀 Starting fetchChats");
    
    setChatsLoading(true);
    setChatsError(null);
    console.log("[CHATS_CONTEXT] 📡 Calling reportApi.getAll()");
    
    try {
      const json = await reportApi.getAll();
      console.log("[CHATS_CONTEXT] 📥 API Response received:", {
        success: json.success,
        reportsCount: json.reports?.length || 0,
        hasReports: !!json.reports,
        error: json.error
      });
      
      if (json.success && json.reports) {
        const newChats: Chat[] = json.reports.map((report: any) => ({
          id: report.id,
          title: report.address ? formatFilenameToAddress(report.address) : `Report ${report.id}`,
          propertyAddress: report.address,
          messages: [],
          createdAt: new Date(report.generatedAt ? report.generatedAt * 1000 : Date.now()),
        }));
        console.log("[CHATS_CONTEXT] ✅ Successfully processed chats:", {
          chatsCount: newChats.length,
          chatIds: newChats.map(c => c.id)
        });
        setChats(newChats);
      } else {
        const errorMsg = json.error || "Failed to fetch chat data";
        console.log("[CHATS_CONTEXT] ❌ API returned error:", errorMsg);
        throw new Error(errorMsg);
      }
    } catch (e: any) {
      if (!isAbortError(e)) {
        console.error("[CHATS_CONTEXT] ❌ fetchChats error:", {
          error: e,
          message: e?.message,
          stack: e?.stack
        });
        setChatsError(e?.message ?? "Failed to fetch chat data");
      }
    } finally {
      console.log("[CHATS_CONTEXT] 🏁 fetchChats completed");
      setChatsLoading(false);
    }
  }, []);

  /* =========================
     Chatbot methods
     ========================= */

  const sendMessage = useCallback(async (reportId: string, message: string) => {
    console.log("[CHATS_CONTEXT] 💬 Starting sendMessage", { reportId, messageLength: message.length });
    try {
      const cleanReportId = reportId.replace(/\.(pdf|json)$/, '');
      console.log("[CHATS_CONTEXT] 📡 Calling chatbotApi.chatForAddress", { cleanReportId });
      
      const response = await chatbotApi.chatForAddress(cleanReportId, message);
      console.log("[CHATS_CONTEXT] ✅ sendMessage response:", {
        hasResponse: !!response.response,
        messageId: response.message_id,
        messageSummary: response.message_summary
      });
      
      return response;
    } catch (error) {
      console.error("[CHATS_CONTEXT] ❌ sendMessage error:", {
        reportId,
        cleanReportId: reportId.replace(/\.(pdf|json)$/, ''),
        error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, []);

  const getChatHistory = useCallback(async (reportId: string) => {
    console.log("[CHATS_CONTEXT] 📜 Starting getChatHistory", { reportId });
    try {
      const cleanReportId = reportId.replace(/\.(pdf|json)$/, '');
      console.log("[CHATS_CONTEXT] 📡 Calling chatbotApi.getChatHistory", { cleanReportId });
      
      const response = await chatbotApi.getChatHistory(cleanReportId);
      console.log("[CHATS_CONTEXT] ✅ getChatHistory response:", {
        messagesCount: response.messages?.length || 0,
        hasMessages: !!response.messages
      });
      
      return response;
    } catch (error) {
      console.error("[CHATS_CONTEXT] ❌ getChatHistory error:", {
        reportId,
        cleanReportId: reportId.replace(/\.(pdf|json)$/, ''),
        error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }, []);

  /* =========================
     Public refresh function
     ========================= */

  const refreshChats = useCallback(
    () => withAbort(() => fetchChats()),
    [withAbort, fetchChats]
  );

  /* =========================
     Effects
     ========================= */

  // Initial load when authenticated
  useEffect(() => {
    console.log("[CHATS_CONTEXT] 🔄 Initial load effect triggered");
    console.log("[CHATS_CONTEXT] 🚀 Calling refreshChats from initial load");
    refreshChats();
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

  const value = useMemo<ChatsContextType>(
    () => ({
      chats,
      chatsLoading,
      chatsError,
      refreshChats,
      sendMessage,
      getChatHistory,
    }),
    [chats, chatsLoading, chatsError, refreshChats, sendMessage, getChatHistory]
  );

  return (
    <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>
  );
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
    sendMessage: ctx.sendMessage,
    getChatHistory: ctx.getChatHistory,
  };
}
