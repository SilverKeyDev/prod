"""
Main entry point for home matching system.
"""

from typing import Dict, List, Any, Optional, Union
import logging

from ..postprocessing.blend_scores import EnsembleScorer
from .settings import DEFAULT_TOP_K
from ..utils.io import load_multiple_homes, load_user_data

logger = logging.getLogger(__name__)

def find_best_matches(
    user_data: Dict[str, Any],
    homes_data: List[Dict[str, Any]],
    top_k: int = None,
    include_explanations: bool = False,
    method_weights: Optional[Dict[str, float]] = None,
    embedding_provider: str = "sentence_transformer",
    llm_provider: str = "openai",
    request_id: Optional[str] = None,
    experiment_key: Optional[str] = None,
    experiment_variant: Optional[str] = None,
    session_id: Optional[str] = None,
    track_to_db: bool = True
) -> List[Dict[str, Any]]:
    """
    Find the best home matches for a user.
    
    Args:
        user_data: User preferences and profile data
        homes_data: List of home listings to match against
        top_k: Number of top matches to return (default: 10)
        include_explanations: Whether to include LLM explanations (slower)
        method_weights: Custom weights for ensemble methods
        embedding_provider: Embedding model provider ("sentence_transformer" or "openai")
        llm_provider: LLM provider ("openai")
        request_id: Request ID for tracking scoring events
        experiment_key: Experiment key for A/B testing
        experiment_variant: Experiment variant (A/B)
        session_id: Session ID for tracking
        track_to_db: Whether to track scoring events to database
    
    Returns:
        List of top-k home matches with scores and explanations
    """
    try:
        top_k = top_k or DEFAULT_TOP_K
        
        # Extract user_id from user_data for learned weight retrieval
        user_id = user_data.get('user_id')
        
        # Initialize ensemble scorer with custom weights if provided
        if method_weights:
            ensemble = EnsembleScorer(
                embedding_weight=method_weights.get('embedding', 0.5),
                llm_weight=method_weights.get('llm', 0.5),
                embedding_provider=embedding_provider,
                llm_provider=llm_provider,
                user_id=user_id,
                use_learned_weights=(method_weights is None)  # Only use learned weights if no explicit weights provided
            )
        else:
            ensemble = EnsembleScorer(
                embedding_provider=embedding_provider,
                llm_provider=llm_provider,
                user_id=user_id,
                use_learned_weights=True
            )
        
        # Get ranked matches
        matches = ensemble.rank_homes_for_user(
            user_data, 
            homes_data, 
            top_k=top_k,
            include_explanations=include_explanations,
            request_id=request_id,
            experiment_key=experiment_key,
            experiment_variant=experiment_variant,
            session_id=session_id,
            track_to_db=track_to_db
        )
        

        return matches
        
    except Exception as e:
        logger.error(f"Error finding best matches: {e}")
        return []

def score_single_match(
    user_data: Dict[str, Any],
    home_data: Dict[str, Any],
    include_explanations: bool = True,
    method_weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Score a single user-home pair.
    
    Args:
        user_data: User preferences and profile data
        home_data: Home listing data
        include_explanations: Whether to include detailed explanations
        method_weights: Custom weights for ensemble methods
    
    Returns:
        Detailed scoring result with individual method scores and explanations
    """
    try:
        # Extract user_id from user_data for learned weight retrieval
        user_id = user_data.get('user_id')
        
        # Initialize ensemble scorer
        if method_weights:
            ensemble = EnsembleScorer(
                embedding_weight=method_weights.get('embedding', 0.5),
                llm_weight=method_weights.get('llm', 0.5),
                user_id=user_id,
                use_learned_weights=(method_weights is None)
            )
        else:
            ensemble = EnsembleScorer(
                user_id=user_id,
                use_learned_weights=True
            )
        
        # Score the pair
        result = ensemble.score_user_home_pair(
            user_data, 
            home_data, 
            include_explanations=include_explanations
        )
        

        return result
        
    except Exception as e:
        logger.error(f"Error scoring single match: {e}")
        return {
            'user_id': user_data.get('user_id', 'unknown'),
            'home_id': home_data.get('home_id', 'unknown'),
            'final_score': 0.0,
            'error': str(e)
        }

def compare_homes_for_user(
    user_data: Dict[str, Any],
    homes_data: List[Dict[str, Any]],
    include_method_comparison: bool = False
) -> Dict[str, Any]:
    """
    Compare multiple homes for a user with detailed analysis.
    
    Args:
        user_data: User preferences and profile data
        homes_data: List of home listings to compare
        include_method_comparison: Whether to include comparison of scoring methods
    
    Returns:
        Comprehensive comparison results
    """
    try:
        ensemble = EnsembleScorer()
        
        # Get LLM-based comparison
        llm_comparison = ensemble.llm_scorer.compare_homes_for_user(user_data, homes_data)
        
        # Get ensemble rankings
        ensemble_rankings = ensemble.rank_homes_for_user(
            user_data, 
            homes_data, 
            top_k=len(homes_data),
            include_explanations=True
        )
        
        result = {
            'user_id': user_data.get('user_id', 'unknown'),
            'total_homes_compared': len(homes_data),
            'llm_comparison': llm_comparison,
            'ensemble_rankings': ensemble_rankings
        }
        
        # Add method comparison if requested
        if include_method_comparison:
            method_comparison = ensemble.compare_scoring_methods(user_data, homes_data)
            result['method_comparison'] = method_comparison
        

        return result
        
    except Exception as e:
        logger.error(f"Error comparing homes: {e}")
        return {
            'user_id': user_data.get('user_id', 'unknown'),
            'error': str(e)
        }

def batch_match_users(
    users_data: List[Dict[str, Any]],
    homes_data: List[Dict[str, Any]],
    top_k: int = None
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Match multiple users against multiple homes.
    
    Args:
        users_data: List of user preference data
        homes_data: List of home listings
        top_k: Number of top matches per user
    
    Returns:
        Dictionary mapping user_id to their top matches
    """
    try:
        top_k = top_k or DEFAULT_TOP_K
        results = {}
        
        ensemble = EnsembleScorer()
        
        for user_data in users_data:
            user_id = user_data.get('user_id', 'unknown')
            
            try:
                matches = ensemble.rank_homes_for_user(
                    user_data, 
                    homes_data, 
                    top_k=top_k,
                    include_explanations=False  # Faster for batch processing
                )
                results[user_id] = matches
                
            except Exception as e:
                logger.error(f"Error matching user {user_id}: {e}")
                results[user_id] = []
        

        return results
        
    except Exception as e:
        logger.error(f"Error in batch matching: {e}")
        return {}

def load_and_match(
    user_file_path: str,
    homes_directory: str,
    top_k: int = None,
    include_explanations: bool = False
) -> List[Dict[str, Any]]:
    """
    Load user and homes data from files and find matches.
    
    Args:
        user_file_path: Path to user JSON file
        homes_directory: Directory containing home JSON files
        top_k: Number of top matches to return
        include_explanations: Whether to include explanations
    
    Returns:
        List of top matches
    """
    try:
        # Load data
        user_data = load_user_data(user_file_path)
        homes_data = load_multiple_homes(homes_directory)
        
        if not homes_data:
            logger.warning("No homes loaded from directory")
            return []
        
        # Find matches
        matches = find_best_matches(
            user_data,
            homes_data,
            top_k=top_k,
            include_explanations=include_explanations
        )
        
        return matches
        
    except Exception as e:
        logger.error(f"Error loading and matching: {e}")
        return []

def get_system_info() -> Dict[str, Any]:
    """Get information about the matching system."""
    try:
        ensemble = EnsembleScorer()
        
        info = {
            'system_name': 'SilverKey Home Matching System',
            'version': '1.0.0',
            'ensemble_weights': {
                'embedding': ensemble.embedding_weight,
                'llm': ensemble.llm_weight
            },
            'components': {
                'embedding_scorer': ensemble.embedding_scorer.__class__.__name__,
                'llm_scorer': ensemble.llm_scorer.__class__.__name__
            },
            'default_top_k': DEFAULT_TOP_K
        }
        
        # Add component-specific info
        try:
            info['embedding_info'] = {
                'dimension': ensemble.embedding_scorer.user_encoder.get_embedding_dimension()
            }
        except:
            info['embedding_info'] = {'status': 'not available'}
        
        try:
            info['llm_info'] = ensemble.llm_scorer.get_scorer_info()
        except:
            info['llm_info'] = {'status': 'not available'}
        
        return info
        
    except Exception as e:
        logger.error(f"Error getting system info: {e}")
        return {'error': str(e)}

# Main execution for testing
if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # Note: Use real data from database via preprocessing module instead of sample data
    print("Testing Home Matching System...")
    print("Note: Use real data from database via preprocessing module for testing")
    
    # Get system info
    info = get_system_info()
    print(f"System info: {info.get('system_name', 'Unknown')}")
    
    print("Testing completed successfully!")
