from pydantic import BaseModel, Field, Extra, model_validator, PrivateAttr
from typing import List, Dict, Optional, Any, Union, TypedDict
from collections import OrderedDict
import logging
import re


logger = logging.getLogger(__name__)



RATING_MAP = {
    "none": 0,
    "very low": 10,
    "low": 25,
    "somewhat low": 35,
    "moderate": 50,
    "medium": 50,
    "somewhat high": 65,
    "high": 75,
    "strong": 85,
    "very high": 95,
    "extremely high": 100,
}

class LifestyleDNA(BaseModel):
    model_config = {
        "populate_by_name": True,  # ensures alias fields can be populated
        "extra": "ignore",  # Perplexity may return extra fields
    }

    artistic: int = Field(
        ge=0, le=100,
        description="How emblematic the area is of an artistic or creative occupation. "
                    "Score high (80–100) for vibrant art, music, studios, and cultural events. "
                    "Score 0–20 if there's no visible creative or indie scene. "
                    "IMPORTANT TONE INSTRUCTION: Be EXTREMELY HARSH for low scores and EXTREMELY POSITIVE for high scores. "
                    "Do not be neutral or balanced. Use vivid language, specific examples, and memorable comparisons."
    )
    professional: int = Field(
        ge=0, le=100,
        description="How aligned the area is with white-collar, business-focused lifestyles. "
                    "Score 100 for financial districts and business culture. "
                    "Score 0 if the area has no professional presence or appeal. "
                    "IMPORTANT TONE INSTRUCTION: Be EXTREMELY HARSH for low scores and EXTREMELY POSITIVE for high scores. "
                    "Do not be neutral or balanced. Use vivid language, specific examples, and memorable comparisons."
    )
    family_oriented: int = Field(
        ge=0, le=100,
        description="How well the area supports families. "
                    "Score high for schools, parks, low crime, and spacious homes. "
                    "Score 0 if it's nightlife-heavy, cramped, or transient. "
                    "IMPORTANT TONE INSTRUCTION: Be EXTREMELY HARSH for low scores and EXTREMELY POSITIVE for high scores. "
                    "Do not be neutral or balanced. Use vivid language, specific examples, and memorable comparisons."
    )
    active_outdoor: int = Field(
        ge=0, le=100,
        description="How well the area supports fitness and outdoor lifestyles. "
                    "Score 100 for hiking, biking, surfing, gym culture, and green space. "
                    "Score low if it's concrete, flat, or inactive. "
                    "IMPORTANT TONE INSTRUCTION: Be EXTREMELY HARSH for low scores and EXTREMELY POSITIVE for high scores. "
                    "Do not be neutral or balanced. Use vivid language, specific examples, and memorable comparisons."
    )
    tech_remote: int = Field(
        ge=0, le=100,
        description="How well-suited the area is for remote tech professionals. "
                    "Score high for coworking, startups, cafes, modern apartments, fast Wi-Fi. "
                    "Score 0 if it lacks digital infrastructure or a tech scene. "
                    "IMPORTANT TONE INSTRUCTION: Be EXTREMELY HARSH for low scores and EXTREMELY POSITIVE for high scores. "
                    "Do not be neutral or balanced. Use vivid language, specific examples, and memorable comparisons."
    )
    retiree: int = Field(
        ge=0, le=100,
        description="How ideal the area is for retirees. "
                    "Score high for peace, slow pace, nature, and medical access. "
                    "Score low if it's noisy, chaotic, or youthful. "
                    "IMPORTANT TONE INSTRUCTION: Be EXTREMELY HARSH for low scores and EXTREMELY POSITIVE for high scores. "
                    "Do not be neutral or balanced. Use vivid language, specific examples, and memorable comparisons."
    )
    student: int = Field(
        ge=0, le=100,
        description="How strong the student presence is. "
                    "Score high near colleges, dorms, bars, and cheap eats. "
                    "Score 0 if there's no academic or youth culture nearby. "
                    "IMPORTANT TONE INSTRUCTION: Be EXTREMELY HARSH for low scores and EXTREMELY POSITIVE for high scores. "
                    "Do not be neutral or balanced. Use vivid language, specific examples, and memorable comparisons."
    )
    suburban: int = Field(
        ge=0, le=100,
        description="How suburban the layout and feel is. "
                    "Score 100 for detached homes, cul-de-sacs, big yards. "
                    "Score 0 for dense, walkable, or urban areas. "
                    "IMPORTANT TONE INSTRUCTION: Be EXTREMELY HARSH for low scores and EXTREMELY POSITIVE for high scores. "
                    "Do not be neutral or balanced. Use vivid language, specific examples, and memorable comparisons."
    )
    urban: int = Field(
        ge=0, le=100,
        description="How urban the area feels. "
                    "Score high for density, walkability, transit, and city energy. "
                    "Score 0 if it's rural, spread out, or car-centric. "
                    "IMPORTANT TONE INSTRUCTION: Be EXTREMELY HARSH for low scores and EXTREMELY POSITIVE for high scores. "
                    "Do not be neutral or balanced. Use vivid language, specific examples, and memorable comparisons."
    )

    @classmethod
    def sanitize_and_validate(cls, data: Dict[str, Any]) -> "LifestyleDNA":
        """
        Gracefully handle messy inputs:
        - Maps labels like "high", "moderate", etc. to numeric scores
        - Extracts first number from strings like "85%" or "score: 70"
        - Ensures all final values are integers in [0, 100]
        - Defaults to 0 with logging if invalid
        """
        cleaned = {}

        for field in cls.model_fields:
            raw = data.get(field)
            val = 0  # default fallback

            if isinstance(raw, str):
                raw_lower = raw.strip().lower()

                # Map qualitative labels
                if raw_lower in RATING_MAP:
                    val = RATING_MAP[raw_lower]
                else:
                    # Try to extract number from string
                    match = re.search(r"-?\d+(\.\d+)?", raw_lower)
                    if match:
                        try:
                            val = int(float(match.group()))
                        except ValueError:
                            val = 0
            elif isinstance(raw, (int, float)):
                val = int(raw)

            # Final clamp and safety
            if not isinstance(val, int):
                val = 0
            val = max(0, min(val, 100))

            cleaned[field] = val

        return cls(**cleaned)

    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> dict:
        return {
            "artistic": 85,
            "professional": 95,
            "family_oriented": 20,
            "active_outdoor": 75,
            "tech_remote": 100,
            "retiree": 5,
            "student": 10,
            "suburban": 15,
            "urban": 95
        }
        

class NeighborhoodOverview(BaseModel):
    local_culture: str = Field(...)
    vibe: str = Field(...)
    known_for: str = Field(...)
    community_events: str = Field(...)
    what_people_love: str = Field(...)
    things_to_watch_out_for: str = Field(...)
    image_prompt: str = Field(...)
    image_prompt_2: str = Field(...)

    model_config = {
        "populate_by_name": True,  # ensures alias fields can be populated
        "extra": "ignore",  # Perplexity may return extra fields
    }

    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        occupation = user_preferences.get("occupation", "laid-back") if user_preferences else "laid-back"
        return {
            "local_culture": f"Artistic and laid-back coastal community with a focus on marine activities. This aligns with the user occupation: {occupation}.",
            "vibe": "Creative, beachy, relaxed",
            "known_for": "Beaches, surfing, whale watching, and Dana Point Harbor",
            "community_events": "Weekly farmers market, summer concerts, Festival of Whales",
            "what_people_love": "Walkability, coastal charm, outdoor activities",
            "things_to_watch_out_for": "Crowds in summer, limited parking, weekend traffic",
            "image_prompt": "Aerial view of the neighborhood around the address showing streets, housing, and nearby landmarks",
            "image_prompt_2": "Street-level view of residential streets near the address showing typical homes and landscaping",
        }

class Safety(BaseModel):
    crime_rating: str = Field(
        ...,
        example="Low"
    )
    places_to_watch_out_for: str = Field(
        ...,
        example="Main St after 10pm, parking lots near the train station, avoid the alley behind 5th Ave"
    )
    police_presence: str = Field(
        ...,
        example="Regular patrol cars, community policing program, quick response times"
    )
    safety_rating: str = Field(
        ...,
        example="7.8/10"
    )
    image_prompt: str = Field(
        ...,
        example="Crime map of the city showing safety statistics and incident reports for this specific neighborhood around the address"
    )
    image_prompt_2: str = Field(
        ...,
        example="Street-level photo of safety infrastructure in this neighborhood: well-lit streets, security cameras, police patrol presence, and neighborhood watch signs around {address}"
    )

    model_config = {
        "populate_by_name": True,  # ensures alias fields can be populated
        "extra": "ignore",  # Perplexity may return extra fields
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences (using actual UserPreferences fields)"""
        # Use actual UserPreferences fields
        pets = user_preferences.get("pets", "none") if user_preferences else "none"
        age = user_preferences.get("age", 35) if user_preferences else 35
        occupation = user_preferences.get("occupation", "professional") if user_preferences else "professional"
        
        # Determine safety focus based on actual user profile
        has_pets = pets and pets.lower() not in ["none", "no pets", ""]
        safety_focus = "family-friendly areas with good lighting and school zones" if has_pets or age < 40 else "well-lit streets and secure areas"
        
        return {
            "crime_rating": "Low",
            "places_to_watch_out_for": "Main St after 10pm, parking lots near the train station, avoid the alley behind 5th Ave",
            "police_presence": "Regular patrol cars, community policing program, quick response times",
            "safety_rating": "7.8/10",
            "image_prompt": "Well-lit streets near the address showing safety features and street lamps",
            "image_prompt_2": "Safety infrastructure in the neighborhood: security cameras and neighborhood watch signs"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences (using actual UserPreferences fields)"""
        # Use actual UserPreferences fields
        pets = user_preferences.get("pets", "none") if user_preferences else "none"
        age = user_preferences.get("age", 35) if user_preferences else 35
        
        # Determine safety focus based on actual user profile
        has_pets = pets and pets.lower() not in ["none", "no pets", ""]
        safety_focus = "family safety" if has_pets or age < 40 else "general safety"
        
        return {
            "crime_rating": "Crime level assessment using categories: Nonexistent, Low, Moderate, High, Very High. Base on local crime statistics, police reports, and community safety data. Use sources like local police department crime maps, Neighborhood Scout, or AreaVibes crime data. Focus on safety factors most relevant to user's situation.",
            "places_to_watch_out_for": "Specific areas, intersections, or locations with higher risk or safety concerns. Include times of day when relevant. Use local knowledge from City-Data forums, Nextdoor, or police reports. Be specific with street names and locations. Prioritize areas relevant to user's daily routines and family needs.",
            "police_presence": "Describe frequency and visibility of police patrols, community policing programs, and response times. Source from local police department websites, community meetings, or resident feedback on Nextdoor/City-Data. Emphasize community policing and response times.",
            "safety_rating": "Overall safety score out of 10 based on crime data, community perception, and safety infrastructure. Use data from AreaVibes, Neighborhood Scout, or local crime statistics. MUST be a numeric value formatted as 'X.X/10' (e.g., '8.5/10', '7.2/10'). DO NOT use letter grades like A-, B+, C, etc. Weight factors based on user's safety priorities.",
            "image_prompt": f"Safety map of the neighborhood around the address (emphasizing {safety_focus})",
            "image_prompt_2": f"Street-level view of safety features near the address (focusing on {safety_focus})"
        }

class CultureAndEvents(BaseModel):
    local_events: str = Field(...)
    seasonal_trends: str = Field(...)
    community_engagement: str = Field(...)
    culture_rating: str = Field(...)
    image_prompt: str = Field(...)
    image_prompt_2: str = Field(...)
    
    model_config = {
        "populate_by_name": True,  # ensures alias fields can be populated
        "extra": "ignore",  # Perplexity may return extra fields
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences (using actual UserPreferences fields)"""
        # Use actual UserPreferences fields
        age = user_preferences.get("age", 35) if user_preferences else 35
        occupation = user_preferences.get("occupation", "professional") if user_preferences else "professional"
        pets = user_preferences.get("pets", "none") if user_preferences else "none"
        
        # Determine cultural interests based on actual profile
        cultural_focus = "family-friendly events" if pets and pets.lower() not in ["none", "no pets", ""] else "diverse cultural activities"
        
        return {
            "local_events": "Art walks, food truck festivals, outdoor movie nights, farmers markets",
            "seasonal_trends": "Busy summers with beach events, quieter winters with indoor cultural activities",
            "community_engagement": "Active neighborhood watch, volunteer cleanup days, high voter turnout",
            "culture_rating": "8.5/10",
            "image_prompt": "Local cultural events and festivals near the address showing community gatherings",
            "image_prompt_2": "Cultural venues near the address: theaters, galleries, and community centers"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        hobbies = [] if user_preferences else ['outdoor activities']
        hobbies_str = ', '.join(hobbies) if isinstance(hobbies, list) else str(hobbies)
        
        return {
            "local_events": f"Events people attend — use names or examples. Search Eventbrite, Meetup, City-Data Forums for specific events. Focus on events that align with user's interests: {hobbies_str}. Include real event names and venues when possible.",
            "seasonal_trends": "How activity changes throughout the year, e.g., 'Busy in summer, quieter winters'. Check Nomad List or blog search results for seasonal patterns. Consider how seasons affect the user's preferred activities and occupation.",
            "community_engagement": "Civic participation level (e.g., cleanup days, local watch groups). Mention if visible on Meetup or community forums. Assess opportunities for user involvement based on their community involvement preferences.",
            "culture_rating": "Score should reflect vibrancy and access. Weigh frequency and diversity of events, Eventbrite density is a clue for cultural activity. Rate based on cultural factors that matter most to the user's interests and occupation.",
            "image_prompt": "Cultural venues and event spaces near the address where local events take place",
            "image_prompt_2": "Art galleries, theaters, and community centers near the address"
        }

class SocialCharacter(BaseModel):
    income_level: str = Field(...)
    religiosity: str = Field(...)
    cultural_tone: str = Field(...)
    social_rating: str = Field(...)
    image_prompt: str = Field(...)
    image_prompt_2: str = Field(...)
    
    model_config = {
        "populate_by_name": True,  # ensures alias fields can be populated
        "extra": "ignore",  # Perplexity may return extra fields
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        gross_income = user_preferences.get("gross_income", '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "income_level": "Middle-class professionals and young families, median household income $75,000",
            "religiosity": "Moderate - several churches and temples, but not overly conservative",
            "cultural_tone": "Laid-back but proud, environmentally conscious, welcoming to newcomers",
            "social_rating": "8.2/10",
            "image_prompt": "Community spaces and gathering areas near the address where residents socialize",
            "image_prompt_2": "Local coffee shops and social venues near the address reflecting neighborhood character"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        gross_income = user_preferences.get("gross_income", '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "income_level": f"E.g., 'Middle-class professionals'. Use Niche or AreaVibes income distribution. Consider how the income levels align with user's financial situation ({gross_income}) and social comfort.",
            "political_leaning": "State clearly. Use Niche political maps or Redfin voting overlays if accessible.",
            "language_spoken": "Include major spoken languages beyond English. Niche + City-Data often break this down.",
            "religiosity": "Low / Moderate / High — explain the tone. Use BestPlaces religion % or Niche. Assess compatibility with user's spiritual preferences and tolerance for religious influence.",
            "cultural_tone": "Summary of vibe ('laid-back but proud'). Pull from Google Maps reviews or Niche user feedback. Focus on cultural aspects that match user's social preferences and values.",
            "social_rating": "Reflects inclusivity, education, worldview. Niche 'diversity' and 'community' scores are good proxies. Weight factors based on user's social priorities and community involvement preferences.",
            "image_prompt": "Community spaces and local businesses near the address reflecting daily life",
            "image_prompt_2": "Religious institutions and cafes near the address showing cultural diversity"
        }

class Restaurant(BaseModel):
    name: str = Field(...)
    vibe: str = Field(...)
    what_to_try: str = Field(...)
    
    model_config = {
        "populate_by_name": True,  # ensures alias fields can be populated
        "extra": "ignore",  # Perplexity may return extra fields
    }
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Restaurant data based on user preferences."""
        occupation = user_preferences.get("occupation", 'balanced')
        income = user_preferences.get("gross_income", 'middle')
        
        if occupation == 'nightlife' and income in ['high', 'very_high']:
            return {
                "name": "The Rooftop Lounge",
                "vibe": "Upscale cocktail bar with city skyline views and live DJ sets",
                "what_to_try": "Craft cocktails, wagyu sliders, truffle fries"
            }
        elif occupation == 'family' or user_preferences.get("pets", 0) > 0:
            return {
                "name": "Family Garden Bistro",
                "vibe": "Kid-friendly restaurant with outdoor seating and play area",
                "what_to_try": "Wood-fired pizza, fresh salads, homemade ice cream"
            }
        else:
            return {
                "name": "The Coastal Kitchen",
                "vibe": "Casual beachside dining with ocean views",
                "what_to_try": "Fish tacos, clam chowder, sunset cocktails"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> str:
        """Generate field descriptions for Restaurant based on user preferences."""
        occupation = user_preferences.get("occupation", 'balanced') if user_preferences else 'balanced'
        dining_prefs = [] if user_preferences else []
        dining_str = ', '.join(dining_prefs) if isinstance(dining_prefs, list) else str(dining_prefs)
        
        if occupation == 'nightlife':
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on trendy spots, late-night dining, and social venues that align with an active nightlife occupation. Consider user's dining preferences: {dining_str}."
        elif occupation == 'family':
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on family-friendly restaurants with kid-friendly menus, accommodating atmospheres, and convenient locations for families. Consider user's dining preferences: {dining_str}."
        else:
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Showcase the local culinary scene and dining options available to residents. Consider user's dining preferences: {dining_str}."

class Activity(BaseModel):
    name: str = Field(...)
    description: str = Field(...)
    
    model_config = {
        "populate_by_name": True,  # ensures alias fields can be populated
        "extra": "ignore",  # Perplexity may return extra fields
    }

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Activity data based on user preferences."""
        occupation = user_preferences.get("occupation", 'balanced')
        age = user_preferences.get('age', 30)
        children = user_preferences.get("pets", 0)
        
        if occupation == 'active' or age < 35:
            return {
                "name": "Morning Beach Volleyball League",
                "description": "Competitive and recreational volleyball games every weekend morning, welcoming players of all skill levels with organized tournaments"
            }
        elif children > 0:
            return {
                "name": "Family Adventure Park",
                "description": "Interactive outdoor adventure course with zip lines, climbing walls, and nature trails designed for families with children of all ages"
            }
        else:
            return {
                "name": "Sunset Beach Volleyball",
                "description": "Popular evening volleyball games on the main beach, welcoming to all skill levels"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> str:
        """Generate field descriptions for Activity based on user preferences."""
        occupation = user_preferences.get("occupation", 'balanced') if user_preferences else 'balanced'
        children = user_preferences.get("pets", 0) if user_preferences else 0
        hobbies = [] if user_preferences else []
        hobbies_str = ', '.join(hobbies) if isinstance(hobbies, list) else str(hobbies)
        
        if occupation == 'active':
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on activities that promote an active occupation, including sports, fitness activities, and outdoor adventures. Consider user's interests: {hobbies_str}."
        elif children > 0:
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on family-oriented activities and attractions suitable for families with children. Consider user's interests: {hobbies_str}."
        else:
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Highlight recreational opportunities and community engagement options. Consider user's interests: {hobbies_str}."

class Park(BaseModel):
    name: str = Field(...)
    features: str = Field(...)
    
    model_config = {
        "populate_by_name": True,  # ensures alias fields can be populated
        "extra": "ignore",  # Perplexity may return extra fields
    }

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Park data based on user preferences."""
        occupation = user_preferences.get("occupation", 'balanced')
        children = user_preferences.get("pets", 0)
        
        if occupation == 'active':
            return {
                "name": "Riverside Athletic Complex",
                "features": "Running trails, outdoor gym equipment, basketball courts, tennis courts, bike rental station, and scenic river views"
            }
        elif children > 0:
            return {
                "name": "Family Fun Community Park",
                "features": "Large playground with modern equipment, splash pad, picnic pavilions, walking paths, and dedicated toddler play area"
            }
        else:
            return {
                "name": "Seaside Community Park",
                "features": "Playground, walking trails, picnic areas, dog park, ocean views"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> str:
        """Generate field descriptions for Park based on user preferences."""
        occupation = user_preferences.get("occupation", 'balanced') if user_preferences else 'balanced'
        children = user_preferences.get("pets", 0) if user_preferences else 0
        fitness_activities = [] if user_preferences else []
        fitness_str = ', '.join(fitness_activities) if isinstance(fitness_activities, list) else str(fitness_activities)
        
        if occupation == 'active':
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on parks with recreational facilities, fitness amenities, and outdoor activity options that support an active occupation. Consider user's fitness interests: {fitness_str}."
        elif children > 0:
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on family-friendly amenities, playgrounds, and facilities designed for children and family activities. Consider user's fitness interests: {fitness_str}."
        else:
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Highlight key amenities and recreational features for residents. Consider user's fitness interests: {fitness_str}."

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class LocalAmenities(BaseModel):
    """
    A flattened description of notable local amenities near the property,
    including restaurants, activities, parks, and grocery options.
    """

    # Restaurant fields
    restaurant_name: Optional[str] = Field(default="", description="Name of a notable restaurant in the area.")
    restaurant_vibe: Optional[str] = Field(default="", description="Atmosphere and style of the restaurant.")
    restaurant_what_to_try: Optional[str] = Field(default="", description="Recommended dishes or specialties.")

    # Activity fields
    activity_name: Optional[str] = Field(default="", description="Name of a popular activity or attraction nearby.")
    activity_description: Optional[str] = Field(default="", description="Description of what makes this activity special.")

    # Park fields
    park_name: Optional[str] = Field(default="", description="Name of a notable park or green space.")
    park_features: Optional[str] = Field(default="", description="Special features or amenities of this park.")

    # Grocery Store fields
    grocery_store_name: Optional[str] = Field(default="", description="Name of the main grocery store used by locals.")
    grocery_store_vibe: Optional[str] = Field(default="", description="Type and quality of the grocery store.")

    model_config = {
        "populate_by_name": True,
        "extra": "ignore"  # This will drop any unknown fields returned by Perplexity
    }



class Commute(BaseModel):
    commute_times: str = Field(...)
    public_transport: str = Field(...)
    traffic: str = Field(...)
    walkability: str = Field(...)
    
    model_config = {
        "populate_by_name": True,  # ensures alias fields can be populated
        "extra": "ignore",  # Perplexity may return extra fields
    }

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Commute data based on user preferences."""
        # Get commute tolerance from important locations
        commute_tolerance = 'under_30'  # default
        important_locations = user_preferences.get('important_locations', [])
        if isinstance(important_locations, list) and important_locations:
            first_location = important_locations[0]
            if isinstance(first_location, dict):
                commute_val = first_location.get('commute_tolerance', 30)
                if commute_val <= 15:
                    commute_tolerance = 'under_15'
                elif commute_val <= 30:
                    commute_tolerance = 'under_30'
                elif commute_val <= 45:
                    commute_tolerance = 'under_45'
                else:
                    commute_tolerance = 'over_45'
        occupation = user_preferences.get("occupation", 'balanced')
        
        if commute_tolerance == 'under_15':
            return {
                "commute_times": "Downtown: 12 min, Business District: 8 min, Airport: 25 min by car",
                "public_transport": "Express bus routes every 10 min, subway station 2 blocks away, extensive bike lanes",
                "traffic": "Minimal congestion, well-designed traffic flow with smart signals",
                "walkability": "Walk Score 92/100 - Daily errands easily accomplished on foot, pedestrian-priority streets"
            }
        elif commute_tolerance == 'over_45':
            return {
                "commute_times": "Downtown: 55 min, Airport: 75 min, Business District: 50 min by car",
                "public_transport": "Limited bus service, nearest rail station 3 miles away, car-dependent area",
                "traffic": "Heavy rush hour congestion, plan extra time during peak hours",
                "walkability": "Walk Score 45/100 - Car needed for most errands, suburban layout"
            }
        else:
            return {
                "commute_times": "Downtown: 25 min, Airport: 45 min, Business District: 30 min by car",
                "public_transport": "Metro bus routes every 15 min, light rail station 0.5 miles away, bike share program",
                "traffic": "Moderate rush hour congestion 7-9am and 5-7pm, generally light traffic otherwise",
                "walkability": "Walk Score 85/100 - Most errands can be accomplished on foot, bike-friendly streets"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        # Get commute tolerance from important locations
        commute_tolerance = 'under_30'  # default
        if user_preferences:
            important_locations = user_preferences.get('important_locations', [])
            if isinstance(important_locations, list) and important_locations:
                first_location = important_locations[0]
                if isinstance(first_location, dict):
                    commute_val = first_location.get('commute_tolerance', 30)
                    if commute_val <= 15:
                        commute_tolerance = 'under_15'
                    elif commute_val <= 30:
                        commute_tolerance = 'under_30'
                    elif commute_val <= 45:
                        commute_tolerance = 'under_45'
                    else:
                        commute_tolerance = 'over_45'
        walkability_importance = user_preferences.get('walkability_importance', 'somewhat_important') if user_preferences else 'somewhat_important'
        
        return {
            "commute_times": f"Include time by car and public transit. Redfin and Realtor.com neighborhood pages sometimes show this. Emphasize routes and times relevant to user's commute tolerance ({commute_tolerance}).",
            "public_transport": "Mention system quality. Walk Score's Transit Score or local public agency blog results. Focus on transit options that align with user's transportation preferences.",
            "traffic": "Describe congestion windows. City-Data forums often contain commuting complaints or hacks. Highlight peak times and alternative routes based on user's schedule flexibility.",
            "walkability": f"Score should reflect actual pedestrian accessibility. Use Walk Score directly. Weight walkability factors based on user's walkability importance ({walkability_importance})."
        }

class FamilyFriendly(BaseModel):
    lots_of_kids: str = Field(...)
    great_for_families: str = Field(...)
    family_rating: str = Field(...)
    
    model_config = {
        "populate_by_name": True,  # ensures alias fields can be populated
        "extra": "ignore",  # Perplexity may return extra fields
    }

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example FamilyFriendly data based on user preferences."""
        pets = user_preferences.get("pets", 0)
        occupation = user_preferences.get("occupation", 'balanced')
        
        if pets > 2:
            return {
                "lots_of_kids": "Very High - Abundant families with multiple children, active school community, kid-friendly events weekly",
                "great_for_families": "Outstanding schools, safe pedestrian areas, multiple playgrounds, family recreation center, after-school programs",
                "family_rating": "9.5/10"
            }
        elif pets and pets.lower() in ["dog", "dogs", "cat", "cats"]:
            return {
                "lots_of_kids": "High - Many families with young children, playgrounds always busy, school pickup lines",
                "great_for_families": "Excellent schools, safe streets, family events, parks within walking distance",
                "family_rating": "9.2/10"
            }
        else:
            return {
                "lots_of_kids": "Moderate - Some families present, quiet residential feel, occasional children's activities",
                "great_for_families": "Good schools nearby, safe neighborhood, some family amenities available",
                "family_rating": "7.8/10"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        pets = user_preferences.get("pets", 0) if user_preferences else 0
        
        return {
            "lots_of_kids": f"'Yes / Some / Few' with reasoning. Use Niche family scores + Livability.com insights. Focus on family density and child-friendly atmosphere (user has {pets} children).",
            "great_for_families": "Emphasize parks, schools, safety. Search '[neighborhood] with kids' or use Niche. Emphasize amenities and safety features most relevant to families with children.",
            "family_rating": "Honest reflection. Niche 'family grade' is a strong proxy. Weight factors based on user's family situation and child-related needs."
        }

class NightlifeAndDating(BaseModel):
    nightlife_rating: str = Field(...)
    best_spots: str = Field(...)
    dating_scene: str = Field(...)
    image_prompt: str = Field(...)
    image_prompt_2: str = Field(...)
    
    model_config = {
        "populate_by_name": True,  # ensures alias fields can be populated
        "extra": "ignore",  # Perplexity may return extra fields
    }

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example NightlifeAndDating data based on user preferences."""
        occupation = user_preferences.get("occupation", 'balanced')
        age = user_preferences.get('age', 30)
        gender = user_preferences.get("gender", 'single')
        
        if occupation == 'nightlife' and age < 35:
            return {
                "nightlife_rating": "9.2/10",
                "best_spots": "Sky Lounge rooftop bar, Underground dance club, Craft cocktail speakeasy, Late-night food trucks",
                "dating_scene": "Vibrant young professional scene, trendy bar meetups, rooftop parties, active social media presence",
                "image_prompt": "Nightlife venues near the address showing bars and clubs for young professionals",
                "image_prompt_2": "Dating-friendly venues near the address: trendy restaurants and social spaces"
            }
        elif gender in ['married', 'partnered'] or age > 40:
            return {
                "nightlife_rating": "6.8/10",
                "best_spots": "Wine bars, upscale restaurants with live music, theater district, cultural events",
                "dating_scene": "Mature social scene, wine tastings, cultural events, established professional networks",
                "image_prompt": "Upscale entertainment venues near the address for mature professionals",
                "image_prompt_2": "Date-night venues near the address: fine dining restaurants and wine lounges"
            }
        else:
            return {
                "nightlife_rating": "7.5/10",
                "best_spots": "The Rooftop Lounge, Coastal Brewery, Live music at The Pier, wine bars on Main St",
                "dating_scene": "Active young professional scene, beach volleyball meetups, wine tastings, farmers market socializing",
                "image_prompt": "Evening dining and entertainment venues near the address for casual nightlife",
                "image_prompt_2": "Casual social venues near the address: local bars and coffee shops"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        gender = user_preferences.get("gender", 'single') if user_preferences else 'single'
        age = user_preferences.get('age', 30) if user_preferences else 30
        
        return {
            "nightlife_rating": "Rate vibrancy of bars, music, and scenes. Use Yelp, Google Maps, or City-Data forum nightlife threads. Consider what appeals to the user's demographic and occupation.",
            "best_spots": "Popular bars, clubs, and entertainment venues. Use Yelp, Google Maps, or City-Data forum nightlife threads. Focus on venues that match the user's social style and interests.",
            "dating_scene": f"Describe energy and dating pool. Search 'dating in [city] Reddit' or Nomad List for vibe. Tailor to user's marital status ({gender}) and age ({age}) - focus on relevant social opportunities.",
            "average_attractiveness_rating": "Be playful but grounded. Use cultural tone and tongue-in-cheek phrasing.",
            "image_prompt": "Nightlife venues near the address reflecting local social atmosphere",
            "image_prompt_2": "Dating-friendly venues near the address where people socialize"
        }


class Development(BaseModel):
    upcoming_changes: str = Field(...)
    zoning_or_construction: str = Field(...)
    gentrification_signs: str = Field(...)
    vacancy_or_decay: str = Field(...)
    image_prompt: str = Field(...)
    image_prompt_2: str = Field(...)
    
    model_config = {
        "populate_by_name": True,  # ensures alias fields can be populated
        "extra": "ignore",  # Perplexity may return extra fields
    }

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Development data based on user preferences."""
        income = user_preferences.get("gross_income", 'middle')
        occupation = user_preferences.get("occupation", 'balanced')
        age = user_preferences.get('age', 30)
        
        if income in ['high', 'very_high'] and occupation == 'urban':
            return {
                "upcoming_changes": "Luxury high-rise development planned, new upscale shopping district, premium transit connections",
                "zoning_or_construction": "High-end mixed-use towers under construction, zoning allows luxury residential, architectural design standards enforced",
                "gentrification_signs": "Rapid property value increases, artisanal coffee shops and boutiques opening, longtime businesses being replaced",
                "vacancy_or_decay": "Very low vacancy rates, premium property maintenance, no signs of urban decay",
                "image_prompt": "Development and construction activity near the address showing new projects",
                "image_prompt_2": "Luxury developments near the address with premium architectural features"
            }
        elif age < 30 and occupation in ['nightlife', 'urban']:
            return {
                "upcoming_changes": "New entertainment district planned, co-working spaces expanding, bike lane infrastructure improvements",
                "zoning_or_construction": "Mixed-use development with ground-floor retail, zoning allows live-work spaces, height restrictions relaxed",
                "gentrification_signs": "Young professionals moving in, trendy restaurants opening, rent increases in older buildings",
                "vacancy_or_decay": "Low vacancy rates, building renovations common, minimal decay",
                "image_prompt": "Construction sites and new projects near the address showing modern developments",
                "image_prompt_2": "Trendy new developments near the address attracting young professionals"
            }
        else:
            return {
                "upcoming_changes": "New transit line planned for 2026, waterfront redevelopment project, park expansion",
                "zoning_or_construction": "Mixed-use development under construction, residential zoning allows ADUs, height limits preserved",
                "gentrification_signs": "Rising property values, new upscale businesses, longtime residents being displaced",
                "vacancy_or_decay": "Low vacancy rates, well-maintained properties, minimal urban decay",
                "image_prompt": "Development activity near the address showing current construction projects",
                "image_prompt_2": "Neighborhood infrastructure near the address: transit and road improvements"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate field descriptions for Development based on user preferences."""
        income = user_preferences.get("gross_income", 'middle') if user_preferences else 'middle'
        occupation = user_preferences.get("occupation", 'balanced') if user_preferences else 'balanced'
        
        return {
            "upcoming_changes": "Search city planning sites, '[city] development projects', or local news. Look for major infrastructure, transit, or commercial projects.",
            "zoning_or_construction": "Check city zoning maps, building permits, or construction notices. Use Google Maps satellite view to spot active construction sites.",
            "gentrification_signs": "Look for rising rents, new upscale businesses, demographic shifts. Search '[neighborhood] gentrification' or check local forums for resident discussions.",
            "vacancy_or_decay": "Use Google Street View to assess building conditions, vacant lots, or boarded storefronts. Check local crime or economic indicators.",
            "image_prompt": "Development activity and construction sites near the address",
            "image_prompt_2": "Future development sites near the address showing planned improvements"
        }



class EnvironmentUtilities(BaseModel):
    model_config = {
        "populate_by_name": True,  # ensures alias fields can be populated
        "extra": "ignore",  # Perplexity may return extra fields
    }
        
    air_quality: str = Field(...)
    noise_pollution: str = Field(...)
    light_pollution: str = Field(...)
    water_quality: str = Field(...)
    internet_speed: str = Field(...)
    environmental_rating: str = Field(...)
    
    # Flattened UtilityCosts fields
    utility_electricity: str = Field(..., description="Average monthly electricity cost")
    utility_gas: str = Field(..., description="Average monthly gas cost")
    utility_water: str = Field(..., description="Average monthly water cost")
    utility_internet: str = Field(..., description="Average monthly internet cost")
    utility_trash: Optional[str] = Field(None, description="Average monthly trash/recycling cost")
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example EnvironmentUtilities data based on user preferences."""
        income = user_preferences.get("gross_income", 'middle')
        occupation = user_preferences.get("occupation", 'balanced')
        work_from_home = False
        
        if income in ['high', 'very_high']:
            return {
                "air_quality": "Excellent - AQI typically 25-40, minimal pollution, clean ocean air",
                "noise_pollution": "Low - Quiet residential area, minimal traffic, sound barriers on major roads",
                "light_pollution": "Low - Excellent night sky visibility, thoughtful lighting design",
                "water_quality": "Premium - Exceeds EPA standards, filtered municipal supply, excellent taste",
                "utility_electricity": "$180",
                "utility_gas": "$65",
                "utility_water": "$45",
                "utility_internet": "$95",
                "utility_trash": "$25",
                "internet_speed": "Fiber available up to 2Gbps, premium service providers, 99.9% uptime",
                "environmental_rating": "9.2/10"
            }
        elif work_from_home or occupation == 'remote':
            return {
                "air_quality": "Good - AQI typically 35-50, clean air with minimal industrial pollution",
                "noise_pollution": "Low to moderate - Quiet during work hours, some evening activity",
                "light_pollution": "Moderate - Some night sky visibility, residential lighting",
                "water_quality": "Excellent - Meets all EPA standards, good taste, reliable supply",
                "utility_electricity": "$140",
                "utility_gas": "$50",
                "utility_water": "$40",
                "utility_internet": "$85",
                "utility_trash": "$25",
                "internet_speed": "Fiber available up to 1Gbps, multiple high-speed options, reliable for remote work",
                "environmental_rating": "8.8/10"
            }
        else:
            return {
                "air_quality": "Good - AQI typically 45-65, minimal smog, ocean breeze helps circulation",
                "noise_pollution": "Moderate - Some traffic noise on main roads, generally quiet residential streets",
                "light_pollution": "Low to moderate - Can see some stars, street lighting present but not excessive",
                "water_quality": "Excellent - Meets all EPA standards, tastes good, no boil advisories in recent years",
                "utility_electricity": "$120",
                "utility_gas": "$45",
                "utility_water": "$35",
                "utility_internet": "$65",
                "utility_trash": "$20",
                "internet_speed": "Fiber available up to 1Gbps, cable up to 500Mbps, multiple provider options",
                "environmental_rating": "8.4/10"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate field descriptions for EnvironmentUtilities based on user preferences."""
        work_from_home = False if user_preferences else False
        occupation = user_preferences.get("occupation", 'balanced') if user_preferences else 'balanced'
        
        return {
            "air_quality": "Check EPA AirNow or IQAir for AQI data. Look for industrial sources, traffic patterns, or natural factors affecting air quality.",
            "noise_pollution": "Use Google Street View to assess traffic volume, proximity to airports/highways. Check local noise ordinances or community complaints.",
            "light_pollution": "Use Dark Site Finder or Light Pollution Map. Consider street lighting, commercial areas, and night sky visibility.",
            "water_quality": "Check EPA Safe Drinking Water database or local water utility reports. Look for recent violations or boil advisories.",
            "utility_electricity": "Average monthly electricity cost for homes in this area. Search '[city] average utility costs' or check local utility company websites.",
            "utility_gas": "Average monthly gas/heating cost for homes in this area. May vary significantly by season in some regions.",
            "utility_water": "Average monthly water cost for homes in this area. May include sewage and stormwater fees in some municipalities.",
            "utility_internet": "Average monthly internet service cost in this area. Important for remote work and modern connectivity needs.",
            "utility_trash": "Average monthly trash/recycling collection cost if not included in property taxes or HOA fees.",
            "internet_speed": "Use Speedtest.net coverage maps or check ISP availability. Important for remote work and modern connectivity needs.",
            "environmental_rating": "Overall environmental quality score out of 10. Weight factors based on user's work-from-home needs and occupation preferences."
        }

class FinancialInformation(BaseModel):
    monthly_payment: str = Field(...)
    property_taxes: str = Field(...)
    value_assessment: str = Field(...)
    investment_potential: str = Field(...)
    financial_rating: str = Field(...)
    
    model_config = {
        "populate_by_name": True,  # ensures alias fields can be populated
        "extra": "ignore",  # Perplexity may return extra fields
    }

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example FinancialInformation data based on user preferences."""
        income = user_preferences.get("gross_income", 'middle')
        
        # Get budget range
        budget_min = user_preferences.get("home_budget_min")
        budget_max = user_preferences.get("home_budget_max")
        if budget_min and budget_max:
            price_range = f"${int(budget_min):,}-${int(budget_max):,}"
        else:
            price_range = '$300,000-$500,000'
        
        if income in ['high', 'very_high']:
            return {
                "monthly_payment": "$5,800/month for luxury home price with 20% down, 30-year fixed at 6.5%",
                "property_taxes": "1.4% effective rate, approximately $14,000/year for high-value properties",
                "value_assessment": "Premium market with 12% annual growth, exclusive inventory, well above city average",
                "investment_potential": "Excellent - Luxury market resilience, high-end development pipeline, rental yields 3-4%",
                "financial_rating": "9.3/10"
            }
        elif income in ['low', 'very_low']:
            return {
                "monthly_payment": "$1,800/month for starter home with FHA loan, 3.5% down, 30-year fixed at 6.8%",
                "property_taxes": "0.9% effective rate, approximately $3,600/year for modest home value",
                "value_assessment": "Steady growth at 5% annually, affordable housing options, entry-level market",
                "investment_potential": "Moderate - Stable appreciation, first-time buyer programs, rental yields 6-7%",
                "financial_rating": "7.2/10"
            }
        else:
            return {
                "monthly_payment": "$3,200/month for median home price with 20% down, 30-year fixed at 6.5%",
                "property_taxes": "1.2% effective rate, approximately $7,200/year for median home value",
                "value_assessment": "Values increased 8% last year, strong market with low inventory, above city average",
                "investment_potential": "High - Growing tech sector, planned transit improvements, rental yields 4-5%",
                "financial_rating": "8.7/10"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        gross_income = user_preferences.get("gross_income", '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        # Get budget range
        if user_preferences:
            budget_min = user_preferences.get("home_budget_min")
            budget_max = user_preferences.get("home_budget_max")
            if budget_min and budget_max:
                home_budget = f"${int(budget_min):,}-${int(budget_max):,}"
            else:
                home_budget = '$300,000-$500,000'
        else:
            home_budget = '$300,000-$500,000'
        
        return {
            "monthly_payment": f"Estimated monthly mortgage payment for typical home in the area. Consider user's income range ({gross_income}) and preferred price range ({home_budget}) when providing context.",
            "property_taxes": "Annual property tax rates and typical amounts. Relate to user's financial capacity and budget expectations.",
            "value_assessment": "Property value trends and market assessment. Frame in context of user's investment timeline and financial goals.",
            "investment_potential": "Long-term investment outlook and rental potential. Consider user's investment experience and risk tolerance.",
            "financial_rating": "Overall financial attractiveness score out of 10. Weight factors based on user's financial priorities and constraints."
        }

class Schools(BaseModel):
    preschool_name: Optional[str] = Field(None, description="Name of the nearest preschool")
    preschool_known_for: Optional[str] = Field(None, description="Unique strengths, curriculum, or values of the preschool")
    preschool_rating: Optional[str] = Field(None, description="Letter grade rating of the preschool (e.g., A+, B-, etc.)")

    elementary_name: Optional[str] = Field(None, description="Name of the elementary school")
    elementary_known_for: Optional[str] = Field(None, description="Special programs or standout features of the elementary school")
    elementary_rating: Optional[str] = Field(None, description="Letter grade rating of the elementary school (e.g., A, B+, etc.)")

    middle_name: Optional[str] = Field(None, description="Name of the middle school")
    middle_known_for: Optional[str] = Field(None, description="Special programs or standout features of the middle school")
    middle_rating: Optional[str] = Field(None, description="Letter grade rating of the middle school (e.g., A, B, etc.)")

    high_name: Optional[str] = Field(None, description="Name of the high school")
    high_known_for: Optional[str] = Field(None, description="Special programs or standout features of the high school")
    high_rating: Optional[str] = Field(None, description="Letter grade rating of the high school (e.g., A+, B-, etc.)")

    model_config = {
        "populate_by_name": True,
        "extra": "ignore"
    }

    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        pets = user_preferences.get("pets", 0)
        income = user_preferences.get("gross_income", "middle")

        if pets and pets.lower() in ["dog", "dogs", "cat", "cats"]:
            return {
                "preschool_name": "Bright Start Preschool",
                "preschool_known_for": "Montessori-inspired curriculum, nurturing staff, strong parent community",
                "preschool_rating": "A",

                "elementary_name": "Prestigious Academy Elementary",
                "elementary_known_for": "Mandarin immersion, STEM labs, gifted & talented program",
                "elementary_rating": "A+",

                "middle_name": "Excellence Prep Middle School",
                "middle_known_for": "Pre-AP tracks, robotics team, leadership workshops",
                "middle_rating": "A",

                "high_name": "Summit High School",
                "high_known_for": "IB diploma program, championship sports, diverse electives",
                "high_rating": "A-"
            }
        else:
            return {
                "preschool_name": None,
                "preschool_known_for": None,
                "preschool_rating": None,

                "elementary_name": "Seaside Elementary",
                "elementary_known_for": "Hands-on science, arts enrichment, strong PTA",
                "elementary_rating": "A",

                "middle_name": "Maple Grove Middle",
                "middle_known_for": "Supportive environment, wide extracurriculars",
                "middle_rating": "B+",

                "high_name": None,
                "high_known_for": None,
                "high_rating": None
            }

    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        pets = user_preferences.get("pets", 0) if user_preferences else 0

        base = {
            "preschool_name": "Name of the nearest preschool. Prioritize proximity and reputation for early childhood development.",
            "preschool_known_for": "Key strengths, values, or curriculum style (e.g., Montessori, bilingual).",
            "preschool_rating": "Overall letter grade rating (e.g., A+, B-, etc.), based on reviews or GreatSchools data.",

            "elementary_name": "Name of the elementary school serving the address. Include notable characteristics.",
            "elementary_known_for": "Academic programs, after-school activities, or community reputation.",
            "elementary_rating": "Letter grade rating (e.g., A, B, C+). Reflect overall quality or performance.",

            "middle_name": "Name of the middle school in the area. Note proximity and reputation.",
            "middle_known_for": "Programs like STEM, arts, debate, or language immersion.",
            "middle_rating": "Letter grade rating based on academic reputation or reviews.",

            "high_name": "Name of the high school zoned for the address.",
            "high_known_for": "College prep, athletics, AP/IB programs, or other standout features.",
            "high_rating": "Letter grade rating representing overall perceived quality."
        }

        if pets == 0:
            # Soften descriptions for buyers without school-aged children
            base["elementary_known_for"] += " Focus on general neighborhood perception."
            base["middle_known_for"] += " Focus on safety and extracurricular balance."
            base["high_known_for"] += " Consider college readiness and neighborhood pride."

        return base

class ExtraTips(BaseModel):
    parking: str = Field(...)
    pet_friendly: str = Field(...)
    cell_service_quality: str = Field(...)
    other_notable_tips: str = Field(...)
    
    model_config = {
        "populate_by_name": True,  # ensures alias fields can be populated
        "extra": "ignore",  # Perplexity may return extra fields
    }

    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example ExtraTips data based on user preferences."""
        occupation = user_preferences.get("occupation", 'balanced')
        has_pets = user_preferences.get('has_pets', False)
        work_from_home = False
        
        if has_pets:
            pet_info = "Extremely pet-friendly - 5 dog parks within walking distance, off-leash beach area, pet grooming services, dog-friendly cafes and breweries"
        else:
            pet_info = "Pet-friendly neighborhood - dog parks available, many residents have pets, vet clinic nearby"
        
        if work_from_home:
            cell_info = "Outstanding connectivity - 5G coverage from all carriers, fiber internet backup options, co-working spaces with reliable WiFi"
            tips = "Best coffee for remote work at Quiet Corner Cafe, library has excellent WiFi, avoid construction noise on Oak St 9-11am"
        elif occupation == 'nightlife':
            tips = "Best late-night eats at 24/7 Diner, Uber/Lyft readily available, street lighting excellent for safety, noise ordinance until 2am"
        elif occupation == 'family':
            tips = "Best family coffee at Corner Cafe, avoid Main St during school pickup 3-4pm, farmers market Saturdays 8am-2pm, library story time Wednesdays"
        else:
            tips = "Best coffee at Corner Cafe, avoid Main St during school pickup, farmers market Saturdays 8am-2pm"
        
        return {
            "parking": "Street parking mostly free, 2-hour limits near shops, resident permits available for $50/year",
            "pet_friendly": pet_info,
            "cell_service_quality": "Excellent coverage for all major carriers, 5G available, minimal dead zones" if not work_from_home else cell_info,
            "other_notable_tips": tips
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate field descriptions for ExtraTips based on user preferences."""
        occupation = user_preferences.get("occupation", 'balanced') if user_preferences else 'balanced'
        has_pets = user_preferences.get('has_pets', False) if user_preferences else False
        
        return {
            "parking": "Street parking rules, permit requirements, garage availability. Use Google Street View to assess parking density and local parking signs.",
            "pet_friendly": "Dog parks, pet stores, veterinarians, pet policies. Search '[neighborhood] dog park' or use Google Maps to find pet amenities.",
            "cell_service_quality": "Coverage quality for major carriers. Check carrier coverage maps or local forums for dead zone reports.",
            "other_notable_tips": "Local insider knowledge, best times to visit places, hidden gems, traffic patterns. Use local forums, Reddit, or Nextdoor for community insights."
        }

# ============================================================================
# NEW 8-SECTION MODELS (Consolidated from old sections)
# ============================================================================

class Affordability(BaseModel):
    """Affordability, taxes, long-term costs, projected value"""
    affordability_rating: str = Field(..., description="Overall affordability score as decimal to tenths place (e.g., 8.5, 7.2). This must be the first field and extremely brief.")
    monthly_payment: str = Field(..., description="Estimated monthly mortgage payment for typical home in the area. Extremely brief.")
    property_taxes: str = Field(..., description="Annual property tax rates and typical amounts. Extremely brief.")
    long_term_costs: str = Field(..., description="Long-term cost considerations including maintenance, HOA, insurance. Extremely brief.")
    projected_value: str = Field(..., description="Property value trends and projected appreciation/depreciation. Extremely brief.")
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate example based on user preferences"""
        income = user_preferences.get("gross_income", 'middle') if user_preferences else 'middle'
        budget_min = user_preferences.get("home_budget_min") if user_preferences else None
        budget_max = user_preferences.get("home_budget_max") if user_preferences else None
        
        if budget_min and budget_max:
            price_range = f"${int(budget_min):,}-${int(budget_max):,}"
        else:
            price_range = '$300,000-$500,000'
        
        return {
            "affordability_rating": "8.7",
            "monthly_payment": f"$3,200/month for median home in {price_range} with 20% down, 30-year fixed at 6.5%",
            "property_taxes": "1.2% effective rate, approximately $7,200/year for median home value",
            "long_term_costs": "Annual maintenance ~$4,000, HOA $200/month, insurance $1,500/year. Total annual costs ~$15,000",
            "projected_value": "Values increased 8% last year, strong market with low inventory, projected 5-7% annual growth"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions"""
        gross_income = user_preferences.get("gross_income", '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        budget_min = user_preferences.get("home_budget_min") if user_preferences else None
        budget_max = user_preferences.get("home_budget_max") if user_preferences else None
        if budget_min and budget_max:
            home_budget = f"${int(budget_min):,}-${int(budget_max):,}"
        else:
            home_budget = '$300,000-$500,000'
        
        return {
            "affordability_rating": "Overall affordability score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's financial priorities and constraints.",
            "monthly_payment": f"Estimated monthly mortgage payment for typical home in the area. Extremely brief. Consider user's income ({gross_income}) and budget ({home_budget}).",
            "property_taxes": "Annual property tax rates and typical amounts. Extremely brief. Relate to user's financial capacity.",
            "long_term_costs": "Long-term cost considerations including maintenance, HOA fees, insurance, and utilities. Extremely brief. Frame in context of user's budget.",
            "projected_value": "Property value trends and projected appreciation/depreciation. Extremely brief. Consider market conditions and user's investment timeline."
        }

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

class FamilyFriendlySection(BaseModel):
    """Schools, parks, healthcare, kid-friendly amenities"""
    family_rating: str = Field(..., description="Overall family-friendliness score as decimal to tenths place (e.g., 8.5, 7.2). This must be the first field and extremely brief.")
    parks_and_recreation: str = Field(..., description="Parks, playgrounds, and recreational facilities. Extremely brief.")
    kid_friendly_amenities: str = Field(..., description="Kid-friendly amenities and activities. Extremely brief.")
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate example based on user preferences"""
        pets = user_preferences.get("pets", 0) if user_preferences else 0
        
        return {
            "family_rating": "9.2",
            "parks_and_recreation": "3 parks within 1 mile, playgrounds, sports fields, community center with programs",
            "kid_friendly_amenities": "Libraries, museums, family events, safe pedestrian areas, bike paths"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions"""
        pets = user_preferences.get("pets", 0) if user_preferences else 0
        
        return {
            "family_rating": "Overall family-friendliness score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's family needs.",
            "schools_rating": "Overall school quality rating as decimal to tenths place (e.g., 8.5, 7.2). Extremely brief. Based on test scores, programs, and reputation.",
            "school_details": "Details about nearby schools including ratings, special programs, and standout features. Extremely brief.",
            "parks_and_recreation": "Parks, playgrounds, recreational facilities, and family activities available. Extremely brief.",
            "healthcare_access": "Healthcare facilities including hospitals, clinics, pediatric care, and urgent care. Extremely brief.",
            "kid_friendly_amenities": "Kid-friendly amenities including libraries, museums, safe areas, and activities. Extremely brief."
        }

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

class ClimateEnvironmentalSafety(BaseModel):
    """Climate preference, flood/fire/hurricane risk"""
    climate_rating: str = Field(..., description="Overall climate and environmental safety score as decimal to tenths place (e.g., 8.5, 7.2). This must be the first field and extremely brief.")
    climate: str = Field(..., description="Climate characteristics and weather patterns. Extremely brief.")
    flood_risk: str = Field(..., description="Flood risk assessment and flood zones. Extremely brief.")
    fire_risk: str = Field(..., description="Fire risk assessment and wildfire danger. Extremely brief.")
    hurricane_risk: str = Field(..., description="Hurricane/tornado risk assessment. Extremely brief.")
    environmental_safety: str = Field(..., description="Overall environmental safety and natural disaster risk. Extremely brief.")
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate example based on user preferences"""
        return {
            "climate_rating": "9.0",
            "climate": "Mediterranean climate: mild winters, warm summers, low humidity, 280 sunny days/year",
            "flood_risk": "Low flood risk: not in flood zone, good drainage, elevated above sea level",
            "fire_risk": "Moderate fire risk: some brush areas, but good fire department response, defensible space",
            "hurricane_risk": "Very low hurricane risk: outside hurricane zone, minimal severe weather",
            "environmental_safety": "Good air quality, low pollution, safe water supply, minimal environmental hazards"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions"""
        return {
            "climate_rating": "Overall climate and environmental safety score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight factors based on user's preferences.",
            "climate": "Climate characteristics including temperature, precipitation, and weather patterns. Extremely brief.",
            "flood_risk": "Flood risk assessment including flood zones, historical flooding, and mitigation measures. Extremely brief.",
            "fire_risk": "Fire risk assessment including wildfire danger, defensible space, and fire department response. Extremely brief.",
            "hurricane_risk": "Hurricane/tornado risk assessment and severe weather patterns. Extremely brief.",
            "environmental_safety": "Overall environmental safety including air quality, water quality, and natural disaster risk. Extremely brief."
        }

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

class Home(BaseModel):
    """Features, layout, condition, style, deal breakers"""
    home_match_rating: str = Field(..., description="Overall home match score as decimal to tenths place (e.g., 8.5, 7.2). This must be the first field and extremely brief.")
    desired_features_match: str = Field(..., description="How well the home matches user's preferred home features. Extremely brief.")
    deal_breakers_check: str = Field(..., description="Assessment of any deal breakers present or absent. Extremely brief.")
    layout_and_size: str = Field(..., description="Bedrooms, bathrooms, square footage, and layout match to preferences. Extremely brief.")
    condition_and_style: str = Field(..., description="Home age, architectural style, renovation needs, and overall condition. Extremely brief.")
    property_features: str = Field(..., description="Lot size, parking, outdoor space, and other property-specific features. Extremely brief.")
    
    model_config = {
        "populate_by_name": True,
        "extra": "ignore",
    }
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate example based on user preferences"""
        preferred_features = user_preferences.get("preferred_home_features", []) if user_preferences else []
        deal_breakers = user_preferences.get("deal_breakers", []) if user_preferences else []
        bedrooms = user_preferences.get("preferred_bedrooms", 3) if user_preferences else 3
        bathrooms = user_preferences.get("preferred_bathrooms", 2) if user_preferences else 2
        
        features_match = "Matches most desired features" if preferred_features else "Standard features present"
        if preferred_features:
            features_match = f"Has {', '.join(preferred_features[:3])}" + (f" and more" if len(preferred_features) > 3 else "")
        
        deal_breaker_check = "No major deal breakers present" if not deal_breakers else f"Note: Check for {', '.join(deal_breakers[:2])}"
        
        return {
            "home_match_rating": "8.5",
            "desired_features_match": features_match,
            "deal_breakers_check": deal_breaker_check,
            "layout_and_size": f"{bedrooms} bedrooms, {bathrooms} bathrooms, layout matches preferences",
            "condition_and_style": "Well-maintained, modern updates, matches preferred architectural style",
            "property_features": "Good lot size, driveway parking, fenced yard, outdoor space"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions"""
        preferred_features = user_preferences.get("preferred_home_features", []) if user_preferences else []
        deal_breakers = user_preferences.get("deal_breakers", []) if user_preferences else []
        bedrooms = user_preferences.get("preferred_bedrooms") if user_preferences else None
        bathrooms = user_preferences.get("preferred_bathrooms") if user_preferences else None
        housing_type = user_preferences.get("preferred_housing_type", "") if user_preferences else ""
        home_age = user_preferences.get("preferred_home_age", "") if user_preferences else ""
        architectural_style = user_preferences.get("preferred_architectural_style", "") if user_preferences else ""
        renovation_preference = user_preferences.get("renovation_preference", "") if user_preferences else ""
        lot_size = user_preferences.get("preferred_lot_size", "") if user_preferences else ""
        
        features_text = f"User wants: {', '.join(preferred_features)}" if preferred_features else "No specific features requested"
        deal_breakers_text = f"User's deal breakers: {', '.join(deal_breakers)}" if deal_breakers else "No deal breakers specified"
        
        return {
            "home_match_rating": "Overall home match score as decimal to tenths place (e.g., 8.5, 7.2). Must be extremely brief - just the decimal number. Weight based on how well home matches user's preferences.",
            "desired_features_match": f"How well the home matches user's preferred features. {features_text}. Extremely brief.",
            "deal_breakers_check": f"Assessment of any deal breakers present or absent. {deal_breakers_text}. Extremely brief.",
            "layout_and_size": f"Bedrooms, bathrooms, square footage, and layout match to preferences. User wants: {bedrooms} bedrooms, {bathrooms} bathrooms, {housing_type}. Extremely brief.",
            "condition_and_style": f"Home age, architectural style, renovation needs, and overall condition. User prefers: {home_age} age, {architectural_style} style, {renovation_preference} renovation level. Extremely brief.",
            "property_features": f"Lot size, parking, outdoor space, and other property-specific features. User prefers: {lot_size} lot size. Extremely brief."
        }

class FullReport(BaseModel):
    # === New 8-section structure (primary) ===
    affordability: Optional[Affordability] = None
    neighborhood: Optional[Neighborhood] = None
    commute: Optional[CommuteSection] = None
    family_friendly: Optional[FamilyFriendlySection] = None
    entertainment: Optional[Entertainment] = None
    investment: Optional[Investment] = None
    climate_environmental_safety: Optional[ClimateEnvironmentalSafety] = None
    convenience_walkability: Optional[ConvenienceWalkability] = None
    home: Optional[Home] = None
    
    # === Demographic data (appears directly after neighborhood_overview without section titles) ===
    lifestyle_dna: Optional[LifestyleDNA] = None
    
    # === Legacy sections (for backward compatibility - deprecated) ===
    neighborhood_overview: Optional[NeighborhoodOverview] = None
    safety: Optional[Safety] = None
    culture_and_events: Optional[CultureAndEvents] = None
    social_character: Optional[SocialCharacter] = None
    local_amenities: Optional[LocalAmenities] = None
    commute_legacy: Optional[Commute] = None
    family_friendly_legacy: Optional[FamilyFriendly] = None
    nightlife_and_dating: Optional[NightlifeAndDating] = None
    development: Optional[Development] = None
    environment_utilities: Optional[EnvironmentUtilities] = None
    financial_information: Optional[FinancialInformation] = None
    schools: Optional[Schools] = None
    extra_tips: Optional[ExtraTips] = None

    # === Internal field (not part of schema) ===
    _prioritized_fields: List[str] = PrivateAttr(default=[])

    model_config = {
    "populate_by_name": True,  # ensures alias fields can be populated
    "extra": "ignore",  # Perplexity may return extra fields
}


    # ✅ Modern init with PrivateAttr
    def __init__(self, report_section_priorities: Dict[str, Any], **data):
        super().__init__(**data)
        self._prioritized_fields = report_section_priorities.get("report_section_priorities", [])

    # ✅ Dict override to only return prioritized sections
    def dict(self, **kwargs) -> Dict[str, Any]:
        base_dict = super().dict(**kwargs)
        final_dict = {}

        for key in self._prioritized_fields:
            if key not in base_dict:
                continue
            
            # Include the key regardless of whether it's None or has a value
            final_dict[key] = base_dict[key]

        return final_dict