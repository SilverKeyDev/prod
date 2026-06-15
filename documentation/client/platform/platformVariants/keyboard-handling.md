# Keyboard Handling (Web vs React Native)

This doc covers the **platform difference** for keyboard behavior and the **standard libraries** to use on React Native. There is no “web package” to swap — the DOM handles keyboards automatically; on RN you must opt in to avoidance.

---

## The difference

| Platform | Behavior |
|----------|----------|
| **Web (DOM)** | The browser handles the keyboard: the viewport shrinks or the page scrolls so the focused input stays visible. No extra code needed in most cases. |
| **React Native** | The **virtual keyboard slides over your UI** and can cover focused inputs. Without handling, users cannot see what they type in forms, modals, or bottom-anchored content. |

**The improvement:** Use standard native keyboard avoidance so forms and inputs remain visible when the keyboard is open.

---

## Standards (React Native)

Use one of these in `Client/apps/mobile/package.json` and wrap screens/scroll views or the root as needed.

### 1. react-native-keyboard-controller (preferred)

- **Role:** Modern, highly performant keyboard handling: animations, insets, and padding so UI moves with the keyboard.
- **Why prefer:** Outperforms the built-in `KeyboardAvoidingView`; actively maintained; works well with gesture handlers and modern RN/Expo.
- **Add to `apps/mobile/package.json`:** `react-native-keyboard-controller`. Follow the package’s setup (e.g. wrapping the app or specific screens with `KeyboardProvider` and using `KeyboardAvoidingView` / `KeyboardStickyView` from the lib).

### 2. react-native-keyboard-aware-scroll-view (fallback)

- **Role:** A scroll view that automatically adjusts when an input is focused so the field stays visible above the keyboard.
- **Why use:** Classic, reliable option when you mainly need “scroll view that bounces up when input is focused” without the full keyboard-controller API.
- **Add to `apps/mobile/package.json`:** `react-native-keyboard-aware-scroll-view`. Use `KeyboardAwareScrollView` (or the flat-list variant) in place of `ScrollView` where keyboard avoidance is needed.

---

## Implementation

- **Where:** In `apps/mobile/`, wrap screens or scroll areas that contain text inputs (e.g. login, profile, forms, modals with inputs) with the chosen library’s component.
- **Shared forms:** If a form lives in `packages/` and is used by both web and mobile, the **layout** that wraps inputs (e.g. scroll + avoidance) should be provided by the app: web needs no wrapper; mobile uses `KeyboardProvider` + avoidance view or `KeyboardAwareScrollView` in the mobile screen/layout that hosts the form.
- **Do not add** these packages to `apps/web/package.json`; they are React Native–only.

---

## Summary

| Aspect | Web | React Native |
|--------|-----|---------------|
| Behavior | Viewport/scroll handled by browser | Keyboard covers UI unless handled |
| Package | None | react-native-keyboard-controller (preferred) or react-native-keyboard-aware-scroll-view |
| Where | N/A | apps/mobile layouts/screens that contain inputs |
