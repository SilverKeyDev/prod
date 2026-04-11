# @silverkey/design-tokens

Single source of truth for design tokens (colors, spacing, typography, breakpoints). Consumed by Tailwind (`apps/web/tailwind.config.ts`), ThemeContext, and email components.

## Usage

- **Colors**: Use `color("brand.accent")` for inline styles, or Tailwind classes like `text-brand-accent`, `bg-neutral-100`.
- **Spacing**: Use `spacing(n)` (e.g. `spacing(2)`) for inline styles, or Tailwind classes like `p-2`, `gap-4`.
- **Breakpoints**: Use `breakpoint("md")` when you need the raw value, or Tailwind screen utilities / `screenDown`/`screenUp`.

## API

- `colors`, `spacing` (map), `breakpoints`, `fontFamily`, `fontSize`, `themeSpacing` - raw token objects.
- `spacing(n)` / `spacingToken(n)` - resolve spacing by key (number or semantic name).
- `color(path)` - resolve color by path string (e.g. `"neutral.500"`).
- `breakpoint(name)` - resolve breakpoint value (e.g. `"768px"`).

## Rules

- Literal hex colors are allowed **only** in this package (e.g. `tokens/colors.ts`).
- In `apps/web/components/**` and `apps/web/features/**`, ESLint forbids literal hex and warns on raw numeric/px spacing.
