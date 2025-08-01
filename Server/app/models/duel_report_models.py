from pydantic import BaseModel, Field, Extra, model_validator, PrivateAttr
from typing import List, Dict, Optional, Any, Union
from collections import OrderedDict
import logging

logger = logging.getLogger(__name__)


# Base comparison structure for all sections
class ComparisonField(BaseModel):
    """Base model for comparison fields with location_a, location_b, winner, and reason"""
    location_a: Any = Field(..., description="Detailed analysis of this location's(LOCATION_A) performance **only** in the context of this field (e.g., crime_rating, community_events, lifestyle match, etc.). Do not mention other dimensions.")
    location_b: Any = Field(..., description="Detailed analysis of this location's(LOCATION_B) performance **only** in the context of this field (e.g., crime_rating, community_events, lifestyle match, etc.). Do not mention other dimensions.")
    winner: str = Field(..., description="Winner: 'location_a', 'location_b', or 'same', based solely on the specific comparison dimension this field represents (e.g., safety, lifestyle, cost). Do NOT base on overall factors.")
    reason: str = Field(..., description="Human-readable justification for why this location wins BASED ON THIS DIMENSION")
    
    # New fields for deeper traceability
    criteria: Optional[List[str]] = Field(
        default=None,
        description="List of criteria used to evaluate this field (e.g. 'safety', 'walkability', etc.) BASED ON THIS DIMENSION"
    )
    user_preference_tags: Optional[List[str]] = Field(
        default=None,
        description="Which user preferences this comparison directly maps to BASED ON THIS DIMENSION"
    )


class ComparisonSummary(BaseModel):
    overall_recommendation: ComparisonField = Field(...)
    priority_based_analysis: ComparisonField = Field(...)
    lifestyle_match_score: ComparisonField = Field(...)
    key_tradeoffs: ComparisonField = Field(...)
    personalized_advice: ComparisonField = Field(...)
    deal_breaker_analysis: ComparisonField = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        # Determine user preference tags based on profile
        family_tags = ["children_count", "family_friendly"] if children_count > 0 else []
        lifestyle_tags = ["lifestyle_type"]
        income_tags = ["income_range", "budget_considerations"]
        
        return {
            "overall_recommendation": {
                "location_a": "Dana Point - Coastal lifestyle with family amenities",
                "location_b": "Downtown LA - Urban professional environment",
                "winner": "location_a",
                "reason": f"Better matches user's lifestyle: {lifestyle} and family needs with {children_count} children",
                "criteria": ["lifestyle_alignment", "family_amenities", "cost_of_living"],
                "user_preference_tags": lifestyle_tags + family_tags + ["overall_priorities"]
            },
            "priority_based_analysis": {
                "location_a": "9.2/10 - Excellent schools, many families, safe streets",
                "location_b": "6.1/10 - Limited family amenities, busy urban environment",
                "winner": "location_a",
                "reason": f"Significantly better for families with {children_count} children" if children_count > 0 else "Better overall quality of life metrics",
                "criteria": ["school_quality", "family_density", "safety_rating", "community_feel"],
                "user_preference_tags": family_tags + ["safety_priorities", "education_priorities"]
            },
            "lifestyle_match_score": {
                "location_a": f"85% match - Aligns with {lifestyle} lifestyle, family needs, moderate income",
                "location_b": "62% match - Good for career growth but lacks family amenities",
                "winner": "location_a",
                "reason": f"Better overall alignment with user profile: {lifestyle}, income {income_range}, {children_count} children",
                "criteria": ["lifestyle_compatibility", "income_alignment", "life_stage_match"],
                "user_preference_tags": lifestyle_tags + income_tags + family_tags
            },
            "key_tradeoffs": {
                "location_a": "Advantages: Family-friendly, lower cost, outdoor activities, walkable. Disadvantages: Limited career opportunities, fewer nightlife options",
                "location_b": "Advantages: Career growth, nightlife, cultural events, transit access. Disadvantages: Higher cost, less family-friendly, traffic congestion",
                "winner": "location_a",
                "reason": "Choose A if family life is priority, B if career advancement is key",
                "criteria": ["career_opportunities", "family_amenities", "cost_analysis", "lifestyle_options"],
                "user_preference_tags": ["career_priorities", "family_priorities", "budget_considerations"]
            },
            "personalized_advice": {
                "location_a": f"Perfect for young family with {children_count} children, income {income_range}. Stable market gives flexibility.",
                "location_b": "Better for career growth but challenging for families. Higher costs may strain budget.",
                "winner": "location_a",
                "reason": "Given your family priorities and moderate income, Location A offers better value and family amenities",
                "criteria": ["financial_fit", "family_suitability", "long_term_value"],
                "user_preference_tags": family_tags + income_tags + ["long_term_goals"]
            },
            "deal_breaker_analysis": {
                "location_a": "None of your deal breakers present (heavy traffic, high crime, poor schools)",
                "location_b": "High traffic matches your deal breaker: heavy commute",
                "winner": "location_a",
                "reason": "Location B has deal breaker issues that conflict with your requirements",
                "criteria": ["deal_breaker_assessment", "requirement_compliance"],
                "user_preference_tags": ["deal_breakers", "non_negotiables"]
            }
        }


    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "overall_recommendation": f"Executive summary comparing both locations with clear winner and reasoning. Consider user's lifestyle ({lifestyle}), family situation ({children_count} children), and income ({income_range}). Use data from all report sections to make evidence-based recommendation.",
            "priority_based_analysis": "Analysis weighted by user's top priorities from preferences. Focus heavily on user's most important factors (safety, schools, commute, etc.) and score each location accordingly.",
            "lifestyle_match_score": f"Percentage match scores (0-100%) for each location based on user's lifestyle preferences ({lifestyle}) and personal situation. Include detailed reasoning for scores using specific neighborhood characteristics.",
            "key_tradeoffs": "Clear side-by-side comparison of major advantages and disadvantages. Help user understand what they gain and lose with each choice, focusing on practical daily life impacts.",
            "personalized_advice": f"Specific actionable advice for user's situation: {lifestyle} lifestyle, {children_count} children, income {income_range}. Include timing considerations, visit recommendations, and next steps.",
            "deal_breaker_analysis": "Analysis of any absolute deal breakers from user preferences. Identify if either location has critical issues that conflict with user's non-negotiable requirements or concerns."
        }


class NeighborhoodOverview(BaseModel):
    local_culture: ComparisonField = Field(...)
    vibe: ComparisonField = Field(...)
    known_for: ComparisonField = Field(...)
    community_events: ComparisonField = Field(...)
    what_people_love: ComparisonField = Field(...)
    things_to_watch_out_for: ComparisonField = Field(...)
    population_total: ComparisonField = Field(...)
    neighborhood_rating: ComparisonField = Field(...)
    LGBTQ_representation: ComparisonField = Field(...)
    image_prompt: ComparisonField = Field(...)

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
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "local_culture": f"Cultural texture and personality using Google Maps reviews, City-Data forums, or Niche community insights. Focus on aspects that align with user's {lifestyle} lifestyle preferences.",
            "vibe": "Concise summary (2-5 words) using Google Maps reviews or local forums. Capture the essence that would appeal to the user's personality.",
            "known_for": "Main attractions, industries, or distinctive features using Wikipedia, city websites, or tourism boards. Highlight elements relevant to user interests.",
            "community_events": "Regular events using Eventbrite, Meetup, city websites, or local news. Emphasize events that match user's social preferences and family situation.",
            "what_people_love": "Positive aspects from Google Maps reviews, Yelp, City-Data forums, or Nextdoor. Focus on benefits that align with user's priorities and lifestyle.",
            "things_to_watch_out_for": "Potential drawbacks from resident reviews, City-Data forums, or local news. Include issues particularly relevant to user's situation.",
            "population_total": "Total population from Census data or city demographic reports. Consider if the community size matches user's preferences.",
            "neighborhood_rating": "Overall livability rating using Niche, AreaVibes, or similar platforms. Weight factors based on user's priorities and life stage.",
            "LGBTQ_representation": "LGBTQ population and community friendliness using Census data, local LGBTQ organizations, or community resources. Include inclusivity indicators.",
            "image_prompt": "Descriptive prompt for generating a representative image of the neighborhood that captures its appeal to the user.",
        }

class Safety(BaseModel):
    crime_rating: ComparisonField = Field(...)
    places_to_watch_out_for: ComparisonField = Field(...)
    police_presence: ComparisonField = Field(...)
    safety_rating: ComparisonField = Field(...)
    image_prompt: ComparisonField = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        gender = user_preferences.get('gender', '') if user_preferences else ''
        safety_focus = "family safety" if children_count > 0 else "general safety"
        
        # Determine user preference tags based on profile
        safety_tags = ["safety_priorities"]
        if children_count > 0:
            safety_tags.extend(["children_count", "family_safety"])
        if gender == "Female":
            safety_tags.append("personal_safety")
        
        return {
            "crime_rating": {
                "location_a": "Low - Minimal property crime, rare violent incidents",
                "location_b": "Moderate - Some break-ins, occasional street crime",
                "winner": "location_a",
                "reason": f"Lower crime rates align better with {safety_focus} priorities" if children_count > 0 else "Significantly lower crime rates provide better security",
                "criteria": ["crime_rate", "violent_incidents", "property_crime"],
                "user_preference_tags": safety_tags
            },
            "places_to_watch_out_for": {
                "location_a": "Main St after 10pm, parking lots near train station",
                "location_b": "Multiple areas: downtown core, several intersections, park after dark",
                "winner": "location_a",
                "reason": "Fewer problematic areas, easier to avoid risk zones" + (" - important for family navigation" if children_count > 0 else ""),
                "criteria": ["risk_areas", "avoidability", "area_safety"],
                "user_preference_tags": safety_tags + (["navigation_safety"] if children_count > 0 else [])
            },
            "police_presence": {
                "location_a": "Regular patrol cars, community policing, quick response",
                "location_b": "Limited patrols, slower response times, understaffed",
                "winner": "location_a",
                "reason": "Superior police presence and community engagement" + (" provides peace of mind for families" if children_count > 0 else ""),
                "criteria": ["patrol_frequency", "response_time", "community_policing"],
                "user_preference_tags": safety_tags + (["emergency_response"] if children_count > 0 else [])
            },
            "safety_rating": {
                "location_a": "7.8/10",
                "location_b": "5.2/10",
                "winner": "location_a",
                "reason": "Significantly higher safety rating" + (" meets family safety standards" if children_count > 0 else ""),
                "criteria": ["overall_safety", "safety_metrics", "community_safety"],
                "user_preference_tags": safety_tags
            },
            "image_prompt": {
                "location_a": f"Well-lit residential street with sidewalks, street lamps, and visible security features (emphasizing {safety_focus})",
                "location_b": f"Dimly lit urban street with fewer safety features (contrasting {safety_focus} concerns)",
                "winner": "location_a",
                "reason": "Better visual representation of safety features that matter to user",
                "criteria": ["lighting", "visibility", "security_features"],
                "user_preference_tags": safety_tags + ["visual_safety"]
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        safety_focus = "family safety" if children_count > 0 else "general safety"
        
        return {
            "crime_rating": "Crime level assessment using AreaVibes, Neighborhood Scout, or local police data. Focus on safety factors most relevant to user's situation. Use FBI crime statistics or city crime reports.",
            "places_to_watch_out_for": "Specific areas using crime maps, police reports, or resident forums. Prioritize areas relevant to user's daily routines and family needs. Check City-Data forums or Nextdoor for local insights.",
            "police_presence": "Police patrol frequency using local police department data or community reports. Emphasize community policing and response times from official sources.",
            "safety_rating": "Overall safety score using AreaVibes, Neighborhood Scout, or Niche safety ratings. Weight factors based on user's safety priorities and family situation.",
            "image_prompt": f"Descriptive prompt for generating an image representing neighborhood safety (emphasizing {safety_focus})."
        }

class CultureAndEvents(BaseModel):
    local_events: ComparisonField = Field(...)
    seasonal_trends: ComparisonField = Field(...)
    community_engagement: ComparisonField = Field(...)
    culture_rating: ComparisonField = Field(...)
    image_prompt: ComparisonField = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        
        return {
            "local_events": {
                "location_a": "Art walks, harbor festivals, surf competitions, farmers markets",
                "location_b": "Business conferences, rooftop parties, cultural events, food festivals",
                "winner": "location_a",
                "reason": f"Events better match user's {lifestyle} lifestyle preferences"
            },
            "seasonal_trends": {
                "location_a": "Busy summers with beach events, quieter winters with indoor cultural activities",
                "location_b": "Year-round business events, peak activity during conference seasons",
                "winner": "location_a",
                "reason": "Seasonal variety provides better work-life balance"
            },
            "community_engagement": {
                "location_a": "Active neighborhood watch, volunteer cleanup days, high voter turnout",
                "location_b": "Professional networking groups, limited community involvement",
                "winner": "location_a",
                "reason": "Stronger community bonds and civic participation"
            },
            "culture_rating": {
                "location_a": "8.5/10",
                "location_b": "6.2/10",
                "winner": "location_a",
                "reason": "Higher cultural vibrancy and community activities"
            },
            "image_prompt": {
                "location_a": "Vibrant street festival with food vendors, live music, and families enjoying community activities",
                "location_b": "Business district with corporate events and professional networking gatherings",
                "winner": "location_a",
                "reason": "More appealing and inclusive community atmosphere"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        lifestyle = user_preferences.get("lifestyle_type", "laid-back") if user_preferences else "laid-back"
        
        return {
            "local_events": f"Regular events using Eventbrite, Meetup, city websites, or local news. Focus on events that align with user's {lifestyle} lifestyle and social preferences. Check City-Data forums for resident perspectives.",
            "seasonal_trends": "Seasonal activity changes using Nomad List seasonal data, local blogs, or tourism websites. Consider user's preferences for seasonal variety and activity levels.",
            "community_engagement": "Civic participation using city council meeting attendance, volunteer organization activity, or community board involvement. Check local government websites or community organizations.",
            "culture_rating": "Cultural vibrancy score using Niche culture ratings, AreaVibes lifestyle scores, or local arts organization data. Weight factors based on user's cultural priorities.",
            "image_prompt": "Descriptive prompt for generating an image of local culture and events that captures the community spirit appealing to the user."
        }

class SocialCharacter(BaseModel):
    income_level: ComparisonField = Field(...)
    religiosity: ComparisonField = Field(...)
    cultural_tone: ComparisonField = Field(...)
    social_rating: ComparisonField = Field(...)
    image_prompt: ComparisonField = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "income_level": {
                "location_a": "Middle-class professionals and young families, median household income $75,000",
                "location_b": "Upper-middle class executives and entrepreneurs, median household income $120,000",
                "winner": "location_a",
                "reason": f"Better matches user's income range: {income_range}"
            },
            "religiosity": {
                "location_a": "Moderate - several churches and temples, but not overly conservative",
                "location_b": "High - strong religious influence, many faith-based community activities",
                "winner": "location_a",
                "reason": "More balanced approach to religious community involvement"
            },
            "cultural_tone": {
                "location_a": "Laid-back but proud, environmentally conscious, welcoming to newcomers",
                "location_b": "Competitive and status-conscious, focused on achievement and networking",
                "winner": "location_a",
                "reason": "More relaxed and inclusive community atmosphere"
            },
            "social_rating": {
                "location_a": "8.2/10",
                "location_b": "6.8/10",
                "winner": "location_a",
                "reason": "Higher community inclusivity and social cohesion"
            },
            "image_prompt": {
                "location_a": "Diverse group of neighbors chatting at a community gathering, showing friendly social interaction",
                "location_b": "Well-dressed professionals at an upscale networking event with formal atmosphere",
                "winner": "location_a",
                "reason": "More welcoming and accessible community vibe"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "income_level": f"Economic demographic using Census data, Niche income data, or AreaVibes economic metrics. Consider how income levels align with user's financial situation ({income_range}) and social comfort.",
            "religiosity": "Religious activity using Census religious affiliation data, local religious organization directories, or community surveys. Assess compatibility with user's spiritual preferences.",
            "cultural_tone": "Social atmosphere using Google Maps reviews, Niche community insights, or political voting data. Focus on cultural aspects that match user's social preferences and values.",
            "social_rating": "Community inclusivity using Niche community ratings, AreaVibes social scores, or local diversity metrics. Weight factors based on user's social priorities and community involvement preferences.",
            "image_prompt": "Descriptive prompt for generating an image representing the social character that appeals to user's community preferences."
        }

class Restaurant(BaseModel):
    name: str = Field(...)
    vibe: Optional[str] = Field(None)
    what_to_try: Optional[str] = Field(None)

class Activity(BaseModel):
    name: str = Field(...)
    description: str = Field(...)

class Park(BaseModel):
    name: str = Field(...)
    features: str = Field(...)

class Amenity(BaseModel):
    name: str = Field(...)
    type: str = Field(...)
    vibe: Optional[str] = Field(None)

class LocalAmenities(BaseModel):
    restaurants: ComparisonField = Field(...)
    activities: ComparisonField = Field(...)
    parks: ComparisonField = Field(...)
    thrift_store: ComparisonField = Field(...)
    grocery_store: ComparisonField = Field(...)
    late_night_restaurant: ComparisonField = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        dining_prefs = user_preferences.get('dining_preferences', ['casual dining']) if user_preferences else ['casual dining']
        hobbies = user_preferences.get('hobbies_interests', ['outdoor activities']) if user_preferences else ['outdoor activities']
        
        # Format preferences for display
        dining_str = ', '.join(dining_prefs) if isinstance(dining_prefs, list) else str(dining_prefs)
        hobbies_str = ', '.join(hobbies) if isinstance(hobbies, list) else str(hobbies)
        
        return {
            "restaurants": {
                "location_a": [{
                    "name": "The Coastal Kitchen",
                    "vibe": "Casual beachside dining with ocean views",
                    "what_to_try": f"Fish tacos, clam chowder, sunset cocktails (matches user dining preferences: {dining_str})"
                }],
                "location_b": [{
                    "name": "Urban Bistro",
                    "vibe": "Upscale downtown dining with city views",
                    "what_to_try": "Craft cocktails, artisan pizza, weekend brunch"
                }],
                "winner": "location_a",
                "reason": f"Better matches user's dining preferences: {dining_str}"
            },
            "activities": {
                "location_a": [{
                    "name": "Sunset Beach Volleyball",
                    "description": f"Popular evening volleyball games on the main beach (aligns with user interests: {hobbies_str})"
                }],
                "location_b": [{
                    "name": "Downtown Art Walk",
                    "description": "Monthly art gallery tours and street performances"
                }],
                "winner": "location_a",
                "reason": f"Activities better match user's hobbies: {hobbies_str}"
            },
            "parks": {
                "location_a": [{
                    "name": "Seaside Community Park",
                    "features": "Playground, walking trails, picnic areas, dog park, ocean views"
                }],
                "location_b": [{
                    "name": "Central City Park",
                    "features": "Urban green space, fitness equipment, food trucks"
                }],
                "winner": "location_a",
                "reason": "More family-friendly features and natural setting"
            },
            "thrift_store": {
                "location_a": {
                    "name": "Coastal Treasures",
                    "type": "Thrift Store",
                    "vibe": "Eclectic vintage finds with local character"
                },
                "location_b": {
                    "name": "City Consignment",
                    "type": "Thrift Store",
                    "vibe": "Designer consignment with curated selection"
                },
                "winner": "location_a",
                "reason": "More unique and affordable vintage options"
            },
            "grocery_store": {
                "location_a": {
                    "name": "Whole Foods Market",
                    "type": "Grocery Store",
                    "vibe": "Upscale organic grocery with prepared foods and wine bar"
                },
                "location_b": {
                    "name": "Metro Market",
                    "type": "Grocery Store",
                    "vibe": "Large chain supermarket with competitive prices"
                },
                "winner": "location_a",
                "reason": "Higher quality organic options and prepared foods"
            },
            "late_night_restaurant": {
                "location_a": {
                    "name": "24/7 Diner",
                    "type": "Late Night Dining",
                    "vibe": "Classic American diner with comfort food"
                },
                "location_b": {
                    "name": "Night Owl Cafe",
                    "type": "Late Night Dining",
                    "vibe": "Modern cafe with late-night coffee and light bites"
                },
                "winner": "location_a",
                "reason": "Full menu available 24/7 vs limited late-night options"
            }
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
            "restaurants": f"Local dining establishments using Google Maps and Yelp. Focus on options that match user's dining preferences: {dining_str}. Include real names, vibes, and features.",
            "activities": f"Recreational activities using Google Maps and Yelp. Prioritize activities that align with user's interests: {hobbies_str}. Include real names and features.",
            "parks": "Green spaces using Google Maps and park websites. Consider accessibility, safety, and amenities. Include real names and specific features.",
            "thrift_store": "Thrift shopping using Google Maps and Yelp reviews. Assess quality, selection, and community character. Include real store names if available.",
            "grocery_store": "Grocery options using Google Maps and store websites. Consider quality, price range, and specialty offerings. Include real store names and chains.",
            "late_night_restaurant": "Late-night dining using Google Maps hours and Yelp reviews. Focus on convenience and lifestyle needs. Include real establishment names."
        }


class Commute(BaseModel):
    commute_times: ComparisonField = Field(...)
    public_transport: ComparisonField = Field(...)
    traffic: ComparisonField = Field(...)
    walkability: ComparisonField = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        commute_tolerance = user_preferences.get('commute_tolerance', 'under_30') if user_preferences else 'under_30'
        walkability_importance = user_preferences.get('walkability_importance', 'somewhat_important') if user_preferences else 'somewhat_important'
        
        return {
            "commute_times": {
                "location_a": "Downtown: 25 min, Airport: 45 min, Business District: 30 min",
                "location_b": "Downtown: 45 min, Airport: 20 min, Business District: 50 min",
                "winner": "location_a",
                "reason": f"Better overall commute times within user tolerance: {commute_tolerance} minutes"
            },
            "public_transport": {
                "location_a": "Metro bus every 15 min, light rail 0.5 miles, bike share",
                "location_b": "Limited bus service, no rail access, car-dependent",
                "winner": "location_a",
                "reason": "Superior transit options reduce car dependency"
            },
            "traffic": {
                "location_a": "Moderate rush hour congestion, generally light traffic",
                "location_b": "Heavy congestion most hours, frequent gridlock",
                "winner": "location_a",
                "reason": "Less stressful driving conditions"
            },
            "walkability": {
                "location_a": "Walk Score 85/100 - Most errands on foot, bike-friendly",
                "location_b": "Walk Score 45/100 - Car required for most errands",
                "winner": "location_a",
                "reason": f"High walkability matches user importance level: {walkability_importance}"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        commute_tolerance = user_preferences.get('commute_tolerance', 'under_30') if user_preferences else 'under_30'
        walkability_importance = user_preferences.get('walkability_importance', 'somewhat_important') if user_preferences else 'somewhat_important'
        
        return {
            "commute_times": f"Commute times using Redfin, Realtor.com, or Google Maps traffic data. Emphasize routes and times relevant to user's commute tolerance ({commute_tolerance}). Include peak vs off-peak times.",
            "public_transport": "Public transit using local transit authority websites, Google Maps transit, or Walk Score transit data. Focus on options that align with user's transportation preferences.",
            "traffic": "Traffic patterns using Google Maps traffic data, Waze insights, or City-Data forum discussions. Highlight peak times and alternative routes based on user's schedule flexibility.",
            "walkability": f"Pedestrian-friendliness using Walk Score, Google Street View, or local walkability assessments. Weight walkability factors based on user's walkability importance ({walkability_importance})."
        }

class FamilyFriendly(BaseModel):
    lots_of_kids: ComparisonField = Field(...)
    great_for_families: ComparisonField = Field(...)
    family_rating: ComparisonField = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "lots_of_kids": {
                "location_a": "High - Many families, playgrounds busy, school pickup lines",
                "location_b": "Low - Mostly young professionals, few children visible",
                "winner": "location_a" if children_count > 0 else "location_b",
                "reason": f"Better match for user with {children_count} children" if children_count > 0 else "Quieter environment suits childless lifestyle"
            },
            "great_for_families": {
                "location_a": "Excellent schools, safe streets, family events, parks nearby",
                "location_b": "Average schools, busy roads, limited family activities",
                "winner": "location_a",
                "reason": "Superior family amenities match user's family needs"
            },
            "family_rating": {
                "location_a": "9.2/10",
                "location_b": "6.8/10",
                "winner": "location_a",
                "reason": "Significantly higher family rating"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "lots_of_kids": f"'Yes / Some / Few' with reasoning using Niche family scores + Livability.com insights. Focus on family density and child-friendly atmosphere (user has {children_count} children).",
            "great_for_families": "Emphasize parks, schools, safety. Search '[neighborhood] with kids' or use Niche. Emphasize amenities and safety features most relevant to families with children.",
            "family_rating": "Honest reflection. Niche 'family grade' is a strong proxy. Weight factors based on user's family situation and child-related needs."
        }

class NightlifeAndDating(BaseModel):
    nightlife_rating: ComparisonField = Field(...)
    nightlife_score: ComparisonField = Field(...)
    best_spots: ComparisonField = Field(...)
    dating_scene: ComparisonField = Field(...)
    apps_popularity: ComparisonField = Field(...)
    image_prompt: ComparisonField = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        marital_status = user_preferences.get('marital_status', 'single') if user_preferences else 'single'
        age = user_preferences.get('age', 30) if user_preferences else 30
        
        return {
            "nightlife_rating": {
                "location_a": "7.5/10",
                "location_b": "9.2/10",
                "winner": "location_b",
                "reason": "Higher nightlife rating for active social life"
            },
            "nightlife_score": {
                "location_a": 7.5,
                "location_b": 9.2,
                "winner": "location_b",
                "reason": "Significantly higher nightlife score"
            },
            "best_spots": {
                "location_a": "Rooftop Lounge, Coastal Brewery, live music at The Pier",
                "location_b": "Trendy nightclubs, rooftop bars, late-night dining scene",
                "winner": "location_b",
                "reason": "More diverse and vibrant nightlife options"
            },
            "dating_scene": {
                "location_a": "Laid-back beach volleyball meetups, wine tastings, farmers market",
                "location_b": "Active young professional scene, networking events, upscale venues",
                "winner": "location_b",
                "reason": f"Better matches user profile: {marital_status}, age {age}, active lifestyle"
            },
            "apps_popularity": {
                "location_a": {"Bumble": "Popular", "Hinge": "Moderate", "Tinder": "Low"},
                "location_b": {"Bumble": "Very Popular", "Hinge": "Very Popular", "Tinder": "Popular"},
                "winner": "location_b",
                "reason": "Higher dating app activity indicates more active dating scene"
            },
            "image_prompt": "Vibrant evening scene with people enjoying rooftop dining and coastal nightlife"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        marital_status = user_preferences.get('marital_status', 'single') if user_preferences else 'single'
        age = user_preferences.get('age', 30) if user_preferences else 30
        
        return {
            "nightlife_rating": "Rate vibrancy of bars, music, and scenes using Yelp, Google Maps, or City-Data forum nightlife threads. Consider what appeals to the user's demographic and lifestyle.",
            "nightlife_score": "Numerical nightlife score using Yelp, Google Maps, or City-Data forum nightlife threads. Weight based on user's social preferences and age group.",
            "best_spots": "Popular bars, clubs, and entertainment venues using Yelp, Google Maps, or City-Data forum nightlife threads. Focus on venues that match the user's social style and interests.",
            "dating_scene": f"Describe energy and dating pool. Search 'dating in [city] Reddit' or Nomad List for vibe. Tailor to user's marital status ({marital_status}) and age ({age}) - focus on relevant social opportunities.",
            "apps_popularity": "Break down by app, score relative to national averages. Check Reddit threads or blog posts comparing app usage. Emphasize apps most relevant to user's age group and relationship goals.",
            "image_prompt": "Descriptive prompt for generating an image of local nightlife that reflects the user's preferred social atmosphere."
        }

class Development(BaseModel):
    upcoming_changes: ComparisonField = Field(...)
    zoning_or_construction: ComparisonField = Field(...)
    gentrification_signs: ComparisonField = Field(...)
    vacancy_or_decay: ComparisonField = Field(...)
    image_prompt: ComparisonField = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        return {
            "upcoming_changes": {
                "location_a": "New transit line planned for 2026, waterfront redevelopment project, park expansion",
                "location_b": "Highway widening project, strip mall development, limited infrastructure investment",
                "winner": "location_a",
                "reason": "More positive development with transit and green space improvements"
            },
            "zoning_or_construction": {
                "location_a": "Mixed-use development under construction, residential zoning allows ADUs, height limits preserved",
                "location_b": "Heavy industrial zoning nearby, high-density towers approved, limited construction controls",
                "winner": "location_a",
                "reason": "Better balanced zoning that preserves neighborhood character"
            },
            "gentrification_signs": {
                "location_a": "Moderate - Some rising property values, new businesses, but longtime residents staying",
                "location_b": "High - Rapid property value increases, longtime residents being displaced, chain stores replacing local businesses",
                "winner": "location_a",
                "reason": "More balanced development without excessive displacement"
            },
            "vacancy_or_decay": {
                "location_a": "Low vacancy rates, well-maintained properties, minimal urban decay",
                "location_b": "Some vacant storefronts, deferred maintenance visible, signs of economic stress",
                "winner": "location_a",
                "reason": "Better maintained neighborhood with economic stability"
            },
            "image_prompt": {
                "location_a": "Construction cranes and new development alongside established neighborhood character",
                "location_b": "Mix of vacant lots and overdevelopment creating inconsistent neighborhood feel",
                "winner": "location_a",
                "reason": "More thoughtful development that respects existing community"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        return {
            "upcoming_changes": "Search city planning sites, '[city] development projects', or local news. Look for major infrastructure, transit, or commercial projects. Focus on how these changes will impact the user's lifestyle and property values.",
            "zoning_or_construction": "Check city zoning maps, building permits, or construction notices. Use Google Maps satellite view to spot active construction sites. Assess how ongoing development affects livability and future neighborhood character.",
            "gentrification_signs": "Look for rising rents, new upscale businesses, demographic shifts. Search '[neighborhood] gentrification' or check local forums for resident discussions. Consider both positive improvements and potential displacement concerns.",
            "vacancy_or_decay": "Use Google Street View to assess building conditions, vacant lots, or boarded storefronts. Check local crime or economic indicators. Evaluate neighborhood stability and maintenance standards.",
            "image_prompt": "Descriptive prompt for generating an image of neighborhood development that reflects the area's growth trajectory."
        }

class EnvironmentUtilities(BaseModel):
    air_quality: ComparisonField = Field(...)
    noise_pollution: ComparisonField = Field(...)
    light_pollution: ComparisonField = Field(...)
    water_quality: ComparisonField = Field(...)
    avg_utility_costs: ComparisonField = Field(...)
    internet_speed: ComparisonField = Field(...)
    environmental_rating: ComparisonField = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "air_quality": {
                "location_a": "Good - AQI typically 45-65, minimal smog, ocean breeze helps circulation",
                "location_b": "Moderate - AQI 66-85, some smog during summer, limited air circulation",
                "winner": "location_a",
                "reason": "Better air quality for health and outdoor activities"
            },
            "noise_pollution": {
                "location_a": "Moderate - Some traffic noise on main roads, generally quiet residential streets",
                "location_b": "High - Heavy traffic noise, airport flight path, construction activity",
                "winner": "location_a",
                "reason": "Quieter environment for better quality of life"
            },
            "light_pollution": {
                "location_a": "Low to moderate - Can see some stars, street lighting present but not excessive",
                "location_b": "High - Bright city lights, minimal star visibility, excessive commercial lighting",
                "winner": "location_a",
                "reason": "Better night sky visibility and more natural lighting"
            },
            "water_quality": {
                "location_a": "Excellent - Meets all EPA standards, tastes good, no boil advisories in recent years",
                "location_b": "Good - Meets EPA standards but occasional taste/odor issues, rare advisories",
                "winner": "location_a",
                "reason": "Superior water quality and reliability"
            },
            "avg_utility_costs": {
                "location_a": {"Electricity": "$120", "Gas": "$45", "Water": "$35", "Internet": "$65"},
                "location_b": {"Electricity": "$180", "Gas": "$65", "Water": "$55", "Internet": "$85"},
                "winner": "location_a",
                "reason": f"Lower utility costs better fit user's income range: {income_range}"
            },
            "internet_speed": {
                "location_a": "Fiber available up to 1Gbps, cable up to 500Mbps, multiple provider options",
                "location_b": "Cable up to 200Mbps, limited fiber, fewer provider choices",
                "winner": "location_a",
                "reason": "Faster internet speeds and more provider competition"
            },
            "environmental_rating": {
                "location_a": "8.4/10",
                "location_b": "6.1/10",
                "winner": "location_a",
                "reason": "Higher overall environmental quality score"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        
        return {
            "air_quality": "Check EPA AirNow or IQAir for AQI data. Look for industrial sources, traffic patterns, or natural factors affecting air quality. Focus on health impacts and outdoor activity suitability.",
            "noise_pollution": "Use Google Street View to assess traffic volume, proximity to airports/highways. Check local noise ordinances or community complaints. Consider impact on sleep quality and daily comfort.",
            "light_pollution": "Use Dark Site Finder or Light Pollution Map. Consider street lighting, commercial areas, and night sky visibility. Assess impact on sleep and natural environment enjoyment.",
            "water_quality": "Check EPA Safe Drinking Water database or local water utility reports. Look for recent violations or boil advisories. Evaluate taste, safety, and reliability of water supply.",
            "avg_utility_costs": f"Search '[city] average utility costs' or check local utility company websites. Include electricity, gas, water, internet costs. Compare against user's income range ({income_range}) and budget expectations.",
            "internet_speed": "Use Speedtest.net coverage maps or check ISP availability. Important for remote work and modern connectivity needs. Consider work-from-home needs and entertainment requirements.",
            "environmental_rating": "Overall environmental quality score out of 10. Weight factors based on user's work-from-home needs and lifestyle preferences."
        }

class FinancialInformation(BaseModel):
    monthly_payment: ComparisonField = Field(...)
    property_taxes: ComparisonField = Field(...)
    value_assessment: ComparisonField = Field(...)
    investment_potential: ComparisonField = Field(...)
    financial_rating: ComparisonField = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        preferred_price_range = user_preferences.get('preferred_home_price_range', '$300,000-$500,000') if user_preferences else '$300,000-$500,000'
        
        return {
            "monthly_payment": {
                "location_a": "$3,200/month for median home (20% down, 6.5% rate)",
                "location_b": "$4,800/month for median home (20% down, 6.5% rate)",
                "winner": "location_a",
                "reason": f"Better fits user income range: {income_range} and preferred price: {preferred_price_range}"
            },
            "property_taxes": {
                "location_a": "1.2% rate, ~$7,200/year for median home",
                "location_b": "2.1% rate, ~$15,000/year for median home",
                "winner": "location_a",
                "reason": "Significantly lower tax burden"
            },
            "value_assessment": {
                "location_a": "Values up 8% last year, strong market, low inventory",
                "location_b": "Values down 2% last year, oversupply, market cooling",
                "winner": "location_a",
                "reason": "Better investment appreciation potential"
            },
            "investment_potential": {
                "location_a": "High - Growing tech sector, transit improvements, 4-5% rental yields",
                "location_b": "Moderate - Stable but slow growth, 2-3% rental yields",
                "winner": "location_a",
                "reason": "Superior growth drivers and rental income potential"
            },
            "financial_rating": {
                "location_a": "8.7/10",
                "location_b": "6.2/10",
                "winner": "location_a",
                "reason": "Higher overall financial score"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        income_range = user_preferences.get('income_range', '$50,000-$75,000') if user_preferences else '$50,000-$75,000'
        preferred_price_range = user_preferences.get('preferred_home_price_range', '$300,000-$500,000') if user_preferences else '$300,000-$500,000'
        
        return {
            "monthly_payment": f"Estimated monthly mortgage payment using Redfin, Realtor.com, or mortgage calculators. Consider user's income range ({income_range}) and preferred price range ({preferred_price_range}) when providing context.",
            "property_taxes": "Annual property tax rates using county assessor websites or Redfin/Realtor.com tax data. Relate to user's financial capacity and budget expectations.",
            "value_assessment": "Property value trends using Redfin, Zillow, or Realtor.com market data. Frame in context of user's investment timeline and financial goals.",
            "investment_potential": "Long-term outlook using rental yield data, population growth, and economic indicators. Consider user's investment experience and risk tolerance.",
            "financial_rating": "Overall financial attractiveness score out of 10. Weight factors based on user's financial priorities and constraints."
        }

class SchoolInfo(BaseModel):
    level: ComparisonField = Field(...)
    walking_distance: ComparisonField = Field(...)
    school_rating: ComparisonField = Field(...)
    teacher_quality: ComparisonField = Field(...)
    known_for: ComparisonField = Field(...)
    gpa_avg: ComparisonField = Field(...)
    sat_avg: ComparisonField = Field(...)
    grad_rate: ComparisonField = Field(...)
    top_colleges: ComparisonField = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "level": "Elementary",
            "walking_distance": True if children_count > 0 else False,
            "school_rating": "9.2/10",
            "teacher_quality": "Excellent - 85% have advanced degrees, low turnover, award-winning programs",
            "known_for": "STEM programs, arts integration, dual language immersion",
            "gpa_avg": 3.7,
            "sat_avg": 1340,
            "grad_rate": 96.5,
            "top_colleges": "UC Berkeley, Stanford, UCLA, USC, Cal Poly"
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "level": "Elementary, Middle, or High School designation using GreatSchools.org or Niche for school level information. Focus on levels relevant to user's children.",
            "walking_distance": f"Whether school is within walking distance (typically under 0.5 miles) using Google Maps to measure distance from property. Important for families with {children_count} children for safety and convenience.",
            "school_rating": "GreatSchools rating out of 10 or similar metric using GreatSchools.org, Niche, or state education department ratings. Weight academic performance and factors most important to the user's educational priorities.",
            "teacher_quality": "Teacher qualifications, experience, and student-teacher ratios using school websites or education department data. Assess teacher credentials, retention, and program excellence.",
            "known_for": "Special programs, academic strengths, or unique offerings using school websites, awards, and community reputation. Highlight programs that align with user's educational values and children's interests.",
            "gpa_avg": "Average GPA if available for high schools using school report cards or state education data. Relevant for families with older children planning for college.",
            "sat_avg": "Average SAT scores for high schools using school websites or state/district report cards. Important for college preparation and academic achievement assessment.",
            "grad_rate": "Graduation rate percentage from state education departments or school report cards. Indicates school success in supporting students through completion.",
            "top_colleges": "Common college destinations for graduates using school websites or guidance counselor information. Shows school's track record for college preparation and placement."
        }

class Schools(BaseModel):
    schools: ComparisonField = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "schools": {
                "location_a": {
                    "Seaside Elementary": {
                        "level": "Elementary",
                        "walking_distance": True,
                        "school_rating": "9.2/10",
                        "teacher_quality": "Excellent - 85% have advanced degrees, low turnover",
                        "known_for": "STEM programs, arts integration",
                        "gpa_avg": None,
                        "sat_avg": None,
                        "grad_rate": None,
                        "top_colleges": None
                    },
                    "Coastal High School": {
                        "level": "High School",
                        "walking_distance": False,
                        "school_rating": "8.7/10",
                        "teacher_quality": "Very Good - Strong AP program, experienced staff",
                        "known_for": "College prep, marine science program",
                        "gpa_avg": 3.7,
                        "sat_avg": 1340,
                        "grad_rate": 96.5,
                        "top_colleges": "UC Berkeley, Stanford, UCLA, USC"
                    }
                },
                "location_b": {
                    "Metro Elementary": {
                        "level": "Elementary",
                        "walking_distance": False,
                        "school_rating": "7.1/10",
                        "teacher_quality": "Good - Some turnover, mixed experience levels",
                        "known_for": "Basic curriculum, limited special programs",
                        "gpa_avg": None,
                        "sat_avg": None,
                        "grad_rate": None,
                        "top_colleges": None
                    }
                },
                "winner": "location_a",
                "reason": f"Better school quality and options for families with {children_count} children"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        children_count = user_preferences.get('children_count', 0) if user_preferences else 0
        
        return {
            "schools": f"Dictionary of local schools with comprehensive information using GreatSchools.org, Niche, or state education department data for accurate school ratings, programs, and performance metrics. Focus on schools within reasonable distance of the property. Compare educational opportunities between locations for families with {children_count} children."
        }

class ExtraTips(BaseModel):
    parking: ComparisonField = Field(...)
    pet_friendly: ComparisonField = Field(...)
    cell_service_quality: ComparisonField = Field(...)
    other_notable_tips: ComparisonField = Field(...)
    
    @classmethod
    def get_example(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate personalized example based on user preferences"""
        return {
            "parking": {
                "location_a": "Street parking mostly free, 2-hour limits near shops, resident permits available for $50/year",
                "location_b": "Paid parking meters $2/hour, limited street parking, monthly garage passes $150",
                "winner": "location_a",
                "reason": "More affordable and accessible parking options"
            },
            "pet_friendly": {
                "location_a": "Very pet-friendly - 3 dog parks within 1 mile, many restaurants allow dogs, vet clinic nearby",
                "location_b": "Moderately pet-friendly - 1 dog park, some pet restrictions, vet clinic 3 miles away",
                "winner": "location_a",
                "reason": "Better pet amenities and services"
            },
            "cell_service_quality": {
                "location_a": "Excellent coverage for all major carriers, 5G available, minimal dead zones",
                "location_b": "Good coverage but some dead spots, limited 5G, carrier-dependent quality",
                "winner": "location_a",
                "reason": "Superior cellular coverage and connectivity"
            },
            "other_notable_tips": {
                "location_a": "Best coffee at Corner Cafe, avoid Main St during school pickup, farmers market Saturdays 8am-2pm",
                "location_b": "Traffic heavy 7-9am and 5-7pm, limited local businesses, chain restaurants dominate",
                "winner": "location_a",
                "reason": "More local character and insider knowledge available"
            }
        }
    
    @classmethod
    def get_description(cls, user_preferences: Dict[str, Any] = None) -> Dict[str, str]:
        """Generate personalized field descriptions based on user preferences"""
        return {
            "parking": "Street parking rules, permit requirements, garage availability using Google Street View to assess parking density and local parking signs. Consider user's vehicle needs and budget for parking expenses.",
            "pet_friendly": "Dog parks, pet stores, veterinarians, pet policies. Search '[neighborhood] dog park' or use Google Maps to find pet amenities. Focus on features relevant to user's pet ownership and animal preferences.",
            "cell_service_quality": "Coverage quality for major carriers using carrier coverage maps or local forums for dead zone reports. Assess connectivity needs for work, communication, and entertainment.",
            "other_notable_tips": "Local insider knowledge, best times to visit places, hidden gems, traffic patterns using local forums, Reddit, or Nextdoor for community insights. Provide practical advice that helps users navigate daily life in each location."
        }

class ComparisonReport(BaseModel):
    # === All your sections ===
    comparison_summary: Optional[ComparisonSummary] = None
    neighborhood_overview: Optional[NeighborhoodOverview] = None
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
        
        # Filter properties to only include prioritized fields and make them required (non-nullable)
        if "properties" in base:
            filtered_properties = {}
            for field_name in prioritized_fields:
                if field_name in base["properties"]:
                    prop_def = base["properties"][field_name]
                    
                    # Remove nullable option - convert from anyOf to direct $ref
                    if isinstance(prop_def, dict) and "anyOf" in prop_def:
                        # Find the $ref option (non-null)
                        for option in prop_def["anyOf"]:
                            if isinstance(option, dict) and "$ref" in option:
                                # Replace anyOf with direct $ref (making it required)
                                filtered_properties[field_name] = {
                                    "$ref": option["$ref"]
                                }
                                # Preserve example if it exists
                                if "example" in prop_def:
                                    filtered_properties[field_name]["example"] = prop_def["example"]
                                break
                    else:
                        # Keep as-is if not using anyOf pattern
                        filtered_properties[field_name] = prop_def
            
            base["properties"] = filtered_properties
            base["required"] = list(filtered_properties.keys())
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
            
            # Remove nullable anyOf patterns from $defs properties and ensure all fields are constrained
            for def_name, def_content in base["$defs"].items():
                if "properties" in def_content:
                    constrained_properties = {}
                    for prop_name, prop_def in def_content["properties"].items():
                        if isinstance(prop_def, dict) and "anyOf" in prop_def:
                            # Find the non-null references
                            non_null_refs = [item for item in prop_def["anyOf"] if item.get("type") != "null"]
                            if len(non_null_refs) >= 1:
                                if len(non_null_refs) == 1:
                                    # Single non-null type: replace with direct reference
                                    constrained_properties[prop_name] = non_null_refs[0]
                                    logger.info(f"🔧 Removed nullable anyOf for {def_name}.{prop_name}, now required (single type)")
                                else:
                                    # Multiple non-null types: For Perplexity compliance, pick the first non-null type
                                    # This avoids unconstrained anyOf patterns that Perplexity rejects
                                    constrained_properties[prop_name] = non_null_refs[0]
                                    logger.info(f"🔧 Simplified anyOf to single type for {def_name}.{prop_name} (Perplexity compliance)")
                            else:
                                # No valid types found, default to string
                                constrained_properties[prop_name] = {"type": "string"}
                                logger.warning(f"⚠️ No valid types in anyOf for {def_name}.{prop_name}, defaulting to string")
                        elif isinstance(prop_def, dict):
                            # Ensure all properties have a type constraint
                            if "type" not in prop_def and "$ref" not in prop_def:
                                # If it's an object without type, add type constraint
                                if "properties" in prop_def:
                                    prop_def["type"] = "object"
                                else:
                                    prop_def["type"] = "string"  # Default to string for safety
                                logger.info(f"🔧 Added missing type constraint for {def_name}.{prop_name}")
                            constrained_properties[prop_name] = prop_def
                        else:
                            # Non-dict properties, ensure they're constrained
                            constrained_properties[prop_name] = prop_def
                    
                    # Update the properties with constrained versions
                    base["$defs"][def_name]["properties"] = constrained_properties
                    
                    # Ensure the definition itself has required type
                    if "type" not in base["$defs"][def_name]:
                        base["$defs"][def_name]["type"] = "object"
                        logger.info(f"🔧 Added missing type to definition {def_name}")

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

        base["required"] = list(filtered_properties.keys())
        base["type"] = "object"  # required for top-level schema
        base["$schema"] = "https://json-schema.org/draft/2020-12/schema"  # optional but recommended
        
        # Comprehensive safety check: ensure all fields have proper type constraints for Perplexity compliance
        def ensure_field_constraints(properties_dict, context="top-level"):
            """Recursively ensure all properties have proper type constraints"""
            for fname, fdef in properties_dict.items():
                if isinstance(fdef, dict):
                    # Check if field has proper constraints
                    if "$ref" not in fdef and "type" not in fdef:
                        logger.warning(f"❌ Unconstrained field '{fname}' in {context} — auto-fixing with 'type: object'")
                        fdef["type"] = "object"
                    
                    # Recursively check nested properties
                    if "properties" in fdef and isinstance(fdef["properties"], dict):
                        ensure_field_constraints(fdef["properties"], f"{context}.{fname}")
                    
                    # Check anyOf patterns that might still exist
                    if "anyOf" in fdef:
                        # For Perplexity compliance, replace anyOf with the first valid type
                        any_of_items = fdef["anyOf"]
                        if isinstance(any_of_items, list) and len(any_of_items) > 0:
                            # Find first item with proper constraints
                            for item in any_of_items:
                                if isinstance(item, dict) and ("type" in item or "$ref" in item):
                                    # Replace anyOf with this constrained item
                                    fdef.clear()
                                    fdef.update(item)
                                    logger.info(f"🔧 Replaced anyOf with constrained type for {context}.{fname}")
                                    break
                            else:
                                # No valid constrained items found, default to string
                                fdef.clear()
                                fdef["type"] = "string"
                                logger.warning(f"⚠️ No constrained items in anyOf for {context}.{fname}, defaulting to string")
        
        # Apply constraints to top-level properties
        if "properties" in base:
            ensure_field_constraints(base["properties"], "top-level")
        
        # Apply constraints to all $defs
        if "$defs" in base:
            for def_name, def_content in base["$defs"].items():
                if "properties" in def_content:
                    ensure_field_constraints(def_content["properties"], f"$defs.{def_name}")

        return base