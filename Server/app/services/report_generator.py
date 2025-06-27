import os
import json
import logging
import re
from typing import Dict
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
import uuid
import time
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from flask import jsonify
import json5
from .pdf_creator import _create_pdf

# Configure verbose logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Perplexity API configuration
PERPLEXITY_API_KEY = os.getenv('PERPLEXITY_API_KEY')
if not PERPLEXITY_API_KEY:
    logger.critical("PERPLEXITY_API_KEY environment variable is not set.")
    raise ValueError("PERPLEXITY_API_KEY environment variable is not set")

HEADERS = {
    "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
    "Content-Type": "application/json"
}

# Store reports in memory (should use a database in production)
REPORTS = {}

# -------------------- UTILS --------------------

def validate_address(address: str) -> bool:
    return bool(address and isinstance(address, str))

def _safe_parse_json(text: str):
    try:
        # Remove all <think>...</think> blocks (and HTML encoded variants)
        cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL | re.IGNORECASE)
        cleaned = re.sub(r'&lt;think&gt;.*?&lt;/think&gt;', '', cleaned, flags=re.DOTALL | re.IGNORECASE)

        # Optionally remove any leading/trailing whitespace or stray characters
        cleaned = cleaned.strip()

        # Find all JSON-looking blocks and try parsing the largest ones first
        matches = re.findall(r'{[\s\S]*}', cleaned)
        for match in sorted(matches, key=len, reverse=True):
            try:
                return json.loads(match)
            except json.JSONDecodeError:
                try:
                    return json5.loads(match)
                except Exception:
                    continue

        raise ValueError("No valid JSON block could be parsed.")
    except Exception as e:
        raise ValueError("Failed to parse JSON from model output") from e


# -------------------- MAIN FUNCTION --------------------

def generate_report(address: str) -> Dict:
    task_id = str(uuid.uuid4())
    REPORTS[task_id] = {
            "address": address,
            "status": "generating",
            "timestamp": time.time(),
        }
    logger.info(f"Starting report generation for: {address}")

    if not validate_address(address):
        logger.error("Address validation failed.")
        raise ValueError("Invalid address format")

    prompt = f"""

CRITICAL: Output ONLY a valid JSON object. Nothing else.

You are given a location: "{address}".
Use the template JSON structure below. 

You MUST include ALL fields exactly as shown — if you don’t know the value, research further until you find a value.
I want the returned JSON to contain ALL of this information in the same way it is displayed below.

You MUST embed image URLs where appropriate (3–6 total), placing them naturally throughout fields like parks, nightlife, maps, or local culture — not just at the end.

You MUST embed image references where appropriate (3–6 total), placing them naturally throughout fields — not just at the end.

I want you to be very critical and expose the good and bad about these places. Do not be afraid to give a negative rating or comment.

If there is no data for a field, give your best guess, and note that it is an estimate, not exact.

Begin and end your output with curly brackets.
DO NOT add any explanation, commentary, markdown, or thinking tags.

{{
  "neighborhood": {{
    "overview of the neighborhood culture": "Uptown Charlotte is the sleek, busy center of the city—think glass buildings, rooftop bars, green parks, and a steady 9-to-5 buzz. It’s where suits and creatives mix, and there’s usually something happening: sports games, live music, street festivals.",
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

    payload = {
    "model": "sonar-deep-research",
    "messages": [
        {
            "role": "system",
            "content": (
                "You are a strict JSON-only generator. DO NOT include any think tags, markdown, or explanation. "
                "You MUST respond with a valid JSON object only. Begin with '{' and end with '}'. No extra text. "
                "You are generating a comprehensive lifestyle and culture report for a given address. "
                "Use only verified online sources. Fill out ALL fields with accurate, up-to-date information."
            )
        },
        {
            "role": "user",
            "content": prompt
        }
    ],
    "search_mode": "web",
    "reasoning_effort": "high", 
    "temperature": 0.1,
    "max_tokens": 20000,
    "stream": False,
    "return_images": True,
    "return_related_questions": True
}



    session = requests.Session()
    retries = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    session.mount("https://", HTTPAdapter(max_retries=retries))

    try:
        logger.info("Sending request to Perplexity API...")
        start_time = time.perf_counter()
        response = session.post("https://api.perplexity.ai/chat/completions", headers=HEADERS, json=payload)
        duration = time.perf_counter() - start_time
        logger.info(f"API request completed in {duration:.2f} seconds")

        if response.status_code != 200:
          logger.error(f"Perplexity API error response: {response.text}")
          raise Exception(f"API request failed with status code {response.status_code}")


        content = response.json()
        raw_json_text = content['choices'][0]['message']['content']
        logger.debug(f"Raw model output:\n{raw_json_text}")

        report = _safe_parse_json(raw_json_text)
        pdf_url = _create_pdf(report, address)

        REPORTS[task_id] = {
            "address": address,
            "status": "completed",
            "report": report,
            "pdfUrl": pdf_url,
            "timestamp": time.time(),
        }

    except Exception as e:
        logger.exception("Unhandled error during report generation")
        raise