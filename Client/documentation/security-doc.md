# Security Documentation

## Overview

SilverKey implements comprehensive security measures across both client and server components to protect user data, ensure secure authentication, and prevent common web vulnerabilities. This document outlines the security architecture, implemented controls, and best practices.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Data Protection](#data-protection)
3. [Network Security](#network-security)
4. [File Upload Security](#file-upload-security)
5. [Input Validation & Sanitization](#input-validation--sanitization)
6. [Rate Limiting & DoS Protection](#rate-limiting--dos-protection)
7. [Error Handling & Logging](#error-handling--logging)
8. [Security Headers](#security-headers)
9. [Dependencies & Supply Chain](#dependencies--supply-chain)
10. [Security Monitoring](#security-monitoring)
11. [Compliance & Standards](#compliance--standards)

---

## Authentication & Authorization

### AWS Cognito Integration

SilverKey uses AWS Cognito for user authentication, providing enterprise-grade security features:

- **JWT Token Management**: Secure token generation, validation, and refresh
- **Multi-Factor Authentication**: Support for MFA through Cognito
- **Password Policies**: Enforced password complexity requirements
- **Account Lockout**: Protection against brute force attacks

### Token Security

```typescript
// Client-side token storage (memory-based)
const [accessToken, setAccessToken] = useState<string | null>(null);

// Secure token storage in sessionStorage (not localStorage)
sessionStorage.setItem(
  AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
  response.access_token,
);
```

**Security Features:**

- Tokens stored in memory as primary storage
- SessionStorage used for persistence across page refreshes
- Automatic token refresh handling
- Secure token validation on server-side

### Authentication Flow

1. **Login**: User credentials validated against Cognito
2. **Token Generation**: JWT tokens issued by Cognito
3. **Token Validation**: Server validates tokens on each request
4. **Token Refresh**: Automatic refresh before expiration
5. **Logout**: Secure token invalidation

### Authorization Levels

```typescript
// Route protection levels
PROTECTED_ROUTES: [
  "/dashboard",
  "/search",
  "/past-reports",
  "/compare-reports",
  "/saved-homes",
  "/personalization",
  "/generate-report",
  "/onboarding",
  "/offer-draft",
  "/negotiation",
  "/client-intel",
];
```

---

## Data Protection

### PII (Personally Identifiable Information) Security

SilverKey implements comprehensive PII protection:

```typescript
// PII detection patterns
export const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
  /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, // Phone
  /\b\d{3}-?\d{2}-?\d{4}\b/g, // SSN
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit Card
  /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g, // JWT Tokens
];
```

### Sensitive Data Handling

- **Automatic Detection**: PII patterns automatically detected in logs and data
- **Data Masking**: Sensitive information masked in logs and responses
- **Secure Storage**: Sensitive data encrypted at rest
- **Data Minimization**: Only necessary data collected and stored

### Database Security

- **Encrypted Connections**: SSL/TLS for database connections
- **Parameterized Queries**: Protection against SQL injection
- **Access Controls**: Role-based database access
- **Data Encryption**: Sensitive fields encrypted at rest

---

## Network Security

### HTTPS Enforcement

```python
# Security headers middleware
@app.after_request
def security_headers(response):
    # HTTPS enforcement
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
    return response
```

### API Security

- **RESTful Design**: Consistent API patterns
- **Request Validation**: All inputs validated and sanitized
- **Response Sanitization**: Sensitive data removed from responses
- **Error Handling**: Secure error messages without information leakage

---

## File Upload Security

### Comprehensive File Validation

```python
# File type validation
ALLOWED_MIME_TYPES = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'text/plain': ['.txt'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/msword': ['.doc']
}

# File size limits
MAX_FILE_SIZES = {
    'application/pdf': 50 * 1024 * 1024,  # 50MB
    'image/jpeg': 10 * 1024 * 1024,       # 10MB
    'image/png': 10 * 1024 * 1024,
    'image/gif': 5 * 1024 * 1024,         # 5MB
}
```

### Security Measures

1. **MIME Type Validation**: Actual file content verified, not just extension
2. **File Size Limits**: Enforced per file type
3. **Malicious Pattern Scanning**: Detection of embedded scripts
4. **Virus Scanning**: ClamAV integration for malware detection
5. **Content Validation**: File structure and content verification
6. **Secure Storage**: Files stored in isolated, secure directories

### Upload Process

1. **Client Validation**: Basic validation on client-side
2. **Server Validation**: Comprehensive server-side validation
3. **Content Scanning**: Malware and malicious content detection
4. **Secure Storage**: Files stored with proper access controls
5. **Access Logging**: All upload activities logged

---

## Input Validation & Sanitization

### Client-Side Validation

```typescript
// Form validation with comprehensive checks
export const validateOnboardingData = (
  formData: OnboardingData,
): ValidationResult => {
  const missingFields: string[] = [];
  const errors: string[] = [];

  // Required field validation
  if (!formData.age || formData.age <= 0) {
    missingFields.push("Age");
  }
  // ... additional validations
};
```

### Server-Side Validation

```python
# Request validation decorator
def validate_json_request(required_fields=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # JSON validation
            if not request.is_json:
                return jsonify({'error': 'Content-Type must be application/json'}), 400

            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            # Required fields validation
            if required_fields:
                missing_fields = [field for field in required_fields if not data.get(field)]
                if missing_fields:
                    return jsonify({
                        'error': f'Missing required fields: {", ".join(missing_fields)}'
                    }), 400

            return f(data, *args, **kwargs)
        return decorated_function
    return decorator
```

### Data Sanitization

- **SQL Injection Prevention**: Parameterized queries used throughout
- **XSS Prevention**: Output encoding and CSP headers
- **CSRF Protection**: CSRF tokens and same-origin policy
- **Input Sanitization**: All user inputs cleaned and validated

---

## Rate Limiting & DoS Protection

### Rate Limiting Implementation

```python
@rate_limit(max_requests=60, window_seconds=60, per='ip')
def protected_endpoint():
    # Endpoint implementation
    pass
```

### Protection Features

- **IP-Based Limiting**: Rate limits per IP address
- **User-Based Limiting**: Rate limits per authenticated user
- **Endpoint-Specific**: Different limits for different endpoints
- **Exponential Backoff**: Automatic retry with increasing delays
- **Distributed Limiting**: Thread-safe rate limiting storage

### DoS Protection

- **Request Size Limits**: Maximum request and file sizes
- **Connection Limits**: Maximum concurrent connections
- **Resource Limits**: CPU and memory usage monitoring
- **Automatic Blocking**: Temporary blocking of abusive IPs

---

## Error Handling & Logging

### Secure Error Handling

```python
class SecurityError:
    """Standardized security error codes and messages"""

    UNAUTHORIZED = ("UNAUTHORIZED", "Authentication required", 401)
    INVALID_TOKEN = ("INVALID_TOKEN", "Authentication required", 401)
    TOKEN_EXPIRED = ("TOKEN_EXPIRED", "Authentication required", 401)
    FORBIDDEN = ("FORBIDDEN", "Access denied", 403)
    RATE_LIMIT_EXCEEDED = ("RATE_LIMIT_EXCEEDED", "Too many requests", 429)
```

### Logging Security

- **PII Filtering**: Sensitive data automatically filtered from logs
- **Security Event Logging**: All security events logged with context
- **Structured Logging**: Consistent log format for analysis
- **Log Rotation**: Automatic log rotation and archival
- **Access Logging**: All API access logged with user context

### Error Response Security

- **Generic Error Messages**: No sensitive information in error responses
- **Consistent Error Format**: Standardized error response structure
- **Error Code Mapping**: Internal error codes mapped to user-friendly messages
- **Debug Information**: Debug details only in development mode

---

## Security Headers

### Content Security Policy (CSP)

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://maps.googleapis.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
"
/>
```

### Additional Security Headers

```python
# Security headers applied to all responses
response.headers['X-Content-Type-Options'] = 'nosniff'
response.headers['X-Frame-Options'] = 'DENY'
response.headers['X-XSS-Protection'] = '1; mode=block'
response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
```

### Header Security Features

- **XSS Protection**: Browser XSS filtering enabled
- **Clickjacking Protection**: Frame embedding prevented
- **MIME Sniffing Prevention**: Content type sniffing disabled
- **Referrer Control**: Referrer information controlled
- **Feature Policy**: Browser features restricted

---

## Dependencies & Supply Chain

### Security Dependencies

```txt
# Security-focused packages
python-magic==0.4.27          # File type detection
PyJWT==2.8.0                  # JWT handling
python-jose[cryptography]==3.3.0  # JWT cryptography
pyOpenSSL==24.1.0             # SSL/TLS support
boto3==1.28.44                # AWS SDK
```

### Supply Chain Security

- **Dependency Scanning**: Regular vulnerability scanning
- **Version Pinning**: Exact version requirements
- **Security Updates**: Regular dependency updates
- **License Compliance**: Open source license tracking
- **Vulnerability Monitoring**: CVE monitoring and alerts

### Package Management

- **Requirements Locking**: Exact version pinning in requirements.txt
- **Dependency Tree**: Clear dependency relationships
- **Security Audits**: Regular security audits of dependencies
- **Update Strategy**: Controlled dependency updates

---

## Security Monitoring

### Security Event Tracking

```python
def log_security_event(event_type, details=None, user_id=None):
    """Log security events with context"""
    logger.warning(f"Security event: {event_type}", extra={
        'event_type': event_type,
        'details': details,
        'user_id': user_id,
        'timestamp': datetime.utcnow().isoformat(),
        'ip_address': request.remote_addr
    })
```

### Monitoring Features

- **Failed Login Tracking**: Brute force attack detection
- **Suspicious Activity**: Unusual access pattern detection
- **Token Abuse**: Invalid token usage tracking
- **File Upload Monitoring**: Malicious file upload detection
- **Rate Limit Violations**: DoS attempt detection

### Alerting

- **Real-time Alerts**: Immediate notification of security events
- **Threshold Monitoring**: Automated alerting on threshold breaches
- **Escalation Procedures**: Defined escalation for critical events
- **Incident Response**: Documented incident response procedures

---

## Compliance & Standards

### Security Standards

- **OWASP Top 10**: Protection against common web vulnerabilities
- **NIST Guidelines**: Following NIST cybersecurity framework
- **PCI DSS**: Payment card data security (if applicable)
- **GDPR Compliance**: Data protection and privacy compliance

### Security Controls

1. **Access Control**: Role-based access control (RBAC)
2. **Data Encryption**: Encryption at rest and in transit
3. **Audit Logging**: Comprehensive audit trail
4. **Incident Response**: Documented response procedures
5. **Security Training**: Regular security awareness training

### Compliance Features

- **Data Minimization**: Only necessary data collected
- **Right to Erasure**: User data deletion capabilities
- **Data Portability**: User data export functionality
- **Consent Management**: Clear consent mechanisms
- **Privacy by Design**: Privacy considerations in all features

---

## Security Best Practices

### Development Guidelines

1. **Secure Coding**: Follow secure coding practices
2. **Code Reviews**: Security-focused code reviews
3. **Testing**: Security testing in CI/CD pipeline
4. **Documentation**: Keep security documentation updated
5. **Training**: Regular security training for developers

### Operational Security

1. **Regular Updates**: Keep all components updated
2. **Monitoring**: Continuous security monitoring
3. **Backup Security**: Secure backup procedures
4. **Access Management**: Regular access review and cleanup
5. **Incident Response**: Tested incident response procedures

### User Education

1. **Security Awareness**: User security education
2. **Password Policies**: Strong password requirements
3. **Phishing Protection**: Anti-phishing measures
4. **Secure Communication**: Encrypted communication channels
5. **Privacy Controls**: User privacy control options

---

## Security Contact

For security-related questions, concerns, or to report vulnerabilities:

- **Response Time**: 24-48 hours for security issues
- **Vulnerability Reporting**: Please use responsible disclosure practices

---

_This document is regularly updated to reflect current security measures and should be reviewed quarterly._
