"""
Best-effort external cleanup when hard-deleting a user.

Revokes OAuth at Google and DocuSign, deletes the Cognito identity when present,
and deletes S3 objects keyed by user id. Failures are logged; callers should still
proceed with database deletion.
"""

from __future__ import annotations

from typing import Any

from logger import LOG_CATEGORIES, log

USER_S3_PREFIX_TEMPLATES = (
    "{user_id}/",
    "documents/{user_id}/",
    "images/{user_id}/",
    "profile_pictures/{user_id}/",
)


def _delete_cognito_user(*, email: str | None, cognito_id: str | None) -> dict[str, Any]:
    """Remove the user's Cognito identity. Email is the Cognito username in this pool."""
    if not email and not cognito_id:
        return {"skipped": True, "reason": "no_cognito_identity"}

    try:
        from app.services.auth.core.cognito_service import AWS_COGNITO_service

        if not AWS_COGNITO_service.user_pool_id:
            log.warn(
                LOG_CATEGORIES["API"],
                "delete_user: Cognito user pool not configured; skipping Cognito delete",
                {},
            )
            return {"skipped": True, "reason": "cognito_not_configured"}

        username = (email or "").strip()
        if not username:
            return {"skipped": True, "reason": "missing_email_username"}

        result = AWS_COGNITO_service.admin_delete_user(username)
        return {
            "deleted": bool(result.get("success")),
            "already_absent": bool(result.get("already_absent")),
            "error": result.get("error"),
        }
    except Exception as exc:
        log.warn(
            LOG_CATEGORIES["API"],
            "delete_user: Cognito delete failed",
            {"error": str(exc)},
        )
        return {"deleted": False, "error": str(exc)}


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
    email: str | None = None,
    cognito_id: str | None = None,
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
        "cognito": _delete_cognito_user(email=email, cognito_id=cognito_id),
        "google_revoked": _revoke_google_calendar_oauth(uid),
        "docusign_disconnected": _revoke_docusign_oauth(uid),
        "s3": _delete_user_s3_objects(uid, extra_s3_keys),
    }
    log.info(
        LOG_CATEGORIES["API"],
        "delete_user: external resource cleanup finished",
        summary,
    )
    return summary
