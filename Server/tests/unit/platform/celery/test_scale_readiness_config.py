"""Verify Celery scale-readiness configuration (queues, beat, env-driven pool)."""

from __future__ import annotations

import pytest

from app.celery.celery_worker import celery
from app.celery.tasks.docusign import (
    fetch_completed_documents_task,
    process_webhook_task,
    send_envelope_task,
    sync_templates_task,
)
from app.celery.tasks.property_research import compare_property_task, research_property_task
from app.celery.tasks.weight_training import (
    train_all_eligible_users_task,
    train_user_weights_task,
)


class TestCeleryTaskRoutes:
    @pytest.mark.parametrize(
        ("task_name", "expected_queue"),
        [
            ("tasks.research_property_task", "heavy"),
            ("tasks.compare_property_task", "heavy"),
            ("tasks.train_user_weights_task", "heavy"),
            ("tasks.train_all_eligible_users_task", "heavy"),
            ("docusign.send_envelope", "docusign"),
            ("docusign.fetch_completed_documents", "docusign"),
            ("docusign.process_webhook", "default"),
            ("docusign.sync_templates", "default"),
        ],
    )
    def test_task_routes_match_plan(self, task_name, expected_queue):
        route = celery.conf.task_routes[task_name]
        assert route["queue"] == expected_queue

    @pytest.mark.parametrize(
        ("task", "expected_queue"),
        [
            (research_property_task, "heavy"),
            (compare_property_task, "heavy"),
            (train_user_weights_task, "heavy"),
            (train_all_eligible_users_task, "heavy"),
            (send_envelope_task, "docusign"),
            (fetch_completed_documents_task, "docusign"),
            (process_webhook_task, "default"),
            (sync_templates_task, "default"),
        ],
    )
    def test_task_decorator_queue_matches_routes(self, task, expected_queue):
        assert task.queue == expected_queue


class TestCeleryBeatSchedule:
    def test_daily_weight_training_schedule_exists(self):
        schedule = celery.conf.beat_schedule
        assert "train-all-user-weights-daily" in schedule
        entry = schedule["train-all-user-weights-daily"]
        assert entry["task"] == "tasks.train_all_eligible_users_task"
        assert entry["kwargs"] == {"limit": 100}
