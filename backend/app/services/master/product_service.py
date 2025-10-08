# backend/app/services/master/product_service.py
from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_

from app.schemas.input_models.master_input_models import ProductCreate, ProductUpdate
from app.services.common.audit_logger import AuditLoggerService
from core.database import Session, get_db
from app.models import (
    Product, PurchasingDetail, StockMovementDetail, 
    ColorKitchenEntryDetail, Ledger, StockOpnameDetail
)
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse


class ProductService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_product(self, request: ListRequest):
        product = self.db.query(Product)

        if request.search:
            like = f"%{request.search}%"
            product = product.filter(
                or_(
                    Product.code.ilike(like),
                    Product.name.ilike(like),
                    Product.unit.ilike(like),
                )
            ).order_by(Product.id)

        return APIResponse.paginated(product, request)

    def get_product(self, product_id: int):
        product = self.db.query(Product).filter(Product.id == product_id).first()

        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID '{product_id}' not found.")

        response = {
            "id": product.id,
            "code": product.code,
            "name": product.name,
            "unit": product.unit,
            "account_id": product.account_id,
            "account_name": product.account.name if product.account else None,
        }

        return APIResponse.ok(data=response)

    def create_product(self, request: ProductCreate):
        # Cek apakah code sudah ada (jika diisi)
        if request.code:
            existing = self.db.query(Product).filter(Product.code == request.code).first()
            if existing:
                raise HTTPException(status_code=409, detail=f"Product code '{request.code}' already exists.")

        # Cek apakah name sudah ada
        existing_name = self.db.query(Product).filter(Product.name == request.name).first()
        if existing_name:
            raise HTTPException(status_code=409, detail=f"Product name '{request.name}' already exists.")

        product = Product(**request.model_dump())
        self.db.add(product)

        return APIResponse.created()

    def update_product(self, product_id: int, request: ProductUpdate):
        update_data = request.model_dump(exclude_unset=True)

        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID '{product_id}' not found.")

        # Cek apakah code baru sudah dipakai product lain
        if "code" in update_data and update_data["code"]:
            existing = self.db.query(Product).filter(
                Product.code == update_data["code"],
                Product.id != product_id
            ).first()
            if existing:
                raise HTTPException(status_code=409, detail=f"Product code '{update_data['code']}' already exists.")

        # Cek apakah name baru sudah dipakai product lain
        if "name" in update_data:
            existing_name = self.db.query(Product).filter(
                Product.name == update_data["name"],
                Product.id != product_id
            ).first()
            if existing_name:
                raise HTTPException(status_code=409, detail=f"Product name '{update_data['name']}' already exists.")

        old_data = {k: getattr(product, k) for k in update_data.keys()}

        result = (
            self.db.query(Product)
                .filter(Product.id == product_id)
                .update(update_data, synchronize_session=False)
        )

        if result == 0:
            raise HTTPException(status_code=404, detail=f"Product ID '{product_id}' not found.")
        
        AuditLoggerService(self.db).log_update(
            table_name=Product.__tablename__,
            record_id=product_id,
            old_data=old_data,
            new_data=update_data,
            changed_by="system"
        )

        return APIResponse.ok(f"Product ID '{product_id}' updated.")

    def delete_product(self, product_id: int):
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID '{product_id}' not found.")

        # Cek relasi
        purchasing_count = self.db.query(PurchasingDetail).filter(PurchasingDetail.product_id == product_id).count()
        stock_movement_count = self.db.query(StockMovementDetail).filter(StockMovementDetail.product_id == product_id).count()
        color_kitchen_count = self.db.query(ColorKitchenEntryDetail).filter(ColorKitchenEntryDetail.product_id == product_id).count()
        ledger_count = self.db.query(Ledger).filter(Ledger.product_id == product_id).count()
        stock_opname_count = self.db.query(StockOpnameDetail).filter(StockOpnameDetail.product_id == product_id).count()

        total_usage = purchasing_count + stock_movement_count + color_kitchen_count + ledger_count + stock_opname_count

        if total_usage > 0:
            msg = (
                "Product tidak bisa dihapus karena sudah digunakan pada data lain: "
                f"{purchasing_count} Purchasing Detail, {stock_movement_count} Stock Movement Detail, "
                f"{color_kitchen_count} Color Kitchen Entry Detail, {ledger_count} Ledger, "
                f"{stock_opname_count} Stock Opname Detail."
            )
            raise HTTPException(status_code=409, detail=msg)
        
        old_data = {
            key: value
            for key, value in vars(product).items()
            if not key.startswith("_")
        }
        
        AuditLoggerService(self.db).log_delete(
            table_name=Product.__tablename__,
            record_id=product_id,
            old_data=old_data,
            changed_by="system"
        )

        self.db.delete(product)

        return APIResponse.ok(f"Product ID '{product_id}' deleted.")