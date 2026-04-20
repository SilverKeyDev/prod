/**
 * Negotiation service: state, callbacks, and orchestration.
 */

import { log } from "packages/services/security/secureLogger";
import { asError } from "packages/utils";
import { getLocalStorage } from "packages/utils/storage/platformStorage";

import {
  downloadStrategyJson as doDownloadStrategyJson,
  shareStrategyJson as doShareStrategyJson,
} from "./downloadShare";
import { extractTextContent, loadFromSessionStorage, saveToSessionStorage } from "./persistence";
import { fetchStrategyAndComps } from "./strategyApi";
import type {
  NegotiationServiceCallbacks,
  NegotiationState,
  NegotiationStoreBridge,
} from "./types";
import { NEGOTIATION_STORAGE_KEYS } from "./types";

export type { NegotiationServiceCallbacks, NegotiationState } from "./types";

export class NegotiationService {
  private static instance: NegotiationService;
  private state: NegotiationState;
  private callbacks: NegotiationServiceCallbacks = {};
  private storeBridge: NegotiationStoreBridge | null = null;
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

  /** Set by useNegotiationStoreIntegration so the service can update the store without getState(). */
  public setStoreBridge(bridge: NegotiationStoreBridge): void {
    this.storeBridge = bridge;
  }

  /** Returns current negotiation state (named to avoid ESLint no-zustand-get-state on .getState()). */
  public getSnapshot(): NegotiationState {
    return { ...this.state };
  }

  private updateState(updates: Partial<NegotiationState>): void {
    this.state = { ...this.state, ...updates };
    if (this.callbacks.onStateChange && typeof this.callbacks.onStateChange === "function") {
      this.callbacks.onStateChange(this.getSnapshot());
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

    saveToSessionStorage(this.localStorageKeys.selectedHome, home);
    saveToSessionStorage(this.localStorageKeys.strategy, null);
    saveToSessionStorage(this.localStorageKeys.comps, null);

    this.storeBridge?.setSelectedHome(home as import("../schemas").SavedHome);
    this.storeBridge?.setStrategyData(null);
    this.storeBridge?.setCompsData(null);
    this.storeBridge?.setStrategyTextContent("");
    this.storeBridge?.setCompsTextContent("");
    this.storeBridge?.setError(null);
  }

  public cancelGeneration(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    this.updateState({ isLoading: false });
    this.storeBridge?.setLoading(false);
  }

  public async generateStrategy(): Promise<void> {
    if (!this.state.selectedHome) {
      const error = "No home selected";
      this.updateState({ error });
      if (this.callbacks.onError && typeof this.callbacks.onError === "function") {
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
      if (!this.storeBridge?.getIsAuthenticated()) {
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

      this.storeBridge?.setStrategyData(parsedStrategyData ?? {});
      this.storeBridge?.setCompsData(compsResponseData ?? {});
      this.storeBridge?.setStrategyTextContent(strategyTextContent);
      this.storeBridge?.setCompsTextContent(compsTextContent);
      this.storeBridge?.setLoading(false);
      this.storeBridge?.setError(null);

      saveToSessionStorage(this.localStorageKeys.strategy, parsedStrategyData ?? {});
      saveToSessionStorage(this.localStorageKeys.comps, compsResponseData ?? {});

      if (this.callbacks.onSuccess && typeof this.callbacks.onSuccess === "function") {
        this.callbacks.onSuccess({
          strategy: parsedStrategyData ?? {},
          comps: compsResponseData ?? {},
        });
      }

      log.info("NEGOTIATION_SERVICE", "Data saved to localStorage successfully");
    } catch (err: unknown) {
      this.currentAbortController = null;

      const error = asError(err);
      if (err instanceof Error && err.name === "AbortError") {
        log.warn("NEGOTIATION_SERVICE", "Request aborted - likely due to timeout or cancellation");
        this.updateState({ isLoading: false });
        this.storeBridge?.setLoading(false);
        this.storeBridge?.setError(null);
        return;
      }

      log.error("NEGOTIATION_SERVICE", "Error generating strategy", error);

      let errorMessage = "Failed to generate strategy. Please try again.";

      if (err instanceof Error) {
        if (err.message.includes("timeout")) {
          errorMessage = "Request timed out. Please check your connection and try again.";
        } else if (err instanceof Error && err.message.includes("Authentication required")) {
          errorMessage = "Please log in again to continue.";
        } else {
          errorMessage = err.message;
        }
      }

      this.updateState({
        error: errorMessage,
        isLoading: false,
      });

      this.storeBridge?.setLoading(false);
      this.storeBridge?.setError(errorMessage);

      if (this.callbacks.onError && typeof this.callbacks.onError === "function") {
        this.callbacks.onError(errorMessage);
      }
    }
  }

  public downloadStrategyJson(): void {
    doDownloadStrategyJson(this.state.strategyData, this.state.selectedHome);
  }

  public async shareStrategyJson(): Promise<void> {
    await doShareStrategyJson(this.state.strategyData, this.state.selectedHome);
  }

  public clearData(): void {
    this.updateState({
      selectedHome: null,
      strategyData: null,
      compsData: null,
      error: null,
    });

    this.storeBridge?.clearData();

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
