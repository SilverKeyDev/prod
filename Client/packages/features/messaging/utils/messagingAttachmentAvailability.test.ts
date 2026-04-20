import { describe, expect, it } from "vitest";

import type { DocumentData } from "packages/features/documents";

import {
  isAgreementMessagingAttachmentUnavailable,
  isChecklistFormMessagingAttachmentUnavailable,
} from "./messagingAttachmentAvailability";

function doc(overrides: Partial<DocumentData>): DocumentData {
  return {
    id: "d1",
    filename: "f.pdf",
    file_path: "/p",
    status: "active",
    created_at: null,
    updated_at: null,
    user_id: "u1",
    document_type: null,
    address: null,
    ...overrides,
  };
}

describe("isAgreementMessagingAttachmentUnavailable", () => {
  it("returns false while loading or when documents error", () => {
    const documents = [doc({ id: "a1", library_kind: "agreement" })];
    expect(isAgreementMessagingAttachmentUnavailable("a1", documents, true, null)).toBe(false);
    expect(isAgreementMessagingAttachmentUnavailable("a1", documents, false, "network")).toBe(
      false
    );
  });

  it("returns true when agreement id is not in library after successful load", () => {
    expect(
      isAgreementMessagingAttachmentUnavailable(
        "missing",
        [doc({ id: "u1", library_kind: "upload" })],
        false,
        null
      )
    ).toBe(true);
  });

  it("returns false when matching agreement row exists", () => {
    expect(
      isAgreementMessagingAttachmentUnavailable(
        "a1",
        [doc({ id: "a1", library_kind: "agreement" })],
        false,
        null
      )
    ).toBe(false);
  });
});

describe("isChecklistFormMessagingAttachmentUnavailable", () => {
  const form = (overrides: Partial<{ id: string; download_url: string }>) => ({
    id: "f1",
    form_key: "k",
    title: "T",
    download_url: "https://example.com/x",
    ...overrides,
  });

  it("returns true when download URL is empty", () => {
    expect(
      isChecklistFormMessagingAttachmentUnavailable(form({ download_url: "" }), {
        formsLibraryLoading: false,
        formsLibraryError: null,
        checklistFormIdsInLibrary: new Set(["f1"]),
      })
    ).toBe(true);
  });

  it("returns false while loading, on library error, or when not verifying (null set)", () => {
    const opts = {
      formsLibraryLoading: true,
      formsLibraryError: null,
      checklistFormIdsInLibrary: new Set<string>(),
    } as const;
    expect(
      isChecklistFormMessagingAttachmentUnavailable(form(), {
        ...opts,
        formsLibraryLoading: true,
      })
    ).toBe(false);
    expect(
      isChecklistFormMessagingAttachmentUnavailable(form(), {
        formsLibraryLoading: false,
        formsLibraryError: new Error("x"),
        checklistFormIdsInLibrary: new Set(),
      })
    ).toBe(false);
    expect(
      isChecklistFormMessagingAttachmentUnavailable(form(), {
        formsLibraryLoading: false,
        formsLibraryError: null,
        checklistFormIdsInLibrary: null,
      })
    ).toBe(false);
  });

  it("returns true when agent library loaded and form id is missing", () => {
    expect(
      isChecklistFormMessagingAttachmentUnavailable(form({ id: "gone" }), {
        formsLibraryLoading: false,
        formsLibraryError: null,
        checklistFormIdsInLibrary: new Set(["other"]),
      })
    ).toBe(true);
  });

  it("returns false when form id is in library", () => {
    expect(
      isChecklistFormMessagingAttachmentUnavailable(form({ id: "f1" }), {
        formsLibraryLoading: false,
        formsLibraryError: null,
        checklistFormIdsInLibrary: new Set(["f1"]),
      })
    ).toBe(false);
  });
});
