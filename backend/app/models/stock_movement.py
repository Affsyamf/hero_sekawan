from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base

class Stock_Movement(Base):
    __tablename__ = 'stock_movements'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=False)

    details = relationship("Stock_Movement_Detail", back_populates="stock_movement")

class Stock_Movement_Detail(Base):
    __tablename__ = 'stock_movement_details'
    
    id = Column(Integer, primary_key=True)
    quantity = Column(Numeric(18, 2), nullable=False)

    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    product = relationship("Product", back_populates="stock_movement_details")

    stock_movement_id = Column(Integer, ForeignKey('stock_movements.id'), nullable=False)
    stock_movement = relationship("Stock_Movement", back_populates="details")