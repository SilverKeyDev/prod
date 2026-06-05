import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adminApi, type UpdateUserSystemRolesRequest } from "packages/api/admin";

import { ADMIN_GATE_USERS_QUERY_KEY } from "./useAdminGateUsersList";

export function useUpdateUserSystemRolesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateUserSystemRolesRequest) => adminApi.updateUserSystemRoles(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_GATE_USERS_QUERY_KEY });
    },
  });
}
