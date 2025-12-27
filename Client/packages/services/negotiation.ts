// Internal API clients
import { offerApi, searchApi } from "../config/api";
// Internal utilities
import { useNegotiationStore } from "../store/negotiation.slice";
import { useAuthStore } from "../store/auth.slice";
import { asError } from "../utils/error";
import { isObject, hasProperty } from "../utils/typeGuards";

import { log } from "./security/secureLogger";

// Internal services

/**
 * Types for negotiation service
 */
export type NegotiationState = {
  selectedHome: unknown;
  strategyData: unknown;
  compsData: unknown;
  isLoading: boolean;
  error: string | null;
};

export type NegotiationServiceCallbacks = {
  onStateChange?: (state: NegotiationState) => void;
  onError?: (error: string) => void;
  onSuccess?: (data: { strategy: unknown; comps: unknown }) => void;
};

/**
 * Negotiation service for managing negotiation strategy generation, property selection, and data persistence
 */
export class NegotiationService {
  private static instance: NegotiationService;
  private state: NegotiationState;
  private callbacks: NegotiationServiceCallbacks = {};
  private localStorageKeys = {
    selectedHome: "negotiationSelectedHome",
    strategy: "negotiationStrategy",
    comps: "negotiationComps",
  };
  private isGenerating: boolean = false;
  private currentGenerationPromise: Promise<void> | null = null;

  private constructor() {
    this.state = {
      selectedHome: this.loadFromLocalStorage(
        this.localStorageKeys.selectedHome,
      ),
      strategyData: this.loadFromLocalStorage(this.localStorageKeys.strategy),
      compsData: this.loadFromLocalStorage(this.localStorageKeys.comps),
      isLoading: false,
      error: null,
    };
  }

  public static getInstance(): NegotiationService {
    if (!NegotiationService.instance) {
      NegotiationService.instance = new NegotiationService();
    }
    return NegotiationService.instance;
  }

  /**
   * Set callbacks for state changes
   */
  public setCallbacks(callbacks: NegotiationServiceCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get current state
   */
  public getState(): NegotiationState {
    return { ...this.state };
  }

  /**
   * Load data from sessionStorage (temporary wizard state)
   */
  private loadFromLocalStorage(key: string): unknown {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error: unknown) {
      console.warn(`Failed to load ${key} from sessionStorage:`, error);
      return null;
    }
  }

  /**
   * Save data to sessionStorage (temporary wizard state)
   */
  private saveToLocalStorage(key: string, value: unknown): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error: unknown) {
      console.warn(`Failed to save ${key} to sessionStorage:`, error);
    }
  }

  /**
   * Update state and notify callbacks
   */
  private updateState(updates: Partial<NegotiationState>): void {
    this.state = { ...this.state, ...updates };
    if (
      this.callbacks.onStateChange &&
      typeof this.callbacks.onStateChange === "function"
    ) {
      this.callbacks.onStateChange(this.getState());
    }
  }

  /**
   * Handle home selection
   */
  public selectHome(home: unknown): void {
    // Extract address from the new home
    let newAddress: string | undefined;
    if (
      home &&
      typeof home === "object" &&
      "address" in home &&
      typeof home.address === "string"
    ) {
      newAddress = home.address;
    } else if (
      home &&
      typeof home === "object" &&
      "full_address" in home &&
      typeof (home as Record<string, unknown>).full_address === "string"
    ) {
      newAddress = (home as Record<string, unknown>).full_address as string;
    }

    // Extract address from currently selected home
    let currentAddress: string | undefined;
    if (
      this.state.selectedHome &&
      typeof this.state.selectedHome === "object" &&
      "address" in this.state.selectedHome &&
      typeof this.state.selectedHome.address === "string"
    ) {
      currentAddress = this.state.selectedHome.address as string;
    } else if (
      this.state.selectedHome &&
      typeof this.state.selectedHome === "object" &&
      "full_address" in this.state.selectedHome &&
      typeof (this.state.selectedHome as Record<string, unknown>)
        .full_address === "string"
    ) {
      currentAddress = (this.state.selectedHome as Record<string, unknown>)
        .full_address as string;
    }

    // Skip if selecting the same home (by address)
    if (newAddress && currentAddress && newAddress === currentAddress) {
      return;
    }

    log.info("NEGOTIATION_SERVICE", "Home selected", {
      homeAddress: newAddress,
    });

    this.updateState({
      selectedHome: home,
      strategyData: null, // Reset strategy when home changes
      compsData: null, // Reset comps when home changes
      error: null,
    });

    // Update Zustand store
    const store = useNegotiationStore.getState();
    store.setSelectedHome(home as import("../schemas").SavedHome);
    store.setStrategyData(null);
    store.setCompsData(null);
    store.setStrategyTextContent("");
    store.setCompsTextContent("");
    store.setError(null);

    // Persist to localStorage
    this.saveToLocalStorage(this.localStorageKeys.selectedHome, home);
    this.saveToLocalStorage(this.localStorageKeys.strategy, null);
    this.saveToLocalStorage(this.localStorageKeys.comps, null);
  }

  /**
   * Generate negotiation strategy and property comps
   */
  public async generateStrategy(): Promise<void> {
    // Prevent concurrent calls - if already generating, return the existing promise
    if (this.isGenerating && this.currentGenerationPromise) {
      return this.currentGenerationPromise;
    }

    if (!this.state.selectedHome) {
      const error = "No home selected";
      this.updateState({ error });
      if (
        this.callbacks.onError &&
        typeof this.callbacks.onError === "function"
      ) {
        this.callbacks.onError(error);
      }
      return;
    }

    // Set generating flag and create promise
    this.isGenerating = true;
    this.currentGenerationPromise = this._doGenerateStrategy();

    try {
      await this.currentGenerationPromise;
    } finally {
      this.isGenerating = false;
      this.currentGenerationPromise = null;
    }
  }

  /**
   * Internal method to actually perform the strategy generation
   */
  private async _doGenerateStrategy(): Promise<void> {
    this.updateState({
      isLoading: true,
      error: null,
      strategyData: null,
      compsData: null,
    });

    try {
      // Check authentication status using auth store
      const authStore = useAuthStore.getState();
      if (!authStore.isAuthenticated) {
        throw new Error("Authentication required. Please log in.");
      }

      let address: string | undefined;
      if (isObject(this.state.selectedHome)) {
        const { address: homeAddress } = this.state.selectedHome as {
          address?: string;
        };
        address = homeAddress;
      } else if (
        hasProperty(this.state.selectedHome, "full_address") &&
        typeof (this.state.selectedHome as Record<string, unknown>)
          .full_address === "string"
      ) {
        const homeData = this.state.selectedHome as Record<string, unknown>;
        address = homeData.full_address as string;
      } else if (
        hasProperty(this.state.selectedHome, "location") &&
        typeof (this.state.selectedHome as Record<string, unknown>).location ===
          "string"
      ) {
        const homeData = this.state.selectedHome as Record<string, unknown>;
        address = homeData.location as string;
      } else {
        address = this.state.selectedHome
          ? typeof this.state.selectedHome === "string"
            ? this.state.selectedHome
            : JSON.stringify(this.state.selectedHome)
          : "";
      }

      if (!address) {
        throw new Error("No valid address found for selected home");
      }

      log.info("NEGOTIATION_SERVICE", "Generating strategy and comps", {
        address,
      });

      // Make both API calls concurrently
      const [strategyResponseData, compsResponseData] = await Promise.all([
        offerApi.generateStrategy({ address }),
        searchApi.getPropertyComps({ address }),
      ]);

      // Validate API responses with proper type guards
      if (!strategyResponseData || typeof strategyResponseData !== "object") {
        throw new Error("Invalid strategy response from API");
      }

      // Type guard for strategy response
      const strategyResponse = strategyResponseData as Record<string, unknown>;
      if (!("success" in strategyResponse) || !strategyResponse.success) {
        throw new Error("Strategy API call failed");
      }
      if (!compsResponseData || typeof compsResponseData !== "object") {
        throw new Error("Invalid comps response from API");
      }

      // Check comps response (log but don't fail if comps fails)
      if (
        compsResponseData &&
        typeof compsResponseData === "object" &&
        "success" in compsResponseData &&
        !compsResponseData.success
      ) {
        if (log && typeof log.warn === "function") {
          log.warn("NEGOTIATION_SERVICE", "Property comps API failed", {
            error:
              "error" in compsResponseData &&
              typeof compsResponseData.error === "string"
                ? compsResponseData.error
                : "Unknown error",
          });
        }
      }

      // Parse the strategy data from the AI response with type safety
      const parsedStrategyData =
        "strategy" in strategyResponse && strategyResponse.strategy
          ? (strategyResponse.strategy as Record<string, unknown>)
          : {};
      
      // Debug logging for price section
      console.log("[NEGOTIATION SERVICE] strategyResponse.strategy:", strategyResponse.strategy);
      console.log("[NEGOTIATION SERVICE] parsedStrategyData:", parsedStrategyData);
      if (parsedStrategyData && typeof parsedStrategyData === "object" && "data" in parsedStrategyData) {
        console.log("[NEGOTIATION SERVICE] parsedStrategyData.data:", (parsedStrategyData as Record<string, unknown>).data);
      }
      
      log.info("NEGOTIATION_SERVICE", "Strategy generated successfully", {
        strategyId:
          "strategy_id" in strategyResponse &&
          typeof strategyResponse.strategy_id === "string"
            ? strategyResponse.strategy_id
            : undefined,
      });

      // Extract textual content from strategy data
      const strategyTextContent = this.extractTextContent(
        parsedStrategyData ?? {},
      );
      const compsTextContent = this.extractTextContent(compsResponseData ?? {});

      // Update state with new data
      this.updateState({
        strategyData: parsedStrategyData ?? {},
        compsData: compsResponseData ?? {},
        isLoading: false,
      });

      // Update Zustand store
      const store = useNegotiationStore.getState();
      store.setStrategyData(parsedStrategyData ?? {});
      store.setCompsData(compsResponseData ?? {});
      store.setStrategyTextContent(strategyTextContent);
      store.setCompsTextContent(compsTextContent);
      store.setLoading(false);
      store.setError(null);

      // Persist to localStorage
      this.saveToLocalStorage(
        this.localStorageKeys.strategy,
        parsedStrategyData ?? {},
      );
      this.saveToLocalStorage(
        this.localStorageKeys.comps,
        compsResponseData ?? {},
      );

      // Notify success callback
      if (
        this.callbacks.onSuccess &&
        typeof this.callbacks.onSuccess === "function"
      ) {
        this.callbacks.onSuccess({
          strategy: parsedStrategyData ?? {},
          comps: compsResponseData ?? {},
        });
      }

      log.info(
        "NEGOTIATION_SERVICE",
        "Data saved to localStorage successfully",
      );
    } catch (err: unknown) {
      const error = asError(err);
      log.error("NEGOTIATION_SERVICE", "Error generating strategy", error);

      // Handle different error types
      let errorMessage = "Failed to generate strategy. Please try again.";

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage =
            "Request was cancelled or timed out. Please try again.";
          log.warn(
            "NEGOTIATION_SERVICE",
            "Request aborted - likely due to timeout or cancellation",
          );
        } else if (err instanceof Error && err.message.includes("timeout")) {
          errorMessage =
            "Request timed out. Please check your connection and try again.";
        } else if (
          err instanceof Error &&
          err.message.includes("Authentication required")
        ) {
          errorMessage = "Please log in again to continue.";
        } else {
          errorMessage = err.message;
        }
      }

      this.updateState({
        error: errorMessage,
        isLoading: false,
      });

      // Update Zustand store with error
      const store = useNegotiationStore.getState();
      store.setLoading(false);
      store.setError(errorMessage);

      if (
        this.callbacks.onError &&
        typeof this.callbacks.onError === "function"
      ) {
        this.callbacks.onError(errorMessage);
      }
    }
  }

  /**
   * Extract textual content from response data
   */
  private extractTextContent(data: unknown): string {
    if (!data || typeof data !== "object") {
      return "";
    }

    const textParts: string[] = [];
    const extractFromObject = (
      obj: Record<string, unknown>,
      depth = 0,
    ): void => {
      if (depth > 10) return; // Prevent infinite recursion

      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string" && value.trim().length > 0) {
          // Skip very short strings and common metadata fields
          if (
            value.length > 3 &&
            !["id", "type", "status", "created_at", "updated_at"].includes(
              key.toLowerCase(),
            )
          ) {
            textParts.push(value.trim());
          }
        } else if (Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof item === "string" && item.trim().length > 3) {
              textParts.push(item.trim());
            } else if (typeof item === "object" && item !== null) {
              extractFromObject(item as Record<string, unknown>, depth + 1);
            }
          });
        } else if (typeof value === "object" && value !== null) {
          extractFromObject(value as Record<string, unknown>, depth + 1);
        }
      }
    };

    extractFromObject(data as Record<string, unknown>);
    return textParts.join(" ").trim();
  }

  /**
   * Download strategy data as JSON
   */
  public downloadStrategyJson(): void {
    if (!this.state.strategyData) {
      log.warn("NEGOTIATION_SERVICE", "No strategy data to download");
      return;
    }

    try {
      const dataStr = JSON.stringify(this.state.strategyData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url =
        typeof URL !== "undefined" && URL.createObjectURL
          ? URL.createObjectURL(dataBlob)
          : null;

      if (!url) {
        throw new Error("URL.createObjectURL is not available");
      }

      const link = document.createElement("a");
      link.href = url;
      const address = isObject(this.state.selectedHome)
        ? this.state.selectedHome &&
          typeof this.state.selectedHome === "object" &&
          "address" in this.state.selectedHome &&
          typeof this.state.selectedHome.address === "string"
          ? this.state.selectedHome.address
          : ""
        : this.state.selectedHome
          ? typeof this.state.selectedHome === "string"
            ? this.state.selectedHome
            : JSON.stringify(this.state.selectedHome)
          : "";

      if (!address) {
        throw new Error("No valid address found for selected home");
      }
      link.download = `negotiation-strategy-${
        typeof address === "string"
          ? address.replace(/[^a-zA-Z0-9]/g, "-")
          : "strategy"
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      log.info("NEGOTIATION_SERVICE", "Strategy JSON downloaded successfully");
    } catch (error: unknown) {
      log.error(
        "NEGOTIATION_SERVICE",
        "Failed to download strategy JSON",
        error,
      );
    }
  }

  /**
   * Share strategy data
   */
  public async shareStrategyJson(): Promise<void> {
    if (!this.state.strategyData) {
      log.warn("NEGOTIATION_SERVICE", "No strategy data to share");
      return;
    }

    try {
      const dataStr = JSON.stringify(this.state.strategyData, null, 2);

      // Check if Web Share API is available and supports file sharing
      if (navigator.share && typeof navigator.canShare === "function") {
        const address = isObject(this.state.selectedHome)
          ? this.state.selectedHome &&
            typeof this.state.selectedHome === "object" &&
            "address" in this.state.selectedHome &&
            typeof this.state.selectedHome.address === "string"
            ? this.state.selectedHome.address
            : ""
          : "property";
        const shareData = {
          title: "Negotiation Strategy",
          text: `Negotiation strategy for ${address}`,
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
              "NEGOTIATION_SERVICE",
              "Strategy shared successfully via Web Share API",
            );
            return;
          } catch (err: unknown) {
            const error = asError(err);
            if (error instanceof Error && error.name !== "AbortError") {
              log.warn(
                "NEGOTIATION_SERVICE",
                "Web Share API failed, trying text share",
                error,
              );
            } else {
              // User cancelled sharing
              return;
            }
          }
        }
      }

      // Fallback: Try sharing just text (no file) if Web Share API is available
      if (navigator.share && typeof navigator.share === "function") {
        try {
          const address = isObject(this.state.selectedHome)
            ? this.state.selectedHome &&
              typeof this.state.selectedHome === "object" &&
              "address" in this.state.selectedHome &&
              typeof this.state.selectedHome.address === "string"
              ? this.state.selectedHome.address
              : ""
            : "property";
          await navigator.share({
            title: "Negotiation Strategy",
            text: `Negotiation strategy for ${address}:\n\n${dataStr}`,
          });
          log.info(
            "NEGOTIATION_SERVICE",
            "Strategy shared as text via Web Share API",
          );
          return;
        } catch (err: unknown) {
          const error = asError(err);
          if (error instanceof Error && error.name !== "AbortError") {
            log.warn(
              "NEGOTIATION_SERVICE",
              "Text share also failed, falling back to clipboard",
              error,
            );
          } else {
            // User cancelled sharing
            return;
          }
        }
      }

      // Final fallback: Copy to clipboard
      await this.copyToClipboard(dataStr);
      log.info(
        "NEGOTIATION_SERVICE",
        "Strategy copied to clipboard as fallback",
      );
    } catch (error: unknown) {
      log.error("NEGOTIATION_SERVICE", "Failed to share strategy", error);
    }
  }

  /**
   * Copy text to clipboard
   */
  private async copyToClipboard(text: string): Promise<void> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
    } catch (error: unknown) {
      log.error("NEGOTIATION_SERVICE", "Failed to copy to clipboard", error);
      throw error;
    }
  }

  /**
   * Clear all data
   */
  public clearData(): void {
    this.updateState({
      selectedHome: null,
      strategyData: null,
      compsData: null,
      error: null,
    });

    // Clear Zustand store
    const store = useNegotiationStore.getState();
    store.clearData();

    // Clear localStorage
    Object.values(this.localStorageKeys).forEach((key) => {
      localStorage.removeItem(key);
    });

    log.info("NEGOTIATION_SERVICE", "All data cleared");
  }

  /**
   * Reset service state (useful for testing or cleanup)
   */
  public reset(): void {
    this.state = {
      selectedHome: null,
      strategyData: null,
      compsData: null,
      isLoading: false,
      error: null,
    };
    this.callbacks = {};
  }
}

// Export singleton instance
export const negotiationService = NegotiationService.getInstance();
