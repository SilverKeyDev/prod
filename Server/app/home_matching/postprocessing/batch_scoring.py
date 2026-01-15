"""
Batch scoring helpers for ensemble scoring.
"""
from typing import Dict, List, Any, Union, Optional
import logging
import time

logger = logging.getLogger(__name__)


def get_embedding_scores_batch(
    embedding_scorer,
    user_data: Dict[str, Any],
    homes_data: List[Dict[str, Any]]
) -> List[float]:
    """Get embedding scores for multiple homes."""
    try:
        scored_homes = embedding_scorer.score_user_against_homes(user_data, homes_data)
        return [score for _, score in scored_homes]
    except Exception as e:
        logger.error(f"Batch embedding scoring failed: {e}")
        return [0.0] * len(homes_data)


def get_llm_scores_batch(
    llm_scorer,
    user_data: Dict[str, Any],
    homes_data: List[Dict[str, Any]],
    include_explanations: bool = False
) -> List[Union[float, Dict[str, Any]]]:
    """Get LLM scores for multiple homes."""
    try:
        if include_explanations:
            # Get detailed explanations (slower)
            scored_results = llm_scorer.score_user_against_homes(user_data, homes_data)
            return [explanation for _, _, explanation in scored_results]
        else:
            # Get just scores (faster)
            return llm_scorer.batch_score_homes(user_data, homes_data)
    except Exception as e:
        logger.error(f"Batch LLM scoring failed: {e}")
        if include_explanations:
            return [{'score': 0.0, 'error': str(e)}] * len(homes_data)
        else:
            return [0.0] * len(homes_data)


def score_home_batch(
    user_data: Dict[str, Any],
    batch_start_idx: int,
    batch_homes: List[Dict[str, Any]],
    embedding_scorer,
    llm_scorer,
    blend_scores_func,
    include_explanations: bool = False,
    request_id: Optional[str] = None,
    embedding_provider: Optional[str] = None,
    embedding_model: Optional[str] = None,
    llm_provider: Optional[str] = None,
    llm_model: Optional[str] = None,
    weights: Optional[Dict[str, float]] = None,
    candidate_set_size: Optional[int] = None,
    experiment_key: Optional[str] = None,
    experiment_variant: Optional[str] = None,
    session_id: Optional[str] = None,
    track_to_db: bool = True
) -> List[Dict[str, Any]]:
    """Score a batch of homes concurrently."""
    batch_start_time = time.time()
    try:
        # Get scores for this batch using existing batch methods
        embedding_scores = get_embedding_scores_batch(embedding_scorer, user_data, batch_homes)
        llm_scores = get_llm_scores_batch(llm_scorer, user_data, batch_homes, include_explanations)
        
        # Combine scores for each home in the batch
        batch_results = []
        for i, home_data in enumerate(batch_homes):
            home_start_time = time.time()
            try:
                original_idx = batch_start_idx + i
                embedding_score = embedding_scores[i] if i < len(embedding_scores) else 0.0
                
                if include_explanations and isinstance(llm_scores[i], dict):
                    llm_score = llm_scores[i].get('score', 0.0)
                    llm_explanation = llm_scores[i]
                else:
                    llm_score = llm_scores[i] if i < len(llm_scores) else 0.0
                    llm_explanation = None
                
                # Blend scores
                final_score = blend_scores_func(embedding_score, llm_score)
                
                # Calculate latency for this home
                latency_ms = int((time.time() - home_start_time) * 1000)
                
                # Get home_id with proper None handling - use fallback if None or missing
                home_id = home_data.get('home_id') or f'home_{original_idx}'
                
                result = {
                    'home_data': home_data,
                    'home_id': home_id,
                    'scores': {
                        'embedding': embedding_score,
                        'llm': llm_score
                    },
                    'final_score': final_score,
                    'rank': 0  # Will be set after sorting
                }
                
                if llm_explanation:
                    result['llm_explanation'] = llm_explanation
                
                # Track to database if requested
                # Only track if home_id is valid (not None and not empty)
                if track_to_db and request_id and home_id and home_id != f'home_{original_idx}':
                    try:
                        _track_batch_scoring_event(
                            request_id=request_id,
                            user_id=user_data.get('user_id', 'unknown'),
                            home_id=home_id,
                            embedding_score=embedding_score,
                            llm_score=llm_score,
                            final_score=final_score,
                            embedding_provider=embedding_provider,
                            embedding_model=embedding_model,
                            llm_provider=llm_provider,
                            llm_model=llm_model,
                            weights=weights,
                            candidate_set_size=candidate_set_size,
                            latency_ms=latency_ms,
                            experiment_key=experiment_key,
                            experiment_variant=experiment_variant,
                            session_id=session_id
                        )
                    except Exception as e:
                        logger.warning(f"Failed to track batch scoring event to DB: {e}")
                
                batch_results.append(result)
                
            except Exception as e:
                logger.error(f"Error scoring home {batch_start_idx + i}: {e}")
                # Get home_id with proper None handling
                home_id = home_data.get('home_id') or f'home_{batch_start_idx + i}'
                batch_results.append({
                    'home_data': home_data,
                    'home_id': home_id,
                    'final_score': 0.0,
                    'error': str(e)
                })
        
        return batch_results
        
    except Exception as e:
        logger.error(f"Error processing batch starting at index {batch_start_idx}: {e}")
        # Return error results for all homes in the batch
        error_results = []
        for i, home_data in enumerate(batch_homes):
            # Get home_id with proper None handling
            home_id = home_data.get('home_id') or f'home_{batch_start_idx + i}'
            error_results.append({
                'home_data': home_data,
                'home_id': home_id,
                'final_score': 0.0,
                'error': str(e)
            })
        return error_results


def _track_batch_scoring_event(
    request_id: str,
    user_id: str,
    home_id: str,
    embedding_score: float,
    llm_score: float,
    final_score: float,
    embedding_provider: Optional[str] = None,
    embedding_model: Optional[str] = None,
    llm_provider: Optional[str] = None,
    llm_model: Optional[str] = None,
    weights: Optional[Dict[str, float]] = None,
    candidate_set_size: Optional[int] = None,
    latency_ms: Optional[int] = None,
    experiment_key: Optional[str] = None,
    experiment_variant: Optional[str] = None,
    session_id: Optional[str] = None
) -> None:
    """Track a batch scoring event to the database."""
    # Skip tracking if home_id is None or empty (required by database)
    if not home_id:
        logger.debug(f"Skipping batch scoring event tracking: home_id is None or empty")
        return
    
    try:
        from flask import has_app_context
        from app.models import ScoringResultsTracker
        from app import db, create_app
        
        # Ensure we have an application context
        # This is needed when called from worker threads that don't inherit the context
        if not has_app_context():
            app = create_app()
            app_context = app.app_context()
            app_context.push()
            try:
                _track_batch_scoring_event_internal(
                    request_id, user_id, home_id, embedding_score, llm_score,
                    final_score, embedding_provider, embedding_model, llm_provider,
                    llm_model, weights, candidate_set_size, latency_ms,
                    experiment_key, experiment_variant, session_id
                )
            finally:
                app_context.pop()
        else:
            # We already have an app context, use it directly
            _track_batch_scoring_event_internal(
                request_id, user_id, home_id, embedding_score, llm_score,
                final_score, embedding_provider, embedding_model, llm_provider,
                llm_model, weights, candidate_set_size, latency_ms,
                experiment_key, experiment_variant, session_id
            )
        
    except Exception as e:
        logger.error(f"Error tracking batch scoring event: {e}", exc_info=True)
        # Rollback on error
        try:
            from flask import has_app_context
            from app import db
            if has_app_context():
                db.session.rollback()
        except:
            pass


def _track_batch_scoring_event_internal(
    request_id: str,
    user_id: str,
    home_id: str,
    embedding_score: float,
    llm_score: float,
    final_score: float,
    embedding_provider: Optional[str] = None,
    embedding_model: Optional[str] = None,
    llm_provider: Optional[str] = None,
    llm_model: Optional[str] = None,
    weights: Optional[Dict[str, float]] = None,
    candidate_set_size: Optional[int] = None,
    latency_ms: Optional[int] = None,
    experiment_key: Optional[str] = None,
    experiment_variant: Optional[str] = None,
    session_id: Optional[str] = None
) -> None:
    """Internal helper to track a batch scoring event (assumes app context exists)."""
    from app.models import ScoringResultsTracker
    from app import db
    
    # Validate required fields - home_id cannot be None or empty (database constraint)
    if not home_id:
        logger.warning(f"Skipping batch scoring event tracking: home_id is None or empty (request_id={request_id}, user_id={user_id})")
        return
    
    # Get embedding model name if not provided
    embedding_model_name = embedding_model
    if not embedding_model_name and embedding_provider:
        try:
            from ..embeddings.model_loader import model_loader
            model_info = model_loader.get_model_info(embedding_provider, embedding_model)
            embedding_model_name = model_info.get('model_name', embedding_model)
        except:
            embedding_model_name = embedding_model
    
    event = ScoringResultsTracker.create_from_scoring_result(
        request_id=request_id,
        user_id=user_id,
        home_id=home_id,
        embedding_score=embedding_score,
        llm_score=llm_score,
        final_score=final_score,
        embedding_model=embedding_model_name,
        embedding_provider=embedding_provider,
        llm_model=llm_model,
        llm_provider=llm_provider,
        prompt_version=None,
        weights=weights,
        rank_position=None,  # Will be updated after sorting
        candidate_set_size=candidate_set_size,
        latency_ms=latency_ms,
        experiment_key=experiment_key,
        experiment_variant=experiment_variant,
        session_id=session_id
    )
    
    db.session.add(event)
    db.session.commit()
