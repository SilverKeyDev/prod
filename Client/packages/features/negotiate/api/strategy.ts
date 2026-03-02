/**
 * API calls for strategy and comps generation.
 * Only feature api/ may import packages/config/api.
 */

import { offerApi, searchApi } from "packages/config/api";
import { log } from "packages/services/security/secureLogger";
import { hasProperty, isObject } from "packages/utils";

export type StrategyAndCompsResult = {
  strategyData: Record<string, unknown>;
  compsData: Record<string, unknown>;
};

function getAddressFromHome(selectedHome: unknown): string | undefined {
  if (isObject(selectedHome)) {
    const { address: homeAddress } = selectedHome as { address?: string };
    if (homeAddress) return homeAddress;
  }
  if (
    hasProperty(selectedHome, "full_address") &&
    typeof (selectedHome as Record<string, unknown>).full_address === "string"
  ) {
    return (selectedHome as Record<string, unknown>).full_address as string;
  }
  if (
    hasProperty(selectedHome, "location") &&
    typeof (selectedHome as Record<string, unknown>).location === "string"
  ) {
    return (selectedHome as Record<string, unknown>).location as string;
  }
  if (selectedHome) {
    return typeof selectedHome === "string" ? selectedHome : JSON.stringify(selectedHome);
  }
  return "";
}

export async function fetchStrategyAndComps(
  selectedHome: unknown,
  signal?: AbortSignal
): Promise<StrategyAndCompsResult> {
  const address = getAddressFromHome(selectedHome);
  if (!address) {
    throw new Error("No valid address found for selected home");
  }

  log.info("NEGOTIATION_SERVICE", "Generating strategy and comps", { address });

  const options = signal ? { signal } : undefined;
  const [strategyResponseData, compsResponseData] = await Promise.all([
    offerApi.generateStrategy({ address }, options),
    searchApi.getPropertyComps({ address }, options),
  ]);

  if (!strategyResponseData || typeof strategyResponseData !== "object") {
    throw new Error("Invalid strategy response from API");
  }

  const strategyResponse = strategyResponseData as Record<string, unknown>;
  if (!("success" in strategyResponse) || !strategyResponse.success) {
    throw new Error("Strategy API call failed");
  }

  if (!compsResponseData || typeof compsResponseData !== "object") {
    throw new Error("Invalid comps response from API");
  }

  if (
    compsResponseData &&
    typeof compsResponseData === "object" &&
    "success" in compsResponseData &&
    !compsResponseData.success
  ) {
    log.warn("NEGOTIATION_SERVICE", "Property comps API failed", {
      error:
        "error" in compsResponseData && typeof compsResponseData.error === "string"
          ? compsResponseData.error
          : "Unknown error",
    });
  }

  const parsedStrategyData =
    "strategy" in strategyResponse && strategyResponse.strategy
      ? (strategyResponse.strategy as Record<string, unknown>)
      : {};

  log.info("NEGOTIATION_SERVICE", "Strategy generated successfully", {
    strategyId:
      "strategy_id" in strategyResponse && typeof strategyResponse.strategy_id === "string"
        ? strategyResponse.strategy_id
        : undefined,
  });

  return {
    strategyData: parsedStrategyData ?? {},
    compsData: (compsResponseData ?? {}) as Record<string, unknown>,
  };
}
