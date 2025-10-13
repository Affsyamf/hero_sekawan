# backend/app/api/dashboard/routes.py
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.services.dashboard.overview_service import DashboardService
from app.utils.response import APIResponse

dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@dashboard_router.get("")
def get_dashboard(
    period: str = Query("1 Bulan", description="Period: 1 Bulan, 3 Bulan, 6 Bulan"),
    service: DashboardService = Depends()
):
    """
    Get all dashboard data including metrics, charts, and summaries
    
    - **period**: Time period for data ("1 Bulan", "3 Bulan", "6 Bulan")
    """
    try:
        return service.get_dashboard_data(period)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to get dashboard data", error_detail=str(e))


@dashboard_router.get("/transactions")
def get_transactions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    ref_type: Optional[str] = Query(None, description="Filter by reference type"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    service: DashboardService = Depends()
):
    """
    Get transaction history with pagination and filters
    
    - **page**: Page number (starts from 1)
    - **page_size**: Number of items per page
    - **product_id**: Filter by specific product
    - **ref_type**: Filter by transaction type (purchasing, stock_movement, ck, stock_opname)
    - **start_date**: Filter transactions from this date
    - **end_date**: Filter transactions until this date
    """
    try:
        return service.get_transactions(
            page=page,
            page_size=page_size,
            product_id=product_id,
            ref_type=ref_type,
            start_date=start_date,
            end_date=end_date
        )
    except Exception as e:
        return APIResponse.internal_error(message="Failed to get transactions", error_detail=str(e))


@dashboard_router.get("/transactions/export")
def export_transactions(
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    ref_type: Optional[str] = Query(None, description="Filter by reference type"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    service: DashboardService = Depends()
):
    """
    Export transaction history to CSV file
    
    - **product_id**: Filter by specific product
    - **ref_type**: Filter by transaction type (purchasing, stock_movement, ck, stock_opname)
    - **start_date**: Filter transactions from this date
    - **end_date**: Filter transactions until this date
    """
    try:
        return service.export_transactions_csv(
            product_id=product_id,
            ref_type=ref_type,
            start_date=start_date,
            end_date=end_date
        )
    except Exception as e:
        return APIResponse.internal_error(message="Failed to export transactions", error_detail=str(e))