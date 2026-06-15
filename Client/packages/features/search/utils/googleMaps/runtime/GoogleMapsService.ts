import { log } from "packages/logger";

import { isGoogleMapsReady } from "@/features/search/utils/googleMaps/loader/googleMapsReadiness";
import { ScriptLoader } from "@/features/search/utils/googleMaps/loader/scriptLoader";

import { MapInstanceManager } from "./mapInstanceManager";

/**
 * Google Maps service for managing map initialization, script loading, and map creation.
 * Composes ScriptLoader and MapInstanceManager.
 */
export class GoogleMapsService {
  private static instance: GoogleMapsService;
  private readonly scriptLoader: ScriptLoader;
  private readonly mapManager: MapInstanceManager;

  private constructor() {
    this.scriptLoader = new ScriptLoader();
    this.mapManager = new MapInstanceManager();
  }

  public static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  public isGoogleMapsReady(): boolean {
    return isGoogleMapsReady();
  }

  public async loadGoogleMapsScript(): Promise<void> {
    return this.scriptLoader.loadGoogleMapsScript();
  }

  public createMap(
    container: HTMLElement,
    overrides?: Partial<google.maps.MapOptions>
  ): google.maps.Map | null {
    if (!this.isGoogleMapsReady()) {
      log.error("MAP_RENDERING", "Google Maps not ready yet - missing required APIs");
      return null;
    }
    return this.mapManager.createMap(container, this.scriptLoader.getMapId(), overrides);
  }

  public triggerMapResize(map: google.maps.Map): void {
    this.mapManager.triggerMapResize(map);
  }

  public cleanupMapInstance(map: google.maps.Map): void {
    this.mapManager.cleanupMapInstance(map);
  }

  public cleanupContainerMaps(container: HTMLElement): void {
    this.mapManager.cleanupContainerMaps(container);
  }

  public hasMapInContainer(container: HTMLElement): boolean {
    return this.mapManager.hasMapInContainer(container);
  }

  public getMapForContainer(container: HTMLElement): google.maps.Map | null {
    return this.mapManager.getMapForContainer(container);
  }

  public getMapInstanceStats(): {
    totalCreated: number;
    activeInstances: number;
    activeMapInstances: google.maps.Map[];
  } {
    return this.mapManager.getMapInstanceStats();
  }

  public getLoaderState(): {
    isLoaded: boolean;
    isLoading: boolean;
    error: string | null;
    scriptUrl: string | null;
  } {
    return this.scriptLoader.getLoaderState();
  }

  public reset(): void {
    this.scriptLoader.reset();
  }
}
