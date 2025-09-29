from sqlalchemy import event
from db.models import Purchasing_Detail, Purchasing, Ledger
from models.enum import LedgerRef, LedgerLocation

#region Purchasing
def _get_purchasing(connection, purchasing_id):
    return connection.execute(
        Purchasing.__table__.select().where(Purchasing.id == purchasing_id)
    ).fetchone()


@event.listens_for(Purchasing_Detail, "after_insert")
def create_ledger_entry(mapper, connection, target):
    purchasing = _get_purchasing(connection, target.purchasing_id)
    if not purchasing:
        return

    connection.execute(
        Ledger.__table__.insert().values(
            date=purchasing.date,
            ref=LedgerRef.Purchasing.value,
            ref_code=purchasing.code or "",
            location=LedgerLocation.Gudang.value,
            qty_in=target.quantity or 0.0,
            qty_out=0.0,
            product_id=target.product_id,
        )
    )


@event.listens_for(Purchasing_Detail, "after_update")
def update_ledger_entry(mapper, connection, target):
    purchasing = _get_purchasing(connection, target.purchasing_id)
    if not purchasing:
        return

    connection.execute(
        Ledger.__table__.update()
        .where(Ledger.ref == LedgerRef.Purchasing.value)
        .where(Ledger.ref_code == (purchasing.code or ""))
        .where(Ledger.product_id == target.product_id)
        .values(
            date=purchasing.date,
            qty_in=target.quantity or 0.0,
        )
    )


@event.listens_for(Purchasing_Detail, "after_delete")
def delete_ledger_entry(mapper, connection, target):
    purchasing = _get_purchasing(connection, target.purchasing_id)
    if not purchasing:
        return

    connection.execute(
        Ledger.__table__.delete()
        .where(Ledger.ref == LedgerRef.Purchasing.value)
        .where(Ledger.ref_code == (purchasing.code or ""))
        .where(Ledger.product_id == target.product_id)
    )
#endregion Purchasing
