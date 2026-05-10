import { useQuery } from "@tanstack/react-query";

import { adminApi } from "packages/api/admin";
import { queryKeys } from "packages/config/query/keys";

const adminValidationStatsKey = (days?: number) =>
  [...queryKeys.user.all, "admin", "validation-stats", days ?? "default"] as const;

export function useAdminValidationStats(days?: number) {
  return useQuery({
    queryKey: adminValidationStatsKey(days),
    queryFn: () => adminApi.getValidationStats(days),
    staleTime: 60 * 1000,
  });
}
