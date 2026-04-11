"""Match scoring and research preferences context management."""

from .match_score_pros_cons_counts import (
    highlights_context_payload,
    resolve_highlights_counts_and_signature,
)
from .research_preferences_context import (
    ResearchAnalysisOptions,
    analysis_cache_signature_matches,
    attach_analysis_cache_meta,
    build_research_analysis_options,
    public_property_analysis,
)

__all__ = [
    "analysis_cache_signature_matches",
    "highlights_context_payload",
    "resolve_highlights_counts_and_signature",
    "ResearchAnalysisOptions",
    "attach_analysis_cache_meta",
    "build_research_analysis_options",
    "public_property_analysis",
]
