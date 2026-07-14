"""SIL-309 campaign engagement model config."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Sil309Config:
    seed: int = 309
    model_version: str = "sil309-v1"
    # Outcomes: open / click / attach — primary demo target is attach
    primary_outcome: str = "attached"
    test_size: float = 0.25
    # Feature columns (numeric after encoding)
    numeric_features: tuple[str, ...] = (
        "tenure_years",
        "transaction_volume",
        "attach_rate",
        "prior_campaign_opens",
        "prior_campaign_clicks",
        "subject_length",
        "cta_type_code",
        "incentive_framing_code",
        "include_meet_link",
        "office_code",
        "variant_is_b",
    )
