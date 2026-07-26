"""
Celery tasks module.

This module imports all task definitions to ensure they are registered with Celery.
Tasks are organized into separate files by category:
- property_research: Property research and comparison tasks
- weight_training: Weight training tasks
"""

# Import all tasks to ensure they are registered with Celery
from .docusign import (
    fetch_completed_documents_task,
    process_webhook_task,
    send_envelope_task,
    sync_templates_task,
)
from .ml_scoring import score_brokerage_ml_insights_task
from .property_research import compare_property_task, research_property_task
from .skyslope import (
    sync_all_brokerages_incremental_task,
    sync_brokerage_transactions_task,
)
from .weight_training import train_all_eligible_users_task, train_user_weights_task

__all__ = [
    "research_property_task",
    "compare_property_task",
    "train_user_weights_task",
    "train_all_eligible_users_task",
    "send_envelope_task",
    "process_webhook_task",
    "fetch_completed_documents_task",
    "sync_templates_task",
    "sync_brokerage_transactions_task",
    "sync_all_brokerages_incremental_task",
    "score_brokerage_ml_insights_task",
]
