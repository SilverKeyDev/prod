"""Listing status post-filter for polygon search."""


def canonical_mls_status_on_property(raw: str) -> str:
    s = str(raw).strip().lower().replace("-", "_")
    s = s.replace(" ", "_")
    if s in ("for_sale", "forsale"):
        return "active"
    return s


def property_kept_for_listing_status_pref(p: dict, pref: str) -> bool:
    raw = p.get("listingStatus") or p.get("listing_status")
    if raw is None or str(raw).strip() == "":
        return True
    api = canonical_mls_status_on_property(str(raw))
    if pref == "active":
        return api in ("active", "for_sale", "forsale")
    return api == pref
