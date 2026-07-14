#!/usr/bin/env python3
"""Generate Client brokerage agent analytics fixtures from SIL-285 demo CSVs.

Aggregates closed deals per agent from `Server/data/skyslope-demo` into the
`BROKERAGE_AGENTS_FIXTURE` shape used by the Agents tab.

Usage (from Server/):
    python scripts/skyslope/generate_agent_analytics_fixtures.py
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

SERVER_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = SERVER_ROOT.parent
DEFAULT_DATA = SERVER_ROOT / "data" / "skyslope-demo"
DEFAULT_OUT = (
    REPO_ROOT
    / "Client"
    / "packages"
    / "features"
    / "brokerage"
    / "utils"
    / "brokerageAnalyticsFixtures.agents.ts"
)

STALL_STAGES = ("search", "offer", "contract")
# Align with overview agentStatusBreakdown: ~20% top / ~71% healthy / ~9% at_risk
TOP_FRACTION = 0.20
AT_RISK_FRACTION = 0.09
# Client PERIOD_SCALE treats month=1 and all/5years=24. Dataset deal totals are the
# full demo window, so store monthly baselines (total / 24) for correct period scaling.
ALL_PERIOD_MONTHS = 24


def _parse_date(raw: str | None) -> date | None:
    if not raw:
        return None
    try:
        return datetime.strptime(raw[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


def _load_offices(data_dir: Path) -> dict[str, str]:
    offices: dict[str, str] = {}
    with (data_dir / "offices.csv").open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            offices[row["office_id"]] = row["name"]
    return offices


def _load_agents(data_dir: Path, offices: dict[str, str]) -> list[dict[str, object]]:
    agents: list[dict[str, object]] = []
    with (data_dir / "agents.csv").open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            agents.append(
                {
                    "id": row["agent_id"],
                    "name": f"{row['first_name']} {row['last_name']}",
                    "office": offices.get(row["office_id"], row["office_id"]),
                    "team": row["team"],
                }
            )
    return agents


def _aggregate_deals(
    data_dir: Path,
) -> tuple[dict[str, dict[str, float | int]], date | None]:
    """Return per-agent closed stats and the latest close date in the dataset."""
    stats: dict[str, dict[str, float | int]] = defaultdict(
        lambda: {
            "closings": 0,
            "volumeDollars": 0.0,
            "gci": 0.0,
            "recent_volume": 0.0,
            "prior_volume": 0.0,
            "active_sides": 0,
        }
    )
    latest: date | None = None

    with (data_dir / "deals.csv").open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            status = row.get("status", "")
            listing_id = row.get("listing_agent_id") or ""
            buyer_id = row.get("buyer_agent_id") or ""
            agent_ids = {aid for aid in (listing_id, buyer_id) if aid}

            if status in ("listed", "pending", "under_contract"):
                for aid in agent_ids:
                    stats[aid]["active_sides"] = int(stats[aid]["active_sides"]) + 1
                continue

            if status != "closed":
                continue

            close_d = _parse_date(row.get("close_date"))
            if close_d and (latest is None or close_d > latest):
                latest = close_d

            try:
                sale_price = float(row.get("sale_price") or 0)
            except ValueError:
                sale_price = 0.0
            try:
                gci = float(row.get("gci") or 0)
            except ValueError:
                gci = 0.0

            n = len(agent_ids) or 1
            volume_share = sale_price / n
            gci_share = gci / n

            for aid in agent_ids:
                s = stats[aid]
                s["closings"] = int(s["closings"]) + 1
                s["volumeDollars"] = float(s["volumeDollars"]) + volume_share
                s["gci"] = float(s["gci"]) + gci_share

    # Second pass for momentum windows once latest close is known
    if latest is None:
        return stats, None

    recent_start = latest - timedelta(days=90)
    prior_start = latest - timedelta(days=180)

    with (data_dir / "deals.csv").open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row.get("status") != "closed":
                continue
            close_d = _parse_date(row.get("close_date"))
            if close_d is None:
                continue
            listing_id = row.get("listing_agent_id") or ""
            buyer_id = row.get("buyer_agent_id") or ""
            agent_ids = {aid for aid in (listing_id, buyer_id) if aid}
            try:
                sale_price = float(row.get("sale_price") or 0)
            except ValueError:
                sale_price = 0.0
            n = len(agent_ids) or 1
            volume_share = sale_price / n

            for aid in agent_ids:
                s = stats[aid]
                if recent_start < close_d <= latest:
                    s["recent_volume"] = float(s["recent_volume"]) + volume_share
                elif prior_start < close_d <= recent_start:
                    s["prior_volume"] = float(s["prior_volume"]) + volume_share

    return stats, latest


def _momentum(recent: float, prior: float) -> float:
    if prior <= 0:
        return 12.0 if recent > 0 else 0.0
    return round(((recent - prior) / prior) * 100, 1)


def _to_monthly(total: float | int) -> int:
    """Convert full-demo-window totals to month=1.0 baseline counts."""
    return max(1, int(round(float(total) / ALL_PERIOD_MONTHS)))


def build_rows(
    agents: list[dict[str, object]],
    stats: dict[str, dict[str, float | int]],
) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for agent in agents:
        aid = str(agent["id"])
        s = stats.get(aid, {})
        # Rank on raw dataset totals, then persist monthly baselines for PERIOD_SCALE.
        total_closings = int(s.get("closings", 0))
        total_volume = float(s.get("volumeDollars", 0))
        total_gci = float(s.get("gci", 0))
        closings = _to_monthly(total_closings)
        volume = _to_monthly(total_volume)
        gci = _to_monthly(total_gci)
        momentum = _momentum(
            float(s.get("recent_volume", 0)),
            float(s.get("prior_volume", 0)),
        )
        active = max(1, min(12, int(s.get("active_sides", 0)) or max(1, closings)))
        rows.append(
            {
                "id": aid,
                "name": agent["name"],
                "office": agent["office"],
                "team": agent["team"],
                "activeClients": active,
                "closings": closings,
                "volumeDollars": volume,
                "gci": gci,
                "_rank_closings": total_closings,
                "momentum90dPercent": momentum,
                "stall": None,
                "status": "healthy",
            }
        )

    ranked = sorted(rows, key=lambda r: (-int(r["_rank_closings"]), str(r["id"])))
    n = len(ranked)
    n_top = max(1, round(n * TOP_FRACTION))
    n_at_risk = max(1, round(n * AT_RISK_FRACTION))

    for i, row in enumerate(ranked):
        if i < n_top:
            row["status"] = "top"
        elif i >= n - n_at_risk or float(row["momentum90dPercent"]) <= -10:
            row["status"] = "at_risk"
        else:
            row["status"] = "healthy"

        # Sparse stall stages for weaker momentum / at-risk agents
        if row["status"] == "at_risk" or float(row["momentum90dPercent"]) < -5:
            row["stall"] = STALL_STAGES[i % len(STALL_STAGES)]
        else:
            row["stall"] = None
        del row["_rank_closings"]

    # Stable output order: agent_id ascending
    return sorted(ranked, key=lambda r: str(r["id"]))


def render_ts(rows: list[dict[str, object]]) -> str:
    lines = [
        "/* eslint-disable silverkey/max-lines-hard -- generated 500-agent roster from SkySlope demo CSVs */",
        "/**",
        " * Brokerage analytics agent roster — generated from SIL-285 / demo dataset",
        " * (Server/data/skyslope-demo agents + closed deals).",
        " * Values are monthly baselines (dataset totals / 24) for PERIOD_SCALE (month=1).",
        " * Regenerate: python Server/scripts/skyslope/generate_agent_analytics_fixtures.py",
        " */",
        "",
        "export const BROKERAGE_AGENTS_FIXTURE = [",
    ]
    for r in rows:
        stall = "null" if r["stall"] is None else json.dumps(r["stall"])
        lines.append("  {")
        lines.append(f'    id: {json.dumps(r["id"])},')
        lines.append(f'    name: {json.dumps(r["name"])},')
        lines.append(f'    office: {json.dumps(r["office"])},')
        lines.append(f'    team: {json.dumps(r["team"])},')
        lines.append(f'    activeClients: {r["activeClients"]},')
        lines.append(f'    closings: {r["closings"]},')
        lines.append(f'    volumeDollars: {r["volumeDollars"]},')
        lines.append(f'    gci: {r["gci"]},')
        lines.append(f'    momentum90dPercent: {r["momentum90dPercent"]},')
        lines.append(f"    stall: {stall},")
        lines.append(f'    status: {json.dumps(r["status"])},')
        lines.append("  },")
    lines.extend(
        [
            "] as const;",
            "",
            "export type BrokerageAgentFixture = (typeof BROKERAGE_AGENTS_FIXTURE)[number];",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    if not args.data_dir.is_dir():
        print(f"Missing demo data dir: {args.data_dir}", file=sys.stderr)  # noqa: T201
        return 1

    offices = _load_offices(args.data_dir)
    agents = _load_agents(args.data_dir, offices)
    stats, _latest = _aggregate_deals(args.data_dir)
    rows = build_rows(agents, stats)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(render_ts(rows), encoding="utf-8")

    top = sum(1 for r in rows if r["status"] == "top")
    healthy = sum(1 for r in rows if r["status"] == "healthy")
    at_risk = sum(1 for r in rows if r["status"] == "at_risk")
    print(  # noqa: T201
        f"Wrote {len(rows)} agents → {args.output} "
        f"(top={top} healthy={healthy} at_risk={at_risk})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
