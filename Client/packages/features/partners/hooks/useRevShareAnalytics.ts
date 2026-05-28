import { useQuery } from "@tanstack/react-query";

import { partnersApi } from "packages/features/partners/api/partners";

export function useRevShareAnalytics(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "rev-share-analytics", partnerId],
    queryFn: () =>
      partnersApi.getAnalytics({
        partner_id: partnerId!,
        bucket: "day",
      }),
    enabled: Boolean(partnerId),
  });
}
