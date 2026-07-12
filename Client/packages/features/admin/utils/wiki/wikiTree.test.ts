import { describe, expect, it } from "vitest";

import type { WikiPageRecord, WikiTreeNode } from "packages/features/admin/types/wiki";
import {
  breadcrumbSegments,
  expandPathsForActive,
  extractWikiToc,
  filterWikiTree,
  resolveRelativeWikiHref,
  resolveWikiPageKey,
  slugifyHeading,
  WIKI_BASE_PATH,
  wikiDocPathFromRoute,
  wikiHrefForDocPath,
} from "packages/features/admin/utils/wiki/wikiTree";

describe("wikiTree", () => {
  const pages: Record<string, WikiPageRecord> = {
    README: { title: "Docs", content: "# Docs" },
    "client/README": { title: "Client", content: "# Client" },
    "client/architecture/thin-app-architecture": {
      title: "Thin app",
      content: "# Thin\n\n## Overview\n\n### Details\n",
    },
  };

  it("wikiDocPathFromRoute strips /admin/wiki prefix", () => {
    expect(wikiDocPathFromRoute(WIKI_BASE_PATH)).toBe("");
    expect(wikiDocPathFromRoute(`${WIKI_BASE_PATH}/client/README`)).toBe("client/README");
  });

  it("wikiHrefForDocPath builds deep links", () => {
    expect(wikiHrefForDocPath("")).toBe(WIKI_BASE_PATH);
    expect(wikiHrefForDocPath("client/architecture/foo")).toBe(
      `${WIKI_BASE_PATH}/client/architecture/foo`
    );
  });

  it("resolveWikiPageKey maps folders to README and empty path to root README", () => {
    expect(resolveWikiPageKey("", pages)).toBe("README");
    expect(resolveWikiPageKey("client", pages)).toBe("client/README");
    expect(resolveWikiPageKey("client/architecture/thin-app-architecture", pages)).toBe(
      "client/architecture/thin-app-architecture"
    );
    expect(resolveWikiPageKey("missing", pages)).toBeNull();
  });

  it("filterWikiTree keeps matching pages and ancestor folders", () => {
    const tree: WikiTreeNode[] = [
      {
        type: "folder",
        name: "client",
        label: "Client",
        path: "client",
        children: [
          {
            type: "page",
            name: "thin-app-architecture.md",
            label: "Thin app",
            path: "client/architecture/thin-app-architecture",
            title: "Thin app architecture",
          },
          {
            type: "page",
            name: "other.md",
            label: "Other",
            path: "client/other",
            title: "Other page",
          },
        ],
      },
    ];
    const filtered = filterWikiTree(tree, "thin");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.type).toBe("folder");
    if (filtered[0]?.type === "folder") {
      expect(filtered[0].children).toHaveLength(1);
      expect(filtered[0].children[0]?.path).toBe("client/architecture/thin-app-architecture");
    }
  });

  it("expandPathsForActive expands parent folders", () => {
    const set = expandPathsForActive("client/architecture/thin-app-architecture");
    expect(set.has("client")).toBe(true);
    expect(set.has("client/architecture")).toBe(true);
    expect(set.has("client/architecture/thin-app-architecture")).toBe(false);
  });

  it("extractWikiToc reads h2 and h3 headings", () => {
    const toc = extractWikiToc(pages["client/architecture/thin-app-architecture"]!.content);
    expect(toc).toEqual([
      { id: "overview", text: "Overview", level: 2 },
      { id: "details", text: "Details", level: 3 },
    ]);
  });

  it("slugifyHeading normalizes text", () => {
    expect(slugifyHeading("Hello World!")).toBe("hello-world");
  });

  it("resolveRelativeWikiHref rewrites relative md links", () => {
    expect(resolveRelativeWikiHref("./foo.md", "client/architecture/bar")).toBe(
      "client/architecture/foo"
    );
    expect(resolveRelativeWikiHref("../standards/linting.md", "client/architecture/bar")).toBe(
      "client/standards/linting"
    );
    expect(resolveRelativeWikiHref("https://example.com", "client/bar")).toBeNull();
    expect(resolveRelativeWikiHref("#section", "client/bar")).toBeNull();
  });

  it("breadcrumbSegments builds trail", () => {
    const segs = breadcrumbSegments("client/README");
    expect(segs[0]?.label).toBe("Documentation");
    expect(segs[segs.length - 1]?.label).toBe("Overview");
  });
});
