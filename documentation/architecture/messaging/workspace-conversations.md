# Workspace conversations (operator messaging)

**Status:** Shipped — `/api/v1/conversations/*` for brokerage, integrator, and admin support threads.

## Kinds

| Kind | Participants | Create |
| ---- | ------------ | ------ |
| `platform_support` | Subject user + super_admin support | Brokerage admin or integrator user |
| `brokerage_agent` | Org admins + paired agent | Either brokerage admin or agent in org |
| `integrator_brokerage` | Partner operators + org admins | Either side when `BrokeragePartnerAdoption` exists |
| `group` | Reserved — rejected at API (501) | Not available |

## API

Namespace: `/api/v1/conversations`

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/conversations` | List threads (`kinds`, optional `scope=admin` for super_admin) |
| POST | `/conversations` | Create thread |
| GET | `/{id}/history` | Message history |
| POST | `/message` | Send message |
| POST | `/{id}/read` | Mark read |
| GET | `/stream` | SSE (same Redis channel as agent chats) |
| GET | `/eligible-contacts` | Contacts the caller may message |

Existing `/api/v1/agent/chats/*` is unchanged (buyer/seller/agent stack).

## Access

Kind policies live in `Server/app/services/messaging/workspace/kinds/`. `access.py` dispatches to the registry. Super admins may read/send all `platform_support` threads.

## Eligibility tables

- `partner_operators` — integrator user ↔ partner
- `brokerage_partner_adoptions` — brokerage org ↔ partner adoption

## RESPA note (integrator)

Integrator↔brokerage threads are operator-to-operator. They do not steer buyers to partners or implement referral economics.
