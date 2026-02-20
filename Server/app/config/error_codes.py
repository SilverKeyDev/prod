def build_error_codes(max_content_length: int):
    return {
        "FILE_TYPE_INVALID": (
            "INVALID_FILE_TYPE",
            "Invalid file type. Only PDF files are allowed.",
        ),
        "FILE_SIZE_TOO_LARGE": (
            "FILE_SIZE_EXCEEDED",
            f"File size exceeds maximum limit of {max_content_length // (1024 * 1024)}MB.",
        ),
        "FILE_SAVE_ERROR": ("FILE_SAVE_FAILED", "Failed to save file."),
        "PDF_PROCESS_ERROR": ("PDF_PROCESS_FAILED", "Failed to process PDF file."),
        "AUTH_ERROR": ("AUTHENTICATION_FAILED", "Authentication failed."),
        "NOT_FOUND": ("RESOURCE_NOT_FOUND", "Resource not found."),
        "INVALID_REQUEST": ("INVALID_REQUEST", "Invalid request data."),
        "SERVER_ERROR": ("SERVER_ERROR", "Internal server error."),
        "FILE_NOT_FOUND": ("FILE_NOT_FOUND", "The requested file was not found."),
        "S3_UPLOAD_ERROR": ("S3_UPLOAD_FAILED", "Failed to upload file to S3."),
        "S3_DOWNLOAD_ERROR": ("S3_DOWNLOAD_FAILED", "Failed to generate download URL from S3."),
    }


__all__ = ["build_error_codes"]
