import { useQuery } from "@tanstack/react-query";

import { adminApi } from "packages/features/admin/api/admin";

const adminValidationStatsKey = (days: number) => ["admin", "validation-stats", days] as const;

export function useAdminValidationStats(days: number) {
  return useQuery({
    queryKey: adminValidationStatsKey(days),
    queryFn: () => adminApi.getValidationStats(days),
    staleTime: 60 * 1000,
  });
}
