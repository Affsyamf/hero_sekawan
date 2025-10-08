# backend/api/dashboard/dashboard_router.py
from typing import Optional
from fastapi import APIRouter, Query

from api.dashboard.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
def get_dashboard_data(
    period: str = Query(
        "1 Bulan",
        description="Period for stock flow chart: '1 Bulan', '3 Bulan', or '6 Bulan'"
    ),
    month: Optional[int] = Query(
        None,
        ge=1,
        le=12,
        description="Month (1-12) for filtering data, defaults to current month"
    ),
    year: Optional[int] = Query(
        None,
        ge=2000,
        le=2100,
        description="Year for filtering data, defaults to current year"
    )
):
    """
    Main Dashboard Endpoint - Returns ALL data needed for Dashboard page
    
    Returns:
    - metrics: 4 stat cards (stock_masuk, stock_keluar, cost_produksi, selisih_opname)
    - stock_flow: Bar chart data (monthly stock in vs out)
    - stock_location: Donut chart data (stock per product)
    - top_products: Fast moving products list
    - design_cost: Design production cost data
    - recent_transactions: Recent transactions table data
    
    Query Parameters:
    - period: '1 Bulan', '3 Bulan', or '6 Bulan' (for stock flow chart)
    - month: 1-12 (optional, defaults to current month)
    - year: e.g. 2024, 2025 (optional, defaults to current year)
    
    Examples:
    - GET /dashboard
    - GET /dashboard?period=3 Bulan
    - GET /dashboard?month=10&year=2024
    - GET /dashboard?period=6 Bulan&month=12&year=2024
    """
    service = DashboardService()
    return service.get_dashboard_data(period, month, year)


@router.get("/transactions")
def get_transactions_paginated(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: str = Query("", description="Search query"),
    date_start: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_end: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    sort_by: Optional[str] = Query(None, description="Column to sort by"),
    sort_dir: str = Query("desc", description="Sort direction (asc/desc)")
):
    """
    Get Transactions with Pagination, Search, Filter, Sort
    
    This endpoint supports full Table component functionality:
    - Pagination (page, page_size)
    - Search (by ref_code, product_name, location)
    - Date range filter (date_start, date_end)
    - Sorting (sort_by, sort_dir)
    
    Query Parameters:
    - page: Page number (default: 1)
    - page_size: Items per page (default: 10, max: 100)
    - search: Search text (searches in ref, product, location)
    - date_start: Filter start date in YYYY-MM-DD format
    - date_end: Filter end date in YYYY-MM-DD format
    - sort_by: Column name to sort (date, type, ref, product, qty, location)
    - sort_dir: Sort direction (asc or desc, default: desc)
    
    Response:
    - rows: Array of transaction objects
    - total: Total number of records
    - page: Current page number
    - page_size: Items per page
    - total_pages: Total number of pages
    
    Examples:
    - GET /dashboard/transactions?page=1&page_size=10
    - GET /dashboard/transactions?search=Pigment&page=1
    - GET /dashboard/transactions?date_start=2024-01-01&date_end=2024-12-31
    - GET /dashboard/transactions?sort_by=date&sort_dir=desc
    """
    service = DashboardService()
    return service.get_transactions_paginated(
        page=page,
        page_size=page_size,
        search=search,
        date_start=date_start,
        date_end=date_end,
        sort_by=sort_by,
        sort_dir=sort_dir
    )