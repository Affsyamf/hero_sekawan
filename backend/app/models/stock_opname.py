from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base

class StockOpname(Base):
    __tablename__ = 'stock_opnames'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=False)

    details = relationship("StockOpnameDetail", back_populates="stock_opname", lazy='subquery')
    
class StockOpnameDetail(Base):
    __tablename__ = 'stock_opname_details'
    
    id = Column(Integer, primary_key=True)
    system_quantity = Column(Numeric(18, 2), nullable=False)
    physical_quantity = Column(Numeric(18, 2), nullable=False)
    difference = Column(
        Numeric(18, 2),
        Computed("system_quantity - physical_quantity")
    )

    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    product = relationship("Product", back_populates="stock_opname_details", lazy='subquery')

    stock_opname_id = Column(Integer, ForeignKey('stock_opnames.id'), nullable=False)
    stock_opname = relationship("StockOpname", back_populates="details", lazy='subquery')