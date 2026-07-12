# Rev-share partners and click analytics

Partner placement and outbound click tracking for the brokerage marketplace (RESPA: platform placement fees between SilverKey and the partner — not agent referral compensation). See [`.cursor/rules/shared/respa-compliance.mdc`](../../../.cursor/rules/shared/respa-compliance.mdc).

## Step ID contract

Checklist steps use **`{section}:{item_id}`** (e.g. `closing:13` — *Schedule move-in concierge* with `partner_placements` → `PartnerTransactionIntegration`). Admin partner rows, step views, and click logs all use this string.

## Admin workflow

1. Open **`/admin/partners`** → **Manage** tab.
2. **Add partner** (any rev-share partner; configure per step):
   - **step_id:** `closing:13` (move-in concierge checklist step)
   - **Partner rev share link** (`destination_url_template`): paste the tracking URL the partner gave you (e.g. `https://mc.partners/SilverKey` or their full affiliate link with query params). This is **not** SilverKey’s `/r/{link_id}` — that hop is automatic.
3. Activating a partner provisions **one platform `rev_share_links` row per partner** (not per agent).
4. **Analytics** tab: CTR, clicks over time, estimated revenue (clearly labeled as estimated).

## Buyer flow

1. Buyer expands a checklist step with an active partner on that `step_id` and matching **target role** (e.g. buyer workspace).
2. Client **POST** `/api/v1/rev-share/step-views` when a transaction id is known (CTR denominator).
3. Partner CTA uses **`/r/{link_id}`** → server logs click (IP stored as HMAC hash) → **302** to interpolated partner URL.
4. Anonymous clicks (no `buyer_id`) count in total clicks but are **excluded from CTR**.

Placements do **not** require a primary agent or a transaction row. An optional `transaction_id` only fills embed/redirect URL placeholders when the partner template includes them.

## Routing

- **Dev:** Vite proxies `/r` to the Flask API (see `Client/apps/web/vite.config.js`).
- **Prod:** Route `/r/*` to the API service (same host or CDN rule).

## API index

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/r/{link_id}` | Public (rate limited) |
| GET | `/api/v1/partners/placements` | User |
| POST | `/api/v1/rev-share/step-views` | Buyer |
| GET/POST/PATCH | `/api/v1/admin/partners` | Admin |
| GET | `/api/v1/admin/rev-share/analytics` | Admin |

## Database

Operator-only schema changes: `make migrate` when rev-share link models change (not for routine local agent runs). Server models: `Server/app/models/` rev-share tables.
