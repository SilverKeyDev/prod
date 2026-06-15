"""
Document service layer for high-level document operations.
Provides business logic for document management operations.
"""

from flask import current_app

from logger import log

from .s3_helpers import (
    get_bucket_name,
    get_json_key_from_pdf_key,
    list_s3_objects,
)
from .s3_service import s3_service


class DocumentService:
    """Service for document management operations."""

    @staticmethod
    def list_user_reports(user_id: str) -> list[dict]:
        """
        List all reports for a user from S3.

        Args:
            user_id: User ID

        Returns:
            List of report objects from S3
        """
        if not s3_service.s3_client:
            log.warn("DOCUMENTS", "S3 client not initialized, cannot list reports")
            return []

        bucket_name = get_bucket_name()
        if not bucket_name:
            log.error("DOCUMENTS", "S3 bucket name not configured")
            return []

        user_prefix = f"{user_id}/reports/"
        return list_s3_objects(s3_service.s3_client, bucket_name, user_prefix)

    @staticmethod
    def delete_report_and_json(pdf_key: str) -> dict[str, bool]:
        """
        Delete both PDF and JSON versions of a report.

        Args:
            pdf_key: PDF S3 key

        Returns:
            Dictionary with deletion status for PDF and JSON
        """
        result = {"pdf_deleted": False, "json_deleted": False}

        # Delete PDF
        result["pdf_deleted"] = s3_service.delete_pdf(pdf_key)

        # Delete corresponding JSON if it exists
        json_key = get_json_key_from_pdf_key(pdf_key)
        if json_key:
            # Check if JSON exists before trying to delete
            if s3_service.file_exists(json_key):
                result["json_deleted"] = s3_service.delete_pdf(json_key)
            else:
                log.info(
                    "DOCUMENTS",
                    "JSON file not found, skipping deletion",
                    {"json_key": json_key},
                )
                result["json_deleted"] = True  # Consider it successful if it doesn't exist

        return result

    @staticmethod
    def get_diagnostic_info() -> dict:
        """
        Get S3 service diagnostic information.

        Returns:
            Dictionary with diagnostic information
        """
        import os
        import time

        diagnostics = {
            "timestamp": time.time(),
            "s3_service_status": {
                "client_initialized": s3_service.s3_client is not None,
                "initialization_attempted": s3_service.initialization_attempted,
                "initialization_successful": s3_service.initialization_successful,
                "bucket_name": s3_service.bucket_name,
                "last_init_attempt": s3_service._last_init_attempt,
            },
            "config_values": {},
            "environment_variables": {},
            "errors": [],
        }

        # Check Flask config values
        try:
            config = current_app.config
            diagnostics["config_values"] = {
                "AWS_ACCESS_KEY_ID": "***" if config.get("AWS_ACCESS_KEY_ID") else None,
                "AWS_SECRET_ACCESS_KEY": "***" if config.get("AWS_SECRET_ACCESS_KEY") else None,
                "AWS_REGION": config.get("AWS_REGION"),
                "S3_BUCKET_NAME_PDFS": config.get("S3_BUCKET_NAME_PDFS"),
                "S3_PRESIGNED_URL_EXPIRATION": config.get("S3_PRESIGNED_URL_EXPIRATION"),
            }
        except Exception as e:
            diagnostics["errors"].append(f"Could not access Flask config: {str(e)}")

        # Check environment variables
        diagnostics["environment_variables"] = {
            "AWS_ACCESS_KEY_ID": "***" if os.getenv("AWS_ACCESS_KEY_ID") else None,
            "AWS_SECRET_ACCESS_KEY": "***" if os.getenv("AWS_SECRET_ACCESS_KEY") else None,
            "AWS_REGION": os.getenv("AWS_REGION"),
            "S3_PRESIGNED_URL_EXPIRATION": os.getenv("S3_PRESIGNED_URL_EXPIRATION"),
            "FLASK_ENV": os.getenv("FLASK_ENV"),
        }

        # Test S3 connection if client exists
        if s3_service.s3_client:
            try:
                bucket_name = get_bucket_name()
                if bucket_name:
                    s3_service.s3_client.head_bucket(Bucket=bucket_name)
                    diagnostics["s3_service_status"]["bucket_access_test"] = "success"
                else:
                    diagnostics["errors"].append("S3_BUCKET_NAME_PDFS not configured")
            except Exception as e:
                diagnostics["s3_service_status"]["bucket_access_test"] = f"failed: {str(e)}"
                diagnostics["errors"].append(f"S3 bucket access test failed: {str(e)}")

        return diagnostics
