from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.enum.account_enum import AccountType

class BaseReportFilter(BaseModel):
    start_date: Optional[datetime] = Field(None, description="Filter from date (inclusive)")
    end_date: Optional[datetime] = Field(None, description="Filter to date (inclusive)")
    account_type: Optional[AccountType] = Field(None, description="Filter by account type (goods/service)") # None means ALL
    
    
class PurchasingReportFilter(BaseReportFilter):
    granularity: Optional[str] = Field(
        "monthly",
        description="Data aggregation level: daily, weekly, monthly, yearly"
    )