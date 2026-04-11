"""Document library items unify uploads and agreements for listing.

Revision ID: a1c2d3e4f5a6
Revises: b7d4e8f0a1c2
Create Date: 2026-04-01

"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import sqlalchemy as sa
from alembic import op

revision = "a1c2d3e4f5a6"
down_revision = "b7d4e8f0a1c2"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "document_library_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("display_status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("document_library_items_user_id_fkey"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("document_library_items_pkey")),
    )
    op.create_index(
        op.f("ix_document_library_items_user_id"),
        "document_library_items",
        ["user_id"],
        unique=False,
    )

    with op.batch_alter_table("documents", schema=None) as batch_op:
        batch_op.add_column(sa.Column("library_item_id", sa.String(length=36), nullable=True))
    with op.batch_alter_table("agreements", schema=None) as batch_op:
        batch_op.add_column(sa.Column("library_item_id", sa.String(length=36), nullable=True))

    conn = op.get_bind()
    now = datetime.now(timezone.utc)
    docs = (
        conn.execute(
            sa.text("SELECT id, user_id, filename, status, created_at, updated_at FROM documents")
        )
        .mappings()
        .all()
    )
    for row in docs:
        lid = str(uuid.uuid4())
        title = (row["filename"] or "Document")[:512]
        st = (row["status"] or "uploaded")[:50]
        ca = row["created_at"] or now
        ua = row["updated_at"] or row["created_at"] or now
        conn.execute(
            sa.text(
                "INSERT INTO document_library_items "
                "(id, user_id, kind, title, display_status, created_at, updated_at) "
                "VALUES (:id, :uid, 'upload', :title, :st, :ca, :ua)"
            ),
            {"id": lid, "uid": row["user_id"], "title": title, "st": st, "ca": ca, "ua": ua},
        )
        conn.execute(
            sa.text("UPDATE documents SET library_item_id = :lid WHERE id = :did"),
            {"lid": lid, "did": row["id"]},
        )

    ags = (
        conn.execute(
            sa.text("SELECT id, buyer_id, title, status, created_at, updated_at FROM agreements")
        )
        .mappings()
        .all()
    )
    for row in ags:
        lid = str(uuid.uuid4())
        title = (row["title"] or "Agreement")[:512]
        st = (row["status"] or "draft")[:50]
        ca = row["created_at"] or now
        ua = row["updated_at"] or row["created_at"] or now
        conn.execute(
            sa.text(
                "INSERT INTO document_library_items "
                "(id, user_id, kind, title, display_status, created_at, updated_at) "
                "VALUES (:id, :uid, 'agreement', :title, :st, :ca, :ua)"
            ),
            {"id": lid, "uid": row["buyer_id"], "title": title, "st": st, "ca": ca, "ua": ua},
        )
        conn.execute(
            sa.text("UPDATE agreements SET library_item_id = :lid WHERE id = :aid"),
            {"lid": lid, "aid": row["id"]},
        )

    with op.batch_alter_table("documents", schema=None) as batch_op:
        batch_op.create_unique_constraint("uq_documents_library_item_id", ["library_item_id"])
        batch_op.create_foreign_key(
            "fk_documents_library_item_id",
            "document_library_items",
            ["library_item_id"],
            ["id"],
        )
    with op.batch_alter_table("agreements", schema=None) as batch_op:
        batch_op.create_unique_constraint("uq_agreements_library_item_id", ["library_item_id"])
        batch_op.create_foreign_key(
            "fk_agreements_library_item_id",
            "document_library_items",
            ["library_item_id"],
            ["id"],
        )


def downgrade():
    with op.batch_alter_table("agreements", schema=None) as batch_op:
        batch_op.drop_constraint("fk_agreements_library_item_id", type_="foreignkey")
        batch_op.drop_constraint("uq_agreements_library_item_id", type_="unique")
        batch_op.drop_column("library_item_id")
    with op.batch_alter_table("documents", schema=None) as batch_op:
        batch_op.drop_constraint("fk_documents_library_item_id", type_="foreignkey")
        batch_op.drop_constraint("uq_documents_library_item_id", type_="unique")
        batch_op.drop_column("library_item_id")

    op.drop_index(op.f("ix_document_library_items_user_id"), table_name="document_library_items")
    op.drop_table("document_library_items")
