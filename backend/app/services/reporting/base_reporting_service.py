# app/services/reporting/base_reporting_service.py
from datetime import datetime
from typing import Dict, Any, Union
from sqlalchemy.orm import Session
from pydantic import BaseModel

class BaseReportService:
    def __init__(self, db: Session):
        self.db = db

    def normalize_filters(self, filters: Union[Dict[str, Any], BaseModel]) -> Dict[str, Any]:
        """Ensure all filters are normalized and have proper types."""
        if isinstance(filters, BaseModel):
            filters = filters.dict()

        def parse_date(val):
            if not val:
                return None
            if isinstance(val, datetime):
                return val
            try:
                return datetime.fromisoformat(val)
            except Exception:
                return None

        start = parse_date(filters.get("start_date"))
        end = parse_date(filters.get("end_date"))
        acc_type = filters.get("account_type")

        return {
            **filters,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "account_type": acc_type,
        }

    def run(self, filters: Dict[str, Any]):
        raise NotImplementedError
