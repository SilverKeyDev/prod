import { describe, expect, it } from "vitest";

import type { ChecklistForm } from "packages/features/documents/types/forms";

import {
  maxFormTimestampMsInCategory,
  sortChecklistFormsForLibrary,
  sortFormCategoriesForLibrary,
} from "./formsLibrarySort";

const form = (
  overrides: Partial<ChecklistForm> & Pick<ChecklistForm, "id" | "title">
): ChecklistForm => ({
  id: overrides.id,
  form_key: overrides.form_key ?? "k",
  title: overrides.title,
  description: overrides.description,
  download_url: overrides.download_url ?? "https://example.com/x.pdf",
  s3_template_path: overrides.s3_template_path ?? "p",
  created_at: overrides.created_at,
  updated_at: overrides.updated_at,
});

describe("sortChecklistFormsForLibrary", () => {
  it("sorts by title for name_asc", () => {
    const list = [form({ id: "1", title: "Zebra" }), form({ id: "2", title: "Alpha" })];
    const sorted = sortChecklistFormsForLibrary(list, "name_asc");
    expect(sorted.map((f) => f.title)).toEqual(["Alpha", "Zebra"]);
  });

  it("sorts by created_at for date_desc", () => {
    const list = [
      form({ id: "1", title: "old", created_at: "2020-01-01T00:00:00Z" }),
      form({ id: "2", title: "new", created_at: "2024-01-01T00:00:00Z" }),
    ];
    const sorted = sortChecklistFormsForLibrary(list, "date_desc");
    expect(sorted.map((f) => f.id)).toEqual(["2", "1"]);
  });
});

describe("sortFormCategoriesForLibrary", () => {
  it("orders categories by max form date when date_desc", () => {
    const cats = [
      { name: "a", forms: [form({ id: "1", title: "x", created_at: "2020-01-01T00:00:00Z" })] },
      { name: "b", forms: [form({ id: "2", title: "y", created_at: "2025-01-01T00:00:00Z" })] },
    ];
    const sorted = sortFormCategoriesForLibrary(cats, "date_desc");
    expect(sorted.map((c) => c.name)).toEqual(["b", "a"]);
  });
});

describe("maxFormTimestampMsInCategory", () => {
  it("returns max timestamp", () => {
    const c = {
      name: "c",
      forms: [
        form({ id: "1", title: "a", created_at: "2020-01-01T00:00:00Z" }),
        form({ id: "2", title: "b", created_at: "2024-01-01T00:00:00Z" }),
      ],
    };
    expect(maxFormTimestampMsInCategory(c)).toBeGreaterThan(0);
  });
});
