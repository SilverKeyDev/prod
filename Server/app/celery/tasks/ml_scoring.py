from app.celery.celery_worker import celery
from logger import log


@celery.task(name="tasks.score_brokerage_ml_insights_task", bind=True, queue="heavy")
def score_brokerage_ml_insights_task(self, brokerage_org_id: str):
    try:
        self.update_state(state="PROGRESS", meta={"status": "Starting", "progress": 10})

        from app.services.brokerage.ml.scoring_service import score_brokerage_ml_insights

        self.update_state(state="PROGRESS", meta={"status": "Scoring", "progress": 60})
        result = score_brokerage_ml_insights(brokerage_org_id)

        self.update_state(state="PROGRESS", meta={"status": "Done", "progress": 100})
        log.info("API", "SIL-208 scoring complete", {"brokerage_org_id": brokerage_org_id})
        return result
    except Exception as exc:
        log.error(
            "ERRORS",
            "SIL-208 scoring failed",
            {"error": str(exc), "brokerage_org_id": brokerage_org_id},
        )
        return {"success": False, "error": str(exc), "brokerage_org_id": brokerage_org_id}
