# Color System

Single source of truth for SilverKey colors. All hex/hsl values live in `Client/packages/design-tokens/tokens/colors.json`. Web and mobile consume the same tokens via Tailwind/NativeWind.

## Rules

- **No opacity modifiers** — Do not use Tailwind opacity modifiers (`/50`, `/80`, `/20`, `/10`, etc.). They behave differently on React Native and create inconsistent visuals.
- **Explicit tokens only** — Each visual state gets its own hex value in the token file. Use `bg-primary-muted` instead of `bg-primary/10`.
- **Mobile-safe** — Use kebab-case token names that Tailwind and NativeWind both resolve. No `.web` vs `.native` color divergence.

## Brand & Action Colors

| Token | Hex | Use Cases |
|-------|-----|-----------|
| `primary` | #7C8F7E | Main buttons, active progress, checkmarks, primary CTAs |
| `primary-hover` | #657766 | Hover state for primary buttons and active elements |
| `primary-muted` | #E8EBE7 | Light tint backgrounds (e.g. selected state) |
| `accent` | #C2A878 | Highlights, active sidebar tabs, premium badges, secondary emphasis |
| `accent-hover` | #A89062 | Hover for accent elements |
| `accent-muted` | #F5F2EB | Light accent tint backgrounds |

## Semantic / Utility Colors

| Token | Hex | Use Cases |
|-------|-----|-----------|
| `destructive` | #AF6E65 | Errors, warnings, cancel buttons, delete actions |
| `destructive-hover` | #945A53 | Hover for destructive buttons |
| `disabled` | #D5D5D1 | Locked steps, inactive buttons, padlock icons, disabled text |

## Backgrounds & Surfaces

| Token | Hex | Use Cases |
|-------|-----|-----------|
| `background-base` | #F7F6F2 | App main canvas, page background |
| `background-surface` | #FFFFFF | Content cards, checklists, modals |
| `background-sidebar` | #646663 | Navigation container, sidebar |

## Text & Borders

| Token | Hex | Use Cases |
|-------|-----|-----------|
| `text-primary` | #2D2D2A | Headings, main body text |
| `text-secondary` | #A8A8A2 | Subtitles, timestamps, descriptive text |
| `text-disabled` | #D5D5D1 | Locked/disabled text |
| `border` | #A8A8A2 | Dividers, input borders |

## Special

| Token | Value | Use Cases |
|-------|-------|-----------|
| `overlay-backdrop` | rgba(0,0,0,0.5) | Modal/dialog backdrops (only token with transparency) |

## Token-to-Tailwind Mapping

| Token | Tailwind Classes |
|-------|------------------|
| primary | `bg-primary`, `text-primary`, `border-primary` |
| primary-hover | `hover:bg-primary-hover`, `active:bg-primary-hover` |
| primary-muted | `bg-primary-muted` |
| accent | `bg-accent`, `text-accent`, `border-accent` |
| accent-hover | `hover:bg-accent-hover` |
| accent-muted | `bg-accent-muted` |
| destructive | `bg-destructive`, `text-destructive`, `border-destructive` |
| destructive-hover | `hover:bg-destructive-hover` |
| disabled | `bg-disabled`, `text-disabled`, `disabled:bg-disabled`, `disabled:text-disabled` |
| background-base | `bg-background-base` |
| background-surface | `bg-background-surface` |
| background-sidebar | `bg-background-sidebar` |
| text-primary | `text-text-primary` |
| text-secondary | `text-text-secondary` |
| text-disabled | `text-text-disabled` |
| border | `border-border` |
| overlay-backdrop | `bg-overlay-backdrop` |

## Migration Mapping (Old → New)

| Old Token | New Token |
|-----------|-----------|
| brand-accent, olive | primary |
| olive-hover, olive-pressed | primary-hover |
| gold, beige, button-tertiary | accent |
| (new) | accent-hover |
| rose | destructive |
| rose-light | destructive-hover |
| (new) | disabled |
| off-white, off-white-gray | background-base |
| white (for cards) | background-surface |
| sidebar-gray, warm-stone | background-sidebar |
| neutral-900, navy | text-primary |
| neutral-500, gray-brown | text-secondary |
| (new) | text-disabled |
| neutral-300, gray borders | border |

## Usage

- **Tailwind:** Use classes like `bg-primary`, `text-text-primary`, `border-border`.
- **Inline styles:** Use `color("primary")` from `packages/design-tokens`.
- **Never:** Use literal hex, opacity modifiers (`/50`), or `opacity-*` for color states.
