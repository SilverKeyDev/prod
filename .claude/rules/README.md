# Claude rules adapters

Canonical SilverKey constraints live in [`.cursor/rules/`](../../.cursor/rules/) as `.mdc` files (Cursor frontmatter + globs).

Each `*.md` file here mirrors [`.codex/rules/`](../../.codex/rules/): `alwaysApply: false` + comma-separated `paths:` for lazy-load, then an `@` pointer to the canonical `.mdc`. **Edit `.cursor/rules/` first**; update this tree when paths or rule names change.

**Always-on (7):** Loaded only via [CLAUDE.md](../../CLAUDE.md) `@` includes — `security`, `thin-app-architecture`, `linting`, `documentation`, `silverkey-context`, `code-style`, `env-vars-minimal`. **Do not add pathless stubs** (they duplicate session load).

**Scoped:** Remaining stubs use `alwaysApply: false` + `paths:` CSV frontmatter to attach when Claude reads matching files.

**Index:** [`.cursor/rules/README.md`](../../.cursor/rules/README.md).

For path-specific tasks, read the relevant stub or `.mdc` directly, or `@`-reference a rule file in prompts.
