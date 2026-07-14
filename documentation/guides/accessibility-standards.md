# Accessibility standards (WCAG 2.1 Level AA)

SilverKey targets **WCAG 2.1 Level AA** for web and React Native. This aligns with common ADA Title III expectations for customer-facing web and mobile apps.

**Related:** [responsive-ui-standards.md](responsive-ui-standards.md) (touch targets, form sizing), [linting.md](../reference/linting.md) (jsx-a11y + SilverKey a11y rules), [accessibility-checklist.md](../runbooks/qa/accessibility-checklist.md) (manual release pass).

---

## SilverKey contracts (already enforced in code)

| Contract | Where |
| -------- | ----- |
| Unified **`label`** prop on design-system components (not raw `aria-label` / `accessibilityLabel` in features) | `silverkey/no-direct-accessibility-props`, `packages/ui` primitives |
| **44×44px** minimum touch targets | Tailwind `touch` token, [responsive-ui-standards.md](responsive-ui-standards.md) |
| **Skip link** → `#main-content` | `Client/apps/web/app/routes.tsx` |
| **Route focus** on main landmark (except full-height search/messaging) | `Client/apps/web/app/routes.tsx` |
| **`prefers-reduced-motion: reduce`** | `Client/packages/ui/styles/css/animations.css` |
| **Focus-visible** rings on interactive elements | `Client/packages/ui/styles/css/base.css` |
| **Screen-reader-only** utility | `sr-only` in Tailwind / utilities.css |

---

## WCAG checklist by area

### Perceivable

| Criterion | Requirement | SilverKey approach |
| --------- | ----------- | ------------------ |
| 1.1.1 Non-text content | Meaningful images have alt text; decorative images hidden | `Image` primitive; `Icon` defaults to `aria-hidden` when no label |
| 1.3.1 Info and relationships | Headings, labels, landmarks programmatically determinable | `Title as="h1"…`, `Label htmlFor`, `Region`, nav `aria-label` |
| 1.4.3 Contrast (AA) | 4.5:1 normal text; 3:1 large text / UI components | Semantic tokens in [color-system.md](../reference/color-system.md); see contrast table below |
| 1.4.4 Resize text | 200% zoom without loss of content | Responsive layout; avoid fixed heights on text containers |
| 1.4.10 Reflow | No horizontal scroll at 320px width | `min-w-0`, responsive grids |
| 1.4.11 Non-text contrast | UI controls 3:1 against adjacent colors | Buttons, inputs, focus rings use design tokens |

### Operable

| Criterion | Requirement | SilverKey approach |
| --------- | ----------- | ------------------ |
| 2.1.1 Keyboard | All functionality via keyboard | Design-system `Button`, `HomeCard` Enter/Space; Headless UI Dialog/Tab |
| 2.1.2 No keyboard trap | Focus can leave modals | Headless UI Dialog focus trap + Escape |
| 2.4.1 Bypass blocks | Skip to main content | Skip link in app shell |
| 2.4.3 Focus order | Logical tab order | DOM order; modals trap focus inside panel |
| 2.4.7 Focus visible | Visible focus indicator | `:focus-visible` in base.css |
| 2.5.5 Target size (AAA aspirational) | 44×44px targets | Enforced via responsive standards |

### Understandable

| Criterion | Requirement | SilverKey approach |
| --------- | ----------- | ------------------ |
| 3.3.1 Error identification | Errors described in text | `Input` + `role="alert"` on field errors |
| 3.3.2 Labels or instructions | Form fields labeled | `Label`, `useInputField`, `aria-describedby` |
| 3.2.4 Consistent identification | Same labels for same functions | Shared `CloseButton`, i18n keys |

### Robust

| Criterion | Requirement | SilverKey approach |
| --------- | ----------- | ------------------ |
| 4.1.2 Name, role, value | Correct ARIA on custom widgets | `Box` RN→ARIA bridge; modals use `role="dialog"` |
| 4.1.3 Status messages | Live regions for dynamic updates | `Toast`, `Loading` (`role="status"`, `aria-live`) |

---

## Component patterns

### Icon-only controls

Always pass **`label`** to `IconButton`, `CloseButton`, or icon-only `Button`:

```tsx
<IconButton icon={Search} label={t("search.open")} onClick={openSearch} />
```

### Modals and dialogs

Use **`BaseModal`**, **`ConfirmationDialog`**, or **`AccessibleDialog`** — not raw portaled `Box` overlays. Modals must have:

- `role="dialog"` + `aria-modal="true"` (web)
- Labelled title (`aria-labelledby` or `aria-label`)
- Escape to close; focus trapped inside panel (Headless UI Dialog on web)
- `accessibilityViewIsModal={true}` (native)

**Do not** combine `aria-hidden="true"` with focusable elements.

### Tabs

`UnderlineTabs` uses Headless UI Tab on web (arrow keys + roving tabindex). Consumers must wire `role="tabpanel"` and `aria-labelledby` when showing tab panels.

### Forms

Use **`Input`** / **`FormField`** from `packages/ui`. Do not use raw `<input>` in features (`silverkey/no-primitive-components`).

---

## React Native appendix

Map web patterns to RN accessibility props via the design-system bridge:

| Web | React Native |
| --- | ------------ |
| `aria-label` | `accessibilityLabel` (via unified `label` on primitives) |
| `role="button"` | `accessibilityRole="button"` |
| `aria-expanded` | `accessibilityState={{ expanded }}` |
| `role="dialog"` + modal | `accessibilityViewIsModal={true}` |
| Live region | `accessibilityLiveRegion="polite"` / `"assertive"` |

Screen titles: set `accessibilityLabel` on the root screen container or use React Navigation `options.title`.

---

## Color contrast (semantic pairs)

These pairs use design tokens and meet **WCAG 2.1 AA 4.5:1** for normal text on default backgrounds:

| Foreground | Background | Use |
| ---------- | ---------- | --- |
| `text-text-primary` | `bg-background-base` | Body copy, headings |
| `text-text-primary` | `bg-background-elevated` | Cards, modals |
| `text-text-secondary` | `bg-background-base` | Secondary copy (≥4.5:1 after token update) |
| `text-brand-accent` | `bg-background-base` | Links, primary accents |
| `text-white` / `text-text-inverse` | `bg-brand-accent` | Primary buttons |

Avoid pairing `text-text-muted` with `bg-background-base` for **essential** copy; use for non-critical hints only, or bump to `text-text-secondary`.

Run `pnpm lint:contrast` (see `Client/scripts/lint.d/`) after token changes.

---

## Lint and tests

- **ESLint:** `eslint-plugin-jsx-a11y` (recommended) on `apps/web`, `apps/mobile`, `packages/ui`, `packages/features`, `packages/hooks`, `packages/contexts`
- **SilverKey:** `no-direct-accessibility-props`, `require-interactive-label` in features and app pages
- **Unit:** jest-axe on key components (`BaseModal`, `ConfirmationDialog`, `Input`, `UnderlineTabs`)
- **Manual:** [accessibility-checklist.md](../runbooks/qa/accessibility-checklist.md) before release

---

## Out of scope

- Formal VPAT/ACR procurement documents
- Third-party iframe or partner-hosted content opened from placement links (partner responsibility)
- Server JSON API responses (no HTML UI surface)
