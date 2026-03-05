import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { feedReelApi } from "@/features/feed/api/feedReelApi";

const FEED_LIKES_QUERY_KEY = "feed-likes";

function feedLikesQueryKey(homeIds: string[]): string[] {
  const sorted = [...homeIds].filter(Boolean).sort();
  return [FEED_LIKES_QUERY_KEY, sorted.join(",")];
}

export type FeedLikeEntry = { count: number; isLikedByMe: boolean };

export function useFeedLikes(homeIds: string[]) {
  const queryClient = useQueryClient();
  const stableIds = [...new Set(homeIds)].filter(Boolean);
  const queryKey = feedLikesQueryKey(stableIds);

  const query = useQuery({
    queryKey,
    queryFn: () => feedReelApi.getFeedLikes(stableIds),
    enabled: stableIds.length > 0,
  });

  const likesByHomeId = query.data ?? {};

  const likeMutation = useMutation({
    mutationFn: async (homeId: string) => {
      await feedReelApi.postFeedLike(homeId);
    },
    onSuccess: (_, homeId) => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async (homeId: string) => {
      await feedReelApi.deleteFeedLike(homeId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleLike = (homeId: string) => {
    const entry = likesByHomeId[homeId];
    if (entry?.isLikedByMe) {
      unlikeMutation.mutate(homeId);
    } else {
      likeMutation.mutate(homeId);
    }
  };

  return {
    likesByHomeId,
    toggleLike,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
