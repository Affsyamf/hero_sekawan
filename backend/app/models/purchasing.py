from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base

class Purchasing(Base):
    __tablename__ = 'purchasings'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=True) # No Bukti
    purchase_order = Column(String, nullable=True) # PO Number

    supplier_id = Column(Integer, ForeignKey('suppliers.id'), nullable=False)
    supplier = relationship("Supplier", back_populates="purchasings")

    # purchase_order_id = Column(Intege) # Future relation to PurchaseOrder if needed

    details = relationship("Purchasing_Detail", back_populates="purchasing")

class Purchasing_Detail(Base):
    __tablename__ = 'purchasing_details'
    
    id = Column(Integer, primary_key=True)
    quantity = Column(Numeric(18, 2), nullable=False)
    price = Column(Numeric(18, 2), nullable=False)
    discount = Column(Numeric(18, 2), default=0.0)
    ppn = Column(Numeric(18, 2), default=0.0)
    pph = Column(Numeric(18, 2), default=0.0)
    dpp = Column(Numeric(18, 2), default=0.0)
    tax_no = Column(String, nullable=True) # No Faktur Pajak
    exchange_rate = Column(Numeric(18, 2), default=0.0)

    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    product = relationship("Product", back_populates="purchasing_details")

    purchasing_id = Column(Integer, ForeignKey('purchasings.id'), nullable=False)
    purchasing = relationship("Purchasing", back_populates="details")