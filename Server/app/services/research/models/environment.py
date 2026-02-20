from typing import Any

from pydantic import BaseModel, Field


class ClimateEnvironmentalSafety(BaseModel):
    """Climate preference, flood/fire/hurricane risk"""

    climate_rating: str = Field(...)
    climate: str = Field(...)
    flood_risk: str = Field(...)
    fire_risk: str = Field(...)
    hurricane_risk: str = Field(...)
    environmental_safety: str = Field(...)

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }

    @classmethod
    def get_description(cls, user_preferences: dict[str, Any] | None = None) -> dict[str, str]:
        """Generate personalized field descriptions"""
        return {
            "climate_rating": "Overall climate and environmental safety score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's preferences.",
            "climate": "Climate characteristics including temperature, precipitation, and weather patterns. Extremely brief.",
            "flood_risk": "Flood risk assessment including flood zones, historical flooding, and mitigation measures. Extremely brief.",
            "fire_risk": "Fire risk assessment including wildfire danger, defensible space, and fire department response. Extremely brief.",
            "hurricane_risk": "Hurricane/tornado risk assessment and severe weather patterns. Extremely brief.",
            "environmental_safety": "Overall environmental safety including air quality, water quality, and natural disaster risk. Extremely brief.",
        }

    @classmethod
    def get_comparison_description(
        cls, user_preferences: dict[str, Any] | None = None
    ) -> dict[str, str]:
        """Generate simplified comparison descriptions - rating only, max 6 words per field"""
        return {
            "climate_rating": "Decimal rating (e.g., 8.5).",
            "climate": "Climate characteristics brief summary.",
            "environmental_safety": "Environmental safety risk summary.",
        }
