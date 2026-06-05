import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import { HttpError, TimeoutError } from "packages/services/http/client";
import { resolveUserFacingMessage } from "packages/utils/core/errorHandling";
import { SUPPORTED_SERVICE_AREA_WARNING } from "packages/utils/product/search/locations/serviceAreaAvailability";

const MAX_ERROR_MESSAGE_LEN = 200;

function translation(key: keyof typeof SEARCH_TRANSLATIONS | string): string {
  const v = SEARCH_TRANSLATIONS[key];
  return typeof v === "string" ? v : String(key);
}

/** Prefer a short single-line API/network message; never stack traces. */
export function userFacingSearchErrorMessage(error: unknown): string {
  const generic = translation("search.search_failed_generic");
  const resolved = resolveUserFacingMessage(error, { fallbackMessage: generic });
  if (resolved === generic) return generic;
  const msg = resolved.trim();
  if (
    msg.length > MAX_ERROR_MESSAGE_LEN ||
    msg.includes("\n") ||
    msg.toLowerCase().includes("stack")
  ) {
    return generic;
  }
  return msg;
}

export function warnSearchEmptyResults(options: { preferencesStrictFilter: boolean }): void {
  const message = options.preferencesStrictFilter
    ? translation("search.empty_results_strict_preferences")
    : translation("search.no_results_try_adjusting");
  showWarningToast(message);
}

export function warnSearchFailed(error: unknown): void {
  showWarningToast(userFacingSearchErrorMessage(error));
}

/** Gateway / upstream failures and client timeouts — clearer recovery than generic search failed. */
export function warnSearchServerOrTimeout(error: unknown): void {
  if (error instanceof TimeoutError) {
    showWarningToast(translation("search.search_timeout_retry"));
    return;
  }
  if (error instanceof HttpError && error.status >= 502 && error.status <= 504) {
    showWarningToast(translation("search.search_server_unavailable"));
    return;
  }
  warnSearchFailed(error);
}

export function warnGeolocationDeniedUsingDefaultMarket(): void {
  showWarningToast(translation("search.geolocation_denied_default_market"));
}

export function warnGeolocationUnavailableUsingDefaultMarket(): void {
  showWarningToast(translation("search.geolocation_unavailable_default_market"));
}

export function warnSearchAreaWarnings(
  warnings: Array<"geolocation_denied" | "geolocation_unavailable">
): void {
  if (warnings.includes("geolocation_denied")) {
    warnGeolocationDeniedUsingDefaultMarket();
    return;
  }
  if (warnings.includes("geolocation_unavailable")) {
    warnGeolocationUnavailableUsingDefaultMarket();
  }
}

export function warnSearchAreaInvalid(kind: "isochrone_api" | "geometry" | "viewport"): void {
  if (kind === "viewport") {
    showWarningToast(translation("search.viewport_search_area_invalid"));
    return;
  }
  showWarningToast(translation("search.invalid_search_area"));
}

export function warnMapNotReady(kind: "no_map" | "no_bounds"): void {
  showWarningToast(
    kind === "no_bounds" ? translation("search.map_not_ready") : translation("search.map_missing")
  );
}

export function warnUnsupportedServiceArea(): void {
  showWarningToast(
    translation("search.service_area_unavailable") || SUPPORTED_SERVICE_AREA_WARNING
  );
}
