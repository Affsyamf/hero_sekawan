from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_

from app.schemas.input_models.ledger_input_models import LedgerCreate, LedgerUpdate
from app.services.common.audit_logger import AuditLoggerService
from app.core.database import Session, get_db
from app.models import Ledger
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse


class LedgerService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_ledger(self, request: ListRequest):
        ledger = self.db.query(Ledger)

        if request.q:
            like = f"%{request.q}%"
            ledger = ledger.filter(
                or_(
                    Ledger.ref_code.ilike(like),
                )
            ).order_by(Ledger.id.desc())

        return APIResponse.paginated(ledger, request)

    def get_ledger(self, ledger_id: int):
        ledger = self.db.query(Ledger).filter(Ledger.id == ledger_id).first()

        if not ledger:
            raise HTTPException(status_code=404, detail=f"Ledger ID '{ledger_id}' not found.")

        response = {
            "id": ledger.id,
            "date": ledger.date.isoformat() if ledger.date else None,
            "ref": ledger.ref.value if ledger.ref else None,
            "ref_code": ledger.ref_code,
            "location": ledger.location.value if ledger.location else None,
            "quantity_in": float(ledger.quantity_in) if ledger.quantity_in else 0,
            "quantity_out": float(ledger.quantity_out) if ledger.quantity_out else 0,
            "product_id": ledger.product_id,
            "product_name": ledger.product.name if ledger.product else None,
        }

        return APIResponse.ok(data=response)

    def create_ledger(self, request: LedgerCreate):
        ledger = Ledger(**request.model_dump())
        self.db.add(ledger)

        return APIResponse.created()

    def update_ledger(self, ledger_id: int, request: LedgerUpdate):
        update_data = request.model_dump(exclude_unset=True)

        ledger = self.db.query(Ledger).filter(Ledger.id == ledger_id).first()
        if not ledger:
            raise HTTPException(status_code=404, detail=f"Ledger ID '{ledger_id}' not found.")

        old_data = {k: getattr(ledger, k) for k in update_data.keys()}

        result = (
            self.db.query(Ledger)
                .filter(Ledger.id == ledger_id)
                .update(update_data, synchronize_session=False)
        )

        if result == 0:
            raise HTTPException(status_code=404, detail=f"Ledger ID '{ledger_id}' not found.")
        
        AuditLoggerService(self.db).log_update(
            table_name=Ledger.__tablename__,
            record_id=ledger_id,
            old_data=old_data,
            new_data=update_data,
            changed_by="system"
        )

        return APIResponse.ok(f"Ledger ID '{ledger_id}' updated.")

    def delete_ledger(self, ledger_id: int):
        ledger = self.db.query(Ledger).filter(Ledger.id == ledger_id).first()
        if not ledger:
            raise HTTPException(status_code=404, detail=f"Ledger ID '{ledger_id}' not found.")

        old_data = {
            key: value
            for key, value in vars(ledger).items()
            if not key.startswith("_")
        }
        
        AuditLoggerService(self.db).log_delete(
            table_name=Ledger.__tablename__,
            record_id=ledger_id,
            old_data=old_data,
            changed_by="system"
        )

        self.db.delete(ledger)

        return APIResponse.ok(f"Ledger ID '{ledger_id}' deleted.")