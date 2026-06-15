"""Unit tests for file upload security utilities."""

from __future__ import annotations

import os
import tempfile
from io import BytesIO
from unittest.mock import patch

import pytest
from werkzeug.datastructures import FileStorage

from app.utils.security.file_security import (
    FileSecurityError,
    create_secure_upload_directory,
    get_file_hash,
    sanitize_filename,
    scan_for_malicious_patterns,
    validate_file_upload,
)


def _file_storage(content: bytes, filename: str) -> FileStorage:
    return FileStorage(stream=BytesIO(content), filename=filename)


def test_sanitize_filename_strips_path_components():
    assert sanitize_filename("../../etc/passwd") == "passwd"
    assert sanitize_filename("folder/doc.pdf") == "doc.pdf"


def test_sanitize_filename_replaces_dangerous_characters():
    assert sanitize_filename('bad<>:"|?*.txt') == "bad_______.txt"


def test_sanitize_filename_empty_returns_unnamed():
    assert sanitize_filename("") == "unnamed_file"


def test_get_file_hash_is_deterministic():
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(b"silverkey-test-content")
        path = tmp.name
    try:
        assert get_file_hash(path) == get_file_hash(path)
        assert len(get_file_hash(path)) == 64
    finally:
        os.unlink(path)


def test_scan_for_malicious_patterns_rejects_script_in_text_file():
    with tempfile.NamedTemporaryFile(delete=False, suffix=".txt") as tmp:
        tmp.write(b"hello <script>alert(1)</script>")
        path = tmp.name
    try:
        with pytest.raises(FileSecurityError, match="Malicious pattern"):
            scan_for_malicious_patterns(path, "text/plain")
    finally:
        os.unlink(path)


def test_scan_for_malicious_patterns_skips_binary_pdf():
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(b"%PDF-1.4 <script>not scanned")
        path = tmp.name
    try:
        assert scan_for_malicious_patterns(path, "application/pdf") is True
    finally:
        os.unlink(path)


def test_create_secure_upload_directory_isolates_by_user():
    with tempfile.TemporaryDirectory() as base:
        dir_a = create_secure_upload_directory(base, "user-a")
        dir_b = create_secure_upload_directory(base, "user-b")
        assert dir_a != dir_b
        assert os.path.isdir(dir_a)
        assert os.path.isdir(dir_b)


def test_validate_file_upload_rejects_missing_filename():
    storage = FileStorage(stream=BytesIO(b"x"), filename="")
    with pytest.raises(FileSecurityError, match="No file provided"):
        validate_file_upload(storage)


def test_validate_file_upload_rejects_disallowed_mime():
    storage = _file_storage(b"not-a-real-pdf", "evil.exe")
    with patch(
        "app.utils.security.file_security.magic.from_file",
        return_value="application/x-msdownload",
    ):
        with pytest.raises(FileSecurityError, match="not allowed"):
            validate_file_upload(storage)


def test_validate_file_upload_rejects_extension_mismatch():
    storage = _file_storage(b"%PDF-1.4", "photo.png")
    with patch(
        "app.utils.security.file_security.magic.from_file",
        return_value="application/pdf",
    ):
        with pytest.raises(FileSecurityError, match="does not match"):
            validate_file_upload(storage)


def test_validate_file_upload_rejects_oversized_text_file():
    oversized = b"x" * (1024 * 1024 + 1)
    storage = _file_storage(oversized, "large.txt")
    with patch(
        "app.utils.security.file_security.magic.from_file",
        return_value="text/plain",
    ):
        with pytest.raises(FileSecurityError, match="exceeds maximum"):
            validate_file_upload(storage)


def test_validate_file_upload_accepts_plain_text():
    storage = _file_storage(b"hello world", "notes.txt")
    with (
        patch(
            "app.utils.security.file_security.magic.from_file",
            return_value="text/plain",
        ),
        patch("app.utils.security.file_security.scan_with_clamav", return_value=True),
    ):
        safe_name, mime = validate_file_upload(storage)
    assert safe_name == "notes.txt"
    assert mime == "text/plain"


def test_validate_file_upload_accepts_pdf():
    storage = _file_storage(b"%PDF-1.4 test", "report.pdf")
    with (
        patch(
            "app.utils.security.file_security.magic.from_file",
            return_value="application/pdf",
        ),
        patch("app.utils.security.file_security.scan_with_clamav", return_value=True),
    ):
        safe_name, mime = validate_file_upload(storage)
    assert safe_name == "report.pdf"
    assert mime == "application/pdf"
