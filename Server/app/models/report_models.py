from pydantic import BaseModel, Field, Extra
from typing import List, Dict, Optional, Any

class Demographics(BaseModel):
    neighborhood_distribution: Dict[str, str]
    gender_distribution: Dict[str, str]
    racial_distribution: Dict[str, str]
    age_distribution: Dict[str, str]

class NeighborhoodOverview(BaseModel):
    local_culture: str
    vibe: str
    known_for: str
    community_events: str
    what_people_love: str
    things_to_watch_out_for: str
    population_total: str
    neighborhood_rating: str
    image_prompt: str
    LGBTQ_representation: str
    demographics: Demographics

class Safety(BaseModel):
    crime_rating: str
    places_to_watch_out_for: str
    police_presence: str
    safety_rating: str
    image_prompt: str

class CultureAndEvents(BaseModel):
    local_events: str
    seasonal_trends: str
    community_engagement: str
    culture_rating: str
    image_prompt: str

class Weather(BaseModel):
    spring: str
    summer: str
    fall: str
    winter: str
    image_prompt: str

class SocialCharacter(BaseModel):
    income_level: str
    political_leaning: str
    language_spoken: str
    religiosity: str
    cultural_tone: str
    social_rating: str
    image_prompt: str

class Restaurant(BaseModel):
    name: str
    vibe: str
    what_to_try: str

class Activity(BaseModel):
    name: str
    description: str

class Park(BaseModel):
    name: str
    features: str

class Amenity(BaseModel):
    name: str
    type: str
    vibe: Optional[str] = None

class LocalAmenities(BaseModel):
    restaurants: List[Restaurant]
    activities: List[Activity]
    parks: List[Park]
    thrift_store: Amenity
    grocery_store: Amenity
    late_night_restaurant: Amenity

class Commute(BaseModel):
    commute_times: str
    public_transport: str
    traffic: str
    walkability: str

class FamilyFriendly(BaseModel):
    lots_of_kids: str
    great_for_families: str
    family_rating: str

class NightlifeAndDating(BaseModel):
    nightlife_rating: str
    nightlife_score: float
    best_spots: str
    dating_scene: str
    average_attractiveness_rating: str
    apps_popularity: Dict[str, str]
    image_prompt: str


class Accessibility(BaseModel):
    wheelchair_friendly: str
    ada_compliance: str
    age_friendly: str
    accessibility_rating: str

class Development(BaseModel):
    upcoming_changes: str
    zoning_or_construction: str
    gentrification_signs: str
    vacancy_or_decay: str
    image_prompt: str

class EnvironmentUtilities(BaseModel):
    air_quality: str
    noise_pollution: str
    light_pollution: str
    water_quality: str
    avg_utility_costs: Dict[str, str]
    internet_speed: str
    environmental_rating: str

class MoneyStuff(BaseModel):
    monthly_payment: str
    property_taxes: str
    value_assessment: str
    investment_potential: str
    financial_rating: str

class School(BaseModel):
    name: str
    level: str
    walking_distance: Optional[bool] = None
    school_rating: Optional[str] = None
    teacher_quality: str
    known_for: str
    gpa_avg: Optional[float] = None
    sat_avg: Optional[int] = None
    grad_rate: Optional[float] = None
    top_colleges: Optional[str] = None

class Schools(BaseModel):
    schools: List[School]

class ExtraTips(BaseModel):
    parking: str
    pet_friendly: str
    cell_service_quality: str
    other_notable_tips: str




class FullReport(BaseModel):
    # Address key and overview must be provided
    neighborhood_overview: NeighborhoodOverview

    # Optional sections
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
    money_stuff: Optional[MoneyStuff] = None
    schools: Optional[Schools] = None
    extra_tips: Optional[ExtraTips] = None

    class Config:
        extra = Extra.allow  # Still allow unknown fields just in case

    def __init__(self, **data):
        # Identify the dynamic address key (should be the only unknown field)
        known_keys = {
            'safety', 'culture_and_events', 'weather', 'social_character',
            'local_amenities', 'commute', 'family_friendly', 'nightlife_and_dating',
            'accessibility', 'development', 'environment_utilities', 'money_stuff',
            'schools', 'extra_tips'
        }

        dynamic_address_key = next((k for k in data if k not in known_keys), None)
        if not dynamic_address_key:
            raise ValueError("Missing dynamic address key (e.g., '123 Main St')")

        address_section = data.pop(dynamic_address_key)

        # Populate neighborhood_overview and address_key
        data['address_key'] = dynamic_address_key
        data['neighborhood_overview'] = NeighborhoodOverview(**address_section)

        super().__init__(**data)
