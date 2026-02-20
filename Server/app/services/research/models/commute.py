from typing import Any

from pydantic import BaseModel, Field


class CommuteSection(BaseModel):
    """Driving time, public transit, road quality, infrastructure"""

    commute_rating: str = Field(...)
    commute_times: str = Field(...)
    public_transport: str = Field(...)
    traffic: str = Field(...)
    road_quality: str = Field(...)

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }

    @classmethod
    def get_description(cls, user_preferences: dict[str, Any] | None = None) -> dict[str, str]:
        """Generate personalized field descriptions"""
        (user_preferences.get("important_locations", []) if user_preferences else [])

        return {
            "commute_rating": "Overall commute convenience score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's commute needs.",
            "commute_times": "Commute times to key destinations including work, school, and important locations. Extremely brief.",
            "public_transport": "Public transportation options including bus routes, rail, bike share, and frequency. Extremely brief.",
            "traffic": "Traffic patterns, congestion levels, and peak hours. Extremely brief. Consider user's commute tolerance.",
            "road_quality": "Road quality, infrastructure, bike lanes, and overall transportation infrastructure. Extremely brief.",
        }

    @classmethod
    def get_comparison_description(
        cls, user_preferences: dict[str, Any] | None = None
    ) -> dict[str, str]:
        """Generate simplified comparison descriptions - rating only, max 6 words per field"""
        return {
            "commute_times": "Key destination commute times summary.",
            "public_transport": "Public transit options brief summary.",
        }
