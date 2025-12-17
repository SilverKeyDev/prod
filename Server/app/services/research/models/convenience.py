from pydantic import BaseModel, Field
from typing import Dict, Optional, Any

class ConvenienceWalkability(BaseModel):
    """Grocery, daily services, walkability, errands without a car"""
    convenience_rating: str = Field(..., description="Overall convenience and walkability score as decimal to tenths place (e.g., 8.5, 7.2). This must be the first field and extremely brief.")
    grocery_stores: str = Field(..., description="Grocery stores and food shopping options. Extremely brief.")
    daily_services: str = Field(..., description="Daily services including banks, post office, pharmacies. Extremely brief.")
    walkability: str = Field(..., description="Walkability score and pedestrian-friendliness. Extremely brief.")
    errands_without_car: str = Field(..., description="Ability to complete errands without a car. Extremely brief.")
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate example based on user preferences"""
        return {
            "convenience_rating": "9.2",
            "grocery_stores": "Whole Foods 0.5 miles, Trader Joe's 1 mile, local market 0.3 miles, multiple options within walking distance",
            "daily_services": "Banks, post office, pharmacies, dry cleaners all within 1 mile, most walkable",
            "walkability": "Walk Score 92/100 - Very walkable, pedestrian-priority streets, sidewalks throughout",
            "errands_without_car": "Most errands easily accomplished on foot: grocery, pharmacy, bank, post office all walkable"
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
