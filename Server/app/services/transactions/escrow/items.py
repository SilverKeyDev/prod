"""Escrow checklist task definitions (text, bullets, links as JSON-serializable structures)."""

ESCROW_ITEMS = [
    {
        "id": 1,
        "label": "Choose or confirm escrow/title company",
        "explanation": "A neutral third party that holds funds, manages documents, and coordinates closing.",
        "bullets": [
            "Get recommendations from your lender (and attorney if you're using one).",
            "Verify licensing and reputation.",
            "They'll prepare escrow instructions and handle fund transfers.",
        ],
        "resource": {
            "label": "What is Escrow? (CFPB)",
            "href": "https://www.consumerfinance.gov/ask-cfpb/what-is-escrow-en-123/",
        },
    },
    {
        "id": 2,
        "label": "Deposit earnest money into escrow",
        "explanation": "Shows good faith and is credited toward your closing. Follow the contract timeline.",
        "suggested_form_ids": ["earnest_money", "wiring_fraud_advisory", "notice_of_contract_fmls"],
        "calendar": {"hasDates": False, "days": 3, "eventSchedule": [3]},
        "bullets": [
            "Commonly 1–3% of purchase price (varies by market).",
            "Due within 1–3 business days after acceptance (check contract).",
            "Call the escrow/title office to verify wire details—beware of fraud.",
        ],
        "resource": {
            "label": "Avoid Real Estate Wire Fraud (FBI)",
            "href": "https://www.fbi.gov/how-we-can-help-you/safety-resources/scams-and-safety/common-scams-and-crimes/business-email-compromise",
        },
    },
    {
        "id": 3,
        "label": "Send purchase agreement to lender",
        "explanation": "Your lender needs the signed contract (and addenda) to start underwriting and order the appraisal.",
        "suggested_form_ids": ["purchase_agreement"],
        "calendar": {"hasDates": False, "days": 5, "eventSchedule": [5]},
        "bullets": [
            "Include counters/addenda and contact info for title/escrow.",
            "Confirm if title/escrow also needs a copy.",
        ],
        "resource": {
            "label": "Purchase Agreement Basics (Realtor.com)",
            "href": "https://www.realtor.com/advice/buy/what-is-a-purchase-and-sale-agreement/",
        },
    },
    {
        "id": 4,
        "label": "Review escrow instructions",
        "explanation": "Spell out what the escrow holder must do and what conditions must be met before closing.",
        "suggested_form_ids": [],
        "bullets": [
            "Verify names, property address, price, and timelines.",
            "Confirm contingencies and payoffs are listed correctly.",
        ],
        "resource": {
            "label": "Escrow: How It Works in Real Estate (ALTA)",
            "href": "https://www.alta.org/homebuyer/what-is-escrow/",
        },
    },
    {
        "id": 5,
        "label": "Monitor contingency deadlines",
        "explanation": "Missing inspection/financing/appraisal/title deadlines can put your deposit at risk.",
        "bullets": [
            "Track dates in a calendar with reminders.",
            "Coordinate with lender and title/escrow to stay on schedule.",
        ],
        "resource": {
            "label": "Common Homebuying Contingencies (Nolo)",
            "href": "https://www.nolo.com/legal-encyclopedia/contingency-clauses-home-purchase-contracts-30019.html",
        },
    },
    {
        "id": 6,
        "label": "Order title search & review report",
        "explanation": "Confirms the seller's ownership and flags claims or defects before you close.",
        "suggested_form_ids": ["title_commitment"],
        "bullets": [
            "Title company typically performs the search and issues the commitment.",
            "Read the preliminary report/commitment for exceptions and red flags.",
        ],
        "resource": {
            "label": "Title Insurance Basics (First American)",
            "href": "https://www.firstam.com/ownership/title-insurance/title-insurance-basics.html",
        },
    },
    {
        "id": 7,
        "label": "Check for liens, easements, and legal encumbrances",
        "explanation": "These can affect ownership, access, or how you use the property.",
        "suggested_form_ids": ["title_commitment"],
        "bullets": [
            "Liens: unpaid taxes, judgments, HOA/contractor liens.",
            "Easements: utility access, shared driveways, ingress/egress.",
        ],
        "resource": {
            "label": "Easements & Land Use Basics (Nolo)",
            "href": "https://www.nolo.com/legal-encyclopedia/easements-land-use-basics-29651.html",
        },
    },
    {
        "id": 8,
        "label": "Review zoning and hazard disclosures",
        "explanation": "Local zoning controls use/renovations; hazard zones can affect insurance and lender requirements.",
        "suggested_form_ids": ["seller_disclosure"],
        "bullets": [
            "Check flood, wildfire, or earthquake risk as applicable.",
            "Confirm zoning allows your intended use or projects.",
        ],
        "resource": {
            "label": "FEMA Flood Map Service Center",
            "href": "https://msc.fema.gov/portal/home",
        },
    },
    {
        "id": 9,
        "label": "Review HOA rules and financials (if applicable)",
        "explanation": "Understand restrictions, fees, and the HOA's financial health before you proceed.",
        "suggested_form_ids": ["seller_disclosure"],
        "bullets": [
            "Look for rules on rentals, pets, parking, exterior changes.",
            "Review budgets, reserves, assessments, and meeting minutes.",
        ],
        "resource": {
            "label": "Reviewing HOA Documents Before Buying (Nolo)",
            "href": "https://www.nolo.com/legal-encyclopedia/reviewing-hoa-documents-before-buying.html",
        },
    },
]
