# Responsive UI standards (SilverKey client)

Canonical rules for web (React + Tailwind) and mobile (React Native + NativeWind v4). Use this with `.cursor/rules/frontend/responsive-ui.mdc` and the `responsive-ui-silverkey` skill when doing responsive work.

## Breakpoints

| Name | Width | Use |
|------|-------|-----|
| (base) | &lt; 640px | Mobile-first default |
| `sm` | 640px | Large phones / small tablets |
| `md` | 768px | Tablet; RN “tablet” split layouts (`width >= 768`) |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |

**NativeWind v4:** Use `sm:`, `md:`, `lg:` prefixes on classNames (same numeric breakpoints as Tailwind where configured).

## Manual test widths (BOTH-3)

Verify at **320**, **375**, **390**, **768**, and **1280** px (or RN simulators: iPhone SE, small Android).

---

## Web (WEB-1–WEB-8)

### WEB-1 Mobile-first

- Base styles for smallest viewport; add `sm:` / `md:` / `lg:` only to enhance upward.
- Example: `className="flex flex-col md:flex-row"`.

### WEB-2 Fluid typography

- Prefer `rem` for font sizes in custom CSS; Tailwind text utilities use rem.
- Hero/display: `clamp()` when adding raw CSS.
- Body: avoid below `0.875rem` for readable paragraphs; prefer `text-base` (16px) for inputs on mobile (WEB-7).
- Long prose: constrain line length (e.g. `max-w-prose` / ~65ch).

### WEB-3 No horizontal overflow

- **Global media:** Tailwind Preflight (via `packages/ui/styles/index.css`) includes `img, video { max-width: 100%; height: auto; }`. Do not duplicate unless a specific bundle strips preflight.
- **Sticky caveat:** Avoid `overflow-x: hidden` on ancestors of `position: sticky` content; it can break sticky. Prefer `min-w-0` on flex children that hold long text.
- **Tables:** wrap in a horizontal scroll container (`overflow-x-auto`), not unbounded wide tables.
- **Flex:** flex children with shrinking content need `min-w-0` (Tailwind `min-w-0`).

### WEB-4 Responsive navigation

- Collapse primary nav below `md` (768px); hamburger / drawer with ≥44×44px touch target.
- FABs on mobile: `bottom: max(1.5rem, env(safe-area-inset-bottom))` when using fixed positioning.

### WEB-5 Modals on mobile

- Full-screen on small viewports; centered card from `md+` where appropriate.
- Modal scroll areas: `overscroll-behavior: contain` where body scroll bleed is an issue on iOS.
- Close control: ≥44×44px.

### WEB-6 Grids and cards

- Start with one column; add columns at breakpoints: e.g. `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
- CSS grids: `repeat(auto-fit, minmax(280px, 1fr))` is a good default for card grids.

### WEB-7 Forms

- Inputs: `text-base` (16px) on mobile to reduce iOS zoom-on-focus.
- Submit actions: `w-full md:w-auto` when full-width mobile buttons are desired.
- Adequate vertical gap between fields (`gap-4` or more).

### WEB-8 Images and media

- Card/hero images: `object-cover` with `aspect-*` or CSS `aspect-ratio`, not fixed heights that break layout.
- Below-the-fold `<img>`: `loading="lazy"` where appropriate.

---

## React Native (RN-1–RN-10)

### RN-1 Layout

- No fixed pixel width/height for **layout** containers; use flex. Fixed sizes OK for icons, avatars, small decorative elements.

### RN-2 Safe area

- Root screens: wrap with `SafeAreaView` from **`react-native-safe-area-context`** (not the deprecated core `SafeAreaView`).
- Tab bars / bottom UI: `useSafeAreaInsets()` → `paddingBottom` / `marginBottom` as needed.

### RN-3 Scaling (optional)

- When adapting typography/spacing: `useWindowDimensions()` and a scale helper, e.g. `(width / 390) * size`, with `Math.max(12, …)` floor for body text.

### RN-4 Keyboard

- Screens with `TextInput`: `KeyboardAvoidingView` + `ScrollView` with `keyboardShouldPersistTaps="handled"` where applicable.
- Bottom CTAs: combine `useSafeAreaInsets()` with extra padding so CTAs stay clear of keyboard/home indicator.

### RN-5 Tablet (≥768)

- Optional split: `flexDirection: 'row'`, list ~40% / detail ~60%.
- `FlatList` with `numColumns`: change `key` when toggling columns to remount safely.

### RN-6 Touch targets

- Minimum **44×44** pt for pressables; use `hitSlop` for small visible targets.

### RN-7 Images

- Bounded width (`100%` + `aspectRatio` preferred over mystery height).

### RN-8 Lists

- `FlatList`: consider `removeClippedSubviews`, `windowSize`, `initialNumToRender` for long lists.
- Avoid nested vertical `ScrollView` in `ScrollView`; prefer `FlatList` + `ListHeaderComponent`.

### RN-9 Absolute positioning

- Bottom: `bottom: Math.max(16, insets.bottom)`; top: account for `insets.top`.

### RN-10 NativeWind

- Prefer breakpoint prefixes for responsive RN layout; avoid mixing NativeWind and `StyleSheet` on the **same** property for the same node.

---

## Cross-cutting (BOTH-1–BOTH-5)

| ID | Rule |
|----|------|
| BOTH-1 | Prefer 8pt spacing scale (4, 8, 12, 16, 24, 32, 48, 64). Tailwind spacing scale aligns; avoid arbitrary `p-[13px]`. |
| BOTH-2 | Skeletons: percentage/flex widths. Empty states: illustration max-width ~200px, centered; toasts full-width on mobile, constrained on desktop. |
| BOTH-3 | Test at breakpoints listed above. |
| BOTH-4 | Interactive controls ≥44×44 px (web min height/width; RN + hitSlop). |
| BOTH-5 | No invisible clipping: reflow, scroll, or ellipsis + “show more” — not silent `overflow: hidden` on text. |

---

## SilverKey routing notes (avoid duplicate work)

- **Public landing (marketing):** `Client/packages/features/homeauth/components/homepage/` — `HomeFeature.web.tsx` + `landing/*`. Web marketing stack.
- **Post-login default (web):** `/` redirects authenticated users to **`/dashboard`** (`RedirectIfAuthenticated`). There is no separate “authenticated home” route besides Dashboard.
- **Mobile:** First tab is **Dashboard** (`AppStack`). `HomeScreenNative` is the **auth stack** welcome (pre-login), not the post-login home.
- **Messaging (web):** Routed inside the dashboard shell (`DashboardContent`), not a standalone `pages/Messaging*.tsx`.

---

## Primary code paths by area (seven passes)

Use these as the first places to read when auditing responsiveness.

| Area | Primary paths |
|------|----------------|
| **1 — Landing** | `Client/packages/features/homeauth/components/homepage/HomeFeature.web.tsx`, `…/landing/*`, `…/utils/landingChrome.ts`, `landingContent.ts` |
| **2 — Auth / HomeAuth (scoped)** | `Client/packages/features/homeauth/components/homepage/HomeScreenNative.native.tsx`, `Client/apps/mobile/app/navigation/AuthStack.native.tsx`, native login/signup screens under `packages/features/homeauth/native` |
| **3 — Dashboard** | `Client/packages/features/dashboard/components/DashboardFeature.tsx`, `DashboardScreen.tsx`, `Client/apps/web/pages/DashboardPage.tsx`, `Client/apps/web/app/layouts/dashboard/*`, `Client/apps/mobile/app/navigation/DashboardStack.native.tsx` |
| **4 — Search** | `Client/apps/web/pages/SearchPage.tsx`, `SearchPageContent.tsx`, `Client/packages/features/search/**` |
| **5 — Saved** | `Client/packages/features/saved/components/**`, `SavedScreen.native.tsx`, `SavedPageLayout*.tsx` |
| **6 — Messaging** | `Client/packages/features/messaging/**`, `Client/packages/features/agent/components/MessagingScreen.native.tsx`, `…/messaging/*` |
| **7 — Profile** | `Client/apps/web/pages/ProfilePage.tsx`, `Client/packages/features/profile/components/**` |

**Overlap:** Subagent 2 (native auth welcome) and Subagent 3 (Dashboard) are distinct on mobile; on web, “first screen after login” is Dashboard — do not audit the same responsive concerns twice.

---

## Verification

After changes: `Client/` → `pnpm lint`, `pnpm typecheck` (see [linting.md](../reference/linting.md)). Manually verify keyboard + safe area on messaging and forms.
