/**
 * Negotiation service: state, callbacks, and orchestration.
 */

import { log } from "packages/services/security/secureLogger";
import { useNegotiationStore } from "packages/store";
import { useAuthStore } from "packages/store";
import { asError } from "packages/utils";
import { getLocalStorage } from "packages/utils/core/storage/platformStorage";

import {
  copyToClipboard,
  downloadStrategyJson as doDownloadStrategyJson,
  shareStrategyJson as doShareStrategyJson,
} from "./downloadShare";
import {
  extractTextContent,
  loadFromSessionStorage,
  saveToSessionStorage,
} from "./persistence";
import { fetchStrategyAndComps } from "./strategyApi";
import type { NegotiationServiceCallbacks, NegotiationState } from "./types";
import { NEGOTIATION_STORAGE_KEYS } from "./types";

export type { NegotiationServiceCallbacks, NegotiationState } from "./types";

export class NegotiationService {
  private static instance: NegotiationService;
  private state: NegotiationState;
  private callbacks: NegotiationServiceCallbacks = {};
  private readonly localStorageKeys = NEGOTIATION_STORAGE_KEYS;
  private currentAbortController: AbortController | null = null;

  private constructor() {
    this.state = {
      selectedHome: loadFromSessionStorage(this.localStorageKeys.selectedHome),
      strategyData: loadFromSessionStorage(this.localStorageKeys.strategy),
      compsData: loadFromSessionStorage(this.localStorageKeys.comps),
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

  public setCallbacks(callbacks: NegotiationServiceCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getState(): NegotiationState {
    return { ...this.state };
  }

  private updateState(updates: Partial<NegotiationState>): void {
    this.state = { ...this.state, ...updates };
    if (
      this.callbacks.onStateChange &&
      typeof this.callbacks.onStateChange === "function"
    ) {
      this.callbacks.onStateChange(this.getState());
    }
  }

  public selectHome(home: unknown): void {
    log.info("NEGOTIATION_SERVICE", "Home selected", {
      homeAddress:
        home &&
        typeof home === "object" &&
        "address" in home &&
        typeof (home as { address?: string }).address === "string"
          ? (home as { address: string }).address
          : undefined,
    });

    this.updateState({
      selectedHome: home,
      strategyData: null,
      compsData: null,
      error: null,
    });

    const store = useNegotiationStore.getState();
    store.setSelectedHome(home as import("../schemas").SavedHome);
    store.setStrategyData(null);
    store.setCompsData(null);
    store.setStrategyTextContent("");
    store.setCompsTextContent("");
    store.setError(null);

    saveToSessionStorage(this.localStorageKeys.selectedHome, home);
    saveToSessionStorage(this.localStorageKeys.strategy, null);
    saveToSessionStorage(this.localStorageKeys.comps, null);
  }

  public cancelGeneration(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    this.updateState({ isLoading: false });
    const store = useNegotiationStore.getState();
    store.setLoading(false);
  }

  public async generateStrategy(): Promise<void> {
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

    this.currentAbortController = new AbortController();
    const signal = this.currentAbortController.signal;

    this.updateState({
      isLoading: true,
      error: null,
      strategyData: null,
      compsData: null,
    });

    try {
      const authStore = useAuthStore.getState();
      if (!authStore.isAuthenticated) {
        throw new Error("Authentication required. Please log in.");
      }

      const { strategyData: parsedStrategyData, compsData: compsResponseData } =
        await fetchStrategyAndComps(this.state.selectedHome, signal);

      this.currentAbortController = null;

      const strategyTextContent = extractTextContent(parsedStrategyData ?? {});
      const compsTextContent = extractTextContent(compsResponseData ?? {});

      this.updateState({
        strategyData: parsedStrategyData ?? {},
        compsData: compsResponseData ?? {},
        isLoading: false,
      });

      const store = useNegotiationStore.getState();
      store.setStrategyData(parsedStrategyData ?? {});
      store.setCompsData(compsResponseData ?? {});
      store.setStrategyTextContent(strategyTextContent);
      store.setCompsTextContent(compsTextContent);
      store.setLoading(false);
      store.setError(null);

      saveToSessionStorage(
        this.localStorageKeys.strategy,
        parsedStrategyData ?? {},
      );
      saveToSessionStorage(
        this.localStorageKeys.comps,
        compsResponseData ?? {},
      );

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
      this.currentAbortController = null;

      const error = asError(err);
      if (err instanceof Error && err.name === "AbortError") {
        log.warn(
          "NEGOTIATION_SERVICE",
          "Request aborted - likely due to timeout or cancellation",
        );
        this.updateState({ isLoading: false });
        const store = useNegotiationStore.getState();
        store.setLoading(false);
        store.setError(null);
        return;
      }

      log.error("NEGOTIATION_SERVICE", "Error generating strategy", error);

      let errorMessage = "Failed to generate strategy. Please try again.";

      if (err instanceof Error) {
        if (err.message.includes("timeout")) {
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

  public downloadStrategyJson(): void {
    doDownloadStrategyJson(this.state.strategyData, this.state.selectedHome);
  }

  public async shareStrategyJson(): Promise<void> {
    await doShareStrategyJson(
      this.state.strategyData,
      this.state.selectedHome,
      copyToClipboard,
    );
  }

  public clearData(): void {
    this.updateState({
      selectedHome: null,
      strategyData: null,
      compsData: null,
      error: null,
    });

    const store = useNegotiationStore.getState();
    store.clearData();

    Object.values(this.localStorageKeys).forEach((key) => {
      getLocalStorage().removeItem(key);
    });

    log.info("NEGOTIATION_SERVICE", "All data cleared");
  }

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
