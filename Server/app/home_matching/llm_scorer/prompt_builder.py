"""
Prompt builder for LLM-based user-home matching.
"""

import json
from typing import Dict, List, Any, Optional
import logging

from ..preprocessing.models.llm_input import LLMUserInput, LLMHomeInput

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
  - Price fits within user's budget
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
            # Convert to preprocessing models
            llm_user = LLMUserInput.from_dict(user_data)
            llm_home = LLMHomeInput.from_dict(home_data)
            
            # Use the models' format_for_prompt methods
            user_section = llm_user.format_for_prompt()
            home_section = llm_home.format_for_prompt()
            
            prompt = f"""Please evaluate this user-home match:

{user_section}

{home_section}

Provide your assessment as a JSON object with the required fields."""
            
            return prompt
            
        except Exception as e:
            logger.error(f"Error building user prompt: {e}")
            return "Error building prompt"
    
    def build_comparison_prompt(self, user_data: Dict[str, Any], homes_data: List[Dict[str, Any]]) -> str:
        """Build prompt for comparing multiple homes for a user."""
        try:
            # Convert to preprocessing models
            llm_user = LLMUserInput.from_dict(user_data)
            user_section = llm_user.format_for_prompt()
            
            homes_section = "HOMES TO COMPARE:\n"
            for i, home_data in enumerate(homes_data, 1):
                llm_home = LLMHomeInput.from_dict(home_data)
                homes_section += f"\n--- HOME {i} ---\n"
                homes_section += llm_home.format_for_prompt()
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
            # Convert to preprocessing models
            llm_user = LLMUserInput.from_dict(user_data)
            llm_home = LLMHomeInput.from_dict(home_data)
            
            user_section = llm_user.format_for_prompt()
            home_section = llm_home.format_for_prompt()
            
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
