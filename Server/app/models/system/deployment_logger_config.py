"""Deployment-wide logger configuration (client + server scopes)."""

# pyright: reportUndefinedVariable=false
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app import db

DEFAULT_DEPLOYMENT_LOGGER_CONFIG_ID = "default"


class DeploymentLoggerConfig(db.Model):
    __tablename__ = "deployment_logger_config"

    id: Mapped[str] = mapped_column(db.String(32), primary_key=True)
    config: Mapped[dict[str, Any]] = mapped_column(
        JSONB().with_variant(db.JSON, "sqlite"), nullable=False, default=dict
    )
    updated_by_user_id: Mapped[str | None] = mapped_column(
        db.String(36), db.ForeignKey("users.id"), nullable=True
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
