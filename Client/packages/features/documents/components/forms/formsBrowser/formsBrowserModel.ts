import type { FormCategory } from "packages/features/documents/hooks/data/useFormsLibrary";
import type { ChecklistForm } from "packages/features/documents/types/forms";
import {
  formatFormsLibraryCategoryLabel,
  sortFormCategoriesForLibrary,
} from "packages/utils/transaction/documents";

export function formMatchesSearch(form: ChecklistForm, q: string): boolean {
  const hay =
    `${form.title} ${form.description ?? ""} ${form.form_key} ${form.category ?? ""}`.toLowerCase();
  return hay.includes(q);
}

export function buildProcessedFormCategories(
  categories: FormCategory[],
  librarySortKey: string,
  searchTerm: string
): FormCategory[] {
  const sorted = sortFormCategoriesForLibrary(categories, librarySortKey);
  const q = searchTerm.trim().toLowerCase();
  if (!q) return sorted;
  return sorted
    .map((cat) => {
      const label = formatFormsLibraryCategoryLabel(cat.name).toLowerCase();
      const categoryMatches = label.includes(q);
      const nextForms = categoryMatches
        ? cat.forms
        : cat.forms.filter((f) => formMatchesSearch(f, q));
      return { ...cat, forms: nextForms };
    })
    .filter((cat) => cat.forms.length > 0);
}

export function buildFormIdMap(processedCategories: FormCategory[]): Map<string, ChecklistForm> {
  const map = new Map<string, ChecklistForm>();
  for (const cat of processedCategories) {
    for (const form of cat.forms) {
      map.set(form.id, form);
    }
  }
  return map;
}
