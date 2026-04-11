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
    noise_pollution_score: float | None = Field(
        default=None,
        description="1-10; higher = quieter / lower noise pollution (more favorable).",
    )
    fire_score: float | None = Field(
        default=None,
        description="1-10; higher = lower fire risk / more favorable.",
    )
    wind_score: float | None = Field(
        default=None,
        description="1-10; higher = more favorable wind exposure for the property.",
    )
    air_pollution_score: float | None = Field(
        default=None,
        description="1-10; higher = cleaner air / lower pollution (more favorable).",
    )
    humidity_score: float | None = Field(
        default=None,
        description="1-10; higher = more comfortable humidity for typical living.",
    )

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
            "noise_pollution_score": "Integer 1-10 only. Higher = quieter neighborhood / lower noise pollution (more favorable for residents). No text.",
            "fire_score": "Integer 1-10 only. Higher = lower wildfire/structure fire concern (more favorable). No text.",
            "wind_score": "Integer 1-10 only. Higher = more favorable wind conditions for the home (shelter, moderate exposure as appropriate). No text.",
            "air_pollution_score": "Integer 1-10 only. Higher = better air quality / less pollution (more favorable). No text.",
            "humidity_score": "Integer 1-10 only. Higher = more comfortable humidity for year-round living. No text.",
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
            "noise_pollution_score": "1-10 noise favorability.",
            "fire_score": "1-10 fire favorability.",
            "wind_score": "1-10 wind favorability.",
            "air_pollution_score": "1-10 air quality favorability.",
            "humidity_score": "1-10 humidity comfort.",
        }
