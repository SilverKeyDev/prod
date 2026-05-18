"""
Central OpenAI and Perplexity model IDs with optional env overrides.

See Server/.env.example for variable names.
"""

from __future__ import annotations

import os

# --- OpenAI (chat / vision) ---
_DEFAULT_OPENAI_CHAT = "gpt-5.4"
_DEFAULT_OPENAI_MINI = "gpt-5.4-mini"
_DEFAULT_OPENAI_NANO = "gpt-5.4-nano"


def openai_model_chat() -> str:
    return os.getenv("OPENAI_MODEL_CHAT", _DEFAULT_OPENAI_CHAT)


def openai_model_summarize() -> str:
    return os.getenv("OPENAI_MODEL_SUMMARIZE", _DEFAULT_OPENAI_NANO)


def openai_model_action_plan() -> str:
    return os.getenv("OPENAI_MODEL_ACTION_PLAN", _DEFAULT_OPENAI_CHAT)


def openai_model_vision_batch() -> str:
    return os.getenv("OPENAI_MODEL_VISION_BATCH", _DEFAULT_OPENAI_NANO)


def openai_model_text_cleanup() -> str:
    return os.getenv("OPENAI_MODEL_TEXT_CLEANUP", _DEFAULT_OPENAI_MINI)


def openai_model_feature_overlap() -> str:
    return os.getenv("OPENAI_MODEL_FEATURE_OVERLAP", _DEFAULT_OPENAI_MINI)


def openai_chat_token_limit_params(model: str, limit: int) -> dict[str, int]:
    """
    Chat Completions: some models reject ``max_tokens`` and require
    ``max_completion_tokens`` (e.g. GPT-5 family).
    """
    mid = (model or "").strip().lower()
    if mid.startswith(("gpt-5", "o1", "o3", "o4")):
        return {"max_completion_tokens": limit}
    return {"max_tokens": limit}


# --- OpenAI embeddings (default 1536 dims for text-embedding-3-small) ---
_DEFAULT_OPENAI_EMBEDDING = "text-embedding-3-small"


def openai_embedding_model() -> str:
    return os.getenv("OPENAI_EMBEDDING_MODEL", _DEFAULT_OPENAI_EMBEDDING)


# --- Perplexity ---
_DEFAULT_SONAR_PRO = "sonar-pro"
_DEFAULT_SONAR_REASONING = "sonar-reasoning-pro"


def _perplexity_global_fallback() -> str:
    """Legacy PERPLEXITY_MODEL when use-case-specific env is unset."""
    return os.getenv("PERPLEXITY_MODEL", _DEFAULT_SONAR_PRO)


def perplexity_model_analysis() -> str:
    return os.getenv("PERPLEXITY_MODEL_ANALYSIS") or _perplexity_global_fallback()


def perplexity_model_report() -> str:
    # Default sonar-pro (cheaper than sonar-deep-research); override via PERPLEXITY_MODEL_REPORT.
    if os.getenv("PERPLEXITY_MODEL_REPORT"):
        return os.environ["PERPLEXITY_MODEL_REPORT"]
    if os.getenv("PERPLEXITY_MODEL"):
        return os.environ["PERPLEXITY_MODEL"]
    return _DEFAULT_SONAR_PRO


def perplexity_model_negotiation() -> str:
    return os.getenv("PERPLEXITY_MODEL_NEGOTIATION") or _DEFAULT_SONAR_REASONING
