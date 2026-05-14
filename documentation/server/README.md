# Server documentation

Docs for the SilverKey backend (Python/Flask). Add server-specific long-form docs here (APIs, services, deployment) as they are written. In-repo READMEs (e.g. under `Server/app/`) remain the lightweight local references.

## Contents

- **[PostgreSQL (schema + ops)](../../docs/postgres/README.md)** - Generated schema reference, ER diagram, hot queries, migrations/runbook, known issues
- **[Redis (ops + architecture)](../../docs/redis/README.md)** - Broker/results/scoring usage, key table, runbook, known issues, refactor backlog
- **[Flask Architecture](flask-architecture.md)** - App factory, blueprints, auth pipeline, error handling
- **[SQLAlchemy Patterns](sqlalchemy-patterns.md)** - Models, relationships, queries, session management
- **[API Conventions](api-conventions.md)** - Route patterns, request/response format, validation, pagination
- **[User Preferences](user-preferences.md)** - Preferences schema, write/read pipeline, usage in search
- **[AWS Resources](aws-resources.md)** - AWS services, IAM, monitoring, deployment, cost optimization
- **[Infrastructure reliability gap audit](infrastructure-reliability-gap-audit.md)** - Checklist of backups, monitoring, staging, CDN, load testing, and what is verifiable from this repo

## Related in repo

- Backend rules: `.cursor/rules/backend/`
- Server app structure: `Server/app/` and per-module READMEs.
