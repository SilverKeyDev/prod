from pydantic import BaseModel, Field
from typing import Dict, Optional, Any

class CommuteSection(BaseModel):
    """Driving time, public transit, road quality, infrastructure"""
    commute_rating: str = Field(..., description="Overall commute convenience score as decimal to tenths place (e.g., 8.5, 7.2). This must be the first field and extremely brief.")
    commute_times: str = Field(..., description="Commute times to key destinations. Extremely brief.")
    public_transport: str = Field(..., description="Public transportation options and availability. Extremely brief.")
    traffic: str = Field(..., description="Traffic patterns and congestion levels. Extremely brief.")
    road_quality: str = Field(..., description="Road quality and infrastructure. Extremely brief.")
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate example based on user preferences"""
        important_locations = user_preferences.get('important_locations', []) if user_preferences else []
        
        return {
            "commute_rating": "8.5",
            "commute_times": "Downtown: 25 min, Airport: 45 min, Business District: 30 min by car",
            "public_transport": "Metro bus routes every 15 min, light rail station 0.5 miles away, bike share program",
            "traffic": "Moderate rush hour congestion 7-9am and 5-7pm, generally light traffic otherwise",
            "road_quality": "Well-maintained roads, good signage, bike lanes on main routes"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions"""
        important_locations = user_preferences.get('important_locations', []) if user_preferences else []
        
        return {
            "commute_rating": "Overall commute convenience score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's commute needs.",
            "commute_times": "Commute times to key destinations including work, school, and important locations. Extremely brief.",
            "public_transport": "Public transportation options including bus routes, rail, bike share, and frequency. Extremely brief.",
            "traffic": "Traffic patterns, congestion levels, and peak hours. Extremely brief. Consider user's commute tolerance.",
            "road_quality": "Road quality, infrastructure, bike lanes, and overall transportation infrastructure. Extremely brief."
        }
