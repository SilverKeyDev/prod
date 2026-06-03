# Security Services

Security utilities for PII scrubbing, error reporting, and secure operations.

## Purpose

The `security/` directory contains security-focused utilities that handle:

- PII (Personally Identifiable Information) detection and scrubbing
- Secure error reporting
- Image processing security
- Clipboard security
- Secure operations (logging uses `packages/logger` with PII scrubbing via `piiSecurity`)

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

Use the centralized logger (`packages/logger`). It scrubs PII via `piiSecurity` and respects admin category toggles.

```typescript
import { log } from "packages/logger";

log.info("AUTH", "User action", {
  userId: "123",
  email: "user@example.com", // Automatically scrubbed in log output
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
2. **Don't log raw user data** — use `packages/logger` (PII scrubbing is built in)
3. **Do not import** the retired `secureLogger` module
4. **Be mindful of PII** in error messages and logs

## Further Reading

- [services/README.md](../README.md) - Services package overview
