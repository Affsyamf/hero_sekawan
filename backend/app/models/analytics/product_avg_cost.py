from sqlalchemy import Column, Integer, Float
from app.models import Base

class ProductAvgCost(Base):
    __tablename__ = "product_avg_cost"
    __table_args__ = {"info": {"is_view": True}}

    product_id = Column(Integer, primary_key=True)
    stock_qty = Column(Float)
    stock_value = Column(Float)
    avg_cost = Column(Float)