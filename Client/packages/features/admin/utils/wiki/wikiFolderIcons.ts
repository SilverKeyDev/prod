import type { IconName } from "packages/ui/types/icons";

/**
 * Icons for known documentation folder slugs (any depth).
 * Unmapped root hubs fall back to `library`; deeper unmapped folders use nest generics.
 */
const FOLDER_ICONS: Readonly<Record<string, IconName>> = {
  // Top-level hubs
  architecture: "building-2",
  features: "sparkles",
  "getting-started": "footprints",
  guides: "lightbulb",
  internal: "folder-lock",
  policies: "shield",
  reference: "bookmark",
  runbooks: "clipboard-check",
  // Nested hubs
  posthog: "bar-chart-2",
  qa: "check-square",
  messaging: "message-square",
  tooling: "settings-2",
  patterns: "grid-3x3",
  platform: "building",
  account: "user",
  admin: "key",
  search: "search",
  "transaction-management": "handshake",
  "component-audit": "git-compare",
  "platform-variants": "square",
  // Optional hubs that may appear under documentation/
  security: "lock",
  transactions: "handshake",
  reels: "video",
  dev: "bot",
};

/**
 * Folder glyph for the wiki tree: named icons when mapped, else depth defaults.
 */
export function wikiFolderIcon(folderName: string, depth: number): IconName {
  const named = FOLDER_ICONS[folderName];
  if (named) {
    return named;
  }
  if (depth <= 0) {
    return "library";
  }
  if (depth === 1) {
    return "folder";
  }
  return "folders";
}
