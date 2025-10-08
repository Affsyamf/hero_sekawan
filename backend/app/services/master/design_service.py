from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_

from app.schemas.input_models.master_input_models import DesignCreate, DesignUpdate
from app.services.common.audit_logger import AuditLoggerService
from core.database import Session, get_db
from app.models import Design, ColorKitchenEntry
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse


class DesignService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_design(self, request: ListRequest):
        design = self.db.query(Design)

        if request.search:
            like = f"%{request.search}%"
            design = design.filter(
                or_(
                    Design.code.ilike(like),
                )
            ).order_by(Design.id)

        return APIResponse.paginated(design, request)

    def get_design(self, design_id: int):
        design = self.db.query(Design).filter(Design.id == design_id).first()

        if not design:
            raise HTTPException(status_code=404, detail=f"Design ID '{design_id}' not found.")

        response = {
            "id": design.id,
            "code": design.code,
            "type_id": design.type_id,
            "type_name": design.type.name if design.type else None,
        }

        return APIResponse.ok(data=response)

    def create_design(self, request: DesignCreate):
        existing = self.db.query(Design).filter(Design.code == request.code).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"Design code '{request.code}' already exists.")

        design = Design(**request.model_dump())
        self.db.add(design)

        return APIResponse.created()

    def update_design(self, design_id: int, request: DesignUpdate):
        update_data = request.model_dump(exclude_unset=True)

        design = self.db.query(Design).filter(Design.id == design_id).first()
        if not design:
            raise HTTPException(status_code=404, detail=f"Design ID '{design_id}' not found.")

        if "code" in update_data:
            existing = self.db.query(Design).filter(
                Design.code == update_data["code"],
                Design.id != design_id
            ).first()
            if existing:
                raise HTTPException(status_code=409, detail=f"Design code '{update_data['code']}' already exists.")

        old_data = {k: getattr(design, k) for k in update_data.keys()}

        result = (
            self.db.query(Design)
                .filter(Design.id == design_id)
                .update(update_data, synchronize_session=False)
        )

        if result == 0:
            raise HTTPException(status_code=404, detail=f"Design ID '{design_id}' not found.")
        
        AuditLoggerService(self.db).log_update(
            table_name=Design.__tablename__,
            record_id=design_id,
            old_data=old_data,
            new_data=update_data,
            changed_by="system"
        )

        return APIResponse.ok(f"Design ID '{design_id}' updated.")

    def delete_design(self, design_id: int):
        design = self.db.query(Design).filter(Design.id == design_id).first()
        if not design:
            raise HTTPException(status_code=404, detail=f"Design ID '{design_id}' not found.")

        color_kitchen_count = self.db.query(ColorKitchenEntry).filter(ColorKitchenEntry.design_id == design_id).count()

        if color_kitchen_count > 0:
            msg = (
                "Design tidak bisa dihapus karena sudah digunakan pada data lain: "
                f"{color_kitchen_count} Color Kitchen Entry."
            )
            raise HTTPException(status_code=409, detail=msg)
        
        old_data = {
            key: value
            for key, value in vars(design).items()
            if not key.startswith("_")
        }
        
        AuditLoggerService(self.db).log_delete(
            table_name=Design.__tablename__,
            record_id=design_id,
            old_data=old_data,
            changed_by="system"
        )

        self.db.delete(design)

        return APIResponse.ok(f"Design ID '{design_id}' deleted.")