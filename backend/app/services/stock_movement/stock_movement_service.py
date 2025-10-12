from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_

from app.schemas.input_models.stock_movement_input_models import StockMovementCreate, StockMovementUpdate
from app.services.common.audit_logger import AuditLoggerService
from core.database import Session, get_db
from app.models import StockMovement, StockMovementDetail
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse


class StockMovementService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_stock_movement(self, request: ListRequest):
        stock_movement = self.db.query(StockMovement)

        if request.q:
            like = f"%{request.q}%"
            stock_movement = stock_movement.filter(
                or_(
                    StockMovement.code.ilike(like),
                )
            ).order_by(StockMovement.id.desc())

        return APIResponse.paginated(stock_movement, request)

    def get_stock_movement(self, stock_movement_id: int):
        stock_movement = self.db.query(StockMovement).filter(StockMovement.id == stock_movement_id).first()

        if not stock_movement:
            raise HTTPException(status_code=404, detail=f"Stock Movement ID '{stock_movement_id}' not found.")

        details = []
        for detail in stock_movement.details:
            details.append({
                "id": detail.id,
                "product_id": detail.product_id,
                "product_name": detail.product.name if detail.product else None,
                "quantity": float(detail.quantity) if detail.quantity else 0,
            })

        response = {
            "id": stock_movement.id,
            "date": stock_movement.date.isoformat() if stock_movement.date else None,
            "code": stock_movement.code,
            "details": details,
        }

        return APIResponse.ok(data=response)

    def create_stock_movement(self, request: StockMovementCreate):
        stock_movement = StockMovement(
            date=request.date,
            code=request.code
        )
        self.db.add(stock_movement)
        self.db.flush()

        if request.details:
            for detail_data in request.details:
                detail = StockMovementDetail(
                    stock_movement_id=stock_movement.id,
                    product_id=detail_data.product_id,
                    quantity=detail_data.quantity
                )
                self.db.add(detail)

        return APIResponse.created()

    def update_stock_movement(self, stock_movement_id: int, request: StockMovementUpdate):
        stock_movement = self.db.query(StockMovement).filter(StockMovement.id == stock_movement_id).first()
        if not stock_movement:
            raise HTTPException(status_code=404, detail=f"Stock Movement ID '{stock_movement_id}' not found.")

        old_data = {
            "date": stock_movement.date.isoformat() if stock_movement.date else None,
            "code": stock_movement.code,
        }

        if request.date is not None:
            stock_movement.date = request.date
        if request.code is not None:
            stock_movement.code = request.code

        if request.details is not None:
            self.db.query(StockMovementDetail).filter(
                StockMovementDetail.stock_movement_id == stock_movement_id
            ).delete(synchronize_session=False)

            for detail_data in request.details:
                detail = StockMovementDetail(
                    stock_movement_id=stock_movement_id,
                    product_id=detail_data.product_id,
                    quantity=detail_data.quantity
                )
                self.db.add(detail)

        new_data = {
            "date": stock_movement.date.isoformat() if stock_movement.date else None,
            "code": stock_movement.code,
        }

        AuditLoggerService(self.db).log_update(
            table_name=StockMovement.__tablename__,
            record_id=stock_movement_id,
            old_data=old_data,
            new_data=new_data,
            changed_by="system"
        )

        return APIResponse.ok(f"Stock Movement ID '{stock_movement_id}' updated.")

    def delete_stock_movement(self, stock_movement_id: int):
        stock_movement = self.db.query(StockMovement).filter(StockMovement.id == stock_movement_id).first()
        if not stock_movement:
            raise HTTPException(status_code=404, detail=f"Stock Movement ID '{stock_movement_id}' not found.")

        old_data = {
            key: value
            for key, value in vars(stock_movement).items()
            if not key.startswith("_")
        }

        self.db.query(StockMovementDetail).filter(
            StockMovementDetail.stock_movement_id == stock_movement_id
        ).delete(synchronize_session=False)

        AuditLoggerService(self.db).log_delete(
            table_name=StockMovement.__tablename__,
            record_id=stock_movement_id,
            old_data=old_data,
            changed_by="system"
        )

        self.db.delete(stock_movement)

        return APIResponse.ok(f"Stock Movement ID '{stock_movement_id}' deleted.")