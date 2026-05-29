> **Status:** Partial — Google Calendar user integration shipped; transaction milestone calendar not wired.  
> **Last verified:** 2026-05-28

## Problem

Sync transaction milestones and user events with external calendars without losing auditability or deadline-engine ownership.

## Settled decisions

| Decision | Choice |
| -------- | ------ |
| System of record | **Option A** — SilverKey (internal) calendar owns timing; Google is a mirror via push + `CalendarEventLink`-style mapping. |
| Google as SoR (**Option B**) | Rejected for v1. |
| Full dual-write reconciliation (**Option C**) | Rejected for v1. |

## Code today

| Area | What exists | Pointers |
| ---- | ----------- | -------- |
| Google OAuth + events | Create/edit/list flows, Meet defaults, screen hooks. | `Client/packages/features/calendar/hooks/data/`, `components/view/CreateEventModal.tsx`, `CalendarHeader.tsx` |
| Location on events | Places autocomplete on create modal (same family as Finding home). | `CreateEventModal.tsx` |
| Form deadlines | Server can compute form `deadline` from step calendar config + transaction start date. | `Server/app/services/documents/forms_service.py` (`calculate_deadline`) |
| Transaction filter | No `transactionId` on calendar queries or milestone-derived events in app calendar UI. | — |

## Gaps

- No transaction-scoped in-app calendar or `GET .../milestones` feeding the calendar UI.
- No `CalendarEventLink` table usage found for external event back-links.
- Legacy `milestones` table removed in migrations — deadline engine docs under `transactions/mechanics/` are still **planned**.

## v1 behavior (when milestones ship)

One-way push: internal milestone change → Google event create/update; edits in Google are ignored or narrowly reconciled later.
