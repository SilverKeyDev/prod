import type { ChecklistForm } from "packages/features/documents/types/forms";
import { formatDate } from "packages/features/search/types/search/formatters/address";
import type { DocumentData } from "packages/ui/components/cards/document/types";

/** Maps a library checklist form to `DocumentData` so it can use `DocumentCard`. */
export function checklistFormToDocumentData(form: ChecklistForm): DocumentData {
  const created = form.updated_at ?? form.created_at ?? null;
  return {
    id: form.id,
    filename: `${form.title.replace(/[/\\?%*:|"<>]/g, "-")}.pdf`,
    file_path: form.s3_template_path ?? "",
    status: "",
    created_at: created,
    updated_at: form.updated_at ?? form.created_at ?? null,
    user_id: "",
    document_type: "report",
    address: null,
  };
}

export function formatFormLibraryCardDate(form: ChecklistForm): string {
  const raw = form.updated_at ?? form.created_at;
  return raw ? formatDate(raw) : "—";
}
