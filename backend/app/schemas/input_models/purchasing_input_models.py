from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


# ===============================
# 1️⃣ Purchasing
# ===============================
class PurchasingCreate(BaseModel):
    date: Optional[datetime] = None
    code: Optional[str] = None           # No Bukti
    purchase_order: Optional[str] = None # PO Number
    supplier_id: int                     # Required (ForeignKey to Supplier)


class PurchasingUpdate(BaseModel):
    date: Optional[datetime] = None
    code: Optional[str] = None
    purchase_order: Optional[str] = None
    supplier_id: Optional[int] = None


# ===============================
# 2️⃣ PurchasingDetail
# ===============================
class PurchasingDetailCreate(BaseModel):
    quantity: Decimal
    price: Decimal
    discount: Optional[Decimal] = Decimal("0.00")
    ppn: Optional[Decimal] = Decimal("0.00")
    pph: Optional[Decimal] = Decimal("0.00")
    dpp: Optional[Decimal] = Decimal("0.00")
    tax_no: Optional[str] = None
    exchange_rate: Optional[Decimal] = Decimal("0.00")
    product_id: int
    purchasing_id: int


class PurchasingDetailUpdate(BaseModel):
    quantity: Optional[Decimal] = None
    price: Optional[Decimal] = None
    discount: Optional[Decimal] = None
    ppn: Optional[Decimal] = None
    pph: Optional[Decimal] = None
    dpp: Optional[Decimal] = None
    tax_no: Optional[str] = None
    exchange_rate: Optional[Decimal] = None
    product_id: Optional[int] = None
    purchasing_id: Optional[int] = None
