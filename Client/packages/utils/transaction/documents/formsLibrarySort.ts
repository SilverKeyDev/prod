import type { ChecklistForm } from "packages/features/documents/types/forms";
import { dateParseISO } from "packages/utils/core/date";

const FORMS_SORT_IDS = new Set(["date_desc", "date_asc", "name_asc"]);
const FORMS_SORT_DEFAULT = "date_desc";

function formTimestampMs(form: ChecklistForm): number {
  const v = form.created_at ?? form.updated_at;
  if (v == null || v === "") return 0;
  return typeof v === "number" ? v : dateParseISO(v).valueOf();
}

export function sortChecklistFormsForLibrary(
  forms: ChecklistForm[],
  sortId: string
): ChecklistForm[] {
  const key = FORMS_SORT_IDS.has(sortId) ? sortId : FORMS_SORT_DEFAULT;
  const copy = [...forms];
  copy.sort((a, b) => {
    if (key === "name_asc") {
      return (a.title || "").toLowerCase().localeCompare((b.title || "").toLowerCase());
    }
    const ta = formTimestampMs(a);
    const tb = formTimestampMs(b);
    return key === "date_asc" ? ta - tb : tb - ta;
  });
  return copy;
}

export type FormCategoryLike = { name: string; forms: ChecklistForm[] };

export function maxFormTimestampMsInCategory(category: FormCategoryLike): number {
  let max = 0;
  for (const f of category.forms) {
    const t = formTimestampMs(f);
    if (t > max) max = t;
  }
  return max;
}

export function sortFormCategoriesForLibrary<T extends FormCategoryLike>(
  categories: T[],
  sortId: string
): T[] {
  const key = FORMS_SORT_IDS.has(sortId) ? sortId : FORMS_SORT_DEFAULT;
  const copy = categories.map((c) => ({
    ...c,
    forms: sortChecklistFormsForLibrary(c.forms, sortId),
  }));
  copy.sort((a, b) => {
    if (key === "name_asc") {
      return a.name.localeCompare(b.name);
    }
    const ta = maxFormTimestampMsInCategory(a);
    const tb = maxFormTimestampMsInCategory(b);
    return key === "date_asc" ? ta - tb : tb - ta;
  });
  return copy;
}
