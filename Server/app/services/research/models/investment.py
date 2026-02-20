from typing import Any

from pydantic import BaseModel, Field


class Investment(BaseModel):
    """Future growth, job market stability, resale potential"""

    investment_rating: str = Field(...)
    future_growth: str = Field(...)
    job_market: str = Field(...)
    resale_potential: str = Field(...)
    market_outlook: str = Field(...)

    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }

    @classmethod
    def get_description(cls, user_preferences: dict[str, Any] | None = None) -> dict[str, str]:
        """Generate personalized field descriptions"""
        return {
            "investment_rating": "Overall investment score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's investment goals.",
            "future_growth": "Future growth prospects including planned developments, infrastructure, and population trends. Extremely brief.",
            "job_market": "Job market stability, employment opportunities, and economic outlook. Extremely brief.",
            "resale_potential": "Resale potential based on market trends, demand, and property appreciation. Extremely brief.",
            "market_outlook": "Overall market outlook and investment attractiveness for the area. Extremely brief.",
        }

    @classmethod
    def get_comparison_description(
        cls, user_preferences: dict[str, Any] | None = None
    ) -> dict[str, str]:
        """Generate simplified comparison descriptions - rating only, max 6 words per field"""
        return {
            "investment_rating": "Decimal rating (e.g., 8.5).",
            "resale_potential": "Resale potential market trends summary.",
            "market_outlook": "Investment attractiveness brief summary.",
        }
