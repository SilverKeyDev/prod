import os
import time
import traceback
import uuid

from app.celery.celery_worker import celery
from logger import log


# Property Research Tasks
@celery.task(name="tasks.research_property_task", bind=True, queue="heavy")
def research_property_task(self, params, address=None, skip_pros_cons=False, research_body=None):
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
        SLIPSTREAM_PRIVATE = os.getenv("SLIPSTREAM_PRIVATE")
        if not GOOGLE_MAPS_API_KEY or not SLIPSTREAM_PRIVATE:
            missing = []
            if not GOOGLE_MAPS_API_KEY:
                missing.append("GOOGLE_MAPS_API_KEY")
            if not SLIPSTREAM_PRIVATE:
                missing.append("SLIPSTREAM_PRIVATE")
            return {
                "success": False,
                "error": f"Missing required env: {', '.join(missing)}",
                "response_data": {
                    "success": False,
                    "error": "CONFIG_ERROR",
                    "message": f"Set {', '.join(missing)} in environment",
                },
                "status_code": 503,
            }

        self.update_state(
            state="PROGRESS", meta={"status": "Initializing property research", "progress": 5}
        )

        from ...services.research.property.property_research_pipeline import (
            handle_property_request_non_streaming,
        )

        self.update_state(
            state="PROGRESS", meta={"status": "Processing property data", "progress": 30}
        )

        response_data, status_code = handle_property_request_non_streaming(
            params=params,
            address=address,
            google_maps_api_key=GOOGLE_MAPS_API_KEY,
            start_time=start_time,
            log_prefix="[PROPERTY]",
            skip_pros_cons=skip_pros_cons,
            research_body=research_body,
        )

        self.update_state(state="PROGRESS", meta={"status": "Finalizing results", "progress": 95})

        elapsed = time.time() - start_time
        log.info(
            "API",
            "Property research Celery task completed",
            {"elapsed_seconds": round(elapsed, 2)},
        )

        return {
            "success": True,
            "response_data": response_data,
            "status_code": status_code,
            "elapsed_time": elapsed,
        }

    except Exception as e:
        error_id = str(uuid.uuid4())
        log.error(
            "ERRORS",
            "Property research Celery task failed",
            {
                "error_id": error_id,
                "error": str(e),
                "traceback": traceback.format_exc(),
                "params": {k: v for k, v in (params or {}).items() if k != "api_key"},
                "address": address,
            },
        )
        return {
            "success": False,
            "error": str(e),
            "error_id": error_id,
            "response_data": {
                "success": False,
                "error": "TASK_ERROR",
                "message": str(e),
                "error_id": error_id,
            },
            "status_code": 500,
        }


@celery.task(name="tasks.compare_property_task", bind=True, queue="heavy")
def compare_property_task(self, params, address=None, research_body=None):
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
        SLIPSTREAM_PRIVATE = os.getenv("SLIPSTREAM_PRIVATE")
        if not GOOGLE_MAPS_API_KEY or not SLIPSTREAM_PRIVATE:
            missing = []
            if not GOOGLE_MAPS_API_KEY:
                missing.append("GOOGLE_MAPS_API_KEY")
            if not SLIPSTREAM_PRIVATE:
                missing.append("SLIPSTREAM_PRIVATE")
            return {
                "success": False,
                "error": f"Missing required env: {', '.join(missing)}",
                "response_data": {
                    "success": False,
                    "error": "CONFIG_ERROR",
                    "message": f"Set {', '.join(missing)} in environment",
                },
                "status_code": 503,
            }

        self.update_state(
            state="PROGRESS", meta={"status": "Initializing property comparison", "progress": 5}
        )

        from ...services.research.property.property_research_pipeline import (
            handle_property_request_non_streaming,
        )

        self.update_state(
            state="PROGRESS", meta={"status": "Processing property data", "progress": 30}
        )

        response_data, status_code = handle_property_request_non_streaming(
            params=params,
            address=address,
            google_maps_api_key=GOOGLE_MAPS_API_KEY,
            start_time=start_time,
            log_prefix="[COMPARE]",
            skip_pros_cons=True,
            research_body=research_body,
        )

        self.update_state(state="PROGRESS", meta={"status": "Finalizing results", "progress": 95})

        elapsed = time.time() - start_time
        log.info(
            "API",
            "Property compare Celery task completed",
            {"elapsed_seconds": round(elapsed, 2)},
        )

        return {
            "success": True,
            "response_data": response_data,
            "status_code": status_code,
            "elapsed_time": elapsed,
        }

    except Exception as e:
        error_id = str(uuid.uuid4())
        log.error(
            "ERRORS",
            "Property compare Celery task failed",
            {
                "error_id": error_id,
                "error": str(e),
                "traceback": traceback.format_exc(),
                "params": {k: v for k, v in (params or {}).items() if k != "api_key"},
                "address": address,
            },
        )
        return {
            "success": False,
            "error": str(e),
            "error_id": error_id,
            "response_data": {
                "success": False,
                "error": "TASK_ERROR",
                "message": str(e),
                "error_id": error_id,
            },
            "status_code": 500,
        }
