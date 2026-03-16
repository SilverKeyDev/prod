## SkySlope Forms Library and Templates

### Problem / goal

Transaction forms are pulled from one or more of the following sources:
- **FMLS** (First Multiple Listing Service) – forms available via the FMLS API.
- **eXp** – forms available via the eXp Realty API.
- **SkySlope** – brokerage-specific forms and templates (especially for eXp agents).

Agents (especially at eXp) already have their brokerage-specific forms and templates managed in **SkySlope**.  
We want to:
- Treat SkySlope as the **system of record for agent forms**.
- Let agents browse and attach SkySlope templates to a transaction.
- Use SkySlope (via our `SignatureProvider`) for sending agreements for signature.
- Reflect SkySlope-driven agreement and signing status back into:
  - Checklists.
  - Milestones.
  - Calendar.

### Data model & invariants

- **Agreement** (existing)
  - Our system-of-record for agreements (`Server/app/models/documents/agreement.py`), extended to:
    - Track SkySlope-specific identifiers as needed (e.g. SkySlope transaction/form IDs).

- **AgreementTemplateReference** (conceptual)
  - Captures the relationship between:
    - A SkySlope template/form.
    - Our internal representation of a “type of agreement” for reuse in:
      - Checklist templates.
      - Milestone definitions.

- **AgreementLink** (see signing doc)
  - Connects agreements to checklist items/milestones for completion logic.

Invariants:
- Forms for transactions may be pulled from **FMLS**, **eXp API**, and/or **SkySlope** depending on agent/brokerage configuration.
- SkySlope remains a **primary catalog** of broker forms for many agents.
- Our system stores:
  - References and instances (agreements tied to a transaction).
  - Status and metadata needed to coordinate UX and completion logic.

### Flows / UX

1. **Agent authentication to SkySlope**
   - Agent connects their SkySlope account to SilverKey.
   - We securely store tokens/credentials using existing secrets/config mechanisms.

2. **Browsing available forms**
   - Within a transaction’s document area:
     - Agent can open “Add from SkySlope”.
   - UI shows:
     - Forms/templates available to that agent/brokerage/market.
     - Filter/search by name, type (buyer rep, listing, purchase contract, addenda, etc.).

3. **Attaching forms to a transaction**
   - Agent selects one or more forms.
   - System:
     - Creates `Agreement` records tied to the `Transaction`.
     - Links them via `AgreementLink` to relevant checklist items or milestones.

4. **Sending for signature and tracking status**
   - From the transaction, the agent:
     - Initiates sending selected agreements for signature using SkySlope (via `SignatureProvider`).
   - As signatures progress:
     - Agreement status updates propagate to:
       - Checklist items.
       - Milestones (e.g. contract executed).
       - Notifications.

5. **Visibility for buyers and other roles**
   - Buyers only see **attached** forms/agreements and their status.
   - They do not browse the full SkySlope library.
   - Other roles (TC, loan officer, etc.) see forms according to their permissions model.

### Existing infrastructure to reuse / extend

- **Agreement model and participants**
  - `Server/app/models/documents/agreement.py` and `agreement_participant.py`:
    - Already encode agreements, participants, and DocuSign-era fields.
  - These should be **extended** to handle SkySlope metadata instead of creating a parallel “SkySlope agreement” model.

- **Signature provider abstraction**
  - `Server/app/services/signature/base.py`:
    - Defines `SignatureProvider` and the interface we should implement for SkySlope.

- **Documents and agreements UI**
  - `Client/packages/features/documents/*`:
    - `AgreementListItem`, `AgreementCard`, `AgreementDetailModal`, etc.
  - These are the natural place to:
    - Add “Add from SkySlope” and “Send via SkySlope” actions.
    - Surface SkySlope-specific details (where helpful) without breaking provider-agnostic UX.

### Gaps that require new work

- **Form source API integrations** (FMLS, eXp, SkySlope)
  - Backend module(s) to integrate with each configured form source:
    - **FMLS API** – list and fetch forms for the agent’s market.
    - **eXp API** – list and fetch forms for eXp agents/brokerages.
    - **SkySlope API** – authenticate as an agent, list forms/templates, create/send signing requests, receive status updates via webhooks or polling.

- **Template mapping and caching**
  - A mapping layer that:
    - Translates form source template IDs (FMLS, eXp, SkySlope) into our own `AgreementTemplateReference` concepts when needed.
    - Avoids over-fetching by caching template lists per agent/brokerage/market.

- **Transaction-focused UI flows**
  - New UI flows inside the transaction document area to:
    - Browse and search forms (from FMLS, eXp, or SkySlope).
    - Attach forms to a transaction.
    - Initiate signing and monitor status.

- **Error handling and fallbacks**
  - Clear behavior for:
    - Missing or revoked access to FMLS, eXp, or SkySlope.
    - Templates no longer available or renamed.
    - Partially configured agents or markets.

### Related: Checklist-step file mapping

For **automated file finding** – agents and buyers finding the right SkySlope forms for each checklist step – see `integrations/11-skyslope-checklist-step-file-mapping.md`. That doc defines:
- `suggested_form_ids` (optional) on checklist item templates.
- Semantic form-type keys and SkySlope attribute matching.
- Step-contextual "Add from SkySlope" with pre-filtered suggested forms.

