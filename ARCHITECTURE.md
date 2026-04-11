# SilverKey Architecture Overview

## Monorepo Structure

SilverKey is a full-stack real estate platform organized as a monorepo with clear separation between client and server:

```
SilverKey/
├── Client/              # Frontend (React + React Native)
├── Server/              # Backend (Flask + SQLAlchemy + PostgreSQL)
├── documentation/       # Architecture docs, specs, compliance
├── .cursor/rules/       # Cursor AI coding standards and patterns
└── scripts/             # Build, deploy, and CI scripts
```

## Tech Stack Summary

### Frontend (Client/)

- **Framework**: React 18+ (Web), React Native (Mobile)
- **Build**: Vite (Web), Metro (Mobile)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS (utility-first)
- **State Management**: Zustand (global state), TanStack Query (server cache)
- **Routing**: React Router (Web), React Navigation (Mobile)

### Backend (Server/)

- **Framework**: Flask 3.x
- **Database**: PostgreSQL 14+ with SQLAlchemy ORM
- **Auth**: AWS Cognito + Google OAuth
- **File Storage**: AWS S3
- **Deployment**: AWS (EC2/ECS, RDS, Cognito, S3)
- **Region**: US-East-2 (Ohio)

### Key Integrations

- **DocuSign**: E-signature and agreement management
- **Google Calendar**: Calendar sync and scheduling
- **Plaid**: Financial account linking
- **Perplexity AI**: Property research and insights
- **MLS APIs**: Property search and data

## Architecture Principles

### 1. Thin App (Fat Packages)

**Client** apps (`apps/web/`, `apps/mobile/`) are **composition layers only**:
- Contain routing, page shells, and platform-specific entry points
- Import business logic, UI, and hooks from `packages/`
- **Do not** contain standalone `.ts` utility files (those go in `packages/utils/`)

All logic lives in **`packages/`**:
- `packages/features/`: Feature modules (auth, search, profile, calendar, etc.)
- `packages/ui/`: Shared UI primitives and components
- `packages/hooks/`: React hooks for data and UI state
- `packages/store/`: Zustand slices for global state
- `packages/utils/`: Pure utility functions
- `packages/config/`: API clients and configuration

See: `documentation/client/thin-app-architecture.md`, `Client/ARCHITECTURE.md`

### 2. Layered Backend

**Server** follows a strict service-oriented architecture:
- `app/routes/`: Thin Flask blueprints (routing only)
- `app/services/`: Business logic and orchestration
- `app/models/`: SQLAlchemy ORM models
- `app/utils/`: Shared utilities and helpers

Auth decorators (`@require_authenticated_user`, `@require_agent_access`) enforce access control at the route level.

See: `Server/ARCHITECTURE.md`, `.cursor/rules/backend/`

### 3. Cross-Platform by Default

Web and mobile share:
- Feature logic in `packages/features/`
- UI primitives in `packages/ui/`
- Business logic hooks in `packages/hooks/`

Platform-specific code uses file extensions:
- `.tsx`/`.ts`: Shared (default)
- `.web.tsx`/`.web.ts`: Web-only
- `.native.tsx`/`.native.ts`: Mobile-only

See: `.cursor/rules/shared/cross-platform-component-reuse.mdc`

### 4. Security First

- **No secrets in code**: Use environment variables and AWS Secrets Manager
- **PII masking**: Centralized logging utilities scrub sensitive data
- **Auth at every layer**: Cognito → Flask decorators → database row-level (where applicable)
- **Input validation**: Server-side validation for all user input
- **HTTPS only**: Enforce secure connections

See: `.cursor/rules/shared/security.mdc`, `documentation/security/SECURITY.md`

## Detailed Architecture Docs

### Client (Frontend)

- **Overview**: `Client/ARCHITECTURE.md`
- **Thin App Pattern**: `documentation/client/thin-app-architecture.md`
- **Shared Packages**: `documentation/client/shared-packages.md`
- **Mobile Structure**: `documentation/client/mobile-app-structure.md`
- **Cross-Platform**: `documentation/client/react-vs-react-native-packages.md`
- **Rules**: `.cursor/rules/frontend/`

### Server (Backend)

- **Overview**: `Server/ARCHITECTURE.md`
- **Flask Patterns**: `.cursor/rules/backend/backend-architecture.mdc`
- **SQLAlchemy**: `.cursor/rules/backend/sqlalchemy-patterns.mdc`
- **Auth Pipeline**: `.cursor/rules/backend/backend-architecture.mdc`
- **Rules**: `.cursor/rules/backend/`

### Data and APIs

- **User Preferences**: `.cursor/rules/shared/user-preferences-schema.mdc`
- **DocuSign Integration**: `documentation/client/docusign-integration.md`
- **Transactions**: `documentation/transactions/`
- **Search**: Property search and polygon algorithms in `Server/app/services/search/`

### Infrastructure

- **AWS Resources**: `.cursor/rules/shared/aws-resource-naming.mdc`
- **Deployment**: Region US-East-2, services: Cognito, S3, RDS, EC2/ECS
- **Compliance**: `documentation/compliance/` (GDPR, Privacy Policy)

## Development Workflow

### Getting Started

1. **Clone and install**:
   ```bash
   # Install client dependencies
   cd Client && npm install

   # Set up server environment
   cd ../Server && python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure environment**:
   - Copy `Server/.env.example` to `Server/.env`
   - Add AWS credentials, Cognito config, API keys

3. **Run locally**:
   ```bash
   # Client (web)
   cd Client && npm run dev

   # Server
   cd Server && flask run
   ```

### Code Standards

- **Linting**: `npm run lint` (Client), ESLint + custom rules
- **Type checking**: TypeScript strict mode
- **Testing**: TanStack Query + Vitest (Client), pytest (Server)
- **Pre-commit**: Format check, lint, no focused tests

See: `.cursor/rules/shared/ci-gates.mdc`, `.cursor/rules/shared/linting.mdc`

### File Organization

- **Files <400 lines preferred**: Split by domain when over ~400-500 lines
- **Complexity over line count**: High cyclomatic complexity → refactor; long but linear → acceptable
- **Clear naming**: `profileFormSync.ts` > `utils.ts`
- **Co-location**: Related logic in same folder

See: `.cursor/rules/shared/code-organization.mdc`

## Key Patterns

### Frontend

- **State boundaries**: TanStack Query for server cache, Zustand for UI state
- **No async useEffect**: Use React Query or explicit AbortController
- **Hooks > components**: Extract logic into custom hooks
- **Standardized UI**: Button, Title, BodyText from `packages/ui/`

See: `.cursor/rules/frontend/react-hooks.mdc`, `.cursor/rules/frontend/ui-components.mdc`

### Backend

- **Routes → Services → Models**: Clear separation of concerns
- **Decorators for auth**: `@require_authenticated_user`, `@require_agent_access`
- **SecureErrorHandler**: Consistent error responses, PII masking
- **db_transaction**: Context manager for atomic operations
- **No migrations in dev**: Schema changes require separate migration process

See: `.cursor/rules/backend/backend-patterns.mdc`, `.cursor/rules/backend/database.mdc`

## Testing Strategy

- **Unit tests**: In `packages/` for shared logic (≥80% coverage target)
- **Integration tests**: API routes and service orchestration
- **E2E tests**: Playwright for critical user flows (web)
- **No snapshot-only**: Meaningful assertions required
- **No focused tests in repo**: `describe.only`, `it.only` banned

See: `.cursor/rules/shared/testing-tiers.mdc`

## Cursor AI Usage

- Use `@file`, `@folder`, `@codebase` explicitly for context
- Reference `ARCHITECTURE.md` (this file) at session start for complex tasks
- See `.cursorignore` for what's excluded from indexing
- Rules in `.cursor/rules/` are always applied

## Contributing

1. **Read rules**: Start with `.cursor/rules/shared/monorepo.mdc` and `documentation/HOW_WE_DOCUMENT.md`
2. **Follow patterns**: Check existing code and rules files for conventions
3. **Test locally**: Run linters and tests before committing
4. **Document changes**: Update `documentation/` for architecture changes

## Further Reading

- **Client Architecture**: `Client/ARCHITECTURE.md`
- **Server Architecture**: `Server/ARCHITECTURE.md`
- **Documentation Index**: `documentation/README.md`
- **How We Document**: `documentation/HOW_WE_DOCUMENT.md`
- **Cursor Rules**: `.cursor/rules/` (auto-applied to all AI sessions)
