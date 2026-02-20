from typing import Any

from pydantic import BaseModel, Field


class Neighborhood(BaseModel):
    """Safety, upkeep, community feel"""

    neighborhood_rating: str = Field(...)
    places_to_watch_out_for: str = Field(...)
    community_feel: str = Field(...)
    parking: str = Field(...)
    pet_friendly: str = Field(...)
    cell_service_quality: str = Field(...)
    other_notable_tips: str = Field(...)

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }

    @classmethod
    def get_description(cls, user_preferences: dict[str, Any] | None = None) -> dict[str, str]:
        """Generate personalized field descriptions"""

        return {
            "neighborhood_rating": "Overall neighborhood quality score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's priorities.",
            "places_to_watch_out_for": "Specific areas, intersections, or locations with higher risk or safety concerns. Extremely brief.",
            "community_feel": "Community atmosphere, neighborliness, social character, and sense of belonging. Extremely brief.",
            "parking": "Street parking rules, permit requirements, garage availability. Extremely brief. Use Google Street View to assess parking density and local parking signs.",
            "pet_friendly": "Dog parks, pet stores, veterinarians, pet policies. Extremely brief. Search '[neighborhood] dog park' or use Google Maps to find pet amenities.",
            "cell_service_quality": "Coverage quality for major carriers. Extremely brief. Check carrier coverage maps or local forums for dead zone reports.",
            "other_notable_tips": "Local insider knowledge, best times to visit places, hidden gems, traffic patterns. Extremely brief. Use local forums, Reddit, or Nextdoor for community insights.",
        }

    @classmethod
    def get_comparison_description(
        cls, user_preferences: dict[str, Any] | None = None
    ) -> dict[str, str]:
        """Generate simplified comparison descriptions - rating only, max 6 words per field"""
        return {"neighborhood_rating": "Decimal rating (e.g., 8.5)."}
