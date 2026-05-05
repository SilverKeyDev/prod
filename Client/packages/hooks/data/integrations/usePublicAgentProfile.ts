import { useQuery } from "@tanstack/react-query";

import { publicApi } from "packages/api";
import { queryKeys } from "packages/config/query/keys";
import { HttpError } from "packages/services/http/client";
import type { components } from "packages/types/api.generated";

export type PublicAgentProfile = components["schemas"]["PublicAgentProfile"];

export type UsePublicAgentProfileArgs = {
  /** Prefer fetching by stable user id (long /agent-profile/... URLs). */
  userId?: string;
  /** Fetch by `users.public_profile_slug` (short `/a/{slug}` URLs). */
  publicProfileSlug?: string;
};

/**
 * Loads a public agent directory row (unauthenticated).
 * Pass either `userId` or `publicProfileSlug`, not both.
 */
export function usePublicAgentProfile(args: UsePublicAgentProfileArgs) {
  const uid = args.userId?.trim() ?? "";
  const slug = args.publicProfileSlug?.trim().toLowerCase() ?? "";
  const mode = slug ? "slug" : "id";
  const key = mode === "slug" ? slug : uid;

  return useQuery({
    queryKey:
      mode === "slug"
        ? queryKeys.public.agentProfileBySlug(key || "__missing__")
        : queryKeys.public.agentProfile(key || "__missing__"),
    queryFn: async ({ signal }) => {
      if (mode === "slug") {
        if (!slug) throw new Error("publicProfileSlug is required");
        try {
          const res = await publicApi.getAgentProfileBySlug(slug, { signal });
          return res.agent;
        } catch (e: unknown) {
          if (e instanceof HttpError && e.status === 404) {
            return null;
          }
          throw e;
        }
      }
      if (!uid) {
        throw new Error("Agent id is required");
      }
      try {
        const res = await publicApi.getAgentProfile(uid, { signal });
        return res.agent;
      } catch (e: unknown) {
        if (e instanceof HttpError && e.status === 404) {
          return null;
        }
        throw e;
      }
    },
    enabled: mode === "slug" ? Boolean(slug) : Boolean(uid),
    staleTime: 60_000,
  });
}
