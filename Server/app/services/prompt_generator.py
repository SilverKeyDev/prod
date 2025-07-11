def generate_prompt(address: str) -> str:
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
  "neighborhood": {{
    "overview of the neighborhood culture": "Uptown Charlotte is the sleek, busy center of the city—think glass buildings, rooftop bars, green parks, and a steady 9-to-5 buzz. It's where suits and creatives mix, and there's usually something happening: sports games, live music, street festivals.",
    "vibe": "Lively, youthful, walkable.",
    "community_events": "Monthly street fairs and local concerts.",
    "what_people_love": "Friendly neighbors, lots of coffee shops.",
    "things_to_watch_out_for": "Occasional late-night noise and traffic.",
    "neighborhood_image": "https://example.com/images/uptown-skyline.jpg",
    "neighborhood_rating": 8.5,
    "demographics": {{
      "neighborhood": {{
        "percent_men": 48.3,
        "percent_women": 51.7,
        "racial_breakdown": {{
          "White": 60.2,
          "Black": 10.5,
          "Hispanic": 18.4,
          "Asian": 7.1,
          "Other": 3.8
        }},
        "age_distribution": {{
          "0-17": 12.3,
          "18-24": 14.1,
          "25-34": 32.7,
          "35-44": 18.9,
          "45-64": 16.4,
          "65+": 5.6
        }},
        "LGBTQ_representation": "9/10, many gay bars, 14% of local population is LGBTQ+",
        "demographic_chart": "https://example.com/images/neighborhood-demographics-pie.png"
      }},
    }}
  }},
  "safety": {{
    "crime_rating": "Moderate",
    "crime_score": 6.5,
    "heatmap_description": "Some high-theft zones near downtown.",
    "sex_offender_info": "None within 0.5 miles.",
    "street_lighting": "Well-lit throughout.",
    "police_presence": "Visible on weekends and evenings.",
    "flood_or_fire_risk": "Low risk zone.",
    "crime_heatmap": "https://example.com/images/charlotte-crime-heatmap.png"
  }},
  "accessibility": {{
    "wheelchair_friendly": "Yes, sidewalks and ramps throughout.",
    "ada_compliance": "Generally compliant, though older buildings may vary.",
    "age_friendly": "Good for seniors, with parks and health clinics nearby.",
    "accessibility_rating": 8.0
  }},
  "development": {{
    "upcoming_changes": "New light rail stop being added.",
    "zoning_or_construction": "Several multi-use complexes approved.",
    "gentrification_signs": "Yes, rising rents and boutique stores.",
    "vacancy_or_decay": "Low vacancy; well-maintained.",
    "development_map": "https://example.com/images/charlotte-zoning-map.png"
  }},
  "culture_and_events": {{
    "local_events": ["Art Walk", "Summer Jazz Fest"],
    "seasonal_trends": "Busy in summer, quiet winters.",
    "community_engagement": "Active neighborhood watch and cleanup days.",
    "culture_rating": 9.0
  }},
  "environment_and_utilities": {{
    "air_quality": "Good",
    "noise_pollution": "Moderate near main roads.",
    "light_pollution": "Noticeable at night in central areas.",
    "water_quality": "Safe for drinking.",
    "trash_pickup_days": "Tuesday & Friday",
    "avg_utility_costs": {{
      "electricity": 120,
      "gas": 60,
      "water": 45
    }},
    "internet_speed": "Fast (avg 500 Mbps)",
    "environmental_rating": 7.5
  }},
  "social_character": {{
    "income_level": "Middle to upper-middle class",
    "political_leaning": "Progressive",
    "language_spoken": "English dominant, Spanish common",
    "religiosity": "Low to moderate",
    "cultural_tone": "Inclusive and artsy",
    "social_rating": 8.5
  }},
  "money_stuff": {{
    "monthly_payment": 2750,
    "property_taxes": 6300,
    "value_assessment": "Rising",
    "investment_potential": "Strong for rentals or resale",
    "financial_rating": 8.2
  }},
  "cool_stuff_nearby": {{
    "restaurants": [
      {{
        "name": "The Hollow Oak",
        "vibe": "Cozy gastropub",
        "what_to_try": "Lamb burger with truffle fries",
        "image": "https://example.com/images/hollow-oak-interior.jpg"
      }}
    ],
    "activities": [
      {{
        "name": "Saturday Farmers Market",
        "description": "Local produce, crafts, and live music",
        "image": "https://example.com/images/farmers-market.jpg"
      }}
    ],
    "parks": [
      {{
        "name": "Maple Grove Park",
        "features": "Playground, tennis courts, dog run",
        "image": "https://example.com/images/maple-grove-park.jpg"
      }}
    ],
    "shopping": [
      {{
        "store": "Thrive Collective",
        "type": "Boutique gifts and apparel",
        "image": "https://example.com/images/thrive-collective.jpg"
      }}
    ]
  }},
  "schools": [
    {{
      "name": "Westwood Charter Elementary School",
      "level": "elementary",
      "walking_distance": true,
      "niche_rating": "A",
      "niche_profile": "https://www.niche.com/k12/westwood-charter-elementary-school-los-angeles-ca/",
      "teacher_quality": "Excellent",
      "parent_reviews": ["Supportive staff", "Creative learning environment"],
      "image": "https://example.com/images/westwood-charter.jpg"
    }},
    {{
      "name": "Emerson Community Charter School",
      "level": "middle",
      "walking_distance": false,
      "niche_rating": "A-",
      "niche_profile": "https://www.niche.com/k12/emerson-community-charter-school-los-angeles-ca/",
      "teacher_quality": "Very Good",
      "parent_reviews": ["Safe and inclusive", "Strong academic curriculum"],
      "image": "https://example.com/images/emerson-charter.jpg"
    }},
    {{
      "name": "Palisades Charter High School",
      "level": "high",
      "walking_distance": false,
      "niche_rating": "A+",
      "niche_profile": "https://www.niche.com/k12/palisades-charter-high-school-pacific-palisades-ca/",
      "gpa_avg": 3.8,
      "sat_avg": 1320,
      "grad_rate": 96.1,
      "top_colleges": ["UCLA", "UC Berkeley", "USC"],
      "teacher_quality": "Outstanding",
      "parent_reviews": ["Great prep for college", "Broad extracurriculars"],
      "image": "https://example.com/images/palisades-high.jpg"
    }}
  ],
  "local_colleges": [
    {{
      "name": "University of California, Los Angeles (UCLA)",
      "niche_rating": "A+"
    }},
    {{
      "name": "University of Southern California (USC)",
      "niche_rating": "A+"
    }},
    {{
      "name": "Santa Monica College",
      "niche_rating": "B+"
    }},
    {{
      "name": "California State University, Los Angeles (CSULA)",
      "niche_rating": "B"
    }}
  ],
  "commute": "20 min to downtown by car, 35 by bus",
  "commute_rating": 7.0,
  "family_friendly": {{
    "lots_of_kids": "Yes, very family-oriented",
    "great_for_families": "Safe, good schools, lots of parks",
    "nearby_daycares": ["Bright Start", "Little Owls", "Tiny Tots"],
    "family_rating": 9.2
  }},
  "young_people_vibes": {{
    "nightlife_rating": "High",
    "nightlife_score": 8.7,
    "best_spots": ["Moonlight Lounge", "The Vinyl Room", "The 404", "Drinks and Sounds"],
    "dating_scene": "Vibrant and casual",
    "average_attractiveness_rating": "4.7/10",
    "apps_popularity": {{
      "tinder": "High",
      "hinge": "Medium"
    }},
    "nightlife_image": "https://example.com/images/nightlife-district.jpg"
  }},
  "extra_tips": {{
    "parking": "Street parking can be tough after 7pm",
    "pet_friendly": "Most restaurants and parks welcome dogs",
    "cell_service_quality": "Strong across all major carriers",
    "real_estate_agent_insights": ["Inventory moves fast", "High interest from remote workers"],
    "other notable tips":" People around here tend to love run clubs and the beltline, including on weekdays",
  }}
}}
"""