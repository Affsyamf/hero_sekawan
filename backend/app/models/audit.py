from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed, BigInteger, CheckConstraint, JSON, TIMESTAMP, func
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base

class AuditColumnLog(Base):
    __tablename__ = "audit_column_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    table_name = Column(Text, nullable=False)
    record_id = Column(Text, nullable=False)
    old_data = Column(JSON, nullable=True)
    new_data = Column(JSON, nullable=True)
    action_type = Column(
        Text,
        CheckConstraint("action_type IN ('UPDATE', 'DELETE')"),
        nullable=False
    )
    changed_by = Column(Text, nullable=True)
    changed_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
