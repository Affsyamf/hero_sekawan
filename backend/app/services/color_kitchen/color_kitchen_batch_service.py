from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_, and_

from app.schemas.input_models.color_kitchen_input_models import ColorKitchenBatchCreate, ColorKitchenBatchUpdate
from app.services.common.audit_logger import AuditLoggerService
from app.core.database import Session, get_db
from app.models import ColorKitchenBatch, ColorKitchenBatchDetail, ColorKitchenEntry
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse


class ColorKitchenBatchService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_color_kitchen_batch(self, request: ListRequest):
        batch = self.db.query(ColorKitchenBatch)

        if request.q:
            like = f"%{request.q}%"
            batch = batch.filter(
                or_(
                    ColorKitchenBatch.code.ilike(like),
                )
            ).order_by(ColorKitchenBatch.id.desc())
            
        if request.start_date and request.end_date:
            start = datetime.strptime(request.start_date, '%Y-%m-%d').date()
            end = datetime.strptime(request.end_date, '%Y-%m-%d').date()
            
            batch = batch.filter(
                and_(
                    ColorKitchenBatch.date >= start,
                    ColorKitchenBatch.date <= end
                )
            )

        return APIResponse.paginated(batch, request)

    def get_color_kitchen_batch(self, batch_id: int):
        batch = self.db.query(ColorKitchenBatch).filter(ColorKitchenBatch.id == batch_id).first()

        if not batch:
            raise HTTPException(status_code=404, detail=f"Color Kitchen Batch ID '{batch_id}' not found.")

        details = []
        for detail in batch.details:
            details.append({
                "id": detail.id,
                "product_id": detail.product_id,
                "product_name": detail.product.name if detail.product else None,
                "quantity": float(detail.quantity) if detail.quantity else 0,
            })

        entries = []
        for entry in batch.entries:
            entries.append({
                "id": entry.id,
                "code": entry.code,
                "date": entry.date.isoformat() if entry.date else None,
                "design_id": entry.design_id,
                "design_code": entry.design.code if entry.design else None,
                "rolls": entry.rolls,
                "paste_quantity": float(entry.paste_quantity) if entry.paste_quantity else 0,
            })

        response = {
            "id": batch.id,
            "code": batch.code,
            "date": batch.date.isoformat() if batch.date else None,
            "details": details,
            "entries": entries,
        }

        return APIResponse.ok(data=response)

    def create_color_kitchen_batch(self, request: ColorKitchenBatchCreate):
        batch = ColorKitchenBatch(
            code=request.code,
            date=request.date
        )
        self.db.add(batch)
        self.db.flush()

        if request.details:
            for detail_data in request.details:
                detail = ColorKitchenBatchDetail(
                    batch_id=batch.id,
                    product_id=detail_data.product_id,
                    quantity=detail_data.quantity
                )
                self.db.add(detail)

        return APIResponse.created()

    def update_color_kitchen_batch(self, batch_id: int, request: ColorKitchenBatchUpdate):
        batch = self.db.query(ColorKitchenBatch).filter(ColorKitchenBatch.id == batch_id).first()
        if not batch:
            raise HTTPException(status_code=404, detail=f"Color Kitchen Batch ID '{batch_id}' not found.")

        old_data = {
            "code": batch.code,
            "date": batch.date.isoformat() if batch.date else None,
        }

        if request.code is not None:
            batch.code = request.code
        if request.date is not None:
            batch.date = request.date

        if request.details is not None:
            self.db.query(ColorKitchenBatchDetail).filter(
                ColorKitchenBatchDetail.batch_id == batch_id
            ).delete(synchronize_session=False)

            for detail_data in request.details:
                detail = ColorKitchenBatchDetail(
                    batch_id=batch_id,
                    product_id=detail_data.product_id,
                    quantity=detail_data.quantity
                )
                self.db.add(detail)

        new_data = {
            "code": batch.code,
            "date": batch.date.isoformat() if batch.date else None,
        }

        AuditLoggerService(self.db).log_update(
            table_name=ColorKitchenBatch.__tablename__,
            record_id=batch_id,
            old_data=old_data,
            new_data=new_data,
            changed_by="system"
        )

        return APIResponse.ok(f"Color Kitchen Batch ID '{batch_id}' updated.")

    def delete_color_kitchen_batch(self, batch_id: int):
        batch = self.db.query(ColorKitchenBatch).filter(ColorKitchenBatch.id == batch_id).first()
        if not batch:
            raise HTTPException(status_code=404, detail=f"Color Kitchen Batch ID '{batch_id}' not found.")

        entry_count = self.db.query(ColorKitchenEntry).filter(ColorKitchenEntry.batch_id == batch_id).count()

        if entry_count > 0:
            msg = (
                "Color Kitchen Batch tidak bisa dihapus karena sudah digunakan pada data lain: "
                f"{entry_count} Color Kitchen Entry."
            )
            raise HTTPException(status_code=409, detail=msg)

        old_data = {
            key: value
            for key, value in vars(batch).items()
            if not key.startswith("_")
        }

        AuditLoggerService(self.db).log_delete(
            table_name=ColorKitchenBatch.__tablename__,
            record_id=batch_id,
            old_data=old_data,
            changed_by="system"
        )

        self.db.delete(batch)

        return APIResponse.ok(f"Color Kitchen Batch ID '{batch_id}' deleted.")