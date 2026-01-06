from app.celery.celery_worker import celery
from flask import current_app
from app.models import PDFDocument, UserPreferences
from app import db
from sqlalchemy.exc import OperationalError, DisconnectionError
import os
import time


# Home Matching Tasks
@celery.task(name="tasks.find_best_matches_task", bind=True)
def find_best_matches_task(self, user_data, homes_data, top_k=10, include_explanations=False, method_weights=None, embedding_provider="sentence_transformer", llm_provider="openai"):
    """
    Celery task to find the best home matches for a user.
    
    Args:
        user_data: User preferences and profile data
        homes_data: List of home listings to match against
        top_k: Number of top matches to return
        include_explanations: Whether to include LLM explanations
        method_weights: Custom weights for ensemble methods
        embedding_provider: Embedding model provider
        llm_provider: LLM provider
    
    Returns:
        List of top-k home matches with scores and explanations
    """
    try:
        
        # Update task progress
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Initializing home matching system', 'progress': 10}
        )
        
        # Import the home matching function
        from ..home_matching.config.match import find_best_matches
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Finding best matches', 'progress': 50}
        )
        
        # Call the home matching function
        matches = find_best_matches(
            user_data=user_data,
            homes_data=homes_data,
            top_k=top_k,
            include_explanations=include_explanations,
            method_weights=method_weights,
            embedding_provider=embedding_provider,
            llm_provider=llm_provider
        )
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Finalizing results', 'progress': 90}
        )
                
        return {
            'success': True,
            'matches': matches,
            'user_id': user_data.get('user_id'),
            'homes_processed': len(homes_data),
            'matches_found': len(matches),
            'top_k': top_k,
            'include_explanations': include_explanations
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'user_id': user_data.get('user_id', 'unknown')
        }


# Property Research Tasks
@celery.task(name="tasks.research_property_task", bind=True)
def research_property_task(self, params, address=None, skip_pros_cons=False):
    """
    Celery task to research a property.
    
    Args:
        params: API parameters dict (zpid, property_url, or address)
        address: Optional address string
        skip_pros_cons: If True, skip pros/cons generation
    
    Returns:
        Dict containing property research data
    """
    try:
        start_time = time.time()
        GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
        RAPI_KEY = os.getenv('RAPIDAPI_KEY')
        
        # Update task progress
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Initializing property research', 'progress': 5}
        )
        
        # Import the research pipeline function
        from ..services.research.property_research_pipeline import handle_property_request_non_streaming
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Processing property data', 'progress': 30}
        )
        
        # Call the research pipeline
        response_data, status_code = handle_property_request_non_streaming(
            params=params,
            address=address,
            google_maps_api_key=GOOGLE_MAPS_API_KEY,
            rapidapi_key=RAPI_KEY,
            start_time=start_time,
            log_prefix="[PROPERTY]",
            skip_pros_cons=skip_pros_cons
        )
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Finalizing results', 'progress': 95}
        )
        
        elapsed = time.time() - start_time
        current_app.logger.info(
            f"[PROPERTY] ✅ Task completed in {elapsed:.2f}s"
        )
        
        return {
            'success': True,
            'response_data': response_data,
            'status_code': status_code,
            'elapsed_time': elapsed
        }
        
    except Exception as e:
        current_app.logger.error(f"[PROPERTY] Task error: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
            'response_data': {
                'success': False,
                'error': 'TASK_ERROR',
                'message': str(e)
            },
            'status_code': 500
        }


@celery.task(name="tasks.compare_property_task", bind=True)
def compare_property_task(self, params, address=None):
    """
    Celery task to compare a property (same as research but skips pros/cons).
    
    Args:
        params: API parameters dict (zpid, property_url, or address)
        address: Optional address string
    
    Returns:
        Dict containing property comparison data
    """
    try:
        start_time = time.time()
        GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
        RAPI_KEY = os.getenv('RAPIDAPI_KEY')
        
        # Update task progress
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Initializing property comparison', 'progress': 5}
        )
        
        # Import the research pipeline function
        from ..services.research.property_research_pipeline import handle_property_request_non_streaming
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Processing property data', 'progress': 30}
        )
        
        # Call the research pipeline with skip_pros_cons=True
        response_data, status_code = handle_property_request_non_streaming(
            params=params,
            address=address,
            google_maps_api_key=GOOGLE_MAPS_API_KEY,
            rapidapi_key=RAPI_KEY,
            start_time=start_time,
            log_prefix="[COMPARE]",
            skip_pros_cons=True
        )
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Finalizing results', 'progress': 95}
        )
        
        elapsed = time.time() - start_time
        current_app.logger.info(
            f"[COMPARE] ✅ Task completed in {elapsed:.2f}s"
        )
        
        return {
            'success': True,
            'response_data': response_data,
            'status_code': status_code,
            'elapsed_time': elapsed
        }
        
    except Exception as e:
        current_app.logger.error(f"[COMPARE] Task error: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
            'response_data': {
                'success': False,
                'error': 'TASK_ERROR',
                'message': str(e)
            },
            'status_code': 500
        }