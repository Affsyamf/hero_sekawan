from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'd6feb701ecd7'
down_revision = 'bb595b17fc96'
branch_labels = None
depends_on = None

new_enum = postgresql.ENUM('Goods', 'Service', name='account_type_enum')
old_enum = postgresql.ENUM('Goods', 'Service', name='accounttype')

def upgrade() -> None:
    bind = op.get_bind()

    # 1. Create new enum
    new_enum.create(bind, checkfirst=True)

    # 2. Alter column with explicit USING cast
    op.execute(
        "ALTER TABLE accounts "
        "ALTER COLUMN account_type "
        "TYPE account_type_enum "
        "USING account_type::text::account_type_enum"
    )

    # 3. Drop old enum
    old_enum.drop(bind, checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()

    # 1. Recreate old enum
    old_enum.create(bind, checkfirst=True)

    # 2. Revert column with cast
    op.execute(
        "ALTER TABLE accounts "
        "ALTER COLUMN account_type "
        "TYPE accounttype "
        "USING account_type::text::accounttype"
    )

    # 3. Drop new enum
    new_enum.drop(bind, checkfirst=True)
