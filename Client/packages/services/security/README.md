# Security Services

Security utilities for PII scrubbing, error reporting, and secure operations.

## Purpose

The `security/` directory contains security-focused utilities that handle:
- PII (Personally Identifiable Information) detection and scrubbing
- Secure error reporting
- Image processing security
- Clipboard security
- Secure logging

## Files

### `piiSecurity.ts`
Centralized PII security utilities:
- PII pattern detection
- Sensitive data masking
- Object PII scrubbing
- Safe log object creation

### `errorReporting.ts`
Error reporting service that safely reports errors without exposing PII.

### `errorUtils.ts`
Error utility functions for creating error context and serialization.

### `secureLogger.ts`
Secure logging utility that automatically scrubs PII from log data.

### `imageProcessor.ts`
Image processing utilities with security considerations.

### `clipboardSecurity.ts`
Clipboard security utilities.

## Architecture Rules

### Allowed Imports
- ✅ `utils/*` - Utility functions
- ✅ `schemas/*` - Type definitions

### Forbidden Imports
- ❌ Business logic `services/*`
- ❌ `hooks/*` or `store/*`
- ❌ `apps/web/*`

## Usage Examples

### Scrubbing PII from Data

```typescript
import { scrubObjectPII } from "../../../packages/services/security/piiSecurity";

const safeData = scrubObjectPII({
  email: "user@example.com",
  phone: "555-1234",
  // ... other data
});
// PII is automatically masked
```

### Secure Logging

```typescript
import { secureLogger } from "../../../packages/services/security/secureLogger";

secureLogger.info("User action", {
  userId: "123",
  email: "user@example.com", // Automatically scrubbed
});
```

### Error Reporting

```typescript
import { errorReporter } from "../../../packages/services/security/errorReporting";

errorReporter.report(error, {
  context: {
    userId: "123",
    // PII is automatically scrubbed
  },
});
```

## PII Patterns

The following patterns are automatically detected and scrubbed:
- Email addresses
- Phone numbers
- SSN patterns
- Credit card numbers
- JWT tokens
- API keys
- Bearer tokens
- Passwords

## Sensitive Keys

The following object keys are automatically redacted:
- `password`
- `token`
- `secret`
- `apiKey`
- `auth`
- `credential`
- `ssn`
- `social`

## Best Practices

1. **Always use security utilities** when logging or reporting errors
2. **Don't log raw user data** - use scrubbing utilities
3. **Use secure logger** instead of console.log for sensitive data
4. **Be mindful of PII** in error messages and logs

## Further Reading

- [services/README.md](../README.md) - Services package overview
