"""enable unaccent extension

Revision ID: 3a1bc1f0c7af
Revises: 79bcdf51ba76
Create Date: 2026-08-04 06:00:12.986804

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a1bc1f0c7af'
down_revision: Union[str, Sequence[str], None] = '79bcdf51ba76'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP EXTENSION IF EXISTS unaccent")
