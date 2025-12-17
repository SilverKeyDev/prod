from pydantic import BaseModel, Field
from typing import Dict, Optional, Any

class Neighborhood(BaseModel):
    """Safety, cleanliness, upkeep, community feel"""
    neighborhood_rating: str = Field(..., description="Overall neighborhood quality score as decimal to tenths place (e.g., 8.5, 7.2). This must be the first field and extremely brief.")
    safety_rating: str = Field(..., description="Overall safety score as decimal to tenths place out of 10, formatted as 'X.X/10' (e.g., 8.5/10, 7.2/10). MUST be numeric, NOT letter grades like A-, B+, etc. Extremely brief.")
    crime_rating: str = Field(..., description="Crime level assessment. Extremely brief.")
    places_to_watch_out_for: str = Field(..., description="Specific areas with higher risk or safety concerns. Extremely brief.")
    cleanliness: str = Field(..., description="Overall cleanliness and upkeep of the area. Extremely brief.")
    community_feel: str = Field(..., description="Community atmosphere, neighborliness, and social character. Extremely brief.")
    police_presence: str = Field(..., description="Frequency and visibility of police patrols. Extremely brief.")
    parking: str = Field(..., description="Street parking rules, permit requirements, garage availability. Extremely brief.")
    pet_friendly: str = Field(..., description="Dog parks, pet stores, veterinarians, pet policies. Extremely brief.")
    cell_service_quality: str = Field(..., description="Coverage quality for major carriers. Extremely brief.")
    other_notable_tips: str = Field(..., description="Local insider knowledge, best times to visit places, hidden gems, traffic patterns. Extremely brief.")
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate example based on user preferences"""
        pets = user_preferences.get("pets", "none") if user_preferences else "none"
        age = user_preferences.get("age", 35) if user_preferences else 35
        
        has_pets = user_preferences.get('has_pets', False) if user_preferences else False
        occupation = user_preferences.get("occupation", 'balanced') if user_preferences else 'balanced'
        work_from_home = False
        
        if has_pets:
            pet_info = "Extremely pet-friendly - 5 dog parks within walking distance, off-leash beach area, pet grooming services"
        else:
            pet_info = "Pet-friendly neighborhood - dog parks available, many residents have pets, vet clinic nearby"
        
        if work_from_home:
            cell_info = "Outstanding connectivity - 5G coverage from all carriers, fiber internet backup options"
            tips = "Best coffee for remote work at Quiet Corner Cafe, library has excellent WiFi, avoid construction noise on Oak St 9-11am"
        elif occupation == 'nightlife':
            tips = "Best late-night eats at 24/7 Diner, Uber/Lyft readily available, street lighting excellent for safety"
        elif occupation == 'family':
            tips = "Best family coffee at Corner Cafe, avoid Main St during school pickup 3-4pm, farmers market Saturdays 8am-2pm"
        else:
            tips = "Best coffee at Corner Cafe, avoid Main St during school pickup, farmers market Saturdays 8am-2pm"
        
        return {
            "neighborhood_rating": "8.2",
            "safety_rating": "7.8",
            "crime_rating": "Low",
            "places_to_watch_out_for": "Main St after 10pm, parking lots near the train station",
            "cleanliness": "Well-maintained streets, regular trash collection, active neighborhood watch",
            "community_feel": "Friendly neighbors, active community events, strong sense of community",
            "police_presence": "Regular patrol cars, community policing program, quick response times",
            "parking": "Street parking mostly free, 2-hour limits near shops, resident permits available for $50/year",
            "pet_friendly": pet_info,
            "cell_service_quality": "Excellent coverage for all major carriers, 5G available, minimal dead zones" if not work_from_home else cell_info,
            "other_notable_tips": tips
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions"""
        pets = user_preferences.get("pets", "none") if user_preferences else "none"
        age = user_preferences.get("age", 35) if user_preferences else 35
        
        occupation = user_preferences.get("occupation", 'balanced') if user_preferences else 'balanced'
        has_pets = user_preferences.get('has_pets', False) if user_preferences else False
        
        return {
            "neighborhood_rating": "Overall neighborhood quality score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's priorities.",
            "safety_rating": "Overall safety score as decimal to tenths place out of 10, formatted as 'X.X/10' (e.g., 8.5/10, 7.2/10). MUST be numeric, NOT letter grades like A-, B+, etc. Extremely brief. Based on crime data, community perception, and safety infrastructure.",
            "crime_rating": "Crime level assessment. Extremely brief. Use categories: Nonexistent, Low, Moderate, High, Very High.",
            "places_to_watch_out_for": "Specific areas, intersections, or locations with higher risk or safety concerns. Extremely brief.",
            "cleanliness": "Overall cleanliness and upkeep of streets, public spaces, and properties. Extremely brief.",
            "community_feel": "Community atmosphere, neighborliness, social character, and sense of belonging. Extremely brief.",
            "police_presence": "Frequency and visibility of police patrols, community policing programs, and response times. Extremely brief.",
            "parking": "Street parking rules, permit requirements, garage availability. Extremely brief. Use Google Street View to assess parking density and local parking signs.",
            "pet_friendly": "Dog parks, pet stores, veterinarians, pet policies. Extremely brief. Search '[neighborhood] dog park' or use Google Maps to find pet amenities.",
            "cell_service_quality": "Coverage quality for major carriers. Extremely brief. Check carrier coverage maps or local forums for dead zone reports.",
            "other_notable_tips": "Local insider knowledge, best times to visit places, hidden gems, traffic patterns. Extremely brief. Use local forums, Reddit, or Nextdoor for community insights."
        }
