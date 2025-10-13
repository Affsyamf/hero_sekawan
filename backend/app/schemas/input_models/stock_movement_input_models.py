from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


# ===============================
# 1️⃣ StockMovement
# ===============================
class StockMovementCreate(BaseModel):
    date: Optional[datetime] = None
    code: str


class StockMovementUpdate(BaseModel):
    date: Optional[datetime] = None
    code: Optional[str] = None


# ===============================
# 2️⃣ StockMovementDetail
# ===============================
class StockMovementDetailCreate(BaseModel):
    quantity: Decimal
    product_id: int
    stock_movement_id: int


class StockMovementDetailUpdate(BaseModel):
    quantity: Optional[Decimal] = None
    product_id: Optional[int] = None
    stock_movement_id: Optional[int] = None
