from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_

from app.schemas.input_models.master_input_models import SupplierCreate, SupplierUpdate
from app.services.common.audit_logger import AuditLoggerService
from core.database import Session, get_db
from app.models import Supplier, Purchasing
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse


class SupplierService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_supplier(self, request: ListRequest):
        supplier = self.db.query(Supplier)

        if request.q:
            like = f"%{request.q}%"
            supplier = supplier.filter(
                or_(
                    Supplier.code.ilike(like),
                    Supplier.name.ilike(like),
                    Supplier.contact_info.ilike(like),
                )
            ).order_by(Supplier.id)

        return APIResponse.paginated(supplier, request)

    def get_supplier(self, supplier_id: int):
        supplier = self.db.query(Supplier).filter(Supplier.id == supplier_id).first()

        if not supplier:
            raise HTTPException(status_code=404, detail=f"Supplier ID '{supplier_id}' not found.")

        purchasings = []
        for purchasing in sorted(supplier.purchasings, key=lambda x: x.date or datetime.max):
            purchasings.append({
                "id": purchasing.id,
                "date": purchasing.date.isoformat() if purchasing.date else None,
                "total_amount": purchasing.total_amount,
                "status": purchasing.status,
            })

        response = {
            "id": supplier.id,
            "code": supplier.code,
            "name": supplier.name,
            "contact_info": supplier.contact_info,
            "purchasings": purchasings,
        }

        return APIResponse.ok(data=response)

    def create_supplier(self, request: SupplierCreate):
        # Cek apakah code sudah ada
        existing = self.db.query(Supplier).filter(Supplier.code == request.code).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"Supplier code '{request.code}' already exists.")

        supplier = Supplier(**request.model_dump())
        self.db.add(supplier)

        # Populate supplier.id without committing the whole transaction
        # self.db.flush()

        return APIResponse.created()

    def update_supplier(self, supplier_id: int, request: SupplierUpdate):
        update_data = request.model_dump(exclude_unset=True)

        supplier = self.db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail=f"Supplier ID '{supplier_id}' not found.")

        # Cek apakah code baru sudah dipakai supplier lain
        if "code" in update_data:
            existing = self.db.query(Supplier).filter(
                Supplier.code == update_data["code"],
                Supplier.id != supplier_id
            ).first()
            if existing:
                raise HTTPException(status_code=409, detail=f"Supplier code '{update_data['code']}' already exists.")

        old_data = {k: getattr(supplier, k) for k in update_data.keys()}

        result = (
            self.db.query(Supplier)
                .filter(Supplier.id == supplier_id)
                .update(update_data, synchronize_session=False)
        )

        if result == 0:
            raise HTTPException(status_code=404, detail=f"Supplier ID '{supplier_id}' not found.")
        
        # Add to log
        AuditLoggerService(self.db).log_update(
            table_name=Supplier.__tablename__,
            record_id=supplier_id,
            old_data=old_data,
            new_data=update_data,
            changed_by="system"  # harusnya ambil dari current_user
        )

        return APIResponse.ok(f"Supplier ID '{supplier_id}' updated.")

    def delete_supplier(self, supplier_id: int):
        supplier = self.db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail=f"Supplier ID '{supplier_id}' not found.")

        # Cek relasi: jika sudah dipakai di purchasing, tolak hapus
        purchasing_count = self.db.query(Purchasing).filter(Purchasing.supplier_id == supplier_id).count()

        if purchasing_count > 0:
            # kembalikan info detail agar frontend bisa tampilkan popup
            msg = (
                "Supplier tidak bisa dihapus karena sudah digunakan pada data lain: "
                f"{purchasing_count} Purchasing."
            )
            # pakai ValueError agar ditangkap router dan diubah ke HTTP 409
            raise HTTPException(status_code=409, detail=msg)
        
        old_data = {
            key: value
            for key, value in vars(supplier).items()
            if not key.startswith("_")
        }
        
        # Add to log
        AuditLoggerService(self.db).log_delete(
            table_name=Supplier.__tablename__,
            record_id=supplier_id,
            old_data=old_data,
            changed_by="system"  # harusnya ambil dari current_user
        )

        self.db.delete(supplier)

        return APIResponse.ok(f"Supplier ID '{supplier_id}' deleted.")