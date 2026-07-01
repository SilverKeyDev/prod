"""SkySlope background sync tasks."""

from __future__ import annotations

from app.celery.celery_worker import celery
from app.services.skyslope.sync import sync_brokerage_transactions
from logger import log


@celery.task(name="skyslope.sync_brokerage_transactions", bind=True, queue="default")
def sync_brokerage_transactions_task(self, brokerage_id: str, full: bool = False):
    try:
        result = sync_brokerage_transactions(brokerage_id, full=full)
        return result
    except Exception as exc:
        log.error(
            "ERRORS",
            "SkySlope Celery sync task failed",
            {"brokerage_id": brokerage_id, "full": full, "error": str(exc)},
        )
        raise


@celery.task(name="skyslope.sync_all_brokerages_incremental", queue="default")
def sync_all_brokerages_incremental_task():
    """Nightly incremental sync for brokerages with active SkySlope credentials."""
    from sqlalchemy import select

    from app import db
    from app.models.brokerage import (
        CREDENTIAL_STATUS_ACTIVE,
        SKYSLOPE_PROVIDER,
        BrokerageIntegrationCredential,
    )

    brokerage_ids = db.session.scalars(
        select(BrokerageIntegrationCredential.brokerage_id).where(
            BrokerageIntegrationCredential.provider == SKYSLOPE_PROVIDER,
            BrokerageIntegrationCredential.status == CREDENTIAL_STATUS_ACTIVE,
        )
    ).all()

    queued = 0
    for brokerage_id in brokerage_ids:
        sync_brokerage_transactions_task.delay(brokerage_id, full=False)
        queued += 1

    return {"queued": queued}
