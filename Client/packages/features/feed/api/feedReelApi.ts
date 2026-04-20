/**
 * MIGRATION SHIM (DO NOT ADD NEW TYPES HERE)
 *
 * This file re-exports types from the generated API contract (api.generated.ts).
 * All type definitions have been moved to openapi.yaml.
 *
 * To add/modify API types:
 * 1. Edit openapi.yaml
 * 2. Run `pnpm generate:api-types`
 * 3. Types will be auto-generated in packages/types/api.generated.ts
 *
 * This shim maintains backward compatibility for existing imports.
 */

import { apiDelete, apiGet, apiPost } from "packages/services/http/compatibility";
import type { components } from "packages/types/api.generated";

import type { FeedComment } from "@/features/feed/types/feed";

// Re-export types from generated schema
export type FeedLikeEntry = components["schemas"]["FeedLikeEntry"];
export type FeedLikesResponse = components["schemas"]["FeedLikesResponse"];
export type FeedCommentsResponse = components["schemas"]["FeedCommentsResponse"];
export type FeedCommentApiShape = components["schemas"]["FeedCommentApiShape"];

function mapApiCommentToFeedComment(c: FeedCommentApiShape): FeedComment {
  return {
    id: c.id,
    user: c.user,
    text: c.text,
    createdAt: c.createdAt,
    likes: c.likes ?? 0,
  };
}

export const feedReelApi = {
  getFeedLikes: async (homeIds: string[]): Promise<Record<string, FeedLikeEntry>> => {
    if (homeIds.length === 0) return {};
    const ids = [...new Set(homeIds)].filter(Boolean).join(",");
    const response = await apiGet<FeedLikesResponse>(
      `/api/v1/feed/likes?ids=${encodeURIComponent(ids)}`
    );
    return response?.likes ?? {};
  },

  postFeedLike: async (homeId: string): Promise<void> => {
    await apiPost("/api/v1/feed/likes", { homeId });
  },

  deleteFeedLike: async (homeId: string): Promise<void> => {
    await apiDelete(`/api/v1/feed/likes/${encodeURIComponent(homeId)}`);
  },

  getFeedComments: async (homeId: string): Promise<FeedComment[]> => {
    const response = await apiGet<FeedCommentsResponse>(
      `/api/v1/feed/comments/${encodeURIComponent(homeId)}`
    );
    const list = response?.comments ?? [];
    return list.map(mapApiCommentToFeedComment);
  },

  postFeedComment: async (homeId: string, text: string): Promise<FeedComment> => {
    const created = await apiPost<FeedCommentApiShape>("/api/v1/feed/comments", { homeId, text });
    return mapApiCommentToFeedComment(created);
  },
};
