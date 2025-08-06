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
        self.system_prompt_template = """You are an expert real estate matching assistant. Your task is to evaluate how well a home matches a user's preferences and provide a compatibility score with detailed justification.

You will be given:
1. User preferences including budget, lifestyle, family situation, and housing requirements
2. Home details including price, features, location, and neighborhood information

Your response should be a JSON object with:
- "score": A float between 0.0 and 1.0 (where 1.0 is perfect match)
- "reasoning": Detailed explanation of the score
- "pros": List of positive aspects of the match
- "cons": List of potential concerns or mismatches
- "key_factors": Most important factors that influenced the score

Be thorough, objective, and consider both quantitative factors (price, size, commute) and qualitative factors (lifestyle fit, neighborhood character)."""
    
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
        
        # Budget information
        budget_min = preferences.get('budget_min', 0)
        budget_max = preferences.get('budget_max', 0)
        if budget_max > 0:
            sections.append(f"Budget: ${budget_min:,} - ${budget_max:,}")
        
        # Size preferences
        size_prefs = []
        if preferences.get('preferred_bedrooms'):
            size_prefs.append(f"{preferences['preferred_bedrooms']} bedrooms")
        if preferences.get('preferred_bathrooms'):
            size_prefs.append(f"{preferences['preferred_bathrooms']} bathrooms")
        if preferences.get('min_sqft'):
            size_prefs.append(f"min {preferences['min_sqft']:,} sq ft")
        
        if size_prefs:
            sections.append(f"Size preferences: {', '.join(size_prefs)}")
        
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
        """Format home details section."""
        home_id = home_data.get('home_id', 'Unknown')
        sections = [f"HOME LISTING (ID: {home_id})"]
        
        # Basic info
        if home_data.get('address'):
            sections.append(f"Address: {home_data['address']}")
        
        if home_data.get('price'):
            sections.append(f"Price: ${home_data['price']:,}")
        
        # Size and layout
        size_info = []
        if home_data.get('bedrooms'):
            size_info.append(f"{home_data['bedrooms']} bedrooms")
        if home_data.get('bathrooms'):
            size_info.append(f"{home_data['bathrooms']} bathrooms")
        if home_data.get('sqft'):
            size_info.append(f"{home_data['sqft']:,} sq ft")
        if home_data.get('lot_size'):
            size_info.append(f"{home_data['lot_size']:,} sq ft lot")
        
        if size_info:
            sections.append(f"Size: {', '.join(size_info)}")
        
        # Property characteristics
        if home_data.get('home_type'):
            sections.append(f"Type: {home_data['home_type']}")
        if home_data.get('style'):
            sections.append(f"Style: {home_data['style']}")
        if home_data.get('year_built'):
            sections.append(f"Built: {home_data['year_built']}")
        if home_data.get('condition'):
            sections.append(f"Condition: {home_data['condition']}")
        
        # Location and neighborhood
        if home_data.get('neighborhood'):
            sections.append(f"Neighborhood: {home_data['neighborhood']}")
        if home_data.get('school_district'):
            sections.append(f"School district: {home_data['school_district']}")
        if home_data.get('commute_minutes'):
            sections.append(f"Commute time: {home_data['commute_minutes']} minutes")
        
        # Scores and ratings
        scores = []
        if home_data.get('walkability_score'):
            scores.append(f"Walkability: {home_data['walkability_score']}/100")
        if home_data.get('transit_score'):
            scores.append(f"Transit: {home_data['transit_score']}/100")
        if home_data.get('bike_score'):
            scores.append(f"Bike: {home_data['bike_score']}/100")
        
        if scores:
            sections.append(f"Scores: {', '.join(scores)}")
        
        # Features and amenities
        if home_data.get('amenities'):
            if isinstance(home_data['amenities'], list):
                amenities = ', '.join(home_data['amenities'])
            else:
                amenities = str(home_data['amenities'])
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
