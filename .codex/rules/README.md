# Codex rules adapters

Canonical SilverKey constraints live in [`.cursor/rules/`](../../.cursor/rules/) as `.mdc` files (Cursor frontmatter + globs).

Each `*.md` file here mirrors [`.claude/rules/`](../../.claude/rules/): optional `paths:` hint for Codex, then an `@` pointer to the canonical `.mdc`. **Edit `.cursor/rules/` first**; update this tree when paths or rule names change.

**Always-on (7):** `shared-security`, `shared-thin-app-architecture`, `shared-linting`, `shared-documentation`, `shared-silverkey-context`, `shared-code-style`, `shared-env-vars-minimal`.

**Index:** [`.cursor/rules/README.md`](../../.cursor/rules/README.md).

Codex does not auto-load this folder like Cursor globs — read the relevant stub or `.mdc` for your task, or `@`-reference a rule file in prompts.
