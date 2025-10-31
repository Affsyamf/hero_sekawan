from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

class BaseReportFilter(BaseModel):
    start_date: Optional[datetime] = Field(None, description="Filter from date (inclusive)")
    end_date: Optional[datetime] = Field(None, description="Filter to date (inclusive)")
    
class PurchasingReportFilter(BaseReportFilter):
    granularity: Optional[str] = Field(
        "monthly",
        description="Data aggregation level: daily, weekly, monthly, yearly"
    )
    category: Optional[Literal["chemical", "sparepart", "both"]] = Field(
        None,
        description=(
            "Filter purchasing by category. "
            "'chemical' = only chemicals, "
            "'sparepart' = only spareparts, "
            "'both' = chemical + sparepart, "
            "None = all"
        ),
    )

class ColorKitchenReportFilter(BaseReportFilter):
    granularity: Optional[str] = Field(
        "monthly",
        description="Data aggregation level: daily, weekly, monthly, yearly"
    )