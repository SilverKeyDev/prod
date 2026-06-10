"""Unit tests for DocuSign Celery tasks."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from flask import Flask

from app.celery.tasks.docusign import send_envelope_task


def _task_request() -> MagicMock:
    task = MagicMock()
    task.request.retries = 0
    task.max_retries = 3
    return task


def test_send_envelope_task_returns_error_when_agreement_missing(app: Flask) -> None:
    task = _task_request()
    with app.app_context():
        with patch("app.celery.tasks.docusign.get_model", return_value=None):
            result = send_envelope_task.run(task, "missing-agreement", "embedded", "actor-1")
    assert result == {"success": False, "error": "Agreement not found"}


def test_send_envelope_task_auth_error_does_not_retry(app: Flask) -> None:
    from app.services.docusign.errors import DocusignAuthError

    agreement = MagicMock()
    agreement.docusign_source_template_id = None
    task = _task_request()

    with app.app_context():
        with patch("app.celery.tasks.docusign.get_model", return_value=agreement):
            with patch(
                "app.celery.tasks.docusign.EnvelopeBuilder",
                side_effect=DocusignAuthError("invalid jwt"),
            ):
                with patch("app.celery.tasks.docusign._record_send_failure_event") as mock_event:
                    result = send_envelope_task.run(task, "agreement-1", "embedded", "actor-1")
    assert result["success"] is False
    assert result["retryable"] is False
    mock_event.assert_called_once()
