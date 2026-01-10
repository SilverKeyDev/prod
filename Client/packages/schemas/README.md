# Schemas Package

TypeScript type definitions shared across the SilverKey application.

## Purpose

The `schemas/` package provides centralized TypeScript type definitions for:
- API request/response types
- Domain models
- Configuration types
- Utility types

## Architecture Rules

### Allowed Imports
- ✅ Other `schemas/*` files - Types can reference other types
- ✅ Third-party type definitions - External library types

### Forbidden Imports
- ❌ `config/*` - Schemas should not import config
- ❌ `services/*` - Schemas should not import services
- ❌ `hooks/*` - Schemas should not import hooks
- ❌ `apps/web/*` - Schemas should not import components

## Available Schemas

### Core Types
- `api.ts` - API response types and utilities
- `user.ts` - User profile and authentication types
- `property.ts` - Property types
- `propertyDetails.ts` - Detailed property information

### Domain Types
- `agent.ts` - Agent-related types
- `chat.ts` - Chat and messaging types
- `documents.ts` - Document types
- `offers.ts` - Offer and negotiation types
- `reports.ts` - Report types
- `scheduling.ts` - Scheduling types
- `search.ts` - Search and filter types
- `plaid.ts` - Plaid financial integration types
- `billing.ts` - Billing types
- `checklists.ts` - Checklist types
- `metrics.ts` - Metrics and analytics types

### Navigation
- `nav.ts` - Navigation items and route constants

### Other
- `sidebar.ts` - Sidebar types
- `navigation.ts` - (Deprecated - merged into nav.ts)

## Usage Examples

### Importing Types

```typescript
// ✅ CORRECT: Import types from schemas
import type { UserProfile } from "../../../packages/schemas/user";
import type { PropertyDetails } from "../../../packages/schemas/propertyDetails";
```

### Using Type Guards

```typescript
import { isPropertyDetails } from "../../../packages/schemas/search";

if (isPropertyDetails(data)) {
  // TypeScript knows data is PropertyDetails
  console.log(data.address);
}
```

### Type Definitions

```typescript
// In schemas/user.ts
export type UserProfile = {
  id: string;
  email: string;
  name: string;
  is_agent?: boolean;
  // ...
};
```

## Best Practices

1. **Centralize types** - All shared types should be in schemas
2. **Use descriptive names** - Clear, domain-specific type names
3. **Export from index** - Re-export commonly used types
4. **Document complex types** - Add JSDoc comments for complex types
5. **Use type guards** - Provide runtime type checking when needed

## Type Organization

Types are organized by domain:
- **Core types** - User, property, API responses
- **Domain types** - Agent, chat, documents, etc.
- **Utility types** - Navigation, sidebar, etc.

## Further Reading

- [packages/README.md](../README.md) - Packages overview
