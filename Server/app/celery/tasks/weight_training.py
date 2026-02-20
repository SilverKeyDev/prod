from flask import current_app

from app.celery.celery_worker import celery


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

        from ...home_matching.postprocessing.weight_training_job import weight_training_job

        self.update_state(
            state="PROGRESS", meta={"status": "Extracting training data", "progress": 30}
        )

        result = weight_training_job.train_user_weights(user_id, force)

        self.update_state(state="PROGRESS", meta={"status": "Training complete", "progress": 100})

        current_app.logger.info(
            f"[WEIGHT_TRAINING] ✅ Trained weights for user {user_id}: "
            f"success={result.get('success')}"
        )

        return result

    except Exception as e:
        current_app.logger.error(
            f"[WEIGHT_TRAINING] Task error for user {user_id}: {e}", exc_info=True
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

        from ...home_matching.postprocessing.weight_training_job import weight_training_job

        self.update_state(state="PROGRESS", meta={"status": "Processing users", "progress": 30})

        result = weight_training_job.train_all_eligible_users(limit)

        self.update_state(
            state="PROGRESS", meta={"status": "Batch training complete", "progress": 100}
        )

        current_app.logger.info(
            f"[WEIGHT_TRAINING] ✅ Batch training complete: "
            f"trained={result.get('trained', 0)}, "
            f"skipped={result.get('skipped', 0)}, "
            f"failed={result.get('failed', 0)}"
        )

        return result

    except Exception as e:
        current_app.logger.error(f"[WEIGHT_TRAINING] Batch training task error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "total_users": 0,
            "trained": 0,
            "skipped": 0,
            "failed": 0,
        }
