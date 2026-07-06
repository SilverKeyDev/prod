#!/usr/bin/env python3
"""
Generate a synthetic US-flavored SkySlope brokerage analytics demo dataset (SIL-285).

Produces six related tables (offices, agents, clients, properties, deals, compliance)
as CSV files and a multi-tab Excel workbook for BI import or demo environment loading.

Usage (from Server/ with venv active):
    python scripts/skyslope/generate_demo_dataset.py
    python scripts/skyslope/generate_demo_dataset.py --seed 285 --deals 12000 --output data/skyslope-demo
"""

from __future__ import annotations

import argparse
import random
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
from faker import Faker

# Allow running as `python scripts/skyslope/generate_demo_dataset.py` from Server/
_SERVER_ROOT = Path(__file__).resolve().parents[2]
if str(_SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(_SERVER_ROOT))

from scripts.skyslope.demo_config import (  # noqa: E402
    BROKER_REVIEW_STATUSES,
    CANCELLATION_RATE,
    CANCELLATION_STAGES,
    DATE_RANGE_END,
    DATE_RANGE_START,
    DEFAULT_SEED,
    ESCROW_COMPANIES,
    LEAD_SOURCES,
    LENDERS,
    METRO_REGIONS,
    MONTHLY_LIST_WEIGHTS,
    NUM_AGENTS,
    NUM_DEALS,
    NUM_OFFICES,
    OFFICE_NAME_SUFFIXES,
    PIPELINE_STATUSES,
    PROPERTY_TYPES,
    SENIORITY_LEVELS,
    TERMINAL_CANCELLED,
    TERMINAL_CLOSED,
    TITLE_VENDORS,
)
from scripts.skyslope.validate_demo_dataset import (  # noqa: E402
    ValidationResult,
    validate_demo_dataset,
)

DEFAULT_OUTPUT_DIR = _SERVER_ROOT / "data" / "skyslope-demo"


def _weighted_random_date(rng: random.Random, start: date, end: date) -> date:
    """Pick a list date with spring seasonality bias."""
    days_span = (end - start).days
    for _ in range(50):
        offset = rng.randint(0, days_span)
        candidate = start + timedelta(days=offset)
        weight = MONTHLY_LIST_WEIGHTS.get(candidate.month, 1.0)
        if rng.random() < weight / 1.35:
            return candidate
    return start + timedelta(days=rng.randint(0, days_span))


def _add_days(d: date, days: int) -> date:
    return d + timedelta(days=days)


def _generate_offices(rng: random.Random, fake: Faker, n: int) -> pd.DataFrame:
    rows = []
    region_cycle = [r["region"] for r in METRO_REGIONS]
    for i in range(n):
        region = region_cycle[i % len(region_cycle)]
        suffix = OFFICE_NAME_SUFFIXES[i % len(OFFICE_NAME_SUFFIXES)]
        open_year = rng.randint(2005, 2022)
        open_month = rng.randint(1, 12)
        open_day = rng.randint(1, 28)
        rows.append(
            {
                "office_id": f"OFF-{i + 1:03d}",
                "name": f"{suffix} Office",
                "region": region,
                "open_date": date(open_year, open_month, open_day),
            }
        )
    return pd.DataFrame(rows)


def _generate_agents(
    rng: random.Random, fake: Faker, offices: pd.DataFrame, n: int
) -> pd.DataFrame:
    rows = []
    office_ids = offices["office_id"].tolist()
    teams_per_office: dict[str, list[str]] = {}
    for oid in office_ids:
        team_count = rng.randint(3, 6)
        teams_per_office[oid] = [f"Team {chr(65 + t)}" for t in range(team_count)]

    for i in range(n):
        office_id = rng.choice(office_ids)
        team = rng.choice(teams_per_office[office_id])
        seniority = rng.choices(
            SENIORITY_LEVELS,
            weights=[0.35, 0.35, 0.20, 0.10],
            k=1,
        )[0]
        hire_year = rng.randint(2010, 2024)
        split_by_seniority = {
            "junior": rng.randint(60, 70),
            "mid": rng.randint(68, 75),
            "senior": rng.randint(72, 80),
            "top_producer": rng.randint(78, 88),
        }
        rows.append(
            {
                "agent_id": f"AGT-{i + 1:04d}",
                "office_id": office_id,
                "team": team,
                "first_name": fake.first_name(),
                "last_name": fake.last_name(),
                "hire_date": date(hire_year, rng.randint(1, 12), rng.randint(1, 28)),
                "seniority": seniority,
                "current_split_percent": split_by_seniority[seniority],
            }
        )
    return pd.DataFrame(rows)


def _generate_clients(rng: random.Random, n: int) -> pd.DataFrame:
    # ~1.5 clients per deal on average (buyer + seller sides)
    rows = []
    for i in range(n):
        rows.append(
            {
                "client_id": f"CLT-{i + 1:05d}",
                "type": rng.choice(["buyer", "seller"]),
            }
        )
    return pd.DataFrame(rows)


def _generate_properties(rng: random.Random, fake: Faker, n: int) -> pd.DataFrame:
    rows = []
    all_cities: list[tuple[str, str, float, float]] = []
    for metro in METRO_REGIONS:
        for city_tuple in metro["cities"]:  # type: ignore[union-attr]
            all_cities.append(city_tuple)  # type: ignore[arg-type]

    for i in range(n):
        city, state, lat, lng = rng.choice(all_cities)
        prop_type = rng.choices(
            PROPERTY_TYPES,
            weights=[0.62, 0.18, 0.12, 0.05, 0.03],
            k=1,
        )[0]
        beds = rng.randint(1, 6) if prop_type != "land" else None
        if prop_type == "land":
            list_price = rng.randint(80_000, 400_000)
        elif prop_type == "multi_family":
            list_price = rng.randint(350_000, 1_200_000)
        else:
            list_price = int(np.random.lognormal(mean=12.6, sigma=0.35))
            list_price = max(150_000, min(list_price, 2_500_000))

        lat_jitter = lat + rng.uniform(-0.08, 0.08)
        lng_jitter = lng + rng.uniform(-0.08, 0.08)

        rows.append(
            {
                "property_id": f"PRP-{i + 1:05d}",
                "address": fake.street_address(),
                "city": city,
                "state": state,
                "zip": fake.zipcode_in_state(state_abbr=state),
                "latitude": round(lat_jitter, 4),
                "longitude": round(lng_jitter, 4),
                "type": prop_type,
                "beds": beds,
                "list_price": list_price,
            }
        )
    return pd.DataFrame(rows)


def _pick_status_weights(rng: random.Random) -> str:
    roll = rng.random()
    if roll < CANCELLATION_RATE:
        return TERMINAL_CANCELLED
    if roll < CANCELLATION_RATE + 0.68:
        return TERMINAL_CLOSED
    return rng.choice(PIPELINE_STATUSES)


def _ancillary_vendors(rng: random.Random, office_id: str) -> dict[str, object]:
    """Bias standout offices toward in-house ancillary attach for demo story."""
    office_num = int(office_id.split("-")[1])
    in_house_bias = 0.55 if office_num <= 5 else 0.35

    title = "In-House Title" if rng.random() < in_house_bias else rng.choice(TITLE_VENDORS[1:])
    escrow = "In-House Escrow" if rng.random() < in_house_bias else rng.choice(ESCROW_COMPANIES[1:])
    lender = rng.choices(LENDERS, weights=[22, 18, 14, 12, 10, 24], k=1)[0]
    has_warranty = rng.random() < (0.48 if in_house_bias > 0.5 else 0.32)

    return {
        "title_vendor": title,
        "lender": lender,
        "escrow_company": escrow,
        "has_home_warranty": has_warranty,
    }


def _generate_deals(
    rng: random.Random,
    n: int,
    offices: pd.DataFrame,
    agents: pd.DataFrame,
    properties: pd.DataFrame,
) -> pd.DataFrame:
    agent_ids = agents["agent_id"].tolist()
    agent_office = dict(zip(agents["agent_id"], agents["office_id"], strict=True))
    agent_split = dict(zip(agents["agent_id"], agents["current_split_percent"], strict=True))

    # Standout agents (top 5%) get higher deal volume for leaderboard story
    standout_count = max(1, int(len(agent_ids) * 0.05))
    standout_agents = set(rng.sample(agent_ids, standout_count))
    agent_weights = [3.0 if a in standout_agents else 1.0 for a in agent_ids]

    property_ids = properties["property_id"].tolist()
    prop_list_price = dict(zip(properties["property_id"], properties["list_price"], strict=True))

    rows = []
    for i in range(n):
        property_id = property_ids[i % len(property_ids)]
        listing_agent = rng.choices(agent_ids, weights=agent_weights, k=1)[0]
        buyer_agent = rng.choices(agent_ids, weights=agent_weights, k=1)[0]
        office_id = agent_office[listing_agent]

        side = rng.choice(["listing", "buyer", "dual"])
        status = _pick_status_weights(rng)

        list_date = _weighted_random_date(rng, DATE_RANGE_START, DATE_RANGE_END)
        contract_date = None
        close_date = None
        cancellation_date = None
        stage_at_cancellation = None
        sale_price = None

        # Keep terminal dates inside the dataset window with room for cycle time.
        max_list = DATE_RANGE_END - timedelta(days=130)
        if list_date > max_list:
            list_date = max_list

        if status != "listed":
            contract_lag = rng.randint(5, 90)
            contract_date = _add_days(list_date, contract_lag)
            if contract_date > DATE_RANGE_END:
                contract_date = DATE_RANGE_END

        if status == TERMINAL_CLOSED:
            cycle_days = int(rng.gauss(38, 12))
            cycle_days = max(14, min(cycle_days, 120))
            close_date = _add_days(contract_date, cycle_days)  # type: ignore[arg-type]
            if close_date > DATE_RANGE_END:
                close_date = DATE_RANGE_END
                contract_date = _add_days(close_date, -cycle_days)
                if contract_date < list_date:
                    list_date = _add_days(contract_date, -rng.randint(5, 21))
            list_price = prop_list_price[property_id]
            discount = rng.uniform(0.92, 1.04)
            sale_price = round(list_price * discount, 2)
        elif status == TERMINAL_CANCELLED:
            cancel_lag = rng.randint(7, 75)
            cancellation_date = _add_days(contract_date, cancel_lag)  # type: ignore[arg-type]
            if cancellation_date > DATE_RANGE_END:
                cancellation_date = DATE_RANGE_END
            stage_at_cancellation = rng.choice(CANCELLATION_STAGES)
            sale_price = None
        elif status in PIPELINE_STATUSES and contract_date:
            list_price = prop_list_price[property_id]
            sale_price = round(list_price * rng.uniform(0.95, 1.02), 2)

        commission_rate = round(rng.uniform(0.045, 0.065), 4)
        primary_agent = listing_agent if side != "buyer" else buyer_agent
        split = agent_split[primary_agent] / 100.0
        gci = None
        if sale_price is not None and status == TERMINAL_CLOSED:
            gci = round(float(sale_price) * commission_rate * split, 2)

        ancillary = _ancillary_vendors(rng, office_id)

        rows.append(
            {
                "deal_id": f"DEAL-{i + 1:05d}",
                "property_id": property_id,
                "listing_agent_id": listing_agent,
                "buyer_agent_id": buyer_agent,
                "office_id": office_id,
                "side": side,
                "status": status,
                "list_date": list_date,
                "contract_date": contract_date,
                "close_date": close_date,
                "cancellation_date": cancellation_date,
                "stage_at_cancellation": stage_at_cancellation,
                "sale_price": sale_price,
                "commission_rate": commission_rate,
                "agent_split": split,
                "gci": gci,
                "lead_source": rng.choice(LEAD_SOURCES),
                **ancillary,
            }
        )
    return pd.DataFrame(rows)


def _generate_compliance(rng: random.Random, deals: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for _, deal in deals.iterrows():
        required = rng.randint(8, 20)
        status = deal["status"]

        if status == TERMINAL_CLOSED:
            completed = required
            review = "approved"
        elif status == TERMINAL_CANCELLED:
            completed = rng.randint(2, max(2, required - 3))
            review = rng.choice(["pending", "flagged"])
        else:
            completed = rng.randint(0, required)
            review = rng.choice(BROKER_REVIEW_STATUSES)

        esign_sent = deal.get("contract_date")
        esign_completed = None
        if esign_sent is not None and not pd.isna(esign_sent):
            esign_sent = _parse_esign_date(esign_sent)
            if completed >= required * 0.8:
                turnaround = rng.randint(1, 5)
                esign_completed = _add_days(esign_sent, turnaround)
            elif completed > 0:
                turnaround = rng.randint(2, 14)
                esign_completed = _add_days(esign_sent, turnaround)

        rows.append(
            {
                "deal_id": deal["deal_id"],
                "required_docs": required,
                "completed_docs": completed,
                "broker_review_status": review,
                "esign_sent": esign_sent,
                "esign_completed_date": esign_completed,
            }
        )
    return pd.DataFrame(rows)


def _parse_esign_date(value: object) -> date:
    if isinstance(value, date):
        return value
    return pd.to_datetime(value).date()


def generate_demo_dataset(
    seed: int = DEFAULT_SEED,
    num_offices: int = NUM_OFFICES,
    num_agents: int = NUM_AGENTS,
    num_deals: int = NUM_DEALS,
) -> dict[str, pd.DataFrame]:
    """Build all six tables in memory."""
    rng = random.Random(seed)
    np.random.seed(seed)
    fake = Faker("en_US")
    fake.seed_instance(seed)

    offices = _generate_offices(rng, fake, num_offices)
    agents = _generate_agents(rng, fake, offices, num_agents)
    clients = _generate_clients(rng, int(num_deals * 1.4))
    properties = _generate_properties(rng, fake, num_deals)
    deals = _generate_deals(rng, num_deals, offices, agents, properties)
    compliance = _generate_compliance(rng, deals)

    return {
        "offices": offices,
        "agents": agents,
        "clients": clients,
        "properties": properties,
        "deals": deals,
        "compliance": compliance,
    }


def write_outputs(tables: dict[str, pd.DataFrame], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    for name, frame in tables.items():
        csv_path = output_dir / f"{name}.csv"
        frame.to_csv(csv_path, index=False)

    xlsx_path = output_dir / "skyslope_demo_dataset.xlsx"
    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as writer:
        for name, frame in tables.items():
            frame.to_excel(writer, sheet_name=name, index=False)

    readme = output_dir / "README.txt"
    readme.write_text(
        "SkySlope brokerage analytics demo dataset (SIL-285).\n"
        f"Generated: {datetime.now().isoformat(timespec='seconds')}\n"
        "Regenerate: python scripts/skyslope/generate_demo_dataset.py\n"
        "Load into DB:  python scripts/skyslope/load_demo_to_skyslope.py --purge-demo\n",
        encoding="utf-8",
    )


def _print_validation(result: ValidationResult) -> None:
    print("=== QA validation ===")
    print(f"Passed: {result.passed}")
    for key, value in result.stats.items():
        print(f"  {key}: {value}")
    for warning in result.warnings:
        print(f"  WARNING: {warning}")
    for error in result.errors:
        print(f"  ERROR: {error}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate SkySlope demo analytics dataset (SIL-285)"
    )
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--offices", type=int, default=NUM_OFFICES)
    parser.add_argument("--agents", type=int, default=NUM_AGENTS)
    parser.add_argument("--deals", type=int, default=NUM_DEALS)
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Output directory for CSV + Excel files",
    )
    parser.add_argument(
        "--skip-validation",
        action="store_true",
        help="Skip QA checks (not recommended)",
    )
    args = parser.parse_args()

    print(f"Generating dataset (seed={args.seed}, deals={args.deals})...")
    tables = generate_demo_dataset(
        seed=args.seed,
        num_offices=args.offices,
        num_agents=args.agents,
        num_deals=args.deals,
    )

    if not args.skip_validation:
        result = validate_demo_dataset(**tables)
        _print_validation(result)
        if not result.passed:
            print("Validation failed — fix generator before writing output.")
            return 1

    write_outputs(tables, args.output.resolve())
    print(f"Wrote CSV + Excel to {args.output.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
