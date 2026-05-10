"""Shared checklist taxonomy for transaction pipelines (task API + agent client enrichment).

Single source for category sets and ordering used when inferring pipeline stage from TransactionTask rows.
"""

from __future__ import annotations

TASK_CATEGORIES: frozenset[str] = frozenset(
    {"search", "offer", "escrow", "financing", "closing", "insurance"}
)

PIPELINE_ORDER: tuple[str, ...] = ("search", "offer", "escrow", "financing", "closing", "insurance")

PIPELINE_RANK: dict[str, int] = {c: i for i, c in enumerate(PIPELINE_ORDER)}
