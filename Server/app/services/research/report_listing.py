"""Build merged DB + S3 report listings for a user."""

from __future__ import annotations

import os
import time
from typing import Any

from sqlalchemy import or_

from app.models import Document
from app.services.documents import DocumentService, s3_service
from app.utils.security.app_logging import get_logger

logger = get_logger()


def list_reports_for_user(user_id: str) -> list[dict[str, Any]]:
    reports_list: list[dict[str, Any]] = []
    seen_names: set[str] = set()

    generating_reports = Document.query.filter(
        Document.user_id == user_id,
        or_(Document.status == "generating", Document.status == "error"),
    ).all()

    for report in generating_reports:
        status = "completed" if report.status == "processed" else report.status
        reports_list.append(
            {
                "id": report.id,
                "status": status,
                "generatedAt": int(report.created_at.timestamp()),
                "address": os.path.splitext(os.path.basename(report.filename))[0],
                "s3Key": report.file_path,
            }
        )

    s3_objects = DocumentService.list_user_reports(user_id)

    for obj in s3_objects:
        s3_key = obj.get("Key") if isinstance(obj, dict) else getattr(obj, "Key", None)
        if not s3_key:
            continue
        file_name = os.path.basename(s3_key)

        if file_name in seen_names:
            continue

        if not file_name.endswith(".pdf"):
            continue

        db_report = Document.query.filter(
            Document.user_id == user_id, Document.file_path == s3_key
        ).first()

        report_id = db_report.id if db_report else file_name
        presigned_url = s3_service.generate_presigned_url(s3_key, download_filename=file_name)

        last_modified = (
            obj.get("LastModified") if isinstance(obj, dict) else getattr(obj, "LastModified", None)
        )
        if last_modified and hasattr(last_modified, "timestamp"):
            generated_at = int(last_modified.timestamp())
        else:
            generated_at = int(time.time())

        reports_list.append(
            {
                "id": report_id,
                "status": "completed",
                "generatedAt": generated_at,
                "pdfUrl": presigned_url,
                "address": os.path.splitext(file_name)[0],
                "s3Key": s3_key,
            }
        )

    if not s3_objects and not s3_service.s3_client:
        logger.warning("S3 client not initialized, cannot list bucket")

    reports_list.sort(
        key=lambda x: (x["status"] != "generating", x.get("generatedAt", 0)), reverse=True
    )
    return reports_list
