import { useQuery } from "@tanstack/react-query";

import { publicApi } from "packages/api";
import { queryKeys } from "packages/config/query/keys";
import { HttpError } from "packages/services/http/client";
import type { components } from "packages/types/api.generated";

export type PublicAgentProfile = components["schemas"]["PublicAgentProfile"];

export function usePublicAgentProfile(userId: string | undefined) {
  const trimmed = userId?.trim() ?? "";

  return useQuery({
    queryKey: queryKeys.public.agentProfile(trimmed || "__missing__"),
    queryFn: async ({ signal }) => {
      if (!trimmed) {
        throw new Error("Agent id is required");
      }
      try {
        const res = await publicApi.getAgentProfile(trimmed, { signal });
        return res.agent;
      } catch (e: unknown) {
        if (e instanceof HttpError && e.status === 404) {
          return null;
        }
        throw e;
      }
    },
    enabled: Boolean(trimmed),
    staleTime: 60_000,
  });
}
