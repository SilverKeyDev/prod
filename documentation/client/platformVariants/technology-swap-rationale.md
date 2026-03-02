# Technology Swap Rationale: Why Each Package Over Alternatives

This document explains each **web → React Native** technology swap in the SilverKey Client: which package (or approach) we use on native and **why it is preferred over alternatives**. For implementation details and file-extension rules, see the per-package docs in this folder.

---

## 1. react-dom → (no package; use RN renderer)

| Web | React Native | Why this choice |
|-----|--------------|------------------|
| `react-dom` | Built-in React Native renderer | **Platform-defined.** There is no “replacement” for react-dom on mobile — React Native ships its own renderer that targets native views. Adding react-dom to mobile would be wrong (it expects a DOM). Portals become `Modal` or navigation stack; DOM refs become `View`/`TextInput` refs. |

**Alternatives considered:** None. Using react-dom on RN is not supported and would break.

---

## 2. react-router-dom → React Navigation

| Web | React Native | Why this choice |
|-----|--------------|------------------|
| `react-router-dom` | `@react-navigation/native`, `native-stack`, `bottom-tabs` | **De facto standard** for React Native routing: native stack/tab behavior, deep linking, and Expo compatibility. Our `packages/navigation` adapter keeps features router-agnostic; the mobile implementation wires the adapter to React Navigation. |

**Alternatives considered:**

- **react-native-navigation (Wix):** Native stack per screen; more performant in some cases but requires native linking and is a larger commitment. We prefer React Navigation’s JS-based API and easier Expo integration.
- **Custom router:** Possible but duplicates deep linking, back handling, and tab behavior that React Navigation already solves.

---

## 3. @headlessui/react → RN primitives + optional @gorhom/bottom-sheet

| Web | React Native | Why this choice |
|-----|--------------|------------------|
| `@headlessui/react` | `Modal`, `View`, `Pressable`; optionally `@gorhom/bottom-sheet` | Headless UI is **DOM-only** (no RN port). On native we use **platform primitives** so we don’t depend on a DOM-based lib. For sheet-style UIs (e.g. filters), **@gorhom/bottom-sheet** is the standard: gesture-driven, performant, and widely used. |

**Alternatives considered:**

- **Port Headless UI to RN:** Not maintained; would require a fork and ongoing work.
- **Other bottom-sheet libs:** Several exist; `@gorhom/bottom-sheet` has the best maintenance and integration with Reanimated/gestures.
- **Modal + View only:** No extra dependency and works; we add bottom-sheet only where we want native-feel sheets.

---

## 4. framer-motion → react-native-reanimated

| Web | React Native | Why this choice |
|-----|--------------|------------------|
| `framer-motion` | `react-native-reanimated` (+ optional `react-native-gesture-handler`) | **Reanimated runs animations on the UI thread**, avoiding JS bridge stalls and keeping 60fps. It’s the standard for serious RN animation and works with Expo (with the required Babel plugin). Framer Motion has no real RN support. |

**Alternatives considered:**

- **React Native’s built-in Animated API:** Works but is older and less expressive; Reanimated is the modern replacement for complex animations.
- **react-native-animatable:** Less maintained and less capable than Reanimated.
- **Lottie:** Good for design-driven animations only; not a replacement for layout/gesture-driven motion.

---

## 5. hls.js → expo-av or react-native-video

| Web | React Native | Why this choice |
|-----|--------------|------------------|
| `hls.js` | `expo-av` (Expo) or `react-native-video` | **hls.js relies on MSE (Media Source Extensions)**, which doesn’t exist on React Native. On native, the OS provides HLS decoding. **expo-av** is the natural choice with Expo: `Video` supports HLS URLs and fits the Expo toolchain. **react-native-video** is the standard if not using Expo. |

**Alternatives considered:**

- **Using hls.js on RN:** Not viable; MSE is a browser API.
- **Custom native HLS module:** Unnecessary; both expo-av and react-native-video already expose HLS via the native players.

---

## 6. lucide-react → @expo/vector-icons or lucide-react-native

| Web | React Native | Why this choice |
|-----|--------------|------------------|
| `lucide-react` | `@expo/vector-icons` or `lucide-react-native` | **lucide-react** renders SVG in the DOM; RN doesn’t use DOM. **@expo/vector-icons** is bundled with Expo and gives a large icon set (Material, Ionicons, etc.) with no extra setup. **lucide-react-native** keeps the **same icon set and naming** as web, so one icon barrel can map names to the right implementation per platform. |

**Alternatives considered:**

- **Using lucide-react on RN:** Possible in some setups but relies on SVG-to-view layers and can be fragile; not recommended.
- **react-native-vector-icons:** Similar to Expo’s set; often requires extra linking. With Expo, @expo/vector-icons is simpler.
- **Custom icon set:** More work and diverges from web; lucide-react-native preserves parity when available.

---

## 7. embla-carousel-react → react-native-reanimated-carousel or FlatList

| Web | React Native | Why this choice |
|-----|--------------|------------------|
| `embla-carousel-react` | `react-native-reanimated-carousel` or `FlatList` (horizontal + paging) | **Embla is DOM-based.** On RN we either use **FlatList** (built-in, virtualized, no new dependency) for simple horizontal lists, or **react-native-reanimated-carousel** for **smooth, gesture-driven carousels** that feel closer to Embla. |

**Alternatives considered:**

- **react-native-pager-view:** Good for full-screen pagers; heavier and more native-centric. We prefer Reanimated-based carousel for consistency with our animation stack.
- **Only FlatList:** Valid; we use it when we don’t need carousel-specific gestures. Reanimated-carousel is optional for UX parity.

---

## 8. react-virtuoso → FlatList / SectionList (no extra package)

| Web | React Native | Why this choice |
|-----|--------------|------------------|
| `react-virtuoso` | `FlatList` / `SectionList` from `react-native` | **Virtuoso virtualizes DOM lists;** React Native’s **FlatList and SectionList are virtualized by default**. No third-party package is needed; the platform primitives are the right tool and avoid extra dependency and API mismatch. |

**Alternatives considered:**

- **react-native-virtuoso or similar:** Would add a dependency for behavior the core already provides; FlatList/SectionList are the standard and well supported.

---

## 9. react-phone-number-input → react-native-phone-number-input or custom

| Web | React Native | Why this choice |
|-----|--------------|------------------|
| `react-phone-number-input` | `react-native-phone-number-input` or custom `TextInput` + picker | The web package is **DOM/input-based**. **react-native-phone-number-input** gives a similar UX (country picker, formatting) on RN. **Custom** (TextInput + modal picker + shared parsing in `packages/utils`) is an option for full control. We prefer the RN-specific package for feature parity; validation/parsing stay shared. |

**Alternatives considered:**

- **Using react-phone-number-input on RN:** Tied to DOM inputs; not a good fit.
- **Custom only:** More control but more code; we use the dedicated RN package when it meets needs.

---

## 10. react-responsive-carousel → same as Embla (reanimated-carousel or FlatList)

| Web | React Native | Why this choice |
|-----|--------------|------------------|
| `react-responsive-carousel` | Same as [embla-carousel-react](./embla-carousel-react.md): `react-native-reanimated-carousel` or `FlatList` | **react-responsive-carousel** is DOM-based. We **reuse the same native carousel strategy** as for Embla: one abstraction (e.g. `ImageCarousel`) with `.web.tsx` (either carousel lib) and `.native.tsx` (RN carousel). No need for a second native carousel library. |

**Alternatives considered:** Same as for Embla; one carousel approach on native keeps the codebase consistent.

---

## Summary table

| Web package | RN choice | Main reason |
|-------------|-----------|-------------|
| react-dom | RN renderer (no package) | Platform renderer; use Modal/refs for portals and refs. |
| react-router-dom | React Navigation | Standard RN routing; deep linking; adapter keeps features portable. |
| @headlessui/react | Modal, View, Pressable; optional @gorhom/bottom-sheet | Headless UI is DOM-only; primitives + bottom-sheet for native UX. |
| framer-motion | react-native-reanimated | UI-thread animations; standard for RN; no real framer-motion on RN. |
| hls.js | expo-av or react-native-video | No MSE on RN; native HLS via Expo or react-native-video. |
| lucide-react | @expo/vector-icons or lucide-react-native | DOM SVG vs native; Expo set or same icon set with lucide-react-native. |
| embla-carousel-react | reanimated-carousel or FlatList | DOM vs native; FlatList for simple, reanimated-carousel for parity. |
| react-virtuoso | FlatList / SectionList | Core lists are virtualized; no extra package. |
| react-phone-number-input | react-native-phone-number-input (or custom) | DOM input vs RN; shared parsing in packages/utils. |
| react-responsive-carousel | Same as Embla | One native carousel strategy for both web carousel libs. |

---

## Related

- [README](./README.md) — Index of platform variant docs.
- [react-vs-react-native-packages.md](../react-vs-react-native-packages.md) — Platform extensions and shared vs platform-specific code.
