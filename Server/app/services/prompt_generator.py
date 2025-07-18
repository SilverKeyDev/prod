def generate_prompt(address: str,
                    include_neighborhood_overview=True,
                    include_safety=True,
                    include_culture_and_events=True,
                    include_weather=True,
                    include_social_character=True,
                    include_local_amenities=True,
                    include_commute=True,
                    include_family_friendly=True,
                    include_nightlife_and_dating=True,
                    include_accessibility=True,
                    include_development=True,
                    include_environment=True,
                    include_money=True,
                    include_schools=True,
                    include_extra_tips=True) -> str:
    return f"""
CRITICAL: Output ONLY a valid JSON object. Nothing else.

You are given a location: "{address}".
Use the template JSON structure below. 

You MUST include ALL fields exactly as shown — if you don't know the value, research further until you find a value.
I want the returned JSON to contain ALL of this information in the same way it is displayed below.

You MUST embed image URLs where appropriate (3–6 total), placing them naturally throughout fields like parks, nightlife, maps, or local culture — not just at the end.

You MUST embed image references where appropriate (3–6 total), placing them naturally throughout fields — not just at the end.

I want you to be very critical and expose the good and bad about these places. Do not be afraid to give a negative rating or comment.

If there is no data for a field, give your best guess, and note that it is an estimate, not exact.

Begin and end your output with curly brackets.
DO NOT add any explanation, commentary, markdown, or thinking tags.

{{
  { _section_neighborhood_overview(address).strip() }
  { _section_safety(address, include_safety).strip() }
  { _section_culture_and_events(include_culture_and_events).strip() }
  { _section_weather(address, include_weather).strip() }
  { _section_social_character(include_social_character).strip() }
  { _section_local_amenities(address, include_local_amenities).strip() }
  { _section_commute(include_commute).strip() }
  { _section_family_friendly(include_family_friendly).strip() }
  { _section_nightlife_and_dating(include_nightlife_and_dating).strip() }
  { _section_accessibility(include_accessibility).strip() }
  { _section_extra_tips(include_extra_tips).strip() }
  { _section_development(address, include_development).strip() }
  { _section_environment_utilities(include_environment).strip() }
  { _section_money_stuff(include_money).strip() }
  { _section_schools(address, include_schools).strip() }
}}
"""

def _section_neighborhood_overview(address, enabled=True):
    if not enabled:
        return ""
    return f'''
  {address}: {{
    "local_culture": "Uptown Charlotte is the sleek, busy center of the city—think glass buildings, rooftop bars, green parks, and a steady 9-to-5 buzz. It's where suits and creatives mix, and there's usually something happening: sports games, live music, street festivals.",
    "vibe": "Lively, youthful, walkable.",
    "known_for": "Atlanta is the cultural and technological hub of the South, and big on nightlife and music.",
    "community_events": "Monthly street fairs and local concerts.",
    "what_people_love": "Friendly neighbors, lots of coffee shops.",
    "things_to_watch_out_for": "Occasional late-night noise and traffic.",
    "population_total": "1,200,000 people",
    "neighborhood_rating": "8.5/10",
    "image_prompt": "{address}",
    "demographics": {{
      "neighborhood_dna": {{
       "tech_hub": "30%",
       "family_friendly": "15%",
       "nightlife": "45%",
       "tourist_area": "10%",
       "suburban": "5%"
     }},
      "gender_distribution": {{
        "percent_men": "48.3%",
        "percent_women": "51.7%"
      }},
      "racial_distribution": {{
        "White": "60.2%",
        "Black": "10.5%",
        "Hispanic": "18.4%",
        "Asian": "7.1%",
        "Other": "3.8%"
      }},
      "age_distribution": {{
        "0-17": "12.3%",
        "18-24": "14.1%",
        "25-34": "32.7%",
        "35-44": "18.9%",
        "45-64": "16.4%",
        "65+": "5.6%"
      }},
      "LGBTQ_representation": "9.1/10, many gay bars, 14% of local population is LGBTQ+"
    }}
  }},
'''

def _section_safety(address, enabled=True):
    if not enabled:
        return ""
    return f'''
  "safety": {{
    "crime_rating": "Moderate",
    "places_to_watch_out_for": "Downtown at night and the Eastside are extremely risky",
    "police_presence": "Visible on weekends and evenings",
    "safety_rating": "7.5/10",
    "image_prompt": "crime heatmap for {address}"
  }},
'''

def _section_culture_and_events(address, enabled=True):
    if not enabled:
        return ""
    return '''
  "culture_and_events": {
    "local_events": "Art Walk, Summer Jazz Fest",
    "seasonal_trends": "Busy in summer, quiet winters",
    "community_engagement": "Active neighborhood watch and cleanup days",
    "culture_rating": "9.0/10",
    "image_prompt": "Atlanta summer jazz fest"
  },
'''

def _section_weather(address, enabled=True):
    if not enabled:
        return ""
    return f'''
  "weather": {{
    "spring": "Avg low: 50, Avg high: 70, slightly cloudy, low humidity",
    "summer": "Avg low: 65, Avg high: 85, very hot, high humidity",
    "fall": "Avg low: 45, Avg high: 65, very temperate, best time to visit",
    "winter": "Avg low: 30, Avg high: 50, cold, high chance of rain, low chance of snow",
    "image_prompt": "yearly weather chart for Atlanta, GA"
  }},
'''

def _section_social_character(enabled=True):
    if not enabled:
        return ""
    return '''
  "social_character": {
    "income_level": "Middle to upper-middle class",
    "political_leaning": "Leans progressive in suburbs and is strongly progressive in central city",
    "language_spoken": "English dominant, Spanish common",
    "religiosity": "Low to moderate",
    "cultural_tone": "Inclusive and artsy",
    "social_rating": 8.5/10,
    "image_prompt": "Atlanta voting map 2024"
  },
'''

def _section_local_amenities(address, enabled=True):
    if not enabled:
        return ""
    return f'''
  "local_amenities": {{
    "restaurants": [
      {{
        "name": "The Hollow Oak",
        "vibe": "Cozy gastropub",
        "what_to_try": "Lamb burger with truffle fries",
      }}
    ],
    "activities": [
      {{
        "name": "Saturday Farmers Market",
        "description": "Local produce, crafts, and live music"
      }}
    ],
    "parks": [
      {{
        "name": "Maple Grove Park",
        "features": "Playground, tennis courts, dog run"
      }}
    ],
    "thrift_store": {{
      "name": "Revive & Repeat",
      "type": "Vintage clothing and home goods",
    }},
    "grocery_store": {{
      "name": "Publix",
      "type": "Organic and local groceries",
    }},
    "late_night_restaurant": {{
      "name": "Taco Bell",
      "vibe": "Fast food",
    }}
  }},
'''

def _section_commute(enabled=True):
    if not enabled:
        return ""
    return '''
  "commute": {
    "commute_times": "20 min to downtown by car, 35 by bus",
    "public_transport": "MARTA trains are okay for transportation but don't go beyond downtown; streetcars and buses are also present",
    "traffic": "Heavy traffic in the mornings and evenings, moderate in afternoons",
    "walkability": "5.2/10"
  },
'''

def _section_family_friendly(enabled=True):
    if not enabled:
        return ""
    return '''
  "family_friendly": {
    "lots_of_kids": "Yes, very family-oriented",
    "great_for_families": "Safe, good schools, lots of parks",
    "family_rating": "9.2/10"
  },
'''

def _section_nightlife_and_dating(enabled=True):
    if not enabled:
        return ""
    return '''
  "nightlife_and_dating": {
    "nightlife_rating": "High",
    "nightlife_score": 8.7/10,
    "best_spots": "Moonlight Lounge, The Vinyl Room, The 404, Drinks and Sounds",
    "dating_scene": "Vibrant and casual",
    "average_attractiveness_rating": "4.7/10",
    "apps_popularity": {
      "tinder": "High",
      "hinge": "Medium"
    },
    "image_prompt": "The Vinyl Room"
  },
'''

def _section_accessibility(enabled=True):
    if not enabled:
        return ""
    return '''
  "accessibility": {
    "wheelchair_friendly": "Yes, sidewalks and ramps throughout",
    "ada_compliance": "Generally compliant, though older buildings may vary",
    "age_friendly": "Good for seniors, with parks and health clinics nearby",
    "accessibility_rating": "8.0/10"
  },
'''

def _section_development(address, enabled=True):
    if not enabled:
        return ""
    return f'''
  "development": {{
    "upcoming_changes": "New light rail stop being added",
    "zoning_or_construction": "Several multi-use complexes approved",
    "gentrification_signs": "Yes, rising rents and boutique stores",
    "vacancy_or_decay": "Low vacancy; well-maintained",
    "image_prompt": "zoning map for {address}"
  }},
'''

def _section_environment_utilities(enabled=True):
    if not enabled:
        return ""
    return '''
  "environment_and_utilities": {
    "air_quality": "Good",
    "noise_pollution": "Moderate near main roads",
    "light_pollution": "Noticeable at night in central areas",
    "water_quality": "Safe for drinking",
    "avg_utility_costs": {
      "electricity": "$120",
      "gas": "$60",
      "water": "$45"
    },
    "internet_speed": "Fast (avg 500 Mbps)",
    "environmental_rating": "7.5/10"
  },
'''

def _section_money_stuff(enabled=True):
    if not enabled:
        return ""
    return '''
  "money_stuff": {
    "monthly_payment": "$2750/month",
    "property_taxes": "$6300/year",
    "value_assessment": "Rising",
    "investment_potential": "Strong for rentals or resale",
    "financial_rating": "8.2/10"
  },
'''

def _section_schools(address, enabled=True):
    if not enabled:
        return ""
    return f'''
   "schools": [
    {{
      "name": "Westwood Charter Elementary School",
      "level": "elementary",
      "walking_distance": true,
      "niche_rating": "A",
      "teacher_quality": "Excellent",
      "known_for": "Supportive staff, creative learning environment"
    }},
    {{
      "name": "Emerson Community Charter School",
      "level": "middle",
      "walking_distance": false,
      "school_rating": "A-",
      "teacher_quality": "Very Good",
      "known_for": "Safe and inclusive, strong academic curriculum"
    }},
    {{
      "name": "Palisades Charter High School",
      "level": "high",
      "walking_distance": false,
      "school_rating": "A+",
      "gpa_avg": 3.8,
      "sat_avg": 1320,
      "grad_rate": 96.1,
      "top_colleges": "UCLA, UC Berkeley, USC",
      "teacher_quality": "Outstanding",
      "known_for": "very intense and excellent education, problems with mental health in the past"
    }}
  ],
'''

def _section_extra_tips(enabled=True):
    if not enabled:
        return ""
    return '''
  "extra_tips": {
    "parking": "Street parking can be tough after 7pm and on weekends",
    "pet_friendly": "Most restaurants and parks welcome dogs",
    "cell_service_quality": "Strong across all major carriers",
    "other_notable_tips": "People around here tend to love run clubs and the beltline, including on weekdays"
  }
'''