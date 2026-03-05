import { apiDelete, apiGet, apiPost } from "packages/services/http/compatibility";

import type { FeedComment } from "@/features/feed/types/feed";

export type FeedLikeEntry = { count: number; isLikedByMe: boolean };
export type FeedLikesResponse = { likes: Record<string, FeedLikeEntry> };
export type FeedCommentsResponse = { comments: FeedCommentApiShape[] };
export type FeedCommentApiShape = {
  id: string;
  user: { id: string; name: string; avatarUrl?: string };
  text: string;
  createdAt: string;
  likes?: number;
};

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
