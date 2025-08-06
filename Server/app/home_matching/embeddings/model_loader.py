"""
Model loader for sentence-transformers, OpenAI, and Perplexity embeddings.
"""

import os
import openai
import numpy as np
from typing import List, Optional, Dict, Any
from sentence_transformers import SentenceTransformer
import logging

from ..config.settings import (
    EMBEDDING_MODEL, OPENAI_API_KEY, PERPLEXITY_API_KEY,
    EMBEDDING_DIMENSION
)

logger = logging.getLogger(__name__)

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
                logger.info(f"Loading sentence-transformer model: {model_name}")
                model = SentenceTransformer(model_name)
                self._model_cache[model_name] = model
                logger.info(f"Successfully loaded {model_name}")
            except Exception as e:
                logger.error(f"Error loading sentence-transformer {model_name}: {e}")
                raise
        
        return self._model_cache[model_name]
    
    def load_openai_client(self) -> openai.OpenAI:
        """Load OpenAI client."""
        if self.openai_client is None:
            if not OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY not found in environment variables")
            
            try:
                self.openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
                logger.info("Successfully loaded OpenAI client")
            except Exception as e:
                logger.error(f"Error loading OpenAI client: {e}")
                raise
        
        return self.openai_client
    
    def get_openai_embedding(self, text: str, model: str = "text-embedding-ada-002") -> np.ndarray:
        """Get embedding from OpenAI API."""
        try:
            client = self.load_openai_client()
            response = client.embeddings.create(
                input=text,
                model=model
            )
            embedding = np.array(response.data[0].embedding)
            return embedding
        except Exception as e:
            logger.error(f"Error getting OpenAI embedding: {e}")
            raise
    
    def get_openai_embeddings_batch(self, texts: List[str], model: str = "text-embedding-ada-002") -> List[np.ndarray]:
        """Get multiple embeddings from OpenAI API."""
        try:
            client = self.load_openai_client()
            response = client.embeddings.create(
                input=texts,
                model=model
            )
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
