from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base

class StockMovement(Base):
    __tablename__ = 'stock_movements'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=False)

    details = relationship("StockMovementDetail", back_populates="stock_movement", lazy='subquery')

class StockMovementDetail(Base):
    __tablename__ = 'stock_movement_details'
    
    id = Column(Integer, primary_key=True)
    quantity = Column(Numeric(18, 2), nullable=False)

    unit_cost_used = Column(Numeric(18, 2), nullable=False)
    total_cost = Column(
        Numeric(18, 2),
        Computed("quantity * unit_cost_used")
    )

    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    product = relationship("Product", back_populates="stock_movement_details", lazy='subquery')

    stock_movement_id = Column(Integer, ForeignKey('stock_movements.id'), nullable=False)
    stock_movement = relationship("StockMovement", back_populates="details", lazy='subquery')