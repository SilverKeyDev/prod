"""
Seed sample MLS listings for the demo agent profiles on the public agent site (SIL-290).

Creates clearly-marked sample ``property_cache`` rows (MLS # ``SAMPLE-…``,
``mls_region`` GAMLS, no zpid so cards are non-clickable) attributed to the
demo agents THEMSELVES — never to a real agent or office — and stamps the
matching ``users.mls_id``. Photos are AI-generated images shipped with the web
bundle at ``Client/public/sample-listings/``.

Idempotent: re-running replaces the sample rows (keyed by the SAMPLE mls_agent_id).

Run with (from Server/): python scripts/misc/seed_sample_agent_listings.py
Options:
  --remove          delete the sample rows and unlink the demo agents instead
"""

import argparse
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import delete, select

# Add Server/ to path so we can import from app
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app import create_app, db
from app.models import PropertyCache, User

# email → (sample MLS agent id, brokerage label, image prefix, listings)
# Listing tuple: (street, city, zip, price, beds, baths, sqft, status)
SAMPLE_AGENTS = {
    "jadonsancho2707@gmail.com": (
        "SANCHOJADON",
        "SilverKey Realty",
        "jadon",
        [
            ("412 Bellview Terrace NE", "Atlanta", "30306", "$729,000", "4", "3", "2410", "Active"),
            ("87 Juniper Walk", "Decatur", "30030", "$515,000", "3", "2", "1780", "Active"),
            ("2203 Crestline Manor", "Marietta", "30062", "$865,000", "5", "4", "3350", "Active"),
            ("15 Foundry Row Unit 4B", "Atlanta", "30318", "$398,500", "2", "2", "1120", "Active"),
            ("930 Larkspur Bend", "Alpharetta", "30009", "$1,120,000", "5", "5", "4200", "Active"),
            ("664 Hollow Oak Drive", "Smyrna", "30080", "$472,000", "3", "3", "1930", "Sold"),
            ("128 Perry Commons Ave", "Atlanta", "30315", "$342,000", "3", "2", "1480", "Sold"),
            (
                "3491 Windward Plantation Ct",
                "Duluth",
                "30096",
                "$689,900",
                "4",
                "4",
                "2980",
                "Sold",
            ),
        ],
    ),
    "yashvermausa@gmail.com": (
        "VERMAYASH",
        "SilverKey",
        "yash",
        [
            (
                "2750 Peachford Overlook",
                "Dunwoody",
                "30338",
                "$798,000",
                "4",
                "3",
                "2650",
                "Active",
            ),
            ("41 Cascade Heights SW", "Atlanta", "30311", "$379,000", "3", "2", "1560", "Active"),
            ("1189 Sweetbay Circle", "Roswell", "30075", "$942,500", "5", "4", "3720", "Active"),
            (
                "506 Milltown Lofts Unit 12",
                "Atlanta",
                "30316",
                "$449,000",
                "2",
                "2",
                "1240",
                "Active",
            ),
            (
                "77 Ivy Gate Lane",
                "Sandy Springs",
                "30328",
                "$1,285,000",
                "6",
                "5",
                "4650",
                "Active",
            ),
            ("2934 Hearthstone Walk", "Brookhaven", "30319", "$715,000", "4", "3", "2540", "Sold"),
            (
                "450 Juniper Springs Ct",
                "Johns Creek",
                "30022",
                "$605,000",
                "4",
                "3",
                "2380",
                "Sold",
            ),
        ],
    ),
}

SAMPLE_MLS_AGENT_IDS = [agent_id for agent_id, _, _, _ in SAMPLE_AGENTS.values()]


def remove_samples() -> None:
    deleted = db.session.execute(
        delete(PropertyCache).where(PropertyCache.mls_agent_id.in_(SAMPLE_MLS_AGENT_IDS))
    ).rowcount
    for email, (agent_id, _, _, _) in SAMPLE_AGENTS.items():
        user = db.session.scalar(select(User).where(User.email == email))
        if user is not None and user.mls_id == agent_id:
            user.mls_id = None
    db.session.commit()
    print(f"Removed {deleted} sample listings and unlinked demo agents")


def seed_samples() -> None:
    db.session.execute(
        delete(PropertyCache).where(PropertyCache.mls_agent_id.in_(SAMPLE_MLS_AGENT_IDS))
    )
    now = datetime.now(timezone.utc)
    for email, (agent_id, brokerage, prefix, listings) in SAMPLE_AGENTS.items():
        user = db.session.scalar(select(User).where(User.email == email))
        if user is None:
            print(f"Skipping {email}: no user on this environment")
            continue
        user.mls_id = agent_id
        for i, (street, city, zipcode, price, beds, baths, sqft, status) in enumerate(listings, 1):
            db.session.add(
                PropertyCache(
                    id=str(uuid.uuid4()),
                    address=f"{street}, {city}, GA {zipcode}",
                    address_normalized=f"sample|{agent_id.lower()}|{i}",
                    city=city,
                    state="GA",
                    zipcode=zipcode,
                    beds=beds,
                    baths=baths,
                    sqft=sqft,
                    price=price,
                    primary_image_url=f"/sample-listings/{prefix}-{i}.jpg",
                    listing_status=status,
                    mls_agent_id=agent_id,
                    listing_agent_email=email,
                    brokerage=brokerage,
                    mls_home_id=f"SAMPLE-{agent_id[:3]}{i:03d}",
                    mls_region="GAMLS",
                    updated_at=now,
                )
            )
        print(f"Seeded {len(listings)} sample listings for {email} ({agent_id})")
    db.session.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--remove", action="store_true", help="Delete sample rows and unlink.")
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        if args.remove:
            remove_samples()
        else:
            seed_samples()


if __name__ == "__main__":
    main()
