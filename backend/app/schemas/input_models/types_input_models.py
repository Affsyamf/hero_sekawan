from typing import Optional
from decimal import Decimal
from pydantic import BaseModel


# ===============================
# 1️⃣ Account
# ===============================
class AccountCreate(BaseModel):
    name: str
    parent_id: int
    # account_type: AccountType


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: int

class AccountParentCreate(BaseModel):
    name: str
    account_no: Decimal
    name: Optional[str] = None
    account_type: Optional[str] = None
    accounts: Optional[list[int]] = None

class AccountParentUpdate(BaseModel):
    name: Optional[str] = None
    account_no: Optional[Decimal] = None
    name: Optional[str] = None
    account_type: Optional[str] = None
    accounts: Optional[list[int]] = None


# ===============================
# 2️⃣ DesignType
# ===============================
class DesignTypeCreate(BaseModel):
    name: str


class DesignTypeUpdate(BaseModel):
    name: Optional[str] = None
