## Signing, Closing, and Funding

### Problem / goal

The **closing phase** includes:
- Document signing.
- Final funds transfers.
- Recording and key handoff.

We need to:
- Map these steps into clear milestones and checklist items.
- Reflect variations between:
  - Attorney vs escrow closings.
  - Same-day vs delayed funding and possession.

### Data model & invariants

- Inputs:
  - Scheduled closing date/time.
  - Whether:
    - Possession is at closing vs later.
    - Funding is same-day vs next-day.

- Milestones:
  - `closing_appointment`
  - `funding_complete`
  - `recording_complete`
  - `possession_date`

- Checklist items:
  - For example:
    - “Review and sign closing documents.”
    - “Send closing funds.”
    - “Confirm recording and receive keys.”

Invariants:
- Every closed transaction should:
  - Record at least:
    - A closing appointment.
    - Completion of funding/recording.

### Flows / UX

1. **Pre-closing**
   - Milestone:
     - `closing_appointment` set to scheduled date/time.
   - Checklist:
     - Reminds participants:
       - To review closing disclosure.
       - To confirm wire instructions.

2. **Signing**
   - Depending on jurisdiction:
     - Signing may occur:
       - At title/escrow office.
       - At attorney’s office.
       - Remotely via e-sign.
   - Agreements and checklists:
     - Reflect when all required documents are signed.

3. **Funding and recording**
   - After signing:
     - Funds are disbursed.
     - Deed is recorded.
   - Milestones:
     - `funding_complete`, `recording_complete`.
   - Checklist items:
     - Confirm closing is fully complete and safe for move-in.

4. **Possession**
   - Possession may be:
     - At recording.
     - At a later negotiated date.
   - `possession_date` milestone:
     - Drives move-in checklists and calendar events.

### Existing infrastructure to reuse / extend

- **Closing checklist templates**
  - `Server/app/services/transactions/closing/items.py`:
    - Already captures many closing and move-in tasks.

- **Documents and signing**
  - Agreement models and signature provider integration:
    - See signing and SkySlope docs in `integrations/`.

- **Calendar and notifications**
  - Existing calendar and notification infrastructure:
    - Should be used for closing appointments and key events.

### Gaps that require new work

- **Milestone definitions**
  - Explicit milestone types and rules for:
    - Whether funding and recording are same-day or not.
    - When possession occurs relative to closing.

- **UX for closing readiness**
  - A clear “closing readiness” view:
    - Aggregating whether:
      - All required docs are signed.
      - Funds are cleared.
      - Title is clear.
      - Move-in tasks are prepared.

