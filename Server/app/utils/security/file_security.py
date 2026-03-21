"""
Enhanced file upload security utilities with content validation and virus scanning.
"""

import hashlib
import logging
import os
import re
import subprocess
import tempfile

import magic
from werkzeug.datastructures import FileStorage

logger = logging.getLogger(__name__)

# Allowed MIME types for file uploads
ALLOWED_MIME_TYPES = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "text/plain": [".txt"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/msword": [".doc"],
}

# Maximum file sizes by type (in bytes)
MAX_FILE_SIZES = {
    "application/pdf": 50 * 1024 * 1024,  # 50MB for PDFs
    "image/jpeg": 15 * 1024 * 1024,  # 15MB for images (e.g. profile pictures)
    "image/png": 15 * 1024 * 1024,
    "image/gif": 15 * 1024 * 1024,  # 15MB for GIFs (e.g. profile pictures)
    "text/plain": 1 * 1024 * 1024,  # 1MB for text files
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 25
    * 1024
    * 1024,  # 25MB for DOCX
    "application/msword": 25 * 1024 * 1024,  # 25MB for DOC
}

# Binary file types that should skip text-based pattern scanning
# These files can contain byte sequences that match text patterns but aren't malicious
BINARY_FILE_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
]

# Dangerous file patterns to reject
DANGEROUS_PATTERNS = [
    rb"<script[^>]*>",  # JavaScript
    rb"<%.*%>",  # Server-side scripts
    rb"<?php",  # PHP code
    rb"#!/bin/",  # Shell scripts
    rb"eval\s*\(",  # Eval functions
    rb"exec\s*\(",  # Exec functions
]


class FileSecurityError(Exception):
    """Custom exception for file security violations"""

    pass


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal and other attacks.

    Args:
        filename: Original filename

    Returns:
        Sanitized filename
    """
    if not filename:
        return "unnamed_file"

    # Remove path components
    filename = os.path.basename(filename)

    # Replace dangerous characters
    filename = re.sub(r'[<>:"/\\|?*]', "_", filename)

    # Remove null bytes and control characters
    filename = "".join(char for char in filename if ord(char) >= 32)

    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[: 255 - len(ext)] + ext

    # Ensure it's not empty after sanitization
    if not filename or filename.startswith("."):
        filename = f"file_{hashlib.md5(filename.encode()).hexdigest()[:8]}"

    return filename


def validate_file_content(file_path: str, expected_mime_type: str) -> bool:
    """
    Validate file content matches expected MIME type using python-magic.

    Args:
        file_path: Path to the file to validate
        expected_mime_type: Expected MIME type

    Returns:
        True if content matches expected type

    Raises:
        FileSecurityError: If validation fails
    """
    try:
        # Get actual MIME type from file content
        actual_mime_type = magic.from_file(file_path, mime=True)

        if actual_mime_type != expected_mime_type:
            raise FileSecurityError(
                f"File content mismatch. Expected {expected_mime_type}, got {actual_mime_type}"
            )

        return True

    except Exception as e:
        logger.error(f"File content validation failed: {str(e)}")
        raise FileSecurityError(f"Content validation failed: {str(e)}") from e


def scan_for_malicious_patterns(file_path: str, mime_type: str) -> bool:
    """
    Scan file for known malicious patterns.

    Only scans text-based files. Binary files (PDFs, images, DOCX) are skipped
    as they can contain byte sequences that match text patterns but aren't malicious.

    Args:
        file_path: Path to file to scan
        mime_type: MIME type of the file

    Returns:
        True if file is clean or skipped

    Raises:
        FileSecurityError: If malicious patterns found in text files
    """
    # Skip pattern scanning for binary files
    if mime_type in BINARY_FILE_TYPES:
        return True

    try:
        with open(file_path, "rb") as f:
            content = f.read(1024 * 1024)  # Read first 1MB for pattern matching

        for pattern in DANGEROUS_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                raise FileSecurityError("Malicious pattern detected in file")

        return True

    except FileSecurityError as e:
        raise e from e
    except Exception as e:
        logger.error(f"Pattern scanning failed: {str(e)}")
        raise FileSecurityError(f"Pattern scanning failed: {str(e)}") from e


def scan_with_clamav(file_path: str) -> bool:
    """
    Scan file with ClamAV antivirus if available.

    Args:
        file_path: Path to file to scan

    Returns:
        True if file is clean or ClamAV not available

    Raises:
        FileSecurityError: If virus detected
    """
    try:
        # Check if clamdscan is available
        result = subprocess.run(["which", "clamdscan"], capture_output=True, text=True, timeout=5)

        if result.returncode != 0:
            logger.warning("ClamAV not available - skipping virus scan")
            return True

        # Run virus scan
        result = subprocess.run(
            ["clamdscan", "--no-summary", file_path], capture_output=True, text=True, timeout=30
        )

        if result.returncode == 0:
            return True
        elif result.returncode == 1:
            logger.error(f"Virus detected in file {file_path}: {result.stdout}")
            raise FileSecurityError("Virus detected in uploaded file")
        else:
            logger.error(f"ClamAV scan error: {result.stderr}")
            raise FileSecurityError("Virus scan failed")

    except subprocess.TimeoutExpired as e:
        logger.error("ClamAV scan timeout")
        raise FileSecurityError("Virus scan timeout") from e
    except FileNotFoundError:
        logger.warning("ClamAV not installed - skipping virus scan")
        return True
    except Exception as e:
        logger.error(f"Virus scanning failed: {str(e)}")
        # Don't fail upload if virus scanner has issues, but log it
        logger.warning("Proceeding without virus scan due to scanner error")
        return True


def validate_file_upload(
    file: FileStorage, allowed_types: dict[str, list] | None = None
) -> tuple[str, str]:
    """
    Comprehensive file upload validation with security checks.

    Args:
        file: Uploaded file object
        allowed_types: Optional custom allowed MIME types

    Returns:
        Tuple of (sanitized_filename, validated_mime_type)

    Raises:
        FileSecurityError: If validation fails
    """
    if not file or not file.filename:
        raise FileSecurityError("No file provided")

    allowed_types = allowed_types or ALLOWED_MIME_TYPES

    # Sanitize filename
    safe_filename = sanitize_filename(file.filename)

    # Get file extension
    _, ext = os.path.splitext(safe_filename.lower())

    # Create temporary file for validation
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
        temp_path = temp_file.name
        file.save(temp_path)

    try:
        # Get actual MIME type
        actual_mime_type = magic.from_file(temp_path, mime=True)

        # Validate MIME type is allowed
        if actual_mime_type not in allowed_types:
            raise FileSecurityError(f"File type {actual_mime_type} not allowed")

        # Validate file extension matches MIME type
        if ext not in allowed_types[actual_mime_type]:
            raise FileSecurityError(
                f"File extension {ext} does not match content type {actual_mime_type}"
            )

        # Check file size
        file_size = os.path.getsize(temp_path)
        max_size = MAX_FILE_SIZES.get(actual_mime_type, 10 * 1024 * 1024)  # Default 10MB

        if file_size > max_size:
            raise FileSecurityError(f"File size {file_size} exceeds maximum {max_size} bytes")

        # Content validation
        validate_file_content(temp_path, actual_mime_type)

        # Malicious pattern scanning (skips binary files)
        scan_for_malicious_patterns(temp_path, actual_mime_type)

        # Virus scanning
        scan_with_clamav(temp_path)

        return safe_filename, actual_mime_type

    finally:
        # Clean up temporary file
        try:
            os.unlink(temp_path)
        except OSError:
            pass


def get_file_hash(file_path: str) -> str:
    """
    Generate SHA-256 hash of file for integrity checking.

    Args:
        file_path: Path to file

    Returns:
        Hexadecimal hash string
    """
    sha256_hash = hashlib.sha256()

    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)

    return sha256_hash.hexdigest()


def create_secure_upload_directory(base_path: str, user_id: str) -> str:
    """
    Create secure upload directory with proper permissions.

    Args:
        base_path: Base upload directory
        user_id: User ID for directory isolation

    Returns:
        Path to created directory
    """
    # Create user-specific directory
    user_dir = os.path.join(base_path, f"user_{hashlib.md5(str(user_id).encode()).hexdigest()}")

    os.makedirs(user_dir, mode=0o750, exist_ok=True)

    return user_dir
