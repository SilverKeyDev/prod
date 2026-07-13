"""
Backfill PropertyCache listing-agent attribution columns from cached raw_data.

Older cache rows were written before ``update_property_basic_data`` stamped
``mls_agent_id`` / ``listing_agent_email`` / ``listing_agent_phone`` /
``brokerage``; the public agent site listings match (SIL-290) needs those
columns populated. Additive and idempotent — only fills empty columns.

Run with (from Server/): python scripts/misc/backfill_listing_agent_attribution.py

Demo helpers (local/dev only):
  --link-user EMAIL MLS_AGENT_ID   set users.mls_id so an agent matches cached listings
  --mark-sold ZPID [ZPID ...]      flip listing_status to "Sold" to demo the former bucket
"""

import argparse
import sys
from pathlib import Path

from sqlalchemy import select

# Add Server/ to path so we can import from app
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app import create_app, db
from app.models import PropertyCache, User


def backfill_attribution() -> None:
    rows = db.session.scalars(select(PropertyCache).where(PropertyCache.raw_data.isnot(None))).all()
    updated = 0
    for row in rows:
        data = row.raw_data or {}
        changed = False
        agent = data.get("listingAgent")
        if isinstance(agent, dict):
            if not row.mls_agent_id and agent.get("id"):
                row.mls_agent_id = str(agent["id"])
                changed = True
            if not row.listing_agent_email and agent.get("email"):
                row.listing_agent_email = str(agent["email"])
                changed = True
            if not row.listing_agent_phone and agent.get("phone"):
                row.listing_agent_phone = str(agent["phone"])
                changed = True
        office = data.get("listingOffice")
        office_name = (
            office.get("name")
            if isinstance(office, dict)
            else office
            if isinstance(office, str)
            else None
        )
        if not row.brokerage and office_name and str(office_name).strip():
            row.brokerage = str(office_name).strip()
            changed = True
        if changed:
            updated += 1
    db.session.commit()
    print(f"Backfilled attribution on {updated} of {len(rows)} property_cache rows")


def link_user(email: str, mls_agent_id: str) -> None:
    user = db.session.scalar(select(User).where(User.email == email))
    if user is None:
        print(f"No user with email {email}")
        return
    user.mls_id = mls_agent_id
    db.session.commit()
    count = db.session.scalars(
        select(PropertyCache.id).where(PropertyCache.mls_agent_id == mls_agent_id)
    ).all()
    print(f"Set users.mls_id={mls_agent_id} for {email}; matches {len(count)} cached listings")


def mark_sold(zpids: list[str]) -> None:
    rows = db.session.scalars(select(PropertyCache).where(PropertyCache.zpid.in_(zpids))).all()
    for row in rows:
        row.listing_status = "Sold"
    db.session.commit()
    print(f"Marked {len(rows)} of {len(zpids)} requested zpids as Sold")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--link-user", nargs=2, metavar=("EMAIL", "MLS_AGENT_ID"))
    parser.add_argument("--mark-sold", nargs="+", metavar="ZPID")
    parser.add_argument("--skip-backfill", action="store_true", help="Only run the demo helpers.")
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        if not args.skip_backfill:
            backfill_attribution()
        if args.link_user:
            link_user(args.link_user[0], args.link_user[1])
        if args.mark_sold:
            mark_sold(args.mark_sold)


if __name__ == "__main__":
    main()
