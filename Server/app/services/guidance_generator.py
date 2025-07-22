def give_guidance(include_neighborhood_overview=True,
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
SECTION GUIDANCE — interpret and complete each field with high specificity, vivid language, and a balance of praise and criticism:

{_guidance_neighborhood_overview(include_neighborhood_overview).strip()}
{_guidance_safety(include_safety).strip()}
{_guidance_culture_and_events(include_culture_and_events).strip()}
{_guidance_weather(include_weather).strip()}
{_guidance_social_character(include_social_character).strip()}
{_guidance_local_amenities(include_local_amenities).strip()}
{_guidance_commute(include_commute).strip()}
{_guidance_family_friendly(include_family_friendly).strip()}
{_guidance_nightlife_and_dating(include_nightlife_and_dating).strip()}
{_guidance_accessibility(include_accessibility).strip()}
{_guidance_development(include_development).strip()}
{_guidance_environment(include_environment).strip()}
{_guidance_money(include_money).strip()}
{_guidance_schools(include_schools).strip()}
{_guidance_extra_tips(include_extra_tips).strip()}
"""

def _guidance_neighborhood_overview(enabled=True):
    if not enabled:
        return ""
    return """
---

1. NEIGHBORHOOD OVERVIEW
- local_culture: Describe cultural texture — e.g. "hipster", "corporate", "family-centered"
- vibe: Concise summary in 2–5 words, e.g., "Quiet, green, upscale"
- known_for: Highlight actual attractions, industries, or features
- community_events: Real events or typical examples (e.g., street fairs, open mic nights)
- what_people_love / watch_out_for: Use friendly, relatable phrases ("parking sucks after 6pm")
- population_total: Round estimate or census data
- neighborhood_rating: 1–10 score. Use the full scale.
- demographics: Estimate distribution for gender, race, age, LGBTQ, and lifestyle DNA. Must total ~100%.
"""

def _guidance_safety(enabled=True):
    if not enabled:
        return ""
    return """
---

2. SAFETY
- crime_rating: "Low", "Moderate", or "High" — be honest
- places_to_watch_out_for: Name risky intersections or parts of town
- police_presence: Indicate actual patterns (e.g., "High around schools, low in alleyways")
- safety_rating: Critical — don't default to 7s
"""

def _guidance_culture_and_events(enabled=True):
    if not enabled:
        return ""
    return """
---

3. CULTURE AND EVENTS
- local_events: Events people attend — use names or examples
- seasonal_trends: E.g., "Busy in summer, quieter winters"
- community_engagement: Civic participation (e.g., cleanup days, local watch groups)
- culture_rating: Score should reflect vibrancy and access
"""

def _guidance_weather(enabled=True):
    if not enabled:
        return ""
    return """
---

4. WEATHER
- Give low/high temps and commentary for each season
- Mention comfort, humidity, storm risks if relevant
"""

def _guidance_social_character(enabled=True):
    if not enabled:
        return ""
    return """
---

5. SOCIAL CHARACTER
- income_level: E.g., "Middle-class professionals"
- political_leaning: State clearly (e.g., "Progressive" or "Mixed, conservative-leaning suburbs")
- language_spoken: Include major spoken languages beyond English
- religiosity: Low / Moderate / High — explain the tone
- cultural_tone: Summary of vibe ("laid-back but proud")
- social_rating: Reflects inclusivity, education, worldview
"""

def _guidance_local_amenities(enabled=True):
    if not enabled:
        return ""
    return """
---

6. LOCAL AMENITIES
- restaurants, activities, parks: Include real or believable names, vibes, and features
- thrift_store / grocery_store / late_night_restaurant: Include types and unique value
"""

def _guidance_commute(enabled=True):
    if not enabled:
        return ""
    return """
---

7. COMMUTE
- commute_times: Include time by car and public transit
- public_transport: Mention system quality (e.g., bus, train, frequency)
- traffic: Describe congestion windows
- walkability: Score should reflect actual pedestrian accessibility
"""

def _guidance_family_friendly(enabled=True):
    if not enabled:
        return ""
    return """
---

8. FAMILY FRIENDLY
- lots_of_kids: "Yes / Some / Few" with reasoning
- great_for_families: Emphasize parks, schools, safety
- family_rating: Honest reflection (e.g., nightlife-heavy areas may score low)
"""

def _guidance_nightlife_and_dating(enabled=True):
    if not enabled:
        return ""
    return """
---

9. NIGHTLIFE & DATING
- nightlife_score: Rate vibrancy of bars, music, and scenes
- dating_scene: Describe energy and dating pool
- average_attractiveness_rating: Be playful but grounded
- apps_popularity: Break down by app (Tinder, Hinge, etc.)
"""

def _guidance_accessibility(enabled=True):
    if not enabled:
        return ""
    return """
---

10. ACCESSIBILITY
- wheelchair_friendly / ADA_compliance / age_friendly: Think about sidewalks, ramps, transport
- accessibility_rating: Be realistic — older areas may have limited access
"""

def _guidance_development(enabled=True):
    if not enabled:
        return ""
    return """
---

11. DEVELOPMENT
- upcoming_changes / zoning_or_construction: Include new projects, cranes, planned expansions
- gentrification_signs: Rising rents, boutique shops, protests?
- vacancy_or_decay: Look for boarded-up homes or well-kept blocks
"""

def _guidance_environment(enabled=True):
    if not enabled:
        return ""
    return """
---

12. ENVIRONMENT AND UTILITIES
- air_quality / noise / light pollution: Use adjectives (e.g., "smoggy, clean, noisy at night")
- water_quality: Safe / filtered / low pressure?
- avg_utility_costs: Dollar ranges
- internet_speed: Mbps average (broadband, fiber?)
- environmental_rating: Sum total impression of livability
"""

def _guidance_money(enabled=True):
    if not enabled:
        return ""
    return """
---

13. MONEY STUFF
- monthly_payment: Median rent/mortgage
- property_taxes: Realistic annual property tax
- value_assessment: Stable / Rising / Declining
- investment_potential: E.g., "Good for long-term hold"
- financial_rating: Overall financial upside or downside
"""

def _guidance_schools(enabled=True):
    if not enabled:
        return ""
    return """
---

14. SCHOOLS
- name, level, walking_distance: Include elementary/middle/high
- niche_rating / GPA / SAT / grad_rate: Pull from school profiles
- known_for: Culture or reputation (e.g., "STEM focus", "Liberal arts", "pressure cooker")
- teacher_quality: Great / Good / Mixed / Poor
"""

def _guidance_extra_tips(enabled=True):
    if not enabled:
        return ""
    return """
---

15. EXTRA TIPS
- parking: Easy or chaotic?
- pet_friendly: Parks, patios, trails
- cell_service_quality: Strong/Spotty, carrier breakdown optional
- other_notable_tips: Add hyperlocal facts (e.g., "Great for sunrise joggers", "Beltline fills up early")
"""
