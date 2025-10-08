from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base

class Supplier(Base):
    __tablename__ = 'suppliers'
    
    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=False)
    contact_info = Column(Text, nullable=True)

    purchasings = relationship("Purchasing", back_populates="supplier")

class Product(Base):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=True, unique=True)
    name = Column(String, nullable=False, unique=True)
    unit = Column(String, nullable=True)

    account_id = Column(Integer, ForeignKey('accounts.id'))
    account = relationship("Account", back_populates="products")

    purchasing_details = relationship("Purchasing_Detail", back_populates="product")
    stock_movement_details = relationship("Stock_Movement_Detail", back_populates="product")
    color_kitchen_entry_details = relationship("Color_Kitchen_Entry_Detail", back_populates="product")
    ledger_entries = relationship("Ledger", back_populates="product")
    stock_opname_details = relationship("Stock_Opname_Detail", back_populates="product")
    avg_cost_cache = relationship("ProductAvgCostCache", uselist=False, back_populates="product")

class Design(Base):
    __tablename__ = 'designs'
    
    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False, unique=True)
    
    type_id = Column(Integer, ForeignKey("design_types.id"), nullable=False)
    type = relationship("Design_Type", back_populates="designs")

    color_kitchen_entries = relationship("Color_Kitchen_Entry", back_populates="design")
