from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class BaseReportFilter(BaseModel):
    start_date: Optional[datetime] = Field(None, description="Filter from date (inclusive)")
    end_date: Optional[datetime] = Field(None, description="Filter to date (inclusive)")
    
class PurchasingReportFilter(BaseReportFilter):
    granularity: Optional[str] = Field(
        "monthly",
        description="Data aggregation level: daily, weekly, monthly, yearly"
    )

class ColorKitchenReportFilter(BaseReportFilter):
    granularity: Optional[str] = Field(
        "monthly",
        description="Data aggregation level: daily, weekly, monthly, yearly"
    )