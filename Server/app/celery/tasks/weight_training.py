from app.celery.celery_worker import celery
from logger import LOG_CATEGORIES, log


# Weight Training Tasks
@celery.task(name="tasks.train_user_weights_task", bind=True)
def train_user_weights_task(self, user_id: str, force: bool = False):
    """
    Celery task to train weights for a specific user.

    Args:
        user_id: User ID to train weights for
        force: Force retraining even if not needed

    Returns:
        Dictionary with training results
    """
    try:
        self.update_state(
            state="PROGRESS", meta={"status": "Training user weights", "progress": 10}
        )

        from app.services.search.home_matching.postprocessing.weight_training_job import (
            weight_training_job,
        )

        self.update_state(
            state="PROGRESS", meta={"status": "Extracting training data", "progress": 30}
        )

        result = weight_training_job.train_user_weights(user_id, force)

        self.update_state(state="PROGRESS", meta={"status": "Training complete", "progress": 100})

        log.info(
            LOG_CATEGORIES["API"],
            "Weight training Celery task completed for user",
            {"user_id": user_id, "success": result.get("success")},
        )

        return result

    except Exception as e:
        log.error(
            LOG_CATEGORIES["ERRORS"],
            f"Weight training Celery task failed for user {user_id}",
            e,
        )
        return {"success": False, "error": str(e), "user_id": user_id}


@celery.task(name="tasks.train_all_eligible_users_task", bind=True)
def train_all_eligible_users_task(self, limit: int = 100):
    """
    Celery task to train weights for all eligible users.
    This is the main scheduled task that runs periodically.

    Args:
        limit: Maximum number of users to process

    Returns:
        Dictionary with summary statistics
    """
    try:
        self.update_state(
            state="PROGRESS", meta={"status": "Starting batch weight training", "progress": 5}
        )

        from app.services.search.home_matching.postprocessing.weight_training_job import (
            weight_training_job,
        )

        self.update_state(state="PROGRESS", meta={"status": "Processing users", "progress": 30})

        result = weight_training_job.train_all_eligible_users(limit)

        self.update_state(
            state="PROGRESS", meta={"status": "Batch training complete", "progress": 100}
        )

        log.info(
            LOG_CATEGORIES["API"],
            "Batch weight training Celery task completed",
            {
                "trained": result.get("trained", 0),
                "skipped": result.get("skipped", 0),
                "failed": result.get("failed", 0),
            },
        )

        return result

    except Exception as e:
        log.error(LOG_CATEGORIES["ERRORS"], "Batch weight training Celery task failed", e)
        return {
            "success": False,
            "error": str(e),
            "total_users": 0,
            "trained": 0,
            "skipped": 0,
            "failed": 0,
        }
