import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { feedReelApi } from "@/features/feed/api/feedReelApi";
import type { FeedComment } from "@/features/feed/types/feed";

const FEED_COMMENTS_QUERY_KEY = "feed-comments";

export function useFeedComments(homeId: string | null, enabled: boolean) {
  const queryClient = useQueryClient();
  const queryKey = [FEED_COMMENTS_QUERY_KEY, homeId ?? ""];

  const query = useQuery({
    queryKey,
    queryFn: () => feedReelApi.getFeedComments(homeId!),
    enabled: Boolean(homeId && enabled),
    staleTime: 2 * 60 * 1000, // 2 minutes - comments are more dynamic but not real-time
  });

  const comments: FeedComment[] = query.data ?? [];

  const addCommentMutation = useMutation({
    mutationFn: (text: string) => feedReelApi.postFeedComment(homeId!, text),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const addComment = (text: string) => {
    addCommentMutation.mutate(text);
  };

  return {
    comments,
    addComment,
    isLoading: query.isLoading,
    isError: query.isError,
    isAdding: addCommentMutation.isPending,
  };
}
