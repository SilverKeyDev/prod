#!/usr/bin/env python3
"""
Provision SIL-145 QA accounts: Cognito (admin, no email OTP) + Postgres users, roles, seed links.

Usage (from repo root or Server/):
  cd Server && python scripts/qa/provision_test_accounts.py
"""

from __future__ import annotations

import argparse
import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import TextIO

_SERVER_ROOT = Path(__file__).resolve().parents[2]
_REPO_ROOT = _SERVER_ROOT.parent
if str(_SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVER_ROOT))

from botocore.exceptions import ClientError  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app import create_app, db  # noqa: E402
from app.models import UserRole  # noqa: E402
from app.services.auth.core.cognito_service import AWS_COGNITO_service  # noqa: E402

QA_PROPERTY_ZPID = "qa-silverkey-seed-home-1"
QA_PROPERTY_ADDRESS = "123 QA Test Lane, Atlanta, GA 30301"


def _out(message: str, stream: TextIO = sys.stdout) -> None:
    stream.write(f"{message}\n")


ROLE_DB: dict[str, dict] = {
    "buyer": {"name": "QA Buyer", "roles": ["buyer"], "has_preferences": True},
    "agent": {"name": "QA Agent", "roles": ["agent"]},
    "seller": {"name": "QA Seller", "roles": ["seller"]},
    "brokerage": {"name": "QA Brokerage", "roles": ["brokerage_admin"]},
    "integration_partner": {"name": "QA Partner", "roles": ["integration_partner"]},
}


def _load_accounts(path: Path) -> tuple[str, list[dict]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    password = (data.get("sharedPassword") or "").strip()
    if not password:
        raise SystemExit("sharedPassword missing in accounts file")
    accounts = data.get("accounts") or []
    if not accounts:
        raise SystemExit("accounts[] empty in accounts file")
    return password, accounts


def _confirm_cognito_if_needed(email: str) -> None:
    client = AWS_COGNITO_service.client
    pool_id = AWS_COGNITO_service.user_pool_id
    status = AWS_COGNITO_service.admin_get_user_status(email)
    if not status.get("success"):
        return
    if status.get("user_status") == "UNCONFIRMED":
        try:
            client.admin_confirm_sign_up(UserPoolId=pool_id, Username=email)
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "")
            if code not in ("NotAuthorizedException",):
                raise


def _ensure_cognito_user(email: str, name: str, password: str) -> str:
    attrs = [
        {"Name": "email", "Value": email},
        {"Name": "email_verified", "Value": "true"},
        {"Name": "name", "Value": name},
    ]
    result = AWS_COGNITO_service.admin_create_user(
        username=email, user_attributes=attrs, temporary_password=password
    )
    if not result.get("success"):
        raise RuntimeError(
            f"Cognito admin_create_user failed for {email}: {result.get('message') or result.get('error')}"
        )
    user_sub = result.get("user_sub")
    if not user_sub:
        raise RuntimeError(f"No user_sub returned for {email}")

    _confirm_cognito_if_needed(email)

    pw_result = AWS_COGNITO_service.admin_set_user_password(
        username=email, password=password, permanent=True
    )
    if not pw_result.get("success"):
        raise RuntimeError(
            f"Cognito admin_set_user_password failed for {email}: {pw_result.get('message')}"
        )
    return str(user_sub)


def _upsert_db_user(email: str, cognito_sub: str, cfg: dict) -> str:
    now = datetime.now(timezone.utc)
    row = db.session.execute(
        text("SELECT id FROM users WHERE email = :email LIMIT 1"), {"email": email}
    ).first()
    if row:
        user_id = str(row[0])
        db.session.execute(
            text(
                """
                UPDATE users
                SET cognito_id = :cognito_id, name = :name, is_active = true,
                    has_preferences = CASE WHEN :has_prefs THEN true ELSE has_preferences END,
                    updated_at = :now, last_logged_in = :now
                WHERE id = :id
                """
            ),
            {
                "id": user_id,
                "cognito_id": cognito_sub,
                "name": cfg["name"],
                "has_prefs": bool(cfg.get("has_preferences")),
                "now": now,
            },
        )
    else:
        user_id = cognito_sub
        db.session.execute(
            text(
                """
                INSERT INTO users (
                    id, cognito_id, email, name, is_active, has_preferences,
                    created_at, updated_at, last_logged_in
                ) VALUES (
                    :id, :cognito_id, :email, :name, true, :has_prefs,
                    :now, :now, :now
                )
                """
            ),
            {
                "id": user_id,
                "cognito_id": cognito_sub,
                "email": email,
                "name": cfg["name"],
                "has_prefs": bool(cfg.get("has_preferences")),
                "now": now,
            },
        )

    for role in cfg.get("roles") or []:
        exists = UserRole.query.filter_by(user_id=user_id, role=role).first()
        if exists is None:
            db.session.add(UserRole(user_id=user_id, role=role))

    db.session.commit()
    return user_id


def _seed_buyer_saved_home(buyer_id: str) -> None:
    prop = db.session.execute(
        text("SELECT id FROM property_cache WHERE zpid = :zpid LIMIT 1"),
        {"zpid": QA_PROPERTY_ZPID},
    ).first()
    if prop:
        property_id = str(prop[0])
    else:
        property_id = str(uuid.uuid4())
        db.session.execute(
            text(
                """
                INSERT INTO property_cache (
                    id, zpid, address, address_normalized, city, state, zipcode,
                    beds, baths, sqft, price, created_at, updated_at
                ) VALUES (
                    :id, :zpid, :address, :norm, :city, :state, :zip,
                    :beds, :baths, :sqft, :price, NOW(), NOW()
                )
                """
            ),
            {
                "id": property_id,
                "zpid": QA_PROPERTY_ZPID,
                "address": QA_PROPERTY_ADDRESS,
                "norm": QA_PROPERTY_ADDRESS.lower(),
                "city": "Atlanta",
                "state": "GA",
                "zip": "30301",
                "beds": "3",
                "baths": "2",
                "sqft": "1800",
                "price": "425000",
            },
        )

    link = db.session.execute(
        text(
            "SELECT id FROM user_property_link WHERE user_id = :uid AND property_id = :pid LIMIT 1"
        ),
        {"uid": buyer_id, "pid": property_id},
    ).first()
    if not link:
        db.session.execute(
            text(
                """
                INSERT INTO user_property_link (id, user_id, property_id, is_liked, current, created_at, updated_at)
                VALUES (:id, :uid, :pid, true, true, NOW(), NOW())
                """
            ),
            {"id": str(uuid.uuid4()), "uid": buyer_id, "pid": property_id},
        )
    db.session.commit()


def _link_agent_client(agent_id: str, client_id: str) -> None:
    existing = db.session.execute(
        text(
            """
            SELECT id FROM agent_conversations
            WHERE agent_id = :aid AND client_id = :cid LIMIT 1
            """
        ),
        {"aid": agent_id, "cid": client_id},
    ).first()
    if not existing:
        db.session.execute(
            text(
                """
                INSERT INTO agent_conversations (id, agent_id, client_id, created_at, updated_at)
                VALUES (:id, :aid, :cid, NOW(), NOW())
                """
            ),
            {"id": str(uuid.uuid4()), "aid": agent_id, "cid": client_id},
        )
    db.session.commit()


def _verify_login(email: str, password: str) -> bool:
    result = AWS_COGNITO_service.sign_in(username=email, password=password)
    return bool(result.get("success"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Provision SIL-145 QA test accounts")
    parser.add_argument(
        "--accounts-file",
        default=str(_REPO_ROOT / "documentation/runbooks/qa/test-accounts.json"),
    )
    args = parser.parse_args()
    accounts_path = Path(args.accounts_file)
    if not accounts_path.is_file():
        raise SystemExit(f"Accounts file not found: {accounts_path}")

    password, accounts = _load_accounts(accounts_path)
    app = create_app()

    with app.app_context():
        users_by_role: dict[str, str] = {}

        for entry in accounts:
            role = entry.get("role")
            email = (entry.get("email") or "").strip()
            if not role or not email:
                _out(f"SKIP invalid entry: {entry}")
                continue
            cfg = ROLE_DB.get(role)
            if cfg is None:
                _out(f"SKIP unknown role: {role}")
                continue

            _out(f"Provisioning {role} ({email})...")
            cognito_sub = _ensure_cognito_user(email, cfg["name"], password)
            user_id = _upsert_db_user(email, cognito_sub, cfg)
            users_by_role[role] = user_id

            if _verify_login(email, password):
                _out("  OK Cognito login verified")
            else:
                _out("  WARN Cognito login check failed")

        buyer_id = users_by_role.get("buyer")
        agent_id = users_by_role.get("agent")
        if buyer_id:
            _seed_buyer_saved_home(buyer_id)
            _out("  OK buyer saved home seeded")
        if agent_id and buyer_id:
            _link_agent_client(agent_id, buyer_id)
            _out("  OK agent ↔ buyer linked")

        _out("\nDone. Accounts:")
        for role, uid in users_by_role.items():
            email = next((a["email"] for a in accounts if a.get("role") == role), "?")
            _out(f"  {role}: {email} (id={uid})")


if __name__ == "__main__":
    main()
