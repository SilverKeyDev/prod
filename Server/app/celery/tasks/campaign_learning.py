"""Celery tasks for campaign engagement scoring + learning loop (SIL-309)."""

from app.celery.celery_worker import celery
from logger import log


@celery.task(name="tasks.score_campaign_engagement_task", bind=True, queue="heavy")
def score_campaign_engagement_task(self, brokerage_org_id: str, campaign_id: str):
    try:
        self.update_state(state="PROGRESS", meta={"status": "Starting", "progress": 10})
        from app.services.brokerage.campaigns.learning.scoring_service import (
            score_campaign_engagement,
        )

        self.update_state(state="PROGRESS", meta={"status": "Scoring", "progress": 60})
        result = score_campaign_engagement(brokerage_org_id, campaign_id)
        self.update_state(state="PROGRESS", meta={"status": "Done", "progress": 100})
        log.info(
            "API",
            "SIL-309 campaign scoring complete",
            {"brokerage_org_id": brokerage_org_id, "campaign_id": campaign_id},
        )
        return result
    except Exception as exc:
        log.error(
            "ERRORS",
            "SIL-309 campaign scoring failed",
            {
                "error": str(exc),
                "brokerage_org_id": brokerage_org_id,
                "campaign_id": campaign_id,
            },
        )
        raise


@celery.task(name="tasks.run_campaign_learning_loop_task", bind=True, queue="heavy")
def run_campaign_learning_loop_task(self, brokerage_org_id: str, campaign_id: str):
    try:
        self.update_state(state="PROGRESS", meta={"status": "Starting", "progress": 5})
        from app.services.brokerage.campaigns.learning.learning_loop import (
            run_campaign_learning_loop,
        )

        self.update_state(state="PROGRESS", meta={"status": "Learning loop", "progress": 50})
        result = run_campaign_learning_loop(brokerage_org_id, campaign_id)
        self.update_state(state="PROGRESS", meta={"status": "Done", "progress": 100})
        log.info(
            "API",
            "SIL-309 learning loop task complete",
            {"brokerage_org_id": brokerage_org_id, "campaign_id": campaign_id},
        )
        return result
    except Exception as exc:
        log.error(
            "ERRORS",
            "SIL-309 learning loop task failed",
            {
                "error": str(exc),
                "brokerage_org_id": brokerage_org_id,
                "campaign_id": campaign_id,
            },
        )
        raise
