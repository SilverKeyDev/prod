"""Configuration and field-to-metric mapping for SIL-285 SkySlope demo dataset."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date

# Reproducible default — matches Linear ticket id for easy recall.
DEFAULT_SEED = 285

NUM_OFFICES = 25
NUM_AGENTS = 500
NUM_DEALS = 12_000

DATE_RANGE_START = date(2024, 1, 1)
DATE_RANGE_END = date(2026, 6, 30)

# Target ~12% cancellation rate (ticket: 10–15%).
CANCELLATION_RATE = 0.12

# Southeast US metros — aligns with brokerage analytics demo geography (Atlanta cluster).
METRO_REGIONS: list[dict[str, object]] = [
    {
        "region": "Atlanta Metro",
        "cities": [
            ("Atlanta", "GA", 33.749, -84.388),
            ("Brookhaven", "GA", 33.830, -84.320),
            ("Decatur", "GA", 33.770, -84.290),
            ("East Point", "GA", 33.680, -84.430),
            ("Tucker", "GA", 33.900, -84.210),
            ("Sandy Springs", "GA", 33.930, -84.370),
            ("Marietta", "GA", 33.952, -84.550),
        ],
    },
    {
        "region": "Charlotte Metro",
        "cities": [
            ("Charlotte", "NC", 35.227, -80.843),
            ("Huntersville", "NC", 35.411, -80.843),
            ("Matthews", "NC", 35.117, -80.724),
        ],
    },
    {
        "region": "Nashville Metro",
        "cities": [
            ("Nashville", "TN", 36.163, -86.781),
            ("Franklin", "TN", 35.925, -86.868),
            ("Brentwood", "TN", 36.033, -86.782),
        ],
    },
]

OFFICE_NAME_SUFFIXES = [
    "Downtown",
    "Midtown",
    "Buckhead",
    "North",
    "South",
    "West",
    "East",
    "Central",
]

SENIORITY_LEVELS = ("junior", "mid", "senior", "top_producer")

# Pipeline statuses for funnel analytics (non-terminal).
PIPELINE_STATUSES = (
    "listed",
    "under_contract",
    "inspection",
    "financing",
    "appraisal",
    "title",
    "pending_close",
)

TERMINAL_CLOSED = "closed"
TERMINAL_CANCELLED = "cancelled"

LEAD_SOURCES = (
    "referral",
    "sphere",
    "open_house",
    "zillow",
    "realtor_com",
    "social_media",
    "sign_call",
    "past_client",
    "brokerage_lead",
)

PROPERTY_TYPES = ("single_family", "condo", "townhouse", "multi_family", "land")

LENDERS = (
    "Chase",
    "Wells Fargo",
    "Rocket Mortgage",
    "Bank of America",
    "US Bank",
    "Cash / Unknown",
)

TITLE_VENDORS = (
    "In-House Title",
    "First American Title",
    "Stewart Title",
    "Fidelity National",
)

ESCROW_COMPANIES = (
    "In-House Escrow",
    "Chicago Title Escrow",
    "Old Republic Escrow",
)

CANCELLATION_STAGES = (
    "Inspection",
    "Financing",
    "Appraisal",
    "Title",
    "Contract",
)

BROKER_REVIEW_STATUSES = ("pending", "approved", "flagged")

# Monthly list-date weights — spring peak (Apr–Jun) for seasonality charts.
MONTHLY_LIST_WEIGHTS: dict[int, float] = {
    1: 0.75,
    2: 0.85,
    3: 1.05,
    4: 1.25,
    5: 1.35,
    6: 1.20,
    7: 1.00,
    8: 0.95,
    9: 0.90,
    10: 0.85,
    11: 0.80,
    12: 0.70,
}


@dataclass(frozen=True)
class MetricFieldMapping:
    """Documents which generated fields feed each analytics metric (SIL-285 step 2)."""

    metric: str
    fields: tuple[str, ...]
    formula: str


METRIC_FIELD_MAPPINGS: tuple[MetricFieldMapping, ...] = (
    MetricFieldMapping(
        "transaction_volume",
        ("deals.close_date", "deals.status"),
        "COUNT deals WHERE status='closed' GROUP BY month(close_date)",
    ),
    MetricFieldMapping(
        "gci_trend",
        ("deals.gci", "deals.close_date"),
        "SUM(gci) GROUP BY month(close_date)",
    ),
    MetricFieldMapping(
        "cancellation_rate",
        ("deals.status",),
        "COUNT(status='cancelled') / COUNT(*)",
    ),
    MetricFieldMapping(
        "days_to_close",
        ("deals.close_date", "deals.contract_date"),
        "close_date - contract_date (closed deals only)",
    ),
    MetricFieldMapping(
        "agent_leaderboard",
        ("deals.listing_agent_id", "deals.buyer_agent_id", "deals.gci"),
        "SUM(gci) GROUP BY agent_id",
    ),
    MetricFieldMapping(
        "office_rollup",
        ("deals.office_id", "offices.name"),
        "SUM(gci), COUNT(*) GROUP BY office_id",
    ),
    MetricFieldMapping(
        "pipeline_funnel",
        ("deals.status",),
        "COUNT(*) GROUP BY status",
    ),
    MetricFieldMapping(
        "compliance_rate",
        ("compliance.completed_docs", "compliance.required_docs"),
        "completed_docs / required_docs",
    ),
    MetricFieldMapping(
        "esign_turnaround",
        ("compliance.esign_sent", "compliance.esign_completed_date"),
        "esign_completed_date - esign_sent",
    ),
    MetricFieldMapping(
        "price_band_distribution",
        ("deals.sale_price",),
        "HISTOGRAM(sale_price) on closed deals",
    ),
    MetricFieldMapping(
        "lead_source_performance",
        ("deals.lead_source", "deals.gci"),
        "SUM(gci), COUNT(*) GROUP BY lead_source",
    ),
    MetricFieldMapping(
        "seasonality",
        ("deals.list_date",),
        "COUNT(*) GROUP BY month(list_date)",
    ),
)
