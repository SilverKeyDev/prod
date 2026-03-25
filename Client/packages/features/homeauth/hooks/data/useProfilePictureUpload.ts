import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { UserProfile } from "packages/types";
import { prefetchRemoteImage } from "packages/utils/media/prefetchRemoteImage";

import { userApi } from "@/features/homeauth/api/user";

export type UseProfilePictureUploadReturn = {
  uploadProfilePicture: (file: File) => Promise<void>;
  isUploading: boolean;
  error: Error | null;
};

export function useProfilePictureUpload(): UseProfilePictureUploadReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const res = await userApi.uploadProfilePicture(file);
      if (!res.success) {
        throw new Error(res.error ?? "Profile picture upload failed");
      }
      return res;
    },
    onSuccess: (res) => {
      const url = res.profile_picture_url ?? res.data?.profile_picture_url;
      const s3Key = res.data?.profile_picture;
      queryClient.setQueryData<UserProfile>(queryKeys.user.profile(), (prev) => {
        if (prev == null) {
          return prev;
        }
        if (url == null && s3Key == null) {
          return prev;
        }
        log.debug(
          LOG_CATEGORIES.API,
          "Profile picture: merged upload response into profile cache",
          {
            hasUrl: Boolean(url),
            hasKey: Boolean(s3Key),
          }
        );
        return {
          ...prev,
          ...(s3Key != null ? { profile_picture: s3Key } : {}),
          ...(url != null ? { profile_picture_url: url } : {}),
        };
      });
      // #region agent log
      // eslint-disable-next-line no-restricted-globals -- debug NDJSON ingest (session 244579)
      fetch("http://127.0.0.1:7449/ingest/62a2c70d-285c-439c-8ad0-211f81794197", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "244579",
        },
        body: JSON.stringify({
          sessionId: "244579",
          location: "homeauth/hooks/data/useProfilePictureUpload.ts:onSuccess",
          message: "upload mutation ok, cache merge + invalidate",
          data: {
            mergedUrl: Boolean(url),
            mergedKey: Boolean(s3Key),
          },
          timestamp: Date.now(),
          hypothesisId: "B",
        }),
      }).catch(() => {});
      // #endregion
      void queryClient.invalidateQueries({
        queryKey: queryKeys.user.profile(),
      });
      prefetchRemoteImage(url);
    },
    onError: (err: unknown) => {
      // #region agent log
      // eslint-disable-next-line no-restricted-globals -- debug NDJSON ingest (session 244579)
      fetch("http://127.0.0.1:7449/ingest/62a2c70d-285c-439c-8ad0-211f81794197", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "244579",
        },
        body: JSON.stringify({
          sessionId: "244579",
          location: "homeauth/hooks/data/useProfilePictureUpload.ts:onError",
          message: "upload mutation failed",
          data: {
            errName: err instanceof Error ? err.name : "unknown",
            errMsgLen: err instanceof Error ? err.message.length : 0,
          },
          timestamp: Date.now(),
          hypothesisId: "E",
        }),
      }).catch(() => {});
      // #endregion
    },
  });

  const uploadProfilePicture = async (file: File): Promise<void> => {
    await mutation.mutateAsync(file);
  };

  return {
    uploadProfilePicture,
    isUploading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error : null,
  };
}
