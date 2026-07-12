#!/usr/bin/env python3
"""
Load SIL-285 demo CSV dataset into skyslope_transactions (SIL-272 persistence path).

Maps deals + properties (+ compliance) to SkySlopeTransaction rows via the same
map_skyslope_transaction → upsert_skyslope_transactions pipeline used by live sync.

Usage (from Server/ with venv + DATABASE_URL):
    python scripts/skyslope/load_demo_to_skyslope.py
    python scripts/skyslope/load_demo_to_skyslope.py --brokerage-id <uuid> --purge-demo
    python scripts/skyslope/load_demo_to_skyslope.py --dry-run
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import delete, select

_SERVER_ROOT = Path(__file__).resolve().parents[2]
if str(_SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVER_ROOT))

from app import create_app, db  # noqa: E402
from app.models.brokerage.brokerage_org import BrokerageOrg  # noqa: E402
from app.models.skyslope import SkySlopeTransaction  # noqa: E402
from app.services.brokerage.constants import DEFAULT_BROKERAGE_ORG_ID  # noqa: E402
from app.services.skyslope.persistence import (  # noqa: E402
    count_skyslope_transactions,
    upsert_skyslope_transactions,
)
from logger import log  # noqa: E402
from scripts.skyslope.demo_to_skyslope_mapping import map_demo_deal_to_transaction_row  # noqa: E402

DEFAULT_DATA_DIR = _SERVER_ROOT / "data" / "skyslope-demo"
DEMO_TRANSACTION_ID_PREFIX = "DEAL-"


def _load_tables(data_dir: Path) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    deals = pd.read_csv(data_dir / "deals.csv")
    properties = pd.read_csv(data_dir / "properties.csv")
    compliance = pd.read_csv(data_dir / "compliance.csv")
    for name, frame in ("deals", deals), ("properties", properties), ("compliance", compliance):
        if frame.empty:
            raise ValueError(f"Demo table '{name}' is empty under {data_dir}")
    return deals, properties, compliance


def build_mapped_rows(
    deals: pd.DataFrame,
    properties: pd.DataFrame,
    compliance: pd.DataFrame,
    *,
    brokerage_id: str,
) -> list[dict]:
    properties_by_id = properties.set_index("property_id")
    compliance_by_deal = compliance.set_index("deal_id")

    rows: list[dict] = []
    for deal in deals.to_dict(orient="records"):
        property_id = deal["property_id"]
        if property_id not in properties_by_id.index:
            raise ValueError(f"Deal {deal['deal_id']} references unknown property {property_id}")

        property_row = properties_by_id.loc[property_id]
        if isinstance(property_row, pd.DataFrame):
            property_row = property_row.iloc[0]

        compliance_row = None
        deal_id = deal["deal_id"]
        if deal_id in compliance_by_deal.index:
            compliance_row = compliance_by_deal.loc[deal_id]
            if isinstance(compliance_row, pd.DataFrame):
                compliance_row = compliance_row.iloc[0]

        rows.append(
            map_demo_deal_to_transaction_row(
                deal,
                property_row.to_dict(),
                brokerage_id=brokerage_id,
                compliance_row=compliance_row.to_dict() if compliance_row is not None else None,
                agent_id=None,
            )
        )
    return rows


def purge_demo_transactions(brokerage_id: str) -> int:
    """Delete prior demo loads (skyslope_transaction_id LIKE 'DEAL-%')."""
    result = db.session.execute(
        delete(SkySlopeTransaction).where(
            SkySlopeTransaction.brokerage_id == brokerage_id,
            SkySlopeTransaction.skyslope_transaction_id.like(f"{DEMO_TRANSACTION_ID_PREFIX}%"),
        )
    )
    db.session.commit()
    return int(result.rowcount or 0)


def load_demo_to_skyslope(
    brokerage_id: str,
    data_dir: Path,
    *,
    batch_size: int = 500,
    purge_demo: bool = False,
    dry_run: bool = False,
) -> dict[str, int]:
    deals, properties, compliance = _load_tables(data_dir)
    mapped_rows = build_mapped_rows(deals, properties, compliance, brokerage_id=brokerage_id)

    if dry_run:
        return {
            "dry_run": True,
            "rows_prepared": len(mapped_rows),
            "created": 0,
            "updated": 0,
            "purged": 0,
            "total_after": count_skyslope_transactions(brokerage_id),
        }

    purged = 0
    if purge_demo:
        purged = purge_demo_transactions(brokerage_id)

    created_total = 0
    updated_total = 0
    for start in range(0, len(mapped_rows), batch_size):
        batch = mapped_rows[start : start + batch_size]
        created, updated = upsert_skyslope_transactions(brokerage_id, batch)
        created_total += created
        updated_total += updated

    return {
        "dry_run": False,
        "rows_prepared": len(mapped_rows),
        "created": created_total,
        "updated": updated_total,
        "purged": purged,
        "total_after": count_skyslope_transactions(brokerage_id),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Load SIL-285 demo CSVs into skyslope_transactions"
    )
    parser.add_argument(
        "--brokerage-id",
        default=DEFAULT_BROKERAGE_ORG_ID,
        help="Target brokerage_orgs.id (default: seeded SilverKey default org)",
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=DEFAULT_DATA_DIR,
        help="Directory containing deals.csv, properties.csv, compliance.csv",
    )
    parser.add_argument("--batch-size", type=int, default=500)
    parser.add_argument(
        "--purge-demo",
        action="store_true",
        help="Delete existing DEAL-* rows for this brokerage before loading",
    )
    parser.add_argument("--dry-run", action="store_true", help="Map rows only; do not write DB")
    args = parser.parse_args()

    data_dir = args.data_dir.resolve()
    if not data_dir.is_dir():
        log.error("API", f"Data directory not found: {data_dir}")
        return 1

    app = create_app()
    with app.app_context():
        brokerage = db.session.scalar(
            select(BrokerageOrg).where(BrokerageOrg.id == args.brokerage_id)
        )
        if not brokerage:
            log.error("API", f"Brokerage not found: {args.brokerage_id}")
            return 1

        log.info(
            "API", f"Loading demo data for brokerage '{brokerage.name}' ({args.brokerage_id})..."
        )
        summary = load_demo_to_skyslope(
            args.brokerage_id,
            data_dir,
            batch_size=args.batch_size,
            purge_demo=args.purge_demo,
            dry_run=args.dry_run,
        )

    for key, value in summary.items():
        log.info("API", f"  {key}: {value}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
