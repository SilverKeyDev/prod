"""Rank SkySlope forms by relevance to a checklist step."""

from app.config.skyslope_form_types import FORM_TYPE_KEYWORDS


def _score_form_for_suggested_id(form: dict, suggested_id: str) -> int:
    """
    Score a form against a suggested form type id.
    Uses FORM_TYPE_KEYWORDS for case-insensitive matching on name and attributes.
    """
    keywords = FORM_TYPE_KEYWORDS.get(suggested_id, [])
    if not keywords:
        return 0

    score = 0
    name = (form.get("name") or "").lower()
    attrs = form.get("attributes") or {}
    if isinstance(attrs, dict):
        attr_str = " ".join(str(v).lower() for v in attrs.values())
    else:
        attr_str = str(attrs).lower()

    searchable = f"{name} {attr_str}"
    for kw in keywords:
        if kw.lower() in searchable:
            score += 1
    return score


def rank_forms_for_step(
    forms: list[dict],
    suggested_form_ids: list[str],
) -> dict[str, list[dict]]:
    """
    Rank forms by relevance to checklist step suggested form types.

    Args:
        forms: SkySlope form objects with id, name, attributes
        suggested_form_ids: Our form type ids (e.g. earnest_money, wire_instructions)

    Returns:
        {"suggested": [...], "other": [...]}
        - suggested: forms matching suggested types, sorted by score desc
        - other: remaining forms
    """
    if not suggested_form_ids:
        return {"suggested": [], "other": list(forms)}

    scored: list[tuple[dict, int]] = []
    for form in forms:
        total = sum(_score_form_for_suggested_id(form, sid) for sid in suggested_form_ids)
        scored.append((form, total))

    suggested = [f for f, s in scored if s > 0]
    suggested.sort(
        key=lambda f: sum(_score_form_for_suggested_id(f, sid) for sid in suggested_form_ids),
        reverse=True,
    )
    other = [f for f, s in scored if s == 0]

    return {"suggested": suggested, "other": other}
