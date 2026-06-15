"""
User encoder that combines structured and text data into user embeddings.
"""

from typing import Any

import numpy as np

from logger import log

from ..preprocessing.models.embedding_input import EmbeddingUserInput
from .model_loader import model_loader


class UserEncoder:
    """Encodes user preferences into embeddings."""

    def __init__(self, embedding_provider: str = "sentence_transformer", model: str | None = None):
        self.embedding_provider = embedding_provider
        self.model = model

    def _extract_structured_features(self, user_data: dict[str, Any]) -> np.ndarray:
        """Extract structured numerical features from user data using shared config."""
        from .feature_config import FeatureConfig

        return FeatureConfig.extract_user_structured_features(user_data)

    def encode_user(self, user_data: dict[str, Any]) -> np.ndarray:
        """Encode user data into embedding."""
        try:
            # Convert to preprocessing model
            embedding_user = EmbeddingUserInput.from_dict(user_data)

            # Extract text features using the model's method
            text_features = embedding_user.extract_text_features()

            if text_features.strip():
                text_embedding = model_loader.get_embedding(
                    text_features, provider=self.embedding_provider, model=self.model
                )
            else:
                # If no text features, create zero embedding
                model_info = model_loader.get_model_info(self.embedding_provider, self.model)
                embedding_dim = model_info.get("dimension", 384)
                text_embedding = np.zeros(embedding_dim)

            # Extract structured features using the model's method
            structured_features = self._extract_structured_features(embedding_user.to_dict())

            # Combine text and structured embeddings
            combined_embedding = np.concatenate([text_embedding, structured_features])

            return combined_embedding

        except Exception as e:
            log.error("ERRORS", f"Error encoding user data: {e}")
            raise

    def encode_users_batch(self, users_data: list[dict[str, Any]]) -> list[np.ndarray]:
        """Encode multiple users into embeddings."""
        try:
            embeddings = []

            # Extract all text features first using preprocessing models
            text_features_list = []
            structured_features_list = []

            for user_data in users_data:
                # Convert to preprocessing model
                embedding_user = EmbeddingUserInput.from_dict(user_data)
                text_features = embedding_user.extract_text_features()
                structured_features = self._extract_structured_features(embedding_user.to_dict())

                text_features_list.append(text_features)
                structured_features_list.append(structured_features)

            # Get text embeddings in batch
            non_empty_texts = [text for text in text_features_list if text.strip()]
            if non_empty_texts:
                text_embeddings = model_loader.get_embeddings_batch(
                    non_empty_texts, provider=self.embedding_provider, model=self.model
                )
            else:
                text_embeddings = []

            # Combine embeddings
            text_idx = 0
            for _i, (text_features, structured_features) in enumerate(
                zip(text_features_list, structured_features_list, strict=False)
            ):
                if text_features.strip():
                    text_embedding = text_embeddings[text_idx]
                    text_idx += 1
                else:
                    # Create zero embedding for empty text
                    model_info = model_loader.get_model_info(self.embedding_provider, self.model)
                    embedding_dim = model_info.get("dimension", 384)
                    text_embedding = np.zeros(embedding_dim)

                # Combine text and structured embeddings
                combined_embedding = np.concatenate([text_embedding, structured_features])
                embeddings.append(combined_embedding)

            return embeddings

        except Exception as e:
            log.error("ERRORS", f"Error encoding users batch: {e}")
            raise

    def get_embedding_dimension(self) -> int:
        """Get the dimension of the combined embedding."""
        try:
            from .feature_config import FeatureConfig

            dimensions = FeatureConfig.get_embedding_dimension(self.embedding_provider, self.model)
            return dimensions["user_total_dimension"]
        except Exception as e:
            log.error("ERRORS", f"Error getting embedding dimension: {e}")
            return 394  # Fallback dimension (384 + 10)
