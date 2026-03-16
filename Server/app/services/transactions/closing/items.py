"""Closing / Move-in checklist task definitions."""

CLOSING_ITEMS = [
    {
        "id": 1,
        "label": "Conduct final walkthrough",
        "explanation": "Confirm the home is in the same condition as when you made the offer and that agreed-upon repairs were completed.",
        "bullets": [
            "Appliances and fixtures included in the sale are still there and functional.",
            "No new damage (e.g., water leaks, broken windows).",
            "Repairs from inspection negotiations were completed.",
            "The seller has fully vacated (unless negotiated otherwise).",
        ],
        "resource": {
            "label": "Final Walkthrough Checklist (Redfin Blog)",
            "href": "https://www.redfin.com/blog/final-walk-through-checklist-before-closing-on-a-home/",
        },
    },
    {
        "id": 2,
        "label": "Review & sign closing documents",
        "explanation": "Carefully review each document; ask your escrow officer or attorney for digital copies in advance.",
        "suggested_form_ids": ["closing_disclosure", "deed", "loan_documents"],
        "completion_type": "signature_based",
        "calendar": {"hasDates": False, "days": 3, "eventSchedule": [3]},
        "bullets": [
            "Closing Disclosure – details loan terms, closing costs, and cash-to-close.",
            "ALTA Settlement Statement – line-by-line breakdown of buyer/seller debits and credits.",
            "Deed – transfers legal ownership from seller to you.",
            "Loan documents (if financing): note, mortgage, affidavits.",
        ],
        "resource": {
            "label": "CFPB Closing Disclosure Guide (Consumer Finance Official Guide)",
            "href": "https://www.consumerfinance.gov/owning-a-home/closing-disclosure/",
        },
    },
    {
        "id": 3,
        "label": "Send closing funds",
        "explanation": "Usually includes down payment and closing costs. Use a bank-certified wire; beware of fraud.",
        "suggested_form_ids": ["wire_instructions"],
        "calendar": {"hasDates": False, "days": 2, "eventSchedule": [2]},
        "bullets": [
            "Title company will provide final numbers and wiring instructions.",
            "If check is allowed, bring a certified/cashier's check (no personal checks).",
        ],
        "resource": {
            "label": "How to Send Closing Funds (Zillow Guide)",
            "href": "https://www.zillow.com/learn/how-to-wire-money-for-closing/",
        },
    },
    {
        "id": 4,
        "label": "Recording & disbursement",
        "explanation": "The title/escrow company records the deed with the county, then disburses funds. Usually within 1–2 business days.",
        "bullets": [],
        "resource": {
            "label": "The Escrow Timeline (Linear Title and Escrow)",
            "href": "https://lineartitleandescrow.com/2023/12/06/the-escrow-timeline-a-step-by-step-guide-to-closing/",
        },
    },
    {
        "id": 13,
        "label": "Schedule move-in concierge",
        "explanation": "Book a move-in concierge to help with setup, utilities, and settling into your new home.",
        "bullets": [],
        "component_key": "home_concierge",
        "integration_key": "home_concierge",
    },
    {
        "id": 5,
        "label": "Receive keys & access devices",
        "explanation": "After recording/cleared funds, collect all access devices (keys, openers, fobs, security codes).",
        "bullets": [],
        "resource": None,
    },
    {
        "id": 6,
        "label": "Change exterior locks",
        "explanation": "You don't know who else has keys (contractors, neighbors, past tenants).",
        "bullets": [
            "Hire a locksmith (~$100–$200).",
            "Buy smart locks (Yale, August, Schlage).",
            "Rekey existing locks (cheaper than full replacement).",
        ],
        "resource": {
            "label": "How to Rekey a Lock (YouTube Tutorial)",
            "href": "https://www.youtube.com/watch?v=JWrRQXj8DUI",
        },
    },
    {
        "id": 7,
        "label": "Transfer utilities",
        "explanation": "Set services up a few days before closing to avoid gaps.",
        "bullets": [
            "Electricity, water/sewer, natural gas, trash/recycling, internet & cable.",
        ],
        "resource": {
            "label": "Guide to Transferring Utilities (Zillow)",
            "href": "https://www.zillow.com/learn/transferring-utilities-when-buying-a-house/?utm_source=chatgpt.com",
        },
    },
    {
        "id": 8,
        "label": "File homestead exemption",
        "explanation": "A homestead exemption can reduce your property taxes if the home is your primary residence. You must file with your local county tax assessor or appraisal district. Deadlines and rules vary by state, and many require filing within the first year of ownership.",
        "bullets": [
            "Confirm you meet eligibility requirements (primary residence).",
            "Find your county's official tax assessor or appraisal district website.",
            "Complete the homestead exemption application form.",
            "Submit by your state or county's deadline to receive the benefit.",
        ],
        "resource": {
            "label": "Find Your County Tax Assessor",
            "href": "https://publicrecords.netronline.com/propertyrecords/",
        },
    },
    {
        "id": 9,
        "label": "Update mailing address",
        "explanation": "Update USPS (mail forwarding 12 months, $1.10 fee) and key institutions (DMV, IRS, banks, healthcare, subscriptions).",
        "bullets": [],
        "resource": {
            "label": "Change Your Address – USA.gov",
            "href": "https://www.usa.gov/change-address",
        },
    },
    {
        "id": 10,
        "label": "Create maintenance calendar",
        "explanation": "Avoid costly repairs by staying proactive.",
        "bullets": [
            "Replace HVAC filters every 1–3 months.",
            "Clean gutters biannually.",
            "Drain water heater yearly.",
        ],
        "resource": None,
    },
    {
        "id": 11,
        "label": "Update estate plan",
        "explanation": "Ensures your home passes to the right beneficiaries; consult an estate attorney if you own significant assets.",
        "bullets": [],
        "resource": None,
    },
    {
        "id": 12,
        "label": "Join neighborhood or HOA group",
        "optional": True,
        "explanation": "Benefits include staying informed, meeting neighbors, understanding HOA rules.",
        "bullets": [
            "Find Facebook groups or Nextdoor.",
            "Check HOA website or attend a meeting.",
        ],
        "resource": {
            "label": "Find Your Neighborhood on Nextdoor",
            "href": "https://nextdoor.com/find-neighborhood/",
        },
    },
]
