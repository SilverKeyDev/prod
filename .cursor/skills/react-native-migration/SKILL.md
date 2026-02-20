---
name: react-native-migration
description: Converts React (Web) components to production-ready React Native components. Preserves separated business logic in .ts files; converts only JSX/UI and view logic. Use when migrating a Web component to React Native, converting .tsx/.jsx to RN, or when the user says "migrate this file" in a React Native context.
---

# React Native Migration

Convert a React (Web) component into a production-ready React Native component. **Only convert the JSX/UI layer**; keep imports to existing `.ts` logic files unchanged.

## 0. CRITICAL: Separated Logic

- Business logic is **already** in `.ts` files.
- **DO NOT** rewrite logic, state, or hooks from external files.
- **DO** preserve imports to those `.ts` files.
- **DO** convert only the JSX/UI and direct view logic.

## 1. Component Mapping (Strict)

| Web | React Native | Notes |
|-----|--------------|--------|
| `<div>`, `<section>`, `<article>`, `<main>` | `<View>` | Use `flex: 1` for page containers |
| `<span>`, `<p>`, `<h1>`–`<h6>`, `<label>` | `<Text>` | **MANDATORY**: All strings inside `<Text>` |
| `<img src="...">` | `<Image source={{ uri: ... }} />` | Set width/height in style |
| `<button>`, `<a onClick>` | `<Pressable>` or `<TouchableOpacity>` | `onClick` → `onPress` |
| `<input>` | `<TextInput>` | `onChange` → `onChangeText`; keep `value` |
| `<ul>`, `<ol>`, `.map(...)` lists | `<FlatList>` | Prefer over `ScrollView` for lists |
| Scrollable container | `<ScrollView>` | When content exceeds screen height |

## 2. Styling

- **No CSS files:** Put all styles in `const styles = StyleSheet.create({ ... })`.
- **Units:** `px` → number (e.g. `16px` → `16`).
- **Flexbox:** RN default is `flexDirection: 'column'`. For rows use `flexDirection: 'row'`.
- **Backgrounds:** Use `backgroundColor`; no `background` shorthand.

## 3. Conversion Steps ("Migrate this file")

1. **Imports:** Keep `.ts` logic imports. Replace `react-router` with `@react-navigation/native` if used.
2. **Text:** Wrap every raw string in JSX in `<Text>`.
3. **Primitives:** Apply the mapping table (Section 1).
4. **Styles:** Build `StyleSheet` at the bottom of the file.
5. **Safe area:** For a top-level screen, wrap root in `<SafeAreaView>`.

## 4. Gotchas

- **Events:** `onClick` → `onPress`.
- **SVGs:** Replace with `react-native-svg` primitives; add a TODO if complex.
- **Navigation:** `useNavigate` → `useNavigation`.

## 5. Output

- Return **only** the full code for the new file.
- Do not explain reasoning unless asked.
- Keep the original filename (e.g. same base name, `.tsx`).
