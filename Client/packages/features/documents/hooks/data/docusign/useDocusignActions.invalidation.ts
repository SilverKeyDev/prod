import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";

/**
 * DocuSign list/detail/template cache invalidation used by useDocusignActions mutations.
 */
export function createDocusignQueryInvalidators(queryClient: QueryClient) {
  const invalidateAgreements = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.docusign.agreements(),
    });
  };

  const invalidateAgreementAndList = (agreementId: string) => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.docusign.agreement(agreementId),
    });
    invalidateAgreements();
  };

  const invalidateTemplates = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.docusign.templates(),
    });
  };

  return { invalidateAgreements, invalidateAgreementAndList, invalidateTemplates };
}
