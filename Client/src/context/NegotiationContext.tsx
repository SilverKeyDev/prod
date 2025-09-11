import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { offerApi, searchApi } from "../api";
import { log } from "../lib/security/secureLogger";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { getAuthToken } from "../api/utils/auth";

/* =========================
   Types
   ========================= */

interface NegotiationContextType {
  // Enhanced strategy generation with localStorage persistence
  selectedHome: any | null;
  strategyData: any | null;
  compsData: any | null;
  isLoading: boolean;
  error: string | null;
  handleHomeSelection: (home: unknown) => void;
  handleGenerate: () => Promise<void>;
  handleDownloadJson: () => void;
  handleShareJson: () => Promise<void>;
}

/* =========================
   Context
   ========================= */

const NegotiationContext = createContext<NegotiationContextType | undefined>(
  undefined,
);

interface NegotiationProviderProps {
  children: ReactNode;
}

export function NegotiationProvider({ children }: NegotiationProviderProps) {
  // Enhanced strategy generation state with centralized localStorage persistence
  const { value: selectedHome, setValue: setSelectedHome } = useLocalStorage<
    any | null
  >("negotiationSelectedHome", null);
  const { value: strategyData, setValue: setStrategyData } = useLocalStorage<
    any | null
  >("negotiationStrategy", null);
  const { value: compsData, setValue: setCompsData } = useLocalStorage<
    any | null
  >("negotiationComps", null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle home selection from dropdown
  const handleHomeSelection = useCallback(
    (home: unknown) => {
      setSelectedHome(home);
      setStrategyData(null); // Reset strategy when home changes
      setCompsData(null); // Reset comps when home changes
      // Note: localStorage persistence is handled automatically by useLocalStorage hooks
    },
    [setSelectedHome, setStrategyData, setCompsData],
  );

  // Enhanced strategy generation with localStorage persistence
  const handleGenerate = async () => {
    if (!selectedHome) return;

    setIsLoading(true);
    setError(null);
    setStrategyData(null);
    setCompsData(null);

    try {
      // Get authentication token using centralized auth system
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error("Authentication required. Please log in.");
      }

      const address =
        selectedHome.address ||
        selectedHome.full_address ||
        selectedHome.location;

      // Make both API calls concurrently using centralized API clients
      const [strategyResponseData, compsResponseData] = await Promise.all([
        offerApi.generateStrategy({ address }),
        searchApi.getPropertyComps({ address }),
      ]);

      // Check comps response (log but don't fail if comps fails)
      if (!compsResponseData.success) {
        console.warn(
          "⚠️ [NEGOTIATION] Property comps API failed:",
          compsResponseData.error || "Unknown error",
        );
      }

      // Parse the strategy data from the AI response
      const parsedStrategyData = strategyResponseData.strategy;
      console.log("🎯 [NEGOTIATION] Parsed strategy data:", parsedStrategyData);

      // Store the complete strategy data from the AI response
      // This will display ALL fields returned by the AI
      setStrategyData(parsedStrategyData || {});

      // Store the property comps data
      setCompsData(compsResponseData || {});

      // Note: localStorage persistence is handled automatically by useLocalStorage hooks
      console.log("💾 [NEGOTIATION] Data saved to localStorage successfully");
    } catch (err) {
      console.error(
        "❌ [NEGOTIATION] Error generating negotiation strategy:",
        err,
      );
      console.error(
        "❌ [NEGOTIATION] Error stack:",
        err instanceof Error ? err.stack : "No stack trace",
      );

      // Handle different error types
      let errorMessage = "Failed to generate strategy. Please try again.";

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage =
            "Request was cancelled or timed out. Please try again.";
          console.warn(
            "🕐 [NEGOTIATION] Request aborted - likely due to timeout or cancellation",
          );
        } else if (err.message.includes("timeout")) {
          errorMessage =
            "Request timed out. Please check your connection and try again.";
        } else if (err.message.includes("Authentication required")) {
          errorMessage = "Please log in again to continue.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
      console.log("🏁 [NEGOTIATION] Strategy generation process completed");
    }
  };

  // Handle JSON download
  const handleDownloadJson = useCallback(() => {
    if (!strategyData) return;

    const dataStr = JSON.stringify(strategyData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `negotiation-strategy-${
      selectedHome?.address?.replace(/[^a-zA-Z0-9]/g, "-") || "strategy"
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [strategyData, selectedHome]);

  // Handle JSON sharing
  const handleShareJson = useCallback(async () => {
    if (!strategyData) return;

    const dataStr = JSON.stringify(strategyData, null, 2);

    // Check if Web Share API is available and supports file sharing
    if (navigator.share && navigator.canShare) {
      const shareData = {
        title: "Negotiation Strategy",
        text: `Negotiation strategy for ${selectedHome?.address || "property"}`,
        files: [
          new File([dataStr], "negotiation-strategy.json", {
            type: "application/json",
          }),
        ],
      };

      // Check if the browser can share files
      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          log.info(
            "NEGOTIATION_CONTEXT",
            "Strategy shared successfully via Web Share API",
          );
          return;
        } catch (err) {
          if (err instanceof Error && err.name !== "AbortError") {
            log.warn(
              "NEGOTIATION_CONTEXT",
              "Web Share API failed, trying text share",
              err,
            );
          } else {
            // User cancelled sharing
            return;
          }
        }
      }
    }

    // Fallback: Try sharing just text (no file) if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Negotiation Strategy",
          text: `Negotiation strategy for ${selectedHome?.address || "property"}:\n\n${dataStr}`,
        });
        log.info(
          "NEGOTIATION_CONTEXT",
          "Strategy shared as text via Web Share API",
        );
        return;
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          log.warn(
            "NEGOTIATION_CONTEXT",
            "Text share also failed, falling back to clipboard",
            err,
          );
        } else {
          // User cancelled sharing
          return;
        }
      }
    }

    // Final fallback: Copy to clipboard
  }, [strategyData, selectedHome]);

  /* =========================
     Effects
     ========================= */

  // Note: Data loading from localStorage is handled automatically by useLocalStorage hooks
  // No useEffect needed for persistence

  /* =========================
     Memoized value
     ========================= */

  const value = useMemo<NegotiationContextType>(
    () => ({
      selectedHome,
      strategyData,
      compsData,
      isLoading,
      error,
      handleHomeSelection,
      handleGenerate,
      handleDownloadJson,
      handleShareJson,
    }),
    [
      selectedHome,
      strategyData,
      compsData,
      isLoading,
      error,
      handleHomeSelection,
      handleGenerate,
      handleDownloadJson,
      handleShareJson,
    ],
  );

  return (
    <NegotiationContext.Provider value={value}>
      {children}
    </NegotiationContext.Provider>
  );
}

/* =========================
   Hook
   ========================= */

export function useNegotiation() {
  const ctx = useContext(NegotiationContext);
  if (!ctx)
    throw new Error("useNegotiation must be used within a NegotiationProvider");
  return ctx;
}
