import uuid
from sqlalchemy import String, Column, JSON, UUID, BigInteger, DateTime, Integer, Text, func

from app.models import Base

class TempImport(Base):
    __tablename__ = "temp_import"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(UUID(as_uuid=True), nullable=False, default=uuid.uuid4)
    sheet_name = Column(String)
    table_target = Column(String)
    row_number = Column(Integer)
    raw_data = Column(JSON)
    parsed_data = Column(JSON)
    status = Column(String, default="pending")
    reason = Column(Text, nullable=True)
    # created_by = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())