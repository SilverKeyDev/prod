import { apiGet } from "packages/services/http/compatibility";
import type { components } from "packages/types/api.generated";

export type PublicAgentProfileResponse = components["schemas"]["PublicAgentProfileResponse"];

export const publicApi = {
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
