"""Unit tests for S3 presigned URL generation."""

from unittest.mock import Mock, patch

from app.services.documents.s3.presign import generate_presigned_url, generate_view_url
from app.services.documents.s3_urls import generate_presigned_url as url_generate_presigned


def test_generate_presigned_url_returns_none_without_bucket():
    client = Mock()
    assert generate_presigned_url(client, "", "documents/user-1/file.pdf") is None


def test_generate_presigned_url_delegates_with_bucket():
    client = Mock()
    client.generate_presigned_url.return_value = "https://signed.example/get"
    with patch(
        "app.services.documents.s3_urls.get_presigned_url_expiration",
        return_value=3600,
    ):
        url = url_generate_presigned(
            client,
            "test-bucket",
            "documents/user-1/report.pdf",
            download_filename="report.pdf",
        )
    assert url == "https://signed.example/get"
    client.generate_presigned_url.assert_called_once()
    params = client.generate_presigned_url.call_args.kwargs["Params"]
    assert params["Bucket"] == "test-bucket"
    assert params["Key"] == "documents/user-1/report.pdf"
    assert "attachment" in params["ResponseContentDisposition"]


def test_generate_presigned_url_returns_none_for_empty_key():
    client = Mock()
    assert url_generate_presigned(client, "test-bucket", "") is None


def test_generate_view_url_returns_none_without_bucket():
    client = Mock()
    assert generate_view_url(client, "", "images/user-1/avatar.png") is None
