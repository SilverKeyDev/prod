import type { WikiPageRecord, WikiTocItem, WikiTreeNode } from "packages/features/admin/types/wiki";
import {
  ADMIN_BASE_PATH,
  ADMIN_ROUTE_SEGMENTS,
} from "packages/features/admin/utils/navigation/adminNavConfig";

export const WIKI_BASE_PATH = `${ADMIN_BASE_PATH}/${ADMIN_ROUTE_SEGMENTS.wiki}` as const;

/** Strip `/admin/wiki` prefix from a router pathname. */
export function wikiDocPathFromRoute(pathname: string): string {
  const prefix = `${WIKI_BASE_PATH}/`;
  if (pathname === WIKI_BASE_PATH || pathname === `${WIKI_BASE_PATH}/`) {
    return "";
  }
  if (!pathname.startsWith(prefix)) {
    return "";
  }
  return pathname.slice(prefix.length).replace(/\/+$/, "");
}

export function wikiHrefForDocPath(docPath: string): string {
  if (!docPath) {
    return WIKI_BASE_PATH;
  }
  return `${WIKI_BASE_PATH}/${docPath}`;
}

/**
 * Resolve a requested wiki path to a page key.
 * Folders resolve to `path/README` when present; empty path → root `README`.
 */
export function resolveWikiPageKey(
  requestedPath: string,
  pages: Record<string, WikiPageRecord>
): string | null {
  const normalized = requestedPath.replace(/^\/+|\/+$/g, "");
  if (pages[normalized]) {
    return normalized;
  }
  const readmeKey = normalized ? `${normalized}/README` : "README";
  if (pages[readmeKey]) {
    return readmeKey;
  }
  return null;
}

export function filterWikiTree(nodes: readonly WikiTreeNode[], query: string): WikiTreeNode[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [...nodes];
  }

  const filterNode = (node: WikiTreeNode): WikiTreeNode | null => {
    if (node.type === "page") {
      const haystack = `${node.title} ${node.path} ${node.label}`.toLowerCase();
      return haystack.includes(q) ? node : null;
    }
    const children = node.children
      .map((child) => filterNode(child))
      .filter((child): child is WikiTreeNode => child !== null);
    const selfMatch = `${node.label} ${node.path}`.toLowerCase().includes(q);
    if (children.length === 0 && !selfMatch) {
      return null;
    }
    return { ...node, children };
  };

  return nodes.map((n) => filterNode(n)).filter((n): n is WikiTreeNode => n !== null);
}

/** Paths of folders that should stay expanded for the active page. */
export function expandPathsForActive(activePath: string): Set<string> {
  const expanded = new Set<string>();
  if (!activePath) return expanded;
  const parts = activePath.split("/");
  let acc = "";
  for (let i = 0; i < parts.length - 1; i++) {
    acc = acc ? `${acc}/${parts[i]}` : (parts[i] ?? "");
    if (acc) expanded.add(acc);
  }
  return expanded;
}

export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function extractWikiToc(markdown: string): WikiTocItem[] {
  const items: WikiTocItem[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const match = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!match) continue;
    const level = match[1]!.length as 2 | 3;
    const text = match[2]!.replace(/#+\s*$/, "").trim();
    if (!text) continue;
    items.push({ id: slugifyHeading(text), text, level });
  }
  return items;
}

/**
 * Rewrite a relative markdown href (e.g. `../foo.md` or `./bar.md`) to a wiki route path.
 */
export function resolveRelativeWikiHref(href: string, currentDocPath: string): string | null {
  if (!href || href.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(href)) {
    return null;
  }
  const withoutHash = href.split("#")[0] ?? "";
  if (!withoutHash) {
    return null;
  }
  if (!withoutHash.endsWith(".md") && !withoutHash.includes(".md")) {
    // Allow extensionless relative paths that look like docs
    if (!withoutHash.startsWith(".") && !withoutHash.includes("/")) {
      return null;
    }
  }

  const currentDir = currentDocPath.includes("/")
    ? currentDocPath.slice(0, currentDocPath.lastIndexOf("/"))
    : "";
  const raw = withoutHash.replace(/\.md$/i, "");
  const segments = (currentDir ? `${currentDir}/` : "").concat(raw).split("/");
  const stack: string[] = [];
  for (const seg of segments) {
    if (!seg || seg === ".") continue;
    if (seg === "..") {
      stack.pop();
      continue;
    }
    stack.push(seg);
  }
  return stack.join("/");
}

export function breadcrumbSegments(docPath: string): { label: string; path: string }[] {
  if (!docPath) {
    return [{ label: "Documentation", path: "" }];
  }
  const parts = docPath.split("/");
  const segs: { label: string; path: string }[] = [{ label: "Documentation", path: "" }];
  let acc = "";
  for (const part of parts) {
    acc = acc ? `${acc}/${part}` : part;
    const label = part === "README" ? "Overview" : part.replace(/[-_]+/g, " ");
    segs.push({ label, path: acc });
  }
  return segs;
}
