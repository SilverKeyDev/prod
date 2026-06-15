import { useQuery } from "@tanstack/react-query";

import { adminApi } from "packages/api/admin";

export const adminValidationStatsQueryKey = (days: number) =>
  ["admin", "validation-stats", days] as const;

export function useAdminValidationStats(days: number) {
  return useQuery({
    queryKey: adminValidationStatsQueryKey(days),
    queryFn: () => adminApi.getValidationStats(days),
    select: (result) => result.data,
  });
}
