## Move-In and Post-Closing Tasks

### Problem / goal

After closing, buyers still face important tasks:
- Moving in.
- Transferring utilities.
- Filing homestead exemptions.
- Setting up maintenance routines.

We need to:
- Provide a structured checklist and optional integrations (e.g. HomeConcierge).
- Tie tasks to relevant dates (possession, homestead deadlines).

### Data model & invariants

- Inputs:
  - `possession_date`.
  - Jurisdiction-specific homestead filing deadlines.

- Milestones:
  - `move_in_date` (often same as `possession_date`).
  - `homestead_filing_deadline` (where applicable).

- Checklist items:
  - Drawn largely from:
    - `CLOSING_ITEMS` in `Server/app/services/transactions/closing/items.py` (e.g. maintenance calendar, homestead, address changes).
  - Optional integration-backed tasks:
    - HomeConcierge setup and completion.

Invariants:
- Each closed transaction should:
  - Provide a clear post-closing checklist.
  - Encourage, but not force, completion of maintenance and administrative tasks.

### Flows / UX

1. **Move-in planning**
   - Before possession date:
     - Checklist tasks for:
       - Scheduling movers.
       - Confirming access (keys, codes, remotes).
   - Optionally:
     - HomeConcierge integration to coordinate services.

2. **Immediate post-move tasks**
   - Items like:
     - Changing locks.
     - Transferring/setting up utilities.
     - Updating mailing address.

3. **Homestead and local benefits**
   - Where applicable:
     - Checklist items and milestones for homestead exemption or similar programs.
   - Deadline engine:
     - Computes `homestead_filing_deadline` and attaches to relevant items.

4. **Maintenance calendar**
   - Checklist encourages:
     - Setting up ongoing maintenance reminders.
   - Optional:
     - Integration with calendar to schedule recurring maintenance events.

### Existing infrastructure to reuse / extend

- **Closing/move-in checklist templates**
  - `CLOSING_ITEMS` and related content in:
    - `Server/app/services/transactions/closing/items.py`.

- **HomeConcierge integration**
  - As defined in `integrations/12-financial-and-service-integrations.md`.

- **Calendar**
  - Existing calendar infrastructure:
    - For move-in and maintenance events.

### Gaps that require new work

- **Homestead and local rules modeling**
  - Jurisdiction rule entries for:
    - Homestead deadlines.
    - Other key post-closing timelines where applicable.

- **Maintenance scheduling UX**
  - A simple way for buyers to:
    - Opt into a maintenance schedule.
    - Sync recurring tasks to their calendar.
