from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel
from app.models.enum.ledger_enum import LedgerRef, LedgerLocation


# ===============================
#  Ledger
# ===============================
class LedgerCreate(BaseModel):
    date: Optional[datetime] = None
    ref: LedgerRef
    ref_code: str
    location: LedgerLocation
    quantity_in: Optional[Decimal] = Decimal("0.00")
    quantity_out: Optional[Decimal] = Decimal("0.00")
    product_id: int


class LedgerUpdate(BaseModel):
    date: Optional[datetime] = None
    ref: Optional[LedgerRef] = None
    ref_code: Optional[str] = None
    location: Optional[LedgerLocation] = None
    quantity_in: Optional[Decimal] = None
    quantity_out: Optional[Decimal] = None
    product_id: Optional[int] = None
