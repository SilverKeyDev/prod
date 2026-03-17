"""Offer checklist task definitions."""

OFFER_ITEMS = [
    {
        "id": 1,
        "order": 1,
        "label": "Finding a home",
        "explanation": "Enter the address of the home you want to make an offer on.",
        "bullets": [],
        "resource": None,
        "component_key": "finding_home",
    },
    {
        "id": 2,
        "order": 2,
        "label": "Review comparable sales (comps)",
        "explanation": "Have your agent pull a Comparative Market Analysis (CMA) to look at recently sold, similar homes in the area.",
        "bullets": [
            "Use this data to ensure you don't overpay for the property.",
            "Formulate a competitive, data-backed starting price for your offer.",
        ],
        "resource": None,
        "component_key": "review_comparables",
    },
    {
        "id": 3,
        "order": 3,
        "label": "Choose your contingencies",
        "explanation": "Select the conditions that must be met for the transaction to go through, allowing you to back out if necessary.",
        "bullets": [
            "Include an inspection contingency to negotiate repairs or cancel if major defects are found.",
            "Add appraisal and financing contingencies to protect your loan approval.",
        ],
        "resource": None,
    },
    {
        "id": 4,
        "order": 4,
        "label": "Determine your earnest money deposit",
        "explanation": 'Decide on a "good faith" deposit, typically 1% to 3% of the purchase price, to show the seller you are serious.',
        "bullets": [
            "Ensure the funds are placed securely into an escrow account.",
            "Understand the conditions under which you can get this deposit back.",
        ],
        "resource": None,
    },
    {
        "id": 5,
        "order": 5,
        "label": "Draft and submit the purchase agreement",
        "explanation": "Work with your agent to write up the formal, legally binding offer letter.",
        "suggested_form_ids": ["purchase_agreement"],
        "bullets": [
            "Include your offer price, proposed closing date, and selected contingencies.",
            "Outline any concessions you are requesting, like the seller paying part of your closing costs.",
        ],
        "resource": None,
    },
    {
        "id": 6,
        "order": 6,
        "label": "Review the seller's response",
        "explanation": "Wait for the seller to respond to your offer, which usually takes 24 to 48 hours.",
        "bullets": [
            "Prepare for them to accept, reject, or counter your original terms.",
            "Discuss their response with your agent to plan your next move.",
        ],
        "resource": None,
    },
    {
        "id": 7,
        "order": 7,
        "label": "Negotiate the final terms",
        "explanation": "Engage in a back-and-forth negotiation if the seller issues a counteroffer.",
        "bullets": [
            "Decide whether to accept their new terms, reject them, or submit your own counteroffer.",
            "Continue negotiating until both parties agree or someone decides to walk away.",
        ],
        "resource": None,
    },
    {
        "id": 8,
        "order": 8,
        "label": "Reach mutual acceptance",
        "explanation": 'Sign the final, agreed-upon contract to officially go "under contract" or enter escrow.',
        "suggested_form_ids": ["purchase_agreement"],
        "completion_type": "signature_based",
        "bullets": [
            "Ensure all parties have signed the identical purchase agreement.",
            "Prepare to move forward into the inspection and appraisal phase.",
        ],
        "resource": None,
    },
]
