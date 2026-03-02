import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";

import { userApi } from "@/features/homeauth/api/user";

export type UseProfilePictureUploadReturn = {
  uploadProfilePicture: (file: File) => Promise<void>;
  isUploading: boolean;
  error: Error | null;
};

export function useProfilePictureUpload(): UseProfilePictureUploadReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (file: File) => userApi.uploadProfilePicture(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.user.profile(),
      });
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
