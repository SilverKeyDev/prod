from pydantic import BaseModel, Field, Extra, model_validator, PrivateAttr
from typing import List, Dict, Optional, Any, Union
from collections import OrderedDict
import logging

logger = logging.getLogger(__name__)


class Demographics(BaseModel):
    gender_distribution: Dict[str, str] = Field(..., description="REQUIRED: Gender distribution as object with percentage values. Must use format: {'Male': 'X%', 'Female': 'Y%'} where percentages add to 100%")
    racial_distribution: Dict[str, str] = Field(..., description="REQUIRED: Racial/ethnic distribution as object with percentage values. Must use format: {'White': 'X%', 'Latino': 'Y%', 'Asian': 'Z%', 'Other': 'W%'} where percentages add to 100%")
    age_distribution: Dict[str, str] = Field(..., description="REQUIRED: Age distribution as object with percentage values. Must use EXACT format: {'18-24': 'X%', '25-34': 'Y%', '35-49': 'Z%', '50-64': 'W%', '65+': 'V%'} where percentages add to 100%. DO NOT use median_age or other formats.")
    lifestyle_dna: Dict[str, str] = Field(..., description="REQUIRED: Lifestyle characteristics as object with percentage values. Must use format: {'Lifestyle1': 'X%', 'Lifestyle2': 'Y%', 'Lifestyle3': 'Z%'} where percentages add to 100%. DO NOT use High/Moderate/Low - use actual percentages.")
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        gender = user_preferences.get("gender", "Female") if user_preferences else "Female"
        age = user_preferences.get('age', 30) if user_preferences else 30
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        
        return {
            "gender_distribution": {"Male": "49%", "Female": "51%"},
            "racial_distribution": {"White": "70%", "Latino": "15%", "Asian": "10%", "Other": "5%"},
            "age_distribution": {"18-24": "10%", "25-34": "30%", "35-49": "25%", "50-64": "20%", "65+": "15%"},
            "lifestyle_dna": {"Artistic": "50%", "Surfer": "20%", "Tech Remote Workers": "30%"}
        }


class NeighborhoodOverview(BaseModel):
    local_culture: str = Field(...)
    vibe: str = Field(...)
    known_for: str = Field(...)
    community_events: str = Field(...)
    what_people_love: str = Field(...)
    things_to_watch_out_for: str = Field(...)
    population_total: str = Field(...)
    neighborhood_rating: str = Field(...)
    LGBTQ_representation: str = Field(...)
    image_prompt: str = Field(...)
    demographics: Demographics = Field(...)

    @model_validator(mode="before")
    @classmethod
    def delete_flat_demographics(cls, values):
        if not isinstance(values, dict):
            return values

        demographic_fields_to_delete = [
            "gender_distribution",
            "racial_distribution",
            "age_distribution",
            "lifestyle_dna",
        ]

        for field in demographic_fields_to_delete:
            if field in values:
                del values[field]

        return values
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        return {
            "local_culture": f"Artistic and laid-back coastal community with a focus on marine activities (aligns with user lifestyle: {lifestyle})",
            "vibe": "Creative, beachy, relaxed",
            "known_for": "Beautiful beaches, surfing, whale watching, and Dana Point Harbor",
            "community_events": "Weekly farmers market, summer concerts, Festival of Whales, harbor festivals",
            "what_people_love": "Walkability, coastal charm, friendly community, outdoor activities",
            "things_to_watch_out_for": "Tourist crowds in summer, parking challenges after 6pm, weekend traffic",
            "population_total": "12,500",
            "neighborhood_rating": "8.3/10",
            "LGBTQ_representation": "High representation (~15%) with several LGBTQ-friendly businesses and events",
            "image_prompt": "Aerial view of a lively beach neighborhood with colorful homes and palm trees",
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
        example="Well-lit residential street with sidewalks, street lamps, and visible security features"
    )
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        # Consider user's safety concerns if they have children
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        safety_focus = "family safety" if children_count > 0 else "general safety"
        
        return {
            "crime_rating": "Crime level assessment (Nonexistent, Low, Moderate, High, Very High). Focus on safety factors most relevant to user's situation.",
            "places_to_watch_out_for": "Specific areas, intersections, or locations with higher risk. Prioritize areas relevant to user's daily routines and family needs.",
            "police_presence": "Frequency and visibility of police patrols in the area. Emphasize community policing and response times.",
            "safety_rating": "Overall safety score out of 10 based on crime data and community perception. Weight factors based on user's safety priorities.",
            "image_prompt": f"Descriptive prompt for generating an image representing neighborhood safety (emphasizing {safety_focus})."
        }

class CultureAndEvents(BaseModel):
    local_events: str = Field(...)
    seasonal_trends: str = Field(...)
    community_engagement: str = Field(...)
    culture_rating: str = Field(...)
    image_prompt: str = Field(...)
    
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
            "image_prompt": "Vibrant street festival with food vendors, live music, and families enjoying community activities"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        hobbies = user_preferences.get('hobbies_interests', ['outdoor activities']) if user_preferences else ['outdoor activities']
        hobbies_str = ', '.join(hobbies) if isinstance(hobbies, list) else str(hobbies)
        
        return {
            "local_events": f"Regular events, festivals, and activities that residents attend. Focus on events that align with user's interests: {hobbies_str}.",
            "seasonal_trends": "How activity and atmosphere change throughout the year. Consider seasonal preferences and activity patterns that match user's lifestyle.",
            "community_engagement": "Level of civic participation and community involvement. Assess community spirit and opportunities for user to get involved.",
            "culture_rating": "Cultural vibrancy score out of 10 based on events and community activities. Weight cultural factors that matter most to the user.",
            "image_prompt": "Descriptive prompt for generating an image of local culture and events that reflects the community's cultural character."
        }

class Weather(BaseModel):
    spring: str = Field(...)
    summer: str = Field(...)
    fall: str = Field(...)
    winter: str = Field(...)
    image_prompt: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        return {
            "spring": "Mild and pleasant, 60-75°F, occasional rain, perfect for outdoor activities",
            "summer": "Warm and dry, 75-85°F, coastal breeze, ideal beach weather with low humidity",
            "fall": "Cool and crisp, 55-70°F, beautiful foliage, comfortable for hiking and outdoor events",
            "winter": "Mild winters, 45-60°F, some rain, rarely freezing, good for year-round outdoor living",
            "image_prompt": "Four-season collage showing the neighborhood in spring blooms, summer sunshine, fall colors, and mild winter"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        return {
            "spring": "Spring weather conditions, temperatures, and comfort level. Consider user's seasonal activity preferences and comfort with spring weather.",
            "summer": "Summer weather patterns, heat levels, and seasonal characteristics. Focus on summer activities and heat tolerance relevant to user.",
            "fall": "Autumn weather conditions and seasonal transitions. Assess fall weather appeal based on user's seasonal preferences.",
            "winter": "Winter weather patterns, cold levels, and seasonal activities. Consider user's cold tolerance and winter activity preferences.",
            "image_prompt": "Descriptive prompt for generating an image representing the area's climate that appeals to user's weather preferences."
        }

class SocialCharacter(BaseModel):
    income_level: str = Field(...)
    religiosity: str = Field(...)
    cultural_tone: str = Field(...)
    social_rating: str = Field(...)
    image_prompt: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "income_level": "Middle-class professionals and young families, median household income $75,000",
            "religiosity": "Moderate - several churches and temples, but not overly conservative",
            "cultural_tone": "Laid-back but proud, environmentally conscious, welcoming to newcomers",
            "social_rating": "8.2/10",
            "image_prompt": "Diverse group of neighbors chatting at a community gathering, showing friendly social interaction"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "income_level": f"Economic demographic of residents. Consider how the income levels align with user's financial situation ({income_range}) and social comfort.",
            "religiosity": "Level of religious activity and influence in the community. Assess compatibility with user's spiritual preferences and tolerance for religious influence.",
            "cultural_tone": "Overall social atmosphere and community personality. Focus on cultural aspects that match user's social preferences and values.",
            "social_rating": "Community inclusivity and social cohesion score out of 10. Weight factors based on user's social priorities and community involvement preferences.",
            "image_prompt": "Descriptive prompt for generating an image representing the social character that appeals to user's community preferences."
        }

class Restaurant(BaseModel):
    name: str = Field(...)
    vibe: Optional[str] = Field(None)
    what_to_try: Optional[str] = Field(None)
    
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
    def get_description(cls, user_preferences: Dict[str, Any]) -> str:
        """Generate field descriptions for Restaurant based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        
        if lifestyle == 'nightlife':
            return "Notable restaurants and dining establishments in the area, focusing on trendy spots, late-night dining, and social venues that align with an active nightlife lifestyle."
        elif lifestyle == 'family':
            return "Family-friendly restaurants and dining options in the neighborhood, highlighting establishments with kid-friendly menus, accommodating atmospheres, and convenient locations for families."
        else:
            return "Popular restaurants and dining establishments in the area, showcasing the local culinary scene and dining options available to residents."

class Activity(BaseModel):
    name: str = Field(...)
    description: str = Field(...)
    
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
    def get_description(cls, user_preferences: Dict[str, Any]) -> str:
        """Generate field descriptions for Activity based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        children = user_preferences.get('children_count', 0)
        
        if lifestyle == 'active':
            return "Local recreational activities and attractions that promote an active lifestyle, including sports, fitness activities, and outdoor adventures available in the neighborhood."
        elif children > 0:
            return "Family-oriented activities and attractions in the area, focusing on entertainment and recreational options suitable for families with children."
        else:
            return "Popular local activities and attractions available to residents, highlighting recreational opportunities and community engagement options in the neighborhood."

class Park(BaseModel):
    name: str = Field(...)
    features: str = Field(...)
    
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
    def get_description(cls, user_preferences: Dict[str, Any]) -> str:
        """Generate field descriptions for Park based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        children = user_preferences.get('children_count', 0)
        
        if lifestyle == 'active':
            return "Parks and green spaces in the area with emphasis on recreational facilities, fitness amenities, and outdoor activity options that support an active lifestyle."
        elif children > 0:
            return "Local parks and recreational areas with family-friendly amenities, playgrounds, and facilities designed for children and family activities."
        else:
            return "Parks and green spaces available in the neighborhood, highlighting key amenities and recreational features for residents to enjoy."

class Amenity(BaseModel):
    name: str = Field(...)
    type: str = Field(...)
    vibe: Optional[str] = Field(None)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Amenity data based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        income = user_preferences.get('income_range', 'middle')
        
        if income in ['high', 'very_high']:
            return {
                "name": "Whole Foods Market",
                "type": "Grocery Store",
                "vibe": "Upscale organic grocery with prepared foods, wine bar, and artisanal products"
            }
        elif lifestyle == 'family':
            return {
                "name": "Target Supercenter",
                "type": "Department Store",
                "vibe": "Family-friendly one-stop shopping with groceries, clothing, and household essentials"
            }
        else:
            return {
                "name": "Corner Market & Deli",
                "type": "Convenience Store",
                "vibe": "Local neighborhood market with fresh sandwiches and daily essentials"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any]) -> str:
        """Generate field descriptions for Amenity based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        income = user_preferences.get('income_range', 'middle')
        
        if income in ['high', 'very_high']:
            return "Local amenities and establishments in the area, with focus on upscale shopping, premium services, and high-quality retail options that match your lifestyle preferences."
        elif lifestyle == 'family':
            return "Neighborhood amenities and services with emphasis on family-friendly establishments, convenient shopping options, and services that cater to household and family needs."
        else:
            return "Local amenities and establishments available in the neighborhood, including shopping, services, and convenience options for daily needs."



class LocalAmenities(BaseModel):
    restaurants: List[Restaurant] = Field(...)
    activities: List[Activity] = Field(...)
    parks: List[Park] = Field(...)
    thrift_store: Amenity = Field(...)
    grocery_store: Amenity = Field(...)
    late_night_restaurant: Amenity = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example LocalAmenities data based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        income = user_preferences.get('income_range', 'middle')
        children = user_preferences.get('children_count', 0)
        
        # Generate examples using nested class methods
        restaurant_example = Restaurant.get_example(user_preferences)
        activity_example = Activity.get_example(user_preferences)
        park_example = Park.get_example(user_preferences)
        
        # Customize amenity examples based on preferences
        if income in ['high', 'very_high']:
            grocery_example = {
                "name": "Whole Foods Market",
                "type": "Grocery Store",
                "vibe": "Upscale organic grocery with prepared foods and wine bar"
            }
            thrift_example = {
                "name": "Vintage Boutique",
                "type": "Vintage Store",
                "vibe": "Curated vintage designer pieces and unique finds"
            }
        else:
            grocery_example = {
                "name": "Neighborhood Market",
                "type": "Grocery Store",
                "vibe": "Local grocery with fresh produce and competitive prices"
            }
            thrift_example = {
                "name": "Coastal Treasures",
                "type": "Thrift Store",
                "vibe": "Eclectic vintage finds with local character"
            }
        
        if lifestyle == 'nightlife':
            late_night_example = {
                "name": "Midnight Kitchen",
                "type": "Late Night Dining",
                "vibe": "Trendy late-night spot with craft cocktails and small plates"
            }
        else:
            late_night_example = {
                "name": "24/7 Diner",
                "type": "Late Night Dining",
                "vibe": "Classic American diner with comfort food"
            }
        
        return {
            "restaurants": [restaurant_example],
            "activities": [activity_example],
            "parks": [park_example],
            "thrift_store": thrift_example,
            "grocery_store": grocery_example,
            "late_night_restaurant": late_night_example
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        dining_prefs = user_preferences.get('dining_preferences', ['casual dining']) if user_preferences else ['casual dining']
        hobbies = user_preferences.get('hobbies_interests', ['outdoor activities']) if user_preferences else ['outdoor activities']
        
        # Format preferences for display
        dining_str = ', '.join(dining_prefs) if isinstance(dining_prefs, list) else str(dining_prefs)
        hobbies_str = ', '.join(hobbies) if isinstance(hobbies, list) else str(hobbies)
        
        return {
            "restaurants": f"List of notable restaurants and dining establishments in the area. Focus on restaurants that match user's dining preferences: {dining_str}.",
            "activities": f"Popular local activities and attractions. Emphasize activities that align with user's hobbies and interests: {hobbies_str}.",
            "parks": "Parks and green spaces in the neighborhood. Highlight features that match user's outdoor activity preferences.",
            "thrift_store": "Local thrift or second-hand store. Include unique character and shopping experience details.",
            "grocery_store": "Primary grocery store for the area. Focus on quality, selection, and convenience factors.",
            "late_night_restaurant": "Restaurant or eatery open late for night owls. Consider user's lifestyle and dining schedule preferences."
        }

class Commute(BaseModel):
    commute_times: str = Field(...)
    public_transport: str = Field(...)
    traffic: str = Field(...)
    walkability: str = Field(...)
    
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
            "commute_times": f"Typical commute times to major employment centers and downtown areas. Emphasize routes and times relevant to user's commute tolerance ({commute_tolerance}).",
            "public_transport": "Available public transportation options and their quality. Focus on transit options that align with user's transportation preferences.",
            "traffic": "Traffic patterns and congestion levels throughout the day. Highlight peak times and alternative routes based on user's schedule flexibility.",
            "walkability": f"How pedestrian-friendly the area is with Walk Score details. Weight walkability factors based on user's walkability importance ({walkability_importance})."
        }

class FamilyFriendly(BaseModel):
    lots_of_kids: str = Field(...)
    great_for_families: str = Field(...)
    family_rating: str = Field(...)
    
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
            "lots_of_kids": f"Presence and visibility of children in the neighborhood. Focus on family density and child-friendly atmosphere (user has {children_count} children).",
            "great_for_families": "Family-oriented features and why families choose this area. Emphasize amenities and safety features most relevant to families with children.",
            "family_rating": "Overall family-friendliness score out of 10. Weight factors based on user's family situation and child-related needs."
        }

class NightlifeAndDating(BaseModel):
    nightlife_rating: str = Field(...)
    nightlife_score: float = Field(...)
    best_spots: str = Field(...)
    dating_scene: str = Field(...)
    apps_popularity: Dict[str, str] = Field(...)
    image_prompt: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example NightlifeAndDating data based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        age = user_preferences.get('age', 30)
        marital_status = user_preferences.get('marital_status', 'single')
        
        if lifestyle == 'nightlife' and age < 35:
            return {
                "nightlife_rating": "9.2/10",
                "nightlife_score": 9.2,
                "best_spots": "Sky Lounge rooftop bar, Underground dance club, Craft cocktail speakeasy, Late-night food trucks",
                "dating_scene": "Vibrant young professional scene, trendy bar meetups, rooftop parties, active social media presence",
                "apps_popularity": {"Bumble": "Very Popular", "Hinge": "Very Popular", "Tinder": "Popular"},
                "image_prompt": "Energetic nightlife scene with young professionals at trendy rooftop bars and dance venues"
            }
        elif marital_status in ['married', 'partnered'] or age > 40:
            return {
                "nightlife_rating": "6.8/10",
                "nightlife_score": 6.8,
                "best_spots": "Wine bars, upscale restaurants with live music, theater district, cultural events",
                "dating_scene": "Mature social scene, wine tastings, cultural events, established professional networks",
                "apps_popularity": {"Bumble": "Moderate", "Hinge": "Popular", "Match": "Popular"},
                "image_prompt": "Sophisticated evening atmosphere with wine bars and cultural venues for mature adults"
            }
        else:
            return {
                "nightlife_rating": "7.5/10",
                "nightlife_score": 7.5,
                "best_spots": "The Rooftop Lounge, Coastal Brewery, Live music at The Pier, wine bars on Main St",
                "dating_scene": "Active young professional scene, beach volleyball meetups, wine tastings, farmers market socializing",
                "apps_popularity": {"Bumble": "Very Popular", "Hinge": "Popular", "Tinder": "Moderate"},
                "image_prompt": "Vibrant evening scene with people enjoying rooftop dining and coastal nightlife"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        marital_status = user_preferences.get('marital_status', 'single') if user_preferences else 'single'
        age = user_preferences.get('age', 30) if user_preferences else 30
        
        return {
            "nightlife_rating": "Overall nightlife quality and variety rating out of 10. Consider what appeals to the user's demographic and lifestyle.",
            "nightlife_score": "Numerical nightlife score for data analysis. Weight based on user's social preferences and age group.",
            "best_spots": "Popular bars, clubs, and entertainment venues. Focus on venues that match the user's social style and interests.",
            "dating_scene": f"Local dating culture and opportunities for meeting people. Tailor to user's marital status ({marital_status}) and age ({age}) - focus on relevant social opportunities.",
            "apps_popularity": "Dating app usage and popularity in the area. Emphasize apps most relevant to user's age group and relationship goals.",
            "image_prompt": "Descriptive prompt for generating an image of local nightlife that reflects the user's preferred social atmosphere."
        }

class Accessibility(BaseModel):
    wheelchair_friendly: str = Field(...)
    ada_compliance: str = Field(...)
    age_friendly: str = Field(...)
    accessibility_rating: str = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Accessibility data based on user preferences."""
        age = user_preferences.get('age', 30)
        accessibility_needs = user_preferences.get('accessibility_needs', False)
        
        if accessibility_needs or age > 65:
            return {
                "wheelchair_friendly": "Excellent - All sidewalks have curb cuts, accessible parking abundant, ramps and elevators at all buildings",
                "ada_compliance": "Full compliance - All public spaces meet ADA standards, accessible public transportation with audio announcements",
                "age_friendly": "Outstanding - Senior center, medical facilities within 2 blocks, flat terrain, excellent lighting, benches every block",
                "accessibility_rating": "9.5/10"
            }
        elif age > 50:
            return {
                "wheelchair_friendly": "Very Good - Most sidewalks accessible, some older buildings have ramps added, accessible parking available",
                "ada_compliance": "High compliance - New construction follows ADA standards, accessible public transportation",
                "age_friendly": "Good - Senior center nearby, medical facilities within walking distance, mostly flat terrain, good lighting",
                "accessibility_rating": "8.5/10"
            }
        else:
            return {
                "wheelchair_friendly": "Good - Most sidewalks have curb cuts, accessible parking available, ramps at major buildings",
                "ada_compliance": "High compliance - New construction follows ADA standards, accessible public transportation",
                "age_friendly": "Senior center nearby, medical facilities within walking distance, flat terrain, good lighting",
                "accessibility_rating": "8.1/10"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any]) -> str:
        """Generate field descriptions for Accessibility based on user preferences."""
        age = user_preferences.get('age', 30)
        accessibility_needs = user_preferences.get('accessibility_needs', False)
        
        if accessibility_needs:
            return "Comprehensive accessibility features in the neighborhood, with detailed focus on wheelchair accessibility, ADA compliance, and mobility support features that directly impact daily living for individuals with accessibility needs."
        elif age > 60:
            return "Neighborhood accessibility features with emphasis on age-friendly amenities, senior support services, and infrastructure that supports aging in place comfortably and safely."
        else:
            return "General accessibility features and compliance levels in the neighborhood, including wheelchair accessibility, ADA compliance, and age-friendly amenities for future planning."

class Development(BaseModel):
    upcoming_changes: str = Field(...)
    zoning_or_construction: str = Field(...)
    gentrification_signs: str = Field(...)
    vacancy_or_decay: str = Field(...)
    image_prompt: str = Field(...)
    
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
                "image_prompt": "Modern glass towers and upscale development transforming an established urban neighborhood"
            }
        elif age < 30 and lifestyle in ['nightlife', 'urban']:
            return {
                "upcoming_changes": "New entertainment district planned, co-working spaces expanding, bike lane infrastructure improvements",
                "zoning_or_construction": "Mixed-use development with ground-floor retail, zoning allows live-work spaces, height restrictions relaxed",
                "gentrification_signs": "Young professionals moving in, trendy restaurants opening, rent increases in older buildings",
                "vacancy_or_decay": "Low vacancy rates, building renovations common, minimal decay",
                "image_prompt": "Construction activity and new development bringing modern amenities to a transitioning neighborhood"
            }
        else:
            return {
                "upcoming_changes": "New transit line planned for 2026, waterfront redevelopment project, park expansion",
                "zoning_or_construction": "Mixed-use development under construction, residential zoning allows ADUs, height limits preserved",
                "gentrification_signs": "Rising property values, new upscale businesses, longtime residents being displaced",
                "vacancy_or_decay": "Low vacancy rates, well-maintained properties, minimal urban decay",
                "image_prompt": "Construction cranes and new development alongside established neighborhood character"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any]) -> str:
        """Generate field descriptions for Development based on user preferences."""
        income = user_preferences.get('income_range', 'middle')
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        
        if income in ['high', 'very_high']:
            return "Neighborhood development trends and future changes, with focus on luxury developments, premium amenities, and high-end infrastructure projects that may impact property values and lifestyle quality."
        elif lifestyle == 'family':
            return "Development activities and planned changes in the neighborhood, emphasizing family-oriented improvements, school construction, park developments, and infrastructure that supports family living."
        else:
            return "Current and planned development in the neighborhood, including construction projects, zoning changes, and economic trends that may affect the area's character and livability over time."



class EnvironmentUtilities(BaseModel):
    air_quality: str = Field(...)
    noise_pollution: str = Field(...)
    light_pollution: str = Field(...)
    water_quality: str = Field(...)
    avg_utility_costs: Dict[str, str] = Field(...)
    internet_speed: str = Field(...)
    environmental_rating: str = Field(...)
    
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
                "avg_utility_costs": {"Electricity": "$180", "Gas": "$65", "Water": "$45", "Internet": "$95"},
                "internet_speed": "Fiber available up to 2Gbps, premium service providers, 99.9% uptime",
                "environmental_rating": "9.2/10"
            }
        elif work_from_home or lifestyle == 'remote':
            return {
                "air_quality": "Good - AQI typically 35-50, clean air with minimal industrial pollution",
                "noise_pollution": "Low to moderate - Quiet during work hours, some evening activity",
                "light_pollution": "Moderate - Some night sky visibility, residential lighting",
                "water_quality": "Excellent - Meets all EPA standards, good taste, reliable supply",
                "avg_utility_costs": {"Electricity": "$140", "Gas": "$50", "Water": "$40", "Internet": "$85"},
                "internet_speed": "Fiber available up to 1Gbps, multiple high-speed options, reliable for remote work",
                "environmental_rating": "8.8/10"
            }
        else:
            return {
                "air_quality": "Good - AQI typically 45-65, minimal smog, ocean breeze helps circulation",
                "noise_pollution": "Moderate - Some traffic noise on main roads, generally quiet residential streets",
                "light_pollution": "Low to moderate - Can see some stars, street lighting present but not excessive",
                "water_quality": "Excellent - Meets all EPA standards, tastes good, no boil advisories in recent years",
                "avg_utility_costs": {"Electricity": "$120", "Gas": "$45", "Water": "$35", "Internet": "$65"},
                "internet_speed": "Fiber available up to 1Gbps, cable up to 500Mbps, multiple provider options",
                "environmental_rating": "8.4/10"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any]) -> str:
        """Generate field descriptions for EnvironmentUtilities based on user preferences."""
        work_from_home = user_preferences.get('work_from_home', False)
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        
        if work_from_home:
            return "Environmental quality and utility information for the neighborhood, with emphasis on factors important for remote work including internet reliability, noise levels during work hours, and utility costs for home office use."
        elif lifestyle == 'family':
            return "Environmental conditions and utility services in the area, focusing on air and water quality for family health, noise levels for children, and utility costs for family households."
        else:
            return "Environmental quality indicators and utility information for the neighborhood, including air quality, noise levels, water quality, and average utility costs for residents."

class FinancialInformation(BaseModel):
    monthly_payment: str = Field(...)
    property_taxes: str = Field(...)
    value_assessment: str = Field(...)
    investment_potential: str = Field(...)
    financial_rating: str = Field(...)
    
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

class SchoolInfo(BaseModel):
    level: str = Field(...)
    walking_distance: bool = Field(...)
    school_rating: str = Field(...)
    teacher_quality: str = Field(...)
    known_for: str = Field(...)
    gpa_avg: Optional[float] = Field(None)
    sat_avg: Optional[int] = Field(None)
    grad_rate: Optional[float] = Field(None)
    top_colleges: Optional[str] = Field(None)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example SchoolInfo data based on user preferences."""
        children_count = user_preferences.get('children_count', 0)
        income = user_preferences.get('income_range', 'middle')
        
        if children_count > 0 and income in ['high', 'very_high']:
            return {
                "level": "Elementary",
                "walking_distance": True,
                "school_rating": "9.8/10",
                "teacher_quality": "Outstanding - 95% have advanced degrees, National Blue Ribbon recognition, innovative teaching methods",
                "known_for": "Advanced STEM programs, Mandarin immersion, gifted and talented programs, arts excellence",
                "gpa_avg": None,
                "sat_avg": None,
                "grad_rate": None,
                "top_colleges": None
            }
        elif children_count > 2:
            return {
                "level": "Elementary",
                "walking_distance": True,
                "school_rating": "9.4/10",
                "teacher_quality": "Excellent - 90% have advanced degrees, strong parent involvement, dedicated staff",
                "known_for": "Strong reading programs, inclusive education, after-school activities, family engagement",
                "gpa_avg": None,
                "sat_avg": None,
                "grad_rate": None,
                "top_colleges": None
            }
        else:
            return {
                "level": "Elementary",
                "walking_distance": True,
                "school_rating": "9.2/10",
                "teacher_quality": "Excellent - 85% have advanced degrees, low turnover, award-winning programs",
                "known_for": "STEM programs, arts integration, dual language immersion",
                "gpa_avg": 3.7,
                "sat_avg": 1340,
                "grad_rate": 96.5,
                "top_colleges": "UC Berkeley, Stanford, UCLA, USC, Cal Poly"
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any]) -> str:
        """Generate field descriptions for SchoolInfo based on user preferences."""
        children_count = user_preferences.get('children_count', 0)
        
        if children_count > 0:
            return "Detailed information about schools in the area, with comprehensive focus on educational quality, teacher excellence, special programs, and academic outcomes that directly impact your children's educational experience and future opportunities."
        else:
            return "School information in the neighborhood for future planning and property value considerations, including educational quality, programs, and academic performance metrics."

class Schools(BaseModel):
    schools: Dict[str, SchoolInfo] = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Generate example Schools data based on user preferences."""
        children_count = user_preferences.get('children_count', 0)
        income = user_preferences.get('income_range', 'middle')
        
        # Generate school example using SchoolInfo class method
        school_example = SchoolInfo.get_example(user_preferences)
        
        if children_count > 0 and income in ['high', 'very_high']:
            return {
                "schools": {
                    "Prestigious Academy Elementary": school_example,
                    "Excellence Prep Middle School": {
                        **school_example,
                        "level": "Middle School",
                        "school_rating": "9.9/10",
                        "known_for": "Advanced placement programs, robotics team, debate championship"
                    }
                }
            }
        elif children_count > 2:
            return {
                "schools": {
                    "Family-Friendly Elementary": school_example,
                    "Community Middle School": {
                        **school_example,
                        "level": "Middle School",
                        "school_rating": "9.0/10",
                        "known_for": "Strong community involvement, diverse programs, inclusive environment"
                    }
                }
            }
        else:
            return {
                "schools": {
                    "Seaside Elementary": {
                        "level": "Elementary",
                        "walking_distance": True,
                        "school_rating": "9.2/10",
                        "teacher_quality": "Excellent",
                        "known_for": "STEM programs"
                    }
                }
            }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any]) -> str:
        """Generate field descriptions for Schools based on user preferences."""
        children_count = user_preferences.get('children_count', 0)
        
        if children_count > 0:
            return "Comprehensive directory of schools in the neighborhood with detailed information about educational quality, programs, and facilities that directly impact your children's academic success and development."
        else:
            return "Local schools information for future planning and property value considerations, including educational quality and community reputation factors."

class ExtraTips(BaseModel):
    parking: str = Field(...)
    pet_friendly: str = Field(...)
    cell_service_quality: str = Field(...)
    other_notable_tips: str = Field(...)
    
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
    def get_description(cls, user_preferences: Dict[str, Any]) -> str:
        """Generate field descriptions for ExtraTips based on user preferences."""
        lifestyle = user_preferences.get('lifestyle_type', 'balanced')
        has_pets = user_preferences.get('has_pets', False)
        
        if has_pets:
            return "Essential local tips and practical information for neighborhood living, with special emphasis on pet-friendly amenities, parking solutions, connectivity, and insider knowledge that enhances daily life with pets."
        elif lifestyle == 'family':
            return "Practical neighborhood tips and local insights focused on family living, including parking, connectivity, and insider knowledge about the best family-friendly spots and timing for activities."
        else:
            return "Helpful local tips and practical information for neighborhood residents, including parking details, pet amenities, connectivity quality, and insider knowledge that makes daily living easier."

class FullReport(BaseModel):
    # === All your sections ===
    neighborhood_overview: Optional[NeighborhoodOverview] = None
    safety: Optional[Safety] = None
    culture_and_events: Optional[CultureAndEvents] = None
    weather: Optional[Weather] = None
    social_character: Optional[SocialCharacter] = None
    local_amenities: Optional[LocalAmenities] = None
    commute: Optional[Commute] = None
    family_friendly: Optional[FamilyFriendly] = None
    nightlife_and_dating: Optional[NightlifeAndDating] = None
    accessibility: Optional[Accessibility] = None
    development: Optional[Development] = None
    environment_utilities: Optional[EnvironmentUtilities] = None
    financial_information: Optional[FinancialInformation] = None
    schools: Optional[Schools] = None
    extra_tips: Optional[ExtraTips] = None

    # === Internal field (not part of schema) ===
    _prioritized_fields: List[str] = PrivateAttr(default=[])

    class Config:
        extra = "allow"

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
            print(f"  ✅ Including '{key}' (value: {'None' if base_dict[key] is None else 'populated'})")
            final_dict[key] = base_dict[key]

        print("\n✅ Final filtered dict keys:")
        print(f"  {list(final_dict.keys())}\n")

        return final_dict

    @classmethod
    def schema(cls, report_customization: Dict[str, Any] = None, **kwargs):
        base = super().schema(**kwargs)
        
        # Get the prioritized fields from report customization
        prioritized_fields = []
        if report_customization:
            prioritized_fields = report_customization.get("report_section_priorities", [])
            logger.info(f"🎯 Filtering schema for prioritized fields: {prioritized_fields}")
        
        # If no prioritized fields specified, include all fields (backward compatibility)
        if not prioritized_fields:
            prioritized_fields = list(cls.__fields__.keys())
            logger.info(f"📋 No prioritized fields specified, including all: {prioritized_fields}")
        
        # Filter properties to only include prioritized fields and remove nullable anyOf patterns
        if "properties" in base:
            filtered_properties = {}
            for field_name in prioritized_fields:
                if field_name in base["properties"]:
                    prop = base["properties"][field_name]
                    
                    # Remove nullable anyOf patterns to make fields required
                    if isinstance(prop, dict) and "anyOf" in prop:
                        # Find the non-null reference
                        non_null_refs = [item for item in prop["anyOf"] if item.get("type") != "null"]
                        if len(non_null_refs) == 1 and "$ref" in non_null_refs[0]:
                            # Replace anyOf with direct $ref to make field required
                            filtered_properties[field_name] = non_null_refs[0]
                            logger.info(f"🔧 Removed nullable anyOf for {field_name}, now required")
                        else:
                            filtered_properties[field_name] = prop
                    else:
                        filtered_properties[field_name] = prop
            base["properties"] = filtered_properties
            logger.info(f"✂️ Filtered properties to: {list(filtered_properties.keys())}")
        
        # Collect model classes that are actually used (including nested dependencies)
        used_model_classes = set()
        
        def collect_model_dependencies(model_name, visited=None):
            """Recursively collect all model dependencies from $defs"""
            if visited is None:
                visited = set()
            
            if model_name in visited or model_name not in base.get("$defs", {}):
                return
            
            visited.add(model_name)
            used_model_classes.add(model_name)
            
            # Check for $ref dependencies in this model's properties
            model_def = base["$defs"][model_name]
            if "properties" in model_def:
                for prop_name, prop_def in model_def["properties"].items():
                    # Look for direct $ref
                    if isinstance(prop_def, dict) and "$ref" in prop_def:
                        ref_model = prop_def["$ref"].split("/")[-1]
                        collect_model_dependencies(ref_model, visited)
                    # Look for $ref in anyOf (for Optional fields)
                    elif isinstance(prop_def, dict) and "anyOf" in prop_def:
                        for any_of_item in prop_def["anyOf"]:
                            if isinstance(any_of_item, dict) and "$ref" in any_of_item:
                                ref_model = any_of_item["$ref"].split("/")[-1]
                                collect_model_dependencies(ref_model, visited)
        
        # Start with direct field models
        for field_name in prioritized_fields:
            if field_name in cls.__fields__:
                field = cls.__fields__[field_name]
                model = field.annotation
                if hasattr(model, '__args__'):  # Handle Optional[Model]
                    model = next((arg for arg in model.__args__ if arg is not type(None)), model)
                if hasattr(model, '__name__'):
                    collect_model_dependencies(model.__name__)
        
        # Filter $defs to only include used model classes and their dependencies
        if "$defs" in base:
            filtered_defs = {}
            for def_name in used_model_classes:
                if def_name in base["$defs"]:
                    filtered_defs[def_name] = base["$defs"][def_name]
            base["$defs"] = filtered_defs
            logger.info(f"✂️ Filtered $defs to: {list(filtered_defs.keys())}")
            
            # Remove nullable anyOf patterns from $defs properties
            for def_name, def_content in base["$defs"].items():
                if "properties" in def_content:
                    for prop_name, prop_def in def_content["properties"].items():
                        if isinstance(prop_def, dict) and "anyOf" in prop_def:
                            # Find the non-null references
                            non_null_refs = [item for item in prop_def["anyOf"] if item.get("type") != "null"]
                            if len(non_null_refs) >= 1:
                                if len(non_null_refs) == 1:
                                    # Single non-null type: replace with direct reference
                                    base["$defs"][def_name]["properties"][prop_name] = non_null_refs[0]
                                    logger.info(f"🔧 Removed nullable anyOf for {def_name}.{prop_name}, now required (single type)")
                                else:
                                    # Multiple non-null types: keep anyOf but remove null option
                                    base["$defs"][def_name]["properties"][prop_name] = {"anyOf": non_null_refs}
                                    logger.info(f"🔧 Removed null option from anyOf for {def_name}.{prop_name}, now required (multiple types)")

        # Inject personalized examples and descriptions for used fields only
        for field_name in prioritized_fields:
            if field_name not in cls.__fields__:
                continue
                
            field = cls.__fields__[field_name]
            model = field.annotation
            if hasattr(model, '__args__'):  # Handle Optional[Model]
                model = next((arg for arg in model.__args__ if arg is not type(None)), model)

            if hasattr(model, 'get_example'):
                try:
                    logger.info(f"🔧 Injecting example for {field_name}")
                    example = model.get_example({})
                    if "properties" in base and field_name in base["properties"]:
                        base["properties"][field_name]["example"] = example
                except Exception as e:
                    logger.warning(f"⚠️ Failed to inject example for {field_name}: {e}")

            if hasattr(model, 'get_description'):
                try:
                    logger.info(f"📝 Injecting field descriptions for {field_name}")
                    field_descriptions = model.get_description({})

                    # Handle both string or dict return types
                    if isinstance(field_descriptions, str):
                        # Apply string to the overall model description
                        if model.__name__ in base.get("$defs", {}):
                            base["$defs"][model.__name__]["description"] = field_descriptions

                    elif isinstance(field_descriptions, dict):
                        if "properties" in base.get("$defs", {}).get(model.__name__, {}):
                            for sub_field, desc in field_descriptions.items():
                                if sub_field in base["$defs"][model.__name__]["properties"]:
                                    base["$defs"][model.__name__]["properties"][sub_field]["description"] = desc

                except Exception as e:
                    logger.warning(f"⚠️ Failed to inject descriptions for {field_name}: {e}")

        return base