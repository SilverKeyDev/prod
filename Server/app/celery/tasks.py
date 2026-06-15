"""
Celery tasks module.

This module maintains backward compatibility by importing all tasks from the
new organized structure in the tasks/ subdirectory.

Tasks are now organized into separate files:
- tasks/property_research.py: Property research and comparison tasks
- tasks/weight_training.py: Weight training tasks
"""

# Import all tasks from the organized structure
from .tasks import (
    compare_property_task,
    research_property_task,
    train_all_eligible_users_task,
    train_user_weights_task,
)

# Export all tasks for backward compatibility
__all__ = [
    "research_property_task",
    "compare_property_task",
    "train_user_weights_task",
    "train_all_eligible_users_task",
]
