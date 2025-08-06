import json
import time
import re
import logging
import numpy as np
from typing import Dict, List, Any, Optional

from openai import OpenAI, APIError, RateLimitError

from app.home_matching.config.settings import (
    OPENAI_KEY, LLM_MODEL, LLM_TEMPERATURE, LLM_MAX_TOKENS
)

logger = logging.getLogger(__name__)


class LLMClient:
    """Handles LLM API calls for home matching."""

    def __init__(self, provider: str = "openai", model: str = None, api_key: str = None):
        logger.info(f"🚀 Initializing LLMClient with provider: {provider}, model: {model or LLM_MODEL}")
        
        self.provider = provider
        self.model = model or LLM_MODEL
        self.api_key = api_key or OPENAI_KEY
        self.client = None
        
        # Log configuration (without exposing API key)
        logger.debug(f"📋 LLMClient config - Provider: {self.provider}, Model: {self.model}, API Key: {'✅ Present' if self.api_key else '❌ Missing'}")

        if self.provider == "openai":
            self._init_openai_client()
        else:
            error_msg = f"Unsupported LLM provider: {self.provider}"
            logger.error(f"❌ {error_msg}")
            raise ValueError(error_msg)

    def _init_openai_client(self) -> None:
        logger.debug("🔧 Initializing OpenAI client...")
        
        if not self.api_key:
            error_msg = "OpenAI API key not provided"
            logger.error(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        try:
            self.client = OpenAI(api_key=self.api_key)
            logger.info(f"✅ Successfully initialized OpenAI client with model: {self.model}")
        except Exception as e:
            logger.error(f"❌ Failed to initialize OpenAI client: {e}")
            raise

    def call_llm(self, system_prompt: str, user_prompt: str,
                 temperature: float = None, max_tokens: int = None,
                 response_format: str = "json") -> Dict[str, Any]:
        temperature = temperature or LLM_TEMPERATURE
        max_tokens = max_tokens or LLM_MAX_TOKENS
        
        logger.info(f"🤖 Starting LLM call - Model: {self.model}, Temp: {temperature}, Max tokens: {max_tokens}, Format: {response_format}")
        logger.debug(f"📝 System prompt length: {len(system_prompt)} chars")
        logger.debug(f"📝 User prompt length: {len(user_prompt)} chars")
        
        start_time = time.time()
        try:
            result = self._call_openai(system_prompt, user_prompt, temperature, max_tokens, response_format)
            duration = time.time() - start_time
            
            # Log successful completion with metrics
            usage = result.get('usage', {})
            logger.info(f"✅ LLM call completed in {duration:.2f}s - Tokens: {usage.get('total_tokens', 'unknown')} (prompt: {usage.get('prompt_tokens', 'unknown')}, completion: {usage.get('completion_tokens', 'unknown')})")
            
            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"❌ LLM call failed after {duration:.2f}s: {e}")
            raise

    def _call_openai(self, system_prompt: str, user_prompt: str,
                     temperature: float, max_tokens: int, response_format: str) -> Dict[str, Any]:
        logger.debug("🔄 Preparing OpenAI API request...")
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        request_params = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        # Add JSON response format if supported
        if response_format == "json" and "gpt-4" in self.model.lower():
            request_params["response_format"] = {"type": "json_object"}
            logger.debug("📋 Added JSON response format constraint")
        
        logger.debug(f"📤 Sending request to OpenAI API with {len(messages)} messages")
        response = self._make_request_with_retry(request_params)
        
        content = response.choices[0].message.content
        logger.debug(f"📥 Received response - Length: {len(content)} chars, Finish reason: {response.choices[0].finish_reason}")

        # Parse response based on format
        if response_format == "json":
            logger.debug("🔍 Parsing JSON response...")
            try:
                parsed_content = json.loads(content)
                logger.debug("✅ Successfully parsed JSON response")
            except json.JSONDecodeError as e:
                logger.warning(f"⚠️ JSON parsing failed: {e}, attempting text extraction...")
                parsed_content = self._extract_json_from_text(content)
        else:
            parsed_content = content
            logger.debug("📝 Using raw text response")

        # Log token usage
        usage = response.usage
        logger.debug(f"📊 Token usage - Prompt: {usage.prompt_tokens}, Completion: {usage.completion_tokens}, Total: {usage.total_tokens}")

        return {
            "content": parsed_content,
            "raw_content": content,
            "usage": {
                "prompt_tokens": usage.prompt_tokens,
                "completion_tokens": usage.completion_tokens,
                "total_tokens": usage.total_tokens
            },
            "model": response.model,
            "finish_reason": response.choices[0].finish_reason
        }

    def _make_request_with_retry(self, request_params: Dict[str, Any], max_retries: int = 3) -> Any:
        logger.debug(f"🔄 Making API request with retry logic (max {max_retries} attempts)")
        
        for attempt in range(max_retries):
            try:
                logger.debug(f"📡 Attempt {attempt + 1}/{max_retries} - Calling OpenAI API...")
                response = self.client.chat.completions.create(**request_params)
                logger.debug(f"✅ API call successful on attempt {attempt + 1}")
                return response
                
            except RateLimitError as e:
                wait_time = 2 ** attempt
                if attempt < max_retries - 1:
                    logger.warning(f"⏳ Rate limit hit on attempt {attempt + 1}, waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"❌ Rate limit exceeded after {max_retries} attempts: {e}")
                    raise e
                    
            except APIError as e:
                wait_time = 2 ** attempt
                if attempt < max_retries - 1:
                    logger.warning(f"⚠️ API error on attempt {attempt + 1}: {e}, waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"❌ API error after {max_retries} attempts: {e}")
                    raise e
                    
            except Exception as e:
                if attempt == max_retries - 1:
                    logger.error(f"❌ Unexpected error after {max_retries} attempts: {e}")
                    raise e
                else:
                    logger.warning(f"⚠️ Unexpected error on attempt {attempt + 1}: {e}, retrying in 1s...")
                    time.sleep(1)

    def _extract_json_from_text(self, text: str) -> Dict[str, Any]:
        logger.debug(f"🔍 Attempting to extract JSON from text (length: {len(text)} chars)")
        
        try:
            # Look for JSON-like content between braces
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                logger.debug(f"📋 Found potential JSON block (length: {len(json_str)} chars)")
                
                parsed = json.loads(json_str)
                logger.info("✅ Successfully extracted and parsed JSON from text")
                return parsed
            else:
                logger.warning("⚠️ No JSON block found in text")
                
        except json.JSONDecodeError as e:
            logger.warning(f"⚠️ JSON decode error during extraction: {e}")
        except Exception as e:
            logger.error(f"❌ Unexpected error during JSON extraction: {e}")
        
        # Return fallback response
        logger.info("🔄 Returning fallback JSON response")
        return {
            "score": 0.0,
            "reasoning": "Failed to parse JSON response",
            "raw_response": text[:200] + "..." if len(text) > 200 else text
        }


# Dummy scorer that uses the LLMClient to return a float score from the LLM
class Scorer:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    def llm_score(self, user: Dict[str, Any], home: Dict[str, Any]) -> float:
        """Example scoring function that returns a score from the LLM."""
        system_prompt = "You are a helpful assistant that evaluates home-user fit."
        user_prompt = f"""
Evaluate how well this home matches this user's preferences.
User: {json.dumps(user)}
Home: {json.dumps(home)}
Return a JSON with a single field "score" from 0.0 to 1.0.
"""
        response = self.llm_client.call_llm(system_prompt, user_prompt)
        return float(response["content"].get("score", 0.0))


# Consistency testing
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Initialize
    llm_client = LLMClient()
    scorer = Scorer(llm_client)

    # Sample test data
    test_users = [{"user_id": "user_123", "age": 30, "budget": 500000, "pets": "yes"}]
    test_homes = [{"home_id": "home_abc", "price": 480000, "pet_friendly": True}]

    test_user = test_users[0]
    test_home = test_homes[0]
    num_consistency_tests = 5

    consistency_scores = []
    consistency_times = []

    print("🔄 Testing scoring consistency...")
    print(f"Testing {test_user['user_id']} + {test_home['home_id']} {num_consistency_tests} times:")

    for i in range(num_consistency_tests):
        try:
            start_time = time.time()
            score = scorer.llm_score(test_user, test_home)
            end_time = time.time()
            consistency_scores.append(score)
            consistency_times.append(end_time - start_time)
            print(f"  Run {i + 1}: {score:.3f} in {end_time - start_time:.2f}s")
        except Exception as e:
            print(f"  Run {i + 1}: Error - {str(e)}")
            consistency_scores.append(0.0)
            consistency_times.append(0.0)

    if consistency_scores:
        print(f"\n📊 Consistency Analysis:")
        print(f"Mean score: {np.mean(consistency_scores):.3f}")
        print(f"Standard deviation: {np.std(consistency_scores):.3f}")
        print(f"Score range: {max(consistency_scores) - min(consistency_scores):.3f}")
        print(f"Coefficient of variation: {np.std(consistency_scores) / np.mean(consistency_scores) * 100:.1f}%")
    else:
        print("❌ No successful consistency tests")
