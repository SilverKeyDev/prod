# Architecture

System design for the SilverKey monorepo (web, mobile, Flask API).

## Client

| Doc | Description |
|-----|-------------|
| [thin-app-architecture.md](./thin-app-architecture.md) | Thin apps, fat packages |
| [layered-architecture-imports.md](./layered-architecture-imports.md) | Import matrix |
| [cross-feature-composition.md](./cross-feature-composition.md) | Cross-feature import tiers |
| [workspace-first-architecture.md](./workspace-first-architecture.md) | Workspace vs server identity |
| [workspaces-placeholder-shells.md](./workspaces-placeholder-shells.md) | Workspace shells |
| [shared-packages.md](./shared-packages.md) | Shared packages under `Client/packages/` |
| [apps-folder-contents.md](./apps-folder-contents.md) | What belongs in `apps/` |
| [typescript-files.md](./typescript-files.md) | TypeScript layout |
| [document-schema-naming.md](./document-schema-naming.md) | Document schema naming |

## Server

| Doc | Description |
|-----|-------------|
| [flask-architecture.md](./flask-architecture.md) | App factory, blueprints, auth |
| [sqlalchemy-patterns.md](./sqlalchemy-patterns.md) | Models, sessions |
| [celery-tasks.md](./celery-tasks.md) | Celery task overview |

## Messaging

| Folder | Description |
|--------|-------------|
| [messaging/](./messaging/) | Persona stacks, SSE, workspace conversations |

## Platform and patterns

| Folder | Description |
|--------|-------------|
| [platform/](./platform/) | Web vs React Native, shared UI |
| [patterns/](./patterns/) | React hooks and component audit rubric |
