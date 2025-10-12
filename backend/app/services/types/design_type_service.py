from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_

from app.schemas.input_models.types_input_models import DesignTypeCreate, DesignTypeUpdate
from app.services.common.audit_logger import AuditLoggerService
from core.database import Session, get_db
from app.models import DesignType, Design
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse


class DesignTypeService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_design_type(self, request: ListRequest):
        design_type = self.db.query(DesignType)

        if request.q:
            like = f"%{request.q}%"
            design_type = design_type.filter(
                or_(
                    DesignType.name.ilike(like),
                )
            ).order_by(DesignType.id)

        return APIResponse.paginated(design_type, request)

    def get_design_type(self, design_type_id: int):
        design_type = self.db.query(DesignType).filter(DesignType.id == design_type_id).first()

        if not design_type:
            raise HTTPException(status_code=404, detail=f"Design Type ID '{design_type_id}' not found.")

        response = {
            "id": design_type.id,
            "name": design_type.name,
        }

        return APIResponse.ok(data=response)

    def create_design_type(self, request: DesignTypeCreate):
        existing = self.db.query(DesignType).filter(DesignType.name == request.name).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"Design Type name '{request.name}' already exists.")

        design_type = DesignType(**request.model_dump())
        self.db.add(design_type)

        return APIResponse.created()

    def update_design_type(self, design_type_id: int, request: DesignTypeUpdate):
        update_data = request.model_dump(exclude_unset=True)

        design_type = self.db.query(DesignType).filter(DesignType.id == design_type_id).first()
        if not design_type:
            raise HTTPException(status_code=404, detail=f"Design Type ID '{design_type_id}' not found.")

        if "name" in update_data:
            existing = self.db.query(DesignType).filter(
                DesignType.name == update_data["name"],
                DesignType.id != design_type_id
            ).first()
            if existing:
                raise HTTPException(status_code=409, detail=f"Design Type name '{update_data['name']}' already exists.")

        old_data = {k: getattr(design_type, k) for k in update_data.keys()}

        result = (
            self.db.query(DesignType)
                .filter(DesignType.id == design_type_id)
                .update(update_data, synchronize_session=False)
        )

        if result == 0:
            raise HTTPException(status_code=404, detail=f"Design Type ID '{design_type_id}' not found.")
        
        AuditLoggerService(self.db).log_update(
            table_name=DesignType.__tablename__,
            record_id=design_type_id,
            old_data=old_data,
            new_data=update_data,
            changed_by="system"
        )

        return APIResponse.ok(f"Design Type ID '{design_type_id}' updated.")

    def delete_design_type(self, design_type_id: int):
        design_type = self.db.query(DesignType).filter(DesignType.id == design_type_id).first()
        if not design_type:
            raise HTTPException(status_code=404, detail=f"Design Type ID '{design_type_id}' not found.")

        design_count = self.db.query(Design).filter(Design.type_id == design_type_id).count()

        if design_count > 0:
            msg = (
                "Design Type tidak bisa dihapus karena sudah digunakan pada data lain: "
                f"{design_count} Design."
            )
            raise HTTPException(status_code=409, detail=msg)
        
        old_data = {
            key: value
            for key, value in vars(design_type).items()
            if not key.startswith("_")
        }
        
        AuditLoggerService(self.db).log_delete(
            table_name=DesignType.__tablename__,
            record_id=design_type_id,
            old_data=old_data,
            changed_by="system"
        )

        self.db.delete(design_type)

        return APIResponse.ok(f"Design Type ID '{design_type_id}' deleted.")