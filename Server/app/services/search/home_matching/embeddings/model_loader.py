"""
Model loader for sentence-transformers, OpenAI, and Perplexity embeddings.
"""

import re
import time
import warnings
from typing import Any

import numpy as np
import openai
from openai import APIError, RateLimitError
from sentence_transformers import SentenceTransformer

from app.config.llm_models import openai_embedding_model
from logger import log

from ..config.settings import EMBEDDING_MODEL, OPENAI_KEY

# Suppress FutureWarning about deprecated resume_download parameter in huggingface_hub
# This is a known issue in sentence-transformers 2.6.1 that will be fixed in future versions
warnings.filterwarnings(
    "ignore",
    message=".*resume_download.*is deprecated.*",
    category=FutureWarning,
    module="huggingface_hub",
)


def _extract_retry_after_time(error_message: str) -> float | None:
    """
    Extract retry-after time from OpenAI rate limit error message.

    Error format: "Please try again in 68ms" or "Please try again in 1.5s"
    Returns time in seconds, or None if not found.
    """
    pattern = r"Please try again in ([\d.]+)(ms|s|seconds?)"
    match = re.search(pattern, error_message, re.IGNORECASE)
    if match:
        value = float(match.group(1))
        unit = match.group(2).lower()
        if unit == "ms":
            return value / 1000.0
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
                wait_time = 2**attempt
                log.warn(
                    "SEARCH",
                    f"⏳ Rate limit hit on attempt {attempt + 1}, using exponential backoff: {wait_time}s",
                )
            else:
                wait_time = max(wait_time + 0.1, 0.1)
                log.warn(
                    "SEARCH",
                    f"⏳ Rate limit hit on attempt {attempt + 1}, waiting {wait_time:.3f}s (as requested by API)...",
                )

            if attempt < max_retries - 1:
                time.sleep(wait_time)
            else:
                log.error("ERRORS", f"❌ Rate limit exceeded after {max_retries} attempts: {e}")
                raise
        except APIError as e:
            wait_time = 2**attempt
            if attempt < max_retries - 1:
                log.warn(
                    "SEARCH",
                    f"⚠️ API error on attempt {attempt + 1}: {e}, waiting {wait_time}s before retry...",
                )
                time.sleep(wait_time)
            else:
                log.error("ERRORS", f"❌ API error after {max_retries} attempts: {e}")
                raise
        except Exception as e:
            if attempt == max_retries - 1:
                log.error("ERRORS", f"❌ Unexpected error after {max_retries} attempts: {e}")
                raise
            else:
                log.warn(
                    "SEARCH", f"⚠️ Unexpected error on attempt {attempt + 1}: {e}, retrying in 1s..."
                )
                time.sleep(1)


class EmbeddingModelLoader:
    """Loads and manages different embedding models."""

    def __init__(self):
        self.sentence_transformer = None
        self.openai_client = None
        self.perplexity_client = None
        self._model_cache = {}

    def load_sentence_transformer(self, model_name: str | None = None) -> SentenceTransformer:
        """Load sentence-transformers model."""
        model_name = model_name or EMBEDDING_MODEL

        if model_name not in self._model_cache:
            try:
                model = SentenceTransformer(model_name)
                self._model_cache[model_name] = model
            except Exception as e:
                log.error("ERRORS", f"Error loading sentence-transformer {model_name}: {e}")
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
                log.error("ERRORS", f"Error loading OpenAI client: {e}")
                raise

        return self.openai_client

    def get_openai_embedding(self, text: str, model: str | None = None) -> np.ndarray:
        """Get embedding from OpenAI API."""
        try:
            client = self.load_openai_client()
            resolved_model = model or openai_embedding_model()

            def make_request():
                return client.embeddings.create(input=text, model=resolved_model)

            response = _make_openai_request_with_retry(make_request)
            if response is None:
                raise ValueError("OpenAI API returned no response")
            data = response.data
            if not data:
                raise ValueError("OpenAI embedding response contained no data")
            embedding = np.array(data[0].embedding)
            return embedding
        except Exception as e:
            log.error("ERRORS", f"Error getting OpenAI embedding: {e}")
            raise

    def get_openai_embeddings_batch(
        self, texts: list[str], model: str | None = None
    ) -> list[np.ndarray]:
        """Get multiple embeddings from OpenAI API."""
        try:
            client = self.load_openai_client()
            resolved_model = model or openai_embedding_model()

            def make_request():
                return client.embeddings.create(input=texts, model=resolved_model)

            response = _make_openai_request_with_retry(make_request)
            if response is None:
                raise ValueError("OpenAI API returned no response")
            data = response.data
            if not data:
                raise ValueError("OpenAI embeddings response contained no data")
            embeddings = [np.array(d.embedding) for d in data]
            return embeddings
        except Exception as e:
            log.error("ERRORS", f"Error getting OpenAI embeddings batch: {e}")
            raise

    def get_sentence_transformer_embedding(
        self, text: str, model_name: str | None = None
    ) -> np.ndarray:
        """Get embedding from sentence-transformers model."""
        try:
            model = self.load_sentence_transformer(model_name)
            embedding = model.encode(text)
            return np.array(embedding)
        except Exception as e:
            log.error("ERRORS", f"Error getting sentence-transformer embedding: {e}")
            raise

    def get_sentence_transformer_embeddings_batch(
        self, texts: list[str], model_name: str | None = None
    ) -> list[np.ndarray]:
        """Get multiple embeddings from sentence-transformers model."""
        try:
            model = self.load_sentence_transformer(model_name)
            embeddings = model.encode(texts)
            return [np.array(emb) for emb in embeddings]
        except Exception as e:
            log.error("ERRORS", f"Error getting sentence-transformer embeddings batch: {e}")
            raise

    def get_embedding(
        self, text: str, provider: str = "sentence_transformer", model: str | None = None
    ) -> np.ndarray:
        """Get embedding using specified provider."""
        if provider == "sentence_transformer":
            return self.get_sentence_transformer_embedding(text, model)
        elif provider == "openai":
            return self.get_openai_embedding(text, model)
        else:
            raise ValueError(f"Unknown embedding provider: {provider}")

    def get_embeddings_batch(
        self, texts: list[str], provider: str = "sentence_transformer", model: str | None = None
    ) -> list[np.ndarray]:
        """Get multiple embeddings using specified provider."""
        if provider == "sentence_transformer":
            return self.get_sentence_transformer_embeddings_batch(texts, model)
        elif provider == "openai":
            return self.get_openai_embeddings_batch(texts, model)
        else:
            raise ValueError(f"Unknown embedding provider: {provider}")

    def get_model_info(
        self, provider: str = "sentence_transformer", model: str | None = None
    ) -> dict[str, Any]:
        """Get information about the loaded model."""
        if provider == "sentence_transformer":
            model_name = model or EMBEDDING_MODEL
            try:
                st_model = self.load_sentence_transformer(model_name)
                return {
                    "provider": "sentence_transformer",
                    "model_name": model_name,
                    "dimension": st_model.get_sentence_embedding_dimension(),
                    "max_seq_length": getattr(st_model, "max_seq_length", "unknown"),
                }
            except Exception as e:
                log.error("ERRORS", f"Error getting sentence-transformer model info: {e}")
                return {"provider": "sentence_transformer", "error": str(e)}

        elif provider == "openai":
            model_name = model or openai_embedding_model()
            return {
                "provider": "openai",
                "model_name": model_name,
                "dimension": 1536,  # text-embedding-3-small default (do not use -large without dimensions=)
                "max_tokens": 8191,
            }

        else:
            return {"error": f"Unknown provider: {provider}"}


# Global model loader instance
model_loader = EmbeddingModelLoader()
