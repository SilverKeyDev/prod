# Georgia Forms Seeded & Mapped to Checklist Steps

## Overview

Successfully seeded 19 Georgia real estate forms from S3 (eXp_GA and fmls folders) into the `ChecklistForm` table and mapped them to appropriate checklist steps.

## ✅ What Was Done

### 1. Forms Seeded (19 total)

All forms are now in the database with proper S3 paths, categories, and metadata.

#### Buyer-Broker Agreements (5 forms)
- `buyer_broker_exclusive` - Exclusive Buyer-Broker Representation Agreement
- `buyer_broker_non_exclusive` - Non-Exclusive Buyer-Broker Representation Agreement
- `buyer_broker_single_property` - Single Property Buyer-Broker Agreement
- `buyer_broker_spanish_info` - Buyer-Broker Agreement (Spanish - Informational)
- `single_property_compensation_spanish` - Single Property Compensation Agreement (Spanish)

#### Disclosures (5 forms)
- `aba_disclosure_english` - Affiliated Business Arrangement Disclosure (English)
- `aba_disclosure_spanish` - Affiliated Business Arrangement Disclosure (Spanish)
- `dual_agency_consent` - Consent to Dual Agency
- `non_representation_disclosure` - Disclosure of Non-Representation
- `non_representation_spanish` - Non-Representation Disclosure (Spanish)

#### Escrow (3 forms)
- `earnest_money` - Earnest Money Receipt
- `wiring_fraud_advisory` - Wiring Fraud Advisory Notice
- `wiring_fraud_spanish` - Wiring Fraud Advisory (Spanish)
- `notice_of_contract_fmls` - Notice of Contract (FMLS)

#### Offer & Negotiation (2 forms)
- `property_compensation_amendment` - Property-Specific Compensation Amendment
- `compensation_reduction_request` - Compensation Reduction Request

#### Inspection (1 form)
- `waiver_of_inspections` - Waiver of Inspections

#### Closing (2 forms)
- `notice_of_closing_fmls` - Notice of Closing (FMLS)
- `change_in_ownership_fmls` - Change in Ownership of Property

### 2. New Checklist Step Added

**Search Phase - Step 6: "Sign buyer-broker representation agreement"**

```python
{
    "id": 6,
    "order": 5,
    "label": "Sign buyer-broker representation agreement",
    "explanation": "Formalize your relationship with your agent by signing a buyer-broker agreement that defines representation terms, compensation, and duration.",
    "suggested_form_ids": [
        "buyer_broker_exclusive",
        "buyer_broker_non_exclusive",
        "buyer_broker_single_property",
    ],
    "completion_type": "signature_based",
    "bullets": [
        "Review the agreement type: exclusive, non-exclusive, or single-property representation.",
        "Understand the compensation structure and how your agent will be paid.",
        "Clarify the duration of the agreement and any termination clauses.",
    ],
    "resource": None,
}
```

### 3. Checklist Steps Updated

#### Search Phase - Step 3: "Partner with a real estate agent"
**Added forms:**
- `aba_disclosure_english`
- `dual_agency_consent`

#### Offer Phase - Step 4: "Determine your earnest money deposit"
**Added forms:**
- `property_compensation_amendment`

#### Escrow Phase - Step 2: "Deposit earnest money into escrow"
**Updated forms:**
- `earnest_money`
- `wiring_fraud_advisory`
- `notice_of_contract_fmls`

#### Closing Phase - Step 2: "Review & sign closing documents"
**Updated forms:**
- `notice_of_closing_fmls`
- `change_in_ownership_fmls`

## S3 Folder Structure

All forms are stored in S3 under the `forms/` prefix:

```
forms/
  eXp_GA/
    1_Affiliated Business Arrangement Disclosure...pdf
    4_Buyer-Broker Representation Agreement...pdf
    10_Earnest Money Receipt...pdf
    13_Exclusive Buyer Tenant-Broker...pdf
    16_Non-Exclusive Buyer Tenant-Broker...pdf
    17_Property-Specific Compensation...pdf
    20_Single Property Buyer-Broker...pdf
    24_Waiver of Inspections...pdf
    25_Wiring Fraud Advisory...pdf
    26_Wiring Fraud Advisory - Spanish...pdf
    ... (and other eXp Georgia forms)

  fmls/
    117noticeofcontract.pdf
    118noticeofclosingform.pdf
    112changeinownershipofproperty.pdf
    ... (and other FMLS forms)
```

## Forms Not Included (Agent/Admin Only)

The following forms from S3 were **not** seeded because they are agent-facing or not applicable to buyer checklists:

**eXp_GA:**
- Broker Permission to Contribute (agent onboarding)
- E&O form (agent insurance)
- Exclusive Authorization to Sell/Lease (listing agreement - seller-side)
- Lease Invoice (leasing, not purchase)
- Referral Agreements (agent-to-agent)
- W-9 forms (agent tax paperwork)

**FMLS:**
- Seller notification forms (110, 111)
- Listing contract addendum (116)
- MLS computer user forms (120)
- Team/company/office forms (124, 125, 126)
- Appraiser/assistant forms
- Transfer form

## Database Schema

Each `ChecklistForm` record includes:

```python
{
    "id": "uuid",
    "form_key": "unique_key",  # Used in suggested_form_ids
    "title": "Human-readable title",
    "description": "Explanation of form purpose",
    "s3_template_path": "forms/category/filename.pdf",
    "category": "folder_name",  # Groups forms in UI
    "created_at": "timestamp",
    "updated_at": "timestamp"
}
```

## How Forms Appear in UI

### 1. Checklist Step Forms Tab
When viewing a checklist step (e.g., "Deposit earnest money into escrow"):
- Agent sees a "Forms" tab
- Shows all forms from `suggested_form_ids` for that step
- Each form displays title, description, computed deadline
- "Download" and "Send to Client" buttons (send is Phase 2)

### 2. Forms Library (Documents Page)
- Agent navigates to Documents → Forms Library tab
- Forms grouped by category (buyer_broker_agreements, disclosures, escrow, etc.)
- Click category to see forms in that folder
- Download or select forms directly

### 3. Document Upload Modal
- When uploading documents, agent sees two tabs:
  - "Upload File" - traditional file upload
  - "Select from Forms" - browse forms library
- Selecting form creates document from template (Phase 2)

### 4. Messaging Attachments
- Attachment menu has "Share Form" option
- Opens forms browser
- Agent selects form to attach to message (Phase 2)

## Testing the Forms

### Backend API Test

```bash
# List all forms by category
curl -H "Authorization: Bearer <agent-token>" \
  http://localhost:5000/api/v1/forms/library

# Get specific form download URL
curl -H "Authorization: Bearer <agent-token>" \
  http://localhost:5000/api/v1/forms/library/<form_id>/download
```

### Frontend Test

1. **Login as agent**
2. **View checklist forms:**
   - Navigate to a transaction
   - Click on "Deposit earnest money into escrow" step
   - See Forms tab with earnest_money, wiring_fraud_advisory forms
3. **Browse forms library:**
   - Go to Saved → Documents → Forms Library tab
   - See categories: buyer_broker_agreements, disclosures, escrow, etc.
   - Click category to see forms
4. **Upload modal:**
   - Click upload button on Documents page
   - See "Select from Forms" tab
   - Browse forms

## Phase 2 Next Steps

### 1. Verify S3 Paths
Ensure all PDFs are uploaded to S3 at the paths specified in `s3_template_path`:
- `forms/eXp_GA/...` folder exists
- `forms/fmls/...` folder exists
- All PDFs are present and accessible

### 2. Test Download URLs
```python
from app.services.documents.s3_service import s3_service

# Test each form's S3 path
forms = ChecklistForm.query.all()
for form in forms:
    url = s3_service.generate_presigned_url(form.s3_template_path)
    print(f"{form.form_key}: {url is not None}")
```

### 3. Add More Forms
If additional forms are needed:
1. Upload PDF to S3 under `forms/<category>/`
2. Add to seed script
3. Re-run seed script
4. Associate with checklist step via `suggested_form_ids`

### 4. Implement Send Functionality
- Forms can be sent via DocuSign or Messaging
- See `FORMS_PHASE1_IMPLEMENTATION.md` for send implementation details

## Summary of Files Changed

### Backend
- **New**: `Server/scripts/seed_georgia_forms.py` - Seed script
- **Modified**: `Server/app/models/__init__.py` - Export ChecklistForm
- **Modified**: `Server/app/services/transactions/search/items.py` - Added step 6
- **Modified**: `Server/app/services/transactions/offer/items.py` - Added forms
- **Modified**: `Server/app/services/transactions/escrow/items.py` - Updated forms
- **Modified**: `Server/app/services/transactions/closing/items.py` - Added forms

### Database
- **19 new records** in `checklist_forms` table

## Run the Seed Script Again

If you need to seed more forms or re-run:

```bash
cd Server
python scripts/seed_georgia_forms.py
```

The script is idempotent - it skips forms that already exist in the database.

## Checklist Steps with Forms

### Search Phase
- **Step 3** (Partner with agent): `aba_disclosure_english`, `dual_agency_consent`
- **Step 6** (Sign buyer-broker agreement): `buyer_broker_exclusive`, `buyer_broker_non_exclusive`, `buyer_broker_single_property`

### Offer Phase
- **Step 4** (Earnest money deposit): `property_compensation_amendment`

### Escrow Phase
- **Step 2** (Deposit earnest money): `earnest_money`, `wiring_fraud_advisory`, `notice_of_contract_fmls`

### Closing Phase
- **Step 2** (Sign closing docs): `notice_of_closing_fmls`, `change_in_ownership_fmls`

## Spanish Forms Available

For Spanish-speaking clients:
- `buyer_broker_spanish_info`
- `single_property_compensation_spanish`
- `aba_disclosure_spanish`
- `non_representation_spanish`
- `wiring_fraud_spanish`

All Spanish forms have "Spanish" or "Español" in title and description.
