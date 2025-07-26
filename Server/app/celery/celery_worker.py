from celery import Celery
from app import create_app
from celery.signals import worker_process_init, worker_process_shutdown

# Initialize Flask app
flask_app = create_app()

# Manually extract and map CELERY_* config to lowercase
celery = Celery(
    flask_app.import_name,
    broker=flask_app.config["CELERY_BROKER_URL"],
    backend=flask_app.config["CELERY_RESULT_BACKEND"],
)

# Convert necessary config keys to lowercase expected by Celery
celery.conf.update({
    "broker_url": flask_app.config["CELERY_BROKER_URL"],
    "result_backend": flask_app.config["CELERY_RESULT_BACKEND"],
    "task_acks_late": True,
    "worker_prefetch_multiplier": 1,
    "task_reject_on_worker_lost": True,
    "broker_connection_retry_on_startup": True,
    "broker_connection_retry": True,
    "broker_connection_max_retries": 10,
})

# Context-aware Celery task base
class ContextTask(celery.Task):
    def __call__(self, *args, **kwargs):
        from app import db
        with flask_app.app_context():
            try:
                return self.run(*args, **kwargs)
            except Exception:
                db.session.rollback()
                raise
            finally:
                db.session.remove()

# Set the custom task base
celery.Task = ContextTask

# Optional lifecycle logging
@worker_process_init.connect
def worker_started(**_):
    print("🔄 Celery worker process started")

@worker_process_shutdown.connect
def worker_stopped(**_):
    print("🛑 Celery worker process shutting down")

# Register all tasks
import app.celery.tasks
