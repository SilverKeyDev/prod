from pydantic import BaseModel, Field
from typing import Dict, Optional, Any

class ConvenienceWalkability(BaseModel):
    """Grocery, daily services, walkability, errands without a car"""
    convenience_rating: str = Field(...)
    grocery_stores: str = Field(...)
    daily_services: str = Field(...)
    walkability: str = Field(...)
    errands_without_car: str = Field(...)
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions"""
        walkability_importance = user_preferences.get("walkability_importance", "neutral") if user_preferences else "neutral"
        
        return {
            "convenience_rating": f"Overall convenience and walkability score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's walkability preference ({walkability_importance}).",
            "grocery_stores": "Grocery stores and food shopping options including distance and quality. Extremely brief.",
            "daily_services": "Daily services including banks, post office, pharmacies, and other essential services. Extremely brief.",
            "walkability": "Walkability score and pedestrian-friendliness including sidewalks and pedestrian infrastructure. Extremely brief.",
            "errands_without_car": "Ability to complete daily errands without a car, including distance and accessibility. Extremely brief."
        }
    
    @classmethod
    def get_comparison_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate simplified comparison descriptions - rating only, max 6 words per field"""
        return {
            "convenience_rating": "Decimal rating (e.g., 8.5).",
            "walkability": "Walkability score and pedestrian-friendliness.",
            "grocery_stores": "Grocery shopping options brief summary."
        }
