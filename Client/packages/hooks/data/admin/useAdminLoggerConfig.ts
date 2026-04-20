import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi, type ServerLoggerConfig } from "packages/config/http/api";
import { queryKeys } from "packages/config/query/keys";

const adminLoggerKey = () => [...queryKeys.user.all, "admin", "logger-config"] as const;

export function useAdminLoggerConfig() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: adminLoggerKey(),
    queryFn: () => adminApi.getLoggerConfig(),
    staleTime: 60 * 1000,
  });

  return {
    config: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useUpdateAdminLoggerConfig() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (updates: Partial<ServerLoggerConfig>) => adminApi.updateLoggerConfig(updates),
    onSuccess: (config) => {
      queryClient.setQueryData(adminLoggerKey(), config);
    },
  });

  return mutation;
}
