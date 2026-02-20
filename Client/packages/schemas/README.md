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

## Folder Layout

Types are grouped into meta-folders to keep the root manageable:

- **app/** – App shell: `auth/` (user, sidebar), `nav/` (routes, NavItem), `ui/` (screens/breakpoints)
- **content/** – User-generated content: `feed/` (feed, media, postData), `documents/` (documents, docusign, reports, types)
- **finance/** – Billing, offers, metrics
- **integrations/** – Chat, checklists, google-maps

Unchanged at root: **api/**, **agent/**, **calendar/**, **search/**. Backward-compatible re-exports: **user/** (→ app/auth/user), **property/** (→ search/property), **scheduling/** (→ calendar/scheduling).

### Direct import paths (after rework)

- User/auth: `schemas/app/auth/user`, `schemas/app/auth/sidebar` (or `schemas/user` for user types)
- Nav/routes: `schemas/app/nav`
- UI/breakpoints: `schemas/app/ui/screens`
- Feed: `schemas/content/feed/feed`
- Documents: `schemas/content/documents/*` (documents, types, docusign, reports)
- Billing/offers/metrics: `schemas/finance/billing`, `schemas/finance/offers`, `schemas/finance/metrics`
- Chat/checklists/google-maps: `schemas/integrations/chat`, `schemas/integrations/checklists`, `schemas/integrations/google-maps`

### Core Types

- `api/` – API response types and utilities
- `app/auth/user` – User profile and authentication types
- `search/property` – Property types (or `schemas/property` re-export)
- `search/propertyDetails` – Detailed property information

### Domain Types

- `agent/agent` – Agent-related types
- `content/feed/feed` – Feed listing and reels types
- `integrations/chat` – Chat and messaging types
- `content/documents/*` – Document, DocuSign, report types
- `finance/offers` – Offer and negotiation types
- `content/documents/reports` – Report types
- `calendar/scheduling` – Scheduling types (or `schemas/scheduling` re-export)
- `search/search` – Search and filter types
- `plaid` – Plaid financial integration types (when present)
- `finance/billing` – Billing types
- `integrations/checklists` – Checklist types
- `finance/metrics` – Metrics and analytics types

### Navigation and UI

- `app/nav` – Navigation items and route constants (ROUTES, NavItem)
- `app/auth/sidebar` – Sidebar types (SIDEBAR_TABS, getTabByPath)

## Usage Examples

### Importing Types

```typescript
// ✅ CORRECT: Import from barrel or canonical paths
import type { UserProfile } from "../../../packages/schemas/user";
import type { PropertyDetails } from "../../../packages/schemas/search/propertyDetails";
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
