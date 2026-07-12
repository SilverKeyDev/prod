import { apiGet } from "packages/services/http";
import type { components } from "packages/types/api.generated";

export type PublicAgentProfileResponse = components["schemas"]["PublicAgentProfileResponse"];
export type PublicAgentListingsResponse = components["schemas"]["PublicAgentListingsResponse"];

export const publicApi = {
  /** Loads `GET /api/v1/public/agent-profile/{userId}` — same id as the `/agent-profile/:name/:briefSlug` URL’s `briefSlug` segment. */
  getAgentProfile: async (
    userId: string,
    options?: { signal?: AbortSignal }
  ): Promise<PublicAgentProfileResponse> => {
    const encoded = encodeURIComponent(userId.trim());
    return apiGet<PublicAgentProfileResponse>(`/api/v1/public/agent-profile/${encoded}`, {
      signal: options?.signal,
      includeAuth: false,
    });
  },
  /** Loads `GET /api/v1/public/agent-profile/{userId}/listings` — current + former MLS listings for the public site. */
  getAgentListings: async (
    userId: string,
    options?: { signal?: AbortSignal }
  ): Promise<PublicAgentListingsResponse> => {
    const encoded = encodeURIComponent(userId.trim());
    return apiGet<PublicAgentListingsResponse>(`/api/v1/public/agent-profile/${encoded}/listings`, {
      signal: options?.signal,
      includeAuth: false,
    });
  },
  getAgentProfileBySlug: async (
    publicProfileSlug: string,
    options?: { signal?: AbortSignal }
  ): Promise<PublicAgentProfileResponse> => {
    const encoded = encodeURIComponent(publicProfileSlug.trim().toLowerCase());
    return apiGet<PublicAgentProfileResponse>(`/api/v1/public/agent-profile/slug/${encoded}`, {
      signal: options?.signal,
      includeAuth: false,
    });
  },
};
