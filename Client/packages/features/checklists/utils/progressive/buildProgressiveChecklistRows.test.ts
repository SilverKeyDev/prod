import { describe, expect, it } from "vitest";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";

import {
  buildProgressiveChecklistRows,
  DEFAULT_CHECKLIST_PREVIEW_UPCOMING,
  getChecklistActiveIndex,
  shouldUseProgressiveDisclosure,
} from "./buildProgressiveChecklistRows";

function item(id: number, order?: number): TaskChecklistItem {
  return {
    id,
    label: `L${id}`,
    explanation: "",
    order: order ?? null,
  };
}

describe("shouldUseProgressiveDisclosure", () => {
  it("is false for six or fewer items", () => {
    expect(shouldUseProgressiveDisclosure(6)).toBe(false);
  });

  it("is true for seven or more items", () => {
    expect(shouldUseProgressiveDisclosure(7)).toBe(true);
  });
});

describe("getChecklistActiveIndex", () => {
  const items = [item(1), item(2), item(3)];

  it("returns list length when active is null", () => {
    expect(getChecklistActiveIndex(items, null)).toBe(3);
  });

  it("returns index of active id", () => {
    expect(getChecklistActiveIndex(items, 2)).toBe(1);
  });
});

describe("buildProgressiveChecklistRows", () => {
  const preview = DEFAULT_CHECKLIST_PREVIEW_UPCOMING;

  it("returns flat_item segments when under threshold", () => {
    const items = [item(1), item(2), item(3), item(4), item(5), item(6)];
    const rows = buildProgressiveChecklistRows(items, 1, {
      previewUpcoming: preview,
      futureOpen: false,
    });
    expect(rows.length).toBe(6);
    expect(rows.every((r) => r.kind === "flat_item")).toBe(true);
  });

  it("splits completed, current, preview, and hidden future for long lists", () => {
    const items = Array.from({ length: 12 }, (_, i) => item(i + 1));
    const activeId = 5;
    const activeIndex = 4;
    const rows = buildProgressiveChecklistRows(items, activeId, {
      previewUpcoming: preview,
      futureOpen: false,
    });

    expect(rows[0]).toEqual({ kind: "completed_collapsed", count: 4 });
    expect(rows[1]).toMatchObject({ kind: "current", item: items[activeIndex] });
    expect(rows[2]?.kind).toBe("upcoming");
    expect(rows[3]?.kind).toBe("upcoming");
    expect(rows[4]?.kind).toBe("upcoming");
    expect(rows[5]).toEqual({ kind: "future_collapsed", count: 4 });
    expect(rows.length).toBe(6);
  });

  it("shows one revealed completed row while keeping the rest collapsed", () => {
    const items = Array.from({ length: 10 }, (_, i) => item(i + 1));
    const rows = buildProgressiveChecklistRows(items, 4, {
      previewUpcoming: preview,
      futureOpen: false,
      revealedCompletedItemId: 2,
    });
    expect(rows[0]).toEqual({ kind: "completed_collapsed", count: 1 });
    expect(rows[1]).toMatchObject({ kind: "completed_item", item: items[1] });
    expect(rows[2]).toEqual({ kind: "completed_collapsed", count: 1 });
    expect(rows[3]).toMatchObject({ kind: "current", item: items[3] });
  });

  it("handles all complete (active null)", () => {
    const items = [item(1), item(2), item(3), item(4), item(5), item(6), item(7)];
    const rows = buildProgressiveChecklistRows(items, null, {
      previewUpcoming: preview,
      futureOpen: false,
    });
    expect(rows).toEqual([{ kind: "completed_collapsed", count: 7 }]);
  });

  it("has no future_collapsed when no hidden tail", () => {
    const items = Array.from({ length: 10 }, (_, i) => item(i + 1));
    const rows = buildProgressiveChecklistRows(items, 7, {
      previewUpcoming: preview,
      futureOpen: false,
    });
    const kinds = rows.map((r) => r.kind);
    expect(kinds).not.toContain("future_collapsed");
  });
});
