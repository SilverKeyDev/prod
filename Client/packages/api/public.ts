import { apiGet } from "packages/services/http/compatibility";
import type { components } from "packages/types/api.generated";

export type PublicAgentProfileResponse = components["schemas"]["PublicAgentProfileResponse"];

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
};
