"""
Celery tasks module.

This module imports all task definitions to ensure they are registered with Celery.
Tasks are organized into separate files by category:
- home_matching: Home matching related tasks
- property_research: Property research and comparison tasks
- weight_training: Weight training tasks
- docusign: DocuSign operations
"""

# Import all tasks to ensure they are registered with Celery
from .home_matching import find_best_matches_task
from .property_research import compare_property_task, research_property_task
from .weight_training import train_all_eligible_users_task, train_user_weights_task

# Try to import docusign tasks (optional dependency)
try:
    from .docusign import (
        fetch_completed_documents_task,
        process_webhook_task,
        send_envelope_task,
        sync_templates_task,
    )

    _docusign_available = True
except ImportError as e:
    # DocuSign SDK not installed - tasks will not be available
    import warnings

    # Type stub may not expose UserWarning; use getattr for Pyright
    user_warning = getattr(warnings, "UserWarning", type("UserWarning", (Warning,), {}))
    warnings.warn(
        f"DocuSign tasks not available: {e}",
        user_warning,
        stacklevel=2,
    )
    _docusign_available = False
    send_envelope_task = None
    process_webhook_task = None
    fetch_completed_documents_task = None
    sync_templates_task = None

# Export all tasks for backward compatibility
__all__ = [
    "find_best_matches_task",
    "research_property_task",
    "compare_property_task",
    "train_user_weights_task",
    "train_all_eligible_users_task",
]

if _docusign_available:
    __all__.extend(
        [
            "send_envelope_task",
            "process_webhook_task",
            "fetch_completed_documents_task",
            "sync_templates_task",
        ]
    )
