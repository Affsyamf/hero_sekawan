from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base

class Color_Kitchen_Batch(Base):
    __tablename__ = "color_kitchen_batches"

    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=False)  # Generated group code
    
    entries = relationship("Color_Kitchen_Entry", back_populates="batch")
    details = relationship("Color_Kitchen_Batch_Detail", back_populates="batch")


class Color_Kitchen_Batch_Detail(Base):
    __tablename__ = "color_kitchen_batch_details"

    id = Column(Integer, primary_key=True)
    quantity = Column(Numeric(18, 4), nullable=False)

    unit_cost_used = Column(Numeric(18, 2), nullable=False)
    total_cost = Column(
        Numeric(18, 2),
        Computed("quantity * unit_cost_used")
    )

    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    product = relationship("Product")

    batch_id = Column(Integer, ForeignKey("color_kitchen_batches.id"), nullable=False)
    batch = relationship("Color_Kitchen_Batch", back_populates="details")
    
class Color_Kitchen_Entry(Base):
    __tablename__ = "color_kitchen_entries"

    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=False)  # OPJ
    rolls = Column(Integer)
    paste_quantity = Column(Numeric(18, 2), nullable=False)

    design_id = Column(Integer, ForeignKey("designs.id"), nullable=False)
    design = relationship("Design", back_populates="color_kitchen_entries")

    # link to batch (shared dyestuff)
    batch_id = Column(Integer, ForeignKey("color_kitchen_batches.id"))
    batch = relationship("Color_Kitchen_Batch", back_populates="entries")

    # auxiliaries (per OPJ)
    details = relationship("Color_Kitchen_Entry_Detail", back_populates="color_kitchen_entry")

class Color_Kitchen_Entry_Detail(Base):
    __tablename__ = 'color_kitchen_entry_details'
    
    id = Column(Integer, primary_key=True)
    quantity = Column(Numeric(18, 4), nullable=False)

    unit_cost_used = Column(Numeric(18, 2), nullable=False)
    total_cost = Column(
        Numeric(18, 2),
        Computed("quantity * unit_cost_used")
    )

    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    product = relationship("Product", back_populates="color_kitchen_entry_details")

    color_kitchen_entry_id = Column(Integer, ForeignKey('color_kitchen_entries.id'), nullable=False)
    color_kitchen_entry = relationship("Color_Kitchen_Entry", back_populates="details")