"""S3 presigned URL generation."""

from app.utils.security.app_logging import get_logger

from ..s3_urls import generate_presigned_url as url_generate_presigned
from ..s3_urls import generate_view_url as url_generate_view

logger = get_logger()


def generate_presigned_url(
    s3_client,
    bucket_name: str,
    s3_key: str,
    operation: str = "get_object",
    download_filename: str | None = None,
) -> str | None:
    """Generate a presigned URL for downloading a file from S3."""
    if not bucket_name:
        return None
    return url_generate_presigned(s3_client, bucket_name, s3_key, operation, download_filename)


def generate_view_url(
    s3_client,
    bucket_name: str,
    s3_key: str,
    operation: str = "get_object",
    content_type: str | None = None,
) -> str | None:
    """Generate a presigned URL for viewing a file inline (e.g. PDF or profile image)."""
    if not bucket_name:
        return None
    return url_generate_view(s3_client, bucket_name, s3_key, operation, content_type)
