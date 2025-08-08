from celery import Celery
from celery.signals import worker_process_init, worker_process_shutdown
import socket
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Create Celery instance with basic configuration
# Flask app will be initialized lazily to avoid circular imports
celery = Celery('silverkey')

# Configure Celery with environment variables directly
celery.conf.update({
    "broker_url": os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    "result_backend": os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
    "task_acks_late": True,
    "worker_prefetch_multiplier": 1,
    "task_reject_on_worker_lost": True,
    "broker_connection_retry_on_startup": True,
    "broker_connection_retry": True,
    "broker_connection_max_retries": 10,
    # Fix for macOS Objective-C fork issue - use threads instead of prefork
    "worker_pool": "threads",
    "worker_concurrency": 4,  # Number of threads
})

# Context-aware Celery task base with robust database handling
class ContextTask(celery.Task):
    def __call__(self, *args, **kwargs):
        # Lazy import to avoid circular dependency
        from app import create_app, db
        from sqlalchemy.exc import OperationalError, DisconnectionError
        import time
        
        # Create Flask app context lazily
        flask_app = create_app()
        with flask_app.app_context():
            max_retries = 3
            retry_delay = 1  # Start with 1 second delay
            
            for attempt in range(max_retries):
                try:
                    # Test connection before running task
                    with db.engine.connect() as conn:
                        conn.execute(db.text('SELECT 1'))
                    return self.run(*args, **kwargs)
                    
                except (OperationalError, DisconnectionError) as e:
                    print(f"🔄 Database connection error on attempt {attempt + 1}/{max_retries}: {str(e)}")
                    
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
                        print(f"⏳ Retrying in {retry_delay} seconds...")
                        time.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                    else:
                        print("❌ Max retries exceeded, failing task")
                        raise
                        
                except Exception as e:
                    print(f"❌ Non-connection error in Celery task: {str(e)}")
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
    print(" Celery worker process started")

@worker_process_shutdown.connect
def worker_stopped(**_):
    print(" Celery worker process shutting down")

# Register all tasks
import app.celery.tasks
