#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

_SERVER_ROOT = Path(__file__).resolve().parents[1]
if str(_SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVER_ROOT))

from app import create_app
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID
from app.services.brokerage.ml.scoring_service import score_brokerage_ml_insights


def main() -> None:
    app = create_app()
    with app.app_context():
        result = score_brokerage_ml_insights(DEFAULT_BROKERAGE_ORG_ID)
        if not result.get("success"):
            print("FAILED:", result)
            return

        m = result["metrics"]
        print("=== SIL-208 (real SkySlope demo data) ===")
        print("brokerage:", DEFAULT_BROKERAGE_ORG_ID)
        print("coverage:", result["data_coverage"])
        print("dropoff:", m["dropoff"])
        print("agent_risk:", m["agent_risk"])
        print("forecast:", m["forecast"])
        print("top_stage_risks:", result["stage_dropoff_risks"][:5])
        print("top_at_risk_agents:", result["at_risk_agents"][:5])
        print("forecast_6_months:", result["seasonal_forecast"])


if __name__ == "__main__":
    main()
