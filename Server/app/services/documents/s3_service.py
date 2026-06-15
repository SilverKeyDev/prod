"""
S3 Service for document storage and retrieval (façade).
Handles all S3 operations with proper error handling and configuration management.
"""

from logger import log

from .s3.client_init import S3ClientManager
from .s3.presign import generate_presigned_url as _generate_presigned_url
from .s3.presign import generate_view_url as _generate_view_url
from .s3.upload_download import (
    delete_file as _delete_file,
)
from .s3.upload_download import (
    download_file as _download_file,
)
from .s3.upload_download import (
    file_exists as _file_exists,
)
from .s3.upload_download import (
    upload_file as _upload_file,
)
from .s3.upload_download import (
    upload_pdf as _upload_pdf,
)
from .s3_helpers import delete_s3_objects_under_prefix, get_bucket_name


class S3Service(S3ClientManager):
    """Service for managing S3 operations for document storage."""

    def upload_pdf(
        self, file_data: bytes, filename: str, content_type: str = "application/pdf"
    ) -> str | None:
        """
        Upload a PDF file to S3.

        Args:
            file_data: The PDF file data as bytes
            filename: The filename to use in S3
            content_type: The content type (default: application/pdf)

        Returns:
            The S3 key (path) of the uploaded file, or None if upload failed
        """
        if not self._ensure_s3_client():
            log.error("DOCUMENTS", "S3 client not initialized - cannot upload PDF")
            return None

        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            log.error("DOCUMENTS", "S3 bucket name not available")
            return None

        return _upload_pdf(self.s3_client, bucket_name, file_data, filename, content_type)

    def upload_file(
        self, file_path: str, s3_key: str, content_type: str | None = None
    ) -> str | None:
        """
        Upload a file from local filesystem to S3.

        Args:
            file_path: Local file path
            s3_key: S3 key (path) to store the file
            content_type: Optional content type (will be inferred if not provided)

        Returns:
            The S3 key if successful, None otherwise
        """
        if not self._ensure_s3_client():
            log.error("DOCUMENTS", "S3 client not initialized - cannot upload file")
            return None

        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            log.error("DOCUMENTS", "S3 bucket name not available")
            return None

        return _upload_file(self.s3_client, bucket_name, file_path, s3_key, content_type)

    def generate_presigned_url(
        self, s3_key: str, operation: str = "get_object", download_filename: str | None = None
    ) -> str | None:
        """Generate a presigned URL for downloading a file from S3."""
        if not self._ensure_s3_client():
            log.error("DOCUMENTS", "S3 client not initialized - cannot generate presigned URL")
            return None
        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            return None
        return _generate_presigned_url(
            self.s3_client, bucket_name, s3_key, operation, download_filename
        )

    def generate_view_url(
        self,
        s3_key: str,
        operation: str = "get_object",
        content_type: str | None = None,
    ) -> str | None:
        """Generate a presigned URL for viewing a file inline (e.g. PDF or profile image)."""
        if not self._ensure_s3_client():
            log.error("DOCUMENTS", "S3 client not initialized - cannot generate view URL")
            return None
        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            return None
        return _generate_view_url(self.s3_client, bucket_name, s3_key, operation, content_type)

    def delete_objects_under_prefix(self, prefix: str) -> int:
        """Delete all objects under an S3 key prefix. Returns count deleted."""
        if not self._ensure_s3_client():
            log.error("DOCUMENTS", "S3 client not initialized - cannot delete by prefix")
            return 0

        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            log.error("DOCUMENTS", "S3 bucket name not available for prefix deletion")
            return 0

        return delete_s3_objects_under_prefix(self.s3_client, bucket_name, prefix)

    def delete_pdf(self, s3_key: str) -> bool:
        """
        Delete a file from S3.

        Args:
            s3_key: The S3 key (path) of the file to delete

        Returns:
            True if deletion was successful, False otherwise
        """
        if not self._ensure_s3_client():
            log.error("DOCUMENTS", "S3 client not initialized - cannot delete file")
            return False

        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            log.error("DOCUMENTS", "S3 bucket name not available for deletion")
            return False

        return _delete_file(self.s3_client, bucket_name, s3_key)

    def file_exists(self, s3_key: str) -> bool:
        """
        Check if a file exists in S3.

        Args:
            s3_key: The S3 key (path) of the file

        Returns:
            True if file exists, False otherwise
        """
        if not self._ensure_s3_client():
            log.error("DOCUMENTS", "S3 client not initialized - cannot check file existence")
            return False

        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            log.error("DOCUMENTS", "S3 bucket name not available for existence check")
            return False

        return _file_exists(self.s3_client, bucket_name, s3_key)

    def get_pdf(self, s3_key: str) -> bytes | None:
        """
        Download a file from S3 and return its bytes.

        Args:
            s3_key: The S3 key (path) of the file

        Returns:
            The file contents as bytes, or None if download fails
        """
        if not self._ensure_s3_client():
            log.error("DOCUMENTS", "S3 client not initialized - cannot download file")
            return None

        bucket_name = self.bucket_name or get_bucket_name()
        if not bucket_name:
            log.error("DOCUMENTS", "S3 bucket name not available for download")
            return None

        return _download_file(self.s3_client, bucket_name, s3_key)


# Global S3 service instance
s3_service = S3Service()
