#!/usr/bin/env python3
"""
Delete a user and related DB rows by primary key (users.id).

Run from the Server directory with the app on PYTHONPATH, e.g.:

    cd Server && python scripts/delete_user_by_id.py <user_uuid>

Requires DB env/config loaded the same way as the Flask app.
"""

import os
import sys

# Server root (parent of scripts/)
_SERVER_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _SERVER_ROOT not in sys.path:
    sys.path.insert(0, _SERVER_ROOT)

from app import create_app  # noqa: E402
from app.services.user.delete_user import delete_user_and_all_related_data  # noqa: E402


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python scripts/delete_user_by_id.py <user_id>", file=sys.stderr)
        sys.exit(1)
    user_id = sys.argv[1].strip()
    app = create_app()
    with app.app_context():
        deleted = delete_user_and_all_related_data(user_id)
    if deleted:
        print(f"Deleted user and related data: {user_id}")
    else:
        print(f"No user found with id: {user_id}", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
