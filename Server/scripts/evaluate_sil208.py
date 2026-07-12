#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

_SERVER_ROOT = Path(__file__).resolve().parents[1]
if str(_SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVER_ROOT))

from app import create_app  # noqa: E402
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID  # noqa: E402
from app.services.brokerage.ml.scoring_service import (  # noqa: E402
    score_brokerage_ml_insights,
)


def _emit(*parts: object) -> None:
    sys.stdout.write(" ".join(str(part) for part in parts) + "\n")


def main() -> None:
    app = create_app()
    with app.app_context():
        result = score_brokerage_ml_insights(DEFAULT_BROKERAGE_ORG_ID)
        if not result.get("success"):
            _emit("FAILED:", result)
            return

        m = result["metrics"]
        _emit("=== SIL-208 (real SkySlope demo data) ===")
        _emit("brokerage:", DEFAULT_BROKERAGE_ORG_ID)
        _emit("coverage:", result["data_coverage"])
        _emit("dropoff:", m["dropoff"])
        _emit("agent_risk:", m["agent_risk"])
        _emit("forecast:", m["forecast"])
        _emit("top_stage_risks:", result["stage_dropoff_risks"][:5])
        _emit("top_at_risk_agents:", result["at_risk_agents"][:5])
        _emit("forecast_6_months:", result["seasonal_forecast"])


if __name__ == "__main__":
    main()
