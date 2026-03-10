# Platform Variants (Web vs React Native)

This folder documents **package-level adaptations**: every dependency used on **web** (from `Client/package.json` and `Client/apps/web/package.json`) that requires a **different package or implementation** on React Native. Each file describes how and where the RN version will be implemented and which package(s) to use.

**Scope:** Dependencies listed in the app/root `package.json` files only — not shared-package internals. For shared code and file extensions (`.web` / `.native`), see [react-vs-react-native-packages.md](../react-vs-react-native-packages.md).

## Index

| Web package | React Native adaptation | Doc |
|-------------|-------------------------|-----|
| react-dom | N/A (RN uses its own renderer) | [react-dom.md](./react-dom.md) |
| react-router-dom | React Navigation | [react-router-dom.md](./react-router-dom.md) |
| @headlessui/react | RN primitives / native UI libs | [headlessui.md](./headlessui.md) |
| framer-motion | react-native-reanimated / Animated API | [framer-motion.md](./framer-motion.md) |
| hls.js | expo-av / react-native-video | [hls.md](./hls.md) |
| lucide-react | @expo/vector-icons or RN icon set | [lucide-react.md](./lucide-react.md) |
| embla-carousel-react | react-native-reanimated-carousel or FlatList | [embla-carousel-react.md](./embla-carousel-react.md) |
| react-virtuoso | FlatList / SectionList | [react-virtuoso.md](./react-virtuoso.md) |
| react-phone-number-input | RN-compatible input or custom | [react-phone-number-input.md](./react-phone-number-input.md) |
| react-responsive-carousel | Same as carousel variant | [react-responsive-carousel.md](./react-responsive-carousel.md) |

**RN-specific (no web package):** [keyboard-handling.md](./keyboard-handling.md) — Keyboard avoidance on React Native (DOM handles it automatically on web).

## Where implementations live

- **Web:** Code using these packages lives in `apps/web/` (and in `packages/*` only where a `.web.tsx` / `.web.ts` implementation exists). Vite resolves `.web.*` when building web.
- **React Native:** Implementations live in `apps/mobile/` or in shared packages as `.native.tsx` / `.native.ts`. Metro resolves `.native.*` when building mobile. Dependencies for RN are declared in `Client/apps/mobile/package.json` (or added there when implementing the variant).
- **Config source of truth:** The list of file-level platform variants that are explicitly allowed to diverge lives in `Client/packages/config/platform/variants.json`, the shared primitive modules (buttons, text, layout, etc.) live in `Client/packages/config/platform/primitives.json`, and layout-specific implementations are documented in `Client/packages/config/platform/layouts.json`. ESLint rules read these files to keep divergence contained.

## Related

- [technology-swap-rationale.md](./technology-swap-rationale.md) — Why each web → RN package choice is preferred over alternatives.
- [react-vs-react-native-packages.md](../react-vs-react-native-packages.md) — Platform extensions, shared packages, bundler resolution.
- [web-mobile-parity-gotchas.md](../web-mobile-parity-gotchas.md) — React version, API versioning, deep linking.
