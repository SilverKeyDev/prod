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
  createAbortManager,
} from "../lib/fetchUtils";

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
  handleHomeSelection: (home: any) => void;
  handleGenerate: () => Promise<void>;
  handleDownloadJson: () => void;
  handleShareJson: () => Promise<void>;
}

/* =========================
   Context
   ========================= */

const NegotiationContext = createContext<NegotiationContextType | undefined>(undefined);

interface NegotiationProviderProps {
  children: ReactNode;
}

export function NegotiationProvider({ children }: NegotiationProviderProps) {
  const { abortAll } = useMemo(() => createAbortManager(), []);


  // Enhanced strategy generation state with localStorage persistence
  const [selectedHome, setSelectedHome] = useState<any | null>(null);
  const [strategyData, setStrategyData] = useState<any | null>(null);
  const [compsData, setCompsData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  // Handle home selection from dropdown
  const handleHomeSelection = useCallback((home: any) => {
    setSelectedHome(home);
    setStrategyData(null); // Reset strategy when home changes
    setCompsData(null); // Reset comps when home changes

    // Save the newly selected home to localStorage
    localStorage.setItem("negotiationSelectedHome", JSON.stringify(home));

    // Clear saved strategy and comps since we're selecting a different home
    localStorage.removeItem("negotiationStrategy");
    localStorage.removeItem("negotiationComps");
  }, []);

  // Enhanced strategy generation with localStorage persistence
  const handleGenerate = async () => {
    if (!selectedHome) return;

    setIsLoading(true);
    setError(null);
    setStrategyData(null);
    setCompsData(null);

    try {
      // Get authentication token
      const idToken = localStorage.getItem("id_token");
      console.log("🔐 [NEGOTIATION] Token available:", !!idToken);
      if (!idToken) {
        throw new Error("Authentication required. Please log in.");
      }
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const address =
        selectedHome.address ||
        selectedHome.full_address ||
        selectedHome.location;

      console.log("🏠 [NEGOTIATION] Generating strategy for address:", address);
      console.log("🌐 [NEGOTIATION] API Base URL:", baseUrl);
      console.log("📋 [NEGOTIATION] Selected home data:", selectedHome);

      const strategyUrl = `${baseUrl}/api/v1/offer/generate-strategy`;
      const compsUrl = `${baseUrl}/api/v1/search/propertyComps?address=${encodeURIComponent(address)}`;
      
      console.log("📡 [NEGOTIATION] Strategy API URL:", strategyUrl);
      console.log("📡 [NEGOTIATION] Comps API URL:", compsUrl);

      // Make both API calls concurrently
      console.log("🚀 [NEGOTIATION] Starting API calls...");
      const [strategyRes, compsRes] = await Promise.all([
        fetch(strategyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            address: address,
          }),
        }),
        fetch(compsUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        }),
      ]);

      console.log("📊 [NEGOTIATION] Strategy response status:", strategyRes.status);
      console.log("📊 [NEGOTIATION] Strategy response headers:", Object.fromEntries(strategyRes.headers.entries()));
      console.log("📊 [NEGOTIATION] Comps response status:", compsRes.status);
      console.log("📊 [NEGOTIATION] Comps response headers:", Object.fromEntries(compsRes.headers.entries()));

      // Check content type before parsing JSON
      const strategyContentType = strategyRes.headers.get("content-type");
      const compsContentType = compsRes.headers.get("content-type");
      
      console.log("📄 [NEGOTIATION] Strategy content-type:", strategyContentType);
      console.log("📄 [NEGOTIATION] Comps content-type:", compsContentType);

      // Get response text first to debug what we're receiving
      const strategyText = await strategyRes.text();
      const compsText = await compsRes.text();

      console.log("📝 [NEGOTIATION] Strategy response text (first 500 chars):", strategyText.substring(0, 500));
      console.log("📝 [NEGOTIATION] Comps response text (first 500 chars):", compsText.substring(0, 500));

      // Parse JSON responses
      let strategyResponseData, compsResponseData;
      
      try {
        strategyResponseData = JSON.parse(strategyText);
        console.log("✅ [NEGOTIATION] Strategy JSON parsed successfully:", strategyResponseData);
      } catch (parseError) {
        console.error("❌ [NEGOTIATION] Failed to parse strategy response as JSON:", parseError);
        console.error("❌ [NEGOTIATION] Raw strategy response:", strategyText);
        throw new Error(`Strategy API returned invalid JSON. Status: ${strategyRes.status}. Response: ${strategyText.substring(0, 200)}...`);
      }

      try {
        compsResponseData = JSON.parse(compsText);
        console.log("✅ [NEGOTIATION] Comps JSON parsed successfully:", compsResponseData);
      } catch (parseError) {
        console.error("❌ [NEGOTIATION] Failed to parse comps response as JSON:", parseError);
        console.error("❌ [NEGOTIATION] Raw comps response:", compsText);
        // Don't throw for comps parsing error, just log it
        compsResponseData = { error: "Failed to parse comps response" };
      }

      // Check strategy response
      if (!strategyRes.ok) {
        console.error("❌ [NEGOTIATION] Strategy API error:", strategyRes.status, strategyResponseData);
        throw new Error(
          strategyResponseData.error ||
            `Strategy API error! status: ${strategyRes.status}`
        );
      }

      if (!strategyResponseData.success) {
        console.error("❌ [NEGOTIATION] Strategy generation failed:", strategyResponseData);
        throw new Error(
          strategyResponseData.error || "Failed to generate strategy"
        );
      }

      // Check comps response (log but don't fail if comps fails)
      if (!compsRes.ok) {
        console.warn("⚠️ [NEGOTIATION] Property comps API failed:", compsRes.status, compsResponseData);
      }

      // Parse the strategy data from the AI response
      const parsedStrategyData = strategyResponseData.strategy;
      console.log("🎯 [NEGOTIATION] Parsed strategy data:", parsedStrategyData);

      // Store the complete strategy data from the AI response
      // This will display ALL fields returned by the AI
      setStrategyData(parsedStrategyData || {});

      // Store the property comps data
      setCompsData(compsResponseData || {});

      // Save strategy data, comps data, and selected home to localStorage
      localStorage.setItem(
        "negotiationStrategy",
        JSON.stringify(parsedStrategyData || {})
      );
      localStorage.setItem(
        "negotiationComps",
        JSON.stringify(compsResponseData || {})
      );
      localStorage.setItem(
        "negotiationSelectedHome",
        JSON.stringify(selectedHome)
      );

      console.log("💾 [NEGOTIATION] Data saved to localStorage successfully");
    } catch (err) {
      console.error("❌ [NEGOTIATION] Error generating negotiation strategy:", err);
      console.error("❌ [NEGOTIATION] Error stack:", err instanceof Error ? err.stack : 'No stack trace');
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate strategy. Please try again."
      );
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

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Negotiation Strategy",
          text: `Negotiation strategy for ${
            selectedHome?.address || "property"
          }`,
          files: [
            new File([dataStr], "negotiation-strategy.json", {
              type: "application/json",
            }),
          ],
        });
      } catch (err) {
        // Fallback to clipboard
        handleCopyToClipboard(dataStr);
      }
    } else {
      // Fallback for browsers without Web Share API
      handleCopyToClipboard(dataStr);
    }
  }, [strategyData, selectedHome]);

  // Fallback function to copy JSON to clipboard
  const handleCopyToClipboard = useCallback(async (dataStr: string) => {
    try {
      await navigator.clipboard.writeText(dataStr);
      alert("Strategy JSON copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      alert("Failed to share. Please try downloading instead.");
    }
  }, []);

  /* =========================
     Effects
     ========================= */

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedStrategy = localStorage.getItem("negotiationStrategy");
    const savedHome = localStorage.getItem("negotiationSelectedHome");
    const savedComps = localStorage.getItem("negotiationComps");

    if (savedStrategy) {
      try {
        const parsedStrategy = JSON.parse(savedStrategy);
        setStrategyData(parsedStrategy);
      } catch (error) {
        console.error(
          "❌ [NEGOTIATION] Failed to parse saved strategy data:",
          error
        );
        localStorage.removeItem("negotiationStrategy");
      }
    }
    if (savedHome) {
      try {
        const parsedHome = JSON.parse(savedHome);
        setSelectedHome(parsedHome);
      } catch (error) {
        console.error(
          "❌ [NEGOTIATION] Failed to parse saved home data:",
          error
        );
        localStorage.removeItem("negotiationSelectedHome");
      }
    }

    if (savedComps) {
      try {
        const parsedComps = JSON.parse(savedComps);
        setCompsData(parsedComps);
      } catch (error) {
        console.error(
          "❌ [NEGOTIATION] Failed to parse saved comps data:",
          error
        );
        localStorage.removeItem("negotiationComps");
      }
    }
  }, []);



  // Cleanup on unmount
  useEffect(() => () => abortAll(), [abortAll]);

  /* =========================
     Memoized value
     ========================= */

  const value = useMemo<NegotiationContextType>(() => ({
    selectedHome,
    strategyData,
    compsData,
    isLoading,
    error,
    handleHomeSelection,
    handleGenerate,
    handleDownloadJson,
    handleShareJson,
  }), [
    selectedHome, strategyData, compsData, isLoading, error,
    handleHomeSelection, handleGenerate, handleDownloadJson, handleShareJson,
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
