"""
LLM client for handling API calls to OpenAI and other providers.
"""

import openai
import json
import time
from typing import Dict, List, Any, Optional, Union
import logging

from ..config.settings import (
    OPENAI_API_KEY, LLM_MODEL, LLM_TEMPERATURE, LLM_MAX_TOKENS
)

logger = logging.getLogger(__name__)

class LLMClient:
    """Handles LLM API calls for home matching."""
    
    def __init__(self, provider: str = "openai", model: str = None, api_key: str = None):
        self.provider = provider
        self.model = model or LLM_MODEL
        self.api_key = api_key or OPENAI_API_KEY
        self.client = None
        
        if self.provider == "openai":
            self._init_openai_client()
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")
    
    def _init_openai_client(self) -> None:
        """Initialize OpenAI client."""
        try:
            if not self.api_key:
                raise ValueError("OpenAI API key not provided")
            
            self.client = openai.OpenAI(api_key=self.api_key)
            logger.info(f"Initialized OpenAI client with model: {self.model}")
            
        except Exception as e:
            logger.error(f"Error initializing OpenAI client: {e}")
            raise
    
    def call_llm(
        self, 
        system_prompt: str, 
        user_prompt: str, 
        temperature: float = None,
        max_tokens: int = None,
        response_format: str = "json"
    ) -> Dict[str, Any]:
        """Make LLM API call and return response."""
        try:
            temperature = temperature or LLM_TEMPERATURE
            max_tokens = max_tokens or LLM_MAX_TOKENS
            
            if self.provider == "openai":
                return self._call_openai(system_prompt, user_prompt, temperature, max_tokens, response_format)
            else:
                raise ValueError(f"Unsupported provider: {self.provider}")
                
        except Exception as e:
            logger.error(f"Error calling LLM: {e}")
            raise
    
    def _call_openai(
        self, 
        system_prompt: str, 
        user_prompt: str, 
        temperature: float,
        max_tokens: int,
        response_format: str
    ) -> Dict[str, Any]:
        """Call OpenAI API."""
        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            # Prepare request parameters
            request_params = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            # Add response format if supported by model
            if response_format == "json" and "gpt-4" in self.model.lower():
                request_params["response_format"] = {"type": "json_object"}
            
            # Make API call with retry logic
            response = self._make_request_with_retry(request_params)
            
            # Extract response content
            content = response.choices[0].message.content
            
            # Parse JSON if expected
            if response_format == "json":
                try:
                    parsed_content = json.loads(content)
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON response: {e}")
                    # Try to extract JSON from response
                    parsed_content = self._extract_json_from_text(content)
            else:
                parsed_content = content
            
            return {
                "content": parsed_content,
                "raw_content": content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                "model": response.model,
                "finish_reason": response.choices[0].finish_reason
            }
            
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {e}")
            raise
    
    def _make_request_with_retry(self, request_params: Dict[str, Any], max_retries: int = 3) -> Any:
        """Make API request with retry logic."""
        for attempt in range(max_retries):
            try:
                response = self.client.chat.completions.create(**request_params)
                return response
                
            except openai.RateLimitError as e:
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 1  # Exponential backoff
                    logger.warning(f"Rate limit hit, waiting {wait_time}s before retry {attempt + 1}")
                    time.sleep(wait_time)
                else:
                    raise e
                    
            except openai.APIError as e:
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 1
                    logger.warning(f"API error, waiting {wait_time}s before retry {attempt + 1}: {e}")
                    time.sleep(wait_time)
                else:
                    raise e
                    
            except Exception as e:
                logger.error(f"Unexpected error on attempt {attempt + 1}: {e}")
                if attempt == max_retries - 1:
                    raise e
                time.sleep(1)
    
    def _extract_json_from_text(self, text: str) -> Dict[str, Any]:
        """Try to extract JSON from text response."""
        try:
            # Look for JSON-like content between braces
            import re
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                return json.loads(json_str)
            else:
                # Return structured fallback
                return {
                    "score": 0.5,
                    "reasoning": "Could not parse LLM response as JSON",
                    "pros": ["Response received"],
                    "cons": ["JSON parsing failed"],
                    "key_factors": ["parsing_error"],
                    "raw_response": text
                }
        except Exception as e:
            logger.error(f"Error extracting JSON from text: {e}")
            return {
                "score": 0.0,
                "reasoning": f"JSON extraction failed: {str(e)}",
                "pros": [],
                "cons": ["JSON extraction error"],
                "key_factors": ["extraction_error"],
                "raw_response": text
            }
    
    def call_llm_batch(
        self, 
        system_prompt: str, 
        user_prompts: List[str],
        temperature: float = None,
        max_tokens: int = None,
        response_format: str = "json"
    ) -> List[Dict[str, Any]]:
        """Make batch LLM API calls."""
        try:
            results = []
            
            for i, user_prompt in enumerate(user_prompts):
                logger.debug(f"Processing batch item {i + 1}/{len(user_prompts)}")
                
                try:
                    result = self.call_llm(
                        system_prompt, 
                        user_prompt, 
                        temperature, 
                        max_tokens, 
                        response_format
                    )
                    results.append(result)
                    
                    # Add small delay to avoid rate limits
                    if i < len(user_prompts) - 1:
                        time.sleep(0.1)
                        
                except Exception as e:
                    logger.error(f"Error processing batch item {i + 1}: {e}")
                    # Add error result
                    results.append({
                        "content": {
                            "score": 0.0,
                            "reasoning": f"API call failed: {str(e)}",
                            "pros": [],
                            "cons": ["API error"],
                            "key_factors": ["api_error"]
                        },
                        "error": str(e)
                    })
            
            logger.info(f"Completed batch processing: {len(results)} results")
            return results
            
        except Exception as e:
            logger.error(f"Error in batch LLM calls: {e}")
            raise
    
    def estimate_tokens(self, text: str) -> int:
        """Estimate token count for text."""
        # Rough estimation: 1 token ≈ 4 characters for English text
        return len(text) // 4
    
    def validate_request_size(self, system_prompt: str, user_prompt: str, max_tokens: int = None) -> bool:
        """Validate that request won't exceed token limits."""
        max_tokens = max_tokens or LLM_MAX_TOKENS
        
        # Estimate input tokens
        input_tokens = self.estimate_tokens(system_prompt + user_prompt)
        
        # Check against model limits (rough estimates)
        model_limits = {
            "gpt-3.5-turbo": 4096,
            "gpt-4": 8192,
            "gpt-4-turbo": 128000,
            "gpt-4o": 128000
        }
        
        model_limit = model_limits.get(self.model, 4096)
        total_needed = input_tokens + max_tokens
        
        if total_needed > model_limit:
            logger.warning(f"Request may exceed token limit: {total_needed} > {model_limit}")
            return False
        
        return True
    
    def get_client_info(self) -> Dict[str, Any]:
        """Get information about the LLM client."""
        return {
            "provider": self.provider,
            "model": self.model,
            "has_api_key": bool(self.api_key),
            "client_initialized": self.client is not None
        }
