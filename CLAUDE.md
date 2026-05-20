# SilverKey — AI Context

This file is the canonical context for any AI assistant working in this repository. It is read automatically by Cursor, Claude Code, and other AI tools.

For engineering commands, directory layout, and quality gates, see [AGENTS.md](AGENTS.md). For long-form product and architecture docs, see [documentation/](documentation/README.md).

---

## What SilverKey is

SilverKey (usesilverkey.com) is an Atlanta-based proptech startup building **the operating system for home transactions** — the tagline is: *"The operating system unlocking home transactions."*

The product is adopted **top-down through brokerages**: a brokerage mandates the platform, agents bring buyers onto it, and ancillary partners (lenders, title, insurance, moving, concierge) pay for **placement** inside the product. Revenue flows to brokerages as a **technology platform fee**, not as a referral payment to agents for steering buyers to specific settlement-service providers.

Because brokerages cannot directly sell lender, title, or insurance services to buyers under **RESPA**, SilverKey hosts a **compliant placement marketplace**: partners pay for access and visibility; the brokerage earns platform revenue. Any feature touching partner placement, agent compensation, or buyer-facing service recommendations must be evaluated against RESPA. See `.cursor/rules/shared/respa-compliance.mdc` when editing partner-related code.

---

## Who we are

- **Jayce Walzer** — Co-founder & CEO. Former founding engineer at a proptech startup; AI research background (RL for chess engines); holds a real estate license.
- **Keith Robinson** — Head of Sales. Atlanta agent; ex-CoStar; former VP of Lending.

---

## How the business works

1. **Distribution:** Brokerages mandate adoption → agents use SilverKey with buyers on active transactions.
2. **Demand:** Buyers complete transaction workflows (checklists, documents, closing tasks) on the platform.
3. **Supply:** Ancillary partners pay for placement in the marketplace (lenders, title, insurance, moving, concierge, etc.).
4. **Economics:** Brokerages receive a monthly/platform cut; partners pay for access rather than per-referral kickbacks to agents.

**Unit economics (targets):** Blended attach math targets **~$8,600 per closed transaction** across ancillary services. Pilot projection: **~$500K ARR year one** (~200 deals × ~$2.5K average). Treat these as planning figures unless updated in this file or confirmed via live data.

---

## Regulatory boundary: RESPA

**RESPA Section 8** prohibits kickbacks and unearned fees tied to referrals for settlement services (lending, title, insurance, etc.).

**What SilverKey avoids**

- Brokerages or agents **referring** buyers to specific partners in exchange for fees tied to that referral.
- Buyer-personalized recommendations that function as disguised referrals.
- Opaque compensation flows between partners and individual agents for steering.

**How SilverKey threads compliance**

- The **brokerage** hosts a marketplace; **partners pay for placement** (advertising/access model).
- Fees to the brokerage are framed as **platform/technology revenue**, not referral fees.
- Placement and surfacing are designed at **brokerage or transaction-workflow level** (e.g. checklist integrations, admin partner configuration), with auditable exposure events — not agent kickbacks for steering.

When implementing partner selection, ranking, or buyer-facing surfacing, include a RESPA compliance comment block and ensure exposure is logged. See `.cursor/rules/shared/respa-compliance.mdc`.

---

## Traction and partners

Use these names and facts; do not invent additional signed partners or deal terms.

| Partner / milestone | Status |
| ------------------- | ------ |
| **Better** (mortgage) | Signed MSA: **$3K + $1,500/user** activating on launch |
| **Move Concierge** | Signed revenue-share agreement; **live integration** (checklist embed) |
| **eXp Realty pilot** | Committed with **Rob & Kim's team** (top-10 agent team) |
| **Georgia Tech Ventures** | Backing |

---

## Current state (update quarterly)

*Last context refresh: Q2 2026.*

- **Stage:** Pre-seed; shipping MVP and running eXp pilot.
- **Fundraising:** Active **$250K pre-seed** on a **$5M SAFE cap**; **30-day first close** target.
- **Use of funds:** Ship MVP, run eXp pilot, reach first revenue, produce case study to open seed round.

When numbers or stage change, update this section and any fundraising docs under `pitch/`, `deck/`, or `investor/` paths (see `.cursor/rules/shared/pitch-and-fundraising.mdc`).

---

## How to work in this repo

**Stack:** TypeScript/React (web + React Native) in `Client/`, Python/Flask API in `Server/`, API contract in `openapi/`. Business logic lives in `Client/packages/`; `Client/apps/*` are thin composition layers only.

**Defaults**

- Prefer existing patterns in `packages/`, OpenAPI-generated types, and documented architecture rules.
- Reference **Linear ticket IDs** in commit messages: `[LINEAR-ID] short description`. Link the Linear ticket in PR descriptions.
- **Sensitive data:** Banking and deal terms live in Mercury and partner integrations — never log PII, never expose financial data in client-side code. Use MCP for live financials and tickets when available rather than guessing.
- **Partner placement code:** Include a RESPA compliance comment block explaining the boundary; keep logic auditable and boring.
- **Verification:** Run relevant gates before declaring work done (`make lint`, `pnpm check`, targeted tests). See [AGENTS.md](AGENTS.md).

**MCP connectors (local):** GitHub, Linear, Slack, Mercury (read-only banking). Configure via `.cursor/mcp.example.json` → `.cursor/mcp.json`.

---

## When you don't know something

Ask. Do not fabricate partner names, deal terms, or financial figures. If a number is not in this file or available via Mercury/Linear MCP, mark it **TBD** and say what source would confirm it.
