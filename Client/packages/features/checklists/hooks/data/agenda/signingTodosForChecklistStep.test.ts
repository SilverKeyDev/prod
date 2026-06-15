import { describe, expect, it } from "vitest";

import type { AgendaTodoDTO } from "packages/features/calendar/types/agenda";
import type { DocumentData } from "packages/features/documents/hooks/data/useDocumentsData";

import {
  parseChecklistStepKeyFromAgreementTitle,
  signingTodosForChecklistStep,
} from "./signingTodosForChecklistStep";

describe("parseChecklistStepKeyFromAgreementTitle", () => {
  it("parses checklist form title suffix", () => {
    expect(parseChecklistStepKeyFromAgreementTitle("Buyer Rep (offer · step 2)")).toBe("offer.2");
  });

  it("returns null when suffix is missing", () => {
    expect(parseChecklistStepKeyFromAgreementTitle("Standalone agreement")).toBeNull();
  });
});

describe("signingTodosForChecklistStep", () => {
  const todo = (agreementId: string): AgendaTodoDTO => ({
    id: `signing-${agreementId}`,
    title: "Sign me",
    due_date: null,
    completed: false,
    agenda_item_kind: "signing",
    signing_agreement_id: agreementId,
  });

  const doc = (id: string, stepKey: string | null, title?: string): DocumentData => ({
    id,
    filename: title ?? `Form (${stepKey?.replace(".", " · step ") ?? "unknown"})`,
    file_path: "",
    status: "sent",
    created_at: null,
    updated_at: null,
    user_id: "u1",
    document_type: "agreement",
    address: null,
    library_kind: "agreement",
    linked_checklist_item_id: stepKey,
  });

  it("returns only todos linked to the requested step", () => {
    const todos = [todo("a1"), todo("a2")];
    const documents = [doc("a1", "offer.2"), doc("a2", "financing.1")];

    expect(signingTodosForChecklistStep(todos, documents, "offer", 2)).toEqual([todos[0]]);
    expect(signingTodosForChecklistStep(todos, documents, "financing", 1)).toEqual([todos[1]]);
    expect(signingTodosForChecklistStep(todos, documents, "offer", 1)).toEqual([]);
  });

  it("falls back to agreement title when link id is missing", () => {
    const todos = [todo("a1")];
    const documents = [
      {
        ...doc("a1", null),
        linked_checklist_item_id: undefined,
        filename: "Wire Instructions (escrow · step 4)",
      },
    ];

    expect(signingTodosForChecklistStep(todos, documents, "escrow", 4)).toEqual([todos[0]]);
  });
});
