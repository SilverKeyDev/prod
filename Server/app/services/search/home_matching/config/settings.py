"""
Configuration settings for the home matching system.
"""

import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
SAMPLES_DIR = DATA_DIR / "samples"

# Model paths
# (No tabular model - removed)

# API Keys (from environment variables)
OPENAI_KEY = os.getenv("OPENAI_KEY")
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

# Embedding model settings
EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # sentence-transformers model
EMBEDDING_DIMENSION = 384

# Model settings
RANDOM_STATE = 42

# Scoring thresholds
MIN_SIMILARITY_SCORE = 0.0
MAX_SIMILARITY_SCORE = 1.0
DEFAULT_TOP_K = 10

# Text processing settings
MAX_TEXT_LENGTH = 2000  # Maximum text length for embeddings
STOPWORDS_REMOVE = True

# Logging
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
