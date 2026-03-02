# React Native Styling (NativeWind)

Shared UI in `packages/ui` is used on both web and React Native. NativeWind applies Tailwind classes via `className` on RN components. Follow these rules so layouts and typography work on both platforms.

## Default flex direction

React Native defaults to **flex column** (`flex-col`). For predictable cross-platform layout:

- **Always set flex direction explicitly** on shared container components: use `className="flex flex-col"` or `className="flex flex-row"` instead of relying on defaults.
- This keeps web and native behavior aligned when the same component is used in both apps.

## Text and typography

React Native **does not cascade text styles** down the tree. On the web, a parent `div` with `text-sm` affects child text; on RN it does not.

- **Apply typography classes on the Text primitive**, not on a parent Box. For example, use `<Text className="text-sm text-gray-700">...</Text>` instead of `<Box className="text-sm"><Text>...</Text></Box>`.
- Shared text components (BodyText, Title, Subtitle, Label) already use the Text primitive and apply classes on it; keep that pattern in any new shared components.

## Primitives and className

Box, Text, and Input primitives accept `className` on both web and native. NativeWind applies the styles on RN. Use the same Tailwind classes in shared code; they resolve per platform.
