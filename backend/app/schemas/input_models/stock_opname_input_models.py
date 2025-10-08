from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


# ===============================
# 1️⃣ StockOpname
# ===============================
class StockOpnameCreate(BaseModel):
    date: Optional[datetime] = None
    code: str


class StockOpnameUpdate(BaseModel):
    date: Optional[datetime] = None
    code: Optional[str] = None


# ===============================
# 2️⃣ StockOpnameDetail
# ===============================
class StockOpnameDetailCreate(BaseModel):
    system_quantity: Decimal
    physical_quantity: Decimal
    product_id: int
    stock_opname_id: int


class StockOpnameDetailUpdate(BaseModel):
    system_quantity: Optional[Decimal] = None
    physical_quantity: Optional[Decimal] = None
    product_id: Optional[int] = None
    stock_opname_id: Optional[int] = None
