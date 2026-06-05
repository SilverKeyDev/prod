import { useQuery } from "@tanstack/react-query";

import { adminApi } from "packages/api/admin";

export const ADMIN_GATE_USERS_QUERY_KEY = ["admin", "gate-users"] as const;

export function useAdminGateUsersList() {
  return useQuery({
    queryKey: ADMIN_GATE_USERS_QUERY_KEY,
    queryFn: () => adminApi.listGateRoleUsers(),
  });
}
