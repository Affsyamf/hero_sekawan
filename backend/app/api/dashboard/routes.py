from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional

from app.services.dashboard.dashboard_service import DashboardService
from app.utils.response import APIResponse

dashboard_router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@dashboard_router.get("/")
def get_dashboard_data(
    period: str = Query("1 Bulan", description="Period filter: 1 Bulan, 3 Bulan, 6 Bulan"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Month (1-12)"),
    year: Optional[int] = Query(None, ge=2000, description="Year"),
    service: DashboardService = Depends()
):
    """
    Get all dashboard data in single request including:
    - Metrics (4 stat cards: stock masuk, stock keluar, cost produksi, selisih opname)
    - Stock flow chart data (bar chart - monthly)
    - Stock location distribution (donut chart - per product)
    - Top fast moving products (horizontal bar chart)
    - Design cost data (bar chart - cost per design)
    - Recent transactions (table - last 10 transactions)
    
    Example response:
    {
        "metrics": {
            "stock_masuk": { "value": 1000, "trend": 15.5 },
            "stock_keluar": { "value": 800, "trend": -5.2 },
            "cost_produksi": { "value": 50000000, "trend": 10.0 },
            "selisih_opname": { "value": 20, "trend": -2.5 }
        },
        "stock_flow": [
            { "label": "Jan", "stockMasuk": 1000, "stockKeluar": 800 },
            ...
        ],
        "stock_location": [
            { "label": "Product A", "value": 35.5 },
            ...
        ],
        "top_products": [
            { "label": "Product X", "value": 100, "maxValue": 100 },
            ...
        ],
        "design_cost": [
            { "design": "D001", "cost": 5000000, "orders": 10 },
            ...
        ],
        "recent_transactions": {
            "rows": [
                { "id": 1, "date": "2024-10-08", "type": "Purchasing", "ref": "PO-001", "product": "Product A", "qty": 100, "location": "Warehouse" },
                ...
            ],
            "total": 10
        }
    }
    """
    try:
        return service.get_dashboard_data(period=period, month=month, year=year)
    except HTTPException as e:
        return APIResponse(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to fetch dashboard data", error_detail=str(e))

@dashboard_router.get("/transactions")
def get_transactions_paginated(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: str = Query("", description="Search term"),
    date_start: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_end: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    sort_by: Optional[str] = Query(None, description="Column to sort by: date, type, ref, product, location"),
    sort_dir: str = Query("desc", description="Sort direction: asc or desc"),
    service: DashboardService = Depends()
):
    """
    Get paginated transactions with advanced filtering (Optional endpoint)
    Use this if you need a separate detailed transactions page with full table features
    
    If you only need basic transactions list, use the main /dashboard/ endpoint instead
    """
    try:
        return service.get_transactions_paginated(
            page=page,
            page_size=page_size,
            search=search,
            date_start=date_start,
            date_end=date_end,
            sort_by=sort_by,
            sort_dir=sort_dir
        )
    except HTTPException as e:
        return APIResponse(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to fetch transactions", error_detail=str(e))