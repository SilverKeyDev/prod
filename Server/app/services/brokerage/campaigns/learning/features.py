"""Build recipient-level feature rows for campaign engagement scoring."""

from __future__ import annotations

from typing import Any

CTA_CODES = {
    "soft_nudge": 0,
    "book_time": 1,
    "checklist": 2,
    "script": 3,
}
INCENTIVE_CODES = {
    "percentage": 0,
    "dollar_amount": 1,
    "process": 2,
}


def _variant_lookup(campaign: dict[str, Any]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for v in campaign.get("variants", []):
        key = v.get("key") or v.get("variant_key")
        if key:
            # Normalize key field for downstream
            normalized = dict(v)
            normalized["key"] = key
            out[str(key)] = normalized
    return out


def _office_codes(recipients: list[dict]) -> dict[str, int]:
    offices = sorted({r.get("office_id") or "OFF-000" for r in recipients})
    return {oid: idx for idx, oid in enumerate(offices)}


def build_feature_rows(campaign: dict[str, Any]) -> list[dict[str, Any]]:
    """One row per recipient with agent + variant features and outcomes."""
    variants = _variant_lookup(campaign)
    recipients = campaign.get("recipients") or []
    office_map = _office_codes(recipients)
    rows: list[dict[str, Any]] = []
    for rec in recipients:
        vkey = rec.get("variant") or rec.get("variant_key") or "A"
        variant = variants.get(str(vkey), {})
        rows.append(
            {
                "agent_id": rec.get("agent_id"),
                "variant": vkey,
                "tenure_years": float(rec.get("tenure_years") or 0),
                "transaction_volume": float(rec.get("transaction_volume") or 0),
                "attach_rate": float(rec.get("attach_rate") or 0),
                "prior_campaign_opens": float(rec.get("prior_campaign_opens") or 0),
                "prior_campaign_clicks": float(rec.get("prior_campaign_clicks") or 0),
                "subject_length": float(
                    variant.get("subject_length") or len(str(variant.get("subject") or ""))
                ),
                "cta_type": variant.get("cta_type") or "soft_nudge",
                "cta_type_code": float(
                    CTA_CODES.get(str(variant.get("cta_type") or "soft_nudge"), 0)
                ),
                "incentive_framing": variant.get("incentive_framing") or "process",
                "incentive_framing_code": float(
                    INCENTIVE_CODES.get(str(variant.get("incentive_framing") or "process"), 0)
                ),
                "include_meet_link": float(1.0 if variant.get("include_meet_link") else 0.0),
                "office_id": rec.get("office_id") or "OFF-000",
                "office_code": float(office_map.get(rec.get("office_id") or "OFF-000", 0)),
                "variant_is_b": float(1.0 if vkey == "B" else 0.0),
                "opened": int(bool(rec.get("opened"))),
                "clicked": int(bool(rec.get("clicked"))),
                "attached": int(bool(rec.get("attached"))),
            }
        )
    return rows


def rows_to_matrix(rows: list[dict[str, Any]], feature_names: tuple[str, ...]):
    import numpy as np

    X = np.array([[float(r[name]) for name in feature_names] for r in rows], dtype=float)
    return X
