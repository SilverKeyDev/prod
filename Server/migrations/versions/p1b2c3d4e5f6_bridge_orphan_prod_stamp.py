"""Bridge orphaned prod alembic stamp p1b2c3d4e5f6 (SIL-316).

Prod was stamped at p1b2c3d4e5f6 after the SIL-306 email campaign tables were
created, but the committed revision id is o1b2c3d4e5f6. Without this bridge,
`flask db upgrade` fails with: Can't locate revision identified by 'p1b2c3d4e5f6'.

No-op: schema already matches o1b2c3d4e5f6 (idempotent create tables).

Revision ID: p1b2c3d4e5f6
Revises: o1b2c3d4e5f6
Create Date: 2026-07-12
"""

from __future__ import annotations

revision = "p1b2c3d4e5f6"
down_revision = "o1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
