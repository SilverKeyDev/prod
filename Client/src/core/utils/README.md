# Core Utilities

This directory contains centralized utility functions for type checking, error
handling, and common operations across the SilverKey application.

## 📁 Structure

```
core/utils/
├── typeGuards.ts      # Comprehensive type checking utilities
├── errorHandling.ts   # Centralized error handling patterns
├── array.ts          # Array manipulation utilities
├── index.ts          # Centralized exports
└── README.md         # This documentation
```

## 🔍 Type Guards (`typeGuards.ts`)

### Basic Type Guards

```typescript
import {
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isNullish,
} from '@/core/utils';

// Basic type checking
if (isString(value)) {
  // value is now typed as string
  console.log(value.toUpperCase());
}

if (isNumber(value)) {
  // value is now typed as number
  console.log(value.toFixed(2));
}

if (isArray(value)) {
  // value is now typed as unknown[]
  console.log(value.length);
}
```

### Error Type Guards

```typescript
import { isError, isErrorLike, isApiError, isApiSuccess } from '@/core/utils';

// Check for Error instances
if (isError(value)) {
  console.log(value.message, value.stack);
}

// Check for API responses
if (isApiSuccess(value)) {
  console.log('Success:', value.data);
} else if (isApiError(value)) {
  console.log('Error:', value.error);
}
```

### Date Type Guards

```typescript
import { isValidDate, isDateString, isTimestamp } from '@/core/utils';

// Check for valid Date objects
if (isValidDate(value)) {
  console.log(value.toISOString());
}

// Check for ISO date strings
if (isDateString(value)) {
  console.log('Valid ISO date string');
}

// Check for timestamps
if (isTimestamp(value)) {
  console.log('Valid timestamp:', new Date(value));
}
```

### Validation Type Guards

```typescript
import {
  isEmail,
  isUrl,
  isNonEmptyString,
  isPositiveNumber,
} from '@/core/utils';

// Email validation
if (isEmail(value)) {
  console.log('Valid email:', value);
}

// URL validation
if (isUrl(value)) {
  console.log('Valid URL:', value);
}

// Non-empty string
if (isNonEmptyString(value)) {
  console.log('Non-empty string:', value);
}
```

### Complex Type Guards

```typescript
import {
  hasProperty,
  hasAllProperties,
  matchesShape,
  isOneOf,
} from '@/core/utils';

// Check for specific properties
if (hasProperty(value, 'id')) {
  console.log('Has id property:', value.id);
}

// Check for multiple properties
if (hasAllProperties(value, ['name', 'email', 'age'])) {
  console.log('Has all required properties');
}

// Shape validation
const userShape = {
  name: isString,
  age: isNumber,
  email: isEmail,
};

if (matchesShape(value, userShape)) {
  console.log('Matches user shape');
}

// Union type checking
if (isOneOf(value, ['pending', 'approved', 'rejected'])) {
  console.log('Valid status:', value);
}
```

## 🚨 Error Handling (`errorHandling.ts`)

### Error Creation

```typescript
import {
  createError,
  createValidationError,
  createNetworkError,
  createAuthenticationError,
} from '@/core/utils';

// Create different types of errors
const validationError = createValidationError('Invalid email format', 'email');
const networkError = createNetworkError(
  'Connection failed',
  500,
  'Internal Server Error'
);
const authError = createAuthenticationError('Token expired', true);
```

### Error Normalization

```typescript
import { normalizeError, getUserFriendlyMessage } from '@/core/utils';

try {
  // Some operation that might fail
  riskyOperation();
} catch (error) {
  // Normalize any error type
  const normalizedError = normalizeError(error, { context: 'user-action' });

  // Get user-friendly message
  const userMessage = getUserFriendlyMessage(normalizedError);

  // Log and report
  logError(normalizedError);
  reportError(normalizedError);

  // Show to user
  showError(userMessage);
}
```

### Safe Execution

```typescript
import { safeExecute, safeExecuteSync, withRetry } from '@/core/utils';

// Safe async execution
const result = await safeExecute(async () => {
  const response = await fetch('/api/data');
  return response.json();
});

if (result.success) {
  console.log('Data:', result.data);
} else {
  console.error('Error:', result.error.message);
}

// Safe sync execution
const syncResult = safeExecuteSync(() => {
  return JSON.parse(input);
});

// With retry logic
const retryResult = await withRetry(() => fetch('/api/unreliable-endpoint'), {
  maxRetries: 3,
  baseDelay: 1000,
  retryCondition: (error) => error.name === 'NetworkError',
});
```

### Error Classification

```typescript
import { isRetryableError, withTimeout } from '@/core/utils';

// Check if error is retryable
if (isRetryableError(error)) {
  // Implement retry logic
  await retryOperation();
}

// Add timeout to operations
const timeoutResult = await withTimeout(
  fetch('/api/slow-endpoint'),
  5000 // 5 second timeout
);
```

## 🔄 Array Utilities (`array.ts`)

```typescript
import { sameIds, createGuardedSetter } from '@/core/utils';

// Compare arrays by ID
const areSame = sameIds(array1, array2);

// Create guarded state setter
const setItems = createGuardedSetter(setItemsState);
setItems(newItems); // Only updates if IDs are different
```

## 🎯 Best Practices

### 1. Use Type Guards for Runtime Safety

```typescript
// ❌ Unsafe
function processUser(user: unknown) {
  return user.name.toUpperCase(); // Runtime error if user is not an object
}

// ✅ Safe with type guards
function processUser(user: unknown) {
  if (isObject(user) && isString(user.name)) {
    return user.name.toUpperCase();
  }
  throw createValidationError('Invalid user object');
}
```

### 2. Centralize Error Handling

```typescript
// ❌ Scattered error handling
try {
  const data = await fetchData();
} catch (error) {
  console.error('Fetch failed:', error);
  // Different error handling in different places
}

// ✅ Centralized error handling
const result = await safeExecute(() => fetchData());
if (!result.success) {
  const userMessage = getUserFriendlyMessage(result.error);
  logError(result.error);
  showUserError(userMessage);
}
```

### 3. Use Validation Patterns

```typescript
// ✅ Comprehensive validation
function validateUserData(data: unknown): UserData {
  if (!isObject(data)) {
    throw createValidationError('Data must be an object');
  }

  if (!isNonEmptyString(data.name)) {
    throw createValidationError('Name is required', 'name');
  }

  if (!isEmail(data.email)) {
    throw createValidationError('Valid email is required', 'email');
  }

  if (!isPositiveNumber(data.age)) {
    throw createValidationError('Age must be a positive number', 'age');
  }

  return data as UserData;
}
```

### 4. Handle API Responses Safely

```typescript
// ✅ Safe API response handling
async function fetchUserData(id: string) {
  const result = await safeExecute(() =>
    fetch(`/api/users/${id}`).then((res) => res.json())
  );

  if (!result.success) {
    throw result.error;
  }

  const response = result.data;

  if (isApiSuccess(response)) {
    return response.data;
  } else if (isApiError(response)) {
    throw createNetworkError(response.error, response.status);
  } else {
    throw createNetworkError('Invalid API response format');
  }
}
```

## 🔧 Migration Guide

### From Old Error Utils

```typescript
// ❌ Old way
import {
  reportError,
  normalizeError,
  formatErrorMessage,
} from '@/app/error/errorUtils';

// ✅ New way
import {
  reportError,
  normalizeError,
  getUserFriendlyMessage,
} from '@/core/utils';
```

### Gradual Adoption

1. **Start with new code**: Use the new utilities for all new features
2. **Update error handling**: Replace scattered try/catch with `safeExecute`
3. **Add type guards**: Use type guards in validation functions
4. **Migrate gradually**: Update existing code during refactoring

## 📚 Examples

See `TypeGuardsExample.tsx` for a comprehensive demonstration of all utilities
in action.

## 🚀 Performance Notes

- Type guards are optimized for performance
- Error normalization is lightweight
- Safe execution adds minimal overhead
- Retry mechanisms include exponential backoff
- Debounced error reporting prevents spam

## 🔒 Security Considerations

- Error messages are sanitized for user display
- Sensitive information is not leaked in error reports
- PII is scrubbed from error contexts
- Stack traces are redacted in production
