"""
Celery tasks module.

This module maintains backward compatibility by importing all tasks from the
new organized structure in the tasks/ subdirectory.

Tasks are now organized into separate files:
- tasks/home_matching.py: Home matching related tasks
- tasks/property_research.py: Property research and comparison tasks
- tasks/weight_training.py: Weight training tasks
"""

# Import all tasks from the organized structure
from .tasks import (
    find_best_matches_task,
    research_property_task,
    compare_property_task,
    train_user_weights_task,
    train_all_eligible_users_task,
)

# Export all tasks for backward compatibility
__all__ = [
    'find_best_matches_task',
    'research_property_task',
    'compare_property_task',
    'train_user_weights_task',
    'train_all_eligible_users_task',
]