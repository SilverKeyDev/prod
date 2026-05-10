import { useMutation } from "@tanstack/react-query";

import { adminApi, type UpdateUserSystemRolesRequest } from "packages/api/admin";

export function useUpdateUserSystemRolesMutation() {
  return useMutation({
    mutationFn: (body: UpdateUserSystemRolesRequest) => adminApi.updateUserSystemRoles(body),
  });
}
