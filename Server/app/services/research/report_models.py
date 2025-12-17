"""
Report models - refactored into modules for better organization.

This file maintains backward compatibility by re-exporting all models
from the new modular structure.
"""

# Re-export all models from the new modular structure
from .models import (
    CommuteSection,
    Neighborhood,
    Affordability,
    FamilyFriendlySection,
    Entertainment,
    Investment,
    ClimateEnvironmentalSafety,
    ConvenienceWalkability,
    Home,
    FullReport,
)

__all__ = [
    'CommuteSection',
    'Neighborhood',
    'Affordability',
    'FamilyFriendlySection',
    'Entertainment',
    'Investment',
    'ClimateEnvironmentalSafety',
    'ConvenienceWalkability',
    'Home',
    'FullReport',
]
