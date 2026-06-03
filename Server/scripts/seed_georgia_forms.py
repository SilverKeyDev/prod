"""
Seed Georgia real estate forms from S3 into ChecklistForm table.

Run with: python scripts/seed_georgia_forms.py
"""

import sys
import uuid
from pathlib import Path

from sqlalchemy import select

# Add parent directory to path so we can import from app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app, db
from app.models import ChecklistForm


def seed_georgia_forms():
    """Seed ChecklistForm records for Georgia forms already in S3."""

    forms = [
        # eXp Georgia - Buyer-Broker Agreements
        {
            "form_key": "buyer_broker_exclusive",
            "title": "Exclusive Buyer-Broker Representation Agreement",
            "description": "Exclusive agreement establishing your agent as your sole representative for home purchases.",
            "s3_template_path": "forms/eXp_GA/13_Exclusive Buyer Tenant-Broker Representation Agreement - eXp Georgia.pdf",
            "category": "buyer_broker_agreements",
        },
        {
            "form_key": "buyer_broker_non_exclusive",
            "title": "Non-Exclusive Buyer-Broker Representation Agreement",
            "description": "Non-exclusive agreement allowing you to work with multiple agents simultaneously.",
            "s3_template_path": "forms/eXp_GA/16_Non-Exclusive Buyer Tenant-Broker Representation Agreement - eXp Georgia.pdf",
            "category": "buyer_broker_agreements",
        },
        {
            "form_key": "buyer_broker_single_property",
            "title": "Single Property Buyer-Broker Agreement",
            "description": "Agreement for representation on a specific property only.",
            "s3_template_path": "forms/eXp_GA/20_Single Property Buyer-Broker Agreement - eXp Georgia.pdf",
            "category": "buyer_broker_agreements",
        },
        {
            "form_key": "buyer_broker_spanish_info",
            "title": "Buyer-Broker Agreement (Spanish - Informational)",
            "description": "Spanish language informational version of the buyer-broker representation agreement.",
            "s3_template_path": "forms/eXp_GA/4_Buyer-Broker Representation Agreement -Spanish Informational - eXp Georgia.pdf",
            "category": "buyer_broker_agreements",
        },
        {
            "form_key": "single_property_compensation_spanish",
            "title": "Single Property Compensation Agreement (Spanish - Informational)",
            "description": "Spanish language informational version of property-specific compensation agreement.",
            "s3_template_path": "forms/eXp_GA/21_Single Property Buyer-Broker Compensation Agreement -Spanish Informational - eXp Georgia.pdf",
            "category": "buyer_broker_agreements",
        },
        # eXp Georgia - Disclosures & Agency
        {
            "form_key": "aba_disclosure_english",
            "title": "Affiliated Business Arrangement Disclosure (ABA) - English",
            "description": "Disclosure of affiliated business relationships that may benefit from your transaction.",
            "s3_template_path": "forms/eXp_GA/1_Affiliated Business Arrangement Disclosure (ABA) - English Disclosure Statement - eXp Georgia.pdf",
            "category": "disclosures",
        },
        {
            "form_key": "aba_disclosure_spanish",
            "title": "Affiliated Business Arrangement Disclosure (ABA) - Spanish",
            "description": "Spanish language version of affiliated business arrangement disclosure (informational only).",
            "s3_template_path": "forms/eXp_GA/2_Affiliated Business Arrangement Disclosure (ABA) - Spanish (Info only) - eXp Georgia.pdf",
            "category": "disclosures",
        },
        {
            "form_key": "dual_agency_consent",
            "title": "Consent to Dual Agency",
            "description": "Consent form when your agent represents both buyer and seller in the same transaction.",
            "s3_template_path": "forms/eXp_GA/6_Consent to Dual Agency - eXp Georgia.pdf",
            "category": "disclosures",
        },
        {
            "form_key": "non_representation_disclosure",
            "title": "Disclosure and Acknowledgment of Non-Representation",
            "description": "Acknowledgment that the agent does not represent you in the transaction.",
            "s3_template_path": "forms/eXp_GA/8_Disclosure and Acknowledgment of NON-Representation - eXp Georgia.pdf",
            "category": "disclosures",
        },
        {
            "form_key": "non_representation_spanish",
            "title": "Non-Representation Disclosure (Spanish - Sample)",
            "description": "Spanish language sample of non-representation disclosure.",
            "s3_template_path": "forms/eXp_GA/7_Disclosure and Acknowledgment of NON-Representation (SPANISH LANGUAGE SAMPLE) - eXp Georgia.pdf",
            "category": "disclosures",
        },
        # eXp Georgia - Earnest Money & Escrow
        {
            "form_key": "earnest_money",
            "title": "Earnest Money Receipt",
            "description": "Receipt confirming your earnest money deposit has been received by escrow.",
            "s3_template_path": "forms/eXp_GA/10_Earnest Money Receipt - eXp Georgia.pdf",
            "category": "escrow",
        },
        {
            "form_key": "wiring_fraud_advisory",
            "title": "Wiring Fraud Advisory Notice",
            "description": "Warning about wire fraud schemes and how to verify wiring instructions safely.",
            "s3_template_path": "forms/eXp_GA/25_Wiring Fraud Advisory Notice - eXp Georgia.pdf",
            "category": "escrow",
        },
        {
            "form_key": "wiring_fraud_spanish",
            "title": "Wiring Fraud Advisory (Spanish - Informational)",
            "description": "Spanish language informational version of wiring fraud advisory.",
            "s3_template_path": "forms/eXp_GA/26_Wiring Fraud Advisory Notice - Spanish Informational - eXp Georgia.pdf",
            "category": "escrow",
        },
        # eXp Georgia - Offer & Negotiation
        {
            "form_key": "property_compensation_amendment",
            "title": "Property-Specific Compensation Amendment",
            "description": "Amendment specifying compensation for a particular property transaction.",
            "s3_template_path": "forms/eXp_GA/17_Property-Specific Compensation Amendment - eXp Georgia.pdf",
            "category": "offer",
        },
        {
            "form_key": "compensation_reduction_request",
            "title": "Compensation Reduction Request",
            "description": "Request form for reducing agent compensation on a transaction.",
            "s3_template_path": "forms/eXp_GA/5_Compensation Reduction Request - eXp Georgia.pdf",
            "category": "offer",
        },
        # eXp Georgia - Inspection & Due Diligence
        {
            "form_key": "waiver_of_inspections",
            "title": "Waiver of Inspections",
            "description": "Form waiving your right to home inspection contingencies. Use with caution.",
            "s3_template_path": "forms/eXp_GA/24_Waiver of Inspections - eXp Georgia.pdf",
            "category": "inspection",
        },
        # FMLS - Contract & Closing
        {
            "form_key": "notice_of_contract_fmls",
            "title": "Notice of Contract",
            "description": "Official notice to MLS that property is under contract.",
            "s3_template_path": "forms/fmls/117noticeofcontract.pdf",
            "category": "escrow",
        },
        {
            "form_key": "notice_of_closing_fmls",
            "title": "Notice of Closing",
            "description": "Notice to MLS that the transaction has closed.",
            "s3_template_path": "forms/fmls/118noticeofclosingform.pdf",
            "category": "closing",
        },
        {
            "form_key": "change_in_ownership_fmls",
            "title": "Change in Ownership of Property",
            "description": "Form documenting the transfer of property ownership.",
            "s3_template_path": "forms/fmls/112changeinownershipofproperty.pdf",
            "category": "closing",
        },
    ]

    print(f"\n{'=' * 60}")
    print("SEEDING GEORGIA FORMS")
    print(f"{'=' * 60}\n")

    added_count = 0
    skipped_count = 0

    for form_data in forms:
        # Check if form already exists
        existing = db.session.scalar(
            select(ChecklistForm).where(ChecklistForm.form_key == form_data["form_key"])
        )

        if existing:
            print(f"⏭️  SKIP: {form_data['form_key']} (already exists)")
            skipped_count += 1
            continue

        # Create new form
        form = ChecklistForm(
            id=str(uuid.uuid4()),
            form_key=form_data["form_key"],
            title=form_data["title"],
            description=form_data["description"],
            s3_template_path=form_data["s3_template_path"],
            category=form_data["category"],
        )

        db.session.add(form)
        print(f"✅ ADD: {form_data['form_key']} ({form_data['category']})")
        added_count += 1

    try:
        db.session.commit()
        print(f"\n{'=' * 60}")
        print(f"✅ Successfully added {added_count} forms")
        print(f"⏭️  Skipped {skipped_count} existing forms")
        print(f"{'=' * 60}\n")
    except Exception as e:
        db.session.rollback()
        print(f"\n❌ ERROR committing forms: {e}\n")
        raise


if __name__ == "__main__":
    app = create_app()

    with app.app_context():
        print("\n🚀 Starting Georgia forms seed...")
        seed_georgia_forms()
        print("✅ Done!\n")
