"""
Parser for LLM responses, extracts scores and justifications.
"""

import json
import re
from typing import Dict, List, Any, Optional, Union
import logging

logger = logging.getLogger(__name__)

class LLMResponseParser:
    """Parses LLM responses and extracts structured information."""
    
    def __init__(self):
        self.required_fields = ['score', 'reasoning', 'pros', 'cons', 'key_factors']
        self.optional_fields = ['confidence', 'recommendations', 'concerns']
    
    def parse_scoring_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Parse LLM response for single home scoring."""
        try:
            
            content = response.get('content', {})            
                    
            # Handle case where content is a string (JSON parsing failed)
            if isinstance(content, str):
                logger.warning(f"[LLM_PARSER] Content is string, attempting to parse: {content[:100]}...")
                content = self._parse_string_response(content)
            
            # Validate and clean the response
            parsed = self._validate_scoring_response(content)
            
            # Add metadata from original response
            parsed['metadata'] = {
                'raw_content': response.get('raw_content', ''),
                'usage': response.get('usage', {}),
                'model': response.get('model', ''),
                'finish_reason': response.get('finish_reason', '')
            }
            
            return parsed
            
        except Exception as e:
            logger.error(f"[LLM_PARSER] ❌ Error parsing scoring response: {e}", exc_info=True)
            return self._create_error_response(str(e))
    
    def parse_comparison_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Parse LLM response for multiple home comparison."""
        try:
            content = response.get('content', {})
            
            if isinstance(content, str):
                content = self._parse_string_response(content)
            
            # Validate comparison response structure
            parsed = self._validate_comparison_response(content)
            
            # Add metadata
            parsed['metadata'] = {
                'raw_content': response.get('raw_content', ''),
                'usage': response.get('usage', {}),
                'model': response.get('model', ''),
                'finish_reason': response.get('finish_reason', '')
            }
            
            return parsed
            
        except Exception as e:
            logger.error(f"Error parsing comparison response: {e}")
            return self._create_comparison_error_response(str(e))
    
    def parse_explanation_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Parse LLM response for score explanation."""
        try:
            content = response.get('content', {})
            
            if isinstance(content, str):
                content = self._parse_string_response(content)
            
            # Validate explanation response
            parsed = self._validate_explanation_response(content)
            
            # Add metadata
            parsed['metadata'] = {
                'raw_content': response.get('raw_content', ''),
                'usage': response.get('usage', {}),
                'model': response.get('model', ''),
                'finish_reason': response.get('finish_reason', '')
            }
            
            return parsed
            
        except Exception as e:
            logger.error(f"Error parsing explanation response: {e}")
            return self._create_explanation_error_response(str(e))
    
    def _parse_string_response(self, response_str: str) -> Dict[str, Any]:
        """Try to parse string response as JSON."""
        try:
            # First try direct JSON parsing
            return json.loads(response_str)
        except json.JSONDecodeError:
            # Try to extract JSON from text
            return self._extract_json_from_string(response_str)
    
    def _extract_json_from_string(self, text: str) -> Dict[str, Any]:
        """Extract JSON object from text string."""
        try:
            # Look for JSON-like content between braces
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                return json.loads(json_str)
            
            # Try to parse structured text response
            return self._parse_structured_text(text)
            
        except Exception as e:
            logger.warning(f"Could not extract JSON from text: {e}")
            return self._parse_structured_text(text)
    
    def _parse_structured_text(self, text: str) -> Dict[str, Any]:
        """Parse structured text response when JSON parsing fails."""
        try:
            result = {
                'score': 0.5,
                'reasoning': '',
                'pros': [],
                'cons': [],
                'key_factors': []
            }
            
            # Extract score
            score_match = re.search(r'score[:\s]*([0-9]*\.?[0-9]+)', text, re.IGNORECASE)
            if score_match:
                score = float(score_match.group(1))
                result['score'] = max(0.0, min(1.0, score))
            
            # Extract reasoning
            reasoning_patterns = [
                r'reasoning[:\s]*([^\n]+)',
                r'explanation[:\s]*([^\n]+)',
                r'because[:\s]*([^\n]+)'
            ]
            
            for pattern in reasoning_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    result['reasoning'] = match.group(1).strip()
                    break
            
            if not result['reasoning']:
                result['reasoning'] = text[:200] + "..." if len(text) > 200 else text
            
            # Extract pros and cons
            pros_match = re.search(r'pros?[:\s]*([^\n]+)', text, re.IGNORECASE)
            if pros_match:
                result['pros'] = [item.strip() for item in pros_match.group(1).split(',')]
            
            cons_match = re.search(r'cons?[:\s]*([^\n]+)', text, re.IGNORECASE)
            if cons_match:
                result['cons'] = [item.strip() for item in cons_match.group(1).split(',')]
            
            # Extract key factors
            factors_match = re.search(r'factors?[:\s]*([^\n]+)', text, re.IGNORECASE)
            if factors_match:
                result['key_factors'] = [item.strip() for item in factors_match.group(1).split(',')]
            
            return result
            
        except Exception as e:
            logger.error(f"Error parsing structured text: {e}")
            return {
                'score': 0.0,
                'reasoning': f'Text parsing failed: {str(e)}',
                'pros': [],
                'cons': ['Parsing error'],
                'key_factors': ['text_parsing_error'],
                'raw_text': text
            }
    
    def _validate_scoring_response(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean scoring response."""
        validated = {}
        
        # Validate score
        score = content.get('score', 0.5)
        if isinstance(score, (int, float)):
            validated['score'] = max(0.0, min(1.0, float(score)))
        else:
            try:
                validated['score'] = max(0.0, min(1.0, float(score)))
            except (ValueError, TypeError):
                validated['score'] = 0.5
        
        # Validate reasoning
        reasoning = content.get('reasoning', '')
        validated['reasoning'] = str(reasoning) if reasoning else 'No reasoning provided'
        
        # Validate pros
        pros = content.get('pros', [])
        if isinstance(pros, list):
            validated['pros'] = [str(item) for item in pros if item]
        else:
            validated['pros'] = [str(pros)] if pros else []
        
        # Validate cons
        cons = content.get('cons', [])
        if isinstance(cons, list):
            validated['cons'] = [str(item) for item in cons if item]
        else:
            validated['cons'] = [str(cons)] if cons else []
        
        # Validate key factors
        key_factors = content.get('key_factors', [])
        if isinstance(key_factors, list):
            validated['key_factors'] = [str(item) for item in key_factors if item]
        else:
            validated['key_factors'] = [str(key_factors)] if key_factors else []
        
        # Add optional fields
        for field in self.optional_fields:
            if field in content:
                validated[field] = content[field]
        
        return validated
    
    def _validate_comparison_response(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Validate comparison response structure."""
        validated = {
            'rankings': [],
            'overall_analysis': '',
            'best_match_reasoning': '',
            'considerations': []
        }
        
        # Validate rankings
        rankings = content.get('rankings', [])
        if isinstance(rankings, list):
            for ranking in rankings:
                if isinstance(ranking, dict):
                    validated_ranking = {
                        'home_id': ranking.get('home_id', 'unknown'),
                        'score': max(0.0, min(1.0, float(ranking.get('score', 0.5)))),
                        'brief_reasoning': str(ranking.get('brief_reasoning', ''))
                    }
                    validated['rankings'].append(validated_ranking)
        
        # Validate other fields
        validated['overall_analysis'] = str(content.get('overall_analysis', ''))
        validated['best_match_reasoning'] = str(content.get('best_match_reasoning', ''))
        
        considerations = content.get('considerations', [])
        if isinstance(considerations, list):
            validated['considerations'] = [str(item) for item in considerations if item]
        else:
            validated['considerations'] = [str(considerations)] if considerations else []
        
        return validated
    
    def _validate_explanation_response(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Validate explanation response structure."""
        validated = {
            'score_interpretation': str(content.get('score_interpretation', '')),
            'likely_reasoning': str(content.get('likely_reasoning', '')),
            'agreement_level': max(0.0, min(1.0, float(content.get('agreement_level', 0.5)))),
            'your_score': max(0.0, min(1.0, float(content.get('your_score', 0.5)))),
            'key_match_factors': [],
            'key_mismatch_factors': [],
            'recommendations': []
        }
        
        # Validate list fields
        for field in ['key_match_factors', 'key_mismatch_factors', 'recommendations']:
            items = content.get(field, [])
            if isinstance(items, list):
                validated[field] = [str(item) for item in items if item]
            else:
                validated[field] = [str(items)] if items else []
        
        return validated
    
    def _create_error_response(self, error_msg: str) -> Dict[str, Any]:
        """Create error response for scoring."""
        return {
            'score': 0.0,
            'reasoning': f'Parsing error: {error_msg}',
            'pros': [],
            'cons': ['Response parsing failed'],
            'key_factors': ['parsing_error'],
            'error': error_msg
        }
    
    def _create_comparison_error_response(self, error_msg: str) -> Dict[str, Any]:
        """Create error response for comparison."""
        return {
            'rankings': [],
            'overall_analysis': f'Comparison parsing failed: {error_msg}',
            'best_match_reasoning': 'Unable to determine best match due to parsing error',
            'considerations': ['Response parsing failed'],
            'error': error_msg
        }
    
    def _create_explanation_error_response(self, error_msg: str) -> Dict[str, Any]:
        """Create error response for explanation."""
        return {
            'score_interpretation': 'Unable to interpret due to parsing error',
            'likely_reasoning': f'Parsing failed: {error_msg}',
            'agreement_level': 0.0,
            'your_score': 0.0,
            'key_match_factors': [],
            'key_mismatch_factors': ['parsing_error'],
            'recommendations': ['Fix response parsing'],
            'error': error_msg
        }
    
    def extract_scores_from_batch(self, responses: List[Dict[str, Any]]) -> List[float]:
        """Extract just the scores from a batch of responses."""
        scores = []
        
        for response in responses:
            try:
                parsed = self.parse_scoring_response(response)
                scores.append(parsed.get('score', 0.0))
            except Exception as e:
                logger.error(f"Error extracting score from response: {e}")
                scores.append(0.0)
        
        return scores
    
    def validate_response_completeness(self, parsed_response: Dict[str, Any]) -> Dict[str, Any]:
        """Validate that response has all required fields."""
        completeness = {
            'is_complete': True,
            'missing_fields': [],
            'field_quality': {}
        }
        
        # Check required fields
        for field in self.required_fields:
            if field not in parsed_response:
                completeness['is_complete'] = False
                completeness['missing_fields'].append(field)
            else:
                # Check field quality
                value = parsed_response[field]
                if field == 'score':
                    quality = 'good' if isinstance(value, (int, float)) and 0 <= value <= 1 else 'poor'
                elif field in ['pros', 'cons', 'key_factors']:
                    quality = 'good' if isinstance(value, list) and len(value) > 0 else 'poor'
                elif field == 'reasoning':
                    quality = 'good' if isinstance(value, str) and len(value) > 10 else 'poor'
                else:
                    quality = 'good' if value else 'poor'
                
                completeness['field_quality'][field] = quality
        
        return completeness
