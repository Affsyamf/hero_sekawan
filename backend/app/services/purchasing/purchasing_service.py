from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_

from app.schemas.input_models.purchasing_input_models import PurchasingCreate, PurchasingUpdate
from app.services.common.audit_logger import AuditLoggerService
from core.database import Session, get_db
from app.models import Purchasing, PurchasingDetail
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse


class PurchasingService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_purchasing(self, request: ListRequest):
        purchasing = self.db.query(Purchasing)

        if request.q:
            like = f"%{request.q}%"
            purchasing = purchasing.filter(
                or_(
                    Purchasing.code.ilike(like),
                    Purchasing.purchase_order.ilike(like),
                )
            ).order_by(Purchasing.id.desc())

        return APIResponse.paginated(purchasing, request)

    def get_purchasing(self, purchasing_id: int):
        purchasing = self.db.query(Purchasing).filter(Purchasing.id == purchasing_id).first()

        if not purchasing:
            raise HTTPException(status_code=404, detail=f"Purchasing ID '{purchasing_id}' not found.")

        details = []
        for detail in purchasing.details:
            details.append({
                "id": detail.id,
                "product_id": detail.product_id,
                "product_name": detail.product.name if detail.product else None,
                "quantity": float(detail.quantity) if detail.quantity else 0,
                "price": float(detail.price) if detail.price else 0,
                "discount": float(detail.discount) if detail.discount else 0,
                "ppn": float(detail.ppn) if detail.ppn else 0,
                "pph": float(detail.pph) if detail.pph else 0,
                "dpp": float(detail.dpp) if detail.dpp else 0,
                "tax_no": detail.tax_no,
                "exchange_rate": float(detail.exchange_rate) if detail.exchange_rate else 0,
            })

        response = {
            "id": purchasing.id,
            "date": purchasing.date.isoformat() if purchasing.date else None,
            "code": purchasing.code,
            "purchase_order": purchasing.purchase_order,
            "supplier_id": purchasing.supplier_id,
            "supplier_name": purchasing.supplier.name if purchasing.supplier else None,
            "details": details,
        }

        return APIResponse.ok(data=response)

    def create_purchasing(self, request: PurchasingCreate):
        purchasing = Purchasing(
            date=request.date,
            code=request.code,
            purchase_order=request.purchase_order,
            supplier_id=request.supplier_id
        )
        self.db.add(purchasing)
        self.db.flush()

        if request.details:
            for detail_data in request.details:
                detail = PurchasingDetail(
                    purchasing_id=purchasing.id,
                    product_id=detail_data.product_id,
                    quantity=detail_data.quantity,
                    price=detail_data.price,
                    discount=detail_data.discount,
                    ppn=detail_data.ppn,
                    pph=detail_data.pph,
                    dpp=detail_data.dpp,
                    tax_no=detail_data.tax_no,
                    exchange_rate=detail_data.exchange_rate
                )
                self.db.add(detail)

        return APIResponse.created()

    def update_purchasing(self, purchasing_id: int, request: PurchasingUpdate):
        purchasing = self.db.query(Purchasing).filter(Purchasing.id == purchasing_id).first()
        if not purchasing:
            raise HTTPException(status_code=404, detail=f"Purchasing ID '{purchasing_id}' not found.")

        old_data = {
            "date": purchasing.date.isoformat() if purchasing.date else None,
            "code": purchasing.code,
            "purchase_order": purchasing.purchase_order,
            "supplier_id": purchasing.supplier_id,
        }

        if request.date is not None:
            purchasing.date = request.date
        if request.code is not None:
            purchasing.code = request.code
        if request.purchase_order is not None:
            purchasing.purchase_order = request.purchase_order
        if request.supplier_id is not None:
            purchasing.supplier_id = request.supplier_id

        if request.details is not None:
            self.db.query(PurchasingDetail).filter(
                PurchasingDetail.purchasing_id == purchasing_id
            ).delete(synchronize_session=False)

            for detail_data in request.details:
                detail = PurchasingDetail(
                    purchasing_id=purchasing_id,
                    product_id=detail_data.product_id,
                    quantity=detail_data.quantity,
                    price=detail_data.price,
                    discount=detail_data.discount,
                    ppn=detail_data.ppn,
                    pph=detail_data.pph,
                    dpp=detail_data.dpp,
                    tax_no=detail_data.tax_no,
                    exchange_rate=detail_data.exchange_rate
                )
                self.db.add(detail)

        new_data = {
            "date": purchasing.date.isoformat() if purchasing.date else None,
            "code": purchasing.code,
            "purchase_order": purchasing.purchase_order,
            "supplier_id": purchasing.supplier_id,
        }

        AuditLoggerService(self.db).log_update(
            table_name=Purchasing.__tablename__,
            record_id=purchasing_id,
            old_data=old_data,
            new_data=new_data,
            changed_by="system"
        )

        return APIResponse.ok(f"Purchasing ID '{purchasing_id}' updated.")

    def delete_purchasing(self, purchasing_id: int):
        purchasing = self.db.query(Purchasing).filter(Purchasing.id == purchasing_id).first()
        if not purchasing:
            raise HTTPException(status_code=404, detail=f"Purchasing ID '{purchasing_id}' not found.")

        old_data = {
            key: value
            for key, value in vars(purchasing).items()
            if not key.startswith("_")
        }

        self.db.query(PurchasingDetail).filter(
            PurchasingDetail.purchasing_id == purchasing_id
        ).delete(synchronize_session=False)

        AuditLoggerService(self.db).log_delete(
            table_name=Purchasing.__tablename__,
            record_id=purchasing_id,
            old_data=old_data,
            changed_by="system"
        )

        self.db.delete(purchasing)

        return APIResponse.ok(f"Purchasing ID '{purchasing_id}' deleted.")