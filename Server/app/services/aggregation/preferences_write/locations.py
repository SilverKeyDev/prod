"""Important locations preference writes."""

from typing import Any

from app import db
from app.models import UserImportantLocation
from logger import LOG_CATEGORIES, log


def write_important_locations_from_payload(user_id: str, data: dict[str, Any]) -> None:
    """Write UserImportantLocation rows from preferences payload."""
    if "important_locations" not in data:
        log.info(
            LOG_CATEGORIES["PROFILE_PREFERENCES"],
            "write_important_locations_from_payload skipped (key absent)",
            {"user_id_len": len(user_id) if isinstance(user_id, str) else None},
        )
        return
    locs = data.get("important_locations")
    if not isinstance(locs, list):
        locs = []
    # Explicit [] means the user cleared important locations — do not re-seed from ideal_zip.
    ideal_zip = data.get("ideal_zip_code")
    if locs and ideal_zip and isinstance(ideal_zip, str) and ideal_zip.strip():
        ideal_zip = ideal_zip.strip()
        # Prepend so _build_preferences_dict derives ideal_zip_code from first location
        locs = [{"address": ideal_zip}] + [
            loc
            for loc in locs
            if isinstance(loc, dict) and (loc.get("address") or "").strip() != ideal_zip
        ]
    log.info(
        LOG_CATEGORIES["PROFILE_PREFERENCES"],
        "write_important_locations_from_payload replacing rows",
        {
            "user_id_len": len(user_id) if isinstance(user_id, str) else None,
            "incoming_len": len(locs),
        },
    )
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
