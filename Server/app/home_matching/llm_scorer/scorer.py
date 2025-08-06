"""
LLM-based scoring pipeline for user-home matching.
"""

from typing import Dict, List, Any, Tuple, Optional
import logging

from .prompt_builder import PromptBuilder
from .llm_client import LLMClient
from .parser import LLMResponseParser

logger = logging.getLogger(__name__)

class LLMScorer:
    """LLM-based scorer for user-home compatibility."""
    
    def __init__(self, provider: str = "openai", model: str = None, api_key: str = None):
        self.prompt_builder = PromptBuilder()
        self.llm_client = LLMClient(provider, model, api_key)
        self.parser = LLMResponseParser()
    
    def llm_score(self, user_data: Dict[str, Any], home_data: Dict[str, Any]) -> float:
        """Get LLM compatibility score for user-home pair."""
        try:
            # Build prompts
            system_prompt = self.prompt_builder.get_system_prompt()
            user_prompt = self.prompt_builder.build_user_prompt(user_data, home_data)
            
            # Validate prompt length
            if not self.prompt_builder.validate_prompt_length(system_prompt + user_prompt):
                logger.warning("Prompt may be too long, truncating...")
                user_prompt = user_prompt[:3000] + "...\n\nProvide your assessment as a JSON object."
            
            # Call LLM
            response = self.llm_client.call_llm(system_prompt, user_prompt)
            
            # Parse response
            parsed = self.parser.parse_scoring_response(response)
            
            score = parsed.get('score', 0.0)
            logger.debug(f"LLM score: {score:.3f} for user {user_data.get('user_id', 'unknown')} and home {home_data.get('home_id', 'unknown')}")
            
            return score
            
        except Exception as e:
            logger.error(f"Error getting LLM score: {e}")
            return 0.0
    
    def llm_score_with_explanation(
        self, 
        user_data: Dict[str, Any], 
        home_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get LLM score with detailed explanation."""
        try:
            # Build prompts
            system_prompt = self.prompt_builder.get_system_prompt()
            user_prompt = self.prompt_builder.build_user_prompt(user_data, home_data)
            
            # Validate prompt length
            if not self.prompt_builder.validate_prompt_length(system_prompt + user_prompt):
                logger.warning("Prompt may be too long, truncating...")
                user_prompt = user_prompt[:3000] + "...\n\nProvide your assessment as a JSON object."
            
            # Call LLM
            response = self.llm_client.call_llm(system_prompt, user_prompt)
            
            # Parse response
            parsed = self.parser.parse_scoring_response(response)
            
            # Validate response completeness
            completeness = self.parser.validate_response_completeness(parsed)
            parsed['response_quality'] = completeness
            
            logger.debug(f"LLM detailed score: {parsed.get('score', 0.0):.3f} with explanation")
            return parsed
            
        except Exception as e:
            logger.error(f"Error getting LLM score with explanation: {e}")
            return {
                'score': 0.0,
                'reasoning': f'LLM scoring failed: {str(e)}',
                'pros': [],
                'cons': ['LLM error'],
                'key_factors': ['llm_error'],
                'error': str(e)
            }
    
    def score_user_against_homes(
        self, 
        user_data: Dict[str, Any], 
        homes_data: List[Dict[str, Any]]
    ) -> List[Tuple[Dict[str, Any], float, Dict[str, Any]]]:
        """Score user against multiple homes with explanations."""
        try:
            if not homes_data:
                return []
            
            results = []
            system_prompt = self.prompt_builder.get_system_prompt()
            
            # Process each home
            for i, home_data in enumerate(homes_data):
                logger.debug(f"Processing home {i + 1}/{len(homes_data)}")
                
                try:
                    user_prompt = self.prompt_builder.build_user_prompt(user_data, home_data)
                    
                    # Validate prompt length
                    if not self.prompt_builder.validate_prompt_length(system_prompt + user_prompt):
                        logger.warning(f"Prompt too long for home {i + 1}, truncating...")
                        user_prompt = user_prompt[:3000] + "...\n\nProvide your assessment as a JSON object."
                    
                    # Call LLM
                    response = self.llm_client.call_llm(system_prompt, user_prompt)
                    
                    # Parse response
                    parsed = self.parser.parse_scoring_response(response)
                    
                    score = parsed.get('score', 0.0)
                    results.append((home_data, score, parsed))
                    
                except Exception as e:
                    logger.error(f"Error scoring home {i + 1}: {e}")
                    error_explanation = {
                        'score': 0.0,
                        'reasoning': f'Scoring failed: {str(e)}',
                        'pros': [],
                        'cons': ['Scoring error'],
                        'key_factors': ['scoring_error'],
                        'error': str(e)
                    }
                    results.append((home_data, 0.0, error_explanation))
            
            # Sort by score (highest first)
            results.sort(key=lambda x: x[1], reverse=True)
            
            logger.info(f"LLM scored user {user_data.get('user_id', 'unknown')} against {len(homes_data)} homes")
            return results
            
        except Exception as e:
            logger.error(f"Error scoring user against homes: {e}")
            return [(home, 0.0, {'error': str(e)}) for home in homes_data]
    
    def compare_homes_for_user(
        self, 
        user_data: Dict[str, Any], 
        homes_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Compare multiple homes for a user using LLM."""
        try:
            if not homes_data:
                return {'error': 'No homes provided for comparison'}
            
            # Build comparison prompt
            system_prompt = self.prompt_builder.get_system_prompt()
            user_prompt = self.prompt_builder.build_comparison_prompt(user_data, homes_data)
            
            # Validate prompt length
            if not self.prompt_builder.validate_prompt_length(system_prompt + user_prompt):
                logger.warning("Comparison prompt too long, using individual scoring instead")
                return self._fallback_comparison(user_data, homes_data)
            
            # Call LLM
            response = self.llm_client.call_llm(system_prompt, user_prompt)
            
            # Parse response
            parsed = self.parser.parse_comparison_response(response)
            
            logger.info(f"LLM compared {len(homes_data)} homes for user {user_data.get('user_id', 'unknown')}")
            return parsed
            
        except Exception as e:
            logger.error(f"Error comparing homes: {e}")
            return {
                'rankings': [],
                'overall_analysis': f'Comparison failed: {str(e)}',
                'best_match_reasoning': 'Unable to compare due to error',
                'considerations': ['Comparison error'],
                'error': str(e)
            }
    
    def _fallback_comparison(
        self, 
        user_data: Dict[str, Any], 
        homes_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Fallback comparison using individual scoring."""
        try:
            # Score each home individually
            scored_homes = []
            for home_data in homes_data:
                explanation = self.llm_score_with_explanation(user_data, home_data)
                scored_homes.append({
                    'home_id': home_data.get('home_id', 'unknown'),
                    'score': explanation.get('score', 0.0),
                    'brief_reasoning': explanation.get('reasoning', '')[:100] + '...'
                })
            
            # Sort by score
            scored_homes.sort(key=lambda x: x['score'], reverse=True)
            
            return {
                'rankings': scored_homes,
                'overall_analysis': 'Comparison based on individual home scoring (fallback method)',
                'best_match_reasoning': f"Top choice scored {scored_homes[0]['score']:.2f}" if scored_homes else 'No homes scored',
                'considerations': ['Used fallback comparison method due to prompt length limits']
            }
            
        except Exception as e:
            logger.error(f"Error in fallback comparison: {e}")
            return {
                'rankings': [],
                'overall_analysis': f'Fallback comparison failed: {str(e)}',
                'best_match_reasoning': 'Unable to compare',
                'considerations': ['Fallback comparison error'],
                'error': str(e)
            }
    
    def explain_existing_score(
        self, 
        user_data: Dict[str, Any], 
        home_data: Dict[str, Any], 
        existing_score: float
    ) -> Dict[str, Any]:
        """Get LLM explanation for an existing compatibility score."""
        try:
            # Build explanation prompt
            system_prompt = self.prompt_builder.get_system_prompt()
            user_prompt = self.prompt_builder.build_explanation_prompt(user_data, home_data, existing_score)
            
            # Call LLM
            response = self.llm_client.call_llm(system_prompt, user_prompt)
            
            # Parse response
            parsed = self.parser.parse_explanation_response(response)
            
            logger.debug(f"LLM explained score {existing_score:.3f}")
            return parsed
            
        except Exception as e:
            logger.error(f"Error explaining score: {e}")
            return {
                'score_interpretation': 'Unable to interpret due to error',
                'likely_reasoning': f'Explanation failed: {str(e)}',
                'agreement_level': 0.0,
                'your_score': 0.0,
                'key_match_factors': [],
                'key_mismatch_factors': ['explanation_error'],
                'recommendations': ['Fix explanation system'],
                'error': str(e)
            }
    
    def get_top_matches_with_explanations(
        self, 
        user_data: Dict[str, Any], 
        homes_data: List[Dict[str, Any]], 
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Get top-k matches with detailed explanations."""
        try:
            # Score all homes with explanations
            scored_results = self.score_user_against_homes(user_data, homes_data)
            
            # Take top-k results
            top_results = scored_results[:top_k]
            
            # Format results
            formatted_results = []
            for i, (home_data, score, explanation) in enumerate(top_results):
                formatted_result = {
                    'rank': i + 1,
                    'home_id': home_data.get('home_id', 'unknown'),
                    'home_data': home_data,
                    'score': score,
                    'explanation': explanation
                }
                formatted_results.append(formatted_result)
            
            logger.info(f"Generated top {len(formatted_results)} matches with explanations")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error getting top matches with explanations: {e}")
            return []
    
    def batch_score_homes(
        self, 
        user_data: Dict[str, Any], 
        homes_data: List[Dict[str, Any]]
    ) -> List[float]:
        """Get just the scores for multiple homes (faster than full explanations)."""
        try:
            if not homes_data:
                return []
            
            # Build prompts for batch processing
            system_prompt = self.prompt_builder.get_system_prompt()
            user_prompts = []
            
            for home_data in homes_data:
                user_prompt = self.prompt_builder.build_user_prompt(user_data, home_data)
                if not self.prompt_builder.validate_prompt_length(system_prompt + user_prompt):
                    user_prompt = user_prompt[:3000] + "...\n\nProvide your assessment as a JSON object."
                user_prompts.append(user_prompt)
            
            # Make batch LLM calls
            responses = self.llm_client.call_llm_batch(system_prompt, user_prompts)
            
            # Extract scores
            scores = self.parser.extract_scores_from_batch(responses)
            
            logger.info(f"Batch scored {len(scores)} homes for user {user_data.get('user_id', 'unknown')}")
            return scores
            
        except Exception as e:
            logger.error(f"Error in batch scoring: {e}")
            return [0.0] * len(homes_data)
    
    def get_scorer_info(self) -> Dict[str, Any]:
        """Get information about the LLM scorer."""
        return {
            'llm_client_info': self.llm_client.get_client_info(),
            'prompt_builder': 'PromptBuilder initialized',
            'parser': 'LLMResponseParser initialized'
        }

# Convenience function for single scoring
def llm_score(user_data: Dict[str, Any], home_data: Dict[str, Any]) -> float:
    """Convenience function for getting LLM score."""
    scorer = LLMScorer()
    return scorer.llm_score(user_data, home_data)
