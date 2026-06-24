"""add_partner_portal_modules

Revision ID: 2d6f9b7b4a21
Revises: b03879638c90
Create Date: 2026-04-09 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2d6f9b7b4a21"
down_revision: Union[str, Sequence[str], None] = "b03879638c90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {c["name"] for c in inspector.get_columns(table_name)}
    return column_name in columns


def _has_table(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return inspector.has_table(table_name)


def upgrade() -> None:
    if not _has_column("partners", "must_change_password"):
        with op.batch_alter_table("partners", schema=None) as batch_op:
            batch_op.add_column(
                sa.Column(
                    "must_change_password",
                    sa.Boolean(),
                    nullable=False,
                    server_default=sa.true(),
                )
            )
    if not _has_column("partners", "term_accepted_at"):
        with op.batch_alter_table("partners", schema=None) as batch_op:
            batch_op.add_column(sa.Column("term_accepted_at", sa.DateTime(), nullable=True))
    if not _has_column("partners", "term_ip"):
        with op.batch_alter_table("partners", schema=None) as batch_op:
            batch_op.add_column(sa.Column("term_ip", sa.String(length=45), nullable=True))
    if not _has_column("partners", "term_version"):
        with op.batch_alter_table("partners", schema=None) as batch_op:
            batch_op.add_column(sa.Column("term_version", sa.String(length=20), nullable=True))
    if not _has_column("partners", "documents"):
        with op.batch_alter_table("partners", schema=None) as batch_op:
            batch_op.add_column(sa.Column("documents", sa.JSON(), nullable=True))

    if not _has_table("in_app_notifications"):
        op.create_table(
            "in_app_notifications",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("event_id", sa.String(length=120), nullable=False),
            sa.Column(
                "type",
                sa.Enum("NEW_LEAD", "COMMISSION_UPDATED", "PROPERTY_STATUS", name="notification_type_enum"),
                nullable=False,
            ),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("body", sa.String(length=500), nullable=False),
            sa.Column("payload", sa.JSON(), nullable=True),
            sa.Column("read_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["partners.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("event_id"),
        )
        op.create_index("ix_notifications_user_created", "in_app_notifications", ["user_id", "created_at"])
        op.create_index("ix_notifications_user_read", "in_app_notifications", ["user_id", "read_at"])

    if not _has_table("materials"):
        op.create_table(
            "materials",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("description", sa.String(length=500), nullable=True),
            sa.Column(
                "category",
                sa.Enum("ART", "TEXT", "PRESENTATION", name="material_category_enum"),
                nullable=False,
            ),
            sa.Column(
                "status",
                sa.Enum("PUBLISHED", "ARCHIVED", name="material_status_enum"),
                nullable=False,
            ),
            sa.Column("tags", sa.JSON(), nullable=True),
            sa.Column("file_url", sa.String(length=1000), nullable=False),
            sa.Column("file_name", sa.String(length=255), nullable=False),
            sa.Column("file_mime_type", sa.String(length=120), nullable=True),
            sa.Column("file_size_bytes", sa.Integer(), nullable=True),
            sa.Column("created_by_partner_id", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["created_by_partner_id"], ["partners.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    if not _has_table("material_downloads"):
        op.create_table(
            "material_downloads",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("material_id", sa.Integer(), nullable=False),
            sa.Column("partner_id", sa.Integer(), nullable=False),
            sa.Column("downloaded_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["material_id"], ["materials.id"]),
            sa.ForeignKeyConstraint(["partner_id"], ["partners.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_material_downloads_material", "material_downloads", ["material_id"])
        op.create_index("ix_material_downloads_partner", "material_downloads", ["partner_id"])


def downgrade() -> None:
    if _has_table("material_downloads"):
        op.drop_index("ix_material_downloads_partner", table_name="material_downloads")
        op.drop_index("ix_material_downloads_material", table_name="material_downloads")
        op.drop_table("material_downloads")

    if _has_table("materials"):
        op.drop_table("materials")

    if _has_table("in_app_notifications"):
        op.drop_index("ix_notifications_user_read", table_name="in_app_notifications")
        op.drop_index("ix_notifications_user_created", table_name="in_app_notifications")
        op.drop_table("in_app_notifications")
