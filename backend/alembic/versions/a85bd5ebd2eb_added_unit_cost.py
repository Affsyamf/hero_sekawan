"""added unit_cost

Revision ID: a85bd5ebd2eb
Revises: a582d8c5be42
Create Date: 2025-10-07 22:11:27.623767

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a85bd5ebd2eb'
down_revision: Union[str, None] = 'a582d8c5be42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('stock_movement_details', sa.Column('unit_cost_used', sa.Numeric(18, 2), nullable=True))
    op.add_column('stock_movement_details', sa.Column('total_cost', sa.Numeric(18, 2), sa.Computed("quantity * unit_cost_used")))

    op.add_column('color_kitchen_batch_details', sa.Column('unit_cost_used', sa.Numeric(18, 2), nullable=True))
    op.add_column('color_kitchen_batch_details', sa.Column('total_cost', sa.Numeric(18, 2), sa.Computed("quantity * unit_cost_used")))

    op.add_column('color_kitchen_entry_details', sa.Column('unit_cost_used', sa.Numeric(18, 2), nullable=True))
    op.add_column('color_kitchen_entry_details', sa.Column('total_cost', sa.Numeric(18, 2), sa.Computed("quantity * unit_cost_used")))


def downgrade() -> None:
    op.execute("ALTER TABLE color_kitchen_entry_details DROP COLUMN total_cost CASCADE;")
    op.drop_column('color_kitchen_entry_details', 'unit_cost_used')

    op.execute("ALTER TABLE color_kitchen_batch_details DROP COLUMN total_cost CASCADE;")
    op.drop_column('color_kitchen_batch_details', 'unit_cost_used')

    op.execute("ALTER TABLE stock_movement_details DROP COLUMN total_cost CASCADE;")
    op.drop_column('stock_movement_details', 'unit_cost_used')
