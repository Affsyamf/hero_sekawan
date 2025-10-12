from sqlalchemy import Column, Integer, Float, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship

from app.models import Base

class ProductAvgCostCache(Base):
    __tablename__ = "product_avg_cost_cache"

    avg_cost = Column(Float, nullable=True)
    total_qty_in = Column(Float, nullable=True)
    total_value_in = Column(Float, nullable=True)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    product_id = Column(Integer, ForeignKey("products.id"), primary_key=True)
    product = relationship("Product", back_populates="avg_cost_cache")

    