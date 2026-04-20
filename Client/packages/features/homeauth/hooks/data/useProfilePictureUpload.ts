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
      void queryClient.invalidateQueries({
        queryKey: queryKeys.user.profile(),
      });
      prefetchRemoteImage(url);
    },
    onError: (_err: unknown) => {},
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
