from dataclasses import dataclass


@dataclass(frozen=True)
class Sil208Config:
    seed: int = 42
    model_version: str = "sil208-v1"
    forecast_horizon_months: int = 6
    at_risk_threshold: float = 0.60
