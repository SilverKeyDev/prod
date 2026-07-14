"""Filesystem paths for campaign demo seed + learning artifacts."""

from __future__ import annotations

from pathlib import Path

# Server/ root = parents[4] from this file:
# campaigns/paths.py → campaigns → brokerage → services → app → Server
_SERVER_ROOT = Path(__file__).resolve().parents[4]

CAMPAIGNS_DATA_DIR = _SERVER_ROOT / "data" / "skyslope-demo" / "campaigns"
CAMPAIGNS_JSON = CAMPAIGNS_DATA_DIR / "campaigns.json"
LEARNING_CACHE_DIR = CAMPAIGNS_DATA_DIR / "learning_cache"
LEARNING_RESULTS_DIR = CAMPAIGNS_DATA_DIR / "learning_results"
AGENTS_CSV = _SERVER_ROOT / "data" / "skyslope-demo" / "agents.csv"
DEALS_CSV = _SERVER_ROOT / "data" / "skyslope-demo" / "deals.csv"
