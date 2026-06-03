# Accessibility release checklist (WCAG 2.1 AA)

Manual pass before shipping user-facing web or mobile changes. Pair with automated checks: `pnpm test:run` (jest-axe), `pnpm a11y:critical-path` (Playwright + axe on logged-in routes), and `pnpm lint`.

Standards reference: [accessibility-standards.md](../standards/accessibility-standards.md).

---

## Keyboard (web)

- [ ] Tab through the flow in logical order; no unexpected jumps
- [ ] Skip link (“Skip to main content”) focuses `#main-content` on first Tab from page load
- [ ] All interactive controls operable with Enter/Space where expected
- [ ] Modals: Escape closes; focus trapped inside panel while open; focus returns sensibly after close
- [ ] Tabs: ArrowLeft/ArrowRight move between tabs (UnderlineTabs)
- [ ] No keyboard traps outside intentional modal focus management

## Screen readers

- [ ] **VoiceOver (macOS Safari or iOS):** P0 flow — login or dashboard → checklist or search → one modal
- [ ] **TalkBack (Android):** Same P0 flow on mobile build
- [ ] Form fields announce label + error messages
- [ ] Icon-only buttons announce a name (not “button” with no label)
- [ ] Dynamic updates (toasts, loading) announced via live regions where applicable

## Visual / responsive

- [ ] 200% browser zoom: content reflows without horizontal scroll on primary flows
- [ ] Touch targets ≥44×44px on mobile web and native
- [ ] Focus indicator visible on all interactive elements (`:focus-visible`)
- [ ] `prefers-reduced-motion: reduce`: no essential information conveyed by motion alone

## Automated (run locally)

```bash
cd Client
pnpm lint
pnpm test:run packages/ui/components/accessibility/a11y.test.tsx
./scripts/lint.d/20_contrast-tokens.sh
# With dev server + auth storage recorded:
pnpm a11y:critical-path
```

---

## P0 flows (minimum smoke)

1. Sign in → land on dashboard
2. Open workspace navigation (sidebar or mobile bottom nav)
3. Open a checklist step or search results
4. Open and dismiss one modal (e.g. property details, confirm dialog)

Record issues with route, assistive tech, and WCAG criterion when filing tickets.
