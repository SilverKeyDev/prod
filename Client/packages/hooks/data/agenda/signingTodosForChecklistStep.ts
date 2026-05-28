/**
 * Maps pending DocuSign signing to-dos to the checklist step they belong to.
 */

import type { AgendaTodoDTO } from "packages/features/calendar/types/agenda";
import type { ChecklistType } from "packages/features/checklists/types/checklists";
import type { DocumentData } from "packages/features/documents/hooks/data/useDocumentsData";

/** Checklist category + step id, e.g. `offer.3` (matches AgreementLink.linked_item_id). */
export function checklistStepKey(checklistCategory: ChecklistType, itemId: number): string {
  return `${checklistCategory}.${itemId}`;
}

/** Fallback when API link is missing: title suffix from checklist form send (`(offer · step 3)`). */
const CHECKLIST_STEP_TITLE_SUFFIX = /\(([a-z_]+) · step (\d+)\)\s*$/i;

export function parseChecklistStepKeyFromAgreementTitle(title: string): string | null {
  const match = title.match(CHECKLIST_STEP_TITLE_SUFFIX);
  if (!match) return null;
  return `${match[1]}.${match[2]}`;
}

export function resolveAgreementChecklistStepKey(doc: DocumentData): string | null {
  if (doc.linked_checklist_item_id) {
    return doc.linked_checklist_item_id;
  }
  return parseChecklistStepKeyFromAgreementTitle(doc.filename);
}

/** Pending signing rows that belong to a single checklist step. */
export function signingTodosForChecklistStep(
  todos: AgendaTodoDTO[],
  documents: DocumentData[],
  checklistCategory: ChecklistType,
  itemId: number
): AgendaTodoDTO[] {
  const stepKey = checklistStepKey(checklistCategory, itemId);
  const docById = new Map(documents.map((doc) => [doc.id, doc]));

  return todos.filter((todo) => {
    const agreementId = todo.signing_agreement_id;
    if (!agreementId) return false;
    const doc = docById.get(agreementId);
    if (!doc) return false;
    return resolveAgreementChecklistStepKey(doc) === stepKey;
  });
}
