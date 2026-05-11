"""
S3 presigned URL generation (download and view URLs).
"""

from botocore.exceptions import ClientError, ParamValidationError

from app.utils.security.app_logging import get_logger

from .s3_helpers import get_presigned_url_expiration

logger = get_logger()


def generate_presigned_url(
    s3_client,
    bucket_name: str,
    s3_key: str,
    operation: str = "get_object",
    download_filename: str | None = None,
) -> str | None:
    """
    Generate a presigned URL for downloading a file from S3.

    Args:
        s3_client: Boto3 S3 client
        bucket_name: S3 bucket name
        s3_key: The S3 key (path) of the file
        operation: The S3 operation (default: 'get_object' for downloads)
        download_filename: Optional filename to force as the download name

    Returns:
        The presigned URL, or None if generation failed
    """
    if not s3_key:
        logger.error("No S3 key provided for presigned URL generation")
        return None
    if not bucket_name:
        logger.error("S3 bucket name not available")
        return None

    expiration = get_presigned_url_expiration()
    try:
        params = {"Bucket": bucket_name, "Key": s3_key}
        if download_filename:
            params["ResponseContentDisposition"] = f'attachment; filename="{download_filename}"'
        presigned_url = s3_client.generate_presigned_url(
            operation, Params=params, ExpiresIn=expiration
        )
        return presigned_url
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        logger.error(
            f"Failed to generate presigned URL for {s3_key}: {error_code} - {error_message}"
        )
        return None
    except ParamValidationError as e:
        logger.error(f"Parameter validation error generating presigned URL: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error generating presigned URL: {str(e)}")
        return None


def generate_view_url(
    s3_client,
    bucket_name: str,
    s3_key: str,
    operation: str = "get_object",
    content_type: str | None = None,
) -> str | None:
    """
    Generate a presigned URL for viewing a file inline in the browser.

    Args:
        s3_client: Boto3 S3 client
        bucket_name: S3 bucket name
        s3_key: The S3 key (path) of the file
        operation: The S3 operation (default: 'get_object' for viewing)
        content_type: Optional response Content-Type (default: application/pdf for
            backward compatibility; use image/jpeg etc. for profile pictures)

    Returns:
        The presigned URL, or None if generation failed
    """
    if not s3_key:
        logger.error("No S3 key provided for view URL generation")
        return None
    if not bucket_name:
        logger.error("S3 bucket name not available")
        return None

    expiration = get_presigned_url_expiration()
    response_content_type = content_type if content_type else "application/pdf"
    try:
        params = {
            "Bucket": bucket_name,
            "Key": s3_key,
            "ResponseContentDisposition": "inline",
            "ResponseContentType": response_content_type,
            "ResponseCacheControl": "public, max-age=3600",
        }
        presigned_url = s3_client.generate_presigned_url(
            operation, Params=params, ExpiresIn=expiration
        )
        return presigned_url
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        logger.error(f"Failed to generate view URL for {s3_key}: {error_code} - {error_message}")
        return None
    except ParamValidationError as e:
        logger.error(f"Parameter validation error generating view URL: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error generating view URL: {str(e)}")
        return None
