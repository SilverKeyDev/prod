"""S3 upload and download operations."""

import os
from io import BytesIO

from botocore.exceptions import ClientError, ParamValidationError

from app.utils.security.app_logging import get_logger

logger = get_logger()


def upload_pdf(
    s3_client,
    bucket_name: str,
    file_data: bytes,
    filename: str,
    content_type: str = "application/pdf",
) -> str | None:
    """
    Upload a PDF file to S3.

    Args:
        s3_client: Initialized boto3 S3 client
        bucket_name: S3 bucket name
        file_data: The PDF file data as bytes
        filename: The filename to use in S3
        content_type: The content type (default: application/pdf)

    Returns:
        The S3 key (path) of the uploaded file, or None if upload failed
    """
    if not file_data or not filename or len(file_data) == 0:
        logger.error("Invalid file data or filename provided for upload")
        return None

    try:
        file_obj = BytesIO(file_data)
        s3_client.upload_fileobj(
            file_obj,
            bucket_name,
            filename,
            ExtraArgs={
                "ContentType": content_type,
                "ACL": "private",  # Private access, use presigned URLs for access
            },
        )
        return filename

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        logger.error(f"Failed to upload PDF to S3: {filename} - {error_code}: {error_message}")
        return None
    except ParamValidationError as e:
        logger.error(f"Parameter validation error uploading PDF: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error uploading PDF to S3: {str(e)}")
        return None


def upload_file(
    s3_client, bucket_name: str, file_path: str, s3_key: str, content_type: str | None = None
) -> str | None:
    """
    Upload a file from local filesystem to S3.

    Args:
        s3_client: Initialized boto3 S3 client
        bucket_name: S3 bucket name
        file_path: Local file path
        s3_key: S3 key (path) to store the file
        content_type: Optional content type (will be inferred if not provided)

    Returns:
        The S3 key if successful, None otherwise
    """
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return None

    try:
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type
        extra_args["ACL"] = "private"

        s3_client.upload_file(file_path, bucket_name, s3_key, ExtraArgs=extra_args)
        return s3_key

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        logger.error(f"Failed to upload file to S3: {s3_key} - {error_code}: {error_message}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error uploading file to S3: {str(e)}")
        return None


def delete_file(s3_client, bucket_name: str, s3_key: str) -> bool:
    """
    Delete a file from S3.

    Args:
        s3_client: Initialized boto3 S3 client
        bucket_name: S3 bucket name
        s3_key: The S3 key (path) of the file to delete

    Returns:
        True if deletion was successful, False otherwise
    """
    if not s3_key:
        logger.error("No S3 key provided for deletion")
        return False

    try:
        s3_client.delete_object(Bucket=bucket_name, Key=s3_key)
        return True

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        logger.error(f"Failed to delete file from S3: {s3_key} - {error_code}: {error_message}")

        if error_code == "NoSuchKey":
            logger.warning(f"S3 object '{s3_key}' does not exist (already deleted?)")
            return True  # Consider this a success since the goal is achieved

        return False
    except ParamValidationError as e:
        logger.error(f"Parameter validation error deleting file: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error deleting file from S3: {str(e)}")
        return False


def file_exists(s3_client, bucket_name: str, s3_key: str) -> bool:
    """
    Check if a file exists in S3.

    Args:
        s3_client: Initialized boto3 S3 client
        bucket_name: S3 bucket name
        s3_key: The S3 key (path) of the file

    Returns:
        True if file exists, False otherwise
    """
    if not s3_key:
        logger.error("No S3 key provided for existence check")
        return False

    try:
        s3_client.head_object(Bucket=bucket_name, Key=s3_key)
        return True

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code == "404" or error_code == "NoSuchKey":
            return False
        else:
            error_message = e.response["Error"]["Message"]
            logger.error(
                f"Error checking if file exists in S3: {s3_key} - {error_code}: {error_message}"
            )
            return False
    except Exception as e:
        logger.error(f"Unexpected error checking file existence: {str(e)}")
        return False


def download_file(s3_client, bucket_name: str, s3_key: str) -> bytes | None:
    """
    Download a file from S3 and return its bytes.

    Args:
        s3_client: Initialized boto3 S3 client
        bucket_name: S3 bucket name
        s3_key: The S3 key (path) of the file

    Returns:
        The file contents as bytes, or None if download fails
    """
    if not s3_key:
        logger.error("No S3 key provided for download")
        return None

    try:
        file_obj = BytesIO()
        s3_client.download_fileobj(bucket_name, s3_key, file_obj)
        file_obj.seek(0)
        return file_obj.read()

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        logger.error(f"Failed to download file from S3: {s3_key} - {error_code}: {error_message}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error downloading file from S3: {str(e)}")
        return None
