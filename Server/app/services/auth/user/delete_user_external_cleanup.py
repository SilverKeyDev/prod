"""
Best-effort external cleanup when hard-deleting a user.

Revokes OAuth at Google and DocuSign, removes Plaid items when configured,
and deletes S3 objects keyed by user id. Failures are logged; callers should
still proceed with database deletion.
"""

from __future__ import annotations

import os
from typing import Any

from sqlalchemy import inspect, text

from app import db
from logger import LOG_CATEGORIES, log

USER_S3_PREFIX_TEMPLATES = (
    "{user_id}/",
    "documents/{user_id}/",
    "images/{user_id}/",
    "profile_pictures/{user_id}/",
)


def _revoke_google_calendar_oauth(user_id: str) -> bool:
    try:
        from app.services.calendar.core.service import google_calendar_service

        return bool(google_calendar_service.revoke_access(user_id))
    except Exception as exc:
        log.warn(
            LOG_CATEGORIES["API"],
            "delete_user: Google OAuth revoke failed",
            {"user_id": user_id, "error": str(exc)},
        )
        return False


def _revoke_docusign_oauth(user_id: str) -> bool:
    try:
        from app.services.docusign import DocusignOAuthService

        DocusignOAuthService.disconnect(user_id)
        return True
    except Exception as exc:
        log.warn(
            LOG_CATEGORIES["API"],
            "delete_user: DocuSign OAuth disconnect failed",
            {"user_id": user_id, "error": str(exc)},
        )
        return False


def _disconnect_plaid(user_id: str) -> dict[str, int]:
    """Remove Plaid items via API when plaid_items table and credentials exist."""
    result = {"items_removed": 0, "rows_deleted": 0}
    try:
        if "plaid_items" not in inspect(db.engine).get_table_names():
            return result

        client_id = (
            os.getenv("PLAID_CLIENT_ID", "").strip()
            or os.getenv("VITE_PLAID_CLIENT_ID", "").strip()
        )
        secret = os.getenv("PLAID_SECRET", "").strip()
        if not client_id or not secret:
            result["rows_deleted"] = _delete_plaid_rows_only(user_id)
            return result

        rows = db.session.execute(
            text(
                "SELECT id, access_token FROM plaid_items WHERE user_id = :user_id"
            ),
            {"user_id": user_id},
        ).fetchall()

        if not rows:
            return result

        plaid_removed = _plaid_item_remove_calls(rows, client_id, secret)
        result["items_removed"] = plaid_removed
        result["rows_deleted"] = _delete_plaid_rows_only(user_id)
        return result
    except Exception as exc:
        log.warn(
            LOG_CATEGORIES["API"],
            "delete_user: Plaid disconnect failed",
            {"user_id": user_id, "error": str(exc)},
        )
        return result


def _plaid_item_remove_calls(rows: list[Any], client_id: str, secret: str) -> int:
    """Call Plaid item/remove for each linked item. Returns success count."""
    try:
        import plaid
        from plaid.api import plaid_api
        from plaid.configuration import Configuration
        from plaid.model.item_remove_request import ItemRemoveRequest
    except ImportError:
        log.warn(LOG_CATEGORIES["API"], "delete_user: plaid-python not installed")
        return 0

    env_name = os.getenv("PLAID_ENV", "sandbox").strip().lower()
    host = (
        plaid.Environment.Production
        if env_name == "production"
        else plaid.Environment.Sandbox
    )
    configuration = Configuration(
        host=host,
        api_key={"clientId": client_id, "secret": secret},
    )
    api_client = plaid.ApiClient(configuration)
    client = plaid_api.PlaidApi(api_client)

    removed = 0
    for row in rows:
        access_token = row[1] if len(row) > 1 else None
        if not access_token:
            continue
        try:
            client.item_remove(ItemRemoveRequest(access_token=access_token))
            removed += 1
        except Exception as exc:
            log.warn(
                LOG_CATEGORIES["API"],
                "delete_user: Plaid item_remove failed for one item",
                {"plaid_item_row_id": row[0], "error": str(exc)},
            )
    return removed


def _delete_plaid_rows_only(user_id: str) -> int:
    """Delete plaid_asset_reports and plaid_items rows for user_id."""
    deleted = 0
    if "plaid_asset_reports" in inspect(db.engine).get_table_names():
        res = db.session.execute(
            text("DELETE FROM plaid_asset_reports WHERE user_id = :user_id"),
            {"user_id": user_id},
        )
        deleted += res.rowcount or 0
    if "plaid_items" in inspect(db.engine).get_table_names():
        res = db.session.execute(
            text("DELETE FROM plaid_items WHERE user_id = :user_id"),
            {"user_id": user_id},
        )
        deleted += res.rowcount or 0
    if deleted:
        db.session.commit()
    return deleted


def _delete_user_s3_objects(user_id: str, extra_s3_keys: list[str] | None) -> dict[str, int]:
    from app.services.documents.s3_service import s3_service

    stats = {"prefix_deleted": 0, "keys_deleted": 0}
    if not s3_service._ensure_s3_client():
        log.warn(LOG_CATEGORIES["API"], "delete_user: S3 client unavailable", {"user_id": user_id})
        return stats

    prefixes = [template.format(user_id=user_id) for template in USER_S3_PREFIX_TEMPLATES]
    for prefix in prefixes:
        stats["prefix_deleted"] += s3_service.delete_objects_under_prefix(prefix)

    seen: set[str] = set()
    for key in extra_s3_keys or []:
        normalized = (key or "").strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        if s3_service.delete_pdf(normalized):
            stats["keys_deleted"] += 1

    return stats


def cleanup_external_resources_for_user(
    user_id: str,
    *,
    extra_s3_keys: list[str] | None = None,
) -> dict[str, Any]:
    """
    Revoke third-party access and delete user-scoped S3 objects.

    Returns a summary dict for logging; does not raise on partial failure.
    """
    uid = str(user_id).strip()
    if not uid:
        return {"skipped": True}

    summary: dict[str, Any] = {
        "user_id": uid,
        "google_revoked": _revoke_google_calendar_oauth(uid),
        "docusign_disconnected": _revoke_docusign_oauth(uid),
        "plaid": _disconnect_plaid(uid),
        "s3": _delete_user_s3_objects(uid, extra_s3_keys),
    }
    log.info(
        LOG_CATEGORIES["API"],
        "delete_user: external resource cleanup finished",
        summary,
    )
    return summary
