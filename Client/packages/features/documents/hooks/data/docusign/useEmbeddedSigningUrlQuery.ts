import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { docusignApi } from "packages/features/documents/api/docusign";

import { runDocusignApi } from "./docusignMutationHelpers";

type UseEmbeddedSigningUrlQueryOptions = {
  enabled?: boolean;
};

/**
 * Fetches the DocuSign embedded signing URL once per agreement + participant.
 * Uses React Query so StrictMode and remounts dedupe in-flight requests (single network call).
 */
export function useEmbeddedSigningUrlQuery(
  agreementId: string,
  participantId: string,
  options?: UseEmbeddedSigningUrlQueryOptions
) {
  const enabled = (options?.enabled ?? true) && Boolean(agreementId && participantId);

  return useQuery({
    queryKey: queryKeys.docusign.embeddedSigningUrl(agreementId, participantId),
    queryFn: async () => {
      const url = await runDocusignApi(
        { agreementId, participantId },
        "Failed to get signing URL",
        () =>
          docusignApi.getSigningUrl(agreementId, {
            participant_id: participantId,
          }),
        (r) => r.signing_url
      );
      if (!url) {
        throw new Error("Unable to get signing URL");
      }
      return url;
    },
    enabled,
    staleTime: 4 * 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });
}
