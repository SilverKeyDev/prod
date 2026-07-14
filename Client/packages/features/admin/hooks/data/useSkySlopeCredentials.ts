import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type BrokerageSkySlopeCredentialCreateRequest,
  type BrokerageSkySlopeCredentialUpdateRequest,
  skyslopeCredentialsApi,
} from "packages/features/admin/api/skyslopeCredentials";

export const skyslopeCredentialQueryKey = (brokerageId: string | null) =>
  ["admin", "skyslope-credential", brokerageId] as const;

export function useSkySlopeCredential(brokerageId: string | null) {
  const trimmed = brokerageId?.trim() ?? "";
  return useQuery({
    queryKey: skyslopeCredentialQueryKey(trimmed || null),
    queryFn: () => skyslopeCredentialsApi.getCredential(trimmed),
    enabled: trimmed.length > 0,
    retry: false,
  });
}

export function useSaveSkySlopeCredential(brokerageId: string | null) {
  const qc = useQueryClient();
  const trimmed = brokerageId?.trim() ?? "";

  return useMutation({
    mutationFn: async (params: {
      isConfigured: boolean;
      body: BrokerageSkySlopeCredentialCreateRequest | BrokerageSkySlopeCredentialUpdateRequest;
    }) => {
      if (!trimmed) {
        throw new Error("Select a brokerage first.");
      }
      if (params.isConfigured) {
        return skyslopeCredentialsApi.updateCredential(
          trimmed,
          params.body as BrokerageSkySlopeCredentialUpdateRequest
        );
      }
      return skyslopeCredentialsApi.createCredential(
        trimmed,
        params.body as BrokerageSkySlopeCredentialCreateRequest
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: skyslopeCredentialQueryKey(trimmed || null) });
    },
  });
}

export function useTestSkySlopeConnection(brokerageId: string | null) {
  const trimmed = brokerageId?.trim() ?? "";
  return useMutation({
    mutationFn: () => {
      if (!trimmed) {
        throw new Error("Select a brokerage first.");
      }
      return skyslopeCredentialsApi.testConnection(trimmed);
    },
  });
}

export function useDeleteSkySlopeCredential(brokerageId: string | null) {
  const qc = useQueryClient();
  const trimmed = brokerageId?.trim() ?? "";

  return useMutation({
    mutationFn: () => {
      if (!trimmed) {
        throw new Error("Select a brokerage first.");
      }
      return skyslopeCredentialsApi.deleteCredential(trimmed);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: skyslopeCredentialQueryKey(trimmed || null) });
    },
  });
}
