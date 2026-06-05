"""Unique public profile slugs for short share URLs (`/a/{slug}`)."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING

from sqlalchemy import select

from app import db
from app.services.auth.user_role_helpers import user_is_agent

if TYPE_CHECKING:
    from app.models import User

RESERVED_PUBLIC_PROFILE_SLUGS: frozenset[str] = frozenset(
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

MIN_PUBLIC_PROFILE_SLUG_LEN = 3
MAX_PUBLIC_PROFILE_SLUG_LEN = 64
_SLUG_BODY_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def slugify_display_name(name: str) -> str:
    """Match client `generateAgentProfileSlug` (packages/utils/agent/slug.ts)."""
    s = name.lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    s = s.strip("-").strip()
    return s


def is_valid_public_profile_slug(raw: str | None) -> bool:
    if not raw or not str(raw).strip():
        return False
    s = str(raw).strip().lower()
    if len(s) < MIN_PUBLIC_PROFILE_SLUG_LEN or len(s) > MAX_PUBLIC_PROFILE_SLUG_LEN:
        return False
    if s in RESERVED_PUBLIC_PROFILE_SLUGS:
        return False
    return bool(_SLUG_BODY_PATTERN.fullmatch(s))


def normalize_public_profile_slug_input(raw: str | None) -> str | None:
    """Lowercase/strip; return None if invalid."""
    if not raw or not str(raw).strip():
        return None
    s = str(raw).strip().lower()
    if not is_valid_public_profile_slug(s):
        return None
    return s


def _truncate_base(base: str, max_len: int) -> str:
    if len(base) <= max_len:
        return base
    return base[:max_len].rstrip("-")


def _unique_slug_candidates(base: str, user_id: str) -> list[str]:
    """Generate ordered slug candidates including deterministic suffixes for collisions."""
    uid = user_id.replace("-", "")[:12]
    truncated = _truncate_base(base, MAX_PUBLIC_PROFILE_SLUG_LEN)
    out: list[str] = [truncated]
    suffixes = [uid[:4], uid[:8], uid[:12], user_id[:8].lower()]
    for suf in suffixes:
        dash = f"{truncated}-{suf}"
        if len(dash) <= MAX_PUBLIC_PROFILE_SLUG_LEN:
            out.append(dash)
        else:
            room = MAX_PUBLIC_PROFILE_SLUG_LEN - len(suf) - 1
            if room >= MIN_PUBLIC_PROFILE_SLUG_LEN:
                out.append(f"{truncated[:room]}-{suf}")
    # Last resort: agent + full id fragment (still <= 64 with typical uuid)
    out.append(f"agent-{user_id.lower()}"[:MAX_PUBLIC_PROFILE_SLUG_LEN])
    return out


def ensure_public_profile_slug(user: User) -> None:
    """Assign `public_profile_slug` when the user is an active agent; clear otherwise."""
    from app.models import User as UserModel

    u = user
    is_agent = bool(user_is_agent(u))
    if not is_agent:
        u.public_profile_slug = None
        return
    if u.public_profile_slug and str(u.public_profile_slug).strip():
        return

    base = slugify_display_name((u.name or "").strip() or "agent")
    if len(base) < MIN_PUBLIC_PROFILE_SLUG_LEN:
        base = f"agent-{u.id[:8].lower()}"

    for candidate in _unique_slug_candidates(base, u.id):
        if not is_valid_public_profile_slug(candidate):
            continue
        existing = db.session.scalar(
            select(UserModel).where(
                UserModel.public_profile_slug == candidate,
                UserModel.id != u.id,
            )
        )
        if existing is None:
            u.public_profile_slug = candidate
            return


def lookup_agent_user_id_by_public_slug(normalized_slug: str) -> str | None:
    """Resolve slug to agent user id, or None."""
    from app.models import User

    if not is_valid_public_profile_slug(normalized_slug):
        return None
    row = db.session.scalar(
        select(User).where(User.public_profile_slug == normalized_slug.lower().strip())
    )
    if row is None:
        return None
    if not bool(user_is_agent(row)):
        return None
    if row.is_active is not None and not row.is_active:
        return None
    return row.id
