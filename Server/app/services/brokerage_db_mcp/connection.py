"""Per-brokerage DB connection config (SIL-323).
v1: silverkey_mirror - query SilverKey DB allowlisted tables scoped by brokerage_id.
External Postgres/Snowflake adapters can share BrokerageDbConfig later.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from sqlalchemy import select

from app import db
from app.models.brokerage.brokerage_org import BrokerageOrg
from app.services.brokerage_db_mcp.errors import ConnectionConfigError

MODE_SILVERKEY_MIRROR = "silverkey_mirror"
# Allowlist only — introspection must not dump the whole public schema.
MIRROR_ALLOWED_TABLES: frozenset[str] = frozenset({"skyslope_transactions"})
# Row-level tenancy column for mirror mode (Shape A in design note).
MIRROR_TENANCY_COLUMN = "brokerage_id"


@dataclass(frozen=True)
class BrokerageDbConfig:
    brokerage_org_id: str
    mode: str
    allowed_tables: frozenset[str] = field(default_factory=lambda: MIRROR_ALLOWED_TABLES)
    tenancy_column: str | None = MIRROR_TENANCY_COLUMN
    dialect: str = "postgresql"  # informational for later executors / NL prompts


def resolve_connection_config(brokerage_org_id: str) -> BrokerageDbConfig:
    """Resolve query config for a brokerage. v1 always returns silverkey_mirror."""
    org_id = (brokerage_org_id or "").strip()
    if not org_id:
        raise ConnectionConfigError("brokerage_org_id is required", code="missing_brokerage_org_id")

    org = db.session.scalar(select(BrokerageOrg).where(BrokerageOrg.id == org_id))
    if org is None:
        # Do not echo the id in a way that helps enumeration more than needed;
        # including it is OK for logs/server — keep client messages boring later.
        raise ConnectionConfigError(
            "Brokerage organization not found",
            code="brokerage_not_found",
        )

    return BrokerageDbConfig(
        brokerage_org_id=org_id,
        mode=MODE_SILVERKEY_MIRROR,
        allowed_tables=MIRROR_ALLOWED_TABLES,
        tenancy_column=MIRROR_TENANCY_COLUMN,
        dialect=db.engine.dialect.name,
    )
