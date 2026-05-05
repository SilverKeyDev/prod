"""Add users.public_profile_slug for short public profile URLs.

Revision ID: e1f2a3b4c5d7
Revises: c7d8e9f0a1b2
Create Date: 2026-05-04

"""

from __future__ import annotations

import re

import sqlalchemy as sa
from alembic import op

revision = "e1f2a3b4c5d7"
down_revision = "c7d8e9f0a1b2"
branch_labels = None
depends_on = None

_TABLE = "users"
_COL = "public_profile_slug"
_UQ = "uq_users_public_profile_slug"

_MAX_LEN = 64

# Keep aligned with app.services.public_profile_slug.RESERVED_PUBLIC_PROFILE_SLUGS
_RESERVED = frozenset(
    {
        "a",
        "api",
        "admin",
        "login",
        "signup",
        "logout",
        "property",
        "dashboard",
        "search",
        "saved",
        "profile",
        "messaging",
        "agents",
        "find-agents",
        "about",
        "contact",
        "privacy",
        "terms",
        "verification",
        "onboarding",
        "www",
        "app",
        "static",
        "assets",
        "agent-profile",
    }
)


def _slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    s = s.strip("-").strip()
    return s


def _truncate(base: str, max_len: int) -> str:
    if len(base) <= max_len:
        return base
    return base[:max_len].rstrip("-")


def _candidates(base: str, user_id: str, max_len: int) -> list[str]:
    uid = user_id.replace("-", "")[:12]
    truncated = _truncate(base, max_len)
    out: list[str] = [truncated]
    suffixes = [uid[:4], uid[:8], uid[:12], user_id[:8].lower()]
    for suf in suffixes:
        dash = f"{truncated}-{suf}"
        if len(dash) <= max_len:
            out.append(dash)
        else:
            room = max_len - len(suf) - 1
            if room >= 3:
                out.append(f"{truncated[:room]}-{suf}")
    out.append(f"agent-{user_id.lower()}"[:max_len])
    return out


def upgrade():
    with op.batch_alter_table(_TABLE, schema=None) as batch_op:
        batch_op.add_column(sa.Column(_COL, sa.String(length=64), nullable=True))
        batch_op.create_unique_constraint(_UQ, [_COL])

    bind = op.get_bind()
    max_len = 64
    min_len = 3
    raw = bind.execute(sa.text("SELECT id, name, is_agent FROM users")).fetchall()
    rows = []
    for r in raw:
        flag = r[2]
        if flag in (True, 1, "1"):
            rows.append((r[0], r[1]))
    used: set[str] = set()
    up = sa.text(
        f"UPDATE {_TABLE} SET {_COL} = :slug WHERE id = :id"  # noqa: S608 — table/column names are fixed literals
    )
    for row in rows:
        uid = str(row[0])
        name_raw = row[1] or ""
        base = _slugify(str(name_raw).strip() or "agent")
        if len(base) < min_len:
            base = f"agent-{uid[:8].lower()}"
        assigned = False
        for cand in _candidates(base, uid, max_len):
            c = cand.lower().strip()
            if len(c) < min_len or len(c) > max_len or c in _RESERVED:
                continue
            if c in used:
                continue
            used.add(c)
            bind.execute(up, {"slug": c, "id": uid})
            assigned = True
            break
        if not assigned:
            fallback = f"agent-{uid.lower()}"[:max_len]
            used.add(fallback)
            bind.execute(up, {"slug": fallback, "id": uid})


def downgrade():
    with op.batch_alter_table(_TABLE, schema=None) as batch_op:
        batch_op.drop_constraint(_UQ, type_="unique")
        batch_op.drop_column(_COL)
