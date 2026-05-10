"""Shared helpers for connection request ranking and agent row serialization."""

import re
from datetime import timezone

from ...models import User, UserAgentProfile


def normalize_zip(z: str | None) -> str | None:
    if not z:
        return None
    digits = "".join(c for c in str(z).strip() if c.isdigit())
    if len(digits) >= 5:
        return digits[:5]
    return None


def normalize_state(s: str | None) -> str | None:
    if not s or len(s.strip()) != 2:
        return None
    return s.strip().upper()


def tokenize(text: str | None) -> set[str]:
    if not text or not str(text).strip():
        return set()
    return {t for t in re.split(r"[^\w]+", str(text).lower()) if len(t) > 1}


def agent_row_base(agent: User, profile: UserAgentProfile | None = None) -> dict:
    created = agent.created_at
    if created is not None and created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    headshot = profile.professional_headshot_url if profile else None
    headshot_t = headshot.strip() if headshot and str(headshot).strip() else None
    user_pic = agent.profile_picture
    user_pic_t = user_pic.strip() if user_pic and str(user_pic).strip() else None
    profile_picture = headshot_t or user_pic_t
    description = None
    if profile and profile.agent_bio and str(profile.agent_bio).strip():
        description = str(profile.agent_bio).strip()
    return {
        "id": agent.id,
        "name": agent.name,
        "email": agent.email,
        "phone": agent.phone,
        "created_at": created.isoformat() if created else None,
        "profile_picture": profile_picture,
        "description": description,
    }
