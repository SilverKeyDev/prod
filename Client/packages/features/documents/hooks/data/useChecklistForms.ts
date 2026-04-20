/**
 * React Query hook for fetching checklist forms.
 */

import { useQuery } from "@tanstack/react-query";

import { checklistFormsApi } from "packages/features/documents/api/checklistForms";
import type { ChecklistForm } from "packages/features/documents/types/forms";

export type UseChecklistFormsResult = {
  forms: ChecklistForm[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Fetch forms available for a specific checklist step.
 *
 * Forms are defined in the step's suggested_form_ids field and returned with
 * presigned download URLs.
 *
 * @param transactionId - Transaction ID
 * @param section - Checklist section (e.g. "escrow", "financing")
 * @param itemId - Step ID within the section
 * @param enabled - Whether to fetch forms (default: true)
 *
 * @returns Forms data, loading state, and error
 *
 * @example
 * ```typescript
 * const { forms, isLoading } = useChecklistForms("tx-123", "escrow", 2);
 * ```
 */
export const useChecklistForms = (
  transactionId: string,
  section: string,
  itemId: number,
  enabled = true
): UseChecklistFormsResult => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["checklist-forms", transactionId, section, itemId],
    queryFn: () => checklistFormsApi.getFormsForStep(transactionId, section, itemId),
    enabled: enabled && !!transactionId && !!section && itemId > 0,
    staleTime: 5 * 60 * 1000, // Forms are relatively static, cache for 5 minutes
  });

  return {
    forms: data?.forms ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
