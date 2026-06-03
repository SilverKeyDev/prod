"""Intent attributes preference writes (features, deal breakers, must-have, listing type)."""

from typing import Any

from sqlalchemy import delete

from app import db
from app.models import UserIntentAttribute


def write_intent_attributes_from_payload(user_id: str, data: dict[str, Any]) -> None:
    """Write UserIntentAttribute rows from preferences payload."""
    # other_requirements (unified) or preferred_home_features + deal_breakers
    other_req = data.get("other_requirements")
    if isinstance(other_req, list):
        features = []
        breakers = []
        for item in other_req:
            key = item if isinstance(item, str) else str(item)
            key_stripped = key.strip()
            if not key_stripped:
                continue
            if key_stripped.lower().startswith("no "):
                breakers.append(key_stripped)
            else:
                features.append(key_stripped)
        db.session.execute(
            delete(UserIntentAttribute).where(
                UserIntentAttribute.user_id == user_id,
                UserIntentAttribute.attribute_type.in_(["feature", "nice_to_have"]),
            )
        )
        db.session.execute(
            delete(UserIntentAttribute).where(
                UserIntentAttribute.user_id == user_id,
                UserIntentAttribute.attribute_type == "deal_breaker",
            )
        )
        for f in features:
            db.session.add(
                UserIntentAttribute(user_id=user_id, attribute_type="feature", attribute_key=f)
            )
        for b in breakers:
            db.session.add(
                UserIntentAttribute(user_id=user_id, attribute_type="deal_breaker", attribute_key=b)
            )
    else:
        features = data.get("preferred_home_features")
        if isinstance(features, list):
            db.session.execute(
                delete(UserIntentAttribute).where(
                    UserIntentAttribute.user_id == user_id,
                    UserIntentAttribute.attribute_type.in_(["feature", "nice_to_have"]),
                )
            )
            for f in features:
                key = f if isinstance(f, str) else str(f)
                if key:
                    db.session.add(
                        UserIntentAttribute(
                            user_id=user_id, attribute_type="feature", attribute_key=key
                        )
                    )
        breakers = data.get("deal_breakers")
        if isinstance(breakers, list):
            db.session.execute(
                delete(UserIntentAttribute).where(
                    UserIntentAttribute.user_id == user_id,
                    UserIntentAttribute.attribute_type == "deal_breaker",
                )
            )
            for b in breakers:
                key = b if isinstance(b, str) else str(b)
                if key:
                    db.session.add(
                        UserIntentAttribute(
                            user_id=user_id, attribute_type="deal_breaker", attribute_key=key
                        )
                    )

    # must_have and listing_type (always from payload when present)
    must_have = data.get("must_have")
    if isinstance(must_have, list):
        db.session.execute(
            delete(UserIntentAttribute).where(
                UserIntentAttribute.user_id == user_id,
                UserIntentAttribute.attribute_type == "must_have",
            )
        )
        for m in must_have:
            key = m if isinstance(m, str) else str(m)
            if key:
                db.session.add(
                    UserIntentAttribute(
                        user_id=user_id, attribute_type="must_have", attribute_key=key
                    )
                )
    listing_type = data.get("listing_type")
    if isinstance(listing_type, list):
        db.session.execute(
            delete(UserIntentAttribute).where(
                UserIntentAttribute.user_id == user_id,
                UserIntentAttribute.attribute_type == "listing_type",
            )
        )
        for lt in listing_type:
            key = lt if isinstance(lt, str) else str(lt)
            if key:
                db.session.add(
                    UserIntentAttribute(
                        user_id=user_id, attribute_type="listing_type", attribute_key=key
                    )
                )

    # Single-value housing prefs stored in UserIntentAttribute
    for attr_type, payload_key in [
        ("preferred_architectural_style", "preferred_architectural_style"),
        ("renovation_preference", "renovation_preference"),
        ("intended_property_use", "intended_property_use"),
    ]:
        db.session.execute(
            delete(UserIntentAttribute).where(
                UserIntentAttribute.user_id == user_id,
                UserIntentAttribute.attribute_type == attr_type,
            )
        )
        val = data.get(payload_key)
        if val is not None and str(val).strip():
            db.session.add(
                UserIntentAttribute(
                    user_id=user_id,
                    attribute_type=attr_type,
                    attribute_key=str(val).strip(),
                )
            )

    # paying_cash: boolean as UserIntentAttribute (attribute_key "yes" when true; absent when false)
    if "paying_cash" in data:
        db.session.execute(
            delete(UserIntentAttribute).where(
                UserIntentAttribute.user_id == user_id,
                UserIntentAttribute.attribute_type == "paying_cash",
            )
        )
        raw = data["paying_cash"]
        truthy = raw is True or (
            isinstance(raw, str) and str(raw).strip().lower() in ("true", "1", "yes")
        )
        if truthy:
            db.session.add(
                UserIntentAttribute(
                    user_id=user_id,
                    attribute_type="paying_cash",
                    attribute_key="yes",
                )
            )
