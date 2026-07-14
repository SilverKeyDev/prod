---
name: responsive-ui-silverkey
description: Apply SilverKey responsive UI standards (web Tailwind + React Native/NativeWind) across seven area passes; use when auditing mobile/tablet/desktop layout, overflow, safe area, keyboard, or touch targets. Follow documentation/guides/responsive-ui-standards.md and .cursor/rules/frontend/responsive-ui.mdc.
---

# Responsive UI — SilverKey (seven passes)

## When to use

- Full or partial **responsive audits** (“Subagent 1–7”, landing through profile).
- Fixing **horizontal scroll**, **clipped content**, **keyboard covering inputs**, **unsafe areas**, or **tiny tap targets**.
- Before claiming a screen is “mobile-ready,” run the checklist below and document findings.

## Required reading

1. **[documentation/guides/responsive-ui-standards.md](../../../documentation/guides/responsive-ui-standards.md)** — breakpoints, WEB/RN/BOTH rules, SilverKey routing notes.
2. **`.cursor/rules/frontend/responsive-ui.mdc`** — short enforcement summary.

## Scope rules

- **Do not** change business logic, API calls, navigation routes, or auth behavior unless the user explicitly asked.
- **Preserve desktop** layout and visuals unless something is broken or a global standard requires a small adjustment.
- Apply only **relevant** rules from the standards doc — not every rule on every file.

## Subagent 2 vs 3 (SilverKey)

- **Web:** Authenticated users hitting `/` go to **`/dashboard`**. There is no separate “HomeAuth” dashboard entry route — **Dashboard (pass 3)** covers post-login shell + content on web.
- **Native pass 2:** Focus **`HomeScreenNative`** + **`AuthStack`** + login/signup screens (pre-login). **Pass 3:** Dashboard tab + layouts + `DashboardFeature` / `DashboardScreen`.

## Per-pass: read these paths first

### Pass 1 — Landing (web marketing)

- `Client/packages/features/homeauth/components/homepage/HomeFeature.web.tsx`
- `Client/packages/features/homeauth/components/homepage/landing/*`
- `Client/packages/features/homeauth/utils/landingChrome.ts`, `landingContent.ts`
- Global styles: `Client/packages/ui/styles/index.css` (Tailwind preflight for `img`/`video`)

### Pass 2 — Auth / HomeAuth (native + auth flows)

- `Client/packages/features/homeauth/components/homepage/HomeScreenNative.native.tsx`
- `Client/apps/mobile/app/navigation/AuthStack.native.tsx`
- `Client/packages/features/homeauth/native` (login, signup, etc.)

### Pass 3 — Dashboard

- `Client/packages/features/dashboard/components/DashboardFeature.tsx`, `DashboardScreen.tsx`
- `Client/apps/web/pages/DashboardPage.tsx`
- `Client/apps/web/app/layouts/dashboard/*` (`DashboardLayout`, `DashboardContent`, `DashboardHeader`)
- `Client/apps/web/app/layouts/sidebar/sidebarNav.web.tsx` (nav collapse / mobile)
- `Client/apps/mobile/app/navigation/DashboardStack.native.tsx`

### Pass 4 — Search

- `Client/apps/web/pages/SearchPage.tsx`, `SearchPageContent.tsx`
- `Client/packages/features/search/**` (layouts, filters, map, results)

### Pass 5 — Saved

- `Client/packages/features/saved/components/**`
- `SavedPageLayout.tsx` / `SavedPageLayout.native.tsx`, `SavedScreen.native.tsx`

### Pass 6 — Messaging

- `Client/packages/features/messaging/**`
- `Client/packages/features/agent/components/MessagingScreen.native.tsx`
- `Client/packages/features/agent/components/messaging/**`
- Web shell: `Client/apps/web/app/layouts/dashboard/DashboardContent.tsx` (full-width messaging)

### Pass 7 — Profile

- `Client/apps/web/pages/ProfilePage.tsx`
- `Client/packages/features/profile/components/**`, `profilePicture/**`

## Checklist (each pass)

1. List files to touch; read them before editing.
2. Apply standards; keep diffs minimal.
3. Run `pnpm lint` and `pnpm typecheck` in `Client/` after substantive edits (`documentation/reference/linting.md`).
4. Output a **change summary**: file → what changed; flag **manual review** items (maps, real devices, sticky + overflow edge cases).

## Output format (optional table)

After all passes, a summary table is useful:

| Screen | Files changed | Key fixes | Manual review |
|--------|----------------|-----------|---------------|
| … | … | … | … |
