import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";
import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import { SUPPORTED_SERVICE_AREA_WARNING } from "packages/utils/search/locations/serviceAreaAvailability";

const MAX_ERROR_MESSAGE_LEN = 200;

function translation(key: keyof typeof SEARCH_TRANSLATIONS | string): string {
  const v = SEARCH_TRANSLATIONS[key];
  return typeof v === "string" ? v : String(key);
}

/** Prefer a short single-line API/network message; never stack traces. */
export function userFacingSearchErrorMessage(error: unknown): string {
  const generic = translation("search.search_failed_generic");
  if (!(error instanceof Error) || !error.message?.trim()) {
    return generic;
  }
  const msg = error.message.trim();
  if (
    msg.length > MAX_ERROR_MESSAGE_LEN ||
    msg.includes("\n") ||
    msg.toLowerCase().includes("stack")
  ) {
    return generic;
  }
  return msg;
}

export function warnSearchEmptyResults(options: {
  preferencesStrictFilter: boolean;
}): void {
  const message = options.preferencesStrictFilter
    ? translation("search.empty_results_strict_preferences")
    : translation("search.no_results_try_adjusting");
  showWarningToast(message);
}

export function warnSearchFailed(error: unknown): void {
  showWarningToast(userFacingSearchErrorMessage(error));
}

export function warnSearchAreaInvalid(
  kind: "isochrone_api" | "geometry" | "viewport",
): void {
  if (kind === "viewport") {
    showWarningToast(translation("search.viewport_search_area_invalid"));
    return;
  }
  showWarningToast(translation("search.invalid_search_area"));
}

export function warnMapNotReady(kind: "no_map" | "no_bounds"): void {
  showWarningToast(
    kind === "no_bounds"
      ? translation("search.map_not_ready")
      : translation("search.map_missing"),
  );
}

export function warnUnsupportedServiceArea(): void {
  showWarningToast(
    translation("search.service_area_unavailable") ||
      SUPPORTED_SERVICE_AREA_WARNING,
  );
}
