from app.celery.celery_worker import celery
from flask import current_app

@celery.task
def example_task():
    # Example: using Flask context
    print(f"Secret key is: {current_app.config['SECRET_KEY']}")
    return "Done"
