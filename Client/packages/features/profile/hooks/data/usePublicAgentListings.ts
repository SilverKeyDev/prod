import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { publicApi } from "packages/api";
import { queryKeys } from "packages/config/query/keys";
import { HttpError } from "packages/services/http/client";
import type { components } from "packages/types/api.generated";

export type PublicAgentListing = components["schemas"]["PublicAgentListing"];

/**
 * Loads the agent's MLS listings for the public site (unauthenticated) and
 * splits them into the current (`active`) and former (`sold`) buckets the
 * `#listings` section renders. `data` is `null` when the agent 404s.
 */
export function usePublicAgentListings(agentId: string | undefined) {
  const id = agentId?.trim() ?? "";

  const query = useQuery({
    queryKey: queryKeys.public.agentListings(id || "__missing__"),
    queryFn: async ({ signal }) => {
      try {
        const res = await publicApi.getAgentListings(id, { signal });
        return res.listings;
      } catch (e: unknown) {
        if (e instanceof HttpError && e.status === 404) {
          return null;
        }
        throw e;
      }
    },
    enabled: Boolean(id),
    staleTime: 60_000,
  });

  const listings = query.data;
  const { current, former } = useMemo(() => {
    const all = listings ?? [];
    return {
      current: all.filter((item) => item.status_category === "active"),
      former: all.filter((item) => item.status_category === "sold"),
    };
  }, [listings]);

  return { ...query, current, former };
}
