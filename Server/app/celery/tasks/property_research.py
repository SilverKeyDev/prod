from app.celery.celery_worker import celery
from flask import current_app
import os
import time


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
        from ...services.research.property_research_pipeline import handle_property_request_non_streaming
        
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
        from ...services.research.property_research_pipeline import handle_property_request_non_streaming
        
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
