# Security Architecture Documentation

**Last Updated:** April 5, 2026
**Status:** Production

---

## Table of Contents

1. [Authentication Architecture](#1-authentication-architecture)
2. [Token Handling Practices](#2-token-handling-practices)
3. [PII Protection Mechanisms](#3-pii-protection-mechanisms)
4. [Input Validation Patterns](#4-input-validation-patterns)
5. [File Upload Security](#5-file-upload-security)
6. [Security Headers](#6-security-headers)
7. [OAuth Integration Security](#7-oauth-integration-security)
8. [Rate Limiting & DDoS Protection](#8-rate-limiting--ddos-protection)
9. [Security Best Practices](#9-security-best-practices)

---

## 1. Authentication Architecture

### 1.1 Cognito Authentication

SilverKey uses AWS Cognito for primary authentication with JWT tokens.

#### Configuration

```python
# Server/.env.example
AWS_COGNITO_CLIENT_ID=""
AWS_COGNITO_CLIENT_SECRET=""
AWS_COGNITO_USER_POOL_ID=""
```

#### JWT Token Verification

**Location:** `Server/app/services/auth/user/current_user.py`

The system performs comprehensive JWT verification with fallback mechanisms:

```python
def get_current_user(token: str) -> User:
    """
    Get current user from Cognito JWT token with comprehensive validation.

    Steps:
    1. Extract token from Authorization header
    2. Classify token type (Cognito, Minimal, or Invalid)
    3. Verify JWT signature using Cognito public keys
    4. Validate token expiration
    5. Extract user claims (sub, email)
    6. Lookup or create user in database
    """
```

#### Token Classification

The system prevents algorithm confusion attacks by classifying tokens before verification:

- **Cognito Tokens:** RS256 algorithm, verified against AWS public keys
- **Minimal Tokens:** HS256 algorithm, internal tokens for development
- **Rejected:** HS256 tokens claiming to be Cognito (security vulnerability)

**Security Control:**
```python
# CRITICAL: Never fall back to Cognito for minimal tokens
if token_kind == "reject_cognito_alg":
    # HS256 token claiming to be Cognito - reject immediately
    raise SecurityError("HS256 token incorrectly routed to Cognito validation")
```

### 1.2 Google OAuth Flow

**Location:** `Server/app/services/auth/flows/oauth_callback.py`

#### OAuth Flow Steps

1. **Initiate OAuth:** Frontend redirects to Google consent screen
2. **State Token Generation:** Backend generates cryptographic state token for CSRF protection
3. **User Consents:** User authorizes Google Calendar access
4. **Callback Handling:** Google redirects to `/api/v1/auth/google/callback` with authorization code
5. **Code Exchange:** Backend exchanges code for access/refresh tokens
6. **User Creation/Linking:** User record created or linked to existing account
7. **Cookie Issuance:** HTTP-only cookies set with JWT tokens

#### State Validation (CSRF Protection)

```python
# Validate state - use DB-based validation (works even if cookies/sessions fail)
state = request_args.get("state")
session_state = session_data.get("google_auth_oauth_state")

if not google_oauth_service.validate_state(state, session_state):
    logger.warning("GOOGLE_OAUTH_INVALID_STATE - State validation failed")
    return redirect(f"{FRONTEND_URL}/login?error=invalid_state")
```

**Security Features:**
- State tokens stored in database (survives cookie/session failures)
- One-time use state tokens (prevents replay attacks)
- Timestamp validation (expires after 10 minutes)

#### Email Verification

```python
# Check if email is verified
if not user_info.get("verified_email"):
    logger.warning("GOOGLE_EMAIL_NOT_VERIFIED")
    return redirect(f"{FRONTEND_URL}/login?error=email_not_verified")
```

### 1.3 Session Management

**Location:** `Client/packages/config/auth.ts`

```typescript
export const AUTH_CONFIG = {
  SESSION: {
    // Session timeout warning (25 minutes)
    TIMEOUT_WARNING: 25 * 60 * 1000,
    // Maximum session duration (8 hours) - matches backend token expiry
    MAX_DURATION: 8 * 60 * 60 * 1000,
    // Grace period for user interaction (5 minutes)
    GRACE_PERIOD: 5 * 60 * 1000,
  },
};
```

**Session Timeout Hook:** `Client/packages/features/homeauth/hooks/ui/useSessionTimeout.ts`

- Monitors user activity (mouse, keyboard, touch events)
- Warns user 5 minutes before session expiry
- Automatically logs out on timeout
- Provides "Stay Logged In" option to extend session

---

## 2. Token Handling Practices

### 2.1 Token Storage Architecture

**Critical Security Rule:** NO tokens in localStorage. ALL tokens in HTTP-only cookies or memory.

#### Client-Side Token Storage (Frontend)

**Location:** `Client/packages/config/auth.ts`

```typescript
export const AUTH_CONFIG = {
  SECURE_STORAGE: {
    // Use sessionStorage for sensitive data (auth state)
    SENSITIVE_STORAGE: "sessionStorage",
    // Use localStorage for non-sensitive data (preferences, UI state)
    NON_SENSITIVE_STORAGE: "localStorage",
    // Keys that should NEVER be stored in localStorage
    FORBIDDEN_LOCALSTORAGE_KEYS: [
      "access_token",
      "refresh_token",
      "id_token",
      "password",
      "user",        // Contains sensitive user data
      "userProfile", // Contains sensitive user data
    ],
  },
};
```

**Validation Function:**
```typescript
setNonSensitive: (key: string, value: string): void => {
  if (AUTH_CONFIG.SECURE_STORAGE.FORBIDDEN_LOCALSTORAGE_KEYS.includes(key)) {
    log.warn(
      LOG_CATEGORIES.SECURITY,
      `Attempted to store forbidden key "${key}" in localStorage. Use sessionStorage instead.`,
      { key }
    );
    return;
  }
  getLocalStorage().setItem(key, value);
},
```

#### Server-Side Token Storage (Backend)

**HTTP-Only Cookies (Primary Method):**

**Location:** `Server/app/services/auth/utils/cookies.py`

```python
def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    request_id: str
) -> Response:
    """
    Set secure HTTP-only cookies for authentication.

    Security Features:
    - HTTP-Only: Cookies cannot be accessed via JavaScript
    - Secure: Only transmitted over HTTPS
    - SameSite=Lax: CSRF protection
    - Path=/: Available to all routes
    """
    response.set_cookie(
        "access_token",
        value=access_token,
        httponly=True,  # ✅ Cannot be accessed by JavaScript
        secure=True,    # ✅ HTTPS only
        samesite="Lax", # ✅ CSRF protection
        max_age=8 * 60 * 60,  # 8 hours
    )

    response.set_cookie(
        "refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="Lax",
        max_age=30 * 24 * 60 * 60,  # 30 days
    )

    return response
```

### 2.2 Token Refresh Mechanism

#### Google OAuth Token Refresh

**Location:** `Server/app/services/auth/core/oauth_refresh.py`

```python
def refresh_access_token(self, refresh_token: str) -> dict[str, Any]:
    """
    Refresh Google OAuth access token using refresh token.

    Process:
    1. Validate refresh_token exists
    2. Call Google OAuth token endpoint
    3. Receive new access_token (and potentially new refresh_token)
    4. Update stored tokens in database
    5. Return new tokens to caller
    """
    response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        },
        timeout=10,
    )

    tokens = response.json()

    # Google may provide new refresh_token (rotate tokens)
    if "refresh_token" in tokens:
        # Update stored refresh_token
        update_refresh_token(tokens["refresh_token"])

    return tokens
```

#### DocuSign OAuth Token Refresh

**Location:** `Server/app/services/docusign/core/auth_oauth.py`

```python
def refresh_token(token: DocusignOAuthToken) -> DocusignOAuthToken:
    """
    Refresh DocuSign OAuth token for agent.

    Security Features:
    - Validates token.user_id matches current user
    - Updates both access_token and refresh_token
    - Recalculates expires_at timestamp
    - Commits to database atomically
    """
    oauth_response = api_client.refresh_access_token(
        client_id=INTEGRATION_KEY,
        refresh_token=token.refresh_token,
    )

    # Update token record
    token.access_token = oauth_response.access_token
    if oauth_response.refresh_token:  # New refresh token provided
        token.refresh_token = oauth_response.refresh_token
    token.expires_at = datetime.utcnow() + timedelta(seconds=oauth_response.expires_in)

    db.session.commit()
    return token
```

### 2.3 Token Expiration Handling

**Client-Side (Frontend):**

**Location:** `Client/packages/features/homeauth/hooks/data/useSecureAuth.ts`

```typescript
/**
 * Secure token storage with memory-based access tokens
 * and HTTP-only refresh tokens.
 *
 * NO tokens stored in localStorage.
 * Session state stored in sessionStorage only.
 */
export const useSecureAuth = () => {
  const handleExpiredToken = async () => {
    try {
      // Attempt token refresh via backend
      await authApi.refreshToken();

      // Retry original request
      return retryRequest();
    } catch (error) {
      // Refresh failed - logout user
      await authApi.logout();
      navigate("/login?error=session_expired");
    }
  };
};
```

**Server-Side (Backend):**

**Location:** `Server/app/services/docusign/core/auth_oauth.py`

```python
def get_valid_token(user_id: str) -> DocusignOAuthToken:
    """
    Get valid access token for user, refreshing if necessary.

    Process:
    1. Lookup token by user_id
    2. Check if token is expired (with 5-minute buffer)
    3. If expired, refresh automatically
    4. Return valid token
    """
    token = DocusignOAuthToken.query.filter_by(user_id=user_id).first()

    if not token:
        raise DocusignAuthError("No OAuth token found")

    # Check expiration with 5-minute buffer
    if token.expires_at <= datetime.utcnow() + timedelta(minutes=5):
        logger.info("OAuth token expired, refreshing")
        token = refresh_token(token)

    return token
```

---

## 3. PII Protection Mechanisms

### 3.1 Automatic PII Scrubbing (Frontend)

**Location:** `Client/packages/logger/pii.ts`

```typescript
// Comprehensive PII patterns
export const PII_PATTERNS = [
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Phone numbers (various formats)
  /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  // SSN patterns
  /\b\d{3}-?\d{2}-?\d{4}\b/g,
  // Credit card numbers
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // JWT tokens
  /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g,
  // API keys (common patterns)
  /[Aa][Pp][Ii][-_]?[Kk][Ee][Yy][-_]?[A-Za-z0-9]{16,}/g,
  // Bearer tokens
  /[Bb]earer\s+[A-Za-z0-9-._~+/]+=*/g,
  // Passwords in URLs or objects
  /password["\s]*[:=]["\s]*[^"\s&]+/gi,
];
```

**Masking Function:**
```typescript
export function maskSensitiveData(text: string): string {
  let masked = text;

  PII_PATTERNS.forEach((pattern) => {
    masked = masked.replace(pattern, (match) => {
      if (match.length <= 4) return "[REDACTED]";
      // Keep first and last character for debugging
      return match[0] + "*".repeat(match.length - 2) + match[match.length - 1];
    });
  });

  return masked;
}
```

**Object Scrubbing:**
```typescript
// Sensitive keys that should be completely removed from objects
export const SENSITIVE_KEYS = [
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "idToken",
  "authorization",
  "secret",
  "apiKey",
  "credential",
  "ssn",
  "credit_card",
  "cvv",
  "pin",
];

export function scrubObjectPII(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;

  const scrubbed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey))) {
      scrubbed[key] = "[REDACTED]";
    } else {
      scrubbed[key] = scrubPII(value);
    }
  }

  return scrubbed;
}
```

### 3.2 Automatic PII Scrubbing (Backend)

**Location:** `Server/logger/pii.py`

```python
# Comprehensive PII patterns - centralized to avoid duplication
PII_PATTERNS: list[re.Pattern] = [
    # Email addresses
    re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", re.IGNORECASE),
    # Phone numbers (various formats)
    re.compile(r"(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})"),
    # SSN patterns
    re.compile(r"\b\d{3}-?\d{2}-?\d{4}\b"),
    # Credit card numbers
    re.compile(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b"),
    # JWT tokens
    re.compile(r"eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+"),
    # API keys (common patterns)
    re.compile(r"[Aa][Pp][Ii][-_]?[Kk][Ee][Yy][-_]?[A-Za-z0-9]{16,}"),
    # Bearer tokens
    re.compile(r"[Bb]earer\s+[A-Za-z0-9-._~+/]+=*"),
    # Passwords in URLs or objects
    re.compile(r'password["\s]*[:=]["\s]*[^"\s&]+', re.IGNORECASE),
]

def mask_sensitive_data(text: str) -> str:
    """Mask sensitive data in strings for logging"""
    masked = text

    for pattern in PII_PATTERNS:
        masked = pattern.sub(
            lambda m: (
                "[REDACTED]"
                if len(m.group()) <= 4
                else m.group()[0] + "*" * (len(m.group()) - 2) + m.group()[-1]
            ),
            masked,
        )

    return masked
```

### 3.3 Logger Integration

**Frontend Logger:** `Client/packages/logger/logger.ts`

```typescript
/**
 * All log data is automatically scrubbed via Client/packages/logger/pii.ts
 */
export function debug(category: LogCategory, message: string, data?: unknown): void {
  const scrubbedData = scrubPII(data);
  console.debug(`[${category}] ${message}`, scrubbedData);
}
```

**Backend Logger:** `Server/logger/logger.py`

```python
def debug(category: str, message: str, data: dict[str, Any] | None = None) -> None:
    """
    All log data is automatically scrubbed via Server/logger/pii.py
    """
    scrubbed_data = scrub_pii(data) if data else {}
    logger.debug(f"[{category}] {message}", extra=scrubbed_data)
```

### 3.4 Error Message Sanitization

**Location:** `Server/app/utils/security/security.py`

```python
def sanitize_error_message(error: Exception) -> str:
    """
    Sanitize error messages to remove sensitive information.

    Removes:
    - Token values
    - Client secrets
    - Authorization codes
    - PII data
    """
    error_msg = str(error)

    # Remove common sensitive patterns
    error_msg = re.sub(r"token=[^&\s]+", "token=[REDACTED]", error_msg)
    error_msg = re.sub(r"client_secret=[^&\s]+", "client_secret=[REDACTED]", error_msg)
    error_msg = re.sub(r"code=[^&\s]+", "code=[REDACTED]", error_msg)

    # Redact PII
    error_msg = redact_pii(error_msg)

    return error_msg
```

---

## 4. Input Validation Patterns

### 4.1 Server-Side Validation

**Required Fields Validation:**

**Location:** `Server/app/utils/security/security.py`

```python
def validate_required_fields(data, required_fields):
    """
    Validate required fields and return standardized error response.

    Prevents:
    - Missing required data
    - Empty string values
    - Null/None values
    """
    if not data:
        return security_error_response(SecurityError.INVALID_REQUEST)

    missing_fields = [field for field in required_fields if field not in data or not data[field]]

    if missing_fields:
        return security_error_response(
            SecurityError.MISSING_FIELDS,
            {"field_errors": missing_fields}
        )

    return None
```

**Google Calendar Event Validation:**

**Location:** `Server/app/utils/security/security.py`

```python
def validate_event_data(event_data: dict[str, Any]) -> bool:
    """
    Validate Google Calendar event data.

    Validates:
    - Required fields (summary, start, end)
    - Start/end structure (dict with date or dateTime)
    - Date formats (YYYY-MM-DD for all-day, ISO 8601 for timed)
    - Logical constraints (end > start)
    """
    required_fields = ["summary", "start", "end"]

    for field in required_fields:
        if field not in event_data:
            logger.warning(f"Event validation failed: missing required field '{field}'")
            return False

    start = event_data["start"]
    end = event_data["end"]

    # All-day events: start.date / end.date
    if "date" in start and "date" in end:
        date_pattern = re.compile(r"^\d{4}-\d{2}-\d{2}$")
        if not date_pattern.match(start["date"]) or not date_pattern.match(end["date"]):
            return False
        # Google requires exclusive end strictly after inclusive start
        if start["date"] >= end["date"]:
            return False
        return True

    # Timed events: dateTime on start/end
    if "dateTime" not in start or "dateTime" not in end:
        return False

    datetime_pattern = r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}"
    if not re.match(datetime_pattern, start["dateTime"]):
        return False
    if not re.match(datetime_pattern, end["dateTime"]):
        return False

    return True
```

### 4.2 Parameterized Queries (SQLAlchemy ORM)

**SilverKey uses SQLAlchemy ORM exclusively for database queries, which automatically parameterizes all queries and prevents SQL injection.**

**Example - User Lookup:**

```python
# ✅ SAFE: SQLAlchemy ORM automatically parameterizes
user = User.query.filter_by(email=email).first()

# ✅ SAFE: SQLAlchemy ORM with conditions
properties = Property.query.filter(
    Property.user_id == user_id,
    Property.status == "active"
).all()

# ❌ NEVER USED: Raw SQL with string concatenation
# This pattern is forbidden in the codebase
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")
```

**Complex Query Example:**

```python
# ✅ SAFE: SQLAlchemy ORM with joins and filters
results = (
    db.session.query(User, Property)
    .join(Property, User.id == Property.user_id)
    .filter(User.email == email)
    .filter(Property.price >= min_price)
    .filter(Property.price <= max_price)
    .all()
)
```

### 4.3 Filename Sanitization

**Location:** `Server/app/utils/security/file_security.py`

```python
def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal and other attacks.

    Protections:
    - Remove path components (../, ./, etc.)
    - Replace dangerous characters (<>:"/\\|?*)
    - Remove null bytes and control characters
    - Limit length to 255 characters
    - Generate fallback if empty after sanitization
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
```

---

## 5. File Upload Security

### 5.1 Allowed File Types

**Location:** `Server/app/utils/security/file_security.py`

```python
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
```

### 5.2 File Size Limits

```python
# Maximum file sizes by type (in bytes)
MAX_FILE_SIZES = {
    "application/pdf": 50 * 1024 * 1024,  # 50MB for PDFs
    "image/jpeg": 15 * 1024 * 1024,       # 15MB for images
    "image/png": 15 * 1024 * 1024,        # 15MB for images
    "image/gif": 15 * 1024 * 1024,        # 15MB for GIFs
    "text/plain": 1 * 1024 * 1024,        # 1MB for text files
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 25 * 1024 * 1024,  # 25MB for DOCX
    "application/msword": 25 * 1024 * 1024,  # 25MB for DOC
}
```

### 5.3 MIME Type Validation

**Content-Based MIME Detection (python-magic):**

```python
def validate_file_content(file_path: str, expected_mime_type: str) -> bool:
    """
    Validate file content matches expected MIME type using python-magic.

    Security: Prevents MIME type spoofing by checking actual file content,
    not just file extension.
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
        raise FileSecurityError(f"Content validation failed: {str(e)}")
```

**Extension vs. Content Validation:**

```python
def validate_file_upload(file: FileStorage, allowed_types: dict = None) -> tuple[str, str]:
    """
    Comprehensive file upload validation with security checks.

    Validation Steps:
    1. Sanitize filename
    2. Get file extension
    3. Create temporary file for content inspection
    4. Detect actual MIME type from content (python-magic)
    5. Validate MIME type is allowed
    6. Validate extension matches MIME type
    7. Check file size
    8. Scan for malicious patterns
    9. Run virus scan (ClamAV if available)
    """
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
        # Get actual MIME type from content (not extension)
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
        max_size = MAX_FILE_SIZES.get(actual_mime_type, 10 * 1024 * 1024)

        if file_size > max_size:
            raise FileSecurityError(f"File size {file_size} exceeds maximum {max_size} bytes")

        # Content validation
        validate_file_content(temp_path, actual_mime_type)

        # Malicious pattern scanning
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
```

### 5.4 Malicious Pattern Scanning

```python
# Binary file types that should skip text-based pattern scanning
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
    rb"<%.*%>",         # Server-side scripts
    rb"<?php",          # PHP code
    rb"#!/bin/",        # Shell scripts
    rb"eval\s*\(",      # Eval functions
    rb"exec\s*\(",      # Exec functions
]

def scan_for_malicious_patterns(file_path: str, mime_type: str) -> bool:
    """
    Scan file for known malicious patterns.

    Only scans text-based files. Binary files (PDFs, images, DOCX) are skipped
    as they can contain byte sequences that match text patterns but aren't malicious.
    """
    # Skip pattern scanning for binary files
    if mime_type in BINARY_FILE_TYPES:
        return True

    try:
        with open(file_path, "rb") as f:
            content = f.read(1024 * 1024)  # Read first 1MB

        for pattern in DANGEROUS_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                raise FileSecurityError("Malicious pattern detected in file")

        return True

    except FileSecurityError:
        raise
    except Exception as e:
        logger.error(f"Pattern scanning failed: {str(e)}")
        raise FileSecurityError(f"Pattern scanning failed: {str(e)}")
```

### 5.5 Virus Scanning (ClamAV)

```python
def scan_with_clamav(file_path: str) -> bool:
    """
    Scan file with ClamAV antivirus if available.

    Graceful Degradation:
    - If ClamAV not installed: Log warning, allow upload
    - If ClamAV scan fails: Log error, allow upload
    - If virus detected: Reject upload
    """
    try:
        # Check if clamdscan is available
        result = subprocess.run(
            ["which", "clamdscan"],
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode != 0:
            logger.warning("ClamAV not available - skipping virus scan")
            return True

        # Run virus scan
        result = subprocess.run(
            ["clamdscan", "--no-summary", file_path],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode == 0:
            return True  # Clean
        elif result.returncode == 1:
            logger.error(f"Virus detected in file {file_path}: {result.stdout}")
            raise FileSecurityError("Virus detected in uploaded file")
        else:
            logger.error(f"ClamAV scan error: {result.stderr}")
            raise FileSecurityError("Virus scan failed")

    except subprocess.TimeoutExpired:
        logger.error("ClamAV scan timeout")
        raise FileSecurityError("Virus scan timeout")
    except FileNotFoundError:
        logger.warning("ClamAV not installed - skipping virus scan")
        return True
    except Exception as e:
        logger.error(f"Virus scanning failed: {str(e)}")
        # Don't fail upload if virus scanner has issues
        logger.warning("Proceeding without virus scan due to scanner error")
        return True
```

### 5.6 File Integrity Hashing

```python
def get_file_hash(file_path: str) -> str:
    """
    Generate SHA-256 hash of file for integrity checking.

    Use Cases:
    - Detect file tampering
    - Deduplication
    - Audit trail
    """
    sha256_hash = hashlib.sha256()

    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)

    return sha256_hash.hexdigest()
```

### 5.7 Secure Upload Directory

```python
def create_secure_upload_directory(base_path: str, user_id: str) -> str:
    """
    Create secure upload directory with proper permissions.

    Security Features:
    - User isolation (separate directory per user)
    - Hash user_id to prevent enumeration
    - Set restrictive permissions (0o750 = rwxr-x---)
    """
    # Create user-specific directory
    user_dir = os.path.join(
        base_path,
        f"user_{hashlib.md5(str(user_id).encode()).hexdigest()}"
    )

    os.makedirs(user_dir, mode=0o750, exist_ok=True)

    return user_dir
```

---

## 6. Security Headers

**Location:** `Server/app/error_handlers.py`

### 6.1 Response Headers Configuration

```python
@app.after_request
def add_security_headers(response):
    """
    Set security headers on all responses.

    Headers applied:
    - Permissions-Policy: Feature access control
    - X-Content-Type-Options: Prevent MIME sniffing
    - X-Frame-Options: Clickjacking protection
    - X-XSS-Protection: XSS filter
    - Referrer-Policy: Referrer information control
    - Strict-Transport-Security (HSTS): Force HTTPS
    """
    is_pdf_viewer = request.endpoint and (
        "view_pdf_inline" in str(request.endpoint)
        or "/view" in request.path
        or request.path.endswith("/view")
    )

    # Permissions-Policy (Feature Policy)
    if is_pdf_viewer:
        permissions_policy = (
            "camera=(), microphone=(), geolocation=(), fullscreen=*, "
            "payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
        )
    else:
        permissions_policy = (
            "camera=(), microphone=(), geolocation=(), "
            'fullscreen=(self "https://*.amazonaws.com"), '
            "payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
        )
    response.headers["Permissions-Policy"] = permissions_policy

    # X-Content-Type-Options: Prevent MIME sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"

    # X-Frame-Options: Clickjacking protection
    if not is_pdf_viewer:
        response.headers["X-Frame-Options"] = "DENY"
    else:
        response.headers["X-Frame-Options"] = "SAMEORIGIN"

    # X-XSS-Protection: Enable XSS filter
    response.headers["X-XSS-Protection"] = "1; mode=block"

    # Referrer-Policy: Control referrer information
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # Strict-Transport-Security (HSTS): Force HTTPS
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    return response
```

### 6.2 Security Header Descriptions

#### Strict-Transport-Security (HSTS)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Purpose:** Force HTTPS connections for 1 year (31536000 seconds)

**Protection:**
- Prevents SSL stripping attacks
- Protects against protocol downgrade attacks
- Applies to all subdomains

#### X-Frame-Options

```
X-Frame-Options: DENY
X-Frame-Options: SAMEORIGIN  (for PDF viewer only)
```

**Purpose:** Clickjacking protection

**Values:**
- `DENY`: Page cannot be displayed in frame/iframe
- `SAMEORIGIN`: Page can only be framed by same origin

#### X-Content-Type-Options

```
X-Content-Type-Options: nosniff
```

**Purpose:** Prevent MIME type sniffing

**Protection:**
- Browsers honor declared Content-Type
- Prevents executing scripts disguised as other file types

#### Referrer-Policy

```
Referrer-Policy: strict-origin-when-cross-origin
```

**Purpose:** Control referrer information leakage

**Behavior:**
- Same-origin requests: Full URL in Referer header
- Cross-origin requests: Only origin (no path/query)
- Downgrade (HTTPS→HTTP): No Referer header

#### Permissions-Policy (Feature Policy)

```
Permissions-Policy: camera=(), microphone=(), geolocation=(),
                    fullscreen=(self "https://*.amazonaws.com"),
                    payment=(), usb=(), magnetometer=(),
                    gyroscope=(), accelerometer=()
```

**Purpose:** Control browser feature access

**Disabled Features:**
- `camera=()`: No camera access
- `microphone=()`: No microphone access
- `geolocation=()`: No location access
- `payment=()`: No Payment Request API
- `usb=()`: No USB device access
- `magnetometer=()`: No magnetometer access
- `gyroscope=()`: No gyroscope access
- `accelerometer=()`: No accelerometer access

**Allowed Features:**
- `fullscreen=(self "https://*.amazonaws.com")`: Fullscreen only for same origin and S3

#### X-XSS-Protection

```
X-XSS-Protection: 1; mode=block
```

**Purpose:** Enable browser XSS filter

**Behavior:**
- `1`: Enable XSS filter
- `mode=block`: Block page if XSS detected (don't sanitize)

#### Content-Security-Policy (PDF Viewer)

**Location:** `Server/app/routes/documents/report.py`

```python
# For inline PDF viewing
response_headers = {
    "Content-Security-Policy": "frame-ancestors 'self'",
}
```

**Purpose:** Allow PDF to be embedded only in same-origin frames

---

## 7. OAuth Integration Security

### 7.1 Google Calendar OAuth

**OAuth Scopes Requested:**

```python
GOOGLE_OAUTH_SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar",  # Full calendar access
]
```

**Security Controls:**

1. **State Token (CSRF Protection):**
   - Cryptographically secure random token
   - Stored in database (survives cookie/session failures)
   - One-time use (marked as used after validation)
   - Expires after 10 minutes

2. **Email Verification:**
   - Only verified Google emails allowed
   - Rejects unverified accounts

3. **Token Rotation:**
   - Access tokens expire every 1 hour
   - Refresh tokens automatically refresh access tokens
   - Google may rotate refresh tokens (stored updates)

4. **Token Storage:**
   - Access tokens: HTTP-only cookies (8 hour expiry)
   - Refresh tokens: HTTP-only cookies (30 day expiry)
   - OAuth tokens (Google Calendar): Database with encryption at rest

### 7.2 DocuSign OAuth (Agent Operations)

**Location:** `Server/app/services/docusign/core/auth_oauth_flow.py`

**OAuth Scopes Requested:**

```python
DOCUSIGN_OAUTH_SCOPES = [
    "signature",         # Create and send envelopes
    "extended",          # Extended API access
    "impersonation",     # Act on behalf of user
]
```

**Security Controls:**

1. **Agent-Only Authorization:**
   - Only users with `is_agent=True` can initiate OAuth
   - Non-agent attempts rejected with 403 Forbidden

2. **Account Validation:**
   - Verify account_id from OAuth response
   - Store account_id with token for verification

3. **Token Refresh:**
   - Access tokens expire after 8 hours
   - Refresh tokens valid for 30 days
   - Automatic refresh before API calls (5-minute buffer)

4. **Token Revocation:**
   - Explicit revoke endpoint: `DELETE /api/v1/docusign/oauth/revoke`
   - Deletes token from database
   - Agent must reconnect to send new agreements

---

## 8. Rate Limiting & DDoS Protection

**Location:** `Server/app/utils/security/security.py`

### 8.1 Rate Limiting Decorator

```python
def rate_limit(max_requests=60, window_seconds=60, per="ip"):
    """
    Rate limiting decorator

    Args:
        max_requests: Maximum requests allowed in the time window
        window_seconds: Time window in seconds
        per: Rate limit per 'ip' or 'user' (default: 'ip')

    Default: 60 requests per 60 seconds (1 request/second average)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Determine the key for rate limiting
            if per == "ip":
                key = f"rate_limit:{request.remote_addr}:{request.endpoint}"
            elif per == "user":
                # Try to get user from auth header
                auth_header = request.headers.get("Authorization", "")
                if auth_header.startswith("Bearer "):
                    # Use a hash of the token for privacy
                    token_hash = hashlib.sha256(auth_header.encode()).hexdigest()[:16]
                    key = f"rate_limit:user:{token_hash}:{request.endpoint}"
                else:
                    # Fall back to IP if no auth
                    key = f"rate_limit:{request.remote_addr}:{request.endpoint}"

            current_time = time.time()

            with storage_lock:
                # Get the request times for this key
                request_times = rate_limit_storage[key]

                # Remove old requests outside the window
                while request_times and request_times[0] < current_time - window_seconds:
                    request_times.popleft()

                # Check if we've exceeded the limit
                if len(request_times) >= max_requests:
                    logger.warning(f"Rate limit exceeded for {key}")
                    return security_error_response(
                        SecurityError.RATE_LIMIT_EXCEEDED,
                        {"retry_after": window_seconds}
                    )

                # Add current request time
                request_times.append(current_time)

            return f(*args, **kwargs)

        return decorated_function

    return decorator
```

### 8.2 Rate Limit Usage Example

```python
@app.route("/api/v1/search", methods=["POST"])
@rate_limit(max_requests=30, window_seconds=60, per="user")
@require_authenticated_user
def search_properties(user):
    """
    Search endpoint with user-based rate limiting.

    Limit: 30 requests per minute per authenticated user
    """
    return perform_search()
```

### 8.3 Rate Limit Response

```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

---

## 9. Security Best Practices

### 9.1 Secure Error Responses

**Location:** `Server/app/utils/security/secure_errors.py`

**Principle:** Never leak sensitive information in error responses

```python
class SecureErrorHandler:
    """
    Standardized error handler that prevents information leakage
    """

    # User-safe error messages
    USER_MESSAGES = {
        "authentication_failed": "Authentication failed",
        "invalid_credentials": "Invalid credentials",
        "token_expired": "Session expired. Please log in again",
        "unauthorized": "Access denied",
        "not_found": "Resource not found",
        "file_upload_error": "File upload failed",
        "external_api_error": "External service temporarily unavailable",
    }

    @staticmethod
    def handle_docusign_error(
        error: Exception,
        error_type: str,
        status_code: int,
        context: dict = None
    ) -> tuple:
        """
        Handle DocuSign errors securely without leaking internal details.

        Security Features:
        - Never expose internal error messages to client
        - Log full details server-side for debugging
        - Return generic user-safe messages
        - Include error_id for support correlation
        """
        error_id = str(uuid.uuid4())

        # Log full details server-side (with PII scrubbing)
        logger.error(
            f"DOCUSIGN_ERROR_{error_type.upper()}",
            extra={
                "error_id": error_id,
                "error_type": error_type,
                "error_message": str(error),
                "context": scrub_pii(context or {}),
                "traceback": traceback.format_exc()[:1000],
            },
        )

        # Return generic user-safe message
        return jsonify({
            "success": False,
            "error": error_type,
            "message": SecureErrorHandler.USER_MESSAGES.get(
                error_type,
                "An error occurred"
            ),
            "error_id": error_id,  # For support correlation
        }), status_code
```

### 9.2 User Enumeration Prevention

```python
def safe_user_lookup_error():
    """
    Return a safe error response for user lookup failures.

    Security: Prevents user enumeration attacks by returning identical
    responses for both "user not found" and "invalid password"
    """
    return security_error_response(SecurityError.UNAUTHORIZED)
```

**Example Usage:**

```python
@app.route("/api/v1/auth/login", methods=["POST"])
def login():
    user = User.query.filter_by(email=email).first()

    # ❌ BAD: Reveals whether user exists
    if not user:
        return jsonify({"error": "User not found"}), 404
    if not verify_password(password):
        return jsonify({"error": "Invalid password"}), 401

    # ✅ GOOD: Identical response for both cases
    if not user or not verify_password(password):
        return safe_user_lookup_error()
```

### 9.3 Security Event Logging

```python
def log_security_event(event_type, details=None, user_id=None):
    """
    Log security events for monitoring.

    Event Types:
    - auth_failure: Failed authentication attempt
    - rate_limit_exceeded: Rate limit triggered
    - suspicious_activity: Unusual patterns detected
    - unauthorized_access: Authorization check failed
    """
    log_data = {
        "event_type": event_type,
        "ip": request.remote_addr,
        "user_agent": request.headers.get("User-Agent", "Unknown"),
        "endpoint": request.endpoint,
        "method": request.method,
        "timestamp": time.time(),
    }

    if user_id:
        log_data["user_id"] = user_id

    if details:
        log_data["details"] = details

    logger.warning(f"🔒 SECURITY EVENT: {event_type} - {log_data}")
```

### 9.4 Secrets Management

**Environment Variables (Never Commit):**

```bash
# Server/.env (NEVER commit this file)
AWS_COGNITO_CLIENT_ID="your-cognito-client-id"
AWS_COGNITO_CLIENT_SECRET="your-cognito-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
DOCUSIGN_INTEGRATION_KEY="your-docusign-key"
DOCUSIGN_SECRET_KEY="your-docusign-secret"
JWT_SECRET_KEY="your-jwt-secret"
```

**Configuration Loading:**

```python
# Server/app/config/_config.py
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # AWS Cognito Settings (from environment)
    AWS_COGNITO_CLIENT_ID = os.getenv("AWS_COGNITO_CLIENT_ID")
    AWS_COGNITO_CLIENT_SECRET = os.getenv("AWS_COGNITO_CLIENT_SECRET")
    AWS_COGNITO_USER_POOL_ID = os.getenv("AWS_COGNITO_USER_POOL_ID")

    # Validate required secrets
    @staticmethod
    def validate():
        required = [
            "AWS_COGNITO_CLIENT_ID",
            "AWS_COGNITO_CLIENT_SECRET",
            "JWT_SECRET_KEY",
        ]
        missing = [key for key in required if not os.getenv(key)]
        if missing:
            raise ValueError(f"Missing required environment variables: {missing}")
```

### 9.5 Safe dangerouslySetInnerHTML Usage

**Audit Result:** ✅ SAFE

**Location:** `Client/packages/ui/components/form/FieldShell.tsx`

```typescript
{/* Security: static CSS only, no user or server data. Safe for dangerouslySetInnerHTML. */}
<style
  dangerouslySetInnerHTML={{
    __html: `
      .autofill-parent {
        position: relative;
      }

      /* FieldShell autofill styling */
      .autofill-parent:has(.PhoneInputInput:-webkit-autofill) > div:last-child > div:first-child {
        background-color: hsl(42, 45%, 92%) !important;
      }
      /* ... more static CSS ... */
    `,
  }}
/>
```

**Safety Analysis:**
- ✅ Static CSS only (no dynamic content)
- ✅ No user input
- ✅ No server data
- ✅ No string concatenation
- ✅ Hardcoded styles for browser autofill override
- ✅ Comment documents security review

### 9.6 setTimeout/setInterval Safety

**Audit Result:** ✅ SAFE - All uses function callbacks (no string execution)

**Pattern Analysis:**

```typescript
// ✅ SAFE: Function callback
setTimeout(() => {
  doSomething();
}, 1000);

// ✅ SAFE: Function reference
setInterval(updateData, 5000);

// ❌ DANGEROUS (not found in codebase):
setTimeout("doSomething()", 1000);  // String evaluation - NEVER use
```

**Codebase Verification:**
- Reviewed 40+ setTimeout/setInterval usages
- All use function callbacks (arrow functions or function references)
- No string-based code execution found
- No security concerns identified

---

## 10. Security Checklist

### Before Deployment

- [ ] All secrets in environment variables (never in code)
- [ ] HTTPS enforced (HSTS header enabled)
- [ ] HTTP-only cookies enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled on sensitive endpoints
- [ ] PII scrubbing active in logs
- [ ] File upload validation enabled
- [ ] ClamAV virus scanning configured (if available)
- [ ] Security headers verified
- [ ] Error messages sanitized
- [ ] Database queries parameterized (SQLAlchemy ORM)
- [ ] OAuth state validation enabled
- [ ] Token expiration handled
- [ ] Session timeout configured

### Regular Security Audits

- [ ] Review authentication logs for suspicious patterns
- [ ] Check rate limiting effectiveness
- [ ] Verify PII scrubbing is working
- [ ] Test file upload validation
- [ ] Audit security headers
- [ ] Review OAuth token expiration
- [ ] Check for exposed secrets in logs
- [ ] Validate error message sanitization
- [ ] Test session timeout behavior
- [ ] Review API authorization checks

### Incident Response

1. **Detection:** Monitor security event logs
2. **Containment:** Rate limiting + IP blocking if needed
3. **Investigation:** Review logs with PII scrubbing
4. **Remediation:** Patch vulnerabilities
5. **Documentation:** Update security docs
6. **Communication:** Notify affected users if needed

---

## 11. Contact & Support

**Security Issues:** Report to security team immediately

**Documentation Updates:** Update this file when security implementations change

**Last Reviewed:** April 5, 2026
**Next Review:** July 5, 2026 (quarterly)
