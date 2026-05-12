import os
import tempfile

# Absolute path under the OS temp dir so dev servers never create ./uploads inside Server/.
UPLOAD_FOLDER_DEFAULT = os.path.join(tempfile.gettempdir(), "silverkey-uploads")
MAX_CONTENT_LENGTH_DEFAULT = 16 * 1024 * 1024
ALLOWED_FILE_TYPES_DEFAULT = {"application/pdf"}
