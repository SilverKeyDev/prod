import path from "path";

/**
 * Vite `resolve` block (aliases, extensions, dedupe) shared from vite.config.js
 * to keep the defineConfig callback under max-lines-per-function.
 */
export function buildWebViteResolve(packages, uiComponents, dirname) {
  return {
    conditions: ["web", "import", "module", "browser", "default"],
    alias: [
      { find: "packages/types", replacement: path.join(packages, "types") },
      { find: "packages/types/", replacement: path.join(packages, "types/") },
      {
        find: "packages/hooks/data/auth",
        replacement: path.join(packages, "features/homeauth/hooks/data"),
      },
      {
        find: "packages/hooks/data/chat",
        replacement: path.join(packages, "features/messaging/hooks/data"),
      },
      {
        find: "packages/features/agent/src",
        replacement: path.join(packages, "features/agent/components"),
      },
      {
        find: "packages/features/dashboard/src",
        replacement: path.join(packages, "features/dashboard/components"),
      },
      {
        find: "packages/features/saved/src",
        replacement: path.join(packages, "features/saved/components"),
      },
      {
        find: "packages/styles",
        replacement: path.join(packages, "ui/styles"),
      },
      {
        find: "packages/ui/components/ui",
        replacement: path.join(packages, "ui/components/ui"),
      },
      {
        find: "packages/config/api/documents/report",
        replacement: path.join(packages, "features/documents/api/report"),
      },
      {
        find: "packages/utils/domain/compare",
        replacement: path.join(packages, "features/compare/utils"),
      },
      {
        find: "packages/utils/domain/compare/csvUtils",
        replacement: path.join(packages, "features/compare/utils/csvUtils"),
      },
      {
        find: "packages/utils/domain/compare/types",
        replacement: path.join(packages, "features/compare/types"),
      },
      {
        find: "packages/utils/profile",
        replacement: path.join(packages, "features/profile/utils"),
      },
      {
        find: "packages/utils/profile/",
        replacement: path.join(packages, "features/profile/utils/"),
      },
      { find: /^packages\/(.*)$/, replacement: `${packages}/$1` },
      {
        find: "@/features/agent/modals",
        replacement: path.join(packages, "features/agent/components/modals"),
      },
      {
        find: "@/features/documents/data",
        replacement: path.join(packages, "features/documents/hooks/data"),
      },
      {
        find: "@/features/feed/Reels",
        replacement: path.join(packages, "features/feed/components/Reels"),
      },
      {
        find: "@/features/homeauth/types/user",
        replacement: path.join(packages, "features/homeauth/types"),
      },
      {
        find: "@/features/saved/SavedLayout",
        replacement: path.join(
          packages,
          "features/saved/components/SavedLayout",
        ),
      },
      {
        find: "@/components/ui/button",
        replacement: path.join(uiComponents, "primitives/button"),
      },
      {
        find: "@/components/ui/form",
        replacement: path.join(uiComponents, "primitives/form"),
      },
      {
        find: "@/components/ui/form/FormField",
        replacement: path.join(uiComponents, "form/FormField"),
      },
      {
        find: "@/components/modals/PropertyDetailsModal",
        replacement: path.join(
          packages,
          "features/propertyDetails/components/PropertyDetailsModal",
        ),
      },
      {
        find: "@/components/ui/asset/MiniLogo.web",
        replacement: path.join(uiComponents, "asset/MiniLogo"),
      },
      {
        find: "@/components/ui/media",
        replacement: path.join(uiComponents, "primitives/media"),
      },
      {
        find: "@ui/media",
        replacement: path.join(uiComponents, "primitives/media"),
      },
      {
        find: "@ui/loading",
        replacement: path.join(uiComponents, "asset/loading"),
      },
      { find: "@/components/ui", replacement: uiComponents },
      { find: "@/components", replacement: uiComponents },
      { find: "@/features", replacement: path.join(packages, "features") },
      { find: /^@\/(.*)$/, replacement: path.join(dirname, "$1") },
      { find: "@ui", replacement: uiComponents },
      { find: "logger", replacement: path.join(packages, "logger") },
      { find: "packages", replacement: packages },
    ],
    extensions: [
      ".web.tsx",
      ".web.ts",
      ".tsx",
      ".ts",
      ".web.jsx",
      ".web.js",
      ".jsx",
      ".js",
      ".json",
    ],
    dedupe: [
      "react",
      "react-dom",
      "react-router-dom",
      "zustand",
      "@tanstack/react-query",
      "@headlessui/react",
      "lucide-react",
      "framer-motion",
    ],
  };
}
