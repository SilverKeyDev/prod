#!/usr/bin/env python3
"""
Idempotent backfill: for each user_admin row with is_admin=true, ensure user_roles has admin or super_admin.

Run after deploy when switching authorization to user_roles only (user_admin.is_admin becomes non-authoritative).

From Server/:

    python scripts/misc/reconcile_user_admin_roles.py
    python scripts/misc/reconcile_user_admin_roles.py --dry-run
    python scripts/misc/reconcile_user_admin_roles.py --report-drift

--report-drift: print rows where is_admin is true but user has neither admin nor super_admin role; exit 1 if any.
"""

from __future__ import annotations

import argparse
import os
import sys

from sqlalchemy import select

_SERVER_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _SERVER_ROOT not in sys.path:
    sys.path.insert(0, _SERVER_ROOT)

from app import create_app, db  # noqa: E402
from app.models import UserAdmin, UserRole  # noqa: E402


def _has_admin_gate_role(user_id: str) -> bool:
    row = db.session.scalars(
        select(UserRole).where(
            UserRole.user_id == user_id,
            UserRole.role.in_(("admin", "super_admin")),
        )
    ).first()
    return row is not None


def report_drift() -> list[str]:
    """User IDs where legacy flag is set but roles do not grant admin panel access."""
    drift_ids: list[str] = []
    for ua in db.session.scalars(select(UserAdmin).where(UserAdmin.is_admin.is_(True))).all():
        if not _has_admin_gate_role(ua.user_id):
            drift_ids.append(ua.user_id)
    return drift_ids


def reconcile(*, dry_run: bool) -> tuple[int, int]:
    """
    Returns (inserted_count, skipped_already_had_role_count).
    skipped = already had admin/super_admin OR flag false users not touched.
    """
    inserted = 0
    skipped = 0
    for ua in db.session.scalars(select(UserAdmin).where(UserAdmin.is_admin.is_(True))).all():
        if _has_admin_gate_role(ua.user_id):
            skipped += 1
            continue
        db.session.add(UserRole(user_id=ua.user_id, role="admin"))
        inserted += 1

    if dry_run:
        db.session.rollback()
    else:
        db.session.commit()

    return inserted, skipped


def main() -> None:
    parser = argparse.ArgumentParser(description="Reconcile user_admin.is_admin into user_roles.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Compute changes but roll back (no commit).",
    )
    parser.add_argument(
        "--report-drift",
        action="store_true",
        help="Exit 1 if any user has is_admin=true without admin/super_admin role.",
    )
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        if args.report_drift:
            drift = report_drift()
            if drift:
                sys.stderr.write(
                    "Drift: user_admin.is_admin=true but no admin/super_admin in user_roles:\n"
                )
                for uid in drift:
                    sys.stderr.write(f"  {uid}\n")
                sys.exit(1)
            sys.stdout.write("No user_admin / user_roles drift.\n")
            sys.exit(0)

        inserted, skipped = reconcile(dry_run=args.dry_run)
        prefix = "[dry-run] would insert" if args.dry_run else "Inserted"
        sys.stdout.write(
            f"{prefix} {inserted} admin role row(s); skipped {skipped} (already had admin/super_admin).\n"
        )


if __name__ == "__main__":
    main()
