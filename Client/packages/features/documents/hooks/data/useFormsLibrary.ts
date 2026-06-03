/**
 * React Query hook for fetching the forms library (all forms grouped by category).
 */

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { checklistFormsApi } from "packages/features/documents/api/checklistForms";
import type { ChecklistForm } from "packages/features/documents/types/forms";

export type FormCategory = {
  name: string;
  forms: ChecklistForm[];
};

export type UseFormsLibraryResult = {
  categories: FormCategory[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Fetch all forms grouped by category (folder).
 *
 * Returns forms organized by their S3 folder structure.
 * Agent-only data.
 *
 * @param enabled - Whether to fetch forms (default: true)
 *
 * @returns Categories with forms, loading state, and error
 *
 * @example
 * ```typescript
 * const { categories, isLoading } = useFormsLibrary();
 * categories.forEach(cat => {
 *   log.info('DOCUMENTS', 'Forms category', { name: cat.name, count: cat.forms.length });
 * });
 * ```
 */
export const useFormsLibrary = (enabled = true): UseFormsLibraryResult => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.formsLibrary.list(),
    queryFn: () => checklistFormsApi.listFormsLibrary(),
    enabled,
    staleTime: 10 * 60 * 1000, // Forms library is relatively static, cache for 10 minutes
  });

  return {
    categories: data?.categories ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
