from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_

from app.schemas.input_models.stock_opname_input_models import StockOpnameCreate, StockOpnameUpdate
from app.services.common.audit_logger import AuditLoggerService
from core.database import Session, get_db
from app.models import StockOpname, StockOpnameDetail
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse


class StockOpnameService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_stock_opname(self, request: ListRequest):
        stock_opname = self.db.query(StockOpname)

        if request.q:
            like = f"%{request.q}%"
            stock_opname = stock_opname.filter(
                or_(
                    StockOpname.code.ilike(like),
                )
            ).order_by(StockOpname.id.desc())

        return APIResponse.paginated(stock_opname, request)

    def get_stock_opname(self, stock_opname_id: int):
        stock_opname = self.db.query(StockOpname).filter(StockOpname.id == stock_opname_id).first()

        if not stock_opname:
            raise HTTPException(status_code=404, detail=f"Stock Opname ID '{stock_opname_id}' not found.")

        details = []
        for detail in stock_opname.details:
            details.append({
                "id": detail.id,
                "product_id": detail.product_id,
                "product_name": detail.product.name if detail.product else None,
                "system_quantity": float(detail.system_quantity) if detail.system_quantity else 0,
                "physical_quantity": float(detail.physical_quantity) if detail.physical_quantity else 0,
                "difference": float(detail.difference) if detail.difference else 0,
            })

        response = {
            "id": stock_opname.id,
            "date": stock_opname.date.isoformat() if stock_opname.date else None,
            "code": stock_opname.code,
            "details": details,
        }

        return APIResponse.ok(data=response)

    def create_stock_opname(self, request: StockOpnameCreate):
        stock_opname = StockOpname(
            date=request.date,
            code=request.code
        )
        self.db.add(stock_opname)
        self.db.flush()

        if request.details:
            for detail_data in request.details:
                detail = StockOpnameDetail(
                    stock_opname_id=stock_opname.id,
                    product_id=detail_data.product_id,
                    system_quantity=detail_data.system_quantity,
                    physical_quantity=detail_data.physical_quantity
                )
                self.db.add(detail)

        return APIResponse.created()

    def update_stock_opname(self, stock_opname_id: int, request: StockOpnameUpdate):
        stock_opname = self.db.query(StockOpname).filter(StockOpname.id == stock_opname_id).first()
        if not stock_opname:
            raise HTTPException(status_code=404, detail=f"Stock Opname ID '{stock_opname_id}' not found.")

        old_data = {
            "date": stock_opname.date.isoformat() if stock_opname.date else None,
            "code": stock_opname.code,
        }

        if request.date is not None:
            stock_opname.date = request.date
        if request.code is not None:
            stock_opname.code = request.code

        if request.details is not None:
            self.db.query(StockOpnameDetail).filter(
                StockOpnameDetail.stock_opname_id == stock_opname_id
            ).delete(synchronize_session=False)

            for detail_data in request.details:
                detail = StockOpnameDetail(
                    stock_opname_id=stock_opname_id,
                    product_id=detail_data.product_id,
                    system_quantity=detail_data.system_quantity,
                    physical_quantity=detail_data.physical_quantity
                )
                self.db.add(detail)

        new_data = {
            "date": stock_opname.date.isoformat() if stock_opname.date else None,
            "code": stock_opname.code,
        }

        AuditLoggerService(self.db).log_update(
            table_name=StockOpname.__tablename__,
            record_id=stock_opname_id,
            old_data=old_data,
            new_data=new_data,
            changed_by="system"
        )

        return APIResponse.ok(f"Stock Opname ID '{stock_opname_id}' updated.")

    def delete_stock_opname(self, stock_opname_id: int):
        stock_opname = self.db.query(StockOpname).filter(StockOpname.id == stock_opname_id).first()
        if not stock_opname:
            raise HTTPException(status_code=404, detail=f"Stock Opname ID '{stock_opname_id}' not found.")

        old_data = {
            key: value
            for key, value in vars(stock_opname).items()
            if not key.startswith("_")
        }

        self.db.query(StockOpnameDetail).filter(
            StockOpnameDetail.stock_opname_id == stock_opname_id
        ).delete(synchronize_session=False)

        AuditLoggerService(self.db).log_delete(
            table_name=StockOpname.__tablename__,
            record_id=stock_opname_id,
            old_data=old_data,
            changed_by="system"
        )

        self.db.delete(stock_opname)

        return APIResponse.ok(f"Stock Opname ID '{stock_opname_id}' deleted.")