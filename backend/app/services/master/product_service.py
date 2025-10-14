# backend/app/services/master/product_service.py
from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from fastapi.responses import JSONResponse
from sqlalchemy import func, or_

from app.schemas.input_models.master_input_models import ProductCreate, ProductUpdate
from app.core.database import Session, get_db
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
                
        if request.q:
            like = f"%{request.q}%"
            product = product.filter(
                or_(
                    Product.code.ilike(like),
                    Product.name.ilike(like),
                    Product.unit.ilike(like),
                )
            ).order_by(Product.id)
            
        return APIResponse.paginated(product, request, lambda product: {
                "id": product.id,
                "code": product.code,
                "name": product.name,
                "unit": product.unit,
                # "alias": product.alias,
                # "products": [{
                #     "id": product.id,
                #     "code": product.code,
                #     "name": product.name,
                #     "name": product.name,
                # } for product in account.products] if account.products else []
            }
        )

        # return APIResponse.paginated(product, request)

    def get_product(self, product_id: int):
        product = self.db.query(Product).filter(Product.id == product_id).first()

        if not product:
            return APIResponse.not_found(message=f"Product ID '{product_id}' not found.")

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
        request.name = request.name.upper().strip()
        if request.unit:
            request.unit = request.unit.upper().strip()
        
        # Cek apakah code sudah ada (jika diisi)
        if request.code:
            existing = self.db.query(Product).filter(Product.code == request.code).first()
            if existing:
                return APIResponse.conflict(message=f"Product code '{request.code}' already exists.")

        # Cek apakah name sudah ada
        existing_name = self.db.query(Product).filter(Product.name == request.name).first()
        if existing_name:
            return APIResponse.conflict(message=f"Product name '{request.name}' already exists.")

        product = Product(**request.model_dump())
        self.db.add(product)

        return APIResponse.created()

    def update_product(self, product_id: int, request: ProductUpdate):
        if request.name:
            request.name = request.name.upper().strip()
        if request.unit:
            request.unit = request.unit.upper().strip()
            
        update_data = request.model_dump(exclude_unset=True)

        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return APIResponse.not_found(message=f"Product ID '{product_id}' not found.")

        # Cek apakah code baru sudah dipakai product lain
        if "code" in update_data and update_data["code"]:
            existing = self.db.query(Product).filter(
                Product.code == update_data["code"],
                Product.id != product_id
            ).first()
            if existing:
                return APIResponse.conflict(message=f"Product code '{update_data['code']}' already exists.")

        # Cek apakah name baru sudah dipakai product lain
        if "name" in update_data:
            existing_name = self.db.query(Product).filter(
                Product.name == update_data["name"],
                Product.id != product_id
            ).first()
            if existing_name:
                return APIResponse.conflict(message=f"Product name '{update_data['name']}' already exists.")

        result = (
            self.db.query(Product)
                .filter(Product.id == product_id)
                .update(update_data)
        )

        if result == 0:
            return APIResponse.not_found(message=f"Product ID '{product_id}' not found.")
        
        return APIResponse.ok(f"Product ID '{product_id}' updated.")

    def delete_product(self, product_id: int):
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return APIResponse.not_found(message=f"Product ID '{product_id}' not found.")
        

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
            return APIResponse.conflict(message=msg)
        
        self.db.delete(product)

        return APIResponse.ok(f"Product ID '{product_id}' deleted.")