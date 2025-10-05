"""fix stock_opname difference formula

Revision ID: 3e8c6fc8c956
Revises: 4b9b1599af4c
Create Date: 2025-10-06 03:30:24.287107

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3e8c6fc8c956'
down_revision: Union[str, None] = '4b9b1599af4c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
        ALTER TABLE stock_opname_details DROP COLUMN difference;
        ALTER TABLE stock_opname_details
        ADD COLUMN difference numeric(18,2)
        GENERATED ALWAYS AS (system_quantity - physical_quantity) STORED;
    """)

def downgrade():
    op.execute("""
        ALTER TABLE stock_opname_details DROP COLUMN difference;
        ALTER TABLE stock_opname_details
        ADD COLUMN difference numeric(18,2)
        GENERATED ALWAYS AS (physical_quantity - system_quantity) STORED;
    """)
