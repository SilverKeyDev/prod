# SilverKey — project brief

**Product:** Proptech OS for home transactions — brokerage-mandated adoption, buyer workflows, partner placement marketplace.

**Repo:** Monorepo — `Client/` (pnpm, React web + RN), `Server/` (Flask/Python), `openapi/` (contract).

**Architecture:** Thin apps (`Client/apps/*`), fat packages (`Client/packages/*`). Workspace shells (buyer / seller / brokerage) live in packages, not fat app pages.

**Compliance:** Partner placement and money-adjacent flows must stay RESPA-aware — brokerage marketplace model, auditable exposure, no agent kickbacks. See `.cursor/rules/shared/silverkey-context.mdc` and `.cursor/rules/shared/respa-compliance.mdc`.

**Canonical context:** `.cursor/rules/shared/silverkey-context.mdc` + `.cursor/rules/shared/pitch-and-fundraising.mdc` (company/fundraising), `AGENTS.md` (commands/gates), `documentation/` (long-form guides).

**Cursor Automations:** Paste seeds from `.cursor/memory/automations/` into Memory Notes — see `automations/README.md` or `./scripts/print-automation-memory.sh <persona>`.
