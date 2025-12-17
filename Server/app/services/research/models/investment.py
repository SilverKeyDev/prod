from pydantic import BaseModel, Field
from typing import Dict, Optional, Any

class Investment(BaseModel):
    """Future growth, job market stability, resale potential"""
    investment_rating: str = Field(..., description="Overall investment score as decimal to tenths place (e.g., 8.5, 7.2). This must be the first field and extremely brief.")
    future_growth: str = Field(..., description="Future growth prospects and development plans. Extremely brief.")
    job_market: str = Field(..., description="Job market stability and employment opportunities. Extremely brief.")
    resale_potential: str = Field(..., description="Resale potential and market trends. Extremely brief.")
    market_outlook: str = Field(..., description="Overall market outlook and investment attractiveness. Extremely brief.")
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate example based on user preferences"""
        return {
            "investment_rating": "8.7",
            "future_growth": "Strong growth projected: new transit line planned, tech companies expanding, population increasing",
            "job_market": "Stable job market with diverse industries, low unemployment, growing tech sector",
            "resale_potential": "High resale potential: strong demand, limited inventory, appreciating values",
            "market_outlook": "Positive outlook: steady appreciation expected, rental yields 4-5%, strong fundamentals"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions"""
        return {
            "investment_rating": "Overall investment score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's investment goals.",
            "future_growth": "Future growth prospects including planned developments, infrastructure, and population trends. Extremely brief.",
            "job_market": "Job market stability, employment opportunities, and economic outlook. Extremely brief.",
            "resale_potential": "Resale potential based on market trends, demand, and property appreciation. Extremely brief.",
            "market_outlook": "Overall market outlook and investment attractiveness for the area. Extremely brief."
        }
