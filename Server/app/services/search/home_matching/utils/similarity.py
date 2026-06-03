"""
Similarity computation utilities for cosine and dot product scoring.
"""

from typing import Any

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from logger import log


def cosine_similarity_score(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """Calculate cosine similarity between two embeddings."""
    try:
        # Reshape to 2D if needed
        if embedding1.ndim == 1:
            embedding1 = embedding1.reshape(1, -1)
        if embedding2.ndim == 1:
            embedding2 = embedding2.reshape(1, -1)

        similarity = cosine_similarity(embedding1, embedding2)[0, 0]
        return float(similarity)
    except Exception as e:
        log.error("ERRORS", f"Error calculating cosine similarity: {e}")
        return 0.0


def dot_product_score(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """Calculate normalized dot product between two embeddings."""
    try:
        # Normalize embeddings
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        normalized1 = embedding1 / norm1
        normalized2 = embedding2 / norm2

        dot_product = np.dot(normalized1, normalized2)
        return float(dot_product)
    except Exception as e:
        log.error("ERRORS", f"Error calculating dot product: {e}")
        return 0.0


def euclidean_distance_score(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """Calculate similarity based on euclidean distance (inverted and normalized)."""
    try:
        distance = np.linalg.norm(embedding1 - embedding2)
        # Convert distance to similarity (closer = higher score)
        # Use exponential decay to map distance to [0, 1]
        similarity = np.exp(-distance)
        return float(similarity)
    except Exception as e:
        log.error("ERRORS", f"Error calculating euclidean distance: {e}")
        return 0.0


def manhattan_distance_score(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """Calculate similarity based on manhattan distance (inverted and normalized)."""
    try:
        distance = np.sum(np.abs(embedding1 - embedding2))
        # Convert distance to similarity
        similarity = np.exp(-distance / len(embedding1))
        return float(similarity)
    except Exception as e:
        log.error("ERRORS", f"Error calculating manhattan distance: {e}")
        return 0.0


def batch_cosine_similarity(
    user_embedding: np.ndarray, home_embeddings: list[np.ndarray]
) -> list[float]:
    """Calculate cosine similarity between user embedding and multiple home embeddings."""
    try:
        if not home_embeddings:
            return []

        # Stack home embeddings
        home_matrix = np.vstack(home_embeddings)

        # Reshape user embedding if needed
        if user_embedding.ndim == 1:
            user_embedding = user_embedding.reshape(1, -1)

        similarities = cosine_similarity(user_embedding, home_matrix)[0]
        return similarities.tolist()
    except Exception as e:
        log.error("ERRORS", f"Error in batch cosine similarity: {e}")
        return [0.0] * len(home_embeddings)


def weighted_similarity_score(similarities: list[float], weights: list[float]) -> float:
    """Calculate weighted average of multiple similarity scores."""
    try:
        if len(similarities) != len(weights):
            raise ValueError("Similarities and weights must have same length")

        if sum(weights) == 0:
            return 0.0

        weighted_sum = sum(s * w for s, w in zip(similarities, weights, strict=False))
        weight_sum = sum(weights)

        return weighted_sum / weight_sum
    except Exception as e:
        log.error("ERRORS", f"Error calculating weighted similarity: {e}")
        return 0.0


def rank_by_similarity(
    similarities: list[float], items: list[Any], descending: bool = True
) -> list[tuple[Any, float]]:
    """Rank items by their similarity scores."""
    try:
        if len(similarities) != len(items):
            raise ValueError("Similarities and items must have same length")

        paired = list(zip(items, similarities, strict=False))
        sorted_pairs = sorted(paired, key=lambda x: x[1], reverse=descending)

        return sorted_pairs
    except Exception as e:
        log.error("ERRORS", f"Error ranking by similarity: {e}")
        return list(zip(items, similarities, strict=False))


def normalize_scores(scores: list[float], method: str = "minmax") -> list[float]:
    """Normalize similarity scores to [0, 1] range."""
    try:
        if not scores:
            return []

        scores_array = np.array(scores)

        if method == "minmax":
            min_score = np.min(scores_array)
            max_score = np.max(scores_array)

            if max_score == min_score:
                return [1.0] * len(scores)

            normalized = (scores_array - min_score) / (max_score - min_score)

        elif method == "zscore":
            mean_score = np.mean(scores_array)
            std_score = np.std(scores_array)

            if std_score == 0:
                return [0.5] * len(scores)

            z_scores = (scores_array - mean_score) / std_score
            # Convert z-scores to [0, 1] using sigmoid
            normalized = 1 / (1 + np.exp(-z_scores))

        elif method == "softmax":
            exp_scores = np.exp(scores_array - np.max(scores_array))
            normalized = exp_scores / np.sum(exp_scores)

        else:
            raise ValueError(f"Unknown normalization method: {method}")

        return normalized.tolist()

    except Exception as e:
        log.error("ERRORS", f"Error normalizing scores: {e}")
        return scores


class SimilarityCalculator:
    """Class for calculating various similarity metrics."""

    def __init__(self, default_method: str = "cosine"):
        self.default_method = default_method
        self.methods = {
            "cosine": cosine_similarity_score,
            "dot_product": dot_product_score,
            "euclidean": euclidean_distance_score,
            "manhattan": manhattan_distance_score,
        }

    def calculate(
        self, embedding1: np.ndarray, embedding2: np.ndarray, method: str | None = None
    ) -> float:
        """Calculate similarity using specified method."""
        method = method or self.default_method

        if method not in self.methods:
            log.warn("SEARCH", f"Unknown method {method}, using {self.default_method}")
            method = self.default_method

        return self.methods[method](embedding1, embedding2)

    def calculate_multiple(
        self,
        user_embedding: np.ndarray,
        home_embeddings: list[np.ndarray],
        method: str | None = None,
    ) -> list[float]:
        """Calculate similarities between user and multiple homes."""
        method = method or self.default_method

        if method == "cosine":
            return batch_cosine_similarity(user_embedding, home_embeddings)
        else:
            return [
                self.calculate(user_embedding, home_emb, method) for home_emb in home_embeddings
            ]
