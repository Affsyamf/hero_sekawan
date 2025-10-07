from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base
from app.models.enum.ledger_enum import LedgerRef, LedgerLocation
from app.models.enum.registry import enum_column

class Ledger(Base):
    __tablename__ = 'ledgers'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    ref = Column(enum_column(LedgerRef), nullable=False)
    ref_code = Column(String, nullable=False)
    location = Column(enum_column(LedgerLocation), nullable=False)
    quantity_in = Column(Numeric(18, 2), default=0.0)
    quantity_out = Column(Numeric(18, 2), default=0.0)

    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    product = relationship("Product", back_populates="ledger_entries")