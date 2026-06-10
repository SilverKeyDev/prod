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
        find: "packages/ui/components/media/ui",
        replacement: path.join(packages, "ui/components/media/ui"),
      },
      {
        find: "packages/config/api/documents/report",
        replacement: path.join(packages, "features/documents/api/report"),
      },
      {
        find: "packages/utils/product/domain/compare",
        replacement: path.join(packages, "features/compare/utils"),
      },
      {
        find: "packages/utils/product/domain/compare/csvUtils",
        replacement: path.join(packages, "features/compare/utils/csvUtils"),
      },
      {
        find: "packages/utils/product/domain/compare/types",
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
        replacement: path.join(packages, "features/saved/components/SavedLayout"),
      },
      {
        find: "@/components/ui/button",
        replacement: path.join(uiComponents, "structure/primitives/button"),
      },
      {
        find: "@/components/ui/form",
        replacement: path.join(uiComponents, "structure/primitives/form"),
      },
      {
        find: "@/components/ui/text",
        replacement: path.join(uiComponents, "structure/text"),
      },
      {
        find: "@/components/ui/sidebar",
        replacement: path.join(uiComponents, "structure/sidebar"),
      },
      {
        find: "@/components/ui/asset",
        replacement: path.join(uiComponents, "media/asset"),
      },
      {
        find: "@/components/ui/form/FormField",
        replacement: path.join(uiComponents, "inputs/form/field/FormField"),
      },
      {
        find: "@/components/modals/PropertyDetailsModal",
        replacement: path.join(
          packages,
          "features/propertyDetails/components/PropertyDetailsModal"
        ),
      },
      {
        find: "@/components/ui/asset/MiniLogo.web",
        replacement: path.join(uiComponents, "media/asset/MiniLogo"),
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
        replacement: path.join(uiComponents, "media/asset/loading"),
      },
      { find: "@ui/icons", replacement: path.join(uiComponents, "media/icons") },
      { find: "@ui/button", replacement: path.join(uiComponents, "actions/button") },
      { find: "@ui/text", replacement: path.join(uiComponents, "structure/text") },
      { find: "@ui/form", replacement: path.join(uiComponents, "inputs/form") },
      { find: "@ui/asset", replacement: path.join(uiComponents, "media/asset") },
      { find: "@ui/avatar", replacement: path.join(uiComponents, "media/avatar") },
      { find: "@ui/modals", replacement: path.join(uiComponents, "surfaces/modals") },
      { find: "@ui/layout", replacement: path.join(uiComponents, "structure/layout") },
      { find: "@ui/primitives", replacement: path.join(uiComponents, "structure/primitives") },
      { find: "@ui/sidebar", replacement: path.join(uiComponents, "structure/sidebar") },
      { find: "@ui/cards", replacement: path.join(uiComponents, "surfaces/cards") },
      { find: "@ui/feedback", replacement: path.join(uiComponents, "surfaces/feedback") },
      { find: "@ui/popover", replacement: path.join(uiComponents, "surfaces/popover") },
      { find: "@ui/accessibility", replacement: path.join(uiComponents, "system/accessibility") },
      { find: "@ui/adapters", replacement: path.join(uiComponents, "system/adapters") },
      { find: "@/components/layout", replacement: path.join(uiComponents, "structure/layout") },
      { find: "@/components/text", replacement: path.join(uiComponents, "structure/text") },
      { find: "@/components/form", replacement: path.join(uiComponents, "inputs/form") },
      { find: "@/components/button", replacement: path.join(uiComponents, "actions/button") },
      { find: "@/components/cards", replacement: path.join(uiComponents, "surfaces/cards") },
      { find: "@/components/modals", replacement: path.join(uiComponents, "surfaces/modals") },
      { find: "@/components/icons", replacement: path.join(uiComponents, "media/icons") },
      { find: "@/components/asset", replacement: path.join(uiComponents, "media/asset") },
      { find: "@/components/avatar", replacement: path.join(uiComponents, "media/avatar") },
      { find: "@/components/feedback", replacement: path.join(uiComponents, "surfaces/feedback") },
      { find: "@/components/popover", replacement: path.join(uiComponents, "surfaces/popover") },
      {
        find: "@/components/backgrounds",
        replacement: path.join(uiComponents, "surfaces/backgrounds"),
      },
      { find: "@/components/badge", replacement: path.join(uiComponents, "surfaces/badge") },
      { find: "@/components/match", replacement: path.join(uiComponents, "surfaces/match") },
      { find: "@/components/patterns", replacement: path.join(uiComponents, "surfaces/patterns") },
      { find: "@/components/portal", replacement: path.join(uiComponents, "structure/portal") },
      {
        find: "@/components/primitives",
        replacement: path.join(uiComponents, "structure/primitives"),
      },
      { find: "@/components/sidebar", replacement: path.join(uiComponents, "structure/sidebar") },
      { find: "@/components/tabs", replacement: path.join(uiComponents, "structure/tabs") },
      {
        find: "@/components/accessibility",
        replacement: path.join(uiComponents, "system/accessibility"),
      },
      { find: "@/components/adapters", replacement: path.join(uiComponents, "system/adapters") },
      { find: "@/components/security", replacement: path.join(uiComponents, "system/security") },
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
