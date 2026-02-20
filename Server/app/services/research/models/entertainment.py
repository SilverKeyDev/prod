from typing import Any

from pydantic import BaseModel, Field


class Entertainment(BaseModel):
    """Restaurants, bars, gyms, activities, overall vibe"""

    entertainment_rating: str = Field(...)
    restaurants: str = Field(...)
    bars_and_nightlife: str = Field(...)
    gyms_and_fitness: str = Field(...)
    activities: str = Field(...)
    overall_vibe: str = Field(...)

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }

    @classmethod
    def get_description(cls, user_preferences: dict[str, Any] | None = None) -> dict[str, str]:
        """Generate personalized field descriptions"""
        (user_preferences.get("occupation", "balanced") if user_preferences else "balanced")

        return {
            "entertainment_rating": "Overall entertainment score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's interests.",
            "restaurants": "Restaurant scene including types, quality, and diversity of dining options. Extremely brief.",
            "bars_and_nightlife": "Bars, nightlife venues, and social spaces for evening entertainment. Extremely brief.",
            "gyms_and_fitness": "Gyms, fitness centers, yoga studios, and active lifestyle options. Extremely brief.",
            "activities": "Activities, events, cultural offerings, and things to do in the area. Extremely brief.",
            "overall_vibe": "Overall entertainment and social atmosphere of the neighborhood. Extremely brief.",
        }

    @classmethod
    def get_comparison_description(
        cls, user_preferences: dict[str, Any] | None = None
    ) -> dict[str, str]:
        """Generate simplified comparison descriptions - rating only, max 6 words per field"""
        return {
            "entertainment_rating": "Decimal rating (e.g., 8.5).",
            "restaurants": "Restaurant scene quality summary.",
            "overall_vibe": "Entertainment atmosphere brief summary.",
        }
