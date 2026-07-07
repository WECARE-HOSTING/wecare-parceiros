"""add_short_code_to_partners

Revision ID: 90540f73e0f5
Revises: 08d48a791538
Create Date: 2026-07-07 00:40:38.430211

"""
import secrets
import string
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '90540f73e0f5'
down_revision: Union[str, Sequence[str], None] = '08d48a791538'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_ALPHABET = string.ascii_lowercase + string.digits


def _generate_unique_code(existing: set[str]) -> str:
    for _ in range(100):
        code = "".join(secrets.choice(_ALPHABET) for _ in range(6))
        if code not in existing:
            existing.add(code)
            return code
    raise RuntimeError("Não foi possível gerar short_code único na migration.")


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('partners', schema=None) as batch_op:
        batch_op.add_column(sa.Column('short_code', sa.String(length=6), nullable=True))

    conn = op.get_bind()
    existing_codes: set[str] = set()
    partner_ids = conn.execute(sa.text("SELECT id FROM partners")).fetchall()
    for (partner_id,) in partner_ids:
        code = _generate_unique_code(existing_codes)
        conn.execute(
            sa.text("UPDATE partners SET short_code = :code WHERE id = :id"),
            {"code": code, "id": partner_id},
        )

    with op.batch_alter_table('partners', schema=None) as batch_op:
        batch_op.alter_column('short_code', existing_type=sa.String(length=6), nullable=False)
        batch_op.create_unique_constraint('uq_partners_short_code', ['short_code'])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('partners', schema=None) as batch_op:
        batch_op.drop_constraint('uq_partners_short_code', type_='unique')
        batch_op.drop_column('short_code')
