from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_, func, and_
from sqlalchemy.orm import joinedload

from app.schemas.input_models.color_kitchen_input_models import ColorKitchenEntryCreate, ColorKitchenEntryUpdate
from app.models.master import Design
from app.services.common.audit_logger import AuditLoggerService
from app.core.database import Session, get_db
from app.models import ColorKitchenEntry, ColorKitchenEntryDetail, ColorKitchenBatch, ColorKitchenBatchDetail
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse


class ColorKitchenEntryService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_color_kitchen_entry(self, request: ListRequest):
        entry = self.db.query(
            ColorKitchenEntry,
            func.count(ColorKitchenEntryDetail.id).label("item_count"),
            func.sum(ColorKitchenEntryDetail.quantity).label("total_quantity"),
            func.sum(ColorKitchenEntryDetail.total_cost).label("total_cost")
        ).outerjoin(ColorKitchenEntry.details)\
        .outerjoin(ColorKitchenEntry.design)\
        .outerjoin(ColorKitchenEntry.batch)\
        .group_by(ColorKitchenEntry.id)

        if request.q:
            like = f"%{request.q}%"
            entry = entry.filter(
                or_(
                    ColorKitchenEntry.code.ilike(like),
                    ColorKitchenEntry.design.has(Design.name.ilike(like))
                )
            )
            
        if request.start_date and request.end_date:
            # try:
            start = datetime.strptime(request.start_date, '%Y-%m-%d').date()
            end = datetime.strptime(request.end_date, '%Y-%m-%d').date()
            
            entry = entry.filter(
                and_(
                    ColorKitchenEntry.date >= start,
                    ColorKitchenEntry.date <= end
                )
            )
            
        entry = entry.order_by(ColorKitchenEntry.id.desc())

        return APIResponse.paginated(entry, request, lambda row: {
            "id": row.ColorKitchenEntry.id,
            "date": row.ColorKitchenEntry.date.isoformat() if row.ColorKitchenEntry.date else None,
            "code": row.ColorKitchenEntry.code,
            "rolls": row.ColorKitchenEntry.rolls or 0,
            "paste_quantity": float(row.ColorKitchenEntry.paste_quantity) if row.ColorKitchenEntry.paste_quantity else 0,
            "design_id": row.ColorKitchenEntry.design_id,
            "design_name": row.ColorKitchenEntry.design.code if row.ColorKitchenEntry.design else None,
            "batch_id": row.ColorKitchenEntry.batch_id,
            "batch_code": row.ColorKitchenEntry.batch.code if row.ColorKitchenEntry.batch else None,
            "item_count": row.item_count or 0,
            "total_quantity": float(row.total_quantity) if row.total_quantity else 0,
            "total_cost": float(row.total_cost) if row.total_cost else 0,
        })
        # return APIResponse.paginated(entry, request)

    def get_color_kitchen_entry(self, entry_id: int):
        entry = self.db.query(ColorKitchenEntry).options(
            joinedload(ColorKitchenEntry.design),
            joinedload(ColorKitchenEntry.batch).joinedload(ColorKitchenBatch.details).joinedload(ColorKitchenBatchDetail.product),
            joinedload(ColorKitchenEntry.details).joinedload(ColorKitchenEntryDetail.product),
        ).filter(ColorKitchenEntry.id == entry_id).first()

        if not entry:
            raise HTTPException(status_code=404, detail=f"Color Kitchen Entry ID '{entry_id}' not found.")

        aux_details = []
        for detail in entry.details or []:
            aux_details.append({
                "id": detail.id,
                "product_id": detail.product_id,
                "product_name": detail.product.name if detail.product else None,
                "quantity": float(detail.quantity or 0),
                "unit": detail.product.unit if detail.product else None,
                "unit_cost_used": float(detail.unit_cost_used or 0),
                "total_cost": float(detail.total_cost or 0),
            })

        dye_details = []
        if entry.batch:
            for detail in entry.batch.details or []:
                dye_details.append({
                    "id": detail.id,
                    "product_id": detail.product_id,
                    "product_name": detail.product.name if detail.product else None,
                    "quantity": float(detail.quantity or 0),
                    "unit": detail.product.unit if detail.product else None,
                    "unit_cost_used": float(detail.unit_cost_used or 0),
                    "total_cost": float(detail.total_cost or 0),
                })


        response = {
            "id": entry.id,
            "code": entry.code,
            "date": entry.date.isoformat() if entry.date else None,
            "rolls": entry.rolls,
            "paste_quantity": float(entry.paste_quantity) if entry.paste_quantity else 0,
            "design_id": entry.design_id,
            "design_code": entry.design.code if entry.design else None,
            "batch_id": entry.batch_id,
            "batch_code": entry.batch.code if entry.batch else None,
            "details": {
                "aux": aux_details,
                "dye": dye_details,
            },
        }

        return APIResponse.ok(data=response)

    def create_color_kitchen_entry(self, request: ColorKitchenEntryCreate):
        entry = ColorKitchenEntry(
            code=request.code,
            date=request.date,
            rolls=request.rolls,
            paste_quantity=request.paste_quantity,
            design_id=request.design_id,
            batch_id=request.batch_id
        )
        self.db.add(entry)
        self.db.flush()

        if request.details:
            for detail_data in request.details:
                detail = ColorKitchenEntryDetail(
                    color_kitchen_entry_id=entry.id,
                    product_id=detail_data.product_id,
                    quantity=detail_data.quantity
                )
                self.db.add(detail)

        return APIResponse.created()

    def update_color_kitchen_entry(self, entry_id: int, request: ColorKitchenEntryUpdate):
        entry = self.db.query(ColorKitchenEntry).filter(ColorKitchenEntry.id == entry_id).first()
        if not entry:
            raise HTTPException(status_code=404, detail=f"Color Kitchen Entry ID '{entry_id}' not found.")

        old_data = {
            "code": entry.code,
            "date": entry.date.isoformat() if entry.date else None,
            "rolls": entry.rolls,
            "paste_quantity": float(entry.paste_quantity) if entry.paste_quantity else 0,
            "design_id": entry.design_id,
            "batch_id": entry.batch_id,
        }

        if request.code is not None:
            entry.code = request.code
        if request.date is not None:
            entry.date = request.date
        if request.rolls is not None:
            entry.rolls = request.rolls
        if request.paste_quantity is not None:
            entry.paste_quantity = request.paste_quantity
        if request.design_id is not None:
            entry.design_id = request.design_id
        if request.batch_id is not None:
            entry.batch_id = request.batch_id

        if request.details is not None:
            self.db.query(ColorKitchenEntryDetail).filter(
                ColorKitchenEntryDetail.color_kitchen_entry_id == entry_id
            ).delete(synchronize_session=False)

            for detail_data in request.details:
                detail = ColorKitchenEntryDetail(
                    color_kitchen_entry_id=entry_id,
                    product_id=detail_data.product_id,
                    quantity=detail_data.quantity
                )
                self.db.add(detail)

        new_data = {
            "code": entry.code,
            "date": entry.date.isoformat() if entry.date else None,
            "rolls": entry.rolls,
            "paste_quantity": float(entry.paste_quantity) if entry.paste_quantity else 0,
            "design_id": entry.design_id,
            "batch_id": entry.batch_id,
        }

        AuditLoggerService(self.db).log_update(
            table_name=ColorKitchenEntry.__tablename__,
            record_id=entry_id,
            old_data=old_data,
            new_data=new_data,
            changed_by="system"
        )

        return APIResponse.ok(f"Color Kitchen Entry ID '{entry_id}' updated.")

    def delete_color_kitchen_entry(self, entry_id: int):
        entry = self.db.query(ColorKitchenEntry).filter(ColorKitchenEntry.id == entry_id).first()
        if not entry:
            raise HTTPException(status_code=404, detail=f"Color Kitchen Entry ID '{entry_id}' not found.")

        old_data = {
            key: value
            for key, value in vars(entry).items()
            if not key.startswith("_")
        }

        AuditLoggerService(self.db).log_delete(
            table_name=ColorKitchenEntry.__tablename__,
            record_id=entry_id,
            old_data=old_data,
            changed_by="system"
        )

        self.db.delete(entry)

        return APIResponse.ok(f"Color Kitchen Entry ID '{entry_id}' deleted.")