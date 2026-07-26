# Brokerage DB MCP — schema normalization (SIL-323)

As-built design note for the brokerage database query service (NL → read-only
SQL → analytics UI). This is a **product data MCP / query service**, not Cursor
editor MCP under `.cursor/mcp.example.json`.

## Goal

Connect per-brokerage data, introspect tables/columns without hardcoding a single
CRM schema, answer plain-English questions safely, and render results in the
existing brokerage analytics charts/tables where possible.

## Related tickets

| Ticket | Boundary |
| ------ | -------- |
| **SIL-323** | Connector + introspection + NL→SQL guardrails + one NL UI path |
| **SIL-207** | Fixture → live overview/agents API swap (coordinate; do not replace wholesale) |
| **SIL-211** | Brokerage performance dashboard insights |
| **SIL-285** | SkySlope demo dataset (mirror seed already shipped) |

## Two sample shapes

### Shape A — SkySlope mirror (canonical in-repo)

Source of truth today: `skyslope_transactions`
(`Server/app/models/skyslope/skyslope_transaction.py`).

| Concern | How Shape A represents it |
| ------- | ------------------------- |
| Tenant | `brokerage_id` (FK → `brokerage_orgs`) |
| External id | `skyslope_transaction_id` |
| Agent | `agent_id` (nullable FK → `users`) |
| Lifecycle | `status`, `created_at`, `closed_at`, `cancelled_at`, `is_cancelled` |
| Money | `sale_price`, `list_price` (`Numeric(14, 2)` dollars) |
| Property | `address`, `city`, `state`, `zip`, lat/lng, `side`, `property_type` |
| Ancillary | `title_vendor`, `lender`, `escrow_company`, `has_home_warranty` |
| Escape hatch | `raw_payload` (JSONB) |

**NL example mapping** (“closed transactions by agent last quarter”):

- Filter: `closed_at` in quarter window, `is_cancelled = false`, status treated as closed
- Group: `agent_id`
- Aggregate: `COUNT(*)`, optional `SUM(sale_price)`
- Always scope: `brokerage_id = :brokerage_org_id`

### Shape B — Variant “raw brokerage CRM” (hypothetical external DB)

Illustrative second brokerage that never matched our mirror 1:1. Used to flag
normalization risk **before** we assume shared chart DTOs.

```text
agents(id, full_name, office_name, external_agent_code)
deals(
  deal_pk,
  agent_code,          -- string, not FK to SilverKey users
  deal_status,         -- e.g. PENDING | SETTLED | FELL_THROUGH
  settlement_date,     -- date, not timestamptz closed_at
  close_price_cents,   -- integer cents, not Numeric dollars
  list_price_cents,
  property_address,    -- single line, no city/state/zip columns
  side_code,           -- B / S
  title_co_name,
  mortgage_lender
)
