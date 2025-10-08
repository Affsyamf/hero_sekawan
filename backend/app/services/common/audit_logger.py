from datetime import datetime
from sqlalchemy.orm import Session
from typing import Any, Optional

from models import AuditColumnLog


class AuditLoggerService:
    def __init__(self, db: Session):
        self.db = db

    def log_update(
        self,
        *,
        table_name: str,
        record_id: Any,
        old_data: Optional[dict] = None,
        new_data: Optional[dict] = None,
        changed_by: Optional[str] = None,
    ):
        # Deteksi jika tidak ada perubahan sama sekali
        changes = {
            key: (old_data.get(key), new_data.get(key))
            for key in new_data.keys()
            if old_data.get(key) != new_data.get(key)
        }

        if not changes:
            return  # tidak ada perubahan, tidak perlu log

        log = AuditColumnLog(
            table_name=table_name,
            record_id=str(record_id),
            old_data={k: v[0] for k, v in changes.items()},
            new_data={k: v[1] for k, v in changes.items()},
            action_type="UPDATE",
            changed_by=changed_by,
            changed_at=datetime.utcnow()
        )

        self.db.add(log)
        self.db.flush()  # Pastikan log tersimpan tanpa perlu commit seluruh transaksi
        
    def log_delete(
        self,
        *,
        table_name: str,
        record_id: Any,
        old_data: dict,
        changed_by: Optional[str] = None
    ):
        log = AuditColumnLog(
            table_name=table_name,
            record_id=str(record_id),
            old_data=old_data,
            new_data={},
            action_type="DELETE",
            changed_by=changed_by,
            changed_at=datetime.utcnow()
        )

        self.db.add(log)
        self.db.flush()
