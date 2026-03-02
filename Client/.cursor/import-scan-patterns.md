# Import scan – patterns and safe fixes

Generated from lint/typecheck scan. Use for batch fixes and follow-up.

## Pattern 1: Wrong `@/components/ui/` segment (alias = packages/ui/components/\*)

**Cause:** `@/components/*` already maps to `packages/ui/components/*`. Using `@/components/ui/...` resolves to `packages/ui/components/ui/...` (wrong).

**Safe fix:** Remove the extra `ui/` in the path.

| Bad                                         | Good                                           |
| ------------------------------------------- | ---------------------------------------------- |
| `@/components/ui/loading/KeyTurnLoader.web` | `@/components/asset/loading/KeyTurnLoader.web` |
| `@/components/ui/asset/MiniLogo.web`        | `@/components/asset/MiniLogo`                  |
| `@/components/ui/form/FormField`            | `@/components/form/FormField`                  |

**Commands (from Client/):**

```bash
# KeyTurnLoader (agent + messaging)
rg -l "@/components/ui/loading/KeyTurnLoader.web" --type-add 'ts:*.{ts,tsx}' -t ts | xargs -I {} sed -i '' 's|@/components/ui/loading/KeyTurnLoader.web|@/components/asset/loading/KeyTurnLoader.web|g' {}

# MiniLogo
rg -l "@/components/ui/asset/MiniLogo.web" --type-add 'ts:*.{ts,tsx}' -t ts | xargs -I {} sed -i '' 's|@/components/ui/asset/MiniLogo.web|@/components/asset/MiniLogo|g' {}

# FormField
rg -l "@/components/ui/form/FormField" --type-add 'ts:*.{ts,tsx}' -t ts | xargs -I {} sed -i '' 's|@/components/ui/form/FormField|@/components/form/FormField|g' {}
```

---

## Pattern 2: Relative path depth (calendar api)

**File:** `packages/features/calendar/api/googleCalendar.ts`  
**Cause:** From `packages/features/calendar/api/`, `../../` is `packages/features/`. To reach `packages/services/http/` need `../../../`.

**Safe fix:** `../../services/http/compatibility` → `../../../services/http/compatibility`

---

## Pattern 3: Unresolved / needs manual decision

- **`packages/types`** – No `packages/types` in repo. Call sites need to point to real types (e.g. `packages/schemas` or feature types).
- **`@/features/feed/index.web`** – Only `packages/features/feed/index.ts` exists. Use `@/features/feed` or add `index.web.ts` if needed.
- **`@/features/close/CloseLayout`** – Close lives under checklists: `packages/features/checklists/components/CloseLayout.tsx`. Use `@/features/checklists/components/CloseLayout` (or barrel).
- **`packages/features/profile/account/MobileHeader`** – Likely `packages/features/profile/components/account/MobileHeader` (verify path).
- **`packages/ui/components/ui`** – Redundant; probably `packages/ui/components` or `@ui`.
- **`packages/config/api/documents/docusign`** and **`packages/config/api/documents/report`** – Confirm these paths exist under `packages/config`.
- **Cross-feature / architecture** – `silverkey/no-cross-feature-internals` and `silverkey/no-restricted-imports-architecture` need refactors (move shared code to packages/hooks, packages/utils, or packages/ui), not just path fixes.

---

## Pattern 4: Relative parent imports (silverkey/no-relative-parent-imports)

Lint prefers path aliases over `../`. Fix by replacing with `packages/...` or `@/...` (and optionally running lint autofix where supported).

---

## Verification

After edits:

```bash
cd Client && pnpm typecheck && pnpm lint
```
