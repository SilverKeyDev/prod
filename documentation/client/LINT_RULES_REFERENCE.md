# Lint rules reference – every rule, grouped by location

All rules are defined in **`Client/eslint.config.js`** unless noted. Custom rules live in **`Client/tools/eslint-plugin-silverkey/`**. Other tools (Prettier, parity, madge, TypeScript) are listed at the end.

---

## 1. Ignores (no linting)

**Location:** `eslint.config.js` — top-level `ignores` array

| Pattern | Effect |
|--------|--------|
| `**/node_modules/**` | Skip dependencies |
| `**/dist/**` | Skip build output |
| `**/build/**` | Skip build output |
| `**/coverage/**` | Skip coverage output |
| `**/.turbo/**` | Skip Turbo cache |
| `**/vite.config.ts` | Skip Vite config |
| `**/postcss.config.js` | Skip PostCSS config |
| `**/tailwind.config.ts` | Skip Tailwind config |
| `**/*.md` | Skip all markdown files |

---

## 2. Node scripts and tools

**Location:** `eslint.config.js` — `files: ['scripts/**/*.mjs', 'tools/**/*.mjs']`

| Setting | Effect |
|---------|--------|
| `languageOptions.globals: { ...globals.node }` | Allow Node globals (e.g. `Buffer`, `process`, `console`) in these files. No extra rules. |

---

## 3. Base and TypeScript recommended (all JS/TS)

**Location:** `eslint.config.js` — applies to all files (before file-specific overrides)

| Source | What it does |
|--------|----------------|
| **js.configs.recommended** | ESLint core "recommended" rules (e.g. `no-unused-vars` baseline; many are overridden by TypeScript). |
| **tseslint.configs.recommended** | TypeScript ESLint recommended (type-aware rules, no-unused-vars for TS, etc.). |

These are preset bundles; individual rule names come from `@eslint/js` and `typescript-eslint` recommended configs.

---

## 4. SilverKey plugin – global (all `**/*.{js,jsx,ts,tsx}`)

**Location:** `eslint.config.js` — `files: ['**/*.{js,jsx,ts,tsx}']` with `plugins: { silverkey }`

| Rule | Level | What it does |
|------|--------|----------------|
| **silverkey/max-lines-hard** | warn | Disallow files over 500 lines; suggests splitting. Ignores paths matching `dist/`, `build/`, `coverage/`, `.d.ts`. |
| **silverkey/folder-extension-policy** | error | Enforce allowed file extensions per folder: `packages/services` → `.ts` only; `packages/schemas` → `.ts` only; `apps/web/features` → `.ts` or `.tsx` only. |
| **silverkey/folder-max-items** | error | Warn at 15 direct children in a folder, error at 17. Keeps folders navigable. |
| **silverkey/no-hardcoded-breakpoints** | error | Disallow hardcoded breakpoint values (e.g. `768px`, `max-width: 640px`). Require `screenDown('md')`, `screenUp('md')`, or `useIsMobile()` from project utilities. |
| **silverkey/no-console-logger** | error | Disallow `console.*`; require the centralized logger from `logger`. Exceptions: test files, node scripts. |

---

## 5. Override: root config file

**Location:** `eslint.config.js` — `files: ["eslint.config.js"]`

| Rule | Level | What it does |
|------|--------|----------------|
| **silverkey/folder-max-items** | off | Root has many direct children; disable for this file only. |

---

## 6. Override: packages/utils

**Location:** `eslint.config.js` — `files: ["packages/utils/**/*.ts"]`

| Rule | Level | What it does |
|------|--------|----------------|
| **silverkey/folder-max-items** | off | Utils has many domain folders; disable for this tree. |

---

## 7. Global rules (all `**/*.{js,jsx,ts,tsx}`)

**Location:** `eslint.config.js` — `files: ['**/*.{js,jsx,ts,tsx}']`

| Rule | Level | What it does |
|------|--------|----------------|
| **@typescript-eslint/no-unused-vars** | error | Report unused variables/args. Ignore names matching `^_`. |
| **@typescript-eslint/no-explicit-any** | warn | Discourage `any` (overridden to error in `apps/web`). |
| **no-debugger** | error | Disallow `debugger` statements. |

`languageOptions`: `ecmaVersion: 'latest'`, `sourceType: 'module'`, globals: `browser`, `es2021`, `node`.

---

## 7b. Import path verification (type-aware TS/TSX)

**Location:** `eslint.config.js` — `files: ['apps/web/**/*.{ts,tsx}', 'packages/contexts/**', 'packages/hooks/**', 'packages/navigation/**', 'packages/schemas/**', 'packages/services/**', 'packages/store/**', 'packages/utils/**']`

Ensures every import/export path resolves. Uses **`eslint-plugin-import`** with **`eslint-import-resolver-typescript`** so path aliases (`@/`, `packages/*`, `logger`) and `tsconfig.app.json` paths are respected.

| Rule | Level | What it does |
|------|--------|----------------|
| **import/no-unresolved** | error | Verify that import paths resolve. Reports typos, wrong paths, missing files, and invalid path aliases. Uses TypeScript resolver with `tsconfig.app.json` and `alwaysTryTypes: true`; falls back to Node resolution. |

`settings['import/resolver']`: `typescript` (project: `tsconfig.app.json`) and `node`. Part of the same config block as type-aware linting (`projectService: true`) and promise/async rules (`@typescript-eslint/no-floating-promises`, `@typescript-eslint/await-thenable`).

---

## 8. React – apps/web

**Location:** `eslint.config.js` — `files: ['apps/web/**/*.{js,jsx,ts,tsx}']`

| Rule | Level | What it does |
|------|--------|----------------|
| **react-hooks/rules-of-hooks** | (from recommended) | Enforce Rules of Hooks (only call hooks at top level, etc.). |
| **react-hooks/exhaustive-deps** | error | Require correct dependency arrays for `useEffect`/`useMemo`/`useCallback`. |
| **react-refresh/only-export-components** | warn | Only allow exporting React components from files that need Fast Refresh (allows `allowConstantExport: true`). |

---

## 9. apps/web – no explicit any

**Location:** `eslint.config.js` — `files: ['apps/web/**/*.{ts,tsx}']`

| Rule | Level | What it does |
|------|--------|----------------|
| **@typescript-eslint/no-explicit-any** | error | Disallow `any` in web app code. |

---

## 10. Accessibility (jsx-a11y) – apps/web, packages/contexts, packages/hooks

**Location:** `eslint.config.js` — `files: ['apps/web/**/*.{js,jsx,ts,tsx}', 'packages/contexts/**/*.{js,jsx,ts,tsx}', 'packages/hooks/**/*.{js,jsx,ts,tsx}']`

Uses **`...jsxA11y.configs.recommended.rules`**. All are from plugin `jsx-a11y`:

| Rule | Default level | What it does |
|------|----------------|--------------|
| **jsx-a11y/alt-text** | error | Require meaningful `alt` on `<img>` (and similar). |
| **jsx-a11y/anchor-has-content** | error | Links must have accessible content. |
| **jsx-a11y/anchor-is-valid** | error | Enforce valid anchor `href` and usage. |
| **jsx-a11y/aria-activedescendant-has-tabindex** | error | Elements with `aria-activedescendant` must be focusable. |
| **jsx-a11y/aria-props** | error | ARIA props must be valid. |
| **jsx-a11y/aria-proptypes** | error | ARIA prop values must be correct type. |
| **jsx-a11y/aria-role** | error | `role` must be valid. |
| **jsx-a11y/aria-unsupported-elements** | error | ARIA on elements that don't support it. |
| **jsx-a11y/autocomplete-valid** | error | Autocomplete attribute values must be valid. |
| **jsx-a11y/click-events-have-key-events** | error | Click handlers must have keyboard equivalent. |
| **jsx-a11y/control-has-associated-label** | off | (Recommended set has options; still in config.) |
| **jsx-a11y/heading-has-content** | error | Headings must have content. |
| **jsx-a11y/html-has-lang** | error | `<html>` must have `lang`. |
| **jsx-a11y/iframe-has-title** | error | Iframes must have a title. |
| **jsx-a11y/img-redundant-alt** | error | Avoid redundant alt text (e.g. "image of …" for image). |
| **jsx-a11y/interactive-supports-focus** | error | Interactive elements must be focusable (with options). |
| **jsx-a11y/label-has-associated-control** | error | Labels must be associated with a control. |
| **jsx-a11y/label-has-for** | off | (Recommended turns this off in favor of label-has-associated-control.) |
| **jsx-a11y/media-has-caption** | error | Media elements should have captions. |
| **jsx-a11y/mouse-events-have-key-events** | error | Mouse handlers should have keyboard equivalents. |
| **jsx-a11y/no-access-key** | error | Disallow `accessKey`. |
| **jsx-a11y/no-autofocus** | error | Discourage `autoFocus`. |
| **jsx-a11y/no-distracting-elements** | error | Restrict `<marquee>` and `<blink>`. |
| **jsx-a11y/no-interactive-element-to-noninteractive-role** | error | Don't give non-interactive roles to interactive elements (with allowlists). |
| **jsx-a11y/no-noninteractive-element-interactions** | error | Restrict event handlers on non-interactive elements (with options). |
| **jsx-a11y/no-noninteractive-element-to-interactive-role** | error | Don't give interactive roles to non-interactive elements (with allowlists). |
| **jsx-a11y/no-noninteractive-tabindex** | error | Restrict `tabIndex` on non-interactive elements (with options). |
| **jsx-a11y/no-redundant-roles** | error | Avoid redundant roles (e.g. `<button role="button">`). |
| **jsx-a11y/no-static-element-interactions** | error | Require role/keyboard for static elements with handlers (with options). |
| **jsx-a11y/role-has-required-aria-props** | error | Elements with a role must have required ARIA props. |
| **jsx-a11y/role-supports-aria-props** | error | ARIA props must be supported for the role. |
| **jsx-a11y/scope** | error | `<th scope>` must be valid. |
| **jsx-a11y/tabindex-no-positive** | error | Disallow positive `tabIndex`. |

---

## 11. Architecture – apps/web/components

**Location:** `eslint.config.js` — `files: ['apps/web/components/**/*.{ts,tsx}']`

| Rule | Level | What it does |
|------|--------|----------------|
| **silverkey/no-restricted-imports-architecture** | error | Components must not import from `packages/services/**` or `packages/config/api/**`. Allowed: `packages/services/http/**`, `packages/services/security/**`. Use hooks (e.g. from `packages/hooks/`) or `import type` for types. |

---

## 12. UI standardization – apps/web/components and apps/web/features

**Location:** `eslint.config.js` — `files: ['apps/web/components/**/*.{ts,tsx}', 'apps/web/features/**/*.{ts,tsx}']`

| Rule | Level | What it does |
|------|--------|----------------|
| **silverkey/no-primitive-components** | error | Disallow primitive HTML elements in favor of design system components from `components/ui`: `<button>`, `<a>`, `<span>`, `<img>`, `<video>`, `<p>`, `<h1>`–`<h6>`, `<input>`, `<textarea>`, `<select>`, `<label>`. Exceptions: files under `components/ui`, test files, external links (`<a href="http...">`). |

---

## 13. JSX only in .tsx – apps/web/**/*.ts

**Location:** `eslint.config.js` — `files: ["apps/web/**/*.ts"]`

| Rule | Level | What it does |
|------|--------|----------------|
| **no-restricted-syntax** (JSXElement) | error | JSX is not allowed in `.ts` under `apps/web`; use `.tsx` or remove JSX. |
| **no-restricted-syntax** (JSXFragment) | error | Same for `<>...</>`. |

---

## 14. No React in packages (config, schemas, services, store, utils)

**Location:** `eslint.config.js` — `files: ['packages/config/**', 'packages/schemas/**', 'packages/services/**', 'packages/store/**', 'packages/utils/**']` (all `.{js,jsx,ts,tsx}`)

| Rule | Level | What it does |
|------|--------|----------------|
| **no-restricted-imports** | error | Disallow importing `react`, `react-dom`, `react/*`, `react-dom/*`. Message: use framework-agnostic code in packages. |
| **no-restricted-syntax** (JSXElement) | error | JSX not allowed outside apps/web. |
| **no-restricted-syntax** (JSXFragment) | error | Same for fragments. |

---

## 15. React allowed – packages/contexts and packages/hooks

**Location:** `eslint.config.js` — `files: ['packages/contexts/**/*.{js,jsx,ts,tsx}', 'packages/hooks/**/*.{js,jsx,ts,tsx}']`

| Rule | Level | What it does |
|------|--------|----------------|
| **react-hooks/rules-of-hooks** | (recommended) | Same as apps/web. |
| **react-hooks/exhaustive-deps** | error | Same as apps/web. |
| **react-refresh/only-export-components** | warn | Same as apps/web. |

---

## 16. Legacy exceptions – specific package files

**Location:** `eslint.config.js` — `files: [ 'packages/schemas/nav.ts', 'packages/utils/profile/types.ts', 'packages/utils/profile/utils.ts', 'packages/utils/search/MapZoomController.ts' ]`

| Rule | Level | What it does |
|------|--------|----------------|
| **no-restricted-imports** | off | Allow React imports in these files until refactor. |
| **no-restricted-syntax** | off | Allow JSX in these files until refactor. |

---

## 17. ESLint plugin implementation

**Location:** `eslint.config.js` — `files: ['tools/eslint-plugin-silverkey/**/*.js']`

| Rule | Level | What it does |
|------|--------|----------------|
| **@typescript-eslint/no-require-imports** | off | Allow `require()` in the plugin (CommonJS). |

---

## 18. Prettier (disable conflicting ESLint rules)

**Location:** `eslint.config.js` — last block: `prettier` (from `eslint-config-prettier`)

Turns off ESLint rules that conflict with Prettier (e.g. indent, quotes, semi, comma-dangle, max-len, and many stylistic/formatting rules from TypeScript ESLint, React, Vue, etc.). No new "rules" are added; formatting is left to Prettier.

---

## 19. SilverKey custom rule implementations (what each file does)

**Location:** `Client/tools/eslint-plugin-silverkey/rules/` (grouped in subfolders: `architecture/`, `hooks/`, `ui/`).

| File | Rule name | What it does |
|------|-----------|--------------|
| **max-lines-hard.js** | silverkey/max-lines-hard | Counts lines in file; report if over `max` (500), skipping paths matching `ignorePatterns`. |
| **folder-extension-policy.js** | silverkey/folder-extension-policy | For each configured folder, ensures file extension is in `allowed` list. |
| **folder-max-items.js** | silverkey/folder-max-items | Counts direct children of the directory containing the file; warn at `warnAt`, error at `errorAt`. Excludes standard dirs (node_modules, dist, etc.). |
| **no-hardcoded-breakpoints.js** | silverkey/no-hardcoded-breakpoints | Detects hardcoded media-query breakpoints (e.g. 768px, 640px) in strings and `window.matchMedia`; suggests screenDown/screenUp/useIsMobile. |
| **no-console-logger.js** | silverkey/no-console-logger | Disallows `console.log`, `console.info`, etc.; suggests centralized logger. Exceptions for test files and node scripts. |
| **no-restricted-imports-architecture.js** | silverkey/no-restricted-imports-architecture | In `apps/web/components` (excluding `components/ui`), forbids importing from configured `forbidden` paths; allows `allowedExceptions`. |
| **no-primitive-components.js** | silverkey/no-primitive-components | In components/features/pages, disallows primitive HTML (button, a, span, img, video, p, h1–h6, input, textarea, select, label) unless in ui library, tests, or external link. |

---

## 20. Other tools (not in eslint.config.js)

| Location | What it does |
|----------|--------------|
| **Prettier** | `pnpm format` / `pnpm format:check`. Formats code (and Tailwind class order in apps/web). No "rules" list; see Prettier docs. Config can live in `package.json` or separate Prettier config. |
| **lint:parity** | `Client/tools/check-parity.mjs`. Compares `apps/web/features` and `apps/mobile/features` so feature trees stay in sync; allows platform suffixes (e.g. `.web.tsx`). |
| **lint:cycles** | `madge --circular ...` (see `Client/package.json`). Detects circular dependencies in `apps/web` and `packages` (TS/TSX). |
| **TypeScript** | `pnpm typecheck` runs `tsc` for type-checking only. Not a linter; enforces types. |

---

## Summary table by file pattern

| Files | SilverKey | TypeScript | React | a11y | Import | Built-in |
|-------|-----------|------------|-------|------|--------|----------|
| All `**/*.{js,jsx,ts,tsx}` | max-lines, folder-extension, folder-max-items, no-hardcoded-breakpoints, no-console-logger | no-unused-vars, no-explicit-any (warn), no-debugger | — | — | — | — |
| Type-aware TS/TSX (apps/web, packages/*) | — | no-floating-promises, await-thenable | — | — | **no-unresolved** | — |
| `eslint.config.js` | folder-max-items off | — | — | — | — | — |
| `packages/utils/**/*.ts` | folder-max-items off | — | — | — | — | — |
| `apps/web/**` | (same + no-restricted-imports-architecture in components; no-primitive-components in components/features/pages) | no-explicit-any **error** | rules-of-hooks, exhaustive-deps, react-refresh | recommended | — | no-restricted-syntax (JSX only in .tsx) |
| `apps/web/components/**` | + no-restricted-imports-architecture, no-primitive-components | — | — | — | — | — |
| `apps/web/features/**` | + no-primitive-components | — | — | — | — | — |
| `apps/web/**/*.ts` | — | — | — | — | — | no-restricted-syntax (no JSX) |
| `packages/config`, `schemas`, `services`, `store`, `utils` | — | — | — | — | — | no-restricted-imports (no React), no-restricted-syntax (no JSX) |
| `packages/contexts`, `packages/hooks` | — | — | rules-of-hooks, exhaustive-deps, react-refresh | recommended | — | — |
| Legacy list (4 files) | — | — | — | — | — | no-restricted-imports/syntax off |
| `tools/eslint-plugin-silverkey/**/*.js` | — | no-require-imports off | — | — | — | — |

This is the full set of rules and where they apply.
