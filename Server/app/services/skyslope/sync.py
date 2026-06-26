"""Orchestrate SkySlope transaction import for one brokerage."""

from __future__ import annotations

from typing import Any

from app.services.skyslope.client import MockSkySlopeClient, SkySlopeClient, SkySlopeClientProtocol
from app.services.skyslope.credentials import get_credential_row, get_decrypted_skyslope_api_key
from app.services.skyslope.mapping import map_skyslope_transaction
from app.services.skyslope.persistence import upsert_skyslope_transactions
from app.services.skyslope.sync_state import mark_sync_failed, mark_sync_running, mark_sync_success
from logger import log


def _resolve_agent_id(_raw: dict[str, Any]) -> str | None:
    """Map SkySlope agent → SilverKey users.id. Return None until mapping exists."""
    return None


def _build_client(brokerage_id: str, *, use_mock: bool = False) -> SkySlopeClientProtocol:
    if use_mock:
        return MockSkySlopeClient()

    row = get_credential_row(brokerage_id)
    api_key = get_decrypted_skyslope_api_key(brokerage_id)
    return SkySlopeClient(api_key=api_key, skyslope_org_id=row.skyslope_org_id if row else None)


def sync_brokerage_transactions(
    brokerage_id: str,
    *,
    full: bool = False,
    client: SkySlopeClientProtocol | None = None,
    use_mock: bool = False,
) -> dict[str, int | bool]:
    mark_sync_running(brokerage_id)

    try:
        skyslope_client = client or _build_client(brokerage_id, use_mock=use_mock)
        sync_state = None
        updated_since = None
        if not full:
            from app.services.skyslope.sync_state import get_or_create_sync_state

            sync_state = get_or_create_sync_state(brokerage_id)
            updated_since = sync_state.last_synced_at

        total_created = 0
        total_updated = 0

        for page in skyslope_client.iter_transactions(updated_since=updated_since):
            mapped = [
                map_skyslope_transaction(
                    raw,
                    brokerage_id=brokerage_id,
                    agent_id=_resolve_agent_id(raw),
                )
                for raw in page
            ]
            created, updated = upsert_skyslope_transactions(brokerage_id, mapped)
            total_created += created
            total_updated += updated

        records_imported = total_created + total_updated
        mark_sync_success(
            brokerage_id,
            records_imported=records_imported,
            full=full,
            sync_cursor=sync_state.sync_cursor if sync_state else None,
        )

        log.info(
            "API",
            "SkySlope transaction sync completed",
            {
                "brokerage_id": brokerage_id,
                "created": total_created,
                "updated": total_updated,
                "full": full,
            },
        )
        return {
            "success": True,
            "created": total_created,
            "updated": total_updated,
            "records_imported": records_imported,
        }

    except Exception as exc:
        mark_sync_failed(brokerage_id, str(exc))
        log.error(
            "ERRORS",
            "SkySlope transaction sync failed",
            {"brokerage_id": brokerage_id, "error": str(exc)},
        )
        raise
