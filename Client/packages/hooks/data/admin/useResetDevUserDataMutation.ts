import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { adminApi, type DevUserDataResetScope } from "packages/features/admin/api/admin";
import { useAuthStore } from "packages/store";

export function useResetDevUserDataMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { scopes: DevUserDataResetScope[]; userId?: string }) =>
      adminApi.resetDevUserData(params),
    onSuccess: (result) => {
      const currentId = useAuthStore.getState().user?.id;
      if (currentId && result.target_user_id === currentId) {
        const prev = useAuthStore.getState().user;
        if (prev) {
          useAuthStore.getState().setUser({
            ...prev,
            has_preferences: result.cleared.preferences ? false : prev.has_preferences,
            preferences_version: result.cleared.preferences ? undefined : prev.preferences_version,
            mls_id: result.cleared.profile ? undefined : prev.mls_id,
            brokerage: result.cleared.profile ? undefined : prev.brokerage,
            profile_picture: result.cleared.profile ? undefined : prev.profile_picture,
            profile_picture_url: result.cleared.profile ? undefined : prev.profile_picture_url,
          });
        }
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.docusign.all });
    },
  });
}
