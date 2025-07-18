from app.celery.celery_worker import celery
from flask import current_app

@celery.task(name="tasks.example_task")
def example_task():
    print(f"Secret key is: {current_app.config['SECRET_KEY']}")
    return "Done"
