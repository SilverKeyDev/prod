import { apiPost } from "packages/services/http";
import type { components } from "packages/types/api.generated";

export type BuildRouteRequest = components["schemas"]["BuildRouteRequest"];
export type ViewingBuildRouteApiResponse = components["schemas"]["ViewingBuildRouteApiResponse"];
export type ViewingItinerary = components["schemas"]["ViewingItinerary"];
export type ViewingNavigateApiResponse = components["schemas"]["ViewingNavigateApiResponse"];
export type ViewingStop = components["schemas"]["ViewingStop"];

export async function buildViewingRoute(
  body: BuildRouteRequest
): Promise<ViewingBuildRouteApiResponse> {
  return apiPost<ViewingBuildRouteApiResponse>("/api/v1/viewings/route", body);
}

export async function buildViewingNavigateLink(
  body: ViewingItinerary
): Promise<ViewingNavigateApiResponse> {
  return apiPost<ViewingNavigateApiResponse>("/api/v1/viewings/navigate", body);
}

export const viewingsApi = {
  buildRoute: buildViewingRoute,
  navigateLink: buildViewingNavigateLink,
};
