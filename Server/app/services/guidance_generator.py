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

If the recommended site in tne reocmmendation has the correct information, there is no need to continue to search the web

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
- local_culture: Describe cultural texture — e.g. "hipster", "corporate", "family-centered" (Use Google Maps Local Guide reviews, Niche, or Yelp for vibe clues) e.g. 
(Dana Point embodies coastal Southern California living with a focus on marine
activities, beach culture, and outdoor recreation. The community centers
around Dana Point Harbor, which serves as a hub for boating, whale watching,
and waterfront dining. The area maintains a relaxed yet
upscale vibe, balancing tourist attractions with residential tranquility)
- vibe: Concise summary in 2–5 words, e.g., "Quiet, green, upscale" (Pull phrasing from AreaVibes or Walk Score if available) e.g. (Weekly farmers market at La Plaza Park, summer Concerts in the Park series,
Festival of Whales, and Holidays at the Harbor with extensive light displays.
Harbor-centric events include sailing regattas and tall ship festivals.)
- known_for: Highlight actual attractions, industries, or features (Search Google or Redfin Neighborhood pages) e.g. (Dana Point is known for its beautiful beaches, surfing, and whale watching.)
- community_events: Real events or typical examples (Eventbrite, City-Data Forums, or local news)
- what_people_love / watch_out_for: Use friendly, relatable phrases ("parking sucks after 6pm") (Niche.com, Yelp, or Livability)
- population_total: Census data, give exact number (Niche or BestPlaces.net typically show this in sidebars)
- neighborhood_rating: 1–10 score. Use the full scale. (Base this on livability data from AreaVibes, BestPlaces, or Niche)
- LGBTQ representation: Estimate percentage of LGBTQ population and some examples of LGBTQ-friendly amenities 
- Gender, Race: Estimate distribution for gender, race, age, LGBTQ, and lifestyle DNA. Must total ~100%. (Niche and City-Data offer good snapshots) THESE BE PERCENTAGES I.E. 34.1%, NOTHING ELSE IS ACCEPTABLE
- Age distribution: Estimate distribution for ranges Children (0–9 years), Adolescents (10–19 years), Young Adults (20–29 years), Early Career Adults (30–39 years), Middle-Aged Adults (40–49 years), Older Adults (50–64 years), Seniors (65+ years). Must total ~100%. (Niche and City-Data offer good snapshots) THESE MUST ALL BE CAPTIONS and PERCENTAGES I.E. Children (0–9 years): 14.2.1%, NOTHING ELSE IS ACCEPTABLE

Middle-Aged Adults (40–49 years)

Older Adults (50–64 years)

Seniors (65+ years). Must total ~100%. (Niche and City-Data offer good snapshots) THESE MUST ALL BE PERCENTAGES I.E. 34.1%, NOTHING ELSE IS ACCEPTABLE
- Lifestyle DNA: Give distribution of lifestyle DNA, take into account all parts of the neighborhood overview. Must total ~100%. THESE MUST ALL BE A BRIEF EXPLANATION : PERCENTAGE I.E. Suburban: 25%, NOTHING ELSE IS ACCEPTABLE
"""

def _guidance_safety(enabled=True):
    if not enabled:
        return ""
    return """
---

2. SAFETY
- crime_rating: "Nonexistant", "Low", "Moderate", "High", "Very High" — be honest (AreaVibes and NeighborhoodScout show indexed crime ratings)
- places_to_watch_out_for: Name risky intersections or parts of town (Search forums like City-Data or Reddit for specifics)
- police_presence: Indicate actual patterns (Google search “[neighborhood] police patrol schedule” or check local forums)
- safety_rating: Critical — don't default to 7s (Base on AreaVibes crime and perception on forums or Niche)
"""

def _guidance_culture_and_events(enabled=True):
    if not enabled:
        return ""
    return """
---

3. CULTURE AND EVENTS
- local_events: Events people attend — use names or examples (Eventbrite, Meetup, City-Data Forums)
- seasonal_trends: E.g., "Busy in summer, quieter winters" (Check Nomad List or blog search results)
- community_engagement: Civic participation (e.g., cleanup days, local watch groups) (Mention if visible on Meetup or forums)
- culture_rating: Score should reflect vibrancy and access (Weigh frequency and diversity of events, Eventbrite density is a clue)
"""

def _guidance_weather(enabled=True):
    if not enabled:
        return ""
    return """
---

4. WEATHER
- Give low/high temps and commentary for each season (Teleport city pages often summarize this well, or use WeatherSpark/BestPlaces)
- Mention comfort, humidity, storm risks if relevant (Look for mentions on Nomad List or BestPlaces.net)
"""

def _guidance_social_character(enabled=True):
    if not enabled:
        return ""
    return """
---

5. SOCIAL CHARACTER
- income_level: E.g., "Middle-class professionals" (Use Niche or AreaVibes income distribution)
- political_leaning: State clearly (Niche political maps or Redfin voting overlays if accessible)
- language_spoken: Include major spoken languages beyond English (Niche + City-Data often break this down)
- religiosity: Low / Moderate / High — explain the tone (BestPlaces religion % or Niche)
- cultural_tone: Summary of vibe ("laid-back but proud") (Pull from Google Maps reviews or Niche user feedback)
- social_rating: Reflects inclusivity, education, worldview (Niche “diversity” and “community” scores are good proxies)
"""

def _guidance_local_amenities(enabled=True):
    if not enabled:
        return ""
    return """
---

6. LOCAL AMENITIES
- restaurants, activities, parks: Include real or believable names, vibes, and features (Google Maps and Yelp are top sources)
- thrift_store / grocery_store / late_night_restaurant: Include types and unique value (Use Walk Score or Google Maps search with review snippets)
"""

def _guidance_commute(enabled=True):
    if not enabled:
        return ""
    return """
---

7. COMMUTE
- commute_times: Include time by car and public transit (Redfin and Realtor.com neighborhood pages sometimes show this)
- public_transport: Mention system quality (Walk Score’s Transit Score or local public agency blog results)
- traffic: Describe congestion windows (City-Data forums often contain commuting complaints or hacks)
- walkability: Score should reflect actual pedestrian accessibility (Use Walk Score directly)
"""

def _guidance_family_friendly(enabled=True):
    if not enabled:
        return ""
    return """
---

8. FAMILY FRIENDLY
- lots_of_kids: "Yes / Some / Few" with reasoning (Niche family scores + Livability.com insights)
- great_for_families: Emphasize parks, schools, safety (Search “[neighborhood] with kids” or use Niche)
- family_rating: Honest reflection (Niche “family grade” is a strong proxy)
"""

def _guidance_nightlife_and_dating(enabled=True):
    if not enabled:
        return ""
    return """
---

9. NIGHTLIFE & DATING
- nightlife_score: Rate vibrancy of bars, music, and scenes (Yelp, Google Maps, or City-Data forum nightlife threads)
- dating_scene: Describe energy and dating pool (Search “dating in [city] Reddit” or Nomad List for vibe)
- average_attractiveness_rating: Be playful but grounded (Use cultural tone and tongue-in-cheek phrasing)
- apps_popularity: Break down by app, score relative to national averages (Check Reddit threads or blog posts comparing app usage)
"""

def _guidance_accessibility(enabled=True):
    if not enabled:
        return ""
    return """
---

10. ACCESSIBILITY
- wheelchair_friendly / ADA_compliance / age_friendly: Think about sidewalks, ramps, transport (Search blog reviews or City-Data forums)
- accessibility_rating: Be realistic — older areas may have limited access (Use street view impressions + user complaints)
"""

def _guidance_development(enabled=True):
    if not enabled:
        return ""
    return """
---

11. DEVELOPMENT
- upcoming_changes / zoning_or_construction: Include new projects, cranes, planned expansions (Search “[neighborhood] development plans” on Redfin blogs or local news)
- gentrification_signs: Rising rents, boutique shops, protests? (Look for shifting business reviews or mentions on City-Data/Reddit)
- vacancy_or_decay: Look for boarded-up homes or well-kept blocks (Homes.com or Redfin street views may reflect this)
"""

def _guidance_environment(enabled=True):
    if not enabled:
        return ""
    return """
---

12. ENVIRONMENT AND UTILITIES
- air_quality / noise / light pollution: Use adjectives (e.g., "smoggy, clean, noisy at night") (Search “[city] air quality” + BestPlaces)
- water_quality: Safe / filtered / low pressure? (Local news, forums, or city health pages)
- avg_utility_costs: Dollar ranges (Moving.com, BestPlaces utility cost estimates)
- internet_speed: Mbps average (Search “internet speed in [zip code]” — Ookla results or blogs)
- environmental_rating: Sum total impression of livability (AreaVibes or Livability.com ratings work well)
"""

def _guidance_money(enabled=True):
    if not enabled:
        return ""
    return """
---

13. MONEY STUFF
- monthly_payment: Median rent/mortgage (Redfin, Zillow, or Homes.com listings by zip code)
- property_taxes: Realistic annual property tax (Search “[county] property tax rate” or use Realtor.com)
- value_assessment: Stable / Rising / Declining (Redfin neighborhood market trends)
- investment_potential: E.g., "Good for long-term hold" (Search for home value trendlines on Redfin or Realtor)
- financial_rating: Overall financial upside or downside (Blend of affordability + appreciation using Redfin + Niche)
- seller_information: Who is selling the property at [address]? Please determine if the seller is an individual, realtor, or corporate/investor entity. Search public listing platforms (Zillow, Redfin, Realtor.com), local MLS info, and county assessor or property tax records. If the property is owned by an LLC, summarize what is known about the company (business filings, other properties owned). If it's listed as FSBO (for sale by owner), confirm that as well. Prioritize accurate, up-to-date sources.
- purchase_strategy: Recommend a smart strategy based on the current market context. For example: "Act quickly if priced below comps", "Negotiate hard due to days on market", "Avoid bidding wars in this zip code", or "Wait for seasonal dip in pricing". Use Redfin trends, listing history, and buyer competition data if available.
"""

def _guidance_schools(enabled=True):
    if not enabled:
        return ""
    return """
---

14. SCHOOLS
- name, level, walking_distance: Include elementary/middle/high (Use Google Maps or Realtor.com school map view)
- niche_rating / GPA / SAT / grad_rate: (ONLY INCLUDE FOR HIGH SCHOOLS)
- known_for: Culture or reputation (e.g., "STEM focus", "Liberal arts", "pressure cooker") (Niche student reviews are gold here)
- teacher_quality: Great / Good / Mixed / Poor (See Niche teacher quality grade)
"""

def _guidance_extra_tips(enabled=True):
    if not enabled:
        return ""
    return """
---

15. EXTRA TIPS
- parking: Easy or chaotic? (Yelp mentions, City-Data discussions)
- pet_friendly: Parks, patios, trails (Google Maps or Niche “Outdoor Activities” grade)
- cell_service_quality: Strong/Spotty, carrier breakdown optional (Search “cell coverage in [neighborhood]” for crowdsourced maps)
- other_notable_tips: Add hyperlocal facts (e.g., "Great for sunrise joggers", "Beltline fills up early") (Use City-Data forums or Reddit locals)
"""