"""
Prompt builder for LLM-based user-home matching.
"""

import json
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class PromptBuilder:
    """Builds structured prompts for LLM scoring."""
    
    def __init__(self):
        self.system_prompt_template = """You are a comprehensive real estate matching expert who evaluates homes based on how well they meet and exceed user preferences.

**SCORING PHILOSOPHY:**
- Evaluate each home against the user's specific requirements for price, bedrooms, bathrooms, and lot size
- Score based on how well the home meets or exceeds these preferences
- Consider the complete picture: price value, size adequacy, and lot space

**SCORING SYSTEM:**
- **GREAT (0.8-0.95)**: Home EXCEEDS user preferences significantly
  - Price is well within budget with room to spare
  - Bedrooms/bathrooms exceed what user wants
  - Lot size is larger than expected
  - Excellent value proposition

- **GOOD (0.6-0.79)**: Home MEETS user requirements well
  - Price fits within user's budget
  - Bedrooms/bathrooms match user preferences
  - Adequate lot size for needs
  - Solid match for requirements

- **FAIR (0.4-0.59)**: Home partially meets requirements
  - Price at upper limit of budget or slightly over
  - Bedrooms/bathrooms close but not perfect match
  - Lot size adequate but not ideal
  - Some compromises needed

- **POOR (0.1-0.39)**: Home fails to meet key requirements
  - Price significantly over budget
  - Wrong number of bedrooms/bathrooms
  - Inadequate lot size
  - Major mismatches

**KEY EVALUATION FACTORS:**
1. **Price vs Budget**: How well does the home price fit the user's financial capacity?
2. **Bedroom Match**: Does the home have adequate bedrooms for the user's needs?
3. **Bathroom Match**: Are there sufficient bathrooms for the user's preferences?
4. **Lot Size**: Is the lot appropriate for the user's space needs?
5. **Overall Value**: Does this home represent good value for the user?

Return a JSON object with:
{
  "score": <float between 0.0 and 1.0>,
  "reasoning": "<detailed explanation of how home meets/exceeds requirements>",
  "pros": [<list of positive aspects>],
  "cons": [<list of areas where home falls short>],
  "key_factors": [<most important factors in your evaluation>]
}"""
    
    def build_user_prompt(self, user_data: Dict[str, Any], home_data: Dict[str, Any]) -> str:
        """Build user prompt with user preferences and home details."""
        try:
            user_section = self._format_user_preferences(user_data)
            home_section = self._format_home_details(home_data)
            
            prompt = f"""Please evaluate this user-home match:

{user_section}

{home_section}

Provide your assessment as a JSON object with the required fields."""
            
            return prompt
            
        except Exception as e:
            logger.error(f"Error building user prompt: {e}")
            return "Error building prompt"
    
    def _format_user_preferences(self, user_data: Dict[str, Any]) -> str:
        """Format user preferences section."""
        preferences = user_data.get('preferences', {})
        user_id = user_data.get('user_id', 'Unknown')
        
        sections = [f"USER PROFILE (ID: {user_id})"]
        
        # ESSENTIAL REQUIREMENTS - Always include these key factors
        essential_reqs = []
        
        # Budget information - Always show
        budget_min = preferences.get('budget_min', 0) or preferences.get('home_budget', 0)
        budget_max = preferences.get('budget_max', 0) or preferences.get('home_budget', 0)
        if budget_max > 0:
            if budget_min > 0 and budget_min != budget_max:
                essential_reqs.append(f"Budget: ${budget_min:,} - ${budget_max:,}")
            else:
                essential_reqs.append(f"Budget: Up to ${budget_max:,}")
        else:
            essential_reqs.append("Budget: Not specified")
        
        # Bedroom requirements - Always show
        preferred_bedrooms = preferences.get('preferred_bedrooms', 0)
        if preferred_bedrooms > 0:
            essential_reqs.append(f"Bedrooms needed: {preferred_bedrooms}")
        else:
            essential_reqs.append("Bedrooms needed: Not specified")
        
        # Bathroom requirements - Always show  
        preferred_bathrooms = preferences.get('preferred_bathrooms', 0)
        if preferred_bathrooms > 0:
            essential_reqs.append(f"Bathrooms needed: {preferred_bathrooms}")
        else:
            essential_reqs.append("Bathrooms needed: Not specified")
        
        # Lot size preferences
        if preferences.get('preferred_lot_size'):
            essential_reqs.append(f"Lot size preference: {preferences['preferred_lot_size']}")
        
        # Square footage
        if preferences.get('min_sqft'):
            essential_reqs.append(f"Minimum square feet: {preferences['min_sqft']:,}")
        
        sections.extend(essential_reqs)
        
        # Home type preferences
        if preferences.get('preferred_home_types'):
            types = ', '.join(preferences['preferred_home_types'])
            sections.append(f"Preferred home types: {types}")
        
        # Location preferences
        location_prefs = []
        if preferences.get('preferred_neighborhoods'):
            neighborhoods = ', '.join(preferences['preferred_neighborhoods'])
            location_prefs.append(f"Preferred neighborhoods: {neighborhoods}")
        if preferences.get('max_commute_minutes'):
            location_prefs.append(f"Max commute: {preferences['max_commute_minutes']} minutes")
        if preferences.get('location_preference'):
            location_prefs.append(f"Location style: {preferences['location_preference']}")
        
        if location_prefs:
            sections.append("Location preferences: " + '; '.join(location_prefs))
        
        # Lifestyle and personal info
        lifestyle_info = []
        if preferences.get('lifestyle'):
            lifestyle_info.append(f"Lifestyle: {preferences['lifestyle']}")
        if preferences.get('family_status'):
            lifestyle_info.append(f"Family: {preferences['family_status']}")
        if preferences.get('work_style'):
            lifestyle_info.append(f"Work style: {preferences['work_style']}")
        if preferences.get('hobbies'):
            lifestyle_info.append(f"Hobbies: {preferences['hobbies']}")
        
        if lifestyle_info:
            sections.append("Personal info: " + '; '.join(lifestyle_info))
        
        # Must-have amenities
        if preferences.get('must_have_amenities'):
            amenities = ', '.join(preferences['must_have_amenities'])
            sections.append(f"Must-have amenities: {amenities}")
        
        # Nice-to-have amenities
        if preferences.get('nice_to_have_amenities'):
            amenities = ', '.join(preferences['nice_to_have_amenities'])
            sections.append(f"Nice-to-have amenities: {amenities}")
        
        # Special requirements
        requirements = []
        if preferences.get('pet_friendly'):
            requirements.append("Pet-friendly required")
        if preferences.get('parking_required'):
            requirements.append("Parking required")
        if preferences.get('outdoor_space_required'):
            requirements.append("Outdoor space required")
        
        if requirements:
            sections.append(f"Special requirements: {', '.join(requirements)}")
        
        # Additional notes
        if preferences.get('notes'):
            sections.append(f"Additional notes: {preferences['notes']}")
        
        return '\n'.join(sections)
    
    def _format_home_details(self, home_data: Dict[str, Any]) -> str:
        """Format comprehensive home details section."""
        home_id = home_data.get('home_id', 'Unknown')
        sections = [f"HOME LISTING (ID: {home_id})"]
        
        # Address
        if home_data.get('address'):
            sections.append(f"Address: {home_data['address']}")
        
        # ESSENTIAL DETAILS - Always include these key factors
        essential_details = []
        
        # Price - Always show
        price = home_data.get('price', 0)
        if price > 0:
            essential_details.append(f"Price: ${price:,}")
        else:
            essential_details.append("Price: Not specified")
        
        # Bedrooms - Always show
        bedrooms = home_data.get('bedrooms', 0)
        essential_details.append(f"Bedrooms: {bedrooms}")
        
        # Bathrooms - Always show  
        bathrooms = home_data.get('bathrooms', 0)
        essential_details.append(f"Bathrooms: {bathrooms}")
        
        # Lot size - Always show if available
        lot_size = home_data.get('lot_size') or home_data.get('lotSize') or home_data.get('lot_area')
        if lot_size:
            essential_details.append(f"Lot size: {lot_size}")
        else:
            essential_details.append("Lot size: Not specified")
        
        # Square footage
        sqft = home_data.get('sqft') or home_data.get('living_area') or home_data.get('square_feet')
        if sqft:
            essential_details.append(f"Square feet: {sqft:,}")
        
        sections.extend(essential_details)
        
        # Additional property details
        if home_data.get('property_type'):
            sections.append(f"Property type: {home_data['property_type']}")
        if home_data.get('year_built'):
            sections.append(f"Year built: {home_data['year_built']}")
        
        # Location context
        if home_data.get('neighborhood'):
            sections.append(f"Neighborhood: {home_data['neighborhood']}")
        if home_data.get('commute_minutes'):
            sections.append(f"Commute time: {home_data['commute_minutes']} minutes")
        
        # Features and amenities
        if home_data.get('amenities'):
            amenities = ', '.join(home_data['amenities'])
            sections.append(f"Amenities: {amenities}")
        
        if home_data.get('features'):
            if isinstance(home_data['features'], list):
                features = ', '.join(home_data['features'])
            else:
                features = str(home_data['features'])
            sections.append(f"Features: {features}")
        
        # Special characteristics
        special_features = []
        if home_data.get('has_garage'):
            special_features.append("Garage")
        if home_data.get('has_yard'):
            special_features.append("Yard")
        if home_data.get('has_pool'):
            special_features.append("Pool")
        if home_data.get('pet_friendly'):
            special_features.append("Pet-friendly")
        if home_data.get('recently_renovated'):
            special_features.append("Recently renovated")
        
        if special_features:
            sections.append(f"Special features: {', '.join(special_features)}")
        
        # Description
        if home_data.get('description'):
            sections.append(f"Description: {home_data['description']}")
        
        # Neighborhood info
        if home_data.get('neighborhood_info'):
            sections.append(f"Neighborhood info: {home_data['neighborhood_info']}")
        
        # Nearby amenities
        if home_data.get('nearby_amenities'):
            if isinstance(home_data['nearby_amenities'], list):
                nearby = ', '.join(home_data['nearby_amenities'])
            else:
                nearby = str(home_data['nearby_amenities'])
            sections.append(f"Nearby: {nearby}")
        
        return '\n'.join(sections)
    
    def build_comparison_prompt(self, user_data: Dict[str, Any], homes_data: List[Dict[str, Any]]) -> str:
        """Build prompt for comparing multiple homes for a user."""
        try:
            user_section = self._format_user_preferences(user_data)
            
            homes_section = "HOMES TO COMPARE:\n"
            for i, home_data in enumerate(homes_data, 1):
                homes_section += f"\n--- HOME {i} ---\n"
                homes_section += self._format_home_details(home_data)
                homes_section += "\n"
            
            prompt = f"""Please evaluate and rank these homes for the user:

{user_section}

{homes_section}

Provide your assessment as a JSON object with:
- "rankings": Array of objects with home_id, score (0.0-1.0), and brief_reasoning
- "overall_analysis": Summary of the comparison
- "best_match_reasoning": Why the top choice is best
- "considerations": Important factors the user should consider

Order the rankings from best match (highest score) to worst match (lowest score)."""
            
            return prompt
            
        except Exception as e:
            logger.error(f"Error building comparison prompt: {e}")
            return "Error building comparison prompt"
    
    def build_explanation_prompt(self, user_data: Dict[str, Any], home_data: Dict[str, Any], score: float) -> str:
        """Build prompt for explaining a given score."""
        try:
            user_section = self._format_user_preferences(user_data)
            home_section = self._format_home_details(home_data)
            
            prompt = f"""A matching algorithm gave this user-home pair a compatibility score of {score:.2f} out of 1.0.

{user_section}

{home_section}

Please provide a detailed explanation of this score as a JSON object with:
- "score_interpretation": What this score means (excellent/good/fair/poor match)
- "likely_reasoning": Why the algorithm might have given this score
- "agreement_level": How much you agree with this score (0.0-1.0)
- "your_score": What score you would give (0.0-1.0)
- "key_match_factors": Factors that support the match
- "key_mismatch_factors": Factors that work against the match
- "recommendations": Suggestions for the user"""
            
            return prompt
            
        except Exception as e:
            logger.error(f"Error building explanation prompt: {e}")
            return "Error building explanation prompt"
    
    def get_system_prompt(self) -> str:
        """Get the system prompt."""
        return self.system_prompt_template
    
    def validate_prompt_length(self, prompt: str, max_tokens: int = 4000) -> bool:
        """Validate that prompt is not too long."""
        # Rough estimation: 1 token ≈ 4 characters
        estimated_tokens = len(prompt) / 4
        return estimated_tokens <= max_tokens
