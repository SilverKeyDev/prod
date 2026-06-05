# Primitives vs Components

This folder is the **only place** in the codebase with shared React / React Native UI. Structure:

## Rule

- **Primitives** = one base component per platform per type. Each file wraps exactly one platform element (e.g. `<button>`, `<Text>`, `<img>`, `<View>`). No composition of other primitives.
- **Components** = everything that extends primitives (imports from `primitives/` and composes them). If a file does **not** contain a React-specific element (e.g. it only wraps another component), it does **not** belong in primitives - it lives in `components/`.

## Base primitives (stay in `primitives/`)

One file per platform; bundler resolves `.web.tsx` vs `.native.tsx`.

| Type     | Web element                                   | Native element | Files                                                       |
| -------- | --------------------------------------------- | -------------- | ----------------------------------------------------------- |
| Box      | `<div>`                                       | `<View>`       | `box/Box.web.tsx`, `box/Box.native.tsx`                     |
| Text     | `<p>` / `<span>` / `<div>` (single `as` prop) | `<Text>`       | `text/Text.web.tsx`, `text/Text.native.tsx`                 |
| Button   | `<button>`                                    | `<Pressable>`  | `button/Button.web.tsx`, `button/Button.native.tsx`         |
| Image    | `<img>`                                       | `<Image>`      | `media/Image.web.tsx`, `media/Image.native.tsx`             |
| Video    | `<video>`                                     | RN video       | `media/Video.web.tsx`, `media/Video.native.tsx`             |
| Input    | `<input>`                                     | `<TextInput>`  | `input/Input.web.tsx`, `input/Input.native.tsx`             |
| Select   | `<select>`                                    | RN picker      | `select/Select.web.tsx`, `select/Select.native.tsx`         |
| Checkbox | `<input type="checkbox">`                     | RN checkbox    | `checkbox/Checkbox.web.tsx`, `checkbox/Checkbox.native.tsx` |

Only these (and their platform variants) live in `primitives/`. Everything else lives in `components/` and imports from primitives.

## Components (live in `components/`, extend primitives)

- **button/** – Styled Button (variants, icons), IconButton, CancelButton, CloseButton, NavigationButton, NotInterested, HeartSave, etc. All use `primitives/button/Button`.
- **text/** – BodyText, Title, Subtitle, Label. All use `primitives/text/Text`.
- **form/** – Input (styled), FieldShell, FormField, Dropdown, Toggle, DateInput, TimeInput, VerificationCodeInput, etc. Use `primitives/input/Input`, `primitives/select/Select`, `primitives/checkbox/Checkbox`.
- **asset/** – KeyLogo, MiniLogo, WhiteLogo, StatusBadge, NotificationBadge. Use `primitives/media/Image`, `primitives/text/Text`, `primitives/box/Box`.
- **accessibility/** – AccessibleLink, AccessibleDialog, Region. Use `primitives/box/Box` and external (Link, Dialog).
- **loading/**, **sidebar/**, **selector/**, **popover/**, **icons/**, **tabs/** – All composed; live under `components/` and import primitives.

## File extensions

- Shared (both platforms): `Component.tsx` (re-export or let bundler pick).
- Web-only: `Component.web.tsx`.
- Native-only: `Component.native.tsx`.

No `web/` or `native/` subfolders; the extension is the platform.

## React Native styling

- **Flex:** React Native defaults to `flex-col`. In shared containers, set `flex-row` or `flex-col` explicitly so web and native match.
- **Text:** RN does not cascade text styles. Apply typography classes on the **Text** primitive, not on a parent Box. See `packages/ui/STYLING_RN.md`.
