import { getEnv } from "packages/config/env";
import { log } from "packages/logger";

import { resolveWebGoogleMapsCloudMapId } from "./resolveWebGoogleMapsCloudMapId";

type MapWithOptionalMapId = google.maps.Map & {
  getMapId?: () => string | null | undefined;
};

export type MapIdLogMask = {
  mapIdLength: number;
  mapIdSuffix: string;
};

/** Last four characters of map id for deploy verification without logging the full id. */
export function maskMapIdForLog(mapId: string | undefined): MapIdLogMask {
  const id = (mapId ?? "").trim();
  if (!id) {
    return { mapIdLength: 0, mapIdSuffix: "" };
  }
  return {
    mapIdLength: id.length,
    mapIdSuffix: id.length >= 4 ? id.slice(-4) : id,
  };
}

let envDiagnosticsLogged = false;

export type LogWebMapsEnvDiagnosticsOptions = {
  map?: google.maps.Map | null;
  phase?: "env" | "map_instance";
};

/**
 * Prod-safe diagnostics for Cloud Map ID (Advanced Markers). Logs once for env; map phase may repeat per create.
 */
export function logWebMapsEnvDiagnostics(options?: LogWebMapsEnvDiagnosticsOptions): void {
  const phase = options?.phase ?? (options?.map ? "map_instance" : "env");
  if (phase === "env" && envDiagnosticsLogged) {
    return;
  }

  const envCfg = getEnv();
  const fromWeb = String(envCfg.getRaw("EXPO_PUBLIC_GOOGLE_MAPS_ID") ?? "");
  const fromIos = String(envCfg.getRaw("EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS") ?? "");
  const { mapId, source } = resolveWebGoogleMapsCloudMapId({ fromWeb, fromIos });
  const mask = maskMapIdForLog(mapId);

  const payload: Record<string, unknown> = {
    phase,
    configured: Boolean(mapId),
    source,
    buildMode: envCfg.isProduction ? "production" : "development",
    ...mask,
  };

  if (options?.map) {
    const getMapId = (options.map as MapWithOptionalMapId).getMapId;
    const instanceId =
      typeof getMapId === "function" ? String(getMapId.call(options.map) ?? "").trim() : "";
    payload.instanceMapIdPresent = Boolean(instanceId);
    Object.assign(payload, maskMapIdForLog(instanceId || undefined));
  }

  if (phase === "env") {
    envDiagnosticsLogged = true;
  }

  if (!mapId && phase === "env") {
    log.warn(
      "MAP_RENDERING",
      "Web Maps Cloud Map ID not configured at build/runtime — Advanced Markers will not work",
      payload
    );
    return;
  }

  log.info("MAP_RENDERING", "Web Maps Cloud Map ID diagnostics", payload);
}
