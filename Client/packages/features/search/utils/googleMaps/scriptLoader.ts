import { mapsApi, type MapsScriptResponse } from "packages/api/maps";
import { env } from "packages/config";
import { log, LOG_CATEGORIES } from "packages/logger";
import { asError } from "packages/utils";
import { getDocument, getWindow } from "packages/utils/platform";
import { getSessionStorage } from "packages/utils/storage/platformStorage";

import { isGoogleMapsReady } from "./utils";

/**
 * Handles Google Maps script loading, URL optimization, and readiness waiting.
 */
export class ScriptLoader {
  isLoaded = false;
  isLoading = false;
  error: string | null = null;
  scriptUrl: string | null = null;
  loadPromise: Promise<void> | null = null;
  private mapId: string | undefined;

  constructor() {
    this.mapId = this.getMapId();
  }

  getMapId(): string | undefined {
    try {
      const mapId = env.googleMapsId;
      if (!mapId) {
        log.warn(
          LOG_CATEGORIES.MAP_RENDERING,
          "VITE_GOOGLE_MAPS_ID not configured - using default map styling"
        );
      }
      return mapId;
    } catch {
      log.warn(LOG_CATEGORIES.MAP_RENDERING, "Could not load config, using fallback");
      return undefined;
    }
  }

  isReady(): boolean {
    return isGoogleMapsReady();
  }

  private hasExistingScripts(): boolean {
    const doc = getDocument();
    if (!doc) return false;
    const existingScripts = doc.querySelectorAll(
      'script[src*="maps.googleapis.com"], script[src*="maps.google.com"]'
    );
    return existingScripts.length > 0;
  }

  private waitForGoogleMapsReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 700;

      const checkReady = () => {
        attempts++;
        if (isGoogleMapsReady()) {
          this.isLoaded = true;
          this.isLoading = false;
          this.preloadLibraries();
          resolve();
        } else if (attempts >= maxAttempts) {
          const errorMsg = "Google Maps initialization timeout after 35 seconds";
          log.error(LOG_CATEGORIES.MAP_RENDERING, "Google Maps initialization timeout", {
            errorMsg,
          });
          this.error = "Google Maps initialization timeout. Please refresh the page.";
          this.isLoading = false;
          reject(new Error(errorMsg));
        } else {
          setTimeout(checkReady, 50);
        }
      };
      checkReady();
    });
  }

  private preloadLibraries(): void {
    const win = getWindow() as Window & { google?: typeof google };
    if (win?.google?.maps?.importLibrary) {
      win.google.maps
        .importLibrary("marker")
        .catch((err: unknown) =>
          log.warn(LOG_CATEGORIES.MAP_RENDERING, "Failed to import marker library", err)
        );
      win.google.maps
        .importLibrary("places")
        .catch((err: unknown) =>
          log.warn(LOG_CATEGORIES.MAP_RENDERING, "Failed to import places library", err)
        );
    }
  }

  private optimizeScriptUrl(scriptUrl: string): string {
    const url = new URL(scriptUrl);
    const libraries = new Set((url.searchParams.get("libraries") ?? "").split(",").filter(Boolean));
    libraries.add("marker");
    libraries.add("places");
    url.searchParams.set("libraries", Array.from(libraries).join(","));
    url.searchParams.set("v", "beta");
    url.searchParams.set("loading", "async");
    return url.toString();
  }

  private loadScript(scriptUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = getDocument();
      const win = getWindow();
      if (!doc?.head || !win) {
        reject(new Error("Document or window not available"));
        return;
      }
      const script = doc.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      script.id = "google-maps-api";

      const errorListener = (event: ErrorEvent) => {
        if (
          event.message?.includes("gen_204") ||
          event.filename?.includes("gen_204") ||
          event.message?.includes("ERR_CONNECTION_CLOSED")
        ) {
          event.preventDefault();
          return true;
        }
        return false;
      };
      win.addEventListener("error", errorListener, { once: true });

      script.onload = () => {
        win.removeEventListener("error", errorListener);
        resolve();
      };

      script.onerror = (error) => {
        win.removeEventListener("error", errorListener);
        const errorMessage = error instanceof ErrorEvent ? error.message : String(error);
        if (errorMessage.includes("gen_204") || errorMessage.includes("ERR_CONNECTION_CLOSED")) {
          log.warn(
            LOG_CATEGORIES.MAP_RENDERING,
            "Google Maps CSP test endpoint error (non-critical)",
            { errorMessage }
          );
          resolve();
          return;
        }
        log.error(LOG_CATEGORIES.MAP_RENDERING, "Failed to load Google Maps script", {
          error,
          scriptUrl,
        });
        this.error = "Failed to load Google Maps. Please check your connection.";
        this.isLoading = false;
        reject(new Error("Failed to load Google Maps script"));
      };

      doc.head.appendChild(script);
    });
  }

  async loadGoogleMapsScript(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    if (this.hasExistingScripts()) {
      try {
        await this.waitForGoogleMapsReady();
        return;
      } catch (error: unknown) {
        log.error(
          LOG_CATEGORIES.MAP_RENDERING,
          "Google Maps failed to wait for existing script",
          error
        );
        throw error;
      }
    }

    this.isLoading = true;
    this.error = null;

    this.loadPromise = (async () => {
      try {
        const cachedUrl = getSessionStorage().getItem("gmaps_script_url");
        if (cachedUrl) {
          this.scriptUrl = cachedUrl;
          if (this.hasExistingScripts()) {
            await this.waitForGoogleMapsReady();
            return;
          }
          const optimizedCached = this.optimizeScriptUrl(cachedUrl);
          await this.loadScript(optimizedCached);
          await this.waitForGoogleMapsReady();
          return;
        }

        const data: MapsScriptResponse = await mapsApi.getScriptUrl();
        if (!data.success || !data.script_url) {
          const errorMsg = data.error ?? "No script URL received from server";
          log.error(LOG_CATEGORIES.MAP_RENDERING, "Google Maps failed to get script URL", {
            errorMsg,
          });
          this.error = errorMsg;
          throw new Error(errorMsg);
        }

        this.scriptUrl = data.script_url;
        try {
          getSessionStorage().setItem("gmaps_script_url", data.script_url);
        } catch {
          /* ignore */
        }

        if (this.hasExistingScripts()) {
          await this.waitForGoogleMapsReady();
          return;
        }

        const finalScriptUrl = this.optimizeScriptUrl(data.script_url);
        await this.loadScript(finalScriptUrl);
        await this.waitForGoogleMapsReady();
      } catch (err: unknown) {
        const error = asError(err);
        log.error(LOG_CATEGORIES.MAP_RENDERING, "Error loading Google Maps", {
          errorMsg: error.message,
        });
        this.error = error.message;
        throw err;
      } finally {
        this.isLoading = false;
        const previous = this.loadPromise;
        this.loadPromise = null;
        void previous?.catch(() => {});
      }
    })();

    return this.loadPromise;
  }

  getLoaderState(): {
    isLoaded: boolean;
    isLoading: boolean;
    error: string | null;
    scriptUrl: string | null;
  } {
    return {
      isLoaded: this.isLoaded,
      isLoading: this.isLoading,
      error: this.error,
      scriptUrl: this.scriptUrl,
    };
  }

  reset(): void {
    this.isLoaded = false;
    this.isLoading = false;
    this.error = null;
    this.scriptUrl = null;
  }
}
