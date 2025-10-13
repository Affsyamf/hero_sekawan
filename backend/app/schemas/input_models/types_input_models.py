from typing import Optional
from decimal import Decimal
from pydantic import BaseModel
from app.models.enum.account_enum import AccountType


# ===============================
# 1️⃣ Account
# ===============================
class AccountCreate(BaseModel):
    name: str
    account_no: Decimal
    account_type: AccountType
    alias: Optional[str] = None


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_no: Optional[Decimal] = None
    account_type: Optional[AccountType] = None
    alias: Optional[str] = None


# ===============================
# 2️⃣ DesignType
# ===============================
class DesignTypeCreate(BaseModel):
    name: str


class DesignTypeUpdate(BaseModel):
    name: Optional[str] = None
