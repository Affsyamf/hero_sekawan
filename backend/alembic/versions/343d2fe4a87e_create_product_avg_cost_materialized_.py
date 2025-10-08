"""create product_avg_cost materialized view

Revision ID: 343d2fe4a87e
Revises: a85bd5ebd2eb
Create Date: 2025-10-07 23:52:18.346590

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '343d2fe4a87e'
down_revision: Union[str, None] = '2e941b3888ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    sql_path = "app/sql/product_avg_cost_view.sql"
    with open(sql_path, "r", encoding="utf-8") as f:
        op.execute(f.read())

    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_product_avg_cost_product_id 
        ON product_avg_cost (product_id);
    """)

def downgrade():
    op.execute("DROP MATERIALIZED VIEW IF EXISTS product_avg_cost;")