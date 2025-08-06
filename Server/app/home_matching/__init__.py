"""
Home Matching System

A comprehensive property matching system that combines:
- Embedding-based similarity scoring
- Tabular model predictions (XGBoost/LightGBM)
- LLM-based scoring and justification

The system takes user preferences and home data to produce ranked matches
with explainable scoring across multiple methodologies.
"""

__version__ = "1.0.0"
__author__ = "SilverKey Team"

# Main entry point for the home matching system
from .app.match import (
    find_best_matches,
    score_single_match,
    compare_homes_for_user,
    batch_match_users,
    create_sample_user,
    create_sample_home,
    get_system_info
)

__all__ = [
    "find_best_matches",
    "score_single_match",
    "compare_homes_for_user",
    "batch_match_users",
    "create_sample_user",
    "create_sample_home",
    "get_system_info"
]
