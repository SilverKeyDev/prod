/**
 * When the user triggers search (button or Enter) without picking from the list,
 * if suggestions are open, select the first one first so geocoding / anchor state match the query.
 */
export async function submitAfterTopSuggestionIfNeeded<T>(params: {
  suggestions: readonly T[];
  /** True after the user chose a row (or committed equivalent), so we should not override. */
  hasSelectedSuggestion: boolean;
  /** If this returns true (e.g. precise street address handled elsewhere), submit is skipped. */
  selectSuggestion: (suggestion: T) => void | boolean | Promise<void | boolean>;
  submit: () => void | Promise<void>;
}): Promise<void> {
  const { suggestions, hasSelectedSuggestion, selectSuggestion, submit } =
    params;
  if (!hasSelectedSuggestion && suggestions.length > 0) {
    const skip = await Promise.resolve(selectSuggestion(suggestions[0]));
    if (skip === true) {
      return;
    }
  }
  await Promise.resolve(submit());
}
