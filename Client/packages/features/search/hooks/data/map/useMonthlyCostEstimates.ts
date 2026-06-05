import { useQuery } from "@tanstack/react-query";

import { searchApi } from "packages/api";
import { queryKeys } from "packages/config/query/keys";

export type MonthlyCostEstimatesData = {
  hoaMonthly: number;
  utilitiesMonthly: number;
};

function normalizeZipForQuery(zipcode: string): string {
  const digits = zipcode.replace(/\D/g, "");
  return digits.length >= 5 ? digits.slice(0, 5) : "";
}

/**
 * Fetches placeholder HOA and area-utility monthly amounts (currently zero from API).
 */
export function useMonthlyCostEstimates(zipcode: string | undefined | null) {
  const normalized = zipcode ? normalizeZipForQuery(zipcode.trim()) : "";
  const enabled = normalized.length === 5;

  return useQuery({
    queryKey: queryKeys.search.monthlyCostEstimates(normalized),
    queryFn: async ({ signal }) => {
      const resp = await searchApi.getMonthlyCostEstimates({ zipcode: normalized }, { signal });
      if (!resp.success) {
        throw new Error(resp.message ?? resp.error ?? "Monthly cost estimates request failed");
      }
      const data: MonthlyCostEstimatesData = {
        hoaMonthly: Number(resp.hoa_monthly ?? 0),
        utilitiesMonthly: Number(resp.utilities_monthly ?? 0),
      };
      return data;
    },
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
