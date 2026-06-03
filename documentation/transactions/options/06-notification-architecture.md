> **Status:** Planned — no central `NotificationEvent` bus; feature-local delivery today.  
> **Last verified:** 2026-05-28

## Problem

Checklist, deadline, signature, and integration events must share one routing layer (roles, preferences, dedupe) instead of N ad-hoc senders.

## Settled decisions

| Decision | Choice |
| -------- | ------ |
| Architecture | **Option A** — central event schema + routing service; producers emit events only. |
| Per-feature direct send (**Option B**) | Rejected at scale. |
| Transaction-only parallel stack (**Option C**) | Rejected. |

## Code today

| Area | What exists | Pointers |
| ---- | ----------- | -------- |
| In-app toasts | Global UI store enqueue. | `Client/packages/store/slices/ui/ui.slice.ts` (`enqueueToast`), calendar hooks e.g. `useCalendarScreen.ts` |
| DocuSign → messaging | Agreement notifications into agent/client conversations. | `Server/app/services/docusign/notifications/messaging.py` |
| Partner exposure | Structured log for placement views (RESPA-auditable). | `Server/app/routes/rev_share/handlers/step_views.py` |
| Email/push | Backend delivery utilities exist; not unified under one transaction event type. | Search `Server/app/services/` for notification/email modules when extending |

## Gaps

- No shared `NotificationEvent` type consumed by checklists, deadlines, and integrations.
- No `NotificationPreference` merge with role templates for transaction events.
- Long-form delivery design still under `documentation/to-implement-soon/notifications/` — treat as spec, not shipped pipeline.

## Target v1 shape (unchanged intent)

Producers → router (defaults + user prefs) → existing email/push + in-app surfaces; batching/digest later.
