# Cross-feature composition

**Source of truth** for importing across `Client/packages/features/<name>/` boundaries. Feature modules own product domains; **orchestrator features** compose others through stable public surfaces (barrels and documented subpaths). This is intentional—not a lint violation to fix repo-wide.

**Related:** [layered-architecture-imports.md](./layered-architecture-imports.md), [thin-app-architecture.md](./thin-app-architecture.md), [Client/packages/features/README.md](../../../Client/packages/features/README.md).

---

## What ESLint actually enforces

| Rule | Scope |
| ---- | ----- |
| `silverkey/no-restricted-imports-architecture` | Feature **UI** must not import `packages/api` or business `packages/services` (use hooks). |
| `silverkey/no-cross-feature-utils-imports` | **Warn** on **value** imports from another feature’s **`utils/`** path. `import type` is allowed. |
| `silverkey/package-module-allowed-children` | Allowed top-level folders per feature (`api/`, `components/`, …). |
| `pnpm lint:cycles` | No circular dependencies in `packages/` and apps. |

There is **no** rule that bans all cross-feature imports. Policy is **documented here** plus the utils warning above.

**Visibility:** From `Client/`, run `pnpm audit:cross-feature-imports:json` ([audit script](../../../Client/scripts/duplication/audit-cross-feature-imports.mjs)). Not a CI gate.

---

## Import tiers

### Tier 1 — Preferred (default for new code)

- Import from the provider’s **barrel**: `packages/features/<provider>` (`index.ts`).
- Or a **documented subpath** (narrow public surface), e.g. `packages/features/agent/components/messaging/chrome`.
- Use **`import type`** when only types are needed.
- When **three or more features** need the same **pure** logic, lift to `packages/utils/` or shared data orchestration to `packages/hooks/data/<domain>/` (see [utility-deduplication skill](../../../.cursor/skills/utility-deduplication-subagents/SKILL.md)).

### Tier 2 — Allowed with intent (orchestrator features)

Hub features compose multiple providers for product surfaces. Examples:

| Orchestrator | Typical providers | Role |
| ------------ | ----------------- | ---- |
| **dashboard** | agent, calendar, checklists, documents, homeauth | Post-login shell |
| **saved** | documents, homeauth, search, compare, propertyDetails | Library + homes + docs |
| **agent** (client hub, messaging) | checklists, profile, documents, messaging, calendar, homeauth, saved, search | Agent workspace |
| **checklists** | profile, documents, partners, calendar, messaging, search | Transaction roadmap + integrations |
| **search** | profile, feed, propertyDetails, agent, compare | Map/list + prefs |
| **messaging** | agent, documents, calendar, search | Threads + agent chrome |
| **homeauth** | profile, checklists, agent | Auth, onboarding, landing |

**Apps** (`apps/web`, `apps/mobile`) may import any feature freely—that is the thin-shell job. These tiers apply **inside** `packages/features/<consumer>/`.

### Tier 3 — Discouraged (fix when you touch the file)

- **Deep imports** into another feature’s tree when the barrel or a named subpath exists (`.../hooks/data/...`, `.../components/.../internal`).
- **Value imports** from another feature’s **`utils/`** (ESLint warn—consolidate to `packages/utils` or the owning feature’s barrel).
- **New** cross-feature paths via `@/features/...`—prefer `packages/features/...` for consistency.

### Still forbidden

- Feature code → `apps/web/*` or `apps/mobile/*`
- Feature **components** → `packages/api/*` or business `packages/services/*` (use feature hooks or `packages/hooks`)
- **`packages/ui` → `packages/features`** (design system must not depend on product modules; existing violations are separate tech debt)

---

## Stable edges (audit snapshot)

Counts are **import statements** where consumer feature ≠ provider (same-feature imports excluded). Regenerate with `pnpm audit:cross-feature-imports:json`.

**Totals (2026-06):** 203 imports across 51 consumer→provider pairs.

| Consumer → provider | Count | Typical reason |
| ------------------- | ----- | -------------- |
| saved → documents | 24 | Library tabs, signing, forms |
| agent → messaging | 17 | Agent messaging UI + data |
| agent → documents | 14 | Client hub, attachments, signing |
| checklists → profile | 12 | Buyer prefs / criteria integrations |
| messaging → documents | 7 | Agreements, attachments |
| agent → calendar | 6 | Event requests, scheduling |
| agent → checklists | 6 | Client hub roadmap |
| profile → homeauth | 6 | Session / auth context |
| search → profile | 6 | Search prefs, scoring inputs |
| agent → homeauth | 5 | Workspace, auth |
| checklists → documents | 5 | Step attachments, forms |
| dashboard → calendar | 5 | Agenda widgets |
| homeauth → profile | 5 | Onboarding, profile sync |
| partners → checklists | 5 | Partner placement steps |
| saved → homeauth | 5 | Auth-gated library |
| search → feed | 5 | Reels on search |
| agent → search | 4 | Share homes, map |
| checklists → partners | 4 | Partner integrations |
| dashboard → agent | 4 | Agent today / clients |
| dashboard → checklists | 4 | Dashboard checklist widgets |

Remaining pairs are lower volume; use the JSON audit for the full graph.

---

## Decision tree

```text
Need something from another feature?
├─ UI component or hook exported from provider barrel?
│  └─ YES → Tier 1: import packages/features/<provider> (or documented subpath)
├─ Pure helper used in 3+ features?
│  └─ YES → Lift to packages/utils/<domain>/ (Tier 1)
├─ Shared server-state orchestration used in 3+ features?
│  └─ YES → packages/hooks/data/<domain>/ (Tier 1)
├─ Building a hub screen (dashboard, saved, agent hub, …)?
│  └─ YES → Tier 2: compose barrels; keep imports in hooks when possible
├─ Only types?
│  └─ import type from provider; consider packages/schemas if widely shared
└─ Importing provider's utils/ directly?
   └─ Tier 3: ESLint warn → move to packages/utils or re-export via provider barrel
```

---

## Patterns (examples)

### Shell + children (Pattern A)

Generic chrome in one feature; domain panels composed by the parent screen.

- Messaging: `MessagingSidebarShell` + agent-owned `AgentMessagingClientList` wired in `AgentMessaging`.

### Narrow chrome barrel (Pattern B)

One feature needs a single panel from another—import a **named subfolder**, not the full feature barrel.

- Messaging → `packages/features/agent/components/messaging/chrome` (not all of `agent/components/modals`).

See [Client/packages/features/README.md](../../../Client/packages/features/README.md) for messaging↔agent specifics.

---

## Partner / RESPA note

Code on **partner placement, marketplace, or referral** edges (e.g. checklists ↔ partners) must stay **auditable**: prefer barrels and explicit hooks; do not copy steering or compensation logic into another feature’s `utils/`. See [respa-compliance.mdc](../../../.cursor/rules/shared/respa-compliance.mdc).

---

## Out of scope (for now)

- ESLint **error** on all cross-feature imports
- CI failure on audit import counts
- Mass refactor of existing edges into `packages/hooks`
- `packages/ui` → `packages/features` cleanup (separate boundary)

When touching cross-feature code, opportunistically prefer Tier 1 (barrel/subpath) over deep paths—no big-bang refactor required.
