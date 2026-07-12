#!/usr/bin/env python3
"""Generate Client Market inventory fixtures from SIL-285 demo CSVs.

Listing attributes (price, status, agent, property type, street) come from
`Server/data/skyslope-demo`. Coordinates are randomized around Atlanta metro
so Market map pins stay in the Georgia pilot viewport.

Usage (from Server/):
    python scripts/skyslope/generate_inventory_fixtures.py
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import random
import sys
from collections import defaultdict
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
    / "inventory"
    / "inventoryFixtures.ts"
)

ATL_LAT, ATL_LNG = 33.749, -84.388
LAT_JITTER = 0.22
LNG_JITTER = 0.28
DEFAULT_SEED = 285
DEFAULT_SAMPLE = 96

ATL_CITIES = [
    "Atlanta",
    "Buckhead",
    "Midtown",
    "Sandy Springs",
    "Decatur",
    "Marietta",
    "Brookhaven",
    "East Point",
    "Alpharetta",
    "Tucker",
]

TYPE_LABEL = {
    "single_family": "Single Family",
    "condo": "Condo",
    "townhouse": "Townhome",
    "multi_family": "Multi Family",
    "land": "Land",
}


def _map_status(raw: str) -> str | None:
    if raw == "closed":
        return "sold"
    if raw == "listed":
        return "active"
    if raw == "cancelled":
        return None
    return "pending"


def _load_rows(data_dir: Path) -> list[dict[str, object]]:
    agents: dict[str, str] = {}
    with (data_dir / "agents.csv").open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            agents[row["agent_id"]] = f"{row['first_name']} {row['last_name']}"

    deals_by_prop: dict[str, dict[str, str]] = {}
    with (data_dir / "deals.csv").open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            deals_by_prop[row["property_id"]] = row

    props: list[dict[str, object]] = []
    with (data_dir / "properties.csv").open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            deal = deals_by_prop.get(row["property_id"])
            if not deal:
                continue
            status = _map_status(deal["status"])
            if status is None:
                continue
            price_raw = deal.get("sale_price") or row["list_price"]
            try:
                price = (
                    int(round(float(price_raw)))
                    if price_raw not in (None, "")
                    else int(float(row["list_price"]))
                )
            except (TypeError, ValueError):
                price = int(float(row["list_price"]))
            props.append(
                {
                    "property_id": row["property_id"],
                    "street": row["address"],
                    "zip": row["zip"],
                    "status": status,
                    "price": price,
                    "property_type": row["type"],
                    "agent_name": agents.get(deal["listing_agent_id"], "Agent"),
                }
            )
    return props


def build_listings(
    props: list[dict[str, object]],
    *,
    sample_size: int,
    seed: int,
) -> tuple[list[dict[str, object]], dict[str, int]]:
    rng = random.Random(seed)
    by_status: dict[str, list[dict[str, object]]] = defaultdict(list)
    for p in props:
        by_status[str(p["status"])].append(p)
    for bucket in by_status.values():
        rng.shuffle(bucket)

    n_active = int(sample_size * 0.55)
    n_pending = int(sample_size * 0.20)
    n_sold = sample_size - n_active - n_pending
    sample = (
        by_status["active"][:n_active]
        + by_status["pending"][:n_pending]
        + by_status["sold"][:n_sold]
    )
    rng.shuffle(sample)

    listings: list[dict[str, object]] = []
    for i, p in enumerate(sample, start=1):
        angle = rng.uniform(0, 2 * math.pi)
        radius = math.sqrt(rng.random())
        lat = round(ATL_LAT + math.sin(angle) * LAT_JITTER * radius, 4)
        lng = round(ATL_LNG + math.cos(angle) * LNG_JITTER * radius, 4)
        city = ATL_CITIES[i % len(ATL_CITIES)]
        prop_type = str(p["property_type"])
        listings.append(
            {
                "id": f"inv-{i}",
                "external_id": str(p["property_id"]).lower().replace("prp-", "mls-"),
                "address": f"{p['street']}, {city}, GA {p['zip']}",
                "status": p["status"],
                "price": p["price"],
                "lat": lat,
                "lng": lng,
                "agent_name": p["agent_name"],
                "property_type": TYPE_LABEL.get(prop_type, prop_type.replace("_", " ").title()),
            }
        )

    active = sum(1 for L in listings if L["status"] == "active")
    sold = sum(1 for L in listings if L["status"] == "sold")
    prices = sorted(int(L["price"]) for L in listings)
    summary = {
        "active_count": active,
        "sold_count": sold,
        "total_count": len(listings),
        "median_price": prices[len(prices) // 2] if prices else 0,
    }
    return listings, summary


def render_ts(listings: list[dict[str, object]], summary: dict[str, int]) -> str:
    lines = [
        "/**",
        " * Brokerage Market inventory fixtures — sample from SIL-285 / demo dataset",
        " * (same source family as other brokerage analytics fixtures).",
        " * Listing attributes from Server/data/skyslope-demo; lat/lng randomized",
        f" * around Atlanta metro for the Market map (seed {DEFAULT_SEED}).",
        " * Regenerate: python Server/scripts/skyslope/generate_inventory_fixtures.py",
        " */",
        "",
        "import type {",
        "  InventoryListing,",
        "  InventorySummary,",
        '} from "packages/features/brokerage/types/inventory";',
        "",
        'export type { InventoryListing } from "packages/features/brokerage/types/inventory";',
        "",
        "export const INVENTORY_FIXTURE: {",
        "  listings: InventoryListing[];",
        "  summary: InventorySummary;",
        "} = {",
        "  listings: [",
    ]
    for L in listings:
        lines.append("    {")
        lines.append(f'      id: {json.dumps(L["id"])},')
        lines.append(f'      external_id: {json.dumps(L["external_id"])},')
        lines.append(f'      address: {json.dumps(L["address"])},')
        lines.append(f'      status: {json.dumps(L["status"])},')
        lines.append(f'      price: {L["price"]},')
        lines.append(f'      lat: {L["lat"]},')
        lines.append(f'      lng: {L["lng"]},')
        lines.append(f'      agent_name: {json.dumps(L["agent_name"])},')
        lines.append(f'      property_type: {json.dumps(L["property_type"])},')
        lines.append("    },")
    lines.extend(
        [
            "  ],",
            "  summary: {",
            f'    active_count: {summary["active_count"]},',
            f'    sold_count: {summary["sold_count"]},',
            f'    total_count: {summary["total_count"]},',
            f'    median_price: {summary["median_price"]},',
            "  },",
            "};",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--sample", type=int, default=DEFAULT_SAMPLE)
    args = parser.parse_args()

    if not args.data_dir.is_dir():
        print(f"Missing demo data dir: {args.data_dir}", file=sys.stderr)
        return 1

    props = _load_rows(args.data_dir)
    listings, summary = build_listings(props, sample_size=args.sample, seed=args.seed)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(render_ts(listings, summary), encoding="utf-8")
    print(
        f"Wrote {len(listings)} listings → {args.output} "
        f"(active={summary['active_count']} pending="
        f"{summary['total_count'] - summary['active_count'] - summary['sold_count']} "
        f"sold={summary['sold_count']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
