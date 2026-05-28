import os
import sys

from celery import Celery
from celery.schedules import crontab
from celery.signals import worker_process_init, worker_process_shutdown
from dotenv import load_dotenv

from app.config import Config

# Initialize centralized logger
server_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)
from logger import (  # noqa: E402 -- logger requires Server on sys.path when run outside app context
    LOG_CATEGORIES,
    log,
)

# Load environment variables from .env file
load_dotenv()

# Create Celery instance with basic configuration
# Flask app will be initialized lazily to avoid circular imports
celery = Celery("silverkey")

# Configure Celery with config values
celery.conf.update(
    {
        "broker_url": Config.CELERY_URL,
        "result_backend": Config.CELERY_URL,
        "task_acks_late": True,
        "worker_prefetch_multiplier": 1,
        "task_reject_on_worker_lost": True,
        "broker_connection_retry_on_startup": True,
        "broker_connection_retry": True,
        "broker_connection_max_retries": 10,
        # Default caps for all tasks (override per-task if needed)
        "task_soft_time_limit": 300,
        "task_time_limit": 360,
        # Fix for macOS Objective-C fork issue - use threads instead of prefork
        "worker_pool": "threads",
        "worker_concurrency": 4,  # Number of threads
        # Celery Beat schedule for periodic tasks
        "beat_schedule": {
            "train-all-user-weights-daily": {
                "task": "tasks.train_all_eligible_users_task",
                "schedule": crontab(
                    hour="2", minute="0"
                ),  # Run daily at 2:00 AM (str for type stub)
                "kwargs": {"limit": 100},  # Process up to 100 users per run
            },
        },
        "timezone": "UTC",
    }
)


# Context-aware Celery task base with robust database handling
class ContextTask(celery.Task):
    def __call__(self, *args, **kwargs):
        # Lazy import to avoid circular dependency
        import time

        from sqlalchemy.exc import DisconnectionError, OperationalError

        from app import create_app, db

        # Create Flask app context lazily
        flask_app = create_app()
        with flask_app.app_context():
            max_retries = 3
            retry_delay = 1  # Start with 1 second delay

            for attempt in range(max_retries):
                try:
                    # Test connection before running task
                    with db.engine.connect() as conn:
                        conn.execute(db.text("SELECT 1"))
                    return self.run(*args, **kwargs)

                except (OperationalError, DisconnectionError):
                    # Clean up the session
                    try:
                        db.session.rollback()
                    except Exception:
                        pass

                    try:
                        db.session.remove()
                    except Exception:
                        pass

                    # Dispose of the engine connection pool to force reconnection
                    try:
                        db.engine.dispose()
                    except Exception:
                        pass

                    if attempt < max_retries - 1:
                        log.warn(
                            LOG_CATEGORIES["API"],
                            f"Database connection retry in {retry_delay} seconds",
                            {"attempt": attempt + 1, "max_retries": max_retries},
                        )
                        time.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                    else:
                        log.error(
                            LOG_CATEGORIES["ERRORS"],
                            "Max database connection retries exceeded, failing task",
                            {"max_retries": max_retries},
                        )
                        raise

                except Exception as e:
                    log.error(LOG_CATEGORIES["ERRORS"], "Non-connection error in Celery task", e)
                    try:
                        db.session.rollback()
                    except Exception:
                        pass
                    raise

                finally:
                    # Always clean up the session
                    try:
                        db.session.remove()
                    except Exception:
                        pass


# Set the custom task base
celery.Task = ContextTask


# Optional lifecycle logging
@worker_process_init.connect
def worker_started(**_):
    from logger.posthog_otlp import init_posthog_otlp

    init_posthog_otlp("silverkey-celery")
    log.info(LOG_CATEGORIES["API"], "Celery worker process started")


@worker_process_shutdown.connect
def worker_stopped(**_):
    log.info(LOG_CATEGORIES["API"], "Celery worker process shutting down")


# Register all tasks (import side effects register @celery.task definitions)
import app.celery.tasks  # noqa: F401, E402
