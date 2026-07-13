# Tailwind and PostCSS config reference

Reference for **Tailwind** and **PostCSS** configs in the Client monorepo: web vs mobile, shared presets, and how they work with Vite and Metro. All paths are relative to **`Client/`** unless noted.

---

## 1. Overview

| File | Role |
|------|------|
| **packages/config/tailwind/index.ts** | Shared theme preset (ESM): design tokens, theme extend. Consumed by **web** only. |
| **packages/config/tailwind/preset.cjs.js** | Same theme in **CJS** for Metro/NativeWind (mobile). Required because Metro/Node cannot `require()` the ESM `index.ts`. Must be kept in sync with `index.ts`. |
| **apps/web/tailwind.config.ts** | Web Tailwind entry: presets = `[sharedTailwindPreset]`, content = app + packages. |
| **apps/web/postcss.config.js** | Web only: Tailwind + Autoprefixer for Vite’s CSS pipeline. |
| **apps/mobile/tailwind.config.js** | Mobile: presets = `[nativewind/preset, shared CJS preset]`, content = app + `packages/ui`. No PostCSS file; NativeWind runs inside Metro. |

---

## 2. Web (Vite + PostCSS)

- **apps/web/tailwind.config.ts**
  - Imports the shared preset from **packages/config/tailwind** (ESM: `index.ts`).
  - **Content** paths: `./index.html`, `./app/**/*`, `./pages/**/*`, `./components/**/*`, `./features/**/*`, and package globs for `packages/ui`, `packages/features`, `packages/contexts`, `packages/email-templates`.
  - Tailwind is invoked via PostCSS.

- **apps/web/postcss.config.js**
  - Plugins: `tailwindcss()`, `autoprefixer()`.
  - Referenced by **Vite** via `vite.config.js` → `css.postcss: "./postcss.config.js"`.
  - No explicit config path is passed to `tailwindcss()`; it resolves **tailwind.config.ts** in the same app directory.

---

## 3. Mobile (Metro + NativeWind)

- **apps/mobile/tailwind.config.js**
  - **Presets:** `nativewind/preset` first, then the shared CJS preset:
    `require(path.resolve(__dirname, "../../packages/config/tailwind/preset.cjs.js"))`.
  - **Content:** `./App.{js,jsx,ts,tsx}`, `./app/**/*`, `./components/**/*`, and `packages/ui/**/*`.
  - Used by **NativeWind** via Metro (`withNativeWind` in `metro.config.js`); there is no PostCSS step for the mobile app.

- **No postcss.config in apps/mobile**
  - NativeWind runs in the Metro bundler pipeline, not through Vite or PostCSS. A separate PostCSS config is not required for mobile.

---

## 4. Shared preset (ESM vs CJS)

- **packages/config/tailwind/index.ts**
  - Imports design tokens from **packages/design-tokens** (breakpoints, colors, fontFamily, fontSize, spacing, etc.) and exports a single preset object.
  - ESM only; used by **web** `tailwind.config.ts`.

- **packages/config/tailwind/preset.cjs.js**
  - Inlines the same theme (breakpoints, colors, fontFamily, fontSize, spacing, animations, keyframes, zIndex, etc.) in CommonJS.
  - Used by **mobile** `tailwind.config.js` because Metro/Node need a CJS-requireable file.
  - **Sync:** The comment in the file says to keep it in sync with `index.ts` and `packages/design-tokens`. When you change the shared theme, update both the ESM preset and this CJS file (or add a script to generate it from the ESM preset).

---

## 5. Diagram: how configs connect

```
Client/
├── packages/config/tailwind/
│   ├── index.ts               → ESM preset (design-tokens); used by web
│   └── preset.cjs.js          → CJS preset (same theme); used by mobile
│
├── packages/design-tokens/    → Source for colors, spacing, breakpoints, etc.
│
├── apps/web/
│   ├── tailwind.config.ts     → presets: [sharedTailwindPreset]; content: app + packages
│   └── postcss.config.js      → tailwindcss(), autoprefixer() [Vite uses this]
│
└── apps/mobile/
    └── tailwind.config.js     → presets: [nativewind/preset, preset.cjs]; content: app + packages/ui
                                (No postcss.config; NativeWind runs in Metro.)
```

---

## 6. References

- **Design tokens:** `Client/packages/design-tokens/` — Tailwind presets and other consumers use these; `index.ts` imports from here; `preset.cjs.js` inlines a copy.
- **Vite CSS:** `Client/apps/web/vite.config.js` → `css.postcss: "./postcss.config.js"`.
- **NativeWind:** `Client/apps/mobile/metro.config.js` → `withNativeWind(config, { input: "./global.css" })`.
- **High-level config overview:** [config-files.md](config-files.md).
