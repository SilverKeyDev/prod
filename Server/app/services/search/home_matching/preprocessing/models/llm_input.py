"""
LLM input models for user (and home) data.

These models define the data structures passed to the LLM scorer,
optimized for prompt building.
"""

import logging
from typing import Any

from .base import BaseInputModel
from .llm_home_input import LLMHomeInput

logger = logging.getLogger(__name__)

__all__ = ["LLMUserInput", "LLMHomeInput"]


class LLMUserInput(BaseInputModel):
    """User data structure for LLM scorer, optimized for prompt building."""

    _required_fields = ["user_id"]

    def __init__(
        self,
        user_id: str,
        preferences: dict[str, Any] | None = None,
        email: str | None = None,
        name: str | None = None,
        **kwargs,
    ):
        """
        Initialize LLM user input.

        Args:
            user_id: User identifier
            preferences: User preferences dictionary
            email: User email
            name: User name
        """
        self.user_id = user_id
        self.preferences = preferences or {}
        self.email = email
        self.name = name

        # Store any additional fields
        for key, value in kwargs.items():
            setattr(self, key, value)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary format expected by LLM prompt builder."""
        return {
            "user_id": self.user_id,
            "preferences": self.preferences,
            "email": self.email,
            "name": self.name,
        }

    def format_for_prompt(self) -> str:
        """
        Format user data for LLM prompt generation.

        Returns:
            Formatted string for prompt
        """
        sections = [f"USER PROFILE (ID: {self.user_id})"]
        prefs = self.preferences or {}

        # ESSENTIAL REQUIREMENTS - Always include these key factors
        essential_reqs = []

        # Budget information - Always show
        budget_min = prefs.get("budget_min", 0) or prefs.get("home_budget_min", 0)
        budget_max = prefs.get("budget_max", 0) or prefs.get("home_budget_max", 0)
        if budget_max > 0:
            if budget_min > 0 and budget_min != budget_max:
                essential_reqs.append(f"Budget: ${budget_min:,} - ${budget_max:,}")
            else:
                essential_reqs.append(f"Budget: Up to ${budget_max:,}")
        else:
            essential_reqs.append("Budget: Not specified")

        if (
            prefs.get("preferred_bedrooms_min") is not None
            or prefs.get("preferred_bedrooms_max") is not None
        ):
            lo = prefs.get("preferred_bedrooms_min", "")
            hi = prefs.get("preferred_bedrooms_max", "")
            essential_reqs.append(f"Bedrooms range: {lo}–{hi}")
        else:
            essential_reqs.append("Bedrooms needed: Not specified")

        if (
            prefs.get("preferred_bathrooms_min") is not None
            or prefs.get("preferred_bathrooms_max") is not None
        ):
            lo = prefs.get("preferred_bathrooms_min", "")
            hi = prefs.get("preferred_bathrooms_max", "")
            essential_reqs.append(f"Bathrooms range: {lo}–{hi}")
        else:
            essential_reqs.append("Bathrooms needed: Not specified")

        # Lot size preferences (numeric range preferred over legacy categorical)
        if (
            prefs.get("preferred_lot_size_min") is not None
            or prefs.get("preferred_lot_size_max") is not None
        ):
            lo = prefs.get("preferred_lot_size_min", "")
            hi = prefs.get("preferred_lot_size_max", "")
            essential_reqs.append(f"Lot size range: {lo}–{hi} acres")
        elif prefs.get("preferred_lot_size"):
            essential_reqs.append(f"Lot size preference: {prefs['preferred_lot_size']}")

        if (
            prefs.get("preferred_home_age_min") is not None
            or prefs.get("preferred_home_age_max") is not None
        ):
            lo = prefs.get("preferred_home_age_min", "")
            hi = prefs.get("preferred_home_age_max", "")
            essential_reqs.append(f"Home age range: {lo}–{hi} years")
        elif prefs.get("preferred_home_age"):
            essential_reqs.append(f"Home age preference: {prefs['preferred_home_age']}")

        # Square footage
        if prefs.get("min_sqft"):
            essential_reqs.append(f"Minimum square feet: {prefs['min_sqft']:,}")

        sections.extend(essential_reqs)

        # Home type preferences
        if prefs.get("preferred_home_types"):
            types = (
                ", ".join(prefs["preferred_home_types"])
                if isinstance(prefs["preferred_home_types"], list)
                else str(prefs["preferred_home_types"])
            )
            sections.append(f"Preferred home types: {types}")

        # Location preferences
        location_prefs = []
        if prefs.get("preferred_neighborhoods"):
            neighborhoods = (
                ", ".join(prefs["preferred_neighborhoods"])
                if isinstance(prefs["preferred_neighborhoods"], list)
                else str(prefs["preferred_neighborhoods"])
            )
            location_prefs.append(f"Preferred neighborhoods: {neighborhoods}")
        if prefs.get("max_commute_minutes"):
            location_prefs.append(f"Max commute: {prefs['max_commute_minutes']} minutes")
        if prefs.get("location_preference"):
            location_prefs.append(f"Location style: {prefs['location_preference']}")

        if location_prefs:
            sections.append("Location preferences: " + "; ".join(location_prefs))

        # Lifestyle and personal info
        lifestyle_info = []
        if prefs.get("lifestyle"):
            lifestyle_info.append(f"Lifestyle: {prefs['lifestyle']}")
        if prefs.get("family_status"):
            lifestyle_info.append(f"Family: {prefs['family_status']}")
        if prefs.get("work_style"):
            lifestyle_info.append(f"Work style: {prefs['work_style']}")
        if prefs.get("hobbies"):
            lifestyle_info.append(f"Hobbies: {prefs['hobbies']}")

        if lifestyle_info:
            sections.append("Personal info: " + "; ".join(lifestyle_info))

        # Must-have amenities
        if prefs.get("must_have_amenities"):
            amenities = (
                ", ".join(prefs["must_have_amenities"])
                if isinstance(prefs["must_have_amenities"], list)
                else str(prefs["must_have_amenities"])
            )
            sections.append(f"Must-have amenities: {amenities}")

        # Nice-to-have amenities
        if prefs.get("nice_to_have_amenities"):
            amenities = (
                ", ".join(prefs["nice_to_have_amenities"])
                if isinstance(prefs["nice_to_have_amenities"], list)
                else str(prefs["nice_to_have_amenities"])
            )
            sections.append(f"Nice-to-have amenities: {amenities}")

        # Special requirements
        requirements = []
        if prefs.get("pet_friendly"):
            requirements.append("Pet-friendly required")
        if prefs.get("parking_required"):
            requirements.append("Parking required")
        if prefs.get("outdoor_space_required"):
            requirements.append("Outdoor space required")

        if requirements:
            sections.append(f"Special requirements: {', '.join(requirements)}")

        # Additional notes
        if prefs.get("notes"):
            sections.append(f"Additional notes: {prefs['notes']}")

        return "\n".join(sections)

    def __repr__(self) -> str:
        """String representation."""
        return f"<LLMUserInput user_id={self.user_id}>"
