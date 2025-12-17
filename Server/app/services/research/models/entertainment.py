from pydantic import BaseModel, Field
from typing import Dict, Optional, Any

class Entertainment(BaseModel):
    """Restaurants, bars, gyms, activities, overall vibe"""
    entertainment_rating: str = Field(..., description="Overall entertainment score as decimal to tenths place (e.g., 8.5, 7.2). This must be the first field and extremely brief.")
    restaurants: str = Field(..., description="Restaurant scene and dining options. Extremely brief.")
    bars_and_nightlife: str = Field(..., description="Bars, nightlife, and social venues. Extremely brief.")
    gyms_and_fitness: str = Field(..., description="Gyms, fitness centers, and active lifestyle options. Extremely brief.")
    activities: str = Field(..., description="Activities, events, and things to do. Extremely brief.")
    overall_vibe: str = Field(..., description="Overall entertainment and social atmosphere. Extremely brief.")
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate example based on user preferences"""
        occupation = user_preferences.get("occupation", 'balanced') if user_preferences else 'balanced'
        age = user_preferences.get('age', 30) if user_preferences else 30
        
        return {
            "entertainment_rating": "8.5",
            "restaurants": "Diverse dining scene: farm-to-table, seafood, international cuisine, food trucks",
            "bars_and_nightlife": "Trendy cocktail bars, craft breweries, live music venues, rooftop lounges",
            "gyms_and_fitness": "Multiple gyms, yoga studios, CrossFit, outdoor fitness equipment, running trails",
            "activities": "Art walks, farmers markets, outdoor concerts, beach activities, cultural events",
            "overall_vibe": "Vibrant, social, active community with something for everyone"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions"""
        occupation = user_preferences.get("occupation", 'balanced') if user_preferences else 'balanced'
        
        return {
            "entertainment_rating": "Overall entertainment score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's interests.",
            "restaurants": "Restaurant scene including types, quality, and diversity of dining options. Extremely brief.",
            "bars_and_nightlife": "Bars, nightlife venues, and social spaces for evening entertainment. Extremely brief.",
            "gyms_and_fitness": "Gyms, fitness centers, yoga studios, and active lifestyle options. Extremely brief.",
            "activities": "Activities, events, cultural offerings, and things to do in the area. Extremely brief.",
            "overall_vibe": "Overall entertainment and social atmosphere of the neighborhood. Extremely brief."
        }
