"""Transaction spine: brokerage orgs, memberships, transaction_id FKs, data backfill.

Revision ID: i4d5e6f7a8b9
Revises: h3c4d5e6f7a8
Create Date: 2026-05-29
"""

from __future__ import annotations

from datetime import datetime, timezone

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "i4d5e6f7a8b9"
down_revision = "h3c4d5e6f7a8"
branch_labels = None
depends_on = None

DEFAULT_ORG_ID = "a0000000-0000-4000-8000-000000000001"
DEFAULT_ORG_SLUG = "silverkey-default"
DEFAULT_ORG_NAME = "SilverKey Default"

_IX_BROKERAGE_ORGS_SLUG = "ix_brokerage_orgs_slug"
_IX_USER_ORG_MEMBERSHIPS_USER_ID = "ix_user_org_memberships_user_id"
_IX_USER_ORG_MEMBERSHIPS_BROKERAGE_ORG_ID = "ix_user_org_memberships_brokerage_org_id"
_FK_TRANSACTIONS_BROKERAGE_ORG_ID = "fk_transactions_brokerage_org_id"
_UQ_TRANSACTIONS_BUYER_ID = "uq_transactions_buyer_id"
_FK_USER_TASKS_TRANSACTION_ID = "fk_user_tasks_transaction_id"
_FK_TRANSACTION_ADDRESSES_TRANSACTION_ID = "fk_transaction_addresses_transaction_id"
_UQ_TRANSACTION_ADDRESSES_TRANSACTION_ID = "uq_transaction_addresses_transaction_id"
_FK_AGREEMENTS_TRANSACTION_ID = "fk_agreements_transaction_id"
_FK_DOCUMENTS_TRANSACTION_ID = "fk_documents_transaction_id"
_FK_AGREEMENT_LINKS_TRANSACTION_ID = "fk_agreement_links_transaction_id"


def _column_names(insp, table: str) -> set[str]:
    if not insp.has_table(table):
        return set()
    return {c["name"] for c in insp.get_columns(table)}


def _index_names(insp, table: str) -> set[str]:
    if not insp.has_table(table):
        return set()
    return {ix["name"] for ix in insp.get_indexes(table)}


def _fk_names(insp, table: str) -> set[str]:
    if not insp.has_table(table):
        return set()
    return {fk["name"] for fk in insp.get_foreign_keys(table) if fk.get("name")}


def _unique_names(insp, table: str) -> set[str]:
    if not insp.has_table(table):
        return set()
    return {uq["name"] for uq in insp.get_unique_constraints(table) if uq.get("name")}


def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    conn = bind
    now = datetime.now(timezone.utc)

    if not insp.has_table("brokerage_orgs"):
        op.create_table(
            "brokerage_orgs",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("slug", sa.String(length=128), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("slug"),
        )
    if _IX_BROKERAGE_ORGS_SLUG not in _index_names(insp, "brokerage_orgs"):
        op.create_index(_IX_BROKERAGE_ORGS_SLUG, "brokerage_orgs", ["slug"], unique=True)

    conn.execute(
        sa.text(
            """
            INSERT INTO brokerage_orgs (id, name, slug, created_at, updated_at)
            VALUES (:id, :name, :slug, :now, :now)
            ON CONFLICT (id) DO NOTHING
            """
        ),
        {"id": DEFAULT_ORG_ID, "name": DEFAULT_ORG_NAME, "slug": DEFAULT_ORG_SLUG, "now": now},
    )

    if not insp.has_table("user_org_memberships"):
        op.create_table(
            "user_org_memberships",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("user_id", sa.String(length=36), nullable=False),
            sa.Column("brokerage_org_id", sa.String(length=36), nullable=False),
            sa.Column("role", sa.String(length=32), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(
                ["brokerage_org_id"], ["brokerage_orgs.id"], ondelete="CASCADE"
            ),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "user_id", "brokerage_org_id", name="uq_user_org_memberships_user_org"
            ),
        )
    if _IX_USER_ORG_MEMBERSHIPS_USER_ID not in _index_names(insp, "user_org_memberships"):
        op.create_index(
            _IX_USER_ORG_MEMBERSHIPS_USER_ID, "user_org_memberships", ["user_id"], unique=False
        )
    if _IX_USER_ORG_MEMBERSHIPS_BROKERAGE_ORG_ID not in _index_names(insp, "user_org_memberships"):
        op.create_index(
            _IX_USER_ORG_MEMBERSHIPS_BROKERAGE_ORG_ID,
            "user_org_memberships",
            ["brokerage_org_id"],
            unique=False,
        )

    # Agents -> membership role=agent
    conn.execute(
        sa.text(
            """
            INSERT INTO user_org_memberships (id, user_id, brokerage_org_id, role, created_at)
            SELECT gen_random_uuid()::text, ur.user_id, :org_id, 'agent', :now
            FROM user_roles ur
            WHERE ur.role = 'agent'
            ON CONFLICT (user_id, brokerage_org_id) DO NOTHING
            """
        ),
        {"org_id": DEFAULT_ORG_ID, "now": now},
    )

    # Connected buyers -> membership role=member
    conn.execute(
        sa.text(
            """
            INSERT INTO user_org_memberships (id, user_id, brokerage_org_id, role, created_at)
            SELECT gen_random_uuid()::text, ac.client_id, :org_id, 'member', :now
            FROM agent_conversations ac
            ON CONFLICT (user_id, brokerage_org_id) DO NOTHING
            """
        ),
        {"org_id": DEFAULT_ORG_ID, "now": now},
    )

    # Legacy users.brokerage agents without role row
    conn.execute(
        sa.text(
            """
            INSERT INTO user_org_memberships (id, user_id, brokerage_org_id, role, created_at)
            SELECT gen_random_uuid()::text, u.id, :org_id, 'agent', :now
            FROM users u
            WHERE u.brokerage IS NOT NULL AND trim(u.brokerage) <> ''
            ON CONFLICT (user_id, brokerage_org_id) DO NOTHING
            """
        ),
        {"org_id": DEFAULT_ORG_ID, "now": now},
    )

    transaction_cols = _column_names(insp, "transactions")
    with op.batch_alter_table("transactions", schema=None) as batch_op:
        if "brokerage_org_id" not in transaction_cols:
            batch_op.add_column(sa.Column("brokerage_org_id", sa.String(length=36), nullable=True))
        if "created_at" not in transaction_cols:
            batch_op.add_column(sa.Column("created_at", sa.DateTime(timezone=True), nullable=True))
        if "updated_at" not in transaction_cols:
            batch_op.add_column(sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))

    # Backfill transaction rows for buyers with activity
    conn.execute(
        sa.text(
            """
            INSERT INTO transactions (id, buyer_id, primary_agent_id, brokerage_org_id, skyslope_file_id, created_at, updated_at)
            SELECT
                gen_random_uuid()::text,
                b.buyer_id,
                (
                    SELECT ac.agent_id FROM agent_conversations ac
                    WHERE ac.client_id = b.buyer_id
                    ORDER BY ac.created_at ASC NULLS LAST
                    LIMIT 1
                ),
                :org_id,
                NULL,
                :now,
                :now
            FROM (
                SELECT DISTINCT buyer_id FROM (
                    SELECT user_id AS buyer_id FROM user_tasks WHERE user_id IS NOT NULL
                    UNION SELECT user_id AS buyer_id FROM transaction_addresses WHERE user_id IS NOT NULL
                    UNION SELECT buyer_id FROM agreements WHERE buyer_id IS NOT NULL
                    UNION SELECT user_id AS buyer_id FROM documents WHERE user_id IS NOT NULL
                    UNION SELECT client_id AS buyer_id FROM agent_conversations
                    UNION SELECT buyer_id FROM buyer_step_views WHERE buyer_id IS NOT NULL
                    UNION SELECT buyer_id FROM rev_share_link_clicks WHERE buyer_id IS NOT NULL
                    UNION SELECT buyer_id FROM transactions WHERE buyer_id IS NOT NULL
                ) sources
                WHERE buyer_id IS NOT NULL
            ) b
            WHERE NOT EXISTS (
                SELECT 1 FROM transactions t WHERE t.buyer_id = b.buyer_id
            )
            """
        ),
        {"org_id": DEFAULT_ORG_ID, "now": now},
    )

    conn.execute(
        sa.text(
            """
            UPDATE transactions
            SET brokerage_org_id = :org_id,
                created_at = COALESCE(created_at, :now),
                updated_at = COALESCE(updated_at, :now)
            WHERE brokerage_org_id IS NULL
            """
        ),
        {"org_id": DEFAULT_ORG_ID, "now": now},
    )

    transaction_fks = _fk_names(insp, "transactions")
    transaction_uqs = _unique_names(insp, "transactions")
    with op.batch_alter_table("transactions", schema=None) as batch_op:
        if "brokerage_org_id" in _column_names(insp, "transactions"):
            batch_op.alter_column("brokerage_org_id", nullable=False)
        if "created_at" in _column_names(insp, "transactions"):
            batch_op.alter_column("created_at", nullable=False)
        if "updated_at" in _column_names(insp, "transactions"):
            batch_op.alter_column("updated_at", nullable=False)
        if _FK_TRANSACTIONS_BROKERAGE_ORG_ID not in transaction_fks:
            batch_op.create_foreign_key(
                _FK_TRANSACTIONS_BROKERAGE_ORG_ID,
                "brokerage_orgs",
                ["brokerage_org_id"],
                ["id"],
            )
        if _UQ_TRANSACTIONS_BUYER_ID not in transaction_uqs:
            batch_op.create_unique_constraint(_UQ_TRANSACTIONS_BUYER_ID, ["buyer_id"])

    # Nullable transaction_id columns on child tables
    if "transaction_id" not in _column_names(insp, "user_tasks"):
        with op.batch_alter_table("user_tasks", schema=None) as batch_op:
            batch_op.add_column(sa.Column("transaction_id", sa.String(length=36), nullable=True))

    if "transaction_id" not in _column_names(insp, "transaction_addresses"):
        with op.batch_alter_table("transaction_addresses", schema=None) as batch_op:
            batch_op.add_column(sa.Column("transaction_id", sa.String(length=36), nullable=True))

    if "transaction_id" not in _column_names(insp, "agreements"):
        with op.batch_alter_table("agreements", schema=None) as batch_op:
            batch_op.add_column(sa.Column("transaction_id", sa.String(length=36), nullable=True))

    if "transaction_id" not in _column_names(insp, "documents"):
        with op.batch_alter_table("documents", schema=None) as batch_op:
            batch_op.add_column(sa.Column("transaction_id", sa.String(length=36), nullable=True))

    conn.execute(
        sa.text(
            """
            UPDATE user_tasks ut
            SET transaction_id = t.id
            FROM transactions t
            WHERE t.buyer_id = ut.user_id AND ut.transaction_id IS NULL
            """
        )
    )
    conn.execute(
        sa.text(
            """
            UPDATE transaction_addresses ta
            SET transaction_id = t.id
            FROM transactions t
            WHERE t.buyer_id = ta.user_id AND ta.transaction_id IS NULL
            """
        )
    )
    conn.execute(
        sa.text(
            """
            UPDATE agreements a
            SET transaction_id = t.id
            FROM transactions t
            WHERE t.buyer_id = a.buyer_id AND a.transaction_id IS NULL
            """
        )
    )
    conn.execute(
        sa.text(
            """
            UPDATE documents d
            SET transaction_id = t.id
            FROM transactions t
            WHERE t.buyer_id = d.user_id AND d.transaction_id IS NULL
            """
        )
    )

    # agreement_links: values may be buyer user id OR transactions.id
    conn.execute(
        sa.text(
            """
            UPDATE agreement_links al
            SET transaction_id = t.id
            FROM transactions t
            WHERE t.buyer_id = al.transaction_id
            """
        )
    )
    conn.execute(
        sa.text(
            """
            UPDATE agreement_links al
            SET transaction_id = t.id
            FROM transactions t
            WHERE t.id = al.transaction_id AND al.transaction_id IS DISTINCT FROM t.id
            """
        )
    )

    user_task_fks = _fk_names(insp, "user_tasks")
    with op.batch_alter_table("user_tasks", schema=None) as batch_op:
        if "transaction_id" in _column_names(insp, "user_tasks"):
            batch_op.alter_column("transaction_id", nullable=False)
        if _FK_USER_TASKS_TRANSACTION_ID not in user_task_fks:
            batch_op.create_foreign_key(
                _FK_USER_TASKS_TRANSACTION_ID,
                "transactions",
                ["transaction_id"],
                ["id"],
                ondelete="CASCADE",
            )

    transaction_address_fks = _fk_names(insp, "transaction_addresses")
    transaction_address_uqs = _unique_names(insp, "transaction_addresses")
    with op.batch_alter_table("transaction_addresses", schema=None) as batch_op:
        if "transaction_id" in _column_names(insp, "transaction_addresses"):
            batch_op.alter_column("transaction_id", nullable=False)
        if _FK_TRANSACTION_ADDRESSES_TRANSACTION_ID not in transaction_address_fks:
            batch_op.create_foreign_key(
                _FK_TRANSACTION_ADDRESSES_TRANSACTION_ID,
                "transactions",
                ["transaction_id"],
                ["id"],
                ondelete="CASCADE",
            )
        if _UQ_TRANSACTION_ADDRESSES_TRANSACTION_ID not in transaction_address_uqs:
            batch_op.create_unique_constraint(
                _UQ_TRANSACTION_ADDRESSES_TRANSACTION_ID, ["transaction_id"]
            )

    agreement_fks = _fk_names(insp, "agreements")
    with op.batch_alter_table("agreements", schema=None) as batch_op:
        if "transaction_id" in _column_names(insp, "agreements"):
            batch_op.alter_column("transaction_id", nullable=False)
        if _FK_AGREEMENTS_TRANSACTION_ID not in agreement_fks:
            batch_op.create_foreign_key(
                _FK_AGREEMENTS_TRANSACTION_ID,
                "transactions",
                ["transaction_id"],
                ["id"],
                ondelete="CASCADE",
            )

    document_fks = _fk_names(insp, "documents")
    with op.batch_alter_table("documents", schema=None) as batch_op:
        if "transaction_id" in _column_names(insp, "documents"):
            batch_op.alter_column("transaction_id", nullable=False)
        if _FK_DOCUMENTS_TRANSACTION_ID not in document_fks:
            batch_op.create_foreign_key(
                _FK_DOCUMENTS_TRANSACTION_ID,
                "transactions",
                ["transaction_id"],
                ["id"],
                ondelete="CASCADE",
            )

    agreement_link_fks = _fk_names(insp, "agreement_links")
    with op.batch_alter_table("agreement_links", schema=None) as batch_op:
        if _FK_AGREEMENT_LINKS_TRANSACTION_ID not in agreement_link_fks:
            batch_op.create_foreign_key(
                _FK_AGREEMENT_LINKS_TRANSACTION_ID,
                "transactions",
                ["transaction_id"],
                ["id"],
                ondelete="CASCADE",
            )


def downgrade():
    with op.batch_alter_table("agreement_links", schema=None) as batch_op:
        batch_op.drop_constraint("fk_agreement_links_transaction_id", type_="foreignkey")

    with op.batch_alter_table("documents", schema=None) as batch_op:
        batch_op.drop_constraint("fk_documents_transaction_id", type_="foreignkey")
        batch_op.drop_column("transaction_id")

    with op.batch_alter_table("agreements", schema=None) as batch_op:
        batch_op.drop_constraint("fk_agreements_transaction_id", type_="foreignkey")
        batch_op.drop_column("transaction_id")

    with op.batch_alter_table("transaction_addresses", schema=None) as batch_op:
        batch_op.drop_constraint("uq_transaction_addresses_transaction_id", type_="unique")
        batch_op.drop_constraint("fk_transaction_addresses_transaction_id", type_="foreignkey")
        batch_op.drop_column("transaction_id")

    with op.batch_alter_table("user_tasks", schema=None) as batch_op:
        batch_op.drop_constraint("fk_user_tasks_transaction_id", type_="foreignkey")
        batch_op.drop_column("transaction_id")

    with op.batch_alter_table("transactions", schema=None) as batch_op:
        batch_op.drop_constraint("uq_transactions_buyer_id", type_="unique")
        batch_op.drop_constraint("fk_transactions_brokerage_org_id", type_="foreignkey")
        batch_op.drop_column("updated_at")
        batch_op.drop_column("created_at")
        batch_op.drop_column("brokerage_org_id")

    op.drop_index(
        op.f("ix_user_org_memberships_brokerage_org_id"), table_name="user_org_memberships"
    )
    op.drop_index(op.f("ix_user_org_memberships_user_id"), table_name="user_org_memberships")
    op.drop_table("user_org_memberships")
    op.drop_index(op.f("ix_brokerage_orgs_slug"), table_name="brokerage_orgs")
    op.drop_table("brokerage_orgs")
