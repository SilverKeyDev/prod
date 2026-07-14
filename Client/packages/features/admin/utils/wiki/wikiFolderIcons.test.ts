import { describe, expect, it } from "vitest";

import { wikiFolderIcon } from "packages/features/admin/utils/wiki/wikiFolderIcons";

describe("wikiFolderIcon", () => {
  it("maps known top-level hubs to specialized icons", () => {
    expect(wikiFolderIcon("architecture", 0)).toBe("building-2");
    expect(wikiFolderIcon("features", 0)).toBe("sparkles");
    expect(wikiFolderIcon("getting-started", 0)).toBe("footprints");
    expect(wikiFolderIcon("guides", 0)).toBe("lightbulb");
    expect(wikiFolderIcon("internal", 0)).toBe("folder-lock");
    expect(wikiFolderIcon("policies", 0)).toBe("shield");
    expect(wikiFolderIcon("reference", 0)).toBe("bookmark");
    expect(wikiFolderIcon("runbooks", 0)).toBe("clipboard-check");
  });

  it("maps known nested hubs by name at any depth", () => {
    expect(wikiFolderIcon("posthog", 1)).toBe("bar-chart-2");
    expect(wikiFolderIcon("qa", 1)).toBe("check-square");
    expect(wikiFolderIcon("messaging", 1)).toBe("message-square");
    expect(wikiFolderIcon("tooling", 1)).toBe("settings-2");
  });

  it("falls back to library for unknown top-level hubs", () => {
    expect(wikiFolderIcon("unknown-hub", 0)).toBe("library");
  });

  it("uses generic nest icons for unknown folders below the root", () => {
    expect(wikiFolderIcon("unknown-hub", 1)).toBe("folder");
    expect(wikiFolderIcon("unknown-hub", 2)).toBe("folders");
  });
});
