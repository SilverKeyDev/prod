"""
Celery tasks module.

This module imports all task definitions to ensure they are registered with Celery.
Tasks are organized into separate files by category:
- home_matching: Home matching related tasks
- property_research: Property research and comparison tasks
- weight_training: Weight training tasks
"""

# Import all tasks to ensure they are registered with Celery
from .home_matching import find_best_matches_task
from .property_research import research_property_task, compare_property_task
from .weight_training import train_user_weights_task, train_all_eligible_users_task

# Export all tasks for backward compatibility
__all__ = [
    'find_best_matches_task',
    'research_property_task',
    'compare_property_task',
    'train_user_weights_task',
    'train_all_eligible_users_task',
]
