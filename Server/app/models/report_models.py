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
        description="How emblematic the area is of an artistic or creative lifestyle. "
                    "Score high (80–100) for vibrant art, music, studios, and cultural events. "
                    "Score 0–20 if there's no visible creative or indie scene."
    )
    professional: int = Field(
        ge=0, le=100,
        description="How aligned the area is with white-collar, business-focused lifestyles. "
                    "Score 100 for financial districts and business culture. "
                    "Score 0 if the area has no professional presence or appeal."
    )
    family_oriented: int = Field(
        ge=0, le=100,
        description="How well the area supports families. "
                    "Score high for schools, parks, low crime, and spacious homes. "
                    "Score 0 if it's nightlife-heavy, cramped, or transient."
    )
    active_outdoor: int = Field(
        ge=0, le=100,
        description="How well the area supports fitness and outdoor lifestyles. "
                    "Score 100 for hiking, biking, surfing, gym culture, and green space. "
                    "Score low if it's concrete, flat, or inactive."
    )
    tech_remote: int = Field(
        ge=0, le=100,
        description="How well-suited the area is for remote tech professionals. "
                    "Score high for coworking, startups, cafes, modern apartments, fast Wi-Fi. "
                    "Score 0 if it lacks digital infrastructure or a tech scene."
    )
    retiree: int = Field(
        ge=0, le=100,
        description="How ideal the area is for retirees. "
                    "Score high for peace, slow pace, nature, and medical access. "
                    "Score low if it's noisy, chaotic, or youthful."
    )
    student: int = Field(
        ge=0, le=100,
        description="How strong the student presence is. "
                    "Score high near colleges, dorms, bars, and cheap eats. "
                    "Score 0 if there's no academic or youth culture nearby."
    )
    suburban: int = Field(
        ge=0, le=100,
        description="How suburban the layout and feel is. "
                    "Score 100 for detached homes, cul-de-sacs, big yards. "
                    "Score 0 for dense, walkable, or urban areas."
    )
    urban: int = Field(
        ge=0, le=100,
        description="How urban the area feels. "
                    "Score high for density, walkability, transit, and city energy. "
                    "Score 0 if it's rural, spread out, or car-centric."
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
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        return {
            "local_culture": f"Artistic and laid-back coastal community with a focus on marine activities. This aligns with the user lifestyle: {lifestyle}.",
            "vibe": "Creative, beachy, relaxed",
            "known_for": "Beaches, surfing, whale watching, and Dana Point Harbor",
            "community_events": "Weekly farmers market, summer concerts, Festival of Whales",
            "what_people_love": "Walkability, coastal charm, outdoor activities",
            "things_to_watch_out_for": "Crowds in summer, limited parking, weekend traffic",
            "image_prompt": "Aerial satellite view of the specific neighborhood around the address, showing the actual street layout, housing density, parks, and local landmarks that define this area",
            "image_prompt_2": "Street-level photo of the main residential streets and community character around the address, showing typical homes, sidewalks, landscaping, and neighborhood atmosphere",
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
        """Generate personalized example based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        safety_focus = "family-friendly areas with good lighting and school zones" if children_count > 0 else "well-lit streets and secure areas"
        
        return {
            "crime_rating": "Low",
            "places_to_watch_out_for": "Main St after 10pm, parking lots near the train station, avoid the alley behind 5th Ave",
            "police_presence": "Regular patrol cars, community policing program, quick response times",
            "safety_rating": "7.8/10",
            "image_prompt": "Well-lit residential streets around the address showing sidewalks, street lamps, and visible security features in this specific neighborhood",
            "image_prompt_2": "Safety infrastructure around the address: security cameras, emergency call boxes, neighborhood watch signs, and police patrol presence in this specific area"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        # Consider user's safety concerns if they have children
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        safety_focus = "family safety" if children_count > 0 else "general safety"
        
        return {
            "crime_rating": "Crime level assessment using categories: Nonexistent, Low, Moderate, High, Very High. Base on local crime statistics, police reports, and community safety data. Use sources like local police department crime maps, Neighborhood Scout, or AreaVibes crime data. Focus on safety factors most relevant to user's situation.",
            "places_to_watch_out_for": "Specific areas, intersections, or locations with higher risk or safety concerns. Include times of day when relevant. Use local knowledge from City-Data forums, Nextdoor, or police reports. Be specific with street names and locations. Prioritize areas relevant to user's daily routines and family needs.",
            "police_presence": "Describe frequency and visibility of police patrols, community policing programs, and response times. Source from local police department websites, community meetings, or resident feedback on Nextdoor/City-Data. Emphasize community policing and response times.",
            "safety_rating": "Overall safety score out of 10 based on crime data, community perception, and safety infrastructure. Use data from AreaVibes, Neighborhood Scout, or local crime statistics. Format as 'X.X/10'. Weight factors based on user's safety priorities.",
            "image_prompt": f"Crime map of the city showing safety statistics, incident reports, and crime density for this specific neighborhood around the address (emphasizing {safety_focus} safety concerns).",
            "image_prompt_2": f"Street-level photo of safety infrastructure in this neighborhood: well-lit streets, security cameras, police patrol presence, and neighborhood watch signs around the address (focusing on {safety_focus} safety features)."
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
        """Generate personalized example based on user preferences"""
        hobbies = user_preferences.get('hobbies_interests', ['outdoor activities']) if user_preferences else ['outdoor activities']
        hobbies_str = ', '.join(hobbies) if isinstance(hobbies, list) else str(hobbies)
        
        return {
            "local_events": "Art walks, food truck festivals, outdoor movie nights, farmers markets",
            "seasonal_trends": "Busy summers with beach events, quieter winters with indoor cultural activities",
            "community_engagement": "Active neighborhood watch, volunteer cleanup days, high voter turnout",
            "culture_rating": "8.5/10",
            "image_prompt": "Photo of actual cultural events and festivals happening in the city near the address, showing local community gatherings, street fairs, or seasonal celebrations specific to this neighborhood",
            "image_prompt_2": "Photo of cultural venues and event spaces in the city around the address: local theaters, art galleries, community centers, or performance venues that serve this neighborhood"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        hobbies = user_preferences.get('hobbies_interests', ['outdoor activities']) if user_preferences else ['outdoor activities']
        hobbies_str = ', '.join(hobbies) if isinstance(hobbies, list) else str(hobbies)
        
        return {
            "local_events": f"Events people attend — use names or examples. Search Eventbrite, Meetup, City-Data Forums for specific events. Focus on events that align with user's interests: {hobbies_str}. Include real event names and venues when possible.",
            "seasonal_trends": "How activity changes throughout the year, e.g., 'Busy in summer, quieter winters'. Check Nomad List or blog search results for seasonal patterns. Consider how seasons affect the user's preferred activities and lifestyle.",
            "community_engagement": "Civic participation level (e.g., cleanup days, local watch groups). Mention if visible on Meetup or community forums. Assess opportunities for user involvement based on their community involvement preferences.",
            "culture_rating": "Score should reflect vibrancy and access. Weigh frequency and diversity of events, Eventbrite density is a clue for cultural activity. Rate based on cultural factors that matter most to the user's interests and lifestyle.",
            "image_prompt": "Photo of actual cultural venues, event spaces, or community gathering places in the city around the address, showing the specific locations where local events and activities take place.",
            "image_prompt_2": "Photo of local cultural infrastructure in the city near the address: art galleries, theaters, community centers, libraries, or performance venues that serve this neighborhood."
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
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "income_level": "Middle-class professionals and young families, median household income $75,000",
            "religiosity": "Moderate - several churches and temples, but not overly conservative",
            "cultural_tone": "Laid-back but proud, environmentally conscious, welcoming to newcomers",
            "social_rating": "8.2/10",
            "image_prompt": "Photo of local community spaces and social gathering areas in the city around the address, showing where residents interact and socialize in this specific neighborhood",
            "image_prompt_2": "Photo of religious buildings, community centers, local coffee shops, or social venues in the city near the address that reflect the neighborhood's social and cultural character"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "income_level": f"E.g., 'Middle-class professionals'. Use Niche or AreaVibes income distribution. Consider how the income levels align with user's financial situation ({income_range}) and social comfort.",
            "political_leaning": "State clearly. Use Niche political maps or Redfin voting overlays if accessible.",
            "language_spoken": "Include major spoken languages beyond English. Niche + City-Data often break this down.",
            "religiosity": "Low / Moderate / High — explain the tone. Use BestPlaces religion % or Niche. Assess compatibility with user's spiritual preferences and tolerance for religious influence.",
            "cultural_tone": "Summary of vibe ('laid-back but proud'). Pull from Google Maps reviews or Niche user feedback. Focus on cultural aspects that match user's social preferences and values.",
            "social_rating": "Reflects inclusivity, education, worldview. Niche 'diversity' and 'community' scores are good proxies. Weight factors based on user's social priorities and community involvement preferences.",
            "image_prompt": "Photo of community spaces, local businesses, and neighborhood gathering areas in the city around the address that reflect the social character and daily life of this specific area.",
            "image_prompt_2": "Photo of religious institutions, community centers, local cafes, or social venues in the city near the address that demonstrate the neighborhood's cultural and social diversity."
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
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        income = user_preferences.get('income_range', 'middle')
        
        if lifestyle == 'nightlife' and income in ['high', 'very_high']:
            return {
                "name": "The Rooftop Lounge",
                "vibe": "Upscale cocktail bar with city skyline views and live DJ sets",
                "what_to_try": "Craft cocktails, wagyu sliders, truffle fries"
            }
        elif lifestyle == 'family' or user_preferences.get('children_count', 0) > 0:
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
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        dining_prefs = user_preferences.get('dining_preferences', []) if user_preferences else []
        dining_str = ', '.join(dining_prefs) if isinstance(dining_prefs, list) else str(dining_prefs)
        
        if lifestyle == 'nightlife':
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on trendy spots, late-night dining, and social venues that align with an active nightlife lifestyle. Consider user's dining preferences: {dining_str}."
        elif lifestyle == 'family':
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
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        age = user_preferences.get('age', 30)
        children = user_preferences.get('children_count', 0)
        
        if lifestyle == 'active' or age < 35:
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
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        children = user_preferences.get('children_count', 0) if user_preferences else 0
        hobbies = user_preferences.get('hobbies_interests', []) if user_preferences else []
        hobbies_str = ', '.join(hobbies) if isinstance(hobbies, list) else str(hobbies)
        
        if lifestyle == 'active':
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on activities that promote an active lifestyle, including sports, fitness activities, and outdoor adventures. Consider user's interests: {hobbies_str}."
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
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        children = user_preferences.get('children_count', 0)
        
        if lifestyle == 'active':
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
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        children = user_preferences.get('children_count', 0) if user_preferences else 0
        fitness_activities = user_preferences.get('fitness_activities', []) if user_preferences else []
        fitness_str = ', '.join(fitness_activities) if isinstance(fitness_activities, list) else str(fitness_activities)
        
        if lifestyle == 'active':
            return f"Include real or believable names, vibes, and features. Use Google Maps and Yelp as top sources. Focus on parks with recreational facilities, fitness amenities, and outdoor activity options that support an active lifestyle. Consider user's fitness interests: {fitness_str}."
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
        commute_tolerance = user_preferences.get('commute_tolerance', 'under_30')
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        
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
        commute_tolerance = user_preferences.get('commute_tolerance', 'under_30') if user_preferences else 'under_30'
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
        children_count = user_preferences.get('children_count', 0)
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        
        if children_count > 2:
            return {
                "lots_of_kids": "Very High - Abundant families with multiple children, active school community, kid-friendly events weekly",
                "great_for_families": "Outstanding schools, safe pedestrian areas, multiple playgrounds, family recreation center, after-school programs",
                "family_rating": "9.5/10"
            }
        elif children_count > 0:
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
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "lots_of_kids": f"'Yes / Some / Few' with reasoning. Use Niche family scores + Livability.com insights. Focus on family density and child-friendly atmosphere (user has {children_count} children).",
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
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        age = user_preferences.get('age', 30)
        marital_status = user_preferences.get('marital_status', 'single')
        
        if lifestyle == 'nightlife' and age < 35:
            return {
                "nightlife_rating": "9.2/10",
                "best_spots": "Sky Lounge rooftop bar, Underground dance club, Craft cocktail speakeasy, Late-night food trucks",
                "dating_scene": "Vibrant young professional scene, trendy bar meetups, rooftop parties, active social media presence",
                "image_prompt": "Photo of nightlife and entertainment venues in the city around the address, showing actual bars, clubs, and late-night spots where young professionals gather",
                "image_prompt_2": "Photo of dating-friendly venues in the city near the address: trendy restaurants, wine bars, coffee shops, or social spaces where singles meet and socialize"
            }
        elif marital_status in ['married', 'partnered'] or age > 40:
            return {
                "nightlife_rating": "6.8/10",
                "best_spots": "Wine bars, upscale restaurants with live music, theater district, cultural events",
                "dating_scene": "Mature social scene, wine tastings, cultural events, established professional networks",
                "image_prompt": "Photo of upscale evening entertainment venues in the city around the address, showing sophisticated restaurants, wine bars, and cultural spaces for mature professionals",
                "image_prompt_2": "Photo of date-night venues in the city near the address: fine dining restaurants, wine lounges, theater venues, or cultural spaces that cater to established couples"
            }
        else:
            return {
                "nightlife_rating": "7.5/10",
                "best_spots": "The Rooftop Lounge, Coastal Brewery, Live music at The Pier, wine bars on Main St",
                "dating_scene": "Active young professional scene, beach volleyball meetups, wine tastings, farmers market socializing",
                "image_prompt": "Photo of evening dining and entertainment venues in the city around the address, showing local restaurants, bars, and social spaces for casual dining and nightlife",
                "image_prompt_2": "Photo of casual social venues in the city near the address: local bars, breweries, coffee shops, or community spaces where residents socialize and meet"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        marital_status = user_preferences.get('marital_status', 'single') if user_preferences else 'single'
        age = user_preferences.get('age', 30) if user_preferences else 30
        
        return {
            "nightlife_rating": "Rate vibrancy of bars, music, and scenes. Use Yelp, Google Maps, or City-Data forum nightlife threads. Consider what appeals to the user's demographic and lifestyle.",
            "best_spots": "Popular bars, clubs, and entertainment venues. Use Yelp, Google Maps, or City-Data forum nightlife threads. Focus on venues that match the user's social style and interests.",
            "dating_scene": f"Describe energy and dating pool. Search 'dating in [city] Reddit' or Nomad List for vibe. Tailor to user's marital status ({marital_status}) and age ({age}) - focus on relevant social opportunities.",
            "average_attractiveness_rating": "Be playful but grounded. Use cultural tone and tongue-in-cheek phrasing.",
            "image_prompt": "Photo of nightlife and entertainment venues in the city around the address that reflect the local social atmosphere and evening entertainment options.",
            "image_prompt_2": "Photo of dating-friendly venues in the city near the address: cafes, wine bars, restaurants, or social spaces where people meet and socialize in this neighborhood."
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
        income = user_preferences.get('income_range', 'middle')
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        age = user_preferences.get('age', 30)
        
        if income in ['high', 'very_high'] and lifestyle == 'urban':
            return {
                "upcoming_changes": "Luxury high-rise development planned, new upscale shopping district, premium transit connections",
                "zoning_or_construction": "High-end mixed-use towers under construction, zoning allows luxury residential, architectural design standards enforced",
                "gentrification_signs": "Rapid property value increases, artisanal coffee shops and boutiques opening, longtime businesses being replaced",
                "vacancy_or_decay": "Very low vacancy rates, premium property maintenance, no signs of urban decay",
                "image_prompt": "Photo of development and construction activity in the city around the address, showing actual building sites, new developments, and infrastructure projects in this specific neighborhood",
                "image_prompt_2": "Photo of luxury developments and upscale construction projects in the city near the address, showing premium architectural features and high-end residential or commercial developments"
            }
        elif age < 30 and lifestyle in ['nightlife', 'urban']:
            return {
                "upcoming_changes": "New entertainment district planned, co-working spaces expanding, bike lane infrastructure improvements",
                "zoning_or_construction": "Mixed-use development with ground-floor retail, zoning allows live-work spaces, height restrictions relaxed",
                "gentrification_signs": "Young professionals moving in, trendy restaurants opening, rent increases in older buildings",
                "vacancy_or_decay": "Low vacancy rates, building renovations common, minimal decay",
                "image_prompt": "Photo of construction sites and new development projects in the city around the address, showing active building sites and modern developments in this specific neighborhood",
                "image_prompt_2": "Photo of trendy new developments in the city near the address: co-working spaces, modern residential projects, or contemporary commercial buildings that attract young professionals"
            }
        else:
            return {
                "upcoming_changes": "New transit line planned for 2026, waterfront redevelopment project, park expansion",
                "zoning_or_construction": "Mixed-use development under construction, residential zoning allows ADUs, height limits preserved",
                "gentrification_signs": "Rising property values, new upscale businesses, longtime residents being displaced",
                "vacancy_or_decay": "Low vacancy rates, well-maintained properties, minimal urban decay",
                "image_prompt": "Photo of development activity and neighborhood character around the specific address, showing current construction, infrastructure improvements, and community development projects in this area",
                "image_prompt_2": "Photo of neighborhood infrastructure near the address: transit developments, road improvements, utility upgrades, or community projects that impact this specific area"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate field descriptions for Development based on user preferences."""
        income = user_preferences.get('income_range', 'middle') if user_preferences else 'middle'
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        
        return {
            "upcoming_changes": "Search city planning sites, '[city] development projects', or local news. Look for major infrastructure, transit, or commercial projects.",
            "zoning_or_construction": "Check city zoning maps, building permits, or construction notices. Use Google Maps satellite view to spot active construction sites.",
            "gentrification_signs": "Look for rising rents, new upscale businesses, demographic shifts. Search '[neighborhood] gentrification' or check local forums for resident discussions.",
            "vacancy_or_decay": "Use Google Street View to assess building conditions, vacant lots, or boarded storefronts. Check local crime or economic indicators.",
            "image_prompt": "Photo of development activity, construction sites, and neighborhood character in the city around the address, showing current building projects and infrastructure changes in this specific area.",
            "image_prompt_2": "Photo of future development sites and planned construction areas in the city near the address, showing infrastructure improvements, zoning changes, or major projects that will impact this neighborhood."
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
        income = user_preferences.get('income_range', 'middle')
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        work_from_home = user_preferences.get('work_from_home', False)
        
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
        elif work_from_home or lifestyle == 'remote':
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
        work_from_home = user_preferences.get('work_from_home', False) if user_preferences else False
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        
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
            "environmental_rating": "Overall environmental quality score out of 10. Weight factors based on user's work-from-home needs and lifestyle preferences."
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
        income = user_preferences.get('income_range', 'middle')
        price_range = user_preferences.get('preferred_home_price_range', '$300,000-$500,000')
        
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
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        preferred_price_range = user_preferences.get('preferred_home_price_range', '$300,000-$500,000') if user_preferences else '$300,000-$500,000'
        
        return {
            "monthly_payment": f"Estimated monthly mortgage payment for typical home in the area. Consider user's income range ({income_range}) and preferred price range ({preferred_price_range}) when providing context.",
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
        children_count = user_preferences.get("children_count", 0)
        income = user_preferences.get("income_range", "middle")

        if children_count > 0:
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
        children_count = user_preferences.get("children_count", 0) if user_preferences else 0

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

        if children_count == 0:
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
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        has_pets = user_preferences.get('has_pets', False)
        work_from_home = user_preferences.get('work_from_home', False)
        
        if has_pets:
            pet_info = "Extremely pet-friendly - 5 dog parks within walking distance, off-leash beach area, pet grooming services, dog-friendly cafes and breweries"
        else:
            pet_info = "Pet-friendly neighborhood - dog parks available, many residents have pets, vet clinic nearby"
        
        if work_from_home:
            cell_info = "Outstanding connectivity - 5G coverage from all carriers, fiber internet backup options, co-working spaces with reliable WiFi"
            tips = "Best coffee for remote work at Quiet Corner Cafe, library has excellent WiFi, avoid construction noise on Oak St 9-11am"
        elif lifestyle == 'nightlife':
            tips = "Best late-night eats at 24/7 Diner, Uber/Lyft readily available, street lighting excellent for safety, noise ordinance until 2am"
        elif lifestyle == 'family':
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
        lifestyle = user_preferences.get('lifestyle_type', 'balanced') if user_preferences else 'balanced'
        has_pets = user_preferences.get('has_pets', False) if user_preferences else False
        
        return {
            "parking": "Street parking rules, permit requirements, garage availability. Use Google Street View to assess parking density and local parking signs.",
            "pet_friendly": "Dog parks, pet stores, veterinarians, pet policies. Search '[neighborhood] dog park' or use Google Maps to find pet amenities.",
            "cell_service_quality": "Coverage quality for major carriers. Check carrier coverage maps or local forums for dead zone reports.",
            "other_notable_tips": "Local insider knowledge, best times to visit places, hidden gems, traffic patterns. Use local forums, Reddit, or Nextdoor for community insights."
        }

class FullReport(BaseModel):
    # === Main sections ===
    neighborhood_overview: Optional[NeighborhoodOverview] = None
    
    # === Demographic data (appears directly after neighborhood_overview without section titles) ===
    lifestyle_dna: Optional[LifestyleDNA] = None
    
    # === Other report sections ===
    safety: Optional[Safety] = None
    culture_and_events: Optional[CultureAndEvents] = None
    social_character: Optional[SocialCharacter] = None
    local_amenities: Optional[LocalAmenities] = None
    commute: Optional[Commute] = None
    family_friendly: Optional[FamilyFriendly] = None
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
    def __init__(self, report_customization: Dict[str, Any], **data):
        super().__init__(**data)
        self._prioritized_fields = report_customization.get("report_section_priorities", [])

    # ✅ Dict override to only return prioritized sections
    def dict(self, **kwargs) -> Dict[str, Any]:
        base_dict = super().dict(**kwargs)

        print("\n🔍 DEBUG: base_dict keys and values:")
        for k, v in base_dict.items():
            print(f"  - {k}: {'✅ has value' if v is not None else '❌ None'}")

        print("\n📌 DEBUG: prioritized fields from report customization:")
        print(f"  {self._prioritized_fields}")

        final_dict = {}
        print("\n📦 DEBUG: Filtering prioritized fields...")

        for key in self._prioritized_fields:
            if key not in base_dict:
                print(f"  ⛔ '{key}' not found in base_dict — skipping")
                continue
            
            # Include the key regardless of whether it's None or has a value
            final_dict[key] = base_dict[key]

        return final_dict