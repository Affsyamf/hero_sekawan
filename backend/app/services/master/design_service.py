from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_

from app.schemas.input_models.master_input_models import DesignCreate, DesignUpdate
from app.core.database import Session, get_db
from app.models import Design, ColorKitchenEntry
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse


class DesignService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_design(self, request: ListRequest):
        design = self.db.query(Design)

        if request.q:
            like = f"%{request.q}%"
            design = design.filter(
                or_(
                    Design.code.ilike(like),
                )
            ).order_by(Design.id)
            
        if request.sort_by and request.sort_dir:
            sort_col = getattr(Design, request.sort_by)
            if request.sort_dir.lower() == "desc":
                sort_col = sort_col.desc()
            design = design.order_by(sort_col)
            
        return APIResponse.paginated(design, request, lambda design: {
            "id": design.id,
            "code": design.code,
            "type_id": design.type_id,
            "type_name": design.type.name if design.type else None,
            # "color_kitchen_entries": [{
            #         "id": color_kitchen_entries.id,
            #         "date": color_kitchen_entries.date,
            #         "code": color_kitchen_entries.code,
            # } for color_kitchen_entries in design.color_kitchen_entries] if design.color_kitchen_entries else []
        })

        # return APIResponse.paginated(design, request)

    def get_design(self, design_id: int):
        design = self.db.query(Design).filter(Design.id == design_id).first()

        if not design:
            return APIResponse.not_found(message=f"Design ID '{design_id}' not found.")

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
            return APIResponse.conflict(message=f"Design code '{request.code}' already exists.")

        design = Design(**request.model_dump())
        self.db.add(design)

        return APIResponse.created()

    def update_design(self, design_id: int, request: DesignUpdate):
        update_data = request.model_dump(exclude_unset=True)

        design = self.db.query(Design).filter(Design.id == design_id).first()
        if not design:
            return APIResponse.not_found(message=f"Design ID '{design_id}' not found.")

        if "code" in update_data:
            existing = self.db.query(Design).filter(
                Design.code == update_data["code"],
                Design.id != design_id
            ).first()
            if existing:
                return APIResponse.conflict(message=f"Design code '{update_data['code']}' already exists.")

        result = (
            self.db.query(Design)
                .filter(Design.id == design_id)
                .update(update_data, synchronize_session=False)
        )

        if result == 0:
            return APIResponse.not_found(message=f"Design ID '{design_id}' not found.")

        return APIResponse.ok(f"Design ID '{design_id}' updated.")

    def delete_design(self, design_id: int):
        design = self.db.query(Design).filter(Design.id == design_id).first()
        if not design:
            return APIResponse.not_found(message=f"Design ID '{design_id}' not found.")

        color_kitchen_count = self.db.query(ColorKitchenEntry).filter(ColorKitchenEntry.design_id == design_id).count()

        if color_kitchen_count > 0:
            msg = (
                "Design tidak bisa dihapus karena sudah digunakan pada data lain: "
                f"{color_kitchen_count} Color Kitchen Entry."
            )
            return APIResponse.conflict(message=msg)

        self.db.delete(design)

        return APIResponse.ok(f"Design ID '{design_id}' deleted.")