# Cursor agent memory — full setup

SilverKey uses **four complementary layers**. Configure all once; maintain repo memory as you ship.

| Layer | Configured in | SilverKey status |
| ----- | ------------- | ---------------- |
| **1. Repo memory bank** | `.cursor/memory/*.md` + `.cursor/rules/shared/agent-memory.mdc` | Committed in repo |
| **2. Cursor Settings → Memories** | Cursor app | Per developer (manual) |
| **3. Automations memory tool** | Agents → Automations → Tools → Memories | Per automation (manual) |
| **4. MCP `cursor-memory`** | `.cursor/mcp.json` | Local, gitignored |

---

## 1. Repo memory bank (team)

**Files:**

| File | Purpose |
| ---- | ------- |
| `projectbrief.md` | Product, architecture, RESPA reflex |
| `techContext.md` | Versions, `make` / `pnpm` commands, never-dos |
| `activeContext.md` | Current ticket, open questions |
| `progress.md` | Dated ship log |

**Rule:** `.cursor/rules/shared/agent-memory.mdc` tells agents when to read/update these files.

**Workflow:** At the start of a workstream, skim `activeContext.md`. After a merge-worthy chunk, update `activeContext.md` and append to `progress.md`.

---

## 2. Cursor Settings → Memories (account)

For preferences that apply to **all** projects on your machine:

1. **Cursor → Settings** (macOS) or **File → Preferences → Settings** (Windows/Linux), or `Cmd+Shift+J`.
2. Open **Rules** / **Memories** (label varies by Cursor version).
3. Enable **Memories** / **Generate memories** if shown.
4. Add or edit entries, or in Agent chat: *“Remember that SilverKey commits use `[LINEAR-ID] description`.”*

**Suggested user memories (paste or say in chat):**

- SilverKey: business logic in `Client/packages/`; `Client/apps/*` are thin composition only.
- SilverKey: never hand-edit OpenAPI-generated types; run `make openapi` / `make openapi-verify`.
- SilverKey: partner placement code needs RESPA comment blocks and auditable logging.
- SilverKey: verification bar — `pnpm check` (client), `make lint` or targeted pytest (server).

Privacy: Memories may require **Privacy Mode** off for auto-generation (see Cursor docs for your plan).

---

## 3. Automations → Memory Notes (per automation)

Automations are **not in git** — configure in **Agents → Automations** or [cursor.com/automations](https://cursor.com/automations).

### Sync repo seeds into Cursor

1. Create or open an automation → **Save** it.
2. **Tools** → enable **Memories** → **Manage** (Memory Notes).
3. From repo root, print the optimized bundle:

```bash
./scripts/print-automation-memory.sh engineer-default
```

4. Paste into the memory file; name the file to match the persona (e.g. `engineer-default`).
5. **Save**. After each run, append a **Run log** block (template in `_core.md`).

### Seed inventory

All seeds: [`.cursor/memory/automations/README.md`](../../../.cursor/memory/automations/README.md)

| Persona | Use |
| ------- | --- |
| `engineer-default` | General features / bugs |
| `react-lint` | Client ESLint |
| `ci-pr-babysit` | PR + CI green |
| `architecture-boundary` | Import layers / cycles |
| `partner-respa` | Rev-share / placement |
| `openapi-contract` | OpenAPI + codegen |
| … | See README for full list (maps to `.cursor/agents/*`) |

Each file is token-tight: **core constraints + persona gates + run log habit** — not a copy of `AGENTS.md`.

---

## 4. MCP `cursor-memory` (optional, local)

Adds `/memo`, `/recall`, `/forget` with local SQLite (no cloud).

**Install (repo):**

```bash
make setup-mcp   # seeds .cursor/mcp.json from example if missing; ensures npx
```

Add `cursor-memory` to your local `.cursor/mcp.json` when needed (it is intentionally not in the default lightweight example profile):

```json
"cursor-memory": {
  "command": "npx",
  "args": ["-y", "cursor-memory@<pinned-version>"]
}
```

**Enable in Cursor:** Settings → **MCP** → enable `cursor-memory`.

**Optional user rule** (Settings → Rules → User rules):

```markdown
## cursor-memory MCP
- /memo — save important decisions (with text, or summarize chat).
- /recall — search past memos before re-deriving context.
- /forget — delete after preview/confirm.
```

Repo-scoped memos stay separate from global memos (see `cursor-memory` package docs).

---

## What not to use

| Deprecated / alternate | Use instead |
| ---------------------- | ----------- |
| Notepads | Cursor **Memories** (settings) |
| Repo-root `.cursorrules` only | `.cursor/rules/*.mdc` |
| Ad-hoc `docs/` for guides | `documentation/` |

---

## Related

- [AGENTS.md](../../../AGENTS.md) — commands and gates
- [.cursor/README.md](../../../.cursor/README.md) — rules, skills, agents map
- [setup.md](../../../setup.md) — `make setup-mcp`
