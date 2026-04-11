"""Important locations preference writes."""

from typing import Any

from app import db
from app.models import UserImportantLocation


def write_important_locations_from_payload(user_id: str, data: dict[str, Any]) -> None:
    """Write UserImportantLocation rows from preferences payload."""
    locs = data.get("important_locations")
    if not isinstance(locs, list):
        locs = []
    ideal_zip = data.get("ideal_zip_code")
    if ideal_zip and isinstance(ideal_zip, str) and ideal_zip.strip():
        ideal_zip = ideal_zip.strip()
        # Prepend so _build_preferences_dict derives ideal_zip_code from first location
        locs = [{"address": ideal_zip}] + [
            loc
            for loc in locs
            if isinstance(loc, dict) and (loc.get("address") or "").strip() != ideal_zip
        ]
    if isinstance(locs, list) and len(locs) > 0:
        UserImportantLocation.query.filter_by(user_id=user_id).delete()
        for loc in locs:
            if isinstance(loc, dict):
                row = UserImportantLocation(
                    user_id=user_id,
                    label=loc.get("label"),
                    address=loc.get("address"),
                    max_commute_minutes=loc.get("max_commute_minutes"),
                    commute_mode=loc.get("commute_mode"),
                )
                db.session.add(row)
            elif isinstance(loc, str):
                row = UserImportantLocation(user_id=user_id, address=loc)
                db.session.add(row)
