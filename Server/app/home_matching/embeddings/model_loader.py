"""
Model loader for sentence-transformers, OpenAI, and Perplexity embeddings.
"""

import os
import openai
import numpy as np
import time
import re
from typing import List, Optional, Dict, Any
from sentence_transformers import SentenceTransformer
import logging
from openai import RateLimitError, APIError

# Suppress verbose logging from sentence-transformers
logging.getLogger('sentence_transformers').setLevel(logging.WARNING)

from ..config.settings import (
    EMBEDDING_MODEL, OPENAI_KEY, PERPLEXITY_API_KEY,
    EMBEDDING_DIMENSION
)

logger = logging.getLogger(__name__)


def _extract_retry_after_time(error_message: str) -> float:
    """
    Extract retry-after time from OpenAI rate limit error message.
    
    Error format: "Please try again in 68ms" or "Please try again in 1.5s"
    Returns time in seconds, or None if not found.
    """
    pattern = r'Please try again in ([\d.]+)(ms|s|seconds?)'
    match = re.search(pattern, error_message, re.IGNORECASE)
    if match:
        value = float(match.group(1))
        unit = match.group(2).lower()
        if unit == 'ms':
            return value / 1000.0
        else:
            return value
    return None


def _make_openai_request_with_retry(request_func, max_retries: int = 3):
    """Make OpenAI API request with retry logic that respects retry-after time."""
    for attempt in range(max_retries):
        try:
            return request_func()
        except RateLimitError as e:
            error_str = str(e)
            wait_time = _extract_retry_after_time(error_str)
            
            if wait_time is None:
                wait_time = 2 ** attempt
                logger.warning(f"⏳ Rate limit hit on attempt {attempt + 1}, using exponential backoff: {wait_time}s")
            else:
                wait_time = max(wait_time + 0.1, 0.1)
                logger.warning(f"⏳ Rate limit hit on attempt {attempt + 1}, waiting {wait_time:.3f}s (as requested by API)...")
            
            if attempt < max_retries - 1:
                time.sleep(wait_time)
            else:
                logger.error(f"❌ Rate limit exceeded after {max_retries} attempts: {e}")
                raise
        except APIError as e:
            wait_time = 2 ** attempt
            if attempt < max_retries - 1:
                logger.warning(f"⚠️ API error on attempt {attempt + 1}: {e}, waiting {wait_time}s before retry...")
                time.sleep(wait_time)
            else:
                logger.error(f"❌ API error after {max_retries} attempts: {e}")
                raise
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"❌ Unexpected error after {max_retries} attempts: {e}")
                raise
            else:
                logger.warning(f"⚠️ Unexpected error on attempt {attempt + 1}: {e}, retrying in 1s...")
                time.sleep(1)


class EmbeddingModelLoader:
    """Loads and manages different embedding models."""
    
    def __init__(self):
        self.sentence_transformer = None
        self.openai_client = None
        self.perplexity_client = None
        self._model_cache = {}
    
    def load_sentence_transformer(self, model_name: str = None) -> SentenceTransformer:
        """Load sentence-transformers model."""
        model_name = model_name or EMBEDDING_MODEL
        
        if model_name not in self._model_cache:
            try:
                model = SentenceTransformer(model_name)
                self._model_cache[model_name] = model
            except Exception as e:
                logger.error(f"Error loading sentence-transformer {model_name}: {e}")
                raise
        
        return self._model_cache[model_name]
    
    def load_openai_client(self) -> openai.OpenAI:
        """Load OpenAI client."""
        if self.openai_client is None:
            if not OPENAI_KEY:
                raise ValueError("OPENAI_KEY not found in environment variables")
            
            try:
                self.openai_client = openai.OpenAI(api_key=OPENAI_KEY)
            except Exception as e:
                logger.error(f"Error loading OpenAI client: {e}")
                raise
        
        return self.openai_client
    
    def get_openai_embedding(self, text: str, model: str = "text-embedding-ada-002") -> np.ndarray:
        """Get embedding from OpenAI API."""
        try:
            client = self.load_openai_client()
            
            def make_request():
                return client.embeddings.create(
                    input=text,
                    model=model
                )
            
            response = _make_openai_request_with_retry(make_request)
            embedding = np.array(response.data[0].embedding)
            return embedding
        except Exception as e:
            logger.error(f"Error getting OpenAI embedding: {e}")
            raise
    
    def get_openai_embeddings_batch(self, texts: List[str], model: str = "text-embedding-ada-002") -> List[np.ndarray]:
        """Get multiple embeddings from OpenAI API."""
        try:
            client = self.load_openai_client()
            
            def make_request():
                return client.embeddings.create(
                    input=texts,
                    model=model
                )
            
            response = _make_openai_request_with_retry(make_request)
            embeddings = [np.array(data.embedding) for data in response.data]
            return embeddings
        except Exception as e:
            logger.error(f"Error getting OpenAI embeddings batch: {e}")
            raise
    
    def get_sentence_transformer_embedding(self, text: str, model_name: str = None) -> np.ndarray:
        """Get embedding from sentence-transformers model."""
        try:
            model = self.load_sentence_transformer(model_name)
            embedding = model.encode(text)
            return np.array(embedding)
        except Exception as e:
            logger.error(f"Error getting sentence-transformer embedding: {e}")
            raise
    
    def get_sentence_transformer_embeddings_batch(self, texts: List[str], model_name: str = None) -> List[np.ndarray]:
        """Get multiple embeddings from sentence-transformers model."""
        try:
            model = self.load_sentence_transformer(model_name)
            embeddings = model.encode(texts)
            return [np.array(emb) for emb in embeddings]
        except Exception as e:
            logger.error(f"Error getting sentence-transformer embeddings batch: {e}")
            raise
    
    def get_embedding(
        self, 
        text: str, 
        provider: str = "sentence_transformer", 
        model: str = None
    ) -> np.ndarray:
        """Get embedding using specified provider."""
        if provider == "sentence_transformer":
            return self.get_sentence_transformer_embedding(text, model)
        elif provider == "openai":
            return self.get_openai_embedding(text, model or "text-embedding-ada-002")
        else:
            raise ValueError(f"Unknown embedding provider: {provider}")
    
    def get_embeddings_batch(
        self, 
        texts: List[str], 
        provider: str = "sentence_transformer", 
        model: str = None
    ) -> List[np.ndarray]:
        """Get multiple embeddings using specified provider."""
        if provider == "sentence_transformer":
            return self.get_sentence_transformer_embeddings_batch(texts, model)
        elif provider == "openai":
            return self.get_openai_embeddings_batch(texts, model or "text-embedding-ada-002")
        else:
            raise ValueError(f"Unknown embedding provider: {provider}")
    
    def get_model_info(self, provider: str = "sentence_transformer", model: str = None) -> Dict[str, Any]:
        """Get information about the loaded model."""
        if provider == "sentence_transformer":
            model_name = model or EMBEDDING_MODEL
            try:
                st_model = self.load_sentence_transformer(model_name)
                return {
                    "provider": "sentence_transformer",
                    "model_name": model_name,
                    "dimension": st_model.get_sentence_embedding_dimension(),
                    "max_seq_length": getattr(st_model, 'max_seq_length', 'unknown')
                }
            except Exception as e:
                logger.error(f"Error getting sentence-transformer model info: {e}")
                return {"provider": "sentence_transformer", "error": str(e)}
        
        elif provider == "openai":
            return {
                "provider": "openai",
                "model_name": model or "text-embedding-ada-002",
                "dimension": 1536,  # Ada-002 dimension
                "max_tokens": 8191
            }
        
        else:
            return {"error": f"Unknown provider: {provider}"}

# Global model loader instance
model_loader = EmbeddingModelLoader()
